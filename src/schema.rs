#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::RwLock};
use regex::Regex;
use std::sync::OnceLock;
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
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

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct NumberOptions {
    #[serde(default)]
    pub max: Option<f64>,
    #[serde(default)]
    pub min: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
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

#[derive(Debug, Clone)]
pub struct ValidationErrors {
    pub errors: Vec<String>,
}

impl From<Vec<String>> for ValidationErrors {
    fn from(errors: Vec<String>) -> Self {
        ValidationErrors { errors }
    }
}

#[inline(always)]
fn email_regex() -> &'static Regex {
    static EMAIL_REGEX: OnceLock<Regex> = OnceLock::new();
    EMAIL_REGEX.get_or_init(|| Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap())
}

#[inline(always)]
fn is_valid_email(email: &str) -> bool {
    email_regex().is_match(email)
}

#[inline(always)]
fn get_compiled_regex(pattern: &str) -> Result<Regex, AppError> {
    static REGEX_CACHE: OnceLock<RwLock<HashMap<String, Regex>>> = OnceLock::new();
    let cache_lock = REGEX_CACHE.get_or_init(|| RwLock::new(HashMap::new()));

    {
        let cache = cache_lock.read().map_err(|_| AppError::SchemaError("failed to acquire read lock on regex cache".into()))?;
        if let Some(regex) = cache.get(pattern) {
            return Ok(regex.clone());
        }
    }

    let regex = Regex::new(pattern)?;

    {
        let mut cache = cache_lock.write().map_err(|_| AppError::SchemaError("failed to acquire write lock on regex cache".into()))?;
        cache.entry(pattern.to_string()).or_insert_with(|| regex.clone());
    }

    Ok(regex)
}

#[inline(always)]
pub fn validate_schema(
    data: &serde_json::Value,
    schema: &SchemaType,
) -> Result<(), ValidationErrors> {
    let mut errors = Vec::new();
    validate_schema_internal(data, schema, &mut errors);
    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationErrors { errors })
    }
}

#[inline(always)]
fn validate_schema_internal(
    data: &serde_json::Value,
    schema: &SchemaType,
    errors: &mut Vec<String>,
) {
    match schema {
        SchemaType::String { options } => {
            if let Some(str_value) = data.as_str() {
                if let Some(opts) = options {
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
                        match get_compiled_regex(pattern) {
                            Ok(regex) => {
                                if !regex.is_match(str_value) {
                                    errors.push(format!("string '{}' does not match pattern '{}'", str_value, pattern));
                                }
                            },
                            Err(err) => {
                                errors.push(format!("invalid regex pattern '{}': {}", pattern, err));
                            }
                        }
                    }
                }
            } else {
                errors.push(format!("expected string, got {:?}", data));
            }
        },
        SchemaType::Number { options } => {
            if let Some(num_value) = data.as_f64() {
                if let Some(opts) = options {
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
            } else {
                errors.push(format!("expected number, got {:?}", data));
            }
        },
        SchemaType::Boolean => {
            if !data.is_boolean() {
                errors.push(format!("expected boolean, got {:?}", data));
            }
        },
        SchemaType::Object { properties } => {
            if let Some(obj) = data.as_object() {
                for (key, prop_schema) in properties {
                    if let Some(value) = obj.get(key) {
                        let mut prop_errors = Vec::new();
                        validate_schema_internal(value, prop_schema, &mut prop_errors);
                        for err in prop_errors {
                            errors.push(format!("{}.{}", key, err));
                        }
                    } else {
                        errors.push(format!("missing property: {}", key));
                    }
                }
            } else {
                errors.push(format!("expected object, got {:?}", data));
            }
        },
        SchemaType::Array { items, options } => {
            if let Some(array) = data.as_array() {
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
                    let mut item_errors = Vec::new();
                    validate_schema_internal(item, items, &mut item_errors);
                    for err in item_errors {
                        errors.push(format!("[{}].{}", i, err));
                    }
                }
            } else {
                errors.push(format!("expected array, got {:?}", data));
            }
        }
    }
}

pub fn validate_params(
    params: &HashMap<String, String>,
    schema: &Option<HashMap<String, SchemaType>>,
) -> Result<(), ValidationErrors> {
    if let Some(param_schema) = schema {
        let mut errors = Vec::new();
        for (key, schema_type) in param_schema {
            match params.get(key) {
                Some(param_value) => {
                    let converted_value = match schema_type {
                        SchemaType::String { .. } => serde_json::Value::String(param_value.clone()),
                        SchemaType::Number { .. } => {
                            match param_value.parse::<f64>() {
                                Ok(num) => {
                                    if let Some(num_json) = serde_json::Number::from_f64(num) {
                                        serde_json::Value::Number(num_json)
                                    } else {
                                        errors.push(format!("param '{}': cannot represent {} as JSON number", key, num));
                                        continue;
                                    }
                                },
                                Err(_) => {
                                    errors.push(format!("param '{}' is not a valid number", key));
                                    continue;
                                }
                            }
                        },
                        SchemaType::Boolean => {
                            match param_value.parse::<bool>() {
                                Ok(b) => serde_json::Value::Bool(b),
                                Err(_) => {
                                    errors.push(format!("param '{}' is not a valid boolean", key));
                                    continue;
                                }
                            }
                        },
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
                        for err in validation_errors.errors {
                            errors.push(format!("param '{}': {}", key, err));
                        }
                    }
                },
                None => errors.push(format!("missing required param: {}", key)),
            }
        }
        if errors.is_empty() {
            Ok(())
        } else {
            Err(ValidationErrors { errors })
        }
    } else {
        Ok(())
    }
}
