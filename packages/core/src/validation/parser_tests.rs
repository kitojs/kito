#[cfg(test)]
mod tests {
    use super::super::parser::*;
    use super::super::types::*;
    use serde_json::json;
    use std::collections::HashMap;

    #[test]
    fn test_parse_params_basic() {
        let mut params = HashMap::new();
        params.insert("id".to_string(), "123".to_string());
        params.insert("name".to_string(), "john".to_string());

        let mut shape = HashMap::new();
        shape.insert(
            "id".to_string(),
            SchemaType::String { optional: false, default: None, constraints: vec![] },
        );
        shape.insert(
            "name".to_string(),
            SchemaType::String { optional: false, default: None, constraints: vec![] },
        );

        let schema = SchemaType::Object { optional: false, default: None, shape };

        let result = parse_params(&params, &schema);
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_query_single_value() {
        let mut query = HashMap::new();
        query.insert("page".to_string(), vec!["1".to_string()]);

        let mut shape = HashMap::new();
        shape.insert(
            "page".to_string(),
            SchemaType::Number { optional: false, default: None, constraints: vec![] },
        );

        let schema = SchemaType::Object { optional: false, default: None, shape };

        let result = parse_query(&query, &schema);
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_query_multiple_values() {
        let mut query = HashMap::new();
        query.insert("tags".to_string(), vec!["rust".to_string(), "web".to_string()]);

        let mut shape = HashMap::new();
        shape.insert(
            "tags".to_string(),
            SchemaType::Array {
                optional: false,
                default: None,
                constraints: vec![],
                item: Box::new(SchemaType::String {
                    optional: false,
                    default: None,
                    constraints: vec![],
                }),
            },
        );

        let schema = SchemaType::Object { optional: false, default: None, shape };

        let result = parse_query(&query, &schema);
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_body_valid_json() {
        let body = br#"{"name":"Alice","age":25}"#;

        let mut shape = HashMap::new();
        shape.insert(
            "name".to_string(),
            SchemaType::String { optional: false, default: None, constraints: vec![] },
        );
        shape.insert(
            "age".to_string(),
            SchemaType::Number { optional: false, default: None, constraints: vec![] },
        );

        let schema = SchemaType::Object { optional: false, default: None, shape };

        let result = parse_body(body, &schema);
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_body_invalid_json() {
        let body = b"not valid json";

        let schema = SchemaType::Object { optional: false, default: None, shape: HashMap::new() };

        let result = parse_body(body, &schema);
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_body_empty_with_optional() {
        let body = b"";

        let schema =
            SchemaType::Object { optional: true, default: Some(json!({})), shape: HashMap::new() };

        let result = parse_body(body, &schema);
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_body_empty_required() {
        let body = b"";

        let schema = SchemaType::Object { optional: false, default: None, shape: HashMap::new() };

        let result = parse_body(body, &schema);
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_headers() {
        let mut headers = HashMap::new();
        headers.insert("authorization".to_string(), "Bearer token123".to_string());
        headers.insert("content-type".to_string(), "application/json".to_string());

        let mut shape = HashMap::new();
        shape.insert(
            "authorization".to_string(),
            SchemaType::String { optional: false, default: None, constraints: vec![] },
        );

        let schema = SchemaType::Object { optional: false, default: None, shape };

        let result = parse_headers(&headers, &schema);
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_params_with_validation() {
        let mut params = HashMap::new();
        params.insert("id".to_string(), "550e8400-e29b-41d4-a716-446655440000".to_string());

        let mut shape = HashMap::new();
        shape.insert(
            "id".to_string(),
            SchemaType::String {
                optional: false,
                default: None,
                constraints: vec![StringConstraint::Uuid],
            },
        );

        let schema = SchemaType::Object { optional: false, default: None, shape };

        let result = parse_params(&params, &schema);
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_params_validation_fails() {
        let mut params = HashMap::new();
        params.insert("id".to_string(), "not-a-uuid".to_string());

        let mut shape = HashMap::new();
        shape.insert(
            "id".to_string(),
            SchemaType::String {
                optional: false,
                default: None,
                constraints: vec![StringConstraint::Uuid],
            },
        );

        let schema = SchemaType::Object { optional: false, default: None, shape };

        let result = parse_params(&params, &schema);
        assert!(result.is_err());
    }
}
