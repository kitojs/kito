mod commands;
mod utils;

use async_trait::async_trait;
use clap::{Parser, Subcommand};

use crate::commands::Command;

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

#[async_trait]
impl Command for Commands {
    async fn run(&self) -> Result<(), ()> {
        // match self {}

        Ok(())
    }
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    if let Some(cmd) = cli.command {
        let cmd_run = cmd.run().await;
        if cmd_run.is_err() {
            std::process::exit(1);
        }
    }
}
