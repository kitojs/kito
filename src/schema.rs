use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum SchemaType {
    #[serde(rename = "string")]
    String,
    #[serde(rename = "number")]
    Number,
    #[serde(rename = "boolean")]
    Boolean,
    #[serde(rename = "object")]
    Object { properties: HashMap<String, SchemaType> },
    #[serde(rename = "array")]
    Array { items: Box<SchemaType> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteSchema {
    pub params: Option<HashMap<String, SchemaType>>,
    pub response: Option<SchemaType>,
}

pub fn validate_schema(
    data: &serde_json::Value,
    schema: &SchemaType,
) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    match schema {
        SchemaType::String => {
            if !data.is_string() {
                errors.push(format!("expected string, got {:?}", data));
            }
        }
        SchemaType::Number => {
            if !data.is_number() {
                errors.push(format!("expected number, got {:?}", data));
            }
        }
        SchemaType::Boolean => {
            if !data.is_boolean() {
                errors.push(format!("expected boolean, got {:?}", data));
            }
        }
        SchemaType::Object { properties } => {
            if !data.is_object() {
                errors.push(format!("expected object, got {:?}", data));
            } else {
                let obj = data.as_object().unwrap();
                for (key, prop_schema) in properties {
                    if let Some(value) = obj.get(key) {
                        if let Err(prop_errors) = validate_schema(value, prop_schema) {
                            for err in prop_errors {
                                errors.push(format!("{}.{}", key, err));
                            }
                        }
                    } else {
                        errors.push(format!("missing property: {}", key));
                    }
                }
            }
        }
        SchemaType::Array { items } => {
            if !data.is_array() {
                errors.push(format!("expected array, got {:?}", data));
            } else {
                for (i, item) in data.as_array().unwrap().iter().enumerate() {
                    if let Err(item_errors) = validate_schema(item, items) {
                        for err in item_errors {
                            errors.push(format!("[{}].{}", i, err));
                        }
                    }
                }
            }
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

pub fn validate_params(
    params: &HashMap<String, String>,
    schema: &Option<HashMap<String, SchemaType>>,
) -> Result<(), Vec<String>> {
    if let Some(param_schema) = schema {
        let mut errors = Vec::new();

        for (key, schema_type) in param_schema {
            if let Some(param_value) = params.get(key) {
                let converted_value = match schema_type {
                    SchemaType::String => serde_json::Value::String(param_value.clone()),
                    SchemaType::Number => {
                        if let Ok(num) = param_value.parse::<f64>() {
                            serde_json::Value::Number(serde_json::Number::from_f64(num).unwrap())
                        } else {
                            errors.push(format!("param '{}' is not a valid number", key));
                            continue;
                        }
                    }
                    SchemaType::Boolean => {
                        if let Ok(b) = param_value.parse::<bool>() {
                            serde_json::Value::Bool(b)
                        } else {
                            errors.push(format!("param '{}' is not a valid boolean", key));
                            continue;
                        }
                    }
                    _ => {
                        match serde_json::from_str(param_value) {
                            Ok(val) => val,
                            Err(_) => {
                                errors.push(format!("param '{}' is not valid for its schema type", key));
                                continue;
                            }
                        }
                    }
                };

                if let Err(validation_errors) = validate_schema(&converted_value, schema_type) {
                    for err in validation_errors {
                        errors.push(format!("param '{}': {}", key, err));
                    }
                }
            } else {
                errors.push(format!("missing required param: {}", key));
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    } else {
        Ok(())
    }
}
