#[derive(Clone, Default)]
#[napi(object)]
pub struct CookieOptionsCore {
    pub domain: Option<String>,
    pub http_only: Option<bool>,
    pub max_age: Option<i32>,
    pub path: Option<String>,
    pub secure: Option<bool>,
    pub signed: Option<bool>,
    pub same_site: Option<String>,
}

pub fn serialize_cookie(name: &str, value: &str, options: &CookieOptionsCore) -> String {
    let mut cookie = format!("{name}={value}");

    if let Some(max_age) = options.max_age {
        cookie.push_str(&format!("; Max-Age={max_age}"));
    }

    if let Some(ref path) = options.path {
        cookie.push_str(&format!("; Path={path}"));
    } else {
        cookie.push_str("; Path=/");
    }

    if let Some(ref domain) = options.domain {
        cookie.push_str(&format!("; Domain={domain}"));
    }

    if options.http_only.unwrap_or(false) {
        cookie.push_str("; HttpOnly");
    }

    if options.secure.unwrap_or(false) {
        cookie.push_str("; Secure");
    }

    if let Some(ref same_site) = options.same_site {
        cookie.push_str(&format!("; SameSite={same_site}"));
    }

    cookie
}
