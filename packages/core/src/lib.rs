use std::collections::HashMap;

use napi::bindgen_prelude::Function;

#[macro_use]
extern crate napi_derive;

#[napi]
pub struct ServerCore<'a> {
    config: ServerOptionsCore,
    routes: HashMap<String, Function<'a>>,
}

#[derive(Clone)]
#[napi(object)]
pub struct ServerOptionsCore {
    pub port: u16,
    pub host: String,
    pub trust_proxy: Option<bool>,
    pub max_request_size: Option<u32>,
    pub timeout: Option<u32>,
}

#[napi(object)]
pub struct Route<'a> {
    pub path: String,

    #[napi(ts_type = "'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE'")]
    pub method: String,

    #[napi(ts_type = "RouteHandler")]
    pub handler: Function<'a>,
}

#[napi]
impl<'a> ServerCore<'a> {
    #[napi(constructor)]
    pub fn new(config: ServerOptionsCore) -> Self {
        let routes: HashMap<String, Function<'a>> = HashMap::new();
        ServerCore { config, routes }
    }

    #[napi]
    pub fn get_config(&self) -> ServerOptionsCore {
        self.config.clone()
    }

    #[napi]
    pub fn set_config(&mut self, config: ServerOptionsCore) {
        self.config = config;
    }

    #[napi]
    pub fn add_route(&mut self, route: Route<'a>) {
        let key = format!("{}:{}", route.method, route.path);
        self.routes.insert(key, route.handler);
    }
}
