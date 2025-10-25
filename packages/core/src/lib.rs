use std::{collections::HashMap, convert::Infallible, net::SocketAddr, sync::Arc};

use dashmap::DashMap;
use futures::lock::Mutex;
use once_cell::sync::Lazy;

use http_body_util::{BodyExt, Full};
use hyper::{
    Request, Response,
    body::{Bytes, Incoming},
    server::conn::http1,
    service::service_fn,
};
use hyper_util::rt::TokioIo;
use tokio::{net::TcpListener, sync::oneshot};

use napi::{
    Env, JsValue, Unknown,
    bindgen_prelude::{External, Function, Object, ToNapiValue},
    sys,
    threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode},
};

#[macro_use]
extern crate napi_derive;

type RouteHandler = ThreadsafeFunction<ContextObject, (), ContextObject, napi::Status, false>;

static ROUTES: Lazy<DashMap<String, RouteHandler>> = Lazy::new(DashMap::new);

#[napi]
pub struct ServerCore {
    config: ServerOptionsCore,
}

#[derive(Clone)]
#[napi(object)]
pub struct ServerOptionsCore {
    pub port: u16,
    pub host: String,
    pub trust_proxy: Option<bool>,
    pub max_request_size: Option<u32>,
    pub timeout: Option<u32>,
}

#[napi(object)]
pub struct Route {
    pub path: String,

    #[napi(ts_type = "'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE'")]
    pub method: String,

    #[napi(ts_type = "RouteHandler")]
    pub handler: Function<'static, ContextObject, ()>,
}

#[derive(Clone)]
#[napi(object)]
pub struct RequestData {
    pub method: String,
    pub path: String,
    pub body: Vec<u8>,
}

impl RequestData {
    pub async fn new(
        req: Request<hyper::body::Incoming>,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        let method = req.method().to_string();
        let path = req.uri().to_string();
        let body_bytes = req.into_body().collect().await?.to_bytes().to_vec();

        Ok(Self { method, path, body: body_bytes })
    }
}

#[derive(Clone, Default)]
#[napi(object)]
pub struct CookieOptionsCore {
    pub domain: String,
    pub http_only: Option<bool>,
    pub max_age: Option<u32>,
    pub path: Option<String>,
    pub secure: Option<bool>,
    pub signed: Option<bool>,
}

pub struct ResponseBuilderCore {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: Option<Vec<u8>>,
    pub cookies: HashMap<String, (String, CookieOptionsCore)>,
    pub end: bool,
    pub sender: Option<oneshot::Sender<Response<Full<Bytes>>>>,
}

impl ResponseBuilderCore {
    pub fn new() -> Self {
        Self {
            status: 0,
            headers: HashMap::new(),
            body: None,
            cookies: HashMap::new(),
            end: false,
            sender: None,
        }
    }
}

impl Default for ResponseBuilderCore {
    fn default() -> Self {
        Self::new()
    }
}

pub struct ContextObject {
    pub req: RequestData,
    pub res: External<Arc<Mutex<ResponseBuilderCore>>>,
}

impl ToNapiValue for ContextObject {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> napi::Result<sys::napi_value> {
        let mut obj = Object::new(&Env::from_raw(env))?;
        obj.set("req", val.req)?;
        obj.set("res", val.res)?;

        unsafe { Object::to_napi_value(env, obj) }
    }
}

#[napi]
pub async fn set_status_response(builder: &External<Arc<Mutex<ResponseBuilderCore>>>, status: u16) {
    let mut builder = builder.lock().await;
    builder.status = status;
}

#[napi]
pub async fn set_header_response(
    builder: &External<Arc<Mutex<ResponseBuilderCore>>>,
    name: String,
    value: String,
) {
    let mut builder = builder.lock().await;
    builder.headers.insert(name, value);
}

#[napi]
pub async fn set_headers_response(
    builder: &External<Arc<Mutex<ResponseBuilderCore>>>,
    headers: HashMap<String, String>,
) {
    let mut builder = builder.lock().await;
    for (name, value) in headers {
        builder.headers.insert(name, value);
    }
}

#[napi]
pub async fn set_cookie_response(
    builder: &External<Arc<Mutex<ResponseBuilderCore>>>,
    name: String,
    value: String,
    options: Option<CookieOptionsCore>,
) {
    let mut builder = builder.lock().await;
    builder.cookies.insert(name, (value, options.unwrap_or_default()));
}

#[napi]
pub async fn set_text_response(builder: &External<Arc<Mutex<ResponseBuilderCore>>>, data: String) {
    let mut builder = builder.lock().await;
    builder.body = Some(data.into_bytes());
}

#[napi]
pub async fn set_html_response(builder: &External<Arc<Mutex<ResponseBuilderCore>>>, data: String) {
    let mut builder = builder.lock().await;
    builder.body = Some(data.into_bytes());
}

#[napi]
pub fn set_json_response(builder: &External<Arc<Mutex<ResponseBuilderCore>>>, data: Unknown<'_>) {
    let mut builder = futures::executor::block_on(builder.lock());
    let json_str = data.coerce_to_string().unwrap();
    let json_str = json_str.into_utf16().unwrap();
    let json_str = json_str.as_str().unwrap();

    builder.body = Some(json_str.into_bytes());
}

#[napi]
pub fn set_send_response(builder: &External<Arc<Mutex<ResponseBuilderCore>>>, data: Unknown<'_>) {
    let mut builder = futures::executor::block_on(builder.lock());
    let val = data.coerce_to_string().unwrap();
    let val = val.into_utf16().unwrap();
    let val = val.as_str().unwrap();

    builder.body = Some(val.into_bytes());
}

#[napi]
pub async fn set_redirect_response(
    builder: &External<Arc<Mutex<ResponseBuilderCore>>>,
    url: String,
    code: Option<u16>,
) {
    let mut builder = builder.lock().await;
    builder.status = code.unwrap_or(302);
    builder.headers.insert("Location".into(), url);
}

#[napi]
pub async fn end_response(builder: &External<Arc<Mutex<ResponseBuilderCore>>>) {
    let mut builder = builder.lock().await;
    builder.end = true;

    if let Some(sender) = builder.sender.take() {
        let mut response =
            Response::builder().status(if builder.status == 0 { 200 } else { builder.status });

        for (name, value) in &builder.headers {
            response = response.header(name, value);
        }

        let body_bytes = builder.body.clone().unwrap_or_default();
        let response = response.body(Full::new(Bytes::from(body_bytes))).unwrap();

        let _ = sender.send(response);
    }
}

#[napi]
impl ServerCore {
    #[napi(constructor)]
    pub fn new(config: ServerOptionsCore) -> Self {
        ServerCore { config }
    }

    #[napi]
    pub fn get_config(&self) -> ServerOptionsCore {
        self.config.clone()
    }

    #[napi]
    pub fn set_config(&mut self, config: ServerOptionsCore) {
        self.config = config;
    }

    #[napi]
    pub fn add_route(&mut self, route: Route) -> napi::Result<()> {
        let key = format!("{}:{}", route.method, route.path);
        let tsfn = route.handler.build_threadsafe_function().build()?;

        ROUTES.insert(key, tsfn);

        Ok(())
    }

    #[napi]
    pub async fn start(&self) {
        let addr = self.get_addr();
        let listener = TcpListener::bind(addr).await.unwrap();
        println!("Listening on http://{addr}");

        loop {
            let (tcp, _) = listener.accept().await.unwrap();
            let io = TokioIo::new(tcp);

            tokio::task::spawn(async move {
                if let Err(err) =
                    http1::Builder::new().serve_connection(io, service_fn(handle_request)).await
                {
                    println!("Error serving connection: {err:?}");
                }
            });
        }
    }

    fn get_addr(&self) -> SocketAddr {
        let addr_str = format!("{}:{}", self.config.host, self.config.port);
        addr_str.parse().expect("Invalid address")
    }
}

async fn handle_request(req: Request<Incoming>) -> Result<Response<Full<Bytes>>, Infallible> {
    let method = req.method().to_string();
    let path = req.uri().path().to_string();
    let key = format!("{method}:{path}");

    if let Some(handler) = ROUTES.get(&key) {
        let req_data = match RequestData::new(req).await {
            Ok(data) => data,
            Err(e) => {
                eprintln!("Error reading request body: {e}");
                return Ok(Response::builder()
                    .status(400)
                    .body(Full::new(Bytes::from("Bad Request")))
                    .unwrap());
            }
        };

        let (tx, rx) = oneshot::channel();
        let res_builder = Arc::new(Mutex::new(ResponseBuilderCore {
            status: 0,
            headers: HashMap::new(),
            body: None,
            cookies: HashMap::new(),
            end: false,
            sender: Some(tx),
        }));

        let res_external = External::new(res_builder.clone());
        let ctx_obj = ContextObject { req: req_data, res: res_external };

        let _ = handler.call(ctx_obj, ThreadsafeFunctionCallMode::NonBlocking);

        if let Ok(response) = rx.await {
            return Ok(response);
        }

        let builder_ref = res_builder.lock().await;
        let status = if builder_ref.status == 0 { 200 } else { builder_ref.status };
        let mut response = Response::builder().status(status);
        for (name, value) in &builder_ref.headers {
            response = response.header(name, value);
        }

        let body_bytes = builder_ref.body.clone().unwrap_or_default();
        return Ok(response.body(Full::new(Bytes::from(body_bytes))).unwrap());
    }

    Ok(Response::builder().status(404).body(Full::new(Bytes::from("Not Found"))).unwrap())
}
