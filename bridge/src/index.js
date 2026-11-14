import "node:process";
import { config } from "./config.js";
import { startGameServer } from "./supervisor.js";
import { createTcpGateway } from "./gateway.js";

if (!config.allowPublicUnsafe && config.host !== "127.0.0.1" && config.host !== "::1") {
  console.error(`
SECURITY BLOCKED:
The supplied TerraBlock README states that the game server is unauthenticated
and unencrypted. Refusing to expose its TCP gateway publicly.

For private testing, set HOST=127.0.0.1.
Do not set ALLOW_PUBLIC_UNSAFE=true on an internet-facing host until the
client/server protocol has authentication and encryption.
`);
  process.exit(1);
}

let game;
let gateway;

try {
  game = startGameServer(config);
  gateway = createTcpGateway(config);

  gateway.listen(config.publicPort, config.host, () => {
    console.log(`[gateway] Listening on ${config.host}:${config.publicPort}`);
    console.log(`[gateway] Forwarding to ${config.gameHost}:${config.gamePort}`);
  });
} catch (error) {
  console.error(error.message);
  game?.kill("SIGTERM");
  process.exit(1);
}

function shutdown(signal) {
  console.log(`\n[host] Received ${signal}; shutting down...`);
  gateway?.close();
  game?.kill("SIGTERM");
  setTimeout(() => process.exit(0), 1500).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
