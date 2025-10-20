use std::{collections::HashMap, convert::Infallible, net::SocketAddr};

use http_body_util::Full;
use hyper::{
    Request, Response,
    body::{Body, Bytes},
    server::conn::http1,
    service::service_fn,
};
use hyper_util::rt::TokioIo;
use tokio::net::TcpListener;

use napi::{
    Status,
    bindgen_prelude::{Function, Unknown},
    threadsafe_function::ThreadsafeFunction,
};

#[macro_use]
extern crate napi_derive;

type RouteHandler =
    ThreadsafeFunction<Unknown<'static>, Unknown<'static>, Unknown<'static>, Status, false>;

#[napi]
pub struct ServerCore {
    config: ServerOptionsCore,
    routes: HashMap<String, RouteHandler>,
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
pub struct Route {
    pub path: String,

    #[napi(ts_type = "'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE'")]
    pub method: String,

    #[napi(ts_type = "RouteHandler")]
    pub handler: Function<'static>,
}

#[napi]
impl ServerCore {
    #[napi(constructor)]
    pub fn new(config: ServerOptionsCore) -> Self {
        ServerCore { config, routes: HashMap::new() }
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
    pub fn add_route(&mut self, route: Route) -> napi::Result<()> {
        let key = format!("{}:{}", route.method, route.path);
        let tsfn = route.handler.build_threadsafe_function().build()?;
        self.routes.insert(key, tsfn);
        Ok(())
    }

    #[napi]
    pub async fn start(&self) {
        let addr = self.get_addr();
        let listener = TcpListener::bind(addr).await.unwrap();
        println!("Listening on http://{addr}");

        loop {
            let (tcp, _) = listener.accept().await.unwrap();
            let io = TokioIo::new(tcp);

            tokio::task::spawn(async move {
                if let Err(err) =
                    http1::Builder::new().serve_connection(io, service_fn(hello)).await
                {
                    println!("Error serving connection: {err:?}");
                }
            });
        }
    }

    fn get_addr(&self) -> SocketAddr {
        let addr_str = format!("{}:{}", self.config.host, self.config.port);
        addr_str.parse().expect("Invalid address")
    }
}

async fn hello(_: Request<impl Body>) -> Result<Response<Full<Bytes>>, Infallible> {
    Ok(Response::new(Full::new(Bytes::from("Hello World!"))))
}
