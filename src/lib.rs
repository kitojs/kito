mod server;

use server::Server;
use std::ffi::{c_char, CStr};

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
    Server::listen(server);
}

#[no_mangle]
pub extern "C" fn add_route(path: *mut c_char, method: *mut c_char, method_type: u8) {
    if path.is_null() || method.is_null() {
        eprintln!("null path or method pointer");
        return;
    }

    let path_str = unsafe {
        CStr::from_ptr(path)
            .to_str()
            .expect("failed to convert path to UTF-8")
            .to_string()
    };

    let method_str = unsafe {
        CStr::from_ptr(method)
            .to_str()
            .expect("failed to convert method to UTF-8")
            .to_string()
    };

    println!("route: {} {}", method_str, path_str);
    Server::add_route(path_str, method_type);
}
