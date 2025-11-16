use super::types::*;

use regex::Regex;
use serde_json::{Map, Number, Value};

pub fn validate_string(
    value: &str,
    constraints: &[StringConstraint],
) -> Result<(), ValidationError> {
    let uuid_regex = Regex::new(
        r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
    )
    .unwrap();
    let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();

    for constraint in constraints {
        match constraint {
            StringConstraint::Min { value: min } => {
                if value.len() < *min {
                    return Err(ValidationError::new(
                        "",
                        format!("String must be at least {min} characters long"),
                    ));
                }
            }
            StringConstraint::Max { value: max } => {
                if value.len() > *max {
                    return Err(ValidationError::new(
                        "",
                        format!("String must be at most {max} characters long"),
                    ));
                }
            }
            StringConstraint::Length { value: length } => {
                if value.len() != *length {
                    return Err(ValidationError::new(
                        "",
                        format!("String must be exactly {length} characters long"),
                    ));
                }
            }
            StringConstraint::Email => {
                if !email_regex.is_match(value) {
                    return Err(ValidationError::new("", "Invalid email format"));
                }
            }
            StringConstraint::Url => {
                if !value.starts_with("http://") && !value.starts_with("https://") {
                    return Err(ValidationError::new("", "Invalid URL format"));
                }
            }
            StringConstraint::Uuid => {
                if !uuid_regex.is_match(value) {
                    return Err(ValidationError::new("", "Invalid UUID format"));
                }
            }
            StringConstraint::Regex { value: pattern } => {
                let regex = Regex::new(pattern)
                    .map_err(|_| ValidationError::new("", "Invalid regex pattern"))?;

                if !regex.is_match(value) {
                    return Err(ValidationError::new("", "String does not match pattern"));
                }
            }
        }
    }
    Ok(())
}

pub fn validate_number(
    value: f64,
    constraints: &[NumberConstraint],
) -> Result<(), ValidationError> {
    for constraint in constraints {
        match constraint {
            NumberConstraint::Min { value: min } => {
                if value < *min {
                    return Err(ValidationError::new("", format!("Number must be at least {min}")));
                }
            }
            NumberConstraint::Max { value: max } => {
                if value > *max {
                    return Err(ValidationError::new("", format!("Number must be at most {max}")));
                }
            }
            NumberConstraint::Int => {
                if value.fract() != 0.0 {
                    return Err(ValidationError::new("", "Number must be an integer"));
                }
            }
            NumberConstraint::Positive => {
                if value <= 0.0 {
                    return Err(ValidationError::new("", "Number must be positive"));
                }
            }
            NumberConstraint::Negative => {
                if value >= 0.0 {
                    return Err(ValidationError::new("", "Number must be negative"));
                }
            }
        }
    }
    Ok(())
}

pub fn validate_value(
    value: &Value,
    schema: &SchemaType,
    field_path: &str,
) -> Result<Value, ValidationError> {
    match schema {
        SchemaType::String { optional, default, constraints } => {
            if value.is_null() {
                if *optional {
                    return Ok(default
                        .as_ref()
                        .map(|d| Value::String(d.clone()))
                        .unwrap_or(Value::Null));
                }
                return Err(ValidationError::new(field_path, "Field is required"));
            }

            let str_value = value
                .as_str()
                .ok_or_else(|| ValidationError::new(field_path, "Expected string"))?;

            validate_string(str_value, constraints)
                .map_err(|e| ValidationError::new(field_path, e.message))?;

            Ok(value.clone())
        }
        SchemaType::Number { optional, default, constraints } => {
            if value.is_null() {
                if *optional {
                    return Ok(default
                        .as_ref()
                        .map(|d| Value::Number(Number::from_f64(*d).unwrap()))
                        .unwrap_or(Value::Null));
                }
                return Err(ValidationError::new(field_path, "Field is required"));
            }

            let num_value = if let Some(n) = value.as_f64() {
                n
            } else if let Some(s) = value.as_str() {
                s.parse::<f64>()
                    .map_err(|_| ValidationError::new(field_path, "Invalid number format"))?
            } else {
                return Err(ValidationError::new(field_path, "Expected number"));
            };

            validate_number(num_value, constraints)
                .map_err(|e| ValidationError::new(field_path, e.message))?;

            Ok(Value::Number(Number::from_f64(num_value).unwrap()))
        }
        SchemaType::Boolean { optional, default } => {
            if value.is_null() {
                if *optional {
                    return Ok(default.as_ref().map(|d| Value::Bool(*d)).unwrap_or(Value::Null));
                }
                return Err(ValidationError::new(field_path, "Field is required"));
            }

            if let Some(b) = value.as_bool() {
                Ok(Value::Bool(b))
            } else if let Some(s) = value.as_str() {
                match s.to_lowercase().as_str() {
                    "true" | "1" => Ok(Value::Bool(true)),
                    "false" | "0" => Ok(Value::Bool(false)),
                    _ => Err(ValidationError::new(field_path, "Invalid boolean value")),
                }
            } else {
                Err(ValidationError::new(field_path, "Expected boolean"))
            }
        }
        SchemaType::Array { optional, default, constraints, item } => {
            if value.is_null() {
                if *optional {
                    return Ok(default.clone().unwrap_or(Value::Null));
                }
                return Err(ValidationError::new(field_path, "Field is required"));
            }

            let arr = value
                .as_array()
                .ok_or_else(|| ValidationError::new(field_path, "Expected array"))?;

            for constraint in constraints {
                match constraint {
                    ArrayConstraint::Min { value: min } => {
                        if arr.len() < *min {
                            return Err(ValidationError::new(
                                field_path,
                                format!("Array must have at least {min} items"),
                            ));
                        }
                    }
                    ArrayConstraint::Max { value: max } => {
                        if arr.len() > *max {
                            return Err(ValidationError::new(
                                field_path,
                                format!("Array must have at most {max} items"),
                            ));
                        }
                    }
                    ArrayConstraint::Length { value: length } => {
                        if arr.len() != *length {
                            return Err(ValidationError::new(
                                field_path,
                                format!("Array must have exactly {length} items"),
                            ));
                        }
                    }
                }
            }

            let mut validated_items = Vec::new();
            for (i, item_value) in arr.iter().enumerate() {
                let item_path = format!("{field_path}[{i}]");
                let validated = validate_value(item_value, item, &item_path)?;
                validated_items.push(validated);
            }

            Ok(Value::Array(validated_items))
        }
        SchemaType::Object { optional, default, shape } => {
            if value.is_null() || (value.is_object() && value.as_object().unwrap().is_empty()) {
                if *optional {
                    return Ok(default.clone().unwrap_or(Value::Null));
                }

                if shape.is_empty() {
                    return Ok(Value::Object(Map::new()));
                }
                return Err(ValidationError::new(field_path, "Field is required"));
            }

            let obj = value
                .as_object()
                .ok_or_else(|| ValidationError::new(field_path, "Expected object"))?;

            let mut validated_obj = Map::new();

            for (key, field_schema) in shape {
                let field_value = obj.get(key).cloned().unwrap_or(Value::Null);
                let new_path =
                    if field_path.is_empty() { key.clone() } else { format!("{field_path}.{key}") };
                let validated = validate_value(&field_value, field_schema, &new_path)?;

                if !validated.is_null()
                    || matches!(
                        field_schema,
                        SchemaType::String { optional: false, .. }
                            | SchemaType::Number { optional: false, .. }
                            | SchemaType::Boolean { optional: false, .. }
                    )
                {
                    validated_obj.insert(key.clone(), validated);
                }
            }

            Ok(Value::Object(validated_obj))
        }
        SchemaType::Literal { optional, default, value: literal_value } => {
            if value.is_null() {
                if *optional {
                    return Ok(default.clone().unwrap_or(Value::Null));
                }
                return Err(ValidationError::new(field_path, "Field is required"));
            }

            let compare_value = if value.is_string() {
                value.clone()
            } else if literal_value.is_string() && !value.is_string() {
                Value::String(value.to_string())
            } else {
                value.clone()
            };

            if &compare_value != literal_value {
                return Err(ValidationError::new(
                    field_path,
                    format!("Value must be exactly {literal_value:?}"),
                ));
            }

            Ok(value.clone())
        }
        SchemaType::Union { optional, default, schemas } => {
            if value.is_null() {
                if *optional {
                    return Ok(default.clone().unwrap_or(Value::Null));
                }
                return Err(ValidationError::new(field_path, "Field is required"));
            }

            for schema in schemas {
                if let Ok(validated) = validate_value(value, schema, field_path) {
                    return Ok(validated);
                }
            }

            Err(ValidationError::new(field_path, "Value does not match any union type"))
        }
    }
}
