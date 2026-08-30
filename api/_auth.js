const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { getDatabase } = require('./_mongodb');

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

function createSessionToken(userId) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionMaxAge;
  const payload = `${toBase64Url(String(userId))}.${expiresAt}`;
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

function readSessionUserId(request) {
  const token = parseCookies(request)[sessionCookieName];
  if (!token) return '';
  const [encodedUserId, expiresAt, signature] = token.split('.');
  if (!encodedUserId || !expiresAt || !signature || Number(expiresAt) < Math.floor(Date.now() / 1000)) return '';
  const payload = `${encodedUserId}.${expiresAt}`;
  const expected = signSession(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return '';
  try {
    return fromBase64Url(encodedUserId);
  } catch (error) {
    return '';
  }
}

function createSessionCookie(userId) {
  const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${sessionCookieName}=${encodeURIComponent(createSessionToken(userId))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionMaxAge}${secure}`;
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

async function getAuthenticatedUser(request) {
  const userId = readSessionUserId(request);
  if (!userId || !ObjectId.isValid(userId)) return null;
  const db = await getDatabase();
  const collection = db.collection(process.env.MONGODB_USER_COLLECTION || 'user_accounts');
  const user = await collection.findOne({ _id: new ObjectId(userId) }, { projection: { username: 1 } });
  return user ? { id: user._id.toString(), username: user.username } : null;
}

module.exports = {
  clearSessionCookie,
  createSessionCookie,
  getAuthenticatedUser,
  hashPassword,
  verifyPassword,
};
