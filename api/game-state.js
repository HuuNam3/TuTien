const { ObjectId } = require('mongodb');
const { getDatabase, getMongoClient } = require('./_mongodb');
const { getAuthenticatedSession } = require('./_auth');

function sendJson(response, status, payload) {
  if (typeof response.status === 'function') {
    return response.status(status).json(payload);
  }
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function sendSessionError(response, error) {
  return sendJson(response, error.status, { error: error.message, code: error.code });
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

module.exports = async function gameStateHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }
  if (!['GET', 'PUT'].includes(request.method)) {
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET) {
    return sendJson(response, 503, { error: 'MongoDB is not configured.' });
  }

  try {
    const authentication = await getAuthenticatedSession(request);
    if (authentication.error) return sendSessionError(response, authentication.error);
    const user = authentication.user;
    if (!user) return sendJson(response, 401, { error: 'Authentication required.' });
    const db = await getDatabase();
    const collection = db.collection(process.env.MONGODB_COLLECTION || 'gameStates');
    if (request.method === 'GET') {
      const document = await collection.findOne(
        { userId: user.id },
        { projection: { _id: 0, state: 1, saveVersion: 1, updatedAt: 1 } },
      );
      return sendJson(response, 200, {
        state: document?.state || null,
        saveVersion: Math.max(0, Number(document?.saveVersion) || 0),
        updatedAt: document?.updatedAt instanceof Date ? document.updatedAt.toISOString() : document?.updatedAt || null,
      });
    }

    const payload = await readBody(request);
    if (!payload || !payload.state || typeof payload.state !== 'object' || Array.isArray(payload.state)) {
      return sendJson(response, 400, { error: 'Invalid game state.' });
    }
    const serializedState = JSON.stringify(payload.state);
    if (Buffer.byteLength(serializedState, 'utf8') > 900000) {
      return sendJson(response, 413, { error: 'Game state is too large.' });
    }

    const client = await getMongoClient();
    const transaction = client.startSession();
    let result = { status: 500, payload: { error: 'Game state service unavailable.' } };
    try {
      await transaction.withTransaction(async () => {
        const users = db.collection(process.env.MONGODB_USER_COLLECTION || 'user_accounts');
        const activeAccount = await users.findOne(
          { _id: new ObjectId(user.id), activeSessionId: user.sessionId },
          { projection: { _id: 1 }, session: transaction },
        );
        if (!activeAccount) {
          result = {
            status: 409,
            payload: {
              error: 'Tài khoản đã được đăng nhập trên thiết bị khác.',
              code: 'SESSION_REPLACED',
            },
          };
          return;
        }

        const existing = await collection.findOne({ userId: user.id }, { session: transaction });
        const currentVersion = Math.max(0, Number(existing?.saveVersion) || 0);
        const requestedBaseVersion = payload.baseSaveVersion;
        if (requestedBaseVersion !== undefined && requestedBaseVersion !== null
          && Number(requestedBaseVersion) !== currentVersion) {
          result = {
            status: 409,
            payload: {
              error: 'Dữ liệu trên máy này đã cũ, cần đồng bộ lại từ máy chủ.',
              code: 'SAVE_CONFLICT',
              saveVersion: currentVersion,
            },
          };
          return;
        }

        const updatedAt = new Date();
        const nextVersion = currentVersion + 1;
        if (existing) {
          const updateResult = await collection.updateOne(
            { _id: existing._id, activeSessionId: user.sessionId },
            { $set: { state: payload.state, updatedAt, activeSessionId: user.sessionId, userId: user.id, saveVersion: nextVersion } },
            { session: transaction },
          );
          if (updateResult.matchedCount !== 1) {
            result = {
              status: 409,
              payload: {
                error: 'Tài khoản đã được đăng nhập trên thiết bị khác.',
                code: 'SESSION_REPLACED',
              },
            };
            return;
          }
        } else {
          await collection.insertOne({
            userId: user.id,
            state: payload.state,
            updatedAt,
            activeSessionId: user.sessionId,
            saveVersion: nextVersion,
          }, { session: transaction });
        }
        result = { status: 200, payload: { ok: true, updatedAt: updatedAt.toISOString(), saveVersion: nextVersion } };
      }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    } finally {
      await transaction.endSession();
    }
    return sendJson(response, result.status, result.payload);
  } catch (error) {
    console.error('MongoDB game state error:', error);
    return sendJson(response, 500, { error: 'Game state service unavailable.' });
  }
};
