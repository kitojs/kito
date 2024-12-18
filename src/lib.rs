mod server;

use std::ffi::{c_char, CStr};
use server::Server;

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
