use hyper::body::Bytes;

use std::{collections::HashMap, time::UNIX_EPOCH};
use tokio::{fs::File, io::AsyncReadExt};

use crate::http::mime::get_mime_type;
use crate::http::response::SendFileOptionsCore;

pub async fn read_file_for_response(
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
