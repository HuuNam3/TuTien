const crypto = require('crypto');
const { runNpcTick } = require('./npc');
const { resetMongoClient } = require('./_mongodb');

function sendJson(response, status, payload) {
  if (typeof response.status === 'function') return response.status(status).json(payload);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function isAuthorized(request) {
  const secret = String(process.env.CRON_SECRET || '');
  if (secret.length < 16) return false;
  const supplied = String(request.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (supplied.length !== secret.length) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(secret));
}

module.exports = async function cronNpcHandler(request, response) {
  if (request.method !== 'GET') return sendJson(response, 405, { error: 'Method not allowed.' });
  if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET) {
    return sendJson(response, 503, { error: 'NPC cron chưa được cấu hình MongoDB.' });
  }
  if (!process.env.CRON_SECRET) return sendJson(response, 503, { error: 'Thiếu CRON_SECRET trên Deployment.' });
  if (!isAuthorized(request)) return sendJson(response, 401, { error: 'Cron authorization required.' });
  try {
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await runNpcTick({ catchUp: true, limit: 50 });
        return sendJson(response, 200, { ok: true, ...result, attempts: attempt + 1 });
      } catch (error) {
        lastError = error;
        resetMongoClient();
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    throw lastError;
  } catch (error) {
    console.error('NPC cron error:', error);
    return sendJson(response, 503, { error: 'Không thể cập nhật NPC từ MongoDB.' });
  }
};
