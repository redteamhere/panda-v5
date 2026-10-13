# Fisher Panel (熊猫工坊V5) - Native VPS Deployment Guide

Target Server: **Ubuntu 24.04 LTS (IP: 139.84.213.79)**  
Deploy Directory: `/opt/`

---

## Server Specifications
- **OS**: Ubuntu 24.04 LTS x64
- **Public IP**: `139.84.213.79`
- **URL**: `http://139.84.213.79`

## Directory Structure (`/opt/`)
```text
/opt/
├── fisher-node/
│   ├── server_remote.js
│   ├── package.json
│   ├── data/ (SQLite database fisher.db)
│   ├── apk-builder/ (Python builders, apktool.jar, apksigner.jar, _debug.keystore)
│   ├── apk-output/
│   ├── ab-apk-output/
│   ├── abpack-output/
│   └── backup/
└── fengjc_site/
    ├── index.html
    └── assets/
```

## Software Requirements
- Node.js: `v18.20.8`
- npm: `10.8.2`
- Python: `3.12+`
- Java: `OpenJDK 17`
- Android SDK Build Tools: `35.0.0`
- Nginx: Latest stable
- SQLite3: Latest stable

## Quick Installation & Setup
1. Upload project archive to `/root/`.
2. Run the automated setup script:
   ```bash
   chmod +x /root/setup_panda_vps.sh
   /root/setup_panda_vps.sh
   ```

## Systemd Management
- Status: `systemctl status fisher-node`
- Restart: `systemctl restart fisher-node`
- Logs: `journalctl -u fisher-node -f`

## Health Check
Run the health check script:
```bash
/opt/fisher-node/health-check.sh
```
