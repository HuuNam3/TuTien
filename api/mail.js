const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
const { getDatabase, getMongoClient } = require('./_mongodb');
const { getAuthenticatedSession } = require('./_auth');

const userCollectionName = process.env.MONGODB_USER_COLLECTION || 'user_accounts';
const gameStateCollectionName = process.env.MONGODB_COLLECTION || 'gameStates';
const mailCollectionName = process.env.MONGODB_MAIL_COLLECTION || 'system_mails';
const maxAttachmentQuantity = 1000000;
const maxCurrencyAmount = 1000000000000;
let mailIndexesPromise;
let mailCatalog;

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

function readDataFile(fileName) {
  const filePath = path.join(__dirname, '..', 'assets', 'Resources', 'Data', fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getMailCatalog() {
  if (mailCatalog) return mailCatalog;
  const shopData = readDataFile('ShopItems.json');
  const skillData = readDataFile('CultivationSkills.json');
  const items = [];
  const byId = new Map();

  (shopData.shopItems || []).forEach((item) => {
    const normalized = {
      itemId: String(item.id),
      name: String(item.name || item.id),
      kind: String(item.type || 'shopItem'),
      source: 'shop',
    };
    items.push(normalized);
    byId.set(normalized.itemId, normalized);
  });
  for (let chestTier = 1; chestTier <= 10; chestTier += 1) {
    const chest = {
      itemId: `equipmentChestTier${chestTier}`,
      name: `Rương trang bị cấp ${chestTier}`,
      kind: 'equipmentChest',
      chestTier,
      source: 'equipmentChest',
    };
    items.push(chest);
    byId.set(chest.itemId, chest);
  }
  (skillData.skills || []).forEach((skill) => {
    const book = {
      itemId: `skillBook:${skill.id}`,
      name: `Sách skill: ${skill.name || skill.id}`,
      kind: 'skillBook',
      skillId: String(skill.id),
      source: 'skill',
    };
    const fragment = {
      itemId: `skillFragment:${skill.id}`,
      name: `Mảnh skill: ${skill.name || skill.id}`,
      kind: 'skillFragment',
      skillId: String(skill.id),
      source: 'skill',
    };
    items.push(book, fragment);
    byId.set(book.itemId, book);
    byId.set(fragment.itemId, fragment);
  });
  mailCatalog = { items, byId };
  return mailCatalog;
}

function ensureMailIndexes(db) {
  if (!mailIndexesPromise) {
    const collection = db.collection(mailCollectionName);
    mailIndexesPromise = Promise.all([
      collection.createIndex({ recipientId: 1, createdAt: -1 }),
      collection.createIndex({ recipientId: 1, claimedAt: 1, readAt: 1 }),
    ]);
  }
  return mailIndexesPromise;
}

function toDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const date = new Date(numeric);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toPositiveInteger(value, fallback = 1, maximum = maxAttachmentQuantity) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(maximum, number));
}

function normalizeAttachments(input) {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) throw new Error('Đính kèm phải là một danh sách.');
  if (input.length > 20) throw new Error('Mỗi thư chỉ được đính kèm tối đa 20 mục.');
  const catalog = getMailCatalog();
  const merged = new Map();

  input.forEach((entry) => {
    if (!entry || typeof entry !== 'object') throw new Error('Đính kèm không hợp lệ.');
    const type = String(entry.type || entry.kind || 'item');
    if (type === 'currency') {
      const currency = String(entry.currency || 'spiritStones');
      if (currency !== 'spiritStones') throw new Error('Loại tiền tệ đính kèm không được hỗ trợ.');
      const amount = toPositiveInteger(entry.amount, 0, maxCurrencyAmount);
      if (amount <= 0) throw new Error('Số linh thạch phải lớn hơn 0.');
      const key = `currency:${currency}`;
      const current = merged.get(key);
      merged.set(key, {
        type: 'currency',
        currency,
        amount: Math.min(maxCurrencyAmount, (current?.amount || 0) + amount),
      });
      return;
    }

    const itemId = String(entry.itemId || '').trim();
    const item = catalog.byId.get(itemId);
    if (!item) throw new Error(`Vật phẩm đính kèm không tồn tại: ${itemId || 'trống'}.`);
    const quantity = toPositiveInteger(entry.quantity ?? entry.amount, 1);
    if (quantity <= 0) throw new Error('Số lượng vật phẩm phải lớn hơn 0.');
    const current = merged.get(`item:${item.itemId}`);
    merged.set(`item:${item.itemId}`, {
      type: 'item',
      itemId: item.itemId,
      name: item.name,
      quantity: Math.min(maxAttachmentQuantity, (current?.quantity || 0) + quantity),
    });
  });
  return [...merged.values()];
}

function getMailDocumentView(document) {
  return {
    id: document._id.toString(),
    recipientId: document.recipientId,
    senderType: document.senderType,
    senderId: document.senderId || null,
    title: document.title,
    content: document.content,
    attachments: Array.isArray(document.attachments) ? document.attachments : [],
    createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : document.createdAt,
    readAt: document.readAt instanceof Date ? document.readAt.toISOString() : document.readAt || null,
    claimedAt: document.claimedAt instanceof Date ? document.claimedAt.toISOString() : document.claimedAt || null,
    expiresAt: document.expiresAt instanceof Date ? document.expiresAt.toISOString() : document.expiresAt || null,
  };
}

function getMailSummaryView(document) {
  return {
    id: document._id.toString(),
    title: document.title,
    createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : document.createdAt,
    readAt: document.readAt instanceof Date ? document.readAt.toISOString() : document.readAt || null,
    claimedAt: document.claimedAt instanceof Date ? document.claimedAt.toISOString() : document.claimedAt || null,
  };
}

async function getUserGameState(db, userId) {
  return db.collection(gameStateCollectionName).findOne(
    { userId },
    { projection: { state: 1 } },
  );
}

function hasClaimedDevGame(state) {
  return state?.redeemedCodes && state.redeemedCodes.devgame === true;
}

async function getRequestUser(request, requireAdmin = false) {
  const authentication = await getAuthenticatedSession(request);
  if (authentication.error) return { error: authentication.error };
  const user = authentication.user;
  if (!user) return { error: { status: 401, code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required.' } };
  const db = await getDatabase();
  const gameState = await getUserGameState(db, user.id);
  const isAdmin = hasClaimedDevGame(gameState?.state);
  if (requireAdmin) {
    if (!isAdmin) {
      return { error: { status: 403, message: 'Chỉ tài khoản đã nhận code devgame mới được gửi thư.' } };
    }
  }
  await ensureMailIndexes(db);
  return { user, db, isAdmin };
}

function sendRequestError(response, error) {
  return sendJson(response, error.status, { error: error.message, code: error.code });
}

async function resolveRecipient(db, recipientId, recipientUsername) {
  const users = db.collection(userCollectionName);
  const id = String(recipientId || '').trim();
  if (id) {
    if (!ObjectId.isValid(id)) return null;
    return users.findOne({ _id: new ObjectId(id) }, { projection: { username: 1 } });
  }
  const username = String(recipientUsername || '').trim();
  if (!username) return null;
  if (ObjectId.isValid(username)) {
    return users.findOne({ _id: new ObjectId(username) }, { projection: { username: 1 } });
  }
  return users.findOne({ usernameLower: username.toLowerCase() }, { projection: { username: 1 } });
}

function validateMailText(value, label, maximum) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${label} không được để trống.`);
  if (text.length > maximum) throw new Error(`${label} quá dài.`);
  return text;
}

async function createMail({ db, recipientId, senderType, senderId = null, title, content, attachments = [], expiresAt = null }) {
  const normalizedAttachments = normalizeAttachments(attachments);
  const now = new Date();
  const document = {
    recipientId: String(recipientId),
    senderType: senderType === 'system' ? 'system' : 'admin',
    title: validateMailText(title, 'Tiêu đề thư', 120),
    content: validateMailText(content, 'Nội dung thư', 5000),
    attachments: normalizedAttachments,
    createdAt: now,
    readAt: null,
    claimedAt: null,
  };
  if (senderId) document.senderId = String(senderId);
  const expiry = toDate(expiresAt);
  if (expiry && expiry > now) document.expiresAt = expiry;
  const result = await db.collection(mailCollectionName).insertOne(document);
  return getMailDocumentView({ ...document, _id: result.insertedId });
}

function cloneState(state) {
  return JSON.parse(JSON.stringify(state && typeof state === 'object' ? state : {}));
}

function applyAttachmentsToState(state, attachments) {
  const nextState = cloneState(state);
  nextState.shopInventoryCounts = {
    ...(nextState.shopInventoryCounts && typeof nextState.shopInventoryCounts === 'object' ? nextState.shopInventoryCounts : {}),
  };
  nextState.skillBooks = {
    ...(nextState.skillBooks && typeof nextState.skillBooks === 'object' ? nextState.skillBooks : {}),
  };
  nextState.skillFragments = {
    ...(nextState.skillFragments && typeof nextState.skillFragments === 'object' ? nextState.skillFragments : {}),
  };
  attachments.forEach((attachment) => {
    if (attachment.type === 'currency') {
      nextState.playerSpiritStones = Math.max(0, Number(nextState.playerSpiritStones) || 0) + attachment.amount;
      return;
    }
    const itemId = attachment.itemId;
    const quantity = attachment.quantity;
    if (itemId.startsWith('skillBook:')) {
      const skillId = itemId.slice('skillBook:'.length);
      nextState.skillBooks[skillId] = (Number(nextState.skillBooks[skillId]) || 0) + quantity;
      return;
    }
    if (itemId.startsWith('skillFragment:')) {
      const skillId = itemId.slice('skillFragment:'.length);
      nextState.skillFragments[skillId] = (Number(nextState.skillFragments[skillId]) || 0) + quantity;
      return;
    }
    const equipmentChestMatch = itemId.match(/^equipmentChestTier(\d+)$/);
    if (equipmentChestMatch) {
      const chestTier = Math.max(1, Math.min(10, Number(equipmentChestMatch[1]) || 1));
      const chests = Array.isArray(nextState.equipmentChestInventory)
        ? nextState.equipmentChestInventory
        : [];
      const existing = chests.find((chest) => Number(chest?.tier || chest?.chestTier) === chestTier);
      if (existing) {
        existing.count = (Number(existing.count) || 0) + quantity;
      } else {
        chests.push({
          id: `mail-equipment-chest-${chestTier}`,
          type: 'equipmentChest',
          name: `Rương trang bị cấp ${chestTier}`,
          majorRealmIndex: Math.max(0, chestTier - 1),
          tier: chestTier,
          chestTier,
          count: quantity,
        });
      }
      nextState.equipmentChestInventory = chests;
      return;
    }
    if (itemId === 'enhancementStone') {
      nextState.enhancementStones = (Number(nextState.enhancementStones) || 0) + quantity;
      return;
    }
    if (itemId === 'healthPotion') {
      nextState.healthPotionCount = (Number(nextState.healthPotionCount) || 0) + quantity;
      return;
    }
    if (itemId === 'manaPotion') {
      nextState.manaPotionCount = (Number(nextState.manaPotionCount) || 0) + quantity;
      return;
    }
    nextState.shopInventoryCounts[itemId] = (Number(nextState.shopInventoryCounts[itemId]) || 0) + quantity;
  });
  return nextState;
}

async function claimMail(userId, sessionId, mailId) {
  if (!ObjectId.isValid(mailId)) return { status: 404, payload: { error: 'Thư không tồn tại.' } };
  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_DB || 'tutien');
  await ensureMailIndexes(db);
  const session = client.startSession();
  let result = { status: 500, payload: { error: 'Không thể nhận thư.' } };
  try {
    await session.withTransaction(async () => {
      const mailCollection = db.collection(mailCollectionName);
      const stateCollection = db.collection(gameStateCollectionName);
      const account = await db.collection(userCollectionName).findOne(
        { _id: new ObjectId(userId), activeSessionId: sessionId },
        { projection: { _id: 1 }, session },
      );
      if (!account) {
        result = {
          status: 409,
          payload: {
            error: 'Tài khoản đã được đăng nhập trên thiết bị khác.',
            code: 'SESSION_REPLACED',
          },
        };
        return;
      }
      const mail = await mailCollection.findOne(
        { _id: new ObjectId(mailId), recipientId: userId },
        { session },
      );
      if (!mail) {
        result = { status: 404, payload: { error: 'Thư không tồn tại.' } };
        return;
      }
      if (mail.claimedAt) {
        result = { status: 409, payload: { error: 'Phần thưởng thư đã được nhận.' } };
        return;
      }
      if (mail.expiresAt && mail.expiresAt <= new Date()) {
        result = { status: 410, payload: { error: 'Thư đã hết hạn nhận phần thưởng.' } };
        return;
      }
      const stateDocument = await stateCollection.findOne({ userId }, { session });
      if (!stateDocument?.state || typeof stateDocument.state !== 'object') {
        result = { status: 409, payload: { error: 'Chưa có dữ liệu game để nhận phần thưởng.' } };
        return;
      }
      const claimedMailIds = Array.isArray(stateDocument.state.claimedMailIds)
        ? stateDocument.state.claimedMailIds.map(String)
        : [];
      if (claimedMailIds.includes(mailId)) {
        await mailCollection.updateOne(
          { _id: mail._id, recipientId: userId, claimedAt: null },
          { $set: { claimedAt: new Date(), readAt: mail.readAt || new Date() } },
          { session },
        );
        result = { status: 409, payload: { error: 'Phần thưởng thư đã được nhận.' } };
        return;
      }
      const nextState = applyAttachmentsToState(stateDocument.state, mail.attachments || []);
      nextState.claimedMailIds = [...new Set([...claimedMailIds, mailId])].slice(-500);
      const updatedAt = new Date();
      nextState.lastActiveAt = Math.max(Number(nextState.lastActiveAt) || 0, updatedAt.getTime());
      await stateCollection.updateOne(
        { _id: stateDocument._id },
        { $set: { state: nextState, updatedAt, activeSessionId: sessionId }, $inc: { saveVersion: 1 } },
        { session },
      );
      const claimedAt = new Date();
      const mailUpdate = await mailCollection.updateOne(
        { _id: mail._id, recipientId: userId, claimedAt: null },
        { $set: { claimedAt, readAt: mail.readAt || claimedAt } },
        { session },
      );
      if (mailUpdate.modifiedCount !== 1) throw new Error('Mail claim state changed during transaction.');
      result = { status: 200, payload: { ok: true, mail: getMailDocumentView({ ...mail, claimedAt, readAt: mail.readAt || claimedAt }) } };
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally {
    await session.endSession();
  }
  return result;
}

async function handleGet(request, response, url) {
  const context = await getRequestUser(request);
  if (context.error) return sendRequestError(response, context.error);
  const { user, db } = context;
  const mode = String(url.searchParams.get('mode') || 'list').toLowerCase();
  const collection = db.collection(mailCollectionName);
  if (mode === 'access') {
    return sendJson(response, 200, { ok: true, mode: 'access', isAdmin: context.isAdmin });
  }
  if (mode === 'catalog') {
    const admin = await getRequestUser(request, true);
    if (admin.error) return sendRequestError(response, admin.error);
    return sendJson(response, 200, { items: getMailCatalog().items, isAdmin: true });
  }
  if (mode === 'accounts') {
    const admin = await getRequestUser(request, true);
    if (admin.error) return sendRequestError(response, admin.error);
    const query = String(url.searchParams.get('q') || '').trim().slice(0, 32);
    if (query.length < 2) return sendJson(response, 200, { accounts: [] });
    const users = db.collection(userCollectionName);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const conditions = [{ usernameLower: { $regex: escaped.toLowerCase(), $options: 'i' } }];
    if (ObjectId.isValid(query)) conditions.push({ _id: new ObjectId(query) });
    const accounts = await users.find({ $or: conditions }, { projection: { username: 1 } }).limit(8).toArray();
    return sendJson(response, 200, { accounts: accounts.map((account) => ({ id: account._id.toString(), username: account.username })), isAdmin: true });
  }
  if (mode === 'poll') {
    const since = toDate(url.searchParams.get('since'));
    const newQuery = { recipientId: user.id };
    if (since) newQuery.createdAt = { $gt: since };
    const newCount = await collection.countDocuments(newQuery);
    const latest = await collection.findOne({ recipientId: user.id }, { sort: { createdAt: -1 }, projection: { createdAt: 1 } });
    const unreadCount = await collection.countDocuments({ recipientId: user.id, readAt: null });
    if (!newCount) {
      return sendJson(response, 200, {
        ok: true,
        mode: 'poll',
        isAdmin: context.isAdmin,
        newCount: 0,
        unreadCount,
        latestCreatedAt: latest?.createdAt?.toISOString?.() || null,
      });
    }
    const newMessages = await collection.find(newQuery, { projection: { title: 1, createdAt: 1, readAt: 1, claimedAt: 1 } })
      .sort({ createdAt: 1 })
      .limit(10)
      .toArray();
    return sendJson(response, 200, {
      ok: true,
      mode: 'poll',
      isAdmin: context.isAdmin,
      newCount,
      unreadCount,
      latestCreatedAt: latest?.createdAt?.toISOString?.() || null,
      messages: newMessages.map(getMailSummaryView),
    });
  }
  const limit = Math.max(1, Math.min(50, Math.floor(Number(url.searchParams.get('limit')) || 30)));
  const query = { recipientId: user.id };
  const before = toDate(url.searchParams.get('before'));
  if (before) query.createdAt = { $lt: before };
  const messages = await collection.find(query).sort({ createdAt: -1 }).limit(limit + 1).toArray();
  const hasMore = messages.length > limit;
  const visibleMessages = messages.slice(0, limit);
  const unreadCount = await collection.countDocuments({ recipientId: user.id, readAt: null });
  const latest = await collection.findOne({ recipientId: user.id }, { sort: { createdAt: -1 }, projection: { createdAt: 1 } });
  return sendJson(response, 200, {
    ok: true,
    mode: 'list',
    isAdmin: context.isAdmin,
    messages: visibleMessages.map(getMailDocumentView),
    unreadCount,
    latestCreatedAt: latest?.createdAt?.toISOString?.() || null,
    nextBefore: hasMore ? visibleMessages[visibleMessages.length - 1]?.createdAt?.toISOString?.() : null,
  });
}

async function handlePost(request, response) {
  const payload = await readBody(request);
  if (!payload || typeof payload !== 'object') return sendJson(response, 400, { error: 'Dữ liệu không hợp lệ.' });
  const action = String(payload.action || '').toLowerCase();
  if (action === 'send') {
    const context = await getRequestUser(request, true);
    if (context.error) return sendRequestError(response, context.error);
    const recipient = await resolveRecipient(context.db, payload.recipientId, payload.recipientUsername || payload.recipient);
    if (!recipient) return sendJson(response, 404, { error: 'Không tìm thấy tài khoản người nhận.' });
    let mail;
    try {
      mail = await createMail({
        db: context.db,
        recipientId: recipient._id.toString(),
        senderType: 'admin',
        senderId: context.user.id,
        title: payload.title,
        content: payload.content,
        attachments: payload.attachments,
        expiresAt: payload.expiresAt,
      });
    } catch (error) {
      return sendJson(response, 400, { error: error.message || 'Dữ liệu thư không hợp lệ.' });
    }
    return sendJson(response, 201, { ok: true, mail });
  }

  const context = await getRequestUser(request);
  if (context.error) return sendRequestError(response, context.error);
  if (action === 'read') {
    if (!ObjectId.isValid(String(payload.mailId || ''))) return sendJson(response, 404, { error: 'Thư không tồn tại.' });
    await context.db.collection(mailCollectionName).updateOne(
      { _id: new ObjectId(String(payload.mailId)), recipientId: context.user.id, readAt: null },
      { $set: { readAt: new Date() } },
    );
    return sendJson(response, 200, { ok: true });
  }
  if (action === 'claim') {
    const result = await claimMail(context.user.id, context.user.sessionId, String(payload.mailId || ''));
    return sendJson(response, result.status, result.payload);
  }
  return sendJson(response, 400, { error: 'Thao tác thư không hợp lệ.' });
}

async function sendSystemMail(options = {}) {
  const db = await getDatabase();
  const recipient = await resolveRecipient(db, options.recipientId, options.recipientUsername);
  if (!recipient) throw new Error('Không tìm thấy tài khoản người nhận.');
  await ensureMailIndexes(db);
  return createMail({
    db,
    recipientId: recipient._id.toString(),
    senderType: 'system',
    title: options.title,
    content: options.content,
    attachments: options.attachments,
    expiresAt: options.expiresAt,
  });
}

module.exports = async function mailHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }
  if (!['GET', 'POST'].includes(request.method)) return sendJson(response, 405, { error: 'Method not allowed.' });
  if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET) {
    return sendJson(response, 503, { error: 'MongoDB is not configured.' });
  }
  try {
    const url = new URL(request.url || '/api/mail', 'http://localhost');
    if (request.method === 'GET') return await handleGet(request, response, url);
    return await handlePost(request, response);
  } catch (error) {
    console.error('MongoDB mail error:', error);
    return sendJson(response, 500, { error: 'Dịch vụ thư tạm thời không khả dụng.' });
  }
};

module.exports.sendSystemMail = sendSystemMail;
