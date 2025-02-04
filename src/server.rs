use actix_web::rt;
use actix_web::{web, App, HttpRequest, HttpResponse, HttpServer};
use lazy_static::lazy_static;
use serde_json::json;
use std::collections::HashMap;
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
    host: String,
    port: u16,
    routes: Arc<Mutex<Vec<(String, u8)>>>,
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
            .bind(&addr)
            .expect("failed to bind address")
            .run()
            .await
            .expect("server run failed");
        });
    }
}

pub async fn handle_request(req: HttpRequest, path: String, method: &str) -> HttpResponse {
    let request_json = json!({
        "method": method,
        "path": path,
        "headers": req.headers().iter().map(|(k, v)| (k.as_str(), v.to_str().unwrap_or(""))).collect::<HashMap<_, _>>(),
        "query": req.query_string(),
    });

    let request_bytes = serde_json::to_vec(&request_json).unwrap();
    let response_bytes = invoke_callback(&request_bytes);

    if response_bytes.is_empty() {
        return HttpResponse::InternalServerError().body("empty response from callback");
    }

    let response_str = String::from_utf8_lossy(&response_bytes);
    println!("Rust received response: {}", response_str);

    match serde_json::from_str::<serde_json::Value>(&response_str) {
        Ok(response_json) => {
            let status = response_json["status"].as_u64().unwrap_or(200) as u16;
            let body = response_json["body"].as_str().unwrap_or("").to_string();

            let mut builder = HttpResponse::build(
                actix_web::http::StatusCode::from_u16(status)
                    .unwrap_or(actix_web::http::StatusCode::OK),
            );
            if let Some(headers) = response_json["headers"].as_object() {
                for (key, value) in headers {
                    builder.insert_header((key.as_str(), value.as_str().unwrap_or("")));
                }
            }
            builder.body(body)
        }
        Err(err) => {
            println!("failed to parse response JSON: {}", err);
            HttpResponse::InternalServerError().body("invalid response format")
        }
    }
}
