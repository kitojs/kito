use http_body_util::BodyExt;
use hyper::{
    Request,
    body::{Bytes, Incoming},
};

use napi::bindgen_prelude::{Buffer, External};

use std::{collections::HashMap, net::SocketAddr, sync::Arc};

#[derive(Clone)]
pub struct RequestCore {
    pub method: String,
    pub url: String,
    pub pathname: String,
    pub search: Option<String>,
    pub protocol: String,
    pub hostname: String,
    pub original_url: String,
    pub secure: bool,
    pub xhr: bool,
    pub ip: String,
    pub ips: Vec<String>,

    pub body: Bytes,
    pub headers_raw: HashMap<String, String>,
    pub params: HashMap<String, String>,
    pub query_raw: HashMap<String, Vec<String>>,
    pub cookies_raw: HashMap<String, String>,
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
                    query_raw.entry(decoded_key).or_default().push(decoded_value);
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
