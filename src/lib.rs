use std::ffi::{c_char, CStr};

use actix_web::rt;
use actix_web::{web, App, HttpResponse, HttpServer};

struct Server {
    host: String,
    port: u16,
}

impl Server {
    fn new(host: String, port: u16) -> Self {
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

#[no_mangle]
pub extern "C" fn run(host: *mut c_char, port: u16) {
    if host.is_null() {
        eprintln!("null host pointer");
        return;
    }

    let host_str = unsafe {
        match CStr::from_ptr(host).to_str() {
            Ok(s) => s.to_string(),
            Err(e) => {
                eprintln!("invalid UTF-8: {}", e);
                "127.0.0.1".to_string()
            }
        }
    };

    let server = Server::new(host_str, port);
    server.listen();
}
