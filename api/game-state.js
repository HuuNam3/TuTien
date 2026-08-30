const { getDatabase } = require('./_mongodb');
const { getAuthenticatedUser } = require('./_auth');

function sendJson(response, status, payload) {
  if (typeof response.status === 'function') {
    return response.status(status).json(payload);
  }
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  if (request.body !== undefined) return request.body;
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
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
    const user = await getAuthenticatedUser(request);
    if (!user) return sendJson(response, 401, { error: 'Authentication required.' });
    const db = await getDatabase();
    const collection = db.collection(process.env.MONGODB_COLLECTION || 'gameStates');
    if (request.method === 'GET') {
      const document = await collection.findOne({ userId: user.id }, { projection: { _id: 0, state: 1 } });
      return sendJson(response, 200, { state: document?.state || null });
    }

    const payload = await readBody(request);
    if (!payload || !payload.state || typeof payload.state !== 'object' || Array.isArray(payload.state)) {
      return sendJson(response, 400, { error: 'Invalid game state.' });
    }
    const serializedState = JSON.stringify(payload.state);
    if (Buffer.byteLength(serializedState, 'utf8') > 900000) {
      return sendJson(response, 413, { error: 'Game state is too large.' });
    }
    const updatedAt = new Date();
    await collection.updateOne(
      { userId: user.id },
      { $set: { userId: user.id, state: payload.state, updatedAt } },
      { upsert: true },
    );
    return sendJson(response, 200, { ok: true, updatedAt: updatedAt.toISOString() });
  } catch (error) {
    console.error('MongoDB game state error:', error);
    return sendJson(response, 500, { error: 'Game state service unavailable.' });
  }
};
