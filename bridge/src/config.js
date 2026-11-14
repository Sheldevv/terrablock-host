import { resolve } from "node:path";

function numberFromEnv(name, fallback, min, max) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

const allowIps = (process.env.ALLOW_IPS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const projectRoot = resolve(".");
export const config = {
  host: process.env.HOST ?? "0.0.0.0",
  publicPort: numberFromEnv("PUBLIC_PORT", 22120, 1, 65535),
  gameHost: process.env.GAME_HOST ?? "127.0.0.1",
  gamePort: numberFromEnv("GAME_PORT", 22121, 1, 65535),
  seed: process.env.GAME_SEED ?? "424242",
  archive: resolve(process.env.GAME_ARCHIVE ?? "./game/TerraBlock-server.love"),
  loveBin: process.env.LOVE_BIN ?? "love",
  allowPublicUnsafe: process.env.ALLOW_PUBLIC_UNSAFE === "true",
  allowIps
};
