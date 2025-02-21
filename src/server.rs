use actix_web::cookie::Cookie as ActixCookie;
use actix_web::http::header;
use actix_web::rt;
use actix_web::{web, App, HttpRequest, HttpResponse, HttpServer};
use num_cpus;
use std::collections::HashMap;
use std::sync::Arc;

use crate::invoke_callback;
use rmp_serde::{from_slice, to_vec};
use serde::Deserialize;
use serde_json::json;

pub struct Server {
    pub routes: Vec<(Arc<str>, u8)>,
}

impl Server {
    pub fn new() -> Server {
        Server {
            routes: Vec::new(),
        }
    }

    pub fn add_route(&mut self, path: String, method_type: u8) {
        let arc_path: Arc<str> = Arc::from(path);
        self.routes.push((arc_path, method_type));
    }

    pub fn listen(self, host: String, port: u16) {
        let addr = format!("{}:{}", host, port);
        let routes_vec = self.routes;

        rt::System::new().block_on(async move {
            HttpServer::new(move || {
                let mut app = App::new();
                for (route_path, method) in &routes_vec {
                    let path_clone = Arc::clone(route_path);
                    match method {
                        0 => {
                            app = app.route(
                                &*path_clone,
                                web::get().to({
                                    let path_inner = Arc::clone(&path_clone);
                                    move |req: HttpRequest| {
                                        handle_request(req, Arc::clone(&path_inner), "GET")
                                    }
                                }),
                            );
                        }
                        1 => {
                            app = app.route(
                                &*path_clone,
                                web::post().to({
                                    let path_inner = Arc::clone(&path_clone);
                                    move |req: HttpRequest| {
                                        handle_request(req, Arc::clone(&path_inner), "POST")
                                    }
                                }),
                            );
                        }
                        2 => {
                            app = app.route(
                                &*path_clone,
                                web::put().to({
                                    let path_inner = Arc::clone(&path_clone);
                                    move |req: HttpRequest| {
                                        handle_request(req, Arc::clone(&path_inner), "PUT")
                                    }
                                }),
                            );
                        }
                        3 => {
                            app = app.route(
                                &*path_clone,
                                web::patch().to({
                                    let path_inner = Arc::clone(&path_clone);
                                    move |req: HttpRequest| {
                                        handle_request(req, Arc::clone(&path_inner), "PATCH")
                                    }
                                }),
                            );
                        }
                        4 => {
                            app = app.route(
                                &*path_clone,
                                web::delete().to({
                                    let path_inner = Arc::clone(&path_clone);
                                    move |req: HttpRequest| {
                                        handle_request(req, Arc::clone(&path_inner), "DELETE")
                                    }
                                }),
                            );
                        }
                        _ => {}
                    }
                }
                app
            })
            .workers(num_cpus::get() * 2)
            .bind(&addr)
            .expect("failed to bind address")
            .run()
            .await
            .expect("server run failed");
        });
    }
}

#[derive(Debug, Deserialize)]
struct Response {
    status: u16,
    #[serde(default)]
    headers: HashMap<String, String>,
    #[serde(default)]
    cookies: Vec<Cookie>,
    #[serde(default)]
    redirect: Option<String>,
    #[serde(default)]
    append_headers: HashMap<String, String>,
    body: String,
    #[serde(default)]
    end: bool,
}

#[derive(Debug, Deserialize)]
struct Cookie {
    name: String,
    value: String,
    #[serde(default)]
    options: HashMap<String, String>,
}

pub async fn handle_request(req: HttpRequest, path: Arc<str>, method: &str) -> HttpResponse {
    let params: HashMap<String, String> = req.match_info()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();

    let request_obj = json!({
        "method": method,
        "path": &*path,
        "headers": req
            .headers()
            .iter()
            .map(|(k, v)| (k.as_str(), v.to_str().unwrap_or("")))
            .collect::<HashMap<_, _>>(),
        "query": req.query_string(),
        "url": req.uri().to_string(),
        "params": params,
    });

    let request_bytes = to_vec(&request_obj).unwrap();
    let response_bytes = invoke_callback(&request_bytes);

    if response_bytes.is_empty() {
        return HttpResponse::InternalServerError().body("empty response from callback");
    }

    let response_obj: Response = from_slice(&response_bytes).unwrap_or_else(|e| {
        println!("failed to decode messagepack response: {}", e);
        Response {
            status: 500,
            headers: HashMap::new(),
            cookies: vec![],
            redirect: None,
            append_headers: HashMap::new(),
            body: "Internal Server Error".to_string(),
            end: false,
        }
    });

    let mut builder = HttpResponse::build(
        actix_web::http::StatusCode::from_u16(response_obj.status)
            .unwrap_or(actix_web::http::StatusCode::OK),
    );

    for (key, value) in response_obj.headers.iter() {
        builder.insert_header((key.as_str(), value.as_str()));
    }

    for (key, value) in response_obj.append_headers.iter() {
        builder.append_header((key.as_str(), value.as_str()));
    }

    for cookie in response_obj.cookies.iter() {
        let mut actix_cookie = ActixCookie::build(cookie.name.clone(), cookie.value.clone());
        for (opt_key, opt_value) in cookie.options.iter() {
            match opt_key.as_str() {
                "path" => {
                    actix_cookie = actix_cookie.path(opt_value.clone());
                }
                "domain" => {
                    actix_cookie = actix_cookie.domain(opt_value.clone());
                }
                "secure" if opt_value == "true" => {
                    actix_cookie = actix_cookie.secure(true);
                }
                "httpOnly" if opt_value == "true" => {
                    actix_cookie = actix_cookie.http_only(true);
                }
                "sameSite" => match opt_value.to_lowercase().as_str() {
                    "lax" => {
                        actix_cookie = actix_cookie.same_site(actix_web::cookie::SameSite::Lax)
                    }
                    "strict" => {
                        actix_cookie = actix_cookie.same_site(actix_web::cookie::SameSite::Strict)
                    }
                    "none" => {
                        actix_cookie = actix_cookie.same_site(actix_web::cookie::SameSite::None)
                    }
                    _ => {}
                },
                "maxAge" => {
                    if let Ok(seconds) = opt_value.parse::<i64>() {
                        actix_cookie = actix_cookie
                            .max_age(actix_web::cookie::time::Duration::seconds(seconds));
                    }
                }
                "expires" => {
                    if let Ok(timestamp) = opt_value.parse::<i64>() {
                        actix_cookie = actix_cookie.expires(
                            actix_web::cookie::time::OffsetDateTime::from_unix_timestamp(timestamp)
                                .unwrap(),
                        );
                    }
                }
                _ => {}
            }
        }
        builder.cookie(actix_cookie.finish());
    }

    if let Some(redirect_url) = &response_obj.redirect {
        return builder
            .status(actix_web::http::StatusCode::FOUND)
            .insert_header((header::LOCATION, redirect_url.as_str()))
            .finish();
    }

    if response_obj.end {
        return builder.finish();
    }

    builder.body(response_obj.body)
}
