#[macro_export]
macro_rules! register_commands {
    ($($name:ident),*) => {
        $(
            pub(crate) mod $name;
            paste::paste! {
                pub(crate) use $name::[<$name:camel Command>];
            }
        )*
    }
}
