mod error;
mod schema;
mod server;

use error::AppError;
use napi_derive::napi;
use server::Server;

static mut CALLBACK_PTR: Option<extern "C" fn(*const u8, usize) -> *const u8> = None;

#[no_mangle]
#[inline(always)]
pub extern "C" fn register_callback(callback: extern "C" fn(*const u8, usize) -> *const u8) {
    unsafe {
        CALLBACK_PTR = Some(callback);
    }
}

#[inline(always)]
pub fn invoke_callback(data: &[u8]) -> Result<Vec<u8>, AppError> {
    unsafe {
        if let Some(callback) = CALLBACK_PTR {
            let ptr = callback(data.as_ptr(), data.len());
            if !ptr.is_null() {
                let len = *(ptr as *const usize);
                let bytes = std::slice::from_raw_parts(ptr.add(8), len);
                return Ok(bytes.to_vec());
            }
            return Err(AppError::CallbackError(
                "callback returned null pointer".into(),
            ));
        }
    }

    Err(AppError::CallbackError("callback not registered".into()))
}

#[derive(Debug)]
#[napi(object)]
pub struct Route {
    pub path: String,
    pub method: String,
    //pub schema: Option<RouteSchema>,
}

#[derive(Debug)]
#[napi(object)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub routes: Vec<Route>,
}

#[napi]
pub fn run(config: Config) {
    let mut server = Server::new();
    for route in config.routes {
        println!("route: {} {}", route.method, route.path);
        if let Err(e) = server.add_route(route.path, method_type_from_string(&route.method), None) {
            eprintln!("error adding route: {}", e);
            return;
        }
    }

    if let Err(e) = server.listen(config.host, config.port) {
        eprintln!("server error: {}", e);
    }
}

#[inline(always)]
fn method_type_from_string(method: &str) -> Result<u8, AppError> {
    match method {
        "GET" => Ok(0),
        "POST" => Ok(1),
        "PUT" => Ok(2),
        "PATCH" => Ok(3),
        "DELETE" => Ok(4),
        _ => Err(AppError::InvalidMethodError(method.to_string())),
    }
}
