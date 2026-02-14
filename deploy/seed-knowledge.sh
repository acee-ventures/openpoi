#!/bin/bash
set -euo pipefail

SEED_DIR="${SEED_DIR:-/app/deploy/workspace/knowledge}"
TARGET_DIR="${TARGET_DIR:-/data/workspace/knowledge}"
MARKER="${TARGET_DIR}/.docs_version"
SOURCE_VERSION_FILE="${SEED_DIR}/.docs_version"

# Fail-fast: seed source must exist and have content
if [ ! -d "$SEED_DIR" ] || [ -z "$(ls -A "$SEED_DIR" 2>/dev/null)" ]; then
    echo "[seed] FATAL: Seed directory missing or empty: $SEED_DIR" >&2
    exit 1
fi

CURRENT_VERSION="unknown"
if [ -f "$SOURCE_VERSION_FILE" ]; then
    CURRENT_VERSION=$(cat "$SOURCE_VERSION_FILE")
fi

EXISTING_VERSION=""
if [ -f "$MARKER" ]; then
    EXISTING_VERSION=$(cat "$MARKER")
fi

if [ "$CURRENT_VERSION" = "$EXISTING_VERSION" ]; then
    echo "[seed] Knowledge up-to-date ($CURRENT_VERSION), skipping sync"
    echo "[seed] Files: $(find "$TARGET_DIR" -name '*.md' | wc -l) markdown files"
else
    echo "[seed] Version changed: $EXISTING_VERSION -> $CURRENT_VERSION"
    echo "[seed] Cleaning old knowledge..."
    find "$TARGET_DIR" -mindepth 1 -not -name '.docs_version' -delete 2>/dev/null || true
    mkdir -p "$TARGET_DIR"

    echo "[seed] Syncing from $SEED_DIR..."
    cp -r "$SEED_DIR"/. "$TARGET_DIR"/

    echo "[seed] Done. Version: $CURRENT_VERSION"
    echo "[seed] Files: $(find "$TARGET_DIR" -name '*.md' | wc -l) markdown files"
    ls -la "$TARGET_DIR"
fi
