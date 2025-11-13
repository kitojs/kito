use napi::Error;
use napi::{bindgen_prelude::Function, threadsafe_function::ThreadsafeFunction};

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
    pub handler: RouteHandler,
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
}

pub fn insert_route(route: Route) -> napi::Result<()> {
    let method_key: Box<str> = route.method.clone().into_boxed_str();
    let segments: Vec<Box<str>> = route
        .path
        .split('/')
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string().into_boxed_str())
        .collect();

    let tsfn = route.handler.build_threadsafe_function().build()?;

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
        handler: tsfn,
        schema,
    };

    ROUTER.insert(&route.method, compiled).map_err(|e| Error::from_reason(e))?;
    Ok(())
}
