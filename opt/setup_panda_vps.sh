#!/usr/bin/env bash
set -e

echo "============================================================"
echo "  Panda-VPS / Fisher Panel (熊猫工坊V5) Automated Setup Script"
echo "  Target IP: 139.84.213.79"
echo "  OS: Ubuntu 24.04 LTS"
echo "============================================================"

# 1. Verify OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "[INFO] OS: $PRETTY_NAME"
fi

# 2. Update and install system packages
echo "[INFO] Updating apt and installing system dependencies..."
apt-get update
apt-get install -y \
    build-essential \
    curl \
    wget \
    git \
    unzip \
    zip \
    tar \
    ca-certificates \
    python3 \
    python3-pip \
    python3-venv \
    default-jdk \
    nginx \
    sqlite3 \
    zipalign

# 3. Install Node.js 18.x
if ! command -v node &> /dev/null || [[ $(node -v) != v18* ]]; then
    echo "[INFO] Installing Node.js v18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi
echo "[INFO] Node version: $(node -v)"
echo "[INFO] npm version: $(npm -v)"

# 4. Setup Android SDK & Build Tools 35.0.0
ANDROID_HOME="/opt/android-sdk"
export ANDROID_HOME
mkdir -p "$ANDROID_HOME/cmdline-tools"

if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
    echo "[INFO] Downloading Android command-line tools..."
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdtools.zip
    unzip -q /tmp/cmdtools.zip -d /tmp/cmdtools
    mkdir -p "$ANDROID_HOME/cmdline-tools/latest"
    mv /tmp/cmdtools/cmdline-tools/* "$ANDROID_HOME/cmdline-tools/latest/"
    rm -rf /tmp/cmdtools.zip /tmp/cmdtools
fi

export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/35.0.0"

echo "[INFO] Accepting Android SDK licenses and installing components..."
yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses || true
"$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platform-tools" "build-tools;35.0.0" "platforms;android-35"

# 5. Prepare /opt/ directories
echo "[INFO] Setting up /opt/ deployment directories..."
mkdir -p /opt/fisher-node/data
mkdir -p /opt/fisher-node/apk-output
mkdir -p /opt/fisher-node/ab-apk-output
mkdir -p /opt/fisher-node/abpack-output
mkdir -p /opt/fisher-node/backup
mkdir -p /opt/fengjc_site

# 6. Copy project files to /opt/
echo "[INFO] Copying application files to /opt/..."
if [ -d "/root/fisher-node" ]; then
    cp -r /root/fisher-node/* /opt/fisher-node/
fi
if [ -d "/root/fengjc_site" ]; then
    cp -r /root/fengjc_site/* /opt/fengjc_site/
fi

# 7. Install Node dependencies and rebuild better-sqlite3
echo "[INFO] Installing Node.js dependencies..."
cd /opt/fisher-node
if [ -f "package.json" ]; then
    npm install --production
    npm rebuild better-sqlite3
fi

# 8. Configure Systemd Service
echo "[INFO] Configuring systemd service for fisher-node..."
cat << 'EOF' > /etc/systemd/system/fisher-node.service
[Unit]
Description=Fisher Server (Node.js)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/fisher-node
ExecStart=/usr/bin/node server_remote.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable fisher-node.service
systemctl restart fisher-node.service

# 9. Configure Nginx for IP-based deployment (139.84.213.79)
echo "[INFO] Configuring Nginx..."
cat << 'EOF' > /etc/nginx/sites-available/fisher
server {
    listen 80;
    server_name 139.84.213.79 _;
    root /opt/fengjc_site;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 100M;
    }

    # WebSocket proxy
    location /ws/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Injection data proxy
    location /injectionData {
        proxy_pass http://127.0.0.1:8080/injectionData;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 50M;
    }
}
EOF

ln -sf /etc/nginx/sites-available/fisher /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo "============================================================"
echo "  Setup completed successfully!"
echo "  Frontend: http://139.84.213.79"
echo "  Backend API: http://139.84.213.79/api/"
echo "  Service Status: systemctl status fisher-node"
echo "============================================================"
