use std::{convert::Infallible, net::SocketAddr};

use dashmap::DashMap;
use once_cell::sync::Lazy;

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

static ROUTES: Lazy<DashMap<String, RouteHandler>> = Lazy::new(DashMap::new);

#[napi]
pub struct ServerCore {
    config: ServerOptionsCore,
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
        ServerCore { config }
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

        ROUTES.insert(key, tsfn);

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
                    http1::Builder::new().serve_connection(io, service_fn(handle_request)).await
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

async fn handle_request(req: Request<impl Body>) -> Result<Response<Full<Bytes>>, Infallible> {
    let method = req.method().to_string();
    let path = req.uri().path().to_string();
    let key = format!("{method}:{path}");

    if let Some(_handler) = ROUTES.get(&key) {
        // to-do: handler call

        return Ok(Response::builder()
            .status(200)
            .body(Full::new(Bytes::from("Handler called")))
            .unwrap());
    }

    Ok(Response::builder().status(404).body(Full::new(Bytes::from("Not Found"))).unwrap())
}
