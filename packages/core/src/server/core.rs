use hyper::server::conn::http1;
use hyper_util::rt::TokioIo;

use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi_derive::napi;

use std::net::SocketAddr;
use tokio::{net::TcpListener, sync::watch};

#[cfg(unix)]
use std::fs;
#[cfg(unix)]
use std::path::Path;
#[cfg(unix)]
use tokio::net::UnixListener;

use crate::server::{handler::handle_request, routes::insert_route};

use super::routes::Route;

#[derive(Clone)]
#[napi(object)]
pub struct ServerOptionsCore {
    pub port: Option<u16>,
    pub host: Option<String>,
    pub unix_socket: Option<String>,
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

    /// Start the HTTP server on TCP or Unix socket and execute the `ready` callback if provided.
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

        #[cfg(unix)]
        if let Some(ref socket_path) = self.config.unix_socket {
            self.start_unix_socket(socket_path, ready, &mut shutdown_rx).await;
            return;
        }

        self.start_tcp(ready, &mut shutdown_rx).await;
    }

    async fn start_tcp(
        &self,
        ready: Option<ThreadsafeFunction<()>>,
        shutdown_rx: &mut watch::Receiver<()>,
    ) {
        let port = self.config.port.unwrap_or(3000);
        let host = self.config.host.as_deref().unwrap_or("0.0.0.0");
        let addr: SocketAddr = format!("{host}:{port}").parse().expect("Invalid address");

        let listener = TcpListener::bind(addr).await.unwrap();

        if let Some(ready_cb) = ready {
            ready_cb.call(Ok(()), ThreadsafeFunctionCallMode::NonBlocking);
        }

        loop {
            tokio::select! {
                Ok((tcp, remote_addr)) = listener.accept() => {
                    let io = TokioIo::new(tcp);
                    let config = self.config.clone();

                    tokio::spawn(async move {
                        if let Err(err) = http1::Builder::new()
                            .serve_connection(io, hyper::service::service_fn(move |req| {
                                handle_request(req, config.clone(), Some(remote_addr))
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

    #[cfg(unix)]
    async fn start_unix_socket(
        &self,
        socket_path: &str,
        ready: Option<ThreadsafeFunction<()>>,
        shutdown_rx: &mut watch::Receiver<()>,
    ) {
        let path = Path::new(socket_path);

        if path.exists() {
            fs::remove_file(path).unwrap_or_else(|e| {
                eprintln!("Warning: Could not remove existing socket file: {e}");
            });
        }

        let listener = UnixListener::bind(path).expect("Failed to bind Unix socket");

        if let Some(ready_cb) = ready {
            ready_cb.call(Ok(()), ThreadsafeFunctionCallMode::NonBlocking);
        }

        loop {
            tokio::select! {
                Ok((stream, _)) = listener.accept() => {
                    let io = TokioIo::new(stream);
                    let config = self.config.clone();

                    tokio::spawn(async move {
                        if let Err(err) = http1::Builder::new()
                            .serve_connection(io, hyper::service::service_fn(move |req| {
                                handle_request(req, config.clone(), None)
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

        let _ = fs::remove_file(path);
    }

    #[napi]
    pub fn close(&self) {
        if let Some(tx) = &self.shutdown_tx {
            let _ = tx.send(());
        }
    }
}
