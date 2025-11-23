use http_body_util::{Full, StreamBody, combinators::BoxBody};
use hyper::body::{Bytes, Frame};

use napi::bindgen_prelude::{Buffer, External};

use parking_lot::Mutex;
use serde_json::from_slice;

use std::{collections::HashMap, sync::Arc};
use tokio::sync::mpsc::UnboundedSender;

pub struct ResponseChannel {
    pub tx: Mutex<Option<UnboundedSender<ResponseMessage>>>,
}

impl ResponseChannel {
    pub fn new(tx: UnboundedSender<ResponseMessage>) -> Self {
        Self { tx: Mutex::new(Some(tx)) }
    }
}

pub enum ResponseMessage {
    Complete { status: u16, headers: Vec<(String, String)>, body: Bytes },
    StreamStart { status: u16, headers: Vec<(String, String)> },
    StreamChunk { data: Bytes },
    StreamEnd,
}

pub enum ResponseBody {
    Full(Full<Bytes>),
    Stream(StreamBody<Frame<Bytes>>),
}

pub type BoxedBody = BoxBody<Bytes, Box<dyn std::error::Error + Send + Sync>>;

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

    let mut tx_guard = channel.tx.lock();
    if let Some(tx) = tx_guard.as_ref() {
        let _ = tx.send(ResponseMessage::Complete { status: status_code, headers, body });
        *tx_guard = None;
        Ok(())
    } else {
        Err(napi::Error::from_reason("Response already sent"))
    }
}

/// buffer: [status_code(2)] [headers_len(4)] [headers_json]
#[napi]
pub fn start_stream(channel: &External<Arc<ResponseChannel>>, buffer: Buffer) -> napi::Result<()> {
    let data = buffer.as_ref();

    if data.len() < 6 {
        return Err(napi::Error::from_reason("Invalid stream start buffer"));
    }

    let status_code = u16::from_le_bytes([data[0], data[1]]);
    let headers_len = u32::from_le_bytes([data[2], data[3], data[4], data[5]]) as usize;

    if data.len() < 6 + headers_len {
        return Err(napi::Error::from_reason("Invalid headers length"));
    }

    let headers_json = &data[6..6 + headers_len];
    let headers: Vec<(String, String)> = from_slice(headers_json)
        .map_err(|e| napi::Error::from_reason(format!("Invalid headers JSON: {e}")))?;

    let tx_guard = channel.tx.lock();
    if let Some(tx) = tx_guard.as_ref() {
        let _ = tx.send(ResponseMessage::StreamStart { status: status_code, headers });
        Ok(())
    } else {
        Err(napi::Error::from_reason("Response already sent"))
    }
}

#[napi]
pub fn send_chunk(channel: &External<Arc<ResponseChannel>>, data: Buffer) -> napi::Result<()> {
    let tx_guard = channel.tx.lock();
    if let Some(tx) = tx_guard.as_ref() {
        let bytes = Bytes::copy_from_slice(data.as_ref());
        let _ = tx.send(ResponseMessage::StreamChunk { data: bytes });
        Ok(())
    } else {
        Err(napi::Error::from_reason("Stream not started"))
    }
}

#[napi]
pub fn end_stream(channel: &External<Arc<ResponseChannel>>) -> napi::Result<()> {
    let mut tx_guard = channel.tx.lock();
    if let Some(tx) = tx_guard.take() {
        let _ = tx.send(ResponseMessage::StreamEnd);
        Ok(())
    } else {
        Err(napi::Error::from_reason("Stream already ended"))
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
