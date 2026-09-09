const crypto = require('crypto');
const { getDatabase } = require('./_mongodb');
const { hashPassword } = require('./_auth');
const {
  createNpcState,
  createNpcUsername,
  normalizeNpcProfile,
  summarizeNpc,
  tickNpcState,
} = require('./npc-engine');

const userCollectionName = process.env.MONGODB_USER_COLLECTION || 'user_accounts';
const gameStateCollectionName = process.env.MONGODB_COLLECTION || 'gameStates';
const npcTickIntervalMs = 5 * 60 * 1000;
const maxDailyCatchUpTicks = 24 * 60 / 5;

function sendJson(response, status, payload) {
  if (typeof response.status === 'function') return response.status(status).json(payload);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  if (request.body !== undefined) return request.body;
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return null; }
}

function hasWorkerSecret(request) {
  const configuredSecrets = [process.env.NPC_WORKER_SECRET, process.env.CRON_SECRET]
    .map((secret) => String(secret || ''))
    .filter((secret) => secret.length >= 16);
  if (!configuredSecrets.length) return false;
  const supplied = String(request.headers?.['x-npc-worker-secret'] || '').trim()
    || String(request.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
  return configuredSecrets.some((configured) => supplied.length === configured.length
    && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(configured)));
}

function isWorkerRequest(request) {
  return hasWorkerSecret(request);
}

async function loadNpc(db, id) {
  const account = await db.collection(userCollectionName).findOne({ _id: id, isNpc: true });
  if (!account) return null;
  const document = await db.collection(gameStateCollectionName).findOne({ userId: id.toString() });
  return { account, document };
}

async function createNpc(db, payload) {
  const profile = normalizeNpcProfile(payload.profile || payload);
  const username = createNpcUsername(profile.name);
  const passwordData = hashPassword(crypto.randomBytes(48).toString('base64url'));
  const now = new Date();
  const result = await db.collection(userCollectionName).insertOne({
    username,
    usernameLower: username.toLowerCase(),
    passwordSalt: passwordData.salt,
    passwordHash: passwordData.hash,
    isNpc: true,
    npcProfile: profile,
    createdAt: now,
    updatedAt: now,
    activeSessionId: null,
    activeSessionUpdatedAt: now,
    npcLockUntil: null,
    npcLastTickAt: null,
  });
  const state = createNpcState(profile);
  await db.collection(gameStateCollectionName).insertOne({
    userId: result.insertedId.toString(),
    state,
    updatedAt: now,
    saveVersion: 1,
    activeSessionId: null,
  });
  return { account: { _id: result.insertedId, username, npcProfile: profile }, state };
}

function getCatchUpWindow(state, now) {
  const lastTickAt = Number(new Date(state?.npc?.lastTickAt || state?.lastActiveAt || now).getTime());
  const elapsedMs = Number.isFinite(lastTickAt) ? Math.max(0, now.getTime() - lastTickAt) : npcTickIntervalMs;
  const simulatedMs = Math.min(Math.max(npcTickIntervalMs, elapsedMs), maxDailyCatchUpTicks * npcTickIntervalMs);
  return {
    startAt: now.getTime() - simulatedMs,
    ticks: Math.max(1, Math.ceil(simulatedMs / npcTickIntervalMs)),
  };
}

async function tickOneNpc(db, account, options = {}) {
  const now = new Date();
  const lockUntil = new Date(now.getTime() + (options.catchUp ? 120000 : 30000));
  const claimed = await db.collection(userCollectionName).findOneAndUpdate(
    {
      _id: account._id,
      isNpc: true,
      'npcProfile.enabled': { $ne: false },
      $or: [{ npcLockUntil: null }, { npcLockUntil: { $exists: false } }, { npcLockUntil: { $lte: now } }],
    },
    { $set: { npcLockUntil: lockUntil } },
    { returnDocument: 'after' },
  );
  const lockedAccount = claimed?.value || claimed;
  if (!lockedAccount?._id) return { skipped: true, reason: 'locked' };
  try {
    const document = await db.collection(gameStateCollectionName).findOne({ userId: account._id.toString() });
    const state = document?.state || createNpcState(lockedAccount.npcProfile || {});
    let result;
    let catchUpTicks = 1;
    if (options.catchUp) {
      const window = getCatchUpWindow(state, now);
      catchUpTicks = window.ticks;
      state.npc = state.npc || {};
      state.npc.lastTickAt = window.startAt;
      for (let index = 0; index < window.ticks; index += 1) {
        const virtualNow = Math.min(now.getTime(), window.startAt + ((index + 1) * npcTickIntervalMs));
        result = tickNpcState(state, lockedAccount.npcProfile || {}, virtualNow);
      }
    } else {
      result = tickNpcState(state, lockedAccount.npcProfile || {}, now.getTime());
    }
    await db.collection(gameStateCollectionName).updateOne(
      { userId: claimed._id.toString() },
      { $set: { state: result.state, updatedAt: now, saveVersion: Math.max(0, Number(document?.saveVersion) || 0) + 1, activeSessionId: null } },
      { upsert: true },
    );
    await db.collection(userCollectionName).updateOne(
      { _id: claimed._id },
      { $set: { updatedAt: now, npcLastTickAt: now }, $unset: { npcLockUntil: '' } },
    );
    return {
      skipped: false,
      npc: summarizeNpc(lockedAccount, result.state),
      action: result.action,
      catchUpTicks,
    };
  } catch (error) {
    await db.collection(userCollectionName).updateOne({ _id: lockedAccount._id }, { $unset: { npcLockUntil: '' } });
    throw error;
  }
}

async function runNpcTick({ catchUp = false, limit } = {}) {
  const db = await getDatabase();
  const defaultLimit = catchUp ? 50 : 10;
  const safeLimit = Math.min(50, Math.max(1, Number(limit || defaultLimit)));
  const accounts = await db.collection(userCollectionName).find(
    { isNpc: true, 'npcProfile.enabled': { $ne: false } },
    { projection: { username: 1, npcProfile: 1 }, limit: safeLimit },
  ).toArray();
  const results = [];
  for (const account of accounts) results.push(await tickOneNpc(db, account, { catchUp }));
  return { processed: results.length, catchUp, results };
}

module.exports = async function npcHandler(request, response) {
  if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
  if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET) return sendJson(response, 503, { error: 'NPC service is not configured.' });
  const url = new URL(request.url, 'http://localhost');
  const action = String(url.searchParams.get('action') || '').toLowerCase();
  try {
    const db = await getDatabase();
    if (request.method === 'GET' && action === 'opponents') {
      const accounts = await db.collection(userCollectionName).find(
        { isNpc: true, 'npcProfile.enabled': { $ne: false } },
        { projection: { username: 1, npcProfile: 1 }, limit: 50 },
      ).toArray();
      const ids = accounts.map((account) => account._id.toString());
      const states = await db.collection(gameStateCollectionName).find({ userId: { $in: ids } }, { projection: { userId: 1, state: 1 } }).toArray();
      const stateMap = new Map(states.map((document) => [String(document.userId), document.state]));
      return sendJson(response, 200, { opponents: accounts.map((account) => summarizeNpc(account, stateMap.get(account._id.toString()) || {})) });
    }
    if (!isWorkerRequest(request)) return sendJson(response, 401, { error: 'NPC worker authentication required.' });

    if (request.method === 'POST' && action === 'create') {
      const payload = await readBody(request);
      if (!payload || typeof payload !== 'object') return sendJson(response, 400, { error: 'Dữ liệu NPC không hợp lệ.' });
      const created = await createNpc(db, payload);
      return sendJson(response, 201, { ok: true, npc: summarizeNpc(created.account, created.state) });
    }
    if (['GET', 'POST'].includes(request.method) && action === 'tick') {
      const cronSchedule = request.headers?.['x-vercel-cron-schedule'] || request.headers?.['X-Vercel-Cron-Schedule'];
      const isCatchUp = url.searchParams.get('mode') === 'daily' || Boolean(cronSchedule);
      const defaultLimit = isCatchUp ? 50 : 10;
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || defaultLimit)));
      const result = await runNpcTick({ catchUp: isCatchUp, limit });
      return sendJson(response, 200, { ok: true, ...result });
    }
    if (request.method === 'GET' && action === 'list') {
      const accounts = await db.collection(userCollectionName).find(
        { isNpc: true }, { projection: { username: 1, npcProfile: 1 }, limit: 200 },
      ).toArray();
      const ids = accounts.map((account) => account._id.toString());
      const states = await db.collection(gameStateCollectionName).find({ userId: { $in: ids } }, { projection: { userId: 1, state: 1 } }).toArray();
      const stateMap = new Map(states.map((document) => [String(document.userId), document.state]));
      return sendJson(response, 200, { npcs: accounts.map((account) => summarizeNpc(account, stateMap.get(account._id.toString()) || {})) });
    }
    return sendJson(response, 400, { error: 'NPC action không hợp lệ.' });
  } catch (error) {
    console.error('NPC service error:', error);
    return sendJson(response, 500, { error: 'NPC service unavailable.' });
  }
};

module.exports.runNpcTick = runNpcTick;
