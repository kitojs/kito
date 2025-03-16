use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] rmp_serde::encode::Error),

    #[error("Deserialization error: {0}")]
    DeserializationError(#[from] rmp_serde::decode::Error),

    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    #[error("Regex error: {0}")]
    RegexError(#[from] regex::Error),

    #[error("Validation error: {0:?}")]
    ValidationError(Vec<String>),

    #[error("Invalid HTTP method: {0}")]
    InvalidMethodError(String),

    #[error("Callback error: {0}")]
    CallbackError(String),

    #[error("Server error: {0}")]
    ServerError(String),

    #[error("Schema error: {0}")]
    SchemaError(String),

    #[error("{0}")]
    Generic(String),
}

impl From<&str> for AppError {
    fn from(message: &str) -> Self {
        AppError::Generic(message.to_string())
    }
}

impl From<String> for AppError {
    fn from(message: String) -> Self {
        AppError::Generic(message)
    }
}
