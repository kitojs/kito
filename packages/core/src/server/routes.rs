use napi::{bindgen_prelude::Function, threadsafe_function::ThreadsafeFunction};

use dashmap::DashMap;
use once_cell::sync::Lazy;

use crate::server::context::ContextObject;

pub type RouteHandler = ThreadsafeFunction<ContextObject, (), ContextObject, napi::Status, false>;

pub struct CompiledRoute {
    pub method: Box<str>,
    pub path: Box<str>,
    pub segments: Box<[Box<str>]>,
    pub handler: RouteHandler,
}

pub static ROUTES: Lazy<DashMap<Box<str>, Vec<CompiledRoute>>> = Lazy::new(DashMap::new);

#[napi(object)]
pub struct Route {
    pub path: String,
    #[napi(ts_type = "'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE'")]
    pub method: String,
    #[napi(ts_type = "RouteHandler")]
    pub handler: Function<'static, ContextObject, ()>,
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
    let compiled = CompiledRoute {
        method: method_key.clone(),
        path: route.path.clone().into_boxed_str(),
        segments: segments.into_boxed_slice(),
        handler: tsfn,
    };

    ROUTES.entry(method_key).or_default().push(compiled);
    Ok(())
}
