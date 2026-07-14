#!/bin/bash

LUCI_LUASRC_PATH=/usr/lib/lua/5.1/luci
LUCI_HTDOCS_PATH=/www
LUCI_ROOT_PATH=/

HOST="$1"
PASSWORD="$2"
EXTRA_OPTIONS=""

if [ -n "$PASSWORD" ]; then
    EXTRA_OPTIONS="sshpass -p $PASSWORD"
fi

if [ -z "$HOST" ]; then
    echo "Usage: $0 [user@]host [password]"
    exit 1
fi

SCRIPT_DIR="$(dirname "$0")"

if [ -d "$SCRIPT_DIR/luasrc" ]; then
    $EXTRA_OPTIONS scp -r "$SCRIPT_DIR/luasrc/"* "$HOST:$LUCI_LUASRC_PATH/"
fi

if [ -d "$SCRIPT_DIR/htdocs" ]; then
    $EXTRA_OPTIONS scp -r "$SCRIPT_DIR/htdocs/"* "$HOST:$LUCI_HTDOCS_PATH/"
fi

if [ -d "$SCRIPT_DIR/root" ]; then
    $EXTRA_OPTIONS scp -r "$SCRIPT_DIR/root/"* "$HOST:$LUCI_ROOT_PATH/"
fi

# Clear LuCI index cache
$EXTRA_OPTIONS ssh "$HOST" "/etc/init.d/uhttpd stop; rm -rf /tmp/luci-*; /etc/init.d/uhttpd start"

echo "Success"
