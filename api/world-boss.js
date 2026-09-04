const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { getDatabase, getMongoClient } = require('./_mongodb');
const { getAuthenticatedSession } = require('./_auth');

const userCollectionName = process.env.MONGODB_USER_COLLECTION || 'user_accounts';
const gameStateCollectionName = process.env.MONGODB_COLLECTION || 'gameStates';
const bossCollectionName = process.env.MONGODB_WORLD_BOSS_COLLECTION || 'world_bosses';
const mailCollectionName = process.env.MONGODB_MAIL_COLLECTION || 'system_mails';
let gameConfig;
let cultivationRealms;
let indexesPromise;

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

function getGameConfig() {
  if (!gameConfig) gameConfig = readDataFile('GameConfig.json');
  return gameConfig;
}

function getCultivationRealms() {
  if (!cultivationRealms) cultivationRealms = readDataFile('CultivationRealms.json').realms || [];
  return cultivationRealms;
}

function getWorldBossConfig() {
  const configured = getGameConfig().gameplay?.worldBoss;
  return configured && typeof configured === 'object' ? configured : {};
}

function getRealm(realmIndex) {
  const realms = getCultivationRealms();
  return realms[Math.max(0, Math.min(realms.length - 1, Math.floor(Number(realmIndex) || 0)))] || realms[0] || {};
}

function getRealmText(realmIndex) {
  const realm = getRealm(realmIndex);
  const minorName = Array.isArray(realm.minorRealms) ? realm.minorRealms[0] : 'Nhất tầng';
  return `${realm.name || 'Tu sĩ'} cảnh ${minorName}`;
}

function getMaxAttempts(config) {
  return Math.max(1, Math.floor(Number(config.maxAttemptsPerPlayer) || 3));
}

function getLeaderboardSize(config) {
  return Math.max(1, Math.floor(Number(config.leaderboardSize ?? config.maxParticipants) || 10));
}

function getBossMaxHp(config) {
  return Math.max(1, Math.floor(Number(config.bossMaxHp) || 1000000000));
}

function getRespawnMs(config) {
  return Math.max(1000, Math.floor(Number(config.respawnMs) || 8 * 60 * 60 * 1000));
}

function createId() {
  return crypto.randomBytes(18).toString('hex');
}

function createWorldBoss(realmIndex, now = new Date()) {
  const config = getWorldBossConfig();
  const realm = getRealm(realmIndex);
  const maxHp = getBossMaxHp(config);
  return {
    realmIndex,
    bossId: createId(),
    bossName: String(config.bossName || 'Thiên Ngoại Ma Tướng'),
    realmName: String(realm.name || 'Tu sĩ'),
    realmText: getRealmText(realmIndex),
    maxHp,
    currentHp: maxHp,
    state: 'active',
    createdAt: now,
    updatedAt: now,
    killedAt: null,
    respawnAt: null,
    participants: [],
    rewardMailIssuedAt: null,
    killerUserId: null,
  };
}

async function ensureIndexes(db) {
  if (!indexesPromise) {
    const bossCollection = db.collection(bossCollectionName);
    const mailCollection = db.collection(mailCollectionName);
    indexesPromise = Promise.all([
      bossCollection.createIndex({ realmIndex: 1 }, { unique: true }),
      bossCollection.createIndex({ state: 1, respawnAt: 1 }),
      mailCollection.createIndex({ sourceKey: 1 }, { unique: true, sparse: true }),
    ]);
  }
  return indexesPromise;
}

async function getPlayerState(db, userId) {
  const document = await db.collection(gameStateCollectionName).findOne(
    { userId },
    { projection: { state: 1 } },
  );
  return document?.state && typeof document.state === 'object' ? document.state : null;
}

async function getRequestContext(request) {
  const authentication = await getAuthenticatedSession(request);
  if (authentication.error) return { error: authentication.error };
  if (!authentication.user) {
    return { error: { status: 401, code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required.' } };
  }
  const db = await getDatabase();
  await ensureIndexes(db);
  const state = await getPlayerState(db, authentication.user.id);
  if (!state) {
    return { error: { status: 409, code: 'GAME_STATE_REQUIRED', message: 'Chưa có dữ liệu game để tham gia Boss thế giới.' } };
  }
  const realmCount = getCultivationRealms().length;
  const realmIndex = Math.max(0, Math.min(
    Math.max(0, realmCount - 1),
    Math.floor(Number(state.playerMajorRealmIndex) || 0),
  ));
  return { db, user: authentication.user, state, realmIndex };
}

async function ensureWorldBoss(db, realmIndex) {
  const collection = db.collection(bossCollectionName);
  let boss = await collection.findOne({ realmIndex });
  if (!boss) {
    const fresh = createWorldBoss(realmIndex);
    try {
      const result = await collection.insertOne(fresh);
      boss = { ...fresh, _id: result.insertedId };
    } catch (error) {
      if (error?.code !== 11000) throw error;
      boss = await collection.findOne({ realmIndex });
    }
  }
  if (boss?.state === 'cooldown' && new Date(boss.respawnAt).getTime() <= Date.now()) {
    const fresh = createWorldBoss(realmIndex);
    await collection.replaceOne({ _id: boss._id, state: 'cooldown' }, { ...fresh, _id: boss._id });
    boss = await collection.findOne({ _id: boss._id });
  }
  return boss;
}

function sortParticipants(participants = []) {
  return [...participants].sort((left, right) => {
    const damageDifference = Number(right.damage || 0) - Number(left.damage || 0);
    if (damageDifference) return damageDifference;
    return new Date(left.lastAttackAt || 0).getTime() - new Date(right.lastAttackAt || 0).getTime();
  });
}

function getRankReward(rank, config) {
  const rewards = config.normalRewards && typeof config.normalRewards === 'object'
    ? config.normalRewards
    : {};
  const reward = rewards[String(rank)] || rewards['6-10'] || {};
  return {
    spiritStones: Math.max(0, Math.floor(Number(reward.spiritStones) || 0)),
    enhancementStones: Math.max(0, Math.floor(Number(reward.enhancementStones) || 0)),
  };
}

function getKillReward(config) {
  const reward = config.killReward && typeof config.killReward === 'object' ? config.killReward : {};
  return {
    spiritStones: Math.max(0, Math.floor(Number(reward.spiritStones) || 0)),
    enhancementStones: Math.max(0, Math.floor(Number(reward.enhancementStones) || 0)),
  };
}

function toAttachments(reward) {
  const attachments = [];
  if (reward.spiritStones > 0) {
    attachments.push({ type: 'currency', currency: 'spiritStones', amount: reward.spiritStones });
  }
  if (reward.enhancementStones > 0) {
    attachments.push({
      type: 'item',
      itemId: 'enhancementStone',
      name: 'Đá cường hóa',
      quantity: reward.enhancementStones,
    });
  }
  return attachments;
}

function getParticipantView(participant, rank, maxHp, currentUserId) {
  const damage = Math.max(0, Math.floor(Number(participant.damage) || 0));
  return {
    rank,
    userId: participant.userId,
    name: participant.characterName || 'Vô danh',
    damage,
    damagePercent: maxHp > 0 ? Math.min(100, (damage / maxHp) * 100) : 0,
    attacksUsed: Array.isArray(participant.attackIds) ? participant.attackIds.length : 0,
    isCurrentUser: participant.userId === currentUserId,
  };
}

function getBossView(boss, userId) {
  const config = getWorldBossConfig();
  const participants = sortParticipants(boss?.participants || []);
  const currentUser = participants.find((participant) => participant.userId === userId);
  const currentUserRank = currentUser ? participants.indexOf(currentUser) + 1 : null;
  const currentHp = Math.max(0, Math.floor(Number(boss?.currentHp) || 0));
  const maxHp = Math.max(1, Math.floor(Number(boss?.maxHp) || getBossMaxHp(config)));
  const state = boss?.state === 'cooldown' ? 'cooldown' : 'active';
  return {
    bossId: boss.bossId,
    bossName: boss.bossName,
    realmIndex: boss.realmIndex,
    realmName: boss.realmName,
    realmText: boss.realmText,
    maxHp,
    currentHp,
    hpPercent: Math.max(0, Math.min(100, (currentHp / maxHp) * 100)),
    state,
    createdAt: boss.createdAt instanceof Date ? boss.createdAt.toISOString() : boss.createdAt,
    updatedAt: boss.updatedAt instanceof Date ? boss.updatedAt.toISOString() : boss.updatedAt,
    killedAt: boss.killedAt instanceof Date ? boss.killedAt.toISOString() : boss.killedAt || null,
    respawnAt: boss.respawnAt instanceof Date ? boss.respawnAt.toISOString() : boss.respawnAt || null,
    maxAttemptsPerPlayer: getMaxAttempts(config),
    leaderboardSize: getLeaderboardSize(config),
    participantCount: participants.length,
    currentUser: {
      damage: currentUser ? Math.max(0, Math.floor(Number(currentUser.damage) || 0)) : 0,
      rank: currentUserRank,
      attacksUsed: currentUser?.attackIds?.length || 0,
      attemptsRemaining: Math.max(0, getMaxAttempts(config) - (currentUser?.attackIds?.length || 0)),
    },
    participants: participants
      .slice(0, getLeaderboardSize(config))
      .map((participant, index) => getParticipantView(participant, index + 1, maxHp, userId)),
  };
}

function sendError(response, error) {
  return sendJson(response, error.status || 500, { error: error.message || 'World boss service unavailable.', code: error.code });
}

function validateAttackId(value) {
  const attackId = String(value || '').trim();
  return /^[A-Za-z0-9_-]{8,100}$/.test(attackId) ? attackId : '';
}

function createRewardMail({ boss, participant, rank, reward, sourceKeySuffix = 'rank', title, content }) {
  const attachments = toAttachments({
    spiritStones: reward.spiritStones,
    enhancementStones: reward.enhancementStones,
  });
  const damage = Math.max(0, Math.floor(Number(participant.damage) || 0));
  const rankText = rank <= 5 ? `Top ${rank}` : 'Top 6-10';
  return {
    recipientId: participant.userId,
    senderType: 'system',
    title: title || `Thưởng Boss thế giới: ${rankText}`,
    content: content || `Bạn đứng ${rankText} với ${damage} sát thương lên ${boss.bossName}. Phần thưởng theo xếp hạng đã được gửi kèm.`,
    attachments,
    createdAt: new Date(),
    readAt: null,
    claimedAt: null,
    sourceType: 'worldBossReward',
    sourceKey: `${boss.bossId}:${participant.userId}:${sourceKeySuffix}`,
  };
}

async function settleBossRewards({ db, boss, participants, killerUserId, session }) {
  const config = getWorldBossConfig();
  const sorted = sortParticipants(participants);
  const rankLimit = getLeaderboardSize(config);
  const mailCollection = db.collection(mailCollectionName);
  const mailIds = [];
  for (let index = 0; index < Math.min(sorted.length, rankLimit); index += 1) {
    const participant = sorted[index];
    const rank = index + 1;
    const mail = createRewardMail({
      boss,
      participant,
      rank,
      reward: getRankReward(rank, config),
    });
    const existing = await mailCollection.findOne({ sourceKey: mail.sourceKey }, { session });
    if (existing) {
      mailIds.push(existing._id.toString());
      continue;
    }
    const result = await mailCollection.insertOne(mail, { session });
    mailIds.push(result.insertedId.toString());
  }
  const killer = sorted.find((participant) => participant.userId === killerUserId);
  const killReward = getKillReward(config);
  if (killer && (killReward.spiritStones > 0 || killReward.enhancementStones > 0)) {
    const killMail = createRewardMail({
      boss,
      participant: killer,
      rank: sorted.indexOf(killer) + 1,
      reward: killReward,
      sourceKeySuffix: 'kill',
      title: 'Thưởng kết liễu Boss thế giới',
      content: `Bạn đã tung đòn kết liễu ${boss.bossName}. Phần thưởng giết Boss đã được gửi kèm.`,
    });
    const existing = await mailCollection.findOne({ sourceKey: killMail.sourceKey }, { session });
    if (existing) {
      mailIds.push(existing._id.toString());
    } else {
      const result = await mailCollection.insertOne(killMail, { session });
      mailIds.push(result.insertedId.toString());
    }
  }
  return mailIds;
}

async function handleGet(request, response) {
  const context = await getRequestContext(request);
  if (context.error) return sendError(response, context.error);
  const boss = await ensureWorldBoss(context.db, context.realmIndex);
  return sendJson(response, 200, { ok: true, boss: getBossView(boss, context.user.id) });
}

async function handleAttack(request, response) {
  const context = await getRequestContext(request);
  if (context.error) return sendError(response, context.error);
  const payload = await readBody(request);
  if (!payload || typeof payload !== 'object') return sendJson(response, 400, { error: 'Dữ liệu không hợp lệ.' });
  const attackId = validateAttackId(payload.attackId);
  if (!attackId) return sendJson(response, 400, { error: 'Mã lượt đánh không hợp lệ.' });
  const damageValue = Number(payload.damage);
  if (!Number.isSafeInteger(damageValue) || damageValue < 0) {
    return sendJson(response, 400, { error: 'Sát thương phải là số nguyên không âm.' });
  }
  const boss = await ensureWorldBoss(context.db, context.realmIndex);
  if (boss.state !== 'active') {
    return sendJson(response, 409, { error: 'Boss đang hồi sinh.', code: 'WORLD_BOSS_COOLDOWN', boss: getBossView(boss, context.user.id) });
  }
  if (damageValue > boss.maxHp) return sendJson(response, 400, { error: 'Sát thương vượt quá giới hạn hợp lệ.' });

  const client = await getMongoClient();
  const session = client.startSession();
  let result = { status: 500, payload: { error: 'Không thể cập nhật Boss thế giới.' } };
  try {
    await session.withTransaction(async () => {
      const users = context.db.collection(userCollectionName);
      const stateCollection = context.db.collection(gameStateCollectionName);
      const bossCollection = context.db.collection(bossCollectionName);
      const account = await users.findOne(
        { _id: new ObjectId(context.user.id), activeSessionId: context.user.sessionId },
        { projection: { _id: 1 }, session },
      );
      if (!account) {
        result = {
          status: 409,
          payload: { error: 'Tài khoản đã được đăng nhập trên thiết bị khác.', code: 'SESSION_REPLACED' },
        };
        return;
      }
      const stateDocument = await stateCollection.findOne({ userId: context.user.id }, { projection: { state: 1 }, session });
      const state = stateDocument?.state || {};
      const currentRealmIndex = Math.max(0, Math.min(
        Math.max(0, getCultivationRealms().length - 1),
        Math.floor(Number(state.playerMajorRealmIndex) || 0),
      ));
      if (currentRealmIndex !== context.realmIndex) {
        result = { status: 409, payload: { error: 'Cảnh giới đã thay đổi, hãy tải lại Boss thế giới.', code: 'WORLD_BOSS_REALM_CHANGED' } };
        return;
      }
      const currentBoss = await bossCollection.findOne({ _id: boss._id }, { session });
      if (!currentBoss || currentBoss.state !== 'active') {
        result = { status: 409, payload: { error: 'Boss vừa được người khác hạ, hãy tải lại dữ liệu.', code: 'WORLD_BOSS_UPDATED' } };
        return;
      }
      const participants = Array.isArray(currentBoss.participants)
        ? currentBoss.participants.map((participant) => ({ ...participant, attackIds: [...(participant.attackIds || [])] }))
        : [];
      let participant = participants.find((entry) => entry.userId === context.user.id);
      if (participant?.attackIds?.includes(attackId)) {
        result = { status: 200, payload: { ok: true, alreadyProcessed: true, boss: getBossView(currentBoss, context.user.id) } };
        return;
      }
      if (participant && participant.attackIds.length >= getMaxAttempts(getWorldBossConfig())) {
        result = { status: 409, payload: { error: 'Bạn đã dùng hết 3 lượt đánh Boss.', code: 'WORLD_BOSS_ATTEMPTS_EXHAUSTED' } };
        return;
      }
      const now = new Date();
      const appliedDamage = Math.min(damageValue, Math.max(0, Number(currentBoss.currentHp) || 0));
      if (!participant) {
        participant = {
          userId: context.user.id,
          characterName: String(state.playerName || context.user.username || 'Vô danh').trim().slice(0, 40) || 'Vô danh',
          damage: 0,
          attackIds: [],
          lastAttackAt: now,
        };
        participants.push(participant);
      }
      participant.damage = Math.max(0, Math.floor(Number(participant.damage) || 0)) + appliedDamage;
      participant.attackIds.push(attackId);
      participant.lastAttackAt = now;
      const nextBoss = {
        ...currentBoss,
        currentHp: Math.max(0, Math.floor(Number(currentBoss.currentHp) || 0) - appliedDamage),
        participants,
        updatedAt: now,
      };
      let mailIds = [];
      if (nextBoss.currentHp <= 0) {
        nextBoss.state = 'cooldown';
        nextBoss.killedAt = now;
        nextBoss.respawnAt = new Date(now.getTime() + getRespawnMs(getWorldBossConfig()));
        nextBoss.rewardMailIssuedAt = now;
        nextBoss.killerUserId = context.user.id;
      }
      const updateResult = await bossCollection.replaceOne(
        { _id: currentBoss._id, state: 'active' },
        nextBoss,
        { session },
      );
      if (updateResult.matchedCount !== 1) {
        result = {
          status: 409,
          payload: { error: 'Boss vừa được người khác cập nhật, hãy tải lại dữ liệu.', code: 'WORLD_BOSS_UPDATED' },
        };
        return;
      }
      if (nextBoss.currentHp <= 0) {
        mailIds = await settleBossRewards({
          db: context.db,
          boss: currentBoss,
          participants,
          killerUserId: nextBoss.killerUserId,
          session,
        });
      }
      result = {
        status: 200,
        payload: {
          ok: true,
          acceptedDamage: appliedDamage,
          killed: nextBoss.currentHp <= 0,
          rewardMailCount: mailIds.length,
          boss: getBossView(nextBoss, context.user.id),
        },
      };
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally {
    await session.endSession();
  }
  return sendJson(response, result.status, result.payload);
}

module.exports = async function worldBossHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }
  if (!['GET', 'POST'].includes(request.method)) return sendJson(response, 405, { error: 'Method not allowed.' });
  if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET) {
    return sendJson(response, 503, { error: 'World boss service is not configured.' });
  }
  try {
    if (request.method === 'GET') return await handleGet(request, response);
    const payload = request.body;
    if (payload?.action && String(payload.action).toLowerCase() !== 'attack') {
      return sendJson(response, 400, { error: 'Thao tác Boss thế giới không hợp lệ.' });
    }
    return await handleAttack(request, response);
  } catch (error) {
    console.error('World boss service error:', error);
    return sendJson(response, 500, { error: 'Dịch vụ Boss thế giới tạm thời không khả dụng.' });
  }
};
