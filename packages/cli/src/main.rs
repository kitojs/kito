mod utils;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(
    name = "kito",
    version = env!("CARGO_PKG_VERSION"),
    about = env!("CARGO_PKG_DESCRIPTION")
)]
#[command(arg_required_else_help = true)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {}

fn main() {
    println!("Hello, world!");
}
