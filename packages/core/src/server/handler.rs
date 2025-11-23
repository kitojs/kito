use http_body_util::{BodyExt, Full, StreamBody};
use hyper::{
    Request, Response,
    body::{Bytes, Frame, Incoming},
    header::{HeaderName, HeaderValue},
};

use napi::{bindgen_prelude::External, threadsafe_function::ThreadsafeFunctionCallMode};
use serde_json::json;

use futures_util::stream;
use std::{convert::Infallible, net::SocketAddr, sync::Arc};
use tokio::sync::mpsc;

use crate::{
    http::{
        request::RequestCore,
        response::{BoxedBody, ResponseChannel, ResponseMessage},
    },
    server::{
        context::ContextObject,
        core::ServerOptionsCore,
        routes::{ROUTER, ResponseStrategy},
    },
    validation::parser::*,
};

pub async fn handle_request(
    req: Request<Incoming>,
    config: ServerOptionsCore,
    remote_addr: Option<SocketAddr>,
) -> Result<Response<BoxedBody>, std::convert::Infallible> {
    let method = req.method().to_string();
    let pathname = req.uri().path().to_string();

    let matched = match ROUTER.find(&method, &pathname) {
        Some(m) => m,
        None => {
            return Ok(Response::builder()
                .status(404)
                .body(
                    Full::new(Bytes::from_static(b"Not Found"))
                        .map_err(|never| match never {})
                        .boxed(),
                )
                .unwrap());
        }
    };

    let route = matched.route;

    if let ResponseStrategy::FullStatic(ref response) = route.strategy {
        let (parts, body) = response.clone().into_parts();
        let body_bytes = body.collect().await.unwrap().to_bytes();
        return Ok(Response::from_parts(
            parts,
            Full::new(body_bytes).map_err(|never| match never {}).boxed(),
        ));
    }

    if let ResponseStrategy::ParamTemplate { ref template, ref params, ref headers } =
        route.strategy
    {
        let mut rendered = template.clone();

        for param_name in params {
            if let Some(value) = matched.params.get(param_name) {
                let placeholder = format!("{{{{params.{param_name}}}}}");
                rendered = rendered.replace(&placeholder, value);
            }
        }

        let mut response = Response::builder().status(200);
        for (name, value) in headers {
            response = response.header(name.as_str(), value.as_str());
        }

        return Ok(response
            .body(Full::new(Bytes::from(rendered)).map_err(|never| match never {}).boxed())
            .unwrap());
    }

    let mut req_core =
        match RequestCore::new(req, remote_addr, config.trust_proxy.unwrap_or(false)).await {
            Ok(core) => core,
            Err(e) => {
                eprintln!("Error creating request: {e}");
                return Ok(Response::builder()
                    .status(400)
                    .body(
                        Full::new(Bytes::from_static(b"Bad Request"))
                            .map_err(|never| match never {})
                            .boxed(),
                    )
                    .unwrap());
            }
        };

    req_core.params = matched.params.into_iter().collect();

    if let Some(schema) = &route.schema {
        if let Some(params_schema) = &schema.params
            && let Err(e) = parse_params(&req_core.params, params_schema)
        {
            let error_msg = format!("Validation error in {}: {}", e.field, e.message);
            return Ok(Response::builder()
                .status(400)
                .header("Content-Type", "application/json")
                .body(
                    Full::new(Bytes::from(
                        json!({
                            "error": "Validation Error",
                            "message": error_msg
                        })
                        .to_string(),
                    ))
                    .map_err(|never| match never {})
                    .boxed(),
                )
                .unwrap());
        }

        if let Some(query_schema) = &schema.query
            && let Err(e) = parse_query(&req_core.query_raw, query_schema)
        {
            let error_msg = format!("Validation error in {}: {}", e.field, e.message);
            return Ok(Response::builder()
                .status(400)
                .header("Content-Type", "application/json")
                .body(
                    Full::new(Bytes::from(
                        json!({
                            "error": "Validation Error",
                            "message": error_msg
                        })
                        .to_string(),
                    ))
                    .map_err(|never| match never {})
                    .boxed(),
                )
                .unwrap());
        }

        if let Some(body_schema) = &schema.body {
            let has_body_method = matches!(method.as_str(), "POST" | "PUT" | "PATCH" | "DELETE");

            if has_body_method {
                if req_core.body.is_empty() {
                    let error_msg = "Request body is required".to_string();
                    return Ok(Response::builder()
                        .status(400)
                        .header("Content-Type", "application/json")
                        .body(
                            Full::new(Bytes::from(
                                json!({
                                    "error": "Validation Error",
                                    "message": error_msg
                                })
                                .to_string(),
                            ))
                            .map_err(|never| match never {})
                            .boxed(),
                        )
                        .unwrap());
                }

                if let Err(e) = parse_body(req_core.body.as_ref(), body_schema) {
                    let error_msg = format!("Validation error in {}: {}", e.field, e.message);
                    return Ok(Response::builder()
                        .status(400)
                        .header("Content-Type", "application/json")
                        .body(
                            Full::new(Bytes::from(
                                json!({
                                    "error": "Validation Error",
                                    "message": error_msg
                                })
                                .to_string(),
                            ))
                            .map_err(|never| match never {})
                            .boxed(),
                        )
                        .unwrap());
                }
            }
        }

        if let Some(headers_schema) = &schema.headers
            && let Err(e) = parse_headers(&req_core.headers_raw, headers_schema)
        {
            let error_msg = format!("Validation error in {}: {}", e.field, e.message);
            return Ok(Response::builder()
                .status(400)
                .header("Content-Type", "application/json")
                .body(
                    Full::new(Bytes::from(
                        json!({
                            "error": "Validation Error",
                            "message": error_msg
                        })
                        .to_string(),
                    ))
                    .map_err(|never| match never {})
                    .boxed(),
                )
                .unwrap());
        }
    }

    let (response_tx, mut response_rx) = mpsc::unbounded_channel();
    let res_builder = Arc::new(ResponseChannel::new(response_tx));

    let ctx_obj = ContextObject {
        req: External::new(Arc::new(req_core)),
        res: External::new(res_builder.clone()),
    };

    if let ResponseStrategy::Dynamic(handler) = route.strategy.clone() {
        let _ = handler.call(ctx_obj, ThreadsafeFunctionCallMode::NonBlocking);
    }

    if let Some(first_msg) = response_rx.recv().await {
        match first_msg {
            ResponseMessage::Complete { status, headers, body } => {
                let mut response = Response::builder().status(status);

                for (name, value) in headers {
                    if let (Ok(header_name), Ok(header_value)) =
                        (name.parse::<HeaderName>(), value.parse::<HeaderValue>())
                    {
                        response = response.header(header_name, header_value);
                    }
                }

                return Ok(response
                    .body(Full::new(body).map_err(|never| match never {}).boxed())
                    .unwrap());
            }
            ResponseMessage::StreamStart { status, headers } => {
                let mut response = Response::builder().status(status);

                for (name, value) in headers {
                    if let (Ok(header_name), Ok(header_value)) =
                        (name.parse::<HeaderName>(), value.parse::<HeaderValue>())
                    {
                        response = response.header(header_name, header_value);
                    }
                }

                let stream = stream::unfold(response_rx, |mut rx| async move {
                    match rx.recv().await {
                        Some(ResponseMessage::StreamChunk { data }) => {
                            Some((Ok(Frame::data(data)), rx))
                        }
                        Some(ResponseMessage::StreamEnd) | None => None,
                        _ => None,
                    }
                });

                let body = StreamBody::new(stream);
                return Ok(response
                    .body(body.map_err(|never: Infallible| match never {}).boxed())
                    .unwrap());
            }
            _ => {}
        }
    }

    Ok(Response::builder()
        .status(200)
        .body(Full::new(Bytes::new()).map_err(|never| match never {}).boxed())
        .unwrap())
}
