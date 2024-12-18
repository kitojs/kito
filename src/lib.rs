use std::ffi::{c_char, CStr};

use actix_web::rt;
use actix_web::{web, App, HttpResponse, HttpServer};

fn listen(host: String, port: u16) {
    let addr = format!("{}:{}", host, port);
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

    listen(host_str, port);
}
