use serde::{Deserialize, Serialize};
use serde_json::Value;

use std::collections::HashMap;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum SchemaType {
    String {
        optional: bool,
        default: Option<String>,
        constraints: Vec<StringConstraint>,
    },
    Number {
        optional: bool,
        default: Option<f64>,
        constraints: Vec<NumberConstraint>,
    },
    Boolean {
        optional: bool,
        default: Option<bool>,
    },
    Array {
        optional: bool,
        default: Option<Value>,
        constraints: Vec<ArrayConstraint>,
        item: Box<SchemaType>,
    },
    Object {
        optional: bool,
        default: Option<Value>,
        shape: HashMap<String, SchemaType>,
    },
    Literal {
        optional: bool,
        default: Option<Value>,
        value: Value,
    },
    Union {
        optional: bool,
        default: Option<Value>,
        schemas: Vec<SchemaType>,
    },
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum StringConstraint {
    Min { value: usize },
    Max { value: usize },
    Length { value: usize },
    Email,
    Url,
    Uuid,
    Regex { value: String },
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum NumberConstraint {
    Min { value: f64 },
    Max { value: f64 },
    Int,
    Positive,
    Negative,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum ArrayConstraint {
    Min { value: usize },
    Max { value: usize },
    Length { value: usize },
}

#[derive(Debug, Clone)]
pub struct ValidationError {
    pub field: String,
    pub message: String,
}

impl ValidationError {
    pub fn new(field: impl Into<String>, message: impl Into<String>) -> Self {
        Self { field: field.into(), message: message.into() }
    }
}
