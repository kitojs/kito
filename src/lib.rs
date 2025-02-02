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
pub extern "C" fn add_routes(route_data: *mut u8, num_routes: usize) {
    if route_data.is_null() {
        eprintln!("null route data pointer");
        return;
    }

    let slice = unsafe { std::slice::from_raw_parts(route_data, num_routes * 100) };

    let mut offset = 0;

    for _ in 0..num_routes {
        let path_len = slice[offset..].iter().position(|&b| b == 0).unwrap();
        let path = String::from_utf8_lossy(&slice[offset..offset + path_len]).to_string();
        offset += path_len + 1;

        let method_len = slice[offset..].iter().position(|&b| b == 0).unwrap();
        let method = String::from_utf8_lossy(&slice[offset..offset + method_len]).to_string();
        offset += method_len + 1;

        println!("route: {} {}", method, path);
        Server::add_route(path, method_type_from_string(&method));
    }
}

fn method_type_from_string(method: &str) -> u8 {
    match method {
        "GET" => 0,
        "POST" => 1,
        "PUT" => 2,
        "PATCH" => 3,
        "DELETE" => 4,
        _ => 0,
    }
}
