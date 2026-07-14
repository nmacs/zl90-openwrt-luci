#!/bin/bash

LUCI_LUASRC_PATH=usr/lib/lua/5.1/luci
LUCI_HTDOCS_PATH=www
LUCI_ROOT_PATH=.

SCRIPT_DIR="$(dirname "$0")"
TARGET_DIR="$SCRIPT_DIR/../../files"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

if [ -d "$SCRIPT_DIR/luasrc" ]; then
    mkdir -p "$TARGET_DIR/$LUCI_LUASRC_PATH"
    cp -r "$SCRIPT_DIR/luasrc/"* "$TARGET_DIR/$LUCI_LUASRC_PATH/"
    echo "Copied luasrc to $TARGET_DIR/$LUCI_LUASRC_PATH/"
fi

if [ -d "$SCRIPT_DIR/htdocs" ]; then
    mkdir -p "$TARGET_DIR/$LUCI_HTDOCS_PATH"
    cp -r "$SCRIPT_DIR/htdocs/"* "$TARGET_DIR/$LUCI_HTDOCS_PATH/"
    echo "Copied htdocs to $TARGET_DIR/$LUCI_HTDOCS_PATH/"
fi

if [ -d "$SCRIPT_DIR/root" ]; then
    cp -r "$SCRIPT_DIR/root/"* "$TARGET_DIR/$LUCI_ROOT_PATH/"
    echo "Copied root to $TARGET_DIR/$LUCI_ROOT_PATH/"
fi

echo "Success - deployed to $TARGET_DIR"
