use hyper::server::conn::http1;
use hyper_util::rt::TokioIo;

use napi_derive::napi;

use std::net::SocketAddr;
use tokio::net::TcpListener;

use crate::server::{handler::handle_request, routes::insert_route};

use super::routes::Route;

#[derive(Clone)]
#[napi(object)]
pub struct ServerOptionsCore {
    pub port: u16,
    pub host: String,
    pub trust_proxy: Option<bool>,
    pub max_request_size: Option<u32>,
    pub timeout: Option<u32>,
}

#[napi]
pub struct ServerCore {
    config: ServerOptionsCore,
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
        insert_route(route)
    }

    #[napi]
    pub async fn start(&self) {
        let addr = self.get_addr();
        let listener = TcpListener::bind(addr).await.unwrap();
        println!("Listening on http://{addr}");

        loop {
            let (tcp, _) = listener.accept().await.unwrap();
            let io = TokioIo::new(tcp);
            let config = self.config.clone();

            tokio::spawn(async move {
                if let Err(err) = http1::Builder::new()
                    .serve_connection(
                        io,
                        hyper::service::service_fn(move |req| {
                            handle_request(req, config.clone(), addr)
                        }),
                    )
                    .await
                {
                    eprintln!("Error serving connection: {err:?}");
                }
            });
        }
    }

    fn get_addr(&self) -> SocketAddr {
        let addr_str = format!("{}:{}", self.config.host, self.config.port);
        addr_str.parse().expect("Invalid address")
    }
}
