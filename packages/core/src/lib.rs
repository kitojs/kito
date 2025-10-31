use parking_lot::Mutex;
use std::{
    collections::HashMap, convert::Infallible, net::SocketAddr, path::Path, sync::Arc,
    time::UNIX_EPOCH,
};

use dashmap::DashMap;
use once_cell::sync::Lazy;

use http_body_util::{BodyExt, Full};
use hyper::{
    Request, Response, StatusCode,
    body::{Bytes, Incoming},
    header::{HeaderName, HeaderValue},
    server::conn::http1,
    service::service_fn,
};
use hyper_util::rt::TokioIo;
use tokio::{
    fs::File,
    io::AsyncReadExt,
    net::TcpListener,
    sync::oneshot::{self, Sender},
};

use napi::{
    Env,
    bindgen_prelude::{Buffer, External, Function, Object, ToNapiValue},
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

pub struct RequestCore {
    method: String,
    url: String,
    pathname: String,
    search: Option<String>,
    protocol: String,
    hostname: String,
    original_url: String,
    secure: bool,
    xhr: bool,
    ip: String,
    ips: Vec<String>,

    body: Bytes,
    headers_raw: HashMap<String, String>,
    params: HashMap<String, String>,
    query_raw: HashMap<String, Vec<String>>,
    cookies_raw: HashMap<String, String>,
}

impl RequestCore {
    pub async fn new(
        req: Request<Incoming>,
        remote_addr: Option<SocketAddr>,
        trust_proxy: bool,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        let method = req.method().as_str().to_string();
        let uri = req.uri();
        let url = uri.to_string();
        let pathname = uri.path().to_string();
        let search = uri.query().map(|q| format!("?{q}"));
        let original_url = url.clone();

        let mut headers_raw = HashMap::with_capacity(req.headers().len());
        for (name, value) in req.headers() {
            if let Ok(v) = value.to_str() {
                headers_raw.insert(name.as_str().to_string(), v.to_string());
            }
        }

        let mut query_raw: HashMap<String, Vec<String>> = HashMap::new();
        if let Some(q) = uri.query() {
            for pair in q.split('&') {
                if let Some((key, value)) = pair.split_once('=') {
                    let decoded_key = urlencoding::decode(key).unwrap_or_default().into_owned();
                    let decoded_value = urlencoding::decode(value).unwrap_or_default().into_owned();
                    query_raw.entry(decoded_key).or_insert_with(Vec::new).push(decoded_value);
                }
            }
        }

        let scheme = req.uri().scheme_str().unwrap_or("http").to_string();

        let body = req.into_body().collect().await?.to_bytes();

        let protocol = if trust_proxy {
            headers_raw
                .get("x-forwarded-proto")
                .map(|s| s.to_string())
                .unwrap_or_else(|| "http".to_string())
        } else {
            scheme
        };

        let secure = protocol.eq_ignore_ascii_case("https");
        let hostname = headers_raw.get("host").cloned().unwrap_or_else(|| "localhost".to_string());

        let cookies_raw = headers_raw.get("cookie").map_or(HashMap::new(), |cookie_str| {
            cookie_str
                .split(';')
                .filter_map(|c| {
                    let parts: Vec<&str> = c.trim().splitn(2, '=').collect();
                    if parts.len() == 2 {
                        Some((parts[0].to_string(), parts[1].to_string()))
                    } else {
                        None
                    }
                })
                .collect()
        });

        let ips: Vec<String> = if trust_proxy {
            headers_raw
                .get("x-forwarded-for")
                .map(|s| s.split(',').map(|ip| ip.trim().to_string()).collect())
                .unwrap_or_default()
        } else {
            vec![]
        };

        let ip = ips
            .first()
            .cloned()
            .or_else(|| remote_addr.map(|a| a.ip().to_string()))
            .unwrap_or_default();

        let xhr =
            headers_raw.get("x-requested-with").map(|v| v == "XMLHttpRequest").unwrap_or(false);

        Ok(Self {
            method,
            url,
            pathname,
            search,
            protocol,
            hostname,
            original_url,
            secure,
            xhr,
            ip,
            ips,
            body,
            headers_raw,
            params: HashMap::new(),
            query_raw,
            cookies_raw,
        })
    }
}

#[napi]
pub fn get_body_buffer(core: &External<Arc<RequestCore>>) -> Buffer {
    Buffer::from(core.body.as_ref())
}

#[napi]
pub fn get_header(core: &External<Arc<RequestCore>>, name: String) -> Option<String> {
    core.headers_raw.get(&name.to_lowercase()).cloned()
}

#[napi]
pub fn get_all_headers(core: &External<Arc<RequestCore>>) -> HashMap<String, String> {
    core.headers_raw.clone()
}

#[napi]
pub fn get_query_param(core: &External<Arc<RequestCore>>, name: String) -> Option<Vec<String>> {
    core.query_raw.get(&name).cloned()
}

#[napi]
pub fn get_all_query(core: &External<Arc<RequestCore>>) -> HashMap<String, Vec<String>> {
    core.query_raw.clone()
}

#[napi]
pub fn get_param(core: &External<Arc<RequestCore>>, name: String) -> Option<String> {
    core.params.get(&name).cloned()
}

#[napi]
pub fn get_all_params(core: &External<Arc<RequestCore>>) -> HashMap<String, String> {
    core.params.clone()
}

#[napi]
pub fn get_cookie(core: &External<Arc<RequestCore>>, name: String) -> Option<String> {
    core.cookies_raw.get(&name).cloned()
}

#[napi]
pub fn get_all_cookies(core: &External<Arc<RequestCore>>) -> HashMap<String, String> {
    core.cookies_raw.clone()
}

#[napi]
pub fn get_method(core: &External<Arc<RequestCore>>) -> String {
    core.method.clone()
}

#[napi]
pub fn get_url(core: &External<Arc<RequestCore>>) -> String {
    core.url.clone()
}

#[napi]
pub fn get_pathname(core: &External<Arc<RequestCore>>) -> String {
    core.pathname.clone()
}

#[napi]
pub fn get_search(core: &External<Arc<RequestCore>>) -> Option<String> {
    core.search.clone()
}

#[napi]
pub fn get_protocol(core: &External<Arc<RequestCore>>) -> String {
    core.protocol.clone()
}

#[napi]
pub fn get_hostname(core: &External<Arc<RequestCore>>) -> String {
    core.hostname.clone()
}

#[napi]
pub fn get_ip(core: &External<Arc<RequestCore>>) -> String {
    core.ip.clone()
}

#[napi]
pub fn get_ips(core: &External<Arc<RequestCore>>) -> Vec<String> {
    core.ips.clone()
}

#[napi]
pub fn get_secure(core: &External<Arc<RequestCore>>) -> bool {
    core.secure
}

#[napi]
pub fn get_xhr(core: &External<Arc<RequestCore>>) -> bool {
    core.xhr
}

#[derive(Clone, Default)]
#[napi(object)]
pub struct CookieOptionsCore {
    pub domain: Option<String>,
    pub http_only: Option<bool>,
    pub max_age: Option<i32>,
    pub path: Option<String>,
    pub secure: Option<bool>,
    pub signed: Option<bool>,
    pub same_site: Option<String>,
}

#[derive(Clone)]
#[napi(object)]
pub struct SendFileOptionsCore {
    pub max_age: Option<u32>,
    pub root: Option<String>,
    pub last_modified: Option<bool>,
    pub headers: Option<HashMap<String, String>>,
    pub dotfiles: Option<String>,
    pub accept_ranges: Option<bool>,
    pub cache_control: Option<bool>,
    pub immutable: Option<bool>,
}

struct ResponseData {
    status: StatusCode,
    headers: HashMap<String, String>,
    cookies: Vec<String>,
    body: Option<Bytes>,
}

impl Default for ResponseData {
    fn default() -> Self {
        Self { status: StatusCode::OK, headers: HashMap::new(), cookies: Vec::new(), body: None }
    }
}

pub struct ResponseBuilderCore {
    data: Mutex<ResponseData>,
    tx: Mutex<Option<Sender<Response<Full<Bytes>>>>>,
}

impl ResponseBuilderCore {
    pub fn new(tx: Sender<Response<Full<Bytes>>>) -> Self {
        Self { data: Mutex::new(ResponseData::default()), tx: Mutex::new(Some(tx)) }
    }

    pub fn set_status(&self, status: u16) {
        let mut data = self.data.lock();
        data.status = StatusCode::from_u16(status).unwrap_or(StatusCode::OK);
    }

    pub fn set_header(&self, name: String, value: String) {
        let mut data = self.data.lock();
        data.headers.insert(name, value);
    }

    pub fn set_headers(&self, headers: HashMap<String, String>) {
        let mut data = self.data.lock();
        data.headers.extend(headers);
    }

    pub fn append_header(&self, name: String, value: String) {
        let mut data = self.data.lock();
        if let Some(existing) = data.headers.get_mut(&name) {
            existing.push_str(", ");
            existing.push_str(&value);
        } else {
            data.headers.insert(name, value);
        }
    }

    pub fn set_cookie(&self, name: String, value: String, options: CookieOptionsCore) {
        let mut data = self.data.lock();
        let cookie_str = serialize_cookie(&name, &value, &options);
        data.cookies.push(cookie_str);
    }

    pub fn set_body(&self, body: Bytes) {
        let mut data = self.data.lock();
        data.body = Some(body);
    }

    pub fn set_redirect(&self, url: String, code: u16) {
        let mut data = self.data.lock();

        data.status = StatusCode::from_u16(code).unwrap_or(StatusCode::FOUND);
        data.headers.insert("Location".to_string(), url);
    }

    pub async fn send_file(&self, path: String, options: Option<SendFileOptionsCore>) {
        match read_file_for_response(&path, options).await {
            Ok((file_body, file_headers)) => {
                let mut data = self.data.lock();
                data.body = Some(file_body);
                data.headers.extend(file_headers);
            }
            Err(e) => {
                eprintln!("Error reading file: {e}");
                let mut data = self.data.lock();
                data.status = StatusCode::NOT_FOUND;
                data.body = Some(Bytes::from_static(b"File Not Found"));
            }
        }
    }

    pub fn end(&self) {
        let data = self.data.lock();
        let mut response = Response::builder().status(data.status);

        for (name, value) in &data.headers {
            if let (Ok(header_name), Ok(header_value)) =
                (HeaderName::try_from(name.as_str()), HeaderValue::try_from(value.as_str()))
            {
                response = response.header(header_name, header_value);
            }
        }

        for cookie in &data.cookies {
            if let Ok(cookie_value) = HeaderValue::try_from(cookie.as_str()) {
                response = response.header("Set-Cookie", cookie_value);
            }
        }

        let body = data.body.clone().unwrap_or_else(|| Bytes::new());
        let response = response.body(Full::new(body)).unwrap();

        let mut tx_guard = self.tx.lock();
        if let Some(tx) = tx_guard.take() {
            let _ = tx.send(response);
        }
    }
}

pub struct ContextObject {
    pub req: External<Arc<RequestCore>>,
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
    builder.set_status(status);
}

#[napi]
pub fn set_header_response(
    builder: &External<Arc<ResponseBuilderCore>>,
    name: String,
    value: String,
) {
    builder.set_header(name, value);
}

#[napi]
pub fn set_headers_response(
    builder: &External<Arc<ResponseBuilderCore>>,
    headers: HashMap<String, String>,
) {
    builder.set_headers(headers);
}

#[napi]
pub fn append_header_response(
    builder: &External<Arc<ResponseBuilderCore>>,
    name: String,
    value: String,
) {
    builder.append_header(name, value);
}

#[napi]
pub fn set_cookie_response(
    builder: &External<Arc<ResponseBuilderCore>>,
    name: String,
    value: String,
    options: Option<CookieOptionsCore>,
) {
    builder.set_cookie(name, value, options.unwrap_or_default());
}

#[napi]
pub fn set_body_bytes(builder: &External<Arc<ResponseBuilderCore>>, data: Buffer) {
    builder.set_body(Bytes::from(data.as_ref().to_vec()));
}

#[napi]
pub fn set_body_string(builder: &External<Arc<ResponseBuilderCore>>, data: String) {
    builder.set_body(Bytes::from(data));
}

#[napi]
pub fn set_redirect_response(
    builder: &External<Arc<ResponseBuilderCore>>,
    url: String,
    code: Option<u16>,
) {
    builder.set_redirect(url, code.unwrap_or(302));
}

#[napi]
pub fn send_file_response(
    builder: &External<Arc<ResponseBuilderCore>>,
    path: String,
    options: Option<SendFileOptionsCore>,
) {
    let builder = (**builder).clone();
    tokio::spawn(async move {
        builder.send_file(path, options).await;
    });
}

#[napi]
pub fn end_response(builder: &External<Arc<ResponseBuilderCore>>) {
    builder.end();
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

            let config = self.config.clone();
            tokio::task::spawn(async move {
                let config = config.clone();
                if let Err(err) = http1::Builder::new()
                    .serve_connection(
                        io,
                        service_fn(move |req| {
                            let config = config.clone();
                            handle_request(req, config, addr)
                        }),
                    )
                    .await
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

fn serialize_cookie(name: &str, value: &str, options: &CookieOptionsCore) -> String {
    let mut cookie = format!("{name}={value}");

    if let Some(max_age) = options.max_age {
        cookie.push_str(&format!("; Max-Age={max_age}"));
    }

    if let Some(ref path) = options.path {
        cookie.push_str(&format!("; Path={path}"));
    } else {
        cookie.push_str("; Path=/");
    }

    if let Some(ref domain) = options.domain {
        cookie.push_str(&format!("; Domain={domain}"));
    }

    if options.http_only.unwrap_or(false) {
        cookie.push_str("; HttpOnly");
    }

    if options.secure.unwrap_or(false) {
        cookie.push_str("; Secure");
    }

    if let Some(ref same_site) = options.same_site {
        cookie.push_str(&format!("; SameSite={same_site}"));
    }

    cookie
}

#[inline(always)]
fn get_mime_type(path: &str) -> &'static str {
    let extension = Path::new(path).extension().and_then(|e| e.to_str()).unwrap_or("");

    match extension.to_lowercase().as_str() {
        "html" | "htm" => "text/html",
        "css" => "text/css",
        "js" | "mjs" => "application/javascript",
        "json" => "application/json",
        "xml" => "application/xml",
        "txt" => "text/plain",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "webp" => "image/webp",
        "ico" => "image/x-icon",
        "pdf" => "application/pdf",
        "zip" => "application/zip",
        "wasm" => "application/wasm",
        "mp4" => "video/mp4",
        "webm" => "video/webm",
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "woff" | "woff2" => "font/woff2",
        "ttf" => "font/ttf",
        "otf" => "font/otf",
        _ => "application/octet-stream",
    }
}

async fn handle_request(
    req: Request<Incoming>,
    config: ServerOptionsCore,
    remote_addr: SocketAddr,
) -> Result<Response<Full<Bytes>>, Infallible> {
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

            let mut req_core =
                match RequestCore::new(req, Some(remote_addr), config.trust_proxy.unwrap_or(false))
                    .await
                {
                    Ok(core) => core,
                    Err(e) => {
                        eprintln!("Error creating request: {e}");
                        return Ok(Response::builder()
                            .status(400)
                            .body(Full::new(Bytes::from_static(b"Bad Request")))
                            .unwrap());
                    }
                };

            req_core.params = params;

            let (response_tx, response_rx) = oneshot::channel();

            let res_builder = Arc::new(ResponseBuilderCore::new(response_tx));
            let res_external = External::new(res_builder);

            let req_external = External::new(Arc::new(req_core));

            let ctx_obj = ContextObject { req: req_external, res: res_external };

            let _ = route.handler.call(ctx_obj, ThreadsafeFunctionCallMode::NonBlocking);

            if let Ok(response) = response_rx.await {
                return Ok(response);
            }

            return Ok(Response::builder().status(200).body(Full::new(Bytes::new())).unwrap());
        }
    }

    Ok(Response::builder().status(404).body(Full::new(Bytes::from_static(b"Not Found"))).unwrap())
}

async fn read_file_for_response(
    path: &str,
    options: Option<SendFileOptionsCore>,
) -> Result<(Bytes, HashMap<String, String>), std::io::Error> {
    let full_path = if let Some(ref opts) = options {
        if let Some(ref root) = opts.root { format!("{root}/{path}") } else { path.to_string() }
    } else {
        path.to_string()
    };

    let mut file = File::open(&full_path).await?;
    let metadata = file.metadata().await?;
    let mut contents = Vec::new();
    file.read_to_end(&mut contents).await?;

    let mut headers = HashMap::new();
    headers.insert("Content-Type".to_string(), get_mime_type(path).to_string());
    headers.insert("Content-Length".to_string(), metadata.len().to_string());

    if let Some(opts) = options {
        if let Some(ref custom_headers) = opts.headers {
            headers.extend(custom_headers.clone());
        }

        if opts.last_modified.unwrap_or(true) {
            if let Ok(modified) = metadata.modified() {
                if let Ok(duration) = modified.duration_since(UNIX_EPOCH) {
                    headers.insert(
                        "Last-Modified".to_string(),
                        httpdate::fmt_http_date(UNIX_EPOCH + duration),
                    );
                }
            }
        }

        if opts.cache_control.unwrap_or(true) {
            if let Some(max_age) = opts.max_age {
                let cache_value = if opts.immutable.unwrap_or(false) {
                    format!("public, max-age={max_age}, immutable")
                } else {
                    format!("public, max-age={max_age}")
                };
                headers.insert("Cache-Control".to_string(), cache_value);
            }
        }

        if opts.accept_ranges.unwrap_or(true) {
            headers.insert("Accept-Ranges".to_string(), "bytes".to_string());
        }
    }

    Ok((Bytes::from(contents), headers))
}
