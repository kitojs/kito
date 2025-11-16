use crate::register_commands;

use async_trait::async_trait;

#[async_trait]
pub(crate) trait Command {
    async fn run(&self) -> Result<(), ()>;
}

register_commands!();
