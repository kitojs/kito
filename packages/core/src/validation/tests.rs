#[cfg(test)]
mod tests {
    use super::super::{types::*, validators::*};
    use serde_json::{Value, json};
    use std::collections::HashMap;

    #[test]
    fn test_string_min_length() {
        let constraints = vec![StringConstraint::Min { value: 5 }];

        assert!(validate_string("hello", &constraints).is_ok());
        assert!(validate_string("hi", &constraints).is_err());
    }

    #[test]
    fn test_string_max_length() {
        let constraints = vec![StringConstraint::Max { value: 5 }];

        assert!(validate_string("hello", &constraints).is_ok());
        assert!(validate_string("hello world", &constraints).is_err());
    }

    #[test]
    fn test_string_email() {
        let constraints = vec![StringConstraint::Email];

        assert!(validate_string("user@example.com", &constraints).is_ok());
        assert!(validate_string("invalid-email", &constraints).is_err());
        assert!(validate_string("no@domain", &constraints).is_err());
    }

    #[test]
    fn test_string_uuid() {
        let constraints = vec![StringConstraint::Uuid];

        assert!(validate_string("550e8400-e29b-41d4-a716-446655440000", &constraints).is_ok());
        assert!(validate_string("not-a-uuid", &constraints).is_err());
    }

    #[test]
    fn test_number_min() {
        let constraints = vec![NumberConstraint::Min { value: 10.0 }];

        assert!(validate_number(15.0, &constraints).is_ok());
        assert!(validate_number(5.0, &constraints).is_err());
    }

    #[test]
    fn test_number_max() {
        let constraints = vec![NumberConstraint::Max { value: 100.0 }];

        assert!(validate_number(50.0, &constraints).is_ok());
        assert!(validate_number(150.0, &constraints).is_err());
    }

    #[test]
    fn test_number_int() {
        let constraints = vec![NumberConstraint::Int];

        assert!(validate_number(42.0, &constraints).is_ok());
        assert!(validate_number(42.5, &constraints).is_err());
    }

    #[test]
    fn test_number_positive() {
        let constraints = vec![NumberConstraint::Positive];

        assert!(validate_number(10.0, &constraints).is_ok());
        assert!(validate_number(-5.0, &constraints).is_err());
        assert!(validate_number(0.0, &constraints).is_err());
    }

    #[test]
    fn test_validate_string_value() {
        let schema = SchemaType::String {
            optional: false,
            default: None,
            constraints: vec![StringConstraint::Min { value: 3 }],
        };

        assert!(validate_value(&json!("hello"), &schema, "field").is_ok());
        assert!(validate_value(&json!("hi"), &schema, "field").is_err());
        assert!(validate_value(&Value::Null, &schema, "field").is_err());
    }

    #[test]
    fn test_validate_optional_with_default() {
        let schema = SchemaType::String {
            optional: true,
            default: Some("default".to_string()),
            constraints: vec![],
        };

        let result = validate_value(&Value::Null, &schema, "field").unwrap();
        assert_eq!(result, json!("default"));
    }

    #[test]
    fn test_validate_number_from_string() {
        let schema = SchemaType::Number { optional: false, default: None, constraints: vec![] };

        assert!(validate_value(&json!("42"), &schema, "field").is_ok());
        assert!(validate_value(&json!("not-a-number"), &schema, "field").is_err());
    }

    #[test]
    fn test_validate_boolean_from_string() {
        let schema = SchemaType::Boolean { optional: false, default: None };

        assert_eq!(validate_value(&json!("true"), &schema, "field").unwrap(), json!(true));
        assert_eq!(validate_value(&json!("false"), &schema, "field").unwrap(), json!(false));
        assert_eq!(validate_value(&json!("1"), &schema, "field").unwrap(), json!(true));
        assert_eq!(validate_value(&json!("0"), &schema, "field").unwrap(), json!(false));
    }

    #[test]
    fn test_validate_array() {
        let item_schema =
            SchemaType::Number { optional: false, default: None, constraints: vec![] };

        let schema = SchemaType::Array {
            optional: false,
            default: None,
            constraints: vec![ArrayConstraint::Min { value: 2 }],
            item: Box::new(item_schema),
        };

        assert!(validate_value(&json!([1, 2, 3]), &schema, "field").is_ok());
        assert!(validate_value(&json!([1]), &schema, "field").is_err());
    }

    #[test]
    fn test_validate_object() {
        let mut shape = HashMap::new();
        shape.insert(
            "name".to_string(),
            SchemaType::String { optional: false, default: None, constraints: vec![] },
        );
        shape.insert(
            "age".to_string(),
            SchemaType::Number {
                optional: false,
                default: None,
                constraints: vec![NumberConstraint::Positive],
            },
        );

        let schema = SchemaType::Object { optional: false, default: None, shape };

        let valid_value = json!({
            "name": "Alice",
            "age": 25
        });

        let invalid_value = json!({
            "name": "Bob",
            "age": -5
        });

        assert!(validate_value(&valid_value, &schema, "field").is_ok());
        assert!(validate_value(&invalid_value, &schema, "field").is_err());
    }

    #[test]
    fn test_validate_literal() {
        let schema = SchemaType::Literal { optional: false, default: None, value: json!("admin") };

        assert!(validate_value(&json!("admin"), &schema, "field").is_ok());
        assert!(validate_value(&json!("user"), &schema, "field").is_err());
    }

    #[test]
    fn test_validate_union() {
        let schemas = vec![
            SchemaType::String { optional: false, default: None, constraints: vec![] },
            SchemaType::Number { optional: false, default: None, constraints: vec![] },
        ];

        let schema = SchemaType::Union { optional: false, default: None, schemas };

        assert!(validate_value(&json!("hello"), &schema, "field").is_ok());
        assert!(validate_value(&json!(42), &schema, "field").is_ok());
        assert!(validate_value(&json!(true), &schema, "field").is_err());
    }
}
