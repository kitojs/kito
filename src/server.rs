use actix_web::rt;
use actix_web::{web, App, HttpResponse, HttpServer};
use lazy_static::lazy_static;
use std::sync::{Arc, Mutex};

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
                    match method {
                        0 => {
                            app = app.route(
                                path,
                                web::get().to(|| async {
                                    HttpResponse::Ok().body("GET route")
                                }),
                            )
                        }
                        1 => {
                            app = app.route(
                                path,
                                web::post().to(|| async {
                                    HttpResponse::Ok().body("POST route")
                                }),
                            )
                        }
                        2 => {
                            app = app.route(
                                path,
                                web::put().to(|| async {
                                    HttpResponse::Ok().body("PUT route")
                                }),
                            )
                        }
                        3 => {
                            app = app.route(
                                path,
                                web::patch().to(|| async {
                                    HttpResponse::Ok().body("PATCH route")
                                }),
                            )
                        }
                        4 => {
                            app = app.route(
                                path,
                                web::delete().to(|| async {
                                    HttpResponse::Ok().body("DELETE route")
                                }),
                            )
                        }
                        _ => {}
                    }
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
