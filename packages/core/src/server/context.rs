use crate::http::{request::RequestCore, response::ResponseBuilderCore};
use napi::{
    Env,
    bindgen_prelude::{External, Object, ToNapiValue},
    sys,
};
use std::sync::Arc;

pub struct ContextObject {
    pub req: External<Arc<RequestCore>>,
    pub res: External<Arc<ResponseBuilderCore>>,
}

impl ToNapiValue for ContextObject {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> napi::Result<sys::napi_value> {
        let mut obj = Object::new(&Env::from_raw(env))?;
        obj.set("req", val.req)?;
        obj.set("res", val.res)?;
        unsafe { Object::to_napi_value(env, obj) }
    }
}
