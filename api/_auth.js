const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { getDatabase, getMongoClient } = require('./_mongodb');

const sessionCookieName = 'tu_tien_session';
const sessionMaxAge = 60 * 60 * 24 * 30;

function getSessionSecret() {
  const secret = String(process.env.SESSION_SECRET || '');
  if (secret.length < 32) throw new Error('SESSION_SECRET is not configured.');
  return secret;
}

function toBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signSession(payload) {
  return crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

function createSessionId() {
  return crypto.randomBytes(32).toString('base64url');
}

function createSessionToken(userId, sessionId) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionMaxAge;
  const payload = `${toBase64Url(String(userId))}.${toBase64Url(String(sessionId))}.${expiresAt}`;
  return `${payload}.${signSession(payload)}`;
}

function parseCookies(request) {
  const header = request.headers?.cookie || '';
  return Object.fromEntries(header.split(';').map((part) => {
    const index = part.indexOf('=');
    if (index < 0) return ['', ''];
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

function readSession(request) {
  const token = parseCookies(request)[sessionCookieName];
  if (!token) return null;
  const [encodedUserId, encodedSessionId, expiresAt, signature] = token.split('.');
  if (!encodedUserId || !encodedSessionId || !expiresAt || !signature
    || Number(expiresAt) < Math.floor(Date.now() / 1000)) return null;
  const payload = `${encodedUserId}.${encodedSessionId}.${expiresAt}`;
  const expected = signSession(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    return {
      userId: fromBase64Url(encodedUserId),
      sessionId: fromBase64Url(encodedSessionId),
    };
  } catch (error) {
    return null;
  }
}

function createSessionCookie(userId, sessionId) {
  const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${sessionCookieName}=${encodeURIComponent(createSessionToken(userId, sessionId))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionMaxAge}${secure}`;
}

function clearSessionCookie() {
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return {
    salt,
    hash: crypto.scryptSync(password, salt, 64).toString('hex'),
  };
}

function verifyPassword(password, salt, expectedHash) {
  const actual = Buffer.from(hashPassword(password, salt).hash, 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

async function getAuthenticatedSession(request) {
  const session = readSession(request);
  if (!session || !session.userId || !session.sessionId || !ObjectId.isValid(session.userId)) {
    return { user: null, error: null };
  }
  const db = await getDatabase();
  const collection = db.collection(process.env.MONGODB_USER_COLLECTION || 'user_accounts');
  const user = await collection.findOne(
    { _id: new ObjectId(session.userId) },
    { projection: { username: 1, activeSessionId: 1 } },
  );
  if (!user) return { user: null, error: null };
  const authenticatedUser = {
    id: user._id.toString(),
    username: user.username,
    sessionId: session.sessionId,
  };
  if (user.activeSessionId !== session.sessionId) {
    return {
      user: authenticatedUser,
      error: {
        status: 409,
        code: 'SESSION_REPLACED',
        message: 'Tài khoản đã được đăng nhập trên thiết bị khác.',
      },
    };
  }
  return { user: authenticatedUser, error: null };
}

async function getAuthenticatedUser(request) {
  const result = await getAuthenticatedSession(request);
  return result.error ? null : result.user;
}

async function activateUserSession(userId, sessionId) {
  if (!ObjectId.isValid(String(userId)) || !sessionId) throw new Error('Invalid session activation request.');
  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_DB || 'tutien');
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const users = db.collection(process.env.MONGODB_USER_COLLECTION || 'user_accounts');
      const result = await users.updateOne(
        { _id: new ObjectId(String(userId)) },
        { $set: { activeSessionId: sessionId, activeSessionUpdatedAt: new Date(), updatedAt: new Date() } },
        { session },
      );
      if (result.matchedCount !== 1) throw new Error('Account not found while activating session.');

      const gameStates = db.collection(process.env.MONGODB_COLLECTION || 'gameStates');
      await gameStates.updateOne(
        { userId: String(userId) },
        { $set: { activeSessionId: sessionId } },
        { session },
      );
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally {
    await session.endSession();
  }
}

async function invalidateActiveSession(request) {
  const session = readSession(request);
  if (!session || !ObjectId.isValid(session.userId)) return;
  const db = await getDatabase();
  await db.collection(process.env.MONGODB_USER_COLLECTION || 'user_accounts').updateOne(
    { _id: new ObjectId(session.userId), activeSessionId: session.sessionId },
    { $set: { activeSessionId: null, activeSessionUpdatedAt: new Date(), updatedAt: new Date() } },
  );
}

module.exports = {
  activateUserSession,
  clearSessionCookie,
  createSessionCookie,
  createSessionId,
  getAuthenticatedSession,
  getAuthenticatedUser,
  hashPassword,
  invalidateActiveSession,
  verifyPassword,
};
