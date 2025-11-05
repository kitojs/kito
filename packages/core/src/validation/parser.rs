use serde_json::{Map, Value, from_slice};

use super::types::*;
use crate::validation::validate_value;

use std::collections::HashMap;

pub fn parse_params(
    params: &HashMap<String, String>,
    schema: &SchemaType,
) -> Result<Value, ValidationError> {
    let mut obj = Map::new();
    for (key, value) in params {
        obj.insert(key.clone(), Value::String(value.clone()));
    }

    validate_value(&Value::Object(obj), schema, "params")
}

pub fn parse_query(
    query: &HashMap<String, Vec<String>>,
    schema: &SchemaType,
) -> Result<Value, ValidationError> {
    let mut obj = Map::new();
    for (key, values) in query {
        if values.len() == 1 {
            obj.insert(key.clone(), Value::String(values[0].clone()));
        } else if values.is_empty() {
            obj.insert(key.clone(), Value::Null);
        } else {
            let arr: Vec<Value> = values.iter().map(|v| Value::String(v.clone())).collect();
            obj.insert(key.clone(), Value::Array(arr));
        }
    }

    validate_value(&Value::Object(obj), schema, "query")
}

pub fn parse_body(body: &[u8], schema: &SchemaType) -> Result<Value, ValidationError> {
    if body.is_empty() {
        if let SchemaType::Object { optional: true, default, .. } = schema {
            return Ok(default.clone().unwrap_or(Value::Null));
        }
        return Err(ValidationError::new("body", "Request body is required"));
    }

    let body_value: Value =
        from_slice(body).map_err(|_| ValidationError::new("body", "Invalid JSON"))?;

    validate_value(&body_value, schema, "body")
}

pub fn parse_headers(
    headers: &HashMap<String, String>,
    schema: &SchemaType,
) -> Result<Value, ValidationError> {
    let mut obj = Map::new();
    for (key, value) in headers {
        obj.insert(key.clone(), Value::String(value.clone()));
    }

    validate_value(&Value::Object(obj), schema, "headers")
}
