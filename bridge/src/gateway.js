import net from "node:net";

function normalizeAddress(address = "") {
  return address.startsWith("::ffff:") ? address.slice(7) : address;
}

export function createTcpGateway(config) {
  const server = net.createServer((client) => {
    const remote = normalizeAddress(client.remoteAddress);
    if (config.allowIps.length && !config.allowIps.includes(remote)) {
      console.warn(`[gateway] Rejected connection from ${remote}`);
      client.destroy();
      return;
    }

    const upstream = net.connect({
      host: config.gameHost,
      port: config.gamePort
    });

    upstream.setNoDelay(true);
    client.setNoDelay(true);

    client.pipe(upstream);
    upstream.pipe(client);

    const closeBoth = () => {
      client.destroy();
      upstream.destroy();
    };
    client.on("error", closeBoth);
    upstream.on("error", (error) => {
      console.warn(`[gateway] Upstream connection failed: ${error.message}`);
      closeBoth();
    });
    client.on("close", () => upstream.destroy());
    upstream.on("close", () => client.destroy());

    console.log(`[gateway] ${remote} connected`);
  });

  return server;
}
