#!/usr/bin/env bash
set -euo pipefail

LOVE_VERSION="11.5"
APPIMAGE_URL="https://github.com/love2d/love/releases/download/11.5/love-11.5-x86_64.AppImage"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RUNTIME_DIR="${PROJECT_DIR}/.runtime/love-${LOVE_VERSION}"
DOWNLOAD_DIR="${PROJECT_DIR}/.runtime/downloads"
APPIMAGE="${DOWNLOAD_DIR}/love-${LOVE_VERSION}-x86_64.AppImage"

say() { printf '[setup] %s\n' "$*"; }
fail() { printf '[setup] ERROR: %s\n' "$*" >&2; exit 1; }

# Keep an existing exact-version system installation if one is available.
if command -v love >/dev/null 2>&1; then
  VERSION_OUTPUT="$(love --version 2>&1 || true)"
  if [[ "${VERSION_OUTPUT}" == *"LOVE ${LOVE_VERSION} "* ]]; then
    say "LÖVE ${LOVE_VERSION} is already installed: $(command -v love)"
    exit 0
  fi
  say "System LÖVE found, but it is not version ${LOVE_VERSION}; using a project-local runtime."
fi

ARCH="$(uname -m)"
[[ "${ARCH}" == "x86_64" ]] || fail "The automatic LÖVE AppImage installer currently supports x86_64 only (detected ${ARCH}). Install LÖVE ${LOVE_VERSION} using your distribution's package manager, or add an AppImage for this architecture."

if [[ -x "${RUNTIME_DIR}/bin/love" ]]; then
  VERSION_OUTPUT="$("${RUNTIME_DIR}/bin/love" --version 2>&1 || true)"
  if [[ "${VERSION_OUTPUT}" == *"LOVE ${LOVE_VERSION} "* ]]; then
    say "Project-local LÖVE ${LOVE_VERSION} runtime is already installed."
    exit 0
  fi
fi

mkdir -p "${DOWNLOAD_DIR}"
if [[ ! -s "${APPIMAGE}" ]]; then
  if command -v curl >/dev/null 2>&1; then
    say "Downloading official LÖVE ${LOVE_VERSION} AppImage..."
    curl --fail --location --retry 3 --output "${APPIMAGE}.part" "${APPIMAGE_URL}"
    mv "${APPIMAGE}.part" "${APPIMAGE}"
  elif command -v wget >/dev/null 2>&1; then
    say "Downloading official LÖVE ${LOVE_VERSION} AppImage..."
    wget -O "${APPIMAGE}.part" "${APPIMAGE_URL}"
    mv "${APPIMAGE}.part" "${APPIMAGE}"
  else
    fail "curl or wget is required to download LÖVE automatically."
  fi
fi

chmod +x "${APPIMAGE}"
TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "${TMP_DIR}"; }
trap cleanup EXIT

say "Extracting the LÖVE AppImage (no system installation or root access required)..."
cd "${TMP_DIR}"
"${APPIMAGE}" --appimage-extract >/dev/null
[[ -x "${TMP_DIR}/squashfs-root/bin/love" ]] || fail "The downloaded AppImage did not contain bin/love."

rm -rf "${RUNTIME_DIR}"
mkdir -p "$(dirname "${RUNTIME_DIR}")"
mv "${TMP_DIR}/squashfs-root" "${RUNTIME_DIR}"

VERSION_OUTPUT="$("${RUNTIME_DIR}/bin/love" --version 2>&1 || true)"
[[ "${VERSION_OUTPUT}" == *"LOVE ${LOVE_VERSION} "* ]] || fail "The extracted runtime did not report LÖVE ${LOVE_VERSION}: ${VERSION_OUTPUT}"

say "Installed project-local LÖVE ${LOVE_VERSION} at ${RUNTIME_DIR}/bin/love"
