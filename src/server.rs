use actix_web::rt;
use actix_web::{web, App, HttpResponse, HttpServer};

pub struct Server {
    host: String,
    port: u16,
}

impl Server {
    pub fn new(host: String, port: u16) -> Self {
        Server { host, port }
    }

    pub fn listen(&self) {
        let addr = format!("{}:{}", self.host, self.port);
        rt::System::new().block_on(async {
            HttpServer::new(|| {
                App::new().service(
                    web::resource("/").to(|| async { HttpResponse::Ok().body("Hello world!") }),
                )
            })
            .bind(&addr)
            .expect("failed to bind address")
            .run()
            .await
            .expect("server run failed");
        });
    }
}
