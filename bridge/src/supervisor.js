import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../");

function versionMatches(output) {
  return /LOVE 11\.5 \(/.test(output ?? "");
}

function resolveLoveBinary(config) {
  // An explicit path lets operators pin a custom LÖVE binary.
  if (config.loveBin !== "love") {
    if (!existsSync(config.loveBin)) {
      throw new Error(`Configured LOVE_BIN does not exist: ${config.loveBin}`);
    }
    return config.loveBin;
  }

  // Prefer an exact-version system installation.
  const systemCheck = spawnSync("love", ["--version"], { encoding: "utf8" });
  const systemOutput = `${systemCheck.stdout ?? ""}${systemCheck.stderr ?? ""}`;
  if (systemCheck.status === 0 && versionMatches(systemOutput)) {
    console.log("[runtime] Using system LÖVE 11.5.");
    return "love";
  }

  // Otherwise download/extract the official Linux AppImage into .runtime/.
  console.log("[runtime] LÖVE 11.5 not found; installing a project-local runtime...");
  const setup = spawnSync("bash", [resolve(projectRoot, "scripts/setup-love.sh")], {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env
  });
  if (setup.status !== 0) {
    throw new Error("Automatic LÖVE setup failed. Run `npm run setup` for details.");
  }

  const localLove = resolve(projectRoot, ".runtime/love-11.5/bin/love");
  if (!existsSync(localLove)) {
    throw new Error(`LÖVE setup completed but runtime was not found at ${localLove}`);
  }
  return localLove;
}

export function startGameServer(config) {
  if (!existsSync(config.archive)) {
    throw new Error(
      `Missing ${config.archive}\\nPut your packaged TerraBlock-server.love at game/TerraBlock-server.love.`
    );
  }

  const loveBin = resolveLoveBinary(config);
  // The TerraBlock README documents: love TerraBlock-server.love [seed] [port]
  const child = spawn(
    loveBin,
    [config.archive, String(config.seed), String(config.gamePort)],
    { stdio: "inherit", env: process.env, cwd: projectRoot }
  );

  child.on("error", (error) => {
    console.error("[game] Failed to start LÖVE server:", error.message);
  });
  child.on("exit", (code, signal) => {
    console.log(`[game] LÖVE server exited (code=${code}, signal=${signal})`);
  });

  return child;
}
