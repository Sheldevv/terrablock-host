#!/usr/bin/env sh
set -eu
command -v node >/dev/null 2>&1 || { echo "Node.js is required"; exit 1; }
node --version
command -v love >/dev/null 2>&1 || { echo "LÖVE 11.5 is required (or set LOVE_BIN)"; exit 1; }
love --version
test -f game/TerraBlock-server.love || {
  echo "Missing game/TerraBlock-server.love"
  exit 1
}
echo "Runtime prerequisites look present."
