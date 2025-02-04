use actix_web::rt;
use actix_web::{web, App, HttpRequest, HttpResponse, HttpServer};
use lazy_static::lazy_static;
use num_cpus;
use std::sync::{Arc, Mutex};

use crate::invoke_callback;

lazy_static! {
    static ref INSTANCE: Arc<Mutex<Server>> = Arc::new(Mutex::new(Server {
        host: "127.0.0.1".to_string(),
        port: 3000,
        routes: Arc::new(Mutex::new(vec![])),
    }));
}

pub struct Server {
    pub host: String,
    pub port: u16,
    pub routes: Arc<Mutex<Vec<(String, u8)>>>,
}

impl Server {
    pub fn new(host: String, port: u16) -> Arc<Mutex<Server>> {
        let mut server = INSTANCE.lock().unwrap();
        server.host = host;
        server.port = port;
        INSTANCE.clone()
    }

    pub fn add_route(path: String, method_type: u8) {
        let server = INSTANCE.lock().unwrap();
        let mut routes = server.routes.lock().unwrap();
        routes.push((path, method_type));
    }

    pub fn listen(server: Arc<Mutex<Server>>) {
        let server_guard = server.lock().unwrap();
        let addr = format!("{}:{}", server_guard.host, server_guard.port);
        let routes = server_guard.routes.clone();

        rt::System::new().block_on(async move {
            HttpServer::new(move || {
                let mut app = App::new();
                let routes = routes.lock().unwrap();

                for (path, method) in routes.iter() {
                    let path_clone = path.clone();
                    app = match method {
                        0 => app.route(
                            &path,
                            web::get().to(move |req: HttpRequest| {
                                handle_request(req.clone(), path_clone.clone(), "GET")
                            }),
                        ),
                        1 => app.route(
                            &path,
                            web::post().to(move |req: HttpRequest| {
                                handle_request(req.clone(), path_clone.clone(), "POST")
                            }),
                        ),
                        2 => app.route(
                            &path,
                            web::put().to(move |req: HttpRequest| {
                                handle_request(req.clone(), path_clone.clone(), "PUT")
                            }),
                        ),
                        3 => app.route(
                            &path,
                            web::patch().to(move |req: HttpRequest| {
                                handle_request(req.clone(), path_clone.clone(), "PATCH")
                            }),
                        ),
                        4 => app.route(
                            &path,
                            web::delete().to(move |req: HttpRequest| {
                                handle_request(req.clone(), path_clone.clone(), "DELETE")
                            }),
                        ),
                        _ => app,
                    };
                }
                app
            })
            .workers(num_cpus::get())
            .bind(&addr)
            .expect("failed to bind address")
            .run()
            .await
            .expect("server run failed");
        });
    }
}

pub async fn handle_request(_req: HttpRequest, path: String, method: &str) -> HttpResponse {
    let method_code: u8 = match method {
        "GET" => 0,
        "POST" => 1,
        "PUT" => 2,
        "PATCH" => 3,
        "DELETE" => 4,
        _ => 0,
    };
    let path_bytes = path.as_bytes();
    let path_len = path_bytes.len() as u16;
    let mut buffer = Vec::with_capacity(1 + 2 + path_bytes.len());
    buffer.push(method_code);
    buffer.extend_from_slice(&path_len.to_le_bytes());
    buffer.extend_from_slice(path_bytes);

    let response_bytes = invoke_callback(&buffer);
    if response_bytes.is_empty() {
        return HttpResponse::InternalServerError().body("empty response from callback");
    }

    if response_bytes.len() < 3 {
        return HttpResponse::InternalServerError().body("invalid response format");
    }
    let status = response_bytes[0];
    let body_len = u16::from_le_bytes([response_bytes[1], response_bytes[2]]) as usize;
    if response_bytes.len() < 3 + body_len {
        return HttpResponse::InternalServerError().body("invalid response length");
    }
    let body = String::from_utf8_lossy(&response_bytes[3..3 + body_len]).to_string();
    HttpResponse::build(
        actix_web::http::StatusCode::from_u16(status as u16)
            .unwrap_or(actix_web::http::StatusCode::OK),
    )
    .body(body)
}
