#[cfg(test)]
mod tests {
    use super::super::cookies::*;

    #[test]
    fn test_basic_cookie() {
        let options = CookieOptionsCore {
            domain: None,
            http_only: None,
            max_age: None,
            path: None,
            secure: None,
            signed: None,
            same_site: None,
        };

        let result = serialize_cookie("session", "abc123", &options);
        assert!(result.contains("session=abc123"));
        assert!(result.contains("Path=/"));
    }

    #[test]
    fn test_cookie_with_max_age() {
        let options = CookieOptionsCore {
            domain: None,
            http_only: None,
            max_age: Some(3600),
            path: None,
            secure: None,
            signed: None,
            same_site: None,
        };

        let result = serialize_cookie("token", "xyz", &options);
        assert!(result.contains("Max-Age=3600"));
    }

    #[test]
    fn test_cookie_with_custom_path() {
        let options = CookieOptionsCore {
            domain: None,
            http_only: None,
            max_age: None,
            path: Some("/admin".to_string()),
            secure: None,
            signed: None,
            same_site: None,
        };

        let result = serialize_cookie("admin", "secret", &options);
        assert!(result.contains("Path=/admin"));
    }

    #[test]
    fn test_cookie_with_domain() {
        let options = CookieOptionsCore {
            domain: Some("example.com".to_string()),
            http_only: None,
            max_age: None,
            path: None,
            secure: None,
            signed: None,
            same_site: None,
        };

        let result = serialize_cookie("user", "john", &options);
        assert!(result.contains("Domain=example.com"));
    }

    #[test]
    fn test_cookie_http_only() {
        let options = CookieOptionsCore {
            domain: None,
            http_only: Some(true),
            max_age: None,
            path: None,
            secure: None,
            signed: None,
            same_site: None,
        };

        let result = serialize_cookie("secure", "data", &options);
        assert!(result.contains("HttpOnly"));
    }

    #[test]
    fn test_cookie_secure() {
        let options = CookieOptionsCore {
            domain: None,
            http_only: None,
            max_age: None,
            path: None,
            secure: Some(true),
            signed: None,
            same_site: None,
        };

        let result = serialize_cookie("token", "value", &options);
        assert!(result.contains("Secure"));
    }

    #[test]
    fn test_cookie_same_site() {
        let options = CookieOptionsCore {
            domain: None,
            http_only: None,
            max_age: None,
            path: None,
            secure: None,
            signed: None,
            same_site: Some("Strict".to_string()),
        };

        let result = serialize_cookie("csrf", "token", &options);
        assert!(result.contains("SameSite=Strict"));
    }

    #[test]
    fn test_cookie_all_options() {
        let options = CookieOptionsCore {
            domain: Some("example.com".to_string()),
            http_only: Some(true),
            max_age: Some(7200),
            path: Some("/api".to_string()),
            secure: Some(true),
            signed: None,
            same_site: Some("Lax".to_string()),
        };

        let result = serialize_cookie("full", "options", &options);

        assert!(result.contains("full=options"));
        assert!(result.contains("Max-Age=7200"));
        assert!(result.contains("Path=/api"));
        assert!(result.contains("Domain=example.com"));
        assert!(result.contains("HttpOnly"));
        assert!(result.contains("Secure"));
        assert!(result.contains("SameSite=Lax"));
    }
}
