const { getDatabase } = require('./_mongodb');
const {
  clearSessionCookie,
  createSessionCookie,
  getAuthenticatedUser,
  hashPassword,
  verifyPassword,
} = require('./_auth');

function sendJson(response, status, payload, headers = {}) {
  if (typeof response.status === 'function') {
    Object.entries(headers).forEach(([key, value]) => response.setHeader?.(key, value));
    return response.status(status).json(payload);
  }
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  if (request.body !== undefined) return request.body;
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function normalizeUsername(value) {
  return String(value || '').trim();
}

function validateCredentials(username, password) {
  if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(username)) return 'Tên đăng nhập dài 3-24 ký tự, chỉ gồm chữ, số, ., _ hoặc -.';
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) return 'Mật khẩu phải dài từ 6 đến 128 ký tự.';
  return '';
}

module.exports = async function authHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }
  if (!['GET', 'POST'].includes(request.method)) return sendJson(response, 405, { error: 'Method not allowed.' });
  if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET) {
    return sendJson(response, 503, { error: 'Account service is not configured.' });
  }

  try {
    if (request.method === 'GET') {
      return sendJson(response, 200, { user: await getAuthenticatedUser(request) });
    }

    const payload = await readBody(request);
    if (!payload || typeof payload !== 'object') return sendJson(response, 400, { error: 'Dữ liệu không hợp lệ.' });
    const action = String(payload.action || '').toLowerCase();
    if (action === 'logout') {
      return sendJson(response, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
    }
    if (!['login', 'register'].includes(action)) return sendJson(response, 400, { error: 'Thao tác tài khoản không hợp lệ.' });

    const username = normalizeUsername(payload.username);
    const password = String(payload.password || '');
    const validationError = validateCredentials(username, password);
    if (validationError) return sendJson(response, 400, { error: validationError });

    const db = await getDatabase();
    const collection = db.collection(process.env.MONGODB_USER_COLLECTION || 'user_accounts');
    await collection.createIndex({ usernameLower: 1 }, { unique: true });
    const usernameLower = username.toLowerCase();

    if (action === 'register') {
      const confirmation = String(payload.passwordConfirmation ?? payload.confirmPassword ?? '');
      if (password !== confirmation) return sendJson(response, 400, { error: 'Mật khẩu xác nhận không khớp.' });
      const existing = await collection.findOne({ usernameLower }, { projection: { _id: 1 } });
      if (existing) return sendJson(response, 409, { error: 'Tên đăng nhập đã tồn tại.' });
      const passwordData = hashPassword(password);
      const now = new Date();
      const result = await collection.insertOne({
        username,
        usernameLower,
        passwordSalt: passwordData.salt,
        passwordHash: passwordData.hash,
        createdAt: now,
        updatedAt: now,
      });
      return sendJson(response, 201, { user: { id: result.insertedId.toString(), username } }, { 'Set-Cookie': createSessionCookie(result.insertedId) });
    }

    const user = await collection.findOne({ usernameLower });
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return sendJson(response, 401, { error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }
    return sendJson(response, 200, { user: { id: user._id.toString(), username: user.username } }, { 'Set-Cookie': createSessionCookie(user._id) });
  } catch (error) {
    if (error?.code === 11000) return sendJson(response, 409, { error: 'Tên đăng nhập đã tồn tại.' });
    console.error('MongoDB auth error:', error);
    return sendJson(response, 500, { error: 'Dịch vụ tài khoản tạm thời không khả dụng.' });
  }
};
