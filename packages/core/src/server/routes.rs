use ahash::HashMap;
use std::sync::Arc;

use http_body_util::Full;
use hyper::Response;
use hyper::body::Bytes;

use napi::Error;
use napi::{bindgen_prelude::Function, threadsafe_function::ThreadsafeFunction};

use base64::Engine;
use base64::engine::general_purpose;

use once_cell::sync::Lazy;
use serde_json::{Value, from_str, from_value};

use crate::server::context::ContextObject;
use crate::server::router::GlobalRouter;
use crate::validation::types::SchemaType;

pub type RouteHandler = ThreadsafeFunction<ContextObject, (), ContextObject, napi::Status, false>;

pub struct CompiledRoute {
    pub method: Box<str>,
    pub path: Box<str>,
    pub segments: Box<[Box<str>]>,
    pub strategy: ResponseStrategy,
    pub schema: Option<RouteSchema>,
}

#[derive(Clone)]
pub struct RouteSchema {
    pub params: Option<SchemaType>,
    pub query: Option<SchemaType>,
    pub body: Option<SchemaType>,
    pub headers: Option<SchemaType>,
}

pub static ROUTER: Lazy<GlobalRouter> = Lazy::new(GlobalRouter::new);

#[napi(object)]
pub struct Route {
    pub path: String,
    #[napi(ts_type = "'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE'")]
    pub method: String,
    #[napi(ts_type = "RouteHandler")]
    pub handler: Function<'static, ContextObject, ()>,
    pub schema: Option<String>,
    pub static_response: Option<String>,
}

#[derive(Clone)]
pub enum ResponseStrategy {
    Dynamic(Arc<RouteHandler>),
    FullStatic(Response<Full<Bytes>>),
    ParamTemplate { template: String, params: Vec<String>, headers: HashMap<String, String> },
}

pub fn insert_route(route: Route) -> napi::Result<()> {
    let method_key: Box<str> = route.method.clone().into_boxed_str();
    let segments: Vec<Box<str>> = route
        .path
        .split('/')
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string().into_boxed_str())
        .collect();

    let strategy = if let Some(static_json) = route.static_response {
        let static_info: Value = from_str(&static_json)
            .map_err(|e| Error::from_reason(format!("Invalid static response: {e}")))?;

        match static_info["type"].as_str() {
            Some("full_static") => {
                let status = static_info["status"].as_u64().unwrap_or(200) as u16;

                let body_base64 = static_info["body"]
                    .as_str()
                    .ok_or_else(|| Error::from_reason("Missing body field in static response"))?;

                let body_bytes = general_purpose::STANDARD
                    .decode(body_base64)
                    .map_err(|e| Error::from_reason(format!("Invalid base64 body: {e}")))?;

                let mut response = Response::builder().status(status);

                if let Some(headers) = static_info["headers"].as_object() {
                    for (name, value) in headers {
                        if let Some(v) = value.as_str() {
                            response = response.header(name.as_str(), v);
                        }
                    }
                }

                let response = response
                    .body(Full::new(Bytes::from(body_bytes)))
                    .map_err(|e| Error::from_reason(format!("Failed to build response: {e}")))?;

                ResponseStrategy::FullStatic(response)
            }
            Some("param_template") => {
                let template = static_info["template"]
                    .as_str()
                    .ok_or_else(|| Error::from_reason("Missing template field"))?
                    .to_string();

                let params: Vec<String> = static_info["params"]
                    .as_array()
                    .ok_or_else(|| Error::from_reason("Missing params field"))?
                    .iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect();

                let headers: HashMap<String, String> = static_info["headers"]
                    .as_object()
                    .ok_or_else(|| Error::from_reason("Missing headers field"))?
                    .iter()
                    .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                    .collect();

                ResponseStrategy::ParamTemplate { template, params, headers }
            }
            _ => {
                let tsfn = route.handler.build_threadsafe_function().build()?;
                ResponseStrategy::Dynamic(Arc::new(tsfn))
            }
        }
    } else {
        let tsfn = route.handler.build_threadsafe_function().build()?;
        ResponseStrategy::Dynamic(Arc::new(tsfn))
    };

    let schema = if let Some(schema_json) = route.schema {
        let parsed: Value = from_str(&schema_json)
            .map_err(|e| Error::from_reason(format!("Invalid schema JSON: {e}")))?;

        Some(RouteSchema {
            params: parsed.get("params").and_then(|v| from_value(v.clone()).ok()),
            query: parsed.get("query").and_then(|v| from_value(v.clone()).ok()),
            body: parsed.get("body").and_then(|v| from_value(v.clone()).ok()),
            headers: parsed.get("headers").and_then(|v| from_value(v.clone()).ok()),
        })
    } else {
        None
    };

    let compiled = CompiledRoute {
        method: method_key.clone(),
        path: route.path.clone().into_boxed_str(),
        segments: segments.into_boxed_slice(),
        strategy,
        schema,
    };

    ROUTER.insert(&route.method, compiled).map_err(|e| Error::from_reason(e))?;
    Ok(())
}
