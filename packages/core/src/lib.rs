use std::{collections::HashMap, convert::Infallible, net::SocketAddr, sync::Arc};

use dashmap::DashMap;
use once_cell::sync::Lazy;

use http_body_util::{BodyExt, Full};
use hyper::{
    Request, Response,
    body::{Bytes, Incoming},
    server::conn::http1,
    service::service_fn,
};
use hyper_util::rt::TokioIo;
use tokio::{
    net::TcpListener,
    sync::{
        mpsc::{self, UnboundedSender},
        oneshot,
    },
};

use napi::{
    Env, JsValue, Unknown,
    bindgen_prelude::{External, Function, Object, ToNapiValue},
    sys,
    threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode},
};

#[macro_use]
extern crate napi_derive;

type RouteHandler = ThreadsafeFunction<ContextObject, (), ContextObject, napi::Status, false>;

pub struct CompiledRoute {
    method: Box<str>,
    path: Box<str>,
    segments: Box<[Box<str>]>,
    handler: RouteHandler,
}

static ROUTES: Lazy<DashMap<Box<str>, Vec<CompiledRoute>>> = Lazy::new(DashMap::new);

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
    pub url: String,
    pub headers: HashMap<String, String>,
    pub params: HashMap<String, String>,
    pub query: HashMap<String, Vec<String>>,
    pub body: Vec<u8>,
    pub pathname: String,
    pub search: Option<String>,
}

impl RequestData {
    pub async fn new(
        req: Request<hyper::body::Incoming>,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        let method = req.method().as_str().to_owned();
        let uri = req.uri();
        let url = uri.to_string();
        let pathname = uri.path().to_owned();
        let search = uri.query().map(|q| format!("?{q}"));

        let mut headers = HashMap::with_capacity(req.headers().len());
        for (name, value) in req.headers() {
            if let Ok(v) = value.to_str() {
                headers.insert(name.as_str().to_owned(), v.to_owned());
            }
        }

        let mut query: HashMap<String, Vec<String>> = HashMap::new();
        if let Some(q) = uri.query() {
            for pair in q.split('&') {
                if let Some((key, value)) = pair.split_once('=') {
                    let decoded_key = urlencoding::decode(key).unwrap_or_default().into_owned();
                    let decoded_value = urlencoding::decode(value).unwrap_or_default().into_owned();
                    query.entry(decoded_key).or_insert_with(Vec::new).push(decoded_value);
                }
            }
        }

        let body_bytes = req.into_body().collect().await?.to_bytes().to_vec();

        Ok(Self {
            method,
            url,
            headers,
            params: HashMap::new(),
            query,
            body: body_bytes,
            pathname,
            search,
        })
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

pub enum ResponseCommand {
    SetStatus(u16),
    SetHeader(String, String),
    SetHeaders(HashMap<String, String>),
    SetCookie(String, String, CookieOptionsCore),
    SetBody(Bytes),
    SetRedirect(String, u16),
    End,
}

pub struct ResponseBuilderCore {
    tx: UnboundedSender<ResponseCommand>,
}

impl ResponseBuilderCore {
    pub fn new(tx: UnboundedSender<ResponseCommand>) -> Self {
        Self { tx }
    }

    pub fn send_command(&self, cmd: ResponseCommand) {
        let _ = self.tx.send(cmd);
    }
}

pub struct ContextObject {
    pub req: RequestData,
    pub res: External<Arc<ResponseBuilderCore>>,
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
pub fn set_status_response(builder: &External<Arc<ResponseBuilderCore>>, status: u16) {
    builder.send_command(ResponseCommand::SetStatus(status));
}

#[napi]
pub fn set_header_response(
    builder: &External<Arc<ResponseBuilderCore>>,
    name: String,
    value: String,
) {
    builder.send_command(ResponseCommand::SetHeader(name, value));
}

#[napi]
pub fn set_headers_response(
    builder: &External<Arc<ResponseBuilderCore>>,
    headers: HashMap<String, String>,
) {
    builder.send_command(ResponseCommand::SetHeaders(headers));
}

#[napi]
pub fn set_cookie_response(
    builder: &External<Arc<ResponseBuilderCore>>,
    name: String,
    value: String,
    options: Option<CookieOptionsCore>,
) {
    builder.send_command(ResponseCommand::SetCookie(name, value, options.unwrap_or_default()));
}

#[napi]
pub fn set_text_response(builder: &External<Arc<ResponseBuilderCore>>, data: String) {
    builder.send_command(ResponseCommand::SetBody(Bytes::from(data)));
}

#[napi]
pub fn set_html_response(builder: &External<Arc<ResponseBuilderCore>>, data: String) {
    builder.send_command(ResponseCommand::SetBody(Bytes::from(data)));
}

#[napi]
pub fn set_json_response(builder: &External<Arc<ResponseBuilderCore>>, data: Unknown<'_>) {
    let json_str = data.coerce_to_string().unwrap();
    let json_bytes = json_str.into_utf8().unwrap().into_owned().unwrap();
    builder.send_command(ResponseCommand::SetBody(Bytes::from(json_bytes)));
}

#[napi]
pub fn set_send_response(builder: &External<Arc<ResponseBuilderCore>>, data: Unknown<'_>) {
    let val = data.coerce_to_string().unwrap();
    let val_bytes = val.into_utf8().unwrap().into_owned().unwrap();
    builder.send_command(ResponseCommand::SetBody(Bytes::from(val_bytes)));
}

#[napi]
pub fn set_redirect_response(
    builder: &External<Arc<ResponseBuilderCore>>,
    url: String,
    code: Option<u16>,
) {
    builder.send_command(ResponseCommand::SetRedirect(url, code.unwrap_or(302)));
}

#[napi]
pub fn end_response(builder: &External<Arc<ResponseBuilderCore>>) {
    builder.send_command(ResponseCommand::End);
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
        let method_key: Box<str> = route.method.clone().into_boxed_str();
        let segments: Vec<Box<str>> = route
            .path
            .split('/')
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string().into_boxed_str())
            .collect();

        let tsfn = route.handler.build_threadsafe_function().build()?;
        let compiled = CompiledRoute {
            method: method_key.clone(),
            path: route.path.clone().into_boxed_str(),
            segments: segments.into_boxed_slice(),
            handler: tsfn,
        };

        ROUTES.entry(method_key).or_default().push(compiled);
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
    let method = req.method().as_str();
    let pathname = req.uri().path().trim_matches('/');
    let segments_req: Vec<&str> =
        if pathname.is_empty() { vec![] } else { pathname.split('/').collect() };

    if let Some(routes_vec) = ROUTES.get(method) {
        'outer: for route in routes_vec.iter() {
            if route.segments.len() != segments_req.len() {
                continue;
            }

            let mut params = HashMap::with_capacity(segments_req.len());
            for (rseg, sseg) in route.segments.iter().zip(&segments_req) {
                if let Some(param_name) = rseg.strip_prefix(':') {
                    params.insert(param_name.to_string(), (*sseg).to_string());
                } else if rseg.as_ref() != *sseg {
                    continue 'outer;
                }
            }

            let req_data = match RequestData::new(req).await {
                Ok(mut data) => {
                    data.params = params;
                    data
                }
                Err(e) => {
                    eprintln!("Error reading request body: {e}");
                    return Ok(Response::builder()
                        .status(400)
                        .body(Full::new(Bytes::from_static(b"Bad Request")))
                        .unwrap());
                }
            };

            let (tx, mut rx) = mpsc::unbounded_channel();
            let (response_tx, response_rx) = oneshot::channel();

            let res_builder = Arc::new(ResponseBuilderCore::new(tx));
            let res_external = External::new(res_builder);
            let ctx_obj = ContextObject { req: req_data, res: res_external };

            let _ = route.handler.call(ctx_obj, ThreadsafeFunctionCallMode::NonBlocking);

            tokio::spawn(async move {
                let mut status = 200u16;
                let mut headers = HashMap::with_capacity(8);
                let mut body: Option<Bytes> = None;
                let mut _cookies: HashMap<String, (String, CookieOptionsCore)> =
                    HashMap::with_capacity(4);

                while let Some(cmd) = rx.recv().await {
                    match cmd {
                        ResponseCommand::SetStatus(s) => status = s,
                        ResponseCommand::SetHeader(name, value) => {
                            headers.insert(name, value);
                        }
                        ResponseCommand::SetHeaders(h) => {
                            headers.reserve(h.len());
                            headers.extend(h);
                        }
                        ResponseCommand::SetCookie(name, value, options) => {
                            _cookies.insert(name, (value, options));
                        }
                        ResponseCommand::SetBody(b) => body = Some(b),
                        ResponseCommand::SetRedirect(url, code) => {
                            status = code;
                            headers.insert("Location".into(), url);
                        }
                        ResponseCommand::End => {
                            let mut response = Response::builder().status(status);
                            for (name, value) in &headers {
                                response = response.header(name, value);
                            }
                            let body_bytes = body.unwrap_or_else(|| Bytes::new());
                            let response = response.body(Full::new(body_bytes)).unwrap();
                            let _ = response_tx.send(response);
                            break;
                        }
                    }
                }
            });

            if let Ok(response) = response_rx.await {
                return Ok(response);
            }

            return Ok(Response::builder().status(200).body(Full::new(Bytes::new())).unwrap());
        }
    }

    Ok(Response::builder().status(404).body(Full::new(Bytes::from_static(b"Not Found"))).unwrap())
}
