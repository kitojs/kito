import { spawn } from 'node:child_process';
import chalk from 'chalk';

export const startServer = (name, runner, args, extension, example) => {
  return new Promise((resolve, reject) => {
    console.log(chalk.cyan(`\nStarting server ${name}...`));

    const server = spawn(
      runner,
      [...args, `./bench/servers/${example}/${name}.${extension}`],
      {
        stdio: 'inherit',
      },
    );

    setTimeout(() => resolve(server), 2000);
  });
};

export const stopServer = (server, name) => {
  return new Promise((resolve) => {
    console.log(chalk.red(`\nShutting down server ${name}...`));
    server.kill();
    setTimeout(resolve, 1000);
  });
};
