use http_body_util::Full;
use hyper::{
    Request, Response,
    body::{Bytes, Incoming},
};

use napi::{bindgen_prelude::External, threadsafe_function::ThreadsafeFunctionCallMode};
use serde_json::json;

use std::{net::SocketAddr, sync::Arc};
use tokio::sync::oneshot;

use crate::{
    http::{request::RequestCore, response::ResponseChannel},
    server::{context::ContextObject, core::ServerOptionsCore, routes::ROUTER},
    validation::parser::*,
};

pub async fn handle_request(
    req: Request<Incoming>,
    config: ServerOptionsCore,
    remote_addr: SocketAddr,
) -> Result<Response<Full<Bytes>>, std::convert::Infallible> {
    let method = req.method().to_string();
    let pathname = req.uri().path().to_string();

    let matched = match ROUTER.find(&method, &pathname) {
        Some(m) => m,
        None => {
            return Ok(Response::builder()
                .status(404)
                .body(Full::new(Bytes::from_static(b"Not Found")))
                .unwrap());
        }
    };

    let route = matched.route;

    let mut req_core =
        match RequestCore::new(req, Some(remote_addr), config.trust_proxy.unwrap_or(false)).await {
            Ok(core) => core,
            Err(e) => {
                eprintln!("Error creating request: {e}");
                return Ok(Response::builder()
                    .status(400)
                    .body(Full::new(Bytes::from_static(b"Bad Request")))
                    .unwrap());
            }
        };

    req_core.params = matched.params.into_iter().collect();

    if let Some(schema) = &route.schema {
        if let Some(params_schema) = &schema.params {
            if let Err(e) = parse_params(&req_core.params, params_schema) {
                let error_msg = format!("Validation error in {}: {}", e.field, e.message);
                return Ok(Response::builder()
                    .status(400)
                    .header("Content-Type", "application/json")
                    .body(Full::new(Bytes::from(
                        json!({
                            "error": "Validation Error",
                            "message": error_msg
                        })
                        .to_string(),
                    )))
                    .unwrap());
            }
        }

        if let Some(query_schema) = &schema.query {
            if let Err(e) = parse_query(&req_core.query_raw, query_schema) {
                let error_msg = format!("Validation error in {}: {}", e.field, e.message);
                return Ok(Response::builder()
                    .status(400)
                    .header("Content-Type", "application/json")
                    .body(Full::new(Bytes::from(
                        json!({
                            "error": "Validation Error",
                            "message": error_msg
                        })
                        .to_string(),
                    )))
                    .unwrap());
            }
        }

        if let Some(body_schema) = &schema.body {
            let has_body_method = matches!(method.as_str(), "POST" | "PUT" | "PATCH" | "DELETE");

            if has_body_method {
                if req_core.body.is_empty() {
                    let error_msg = "Request body is required".to_string();
                    return Ok(Response::builder()
                        .status(400)
                        .header("Content-Type", "application/json")
                        .body(Full::new(Bytes::from(
                            json!({
                                "error": "Validation Error",
                                "message": error_msg
                            })
                            .to_string(),
                        )))
                        .unwrap());
                }

                if let Err(e) = parse_body(req_core.body.as_ref(), body_schema) {
                    let error_msg = format!("Validation error in {}: {}", e.field, e.message);
                    return Ok(Response::builder()
                        .status(400)
                        .header("Content-Type", "application/json")
                        .body(Full::new(Bytes::from(
                            json!({
                                "error": "Validation Error",
                                "message": error_msg
                            })
                            .to_string(),
                        )))
                        .unwrap());
                }
            }
        }

        if let Some(headers_schema) = &schema.headers {
            if let Err(e) = parse_headers(&req_core.headers_raw, headers_schema) {
                let error_msg = format!("Validation error in {}: {}", e.field, e.message);
                return Ok(Response::builder()
                    .status(400)
                    .header("Content-Type", "application/json")
                    .body(Full::new(Bytes::from(
                        json!({
                            "error": "Validation Error",
                            "message": error_msg
                        })
                        .to_string(),
                    )))
                    .unwrap());
            }
        }
    }

    let (response_tx, response_rx) = oneshot::channel();
    let res_builder = Arc::new(ResponseChannel::new(response_tx));

    let ctx_obj = ContextObject {
        req: External::new(Arc::new(req_core)),
        res: External::new(res_builder.clone()),
    };

    let _ = route.handler.call(ctx_obj, ThreadsafeFunctionCallMode::NonBlocking);

    if let Ok(response) = response_rx.await {
        return Ok(response);
    }

    Ok(Response::builder().status(200).body(Full::new(Bytes::new())).unwrap())
}
