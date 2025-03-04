#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use regex::Regex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StringOptions {
    #[serde(default)]
    pub email: bool,
    #[serde(default)]
    pub maxLength: Option<usize>,
    #[serde(default)]
    pub minLength: Option<usize>,
    #[serde(default)]
    pub pattern: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NumberOptions {
    #[serde(default)]
    pub max: Option<f64>,
    #[serde(default)]
    pub min: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ArrayOptions {
    #[serde(default)]
    pub maxItems: Option<usize>,
    #[serde(default)]
    pub minItems: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum SchemaType {
    #[serde(rename = "string")]
    String {
        #[serde(default)]
        options: Option<StringOptions>,
    },
    #[serde(rename = "number")]
    Number {
        #[serde(default)]
        options: Option<NumberOptions>,
    },
    #[serde(rename = "boolean")]
    Boolean,
    #[serde(rename = "object")]
    Object { properties: HashMap<String, SchemaType> },
    #[serde(rename = "array")]
    Array {
        items: Box<SchemaType>,
        #[serde(default)]
        options: Option<ArrayOptions>,
    },
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
        SchemaType::String { options } => {
            if !data.is_string() {
                errors.push(format!("expected string, got {:?}", data));
            } else if let Some(opts) = options {
                let str_value = data.as_str().unwrap();

                if opts.email && !is_valid_email(str_value) {
                    errors.push(format!("string '{}' is not a valid email", str_value));
                }

                if let Some(min) = opts.minLength {
                    if str_value.len() < min {
                        errors.push(format!("string length {} is less than minimum {}", str_value.len(), min));
                    }
                }

                if let Some(max) = opts.maxLength {
                    if str_value.len() > max {
                        errors.push(format!("string length {} is greater than maximum {}", str_value.len(), max));
                    }
                }

                if let Some(pattern) = &opts.pattern {
                    match Regex::new(pattern) {
                        Ok(regex) => {
                            if !regex.is_match(str_value) {
                                errors.push(format!("string '{}' does not match pattern '{}'", str_value, pattern));
                            }
                        },
                        Err(_) => {
                            errors.push(format!("invalid regex pattern: '{}'", pattern));
                        }
                    }
                }
            }
        },
        SchemaType::Number { options } => {
            if !data.is_number() {
                errors.push(format!("expected number, got {:?}", data));
            } else if let Some(opts) = options {
                let num_value = data.as_f64().unwrap();

                if let Some(min) = opts.min {
                    if num_value < min {
                        errors.push(format!("number {} is less than minimum {}", num_value, min));
                    }
                }

                if let Some(max) = opts.max {
                    if num_value > max {
                        errors.push(format!("number {} is greater than maximum {}", num_value, max));
                    }
                }
            }
        },
        SchemaType::Boolean => {
            if !data.is_boolean() {
                errors.push(format!("expected boolean, got {:?}", data));
            }
        },
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
        },
        SchemaType::Array { items, options } => {
            if !data.is_array() {
                errors.push(format!("expected array, got {:?}", data));
            } else {
                let array = data.as_array().unwrap();

                if let Some(opts) = options {
                    if let Some(min) = opts.minItems {
                        if array.len() < min {
                            errors.push(format!("array length {} is less than minimum {}", array.len(), min));
                        }
                    }

                    if let Some(max) = opts.maxItems {
                        if array.len() > max {
                            errors.push(format!("array length {} is greater than maximum {}", array.len(), max));
                        }
                    }
                }

                for (i, item) in array.iter().enumerate() {
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

fn is_valid_email(email: &str) -> bool {
    let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();
    email_regex.is_match(email)
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
                    SchemaType::String { .. } => serde_json::Value::String(param_value.clone()),
                    SchemaType::Number { .. } => {
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
