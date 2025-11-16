import net from "node:net";

export function waitForServerReady(port: number, retries = 50): Promise<void> {
  return new Promise((resolve, reject) => {
    (function check(retries: number) {
      const socket = net.createConnection(port, "localhost");

      socket.on("connect", () => {
        socket.end();
        resolve();
      });

      socket.on("error", () => {
        if (retries <= 0) return reject(new Error("Server not ready"));
        setTimeout(() => check(--retries), 50);
      });
    })(retries);
  });
}
