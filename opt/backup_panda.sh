#!/usr/bin/env bash
set -e
BACKUP_DIR="/opt/fisher-node/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TARGET="$BACKUP_DIR/backup_$TIMESTAMP"

echo "[INFO] Creating backup at $TARGET..."
mkdir -p "$TARGET"

if [ -d "/opt/fisher-node/data" ]; then
    cp -r /opt/fisher-node/data "$TARGET/"
    echo "[INFO] Database backed up."
fi

if [ -f "/etc/systemd/system/fisher-node.service" ]; then
    cp /etc/systemd/system/fisher-node.service "$TARGET/"
fi

if [ -f "/etc/nginx/sites-available/fisher" ]; then
    cp /etc/nginx/sites-available/fisher "$TARGET/"
fi

tar -czf "$TARGET.tar.gz" -C "$BACKUP_DIR" "backup_$TIMESTAMP"
rm -rf "$TARGET"
echo "[INFO] Backup completed: $TARGET.tar.gz"
