use http_body_util::Full;
use hyper::{
    Response,
    body::Bytes,
    header::{HeaderName, HeaderValue},
};

use napi::bindgen_prelude::{Buffer, External};

use parking_lot::Mutex;
use serde_json::from_slice;

use std::{collections::HashMap, sync::Arc};
use tokio::sync::oneshot::Sender;

pub struct ResponseChannel {
    pub tx: Mutex<Option<Sender<Response<Full<Bytes>>>>>,
}

impl ResponseChannel {
    pub fn new(tx: Sender<Response<Full<Bytes>>>) -> Self {
        Self { tx: Mutex::new(Some(tx)) }
    }
}

/// buffer: [status_code(2)] [headers_len(4)] [headers_json] [body]
#[napi]
pub fn send_response(channel: &External<Arc<ResponseChannel>>, buffer: Buffer) -> napi::Result<()> {
    let data = buffer.as_ref();

    if data.len() < 6 {
        return Err(napi::Error::from_reason("Invalid response buffer"));
    }

    let status_code = u16::from_le_bytes([data[0], data[1]]);

    let headers_len = u32::from_le_bytes([data[2], data[3], data[4], data[5]]) as usize;

    if data.len() < 6 + headers_len {
        return Err(napi::Error::from_reason("Invalid headers length"));
    }

    let headers_json = &data[6..6 + headers_len];
    let headers: Vec<(String, String)> = from_slice(headers_json)
        .map_err(|e| napi::Error::from_reason(format!("Invalid headers JSON: {e}")))?;

    let body_start = 6 + headers_len;
    let body = if body_start < data.len() {
        Bytes::copy_from_slice(&data[body_start..])
    } else {
        Bytes::new()
    };

    let mut response = Response::builder().status(status_code);

    for (name, value) in headers {
        if let (Ok(header_name), Ok(header_value)) =
            (HeaderName::try_from(name.as_str()), HeaderValue::try_from(value.as_str()))
        {
            response = response.header(header_name, header_value);
        }
    }

    let response = response
        .body(Full::new(body))
        .map_err(|e| napi::Error::from_reason(format!("Failed to build response: {e}")))?;

    let mut tx_guard = channel.tx.lock();
    if let Some(tx) = tx_guard.take() {
        let _ = tx.send(response);
        Ok(())
    } else {
        Err(napi::Error::from_reason("Response already sent"))
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
