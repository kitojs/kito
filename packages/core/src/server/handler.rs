use http_body_util::Full;
use hyper::{
    Request, Response,
    body::{Bytes, Incoming},
};

use napi::{bindgen_prelude::External, threadsafe_function::ThreadsafeFunctionCallMode};

use std::{collections::HashMap, convert::Infallible, net::SocketAddr, sync::Arc};
use tokio::sync::oneshot;

use crate::{
    http::{request::RequestCore, response::ResponseBuilderCore},
    server::{context::ContextObject, core::ServerOptionsCore, routes::ROUTES},
};

pub async fn handle_request(
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
            let ctx_obj = ContextObject {
                req: External::new(Arc::new(req_core)),
                res: External::new(res_builder.clone()),
            };

            let _ = route.handler.call(ctx_obj, ThreadsafeFunctionCallMode::NonBlocking);

            if let Ok(response) = response_rx.await {
                return Ok(response);
            }

            return Ok(Response::builder().status(200).body(Full::new(Bytes::new())).unwrap());
        }
    }

    Ok(Response::builder().status(404).body(Full::new(Bytes::from_static(b"Not Found"))).unwrap())
}
