# Fisher Panel (熊猫工坊V5) Docker Deployment Guide

This document describes the Docker architecture, setup, operation, and maintenance of the Fisher Panel project.

---

## Architecture Overview

The project is containerized into two primary Docker services managed via `docker-compose`:

1. **`fisher-backend`** (Node.js Backend & APK Build Environment):
   - **Base Image**: Node 18 on Debian Bullseye, augmented with OpenJDK 17, Python 3, Android SDK command-line tools, platform-tools, and build-tools (version 35.0.0).
   - **Services**: Express.js REST API, WebSocket server for real-time device communication & remote control, Python-based APK builder/repacker (`apktool`, `zipalign`, `apksigner`).
   - **Persistence**: Volumes mapped for SQLite database (`fisher-node/data`), APK outputs (`apk-output`, `ab-apk-output`, `abpack-output`), and backups.

2. **`fisher-frontend`** (Static Web Panel & Nginx):
   - **Base Image**: Nginx Alpine.
   - **Services**: Serves the existing frontend web interface (`fengjc_site/`) and acts as a reverse proxy forwarding `/api/`, `/ws/`, and `/injectionData` requests to `fisher-backend`.

---

## Ports Used

- **Port 80**: Frontend Web Panel (HTTP)
- **Port 8080**: Backend API & WebSocket (internal / exposed via Docker Compose)

---

## Persistent Volumes

To prevent data loss when containers are recreated, the following directories are persisted using Docker volumes:
- `fisher_data` -> `/opt/fisher-node/data` (SQLite database `fisher.db`, device data, users)
- `apk_output` -> `/opt/fisher-node/apk-output`
- `ab_apk_output` -> `/opt/fisher-node/ab-apk-output`
- `abpack_output` -> `/opt/fisher-node/abpack-output`
- `backup_dir` -> `/opt/fisher-node/backup`

---

## Quick Start Commands

### 1. Build and Start All Services
```bash
docker compose up -d --build
```

### 2. Check Container Status
```bash
docker compose ps
```

### 3. View Logs
```bash
docker compose logs -f fisher-backend
docker compose logs -f fisher-frontend
```

### 4. Stop Services
```bash
docker compose down
```

### 5. Rebuild Environment from Scratch
```bash
docker compose down -v
docker compose up -d --build
```

---

## APK Build & Signing Pipeline

- **Keystore**: Uses the existing valid debug keystore located at `fisher-node/apk-builder/_debug.keystore`.
- **Zipalign**: Official Android SDK `zipalign` ensures 4-byte alignment of resources.arsc.
- **Apksigner**: Official Android SDK `apksigner` supports V1, V2, and V3 signing schemes.
- **Verification**: Automatically verifies signature schemes and zipalign structure upon APK creation.

---

## Local Testing & Android Cleartext Traffic (`ws://`)

When performing local testing in an Android Studio emulator using an unencrypted WebSocket URL such as:
```text
ws://10.0.2.2:8080
```
Modern Android versions (Android 9.0 / API 28 and above) **block unencrypted cleartext HTTP and WebSocket traffic by default**. 

To ensure successful connection during local testing:
1. **Enable Cleartext Traffic**: Ensure the template/app manifest has `android:usesCleartextTraffic="true"` enabled within the `<application>` tag.
2. **Network Security Config**: Alternatively, configure a Network Security Config XML resource permitting cleartext traffic for `10.0.2.2` and `localhost`.

---

## Troubleshooting

1. **Database Persistence Issues**: Ensure Docker volumes (`fisher_data`) are intact and not pruned with `docker volume prune` unless a reset is intended.
2. **Port Conflicts**: Ensure ports `80` and `8080` are not occupied by other services on the host.
3. **Container Logs**: Check container logs using `docker compose logs` to inspect runtime errors or startup messages.
