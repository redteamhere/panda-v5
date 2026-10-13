#!/usr/bin/env bash
echo "============================================================"
echo "  Fisher Panel Health Check"
echo "============================================================"

PASS=0
FAIL=0

check_status() {
    if [ $1 -eq 0 ]; then
        echo "[PASS] $2"
        PASS=$((PASS + 1))
    else
        echo "[FAIL] $2"
        FAIL=$((FAIL + 1))
    fi
}

# 1. Node.js
node -v &>/dev/null
check_status $? "Node.js installed ($(node -v 2>/dev/null))"

# 2. npm
npm -v &>/dev/null
check_status $? "npm installed ($(npm -v 2>/dev/null))"

# 3. Python 3
python3 --version &>/dev/null
check_status $? "Python 3 installed ($(python3 --version 2>/dev/null))"

# 4. Java / JDK
java -version &>/dev/null
check_status $? "Java JDK installed"

# 5. SQLite DB
[ -f "/opt/fisher-node/data/fisher.db" ]
check_status $? "SQLite Database exists (/opt/fisher-node/data/fisher.db)"

# 6. Backend Service (systemd)
systemctl is-active --quiet fisher-node
check_status $? "fisher-node systemd service is active"

# 7. Nginx Service
systemctl is-active --quiet nginx
check_status $? "Nginx service is active"

# 8. Backend HTTP Port (8080)
curl -s -f http://127.0.0.1:8080/api/auth/check-initialization &>/dev/null
check_status $? "Backend API responding on port 8080"

# 9. Frontend HTTP Port (80)
curl -s -f http://127.0.0.1/ &>/dev/null
check_status $? "Frontend serving on port 80"

echo "============================================================"
echo "  Results: PASSED: $PASS | FAILED: $FAIL"
echo "============================================================"
if [ $FAIL -gt 0 ]; then
    exit 1
fi
exit 0
