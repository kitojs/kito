use hyper::server::conn::http1;
use hyper_util::rt::TokioIo;

use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi_derive::napi;

use std::net::SocketAddr;
use tokio::{net::TcpListener, sync::watch};

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
    shutdown_tx: Option<watch::Sender<()>>,
}

#[napi]
impl ServerCore {
    #[napi(constructor)]
    pub fn new(config: ServerOptionsCore) -> Self {
        ServerCore { config, shutdown_tx: None }
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

    /// Start the HTTP server and execute the `ready` callback if provided.
    ///
    /// # Safety
    ///
    /// This function is unsafe because it exposes logic that will be called from JavaScript via N-API, and depends on:
    /// - The `ServerCore` object remains alive while async tasks are running.
    /// - The `ThreadsafeFunction` passed (if it exists) is valid and has not been released.
    /// - `start` is not called twice simultaneously on the same instance.
    ///
    /// The caller must guarantee these conditions.
    #[napi(ts_args_type = "ready: (() => void) | undefined")]
    pub async unsafe fn start(&mut self, ready: Option<ThreadsafeFunction<()>>) {
        let (shutdown_tx, mut shutdown_rx) = watch::channel::<()>(());
        self.shutdown_tx = Some(shutdown_tx);

        let addr = self.get_addr();
        let listener = TcpListener::bind(addr).await.unwrap();

        if let Some(ready_cb) = ready {
            ready_cb.call(Ok(()), ThreadsafeFunctionCallMode::NonBlocking);
        }

        loop {
            tokio::select! {
                Ok((tcp, _)) = listener.accept() => {
                    let io = TokioIo::new(tcp);
                    let config = self.config.clone();

                    tokio::spawn(async move {
                        if let Err(err) = http1::Builder::new()
                            .serve_connection(io, hyper::service::service_fn(move |req| {
                                handle_request(req, config.clone(), addr)
                            }))
                            .await
                        {
                            eprintln!("Error serving connection: {err:?}");
                        }
                    });
                },
                _ = shutdown_rx.changed() => break,
            }
        }
    }

    #[napi]
    pub fn close(&self) {
        if let Some(tx) = &self.shutdown_tx {
            let _ = tx.send(());
        }
    }

    fn get_addr(&self) -> SocketAddr {
        let addr_str = format!("{}:{}", self.config.host, self.config.port);
        addr_str.parse().expect("Invalid address")
    }
}
