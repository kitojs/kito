use http_body_util::Full;
use hyper::{
    Response, StatusCode,
    body::Bytes,
    header::{HeaderName, HeaderValue},
};

use napi::bindgen_prelude::{Buffer, External};

use parking_lot::Mutex;

use std::{collections::HashMap, sync::Arc};
use tokio::sync::oneshot::Sender;

use crate::http::{
    cookies::{CookieOptionsCore, serialize_cookie},
    files::read_file_for_response,
};

pub struct ResponseData {
    pub status: StatusCode,
    pub headers: HashMap<String, String>,
    pub cookies: Vec<String>,
    pub body: Option<Bytes>,
}

impl Default for ResponseData {
    fn default() -> Self {
        Self { status: StatusCode::OK, headers: HashMap::new(), cookies: Vec::new(), body: None }
    }
}

pub struct ResponseBuilderCore {
    pub data: Mutex<ResponseData>,
    pub tx: Mutex<Option<Sender<Response<Full<Bytes>>>>>,
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
