// Activity tab handlers. Shared state remains owned by main.js.
function getBeastHuntConfig() {
  return gameConfig.gameplay?.beastHunt && typeof gameConfig.gameplay.beastHunt === 'object'
    ? gameConfig.gameplay.beastHunt
    : {};
}

function getBeastHuntUnlockTier() {
  return Math.max(1, Math.floor(Number(getBeastHuntConfig().unlockRequiredTier) || 21));
}

function getBeastHuntRespawnMs() {
  return Math.max(60000, Math.floor(Number(getBeastHuntConfig().respawnMs) || 3600000));
}

function getBeastHuntRewardConfig() {
  return getBeastHuntConfig().reward && typeof getBeastHuntConfig().reward === 'object'
    ? getBeastHuntConfig().reward
    : {};
}

function getTrainingDummyConfig() {
  return gameConfig.gameplay?.trainingDummy && typeof gameConfig.gameplay.trainingDummy === 'object'
    ? gameConfig.gameplay.trainingDummy
    : {};
}

function getTrainingDummyMaxHp() {
  return Math.max(1, Math.floor(Number(getTrainingDummyConfig().maxHp) || 1000000000));
}

function getTrainingDummyMaxTurns() {
  return Math.max(1, Math.floor(Number(getTrainingDummyConfig().maxTurns) || maxTurns));
}

function isWorldBossInDevelopment() {
  const config = gameConfig.gameplay?.worldBoss;
  return config?.enabled === false || config?.status === 'development';
}

function createTrainingDummyStage() {
  return {
    id: `training-dummy-${Date.now()}`,
    isTrainingDummy: true,
    dummyMaxHp: getTrainingDummyMaxHp(),
    enemyTier: playerLevel,
    enemyLevel: playerLevel,
    enemyMajorRealmIndex: playerMajorRealmIndex,
    title: 'Mộc nhân',
    realmText: 'Mộc nhân thử chiêu',
    enemyData: {
      id: 'training_dummy',
      name: 'Mộc nhân',
      skillName: 'Không phản công',
      skillDescription: 'Mộc nhân không tấn công người chơi.',
    },
  };
}

function renderTrainingDummyActivity() {
  const list = $('activityList');
  const summary = $('activitySummary');
  if (!list) return;
  if (summary) summary.textContent = 'Thử sát thương với mộc nhân, không nhận thưởng và không bị phản công.';
  const resultMarkup = trainingDummyLastTurns > 0
    ? `
      <div class="enemy-encounter-summary training-dummy-result">
        <span><b>Tổng sát thương lần trước</b><strong>${formatGameNumber(trainingDummyLastDamage)}</strong></span>
        <span><b>Số lượt thử</b><strong>${formatGameNumber(trainingDummyLastTurns)}</strong></span>
      </div>
    `
    : '';
  list.innerHTML = `
    <article class="activity-item training-dummy-activity">
      <div class="activity-item-heading">
        <span><i class="game-icon icon-sword" aria-hidden="true"></i>Mộc nhân</span>
        <strong>${formatGameNumber(getTrainingDummyMaxHp())} sinh lực</strong>
      </div>
      <h3>Thử sát thương</h3>
      <p>Mộc nhân có ${formatGameNumber(getTrainingDummyMaxHp())} sinh lực, không tấn công và không làm thay đổi phần thưởng/ngao du.</p>
      ${resultMarkup}
      <button type="button" class="breakthrough compact training-dummy-start-button"><i class="game-icon icon-sword" aria-hidden="true"></i>Bắt đầu thử</button>
    </article>
  `;
  const startButton = list.querySelector('.training-dummy-start-button');
  setButtonDisabledState(startButton, busy, busy ? 'Trận đấu đang diễn ra.' : '');
  startButton?.addEventListener('click', () => startTrainingDummyBattle());
}

function formatWorldBossCountdown(timestamp) {
  const remainingSeconds = Math.max(0, Math.ceil((new Date(timestamp).getTime() - Date.now()) / 1000));
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  if (minutes > 0) return `${minutes} phút ${seconds} giây`;
  return `${seconds} giây`;
}

function createWorldBossStage(boss = worldBossData?.boss) {
  if (!boss || boss.state !== 'active' || Number(boss.currentHp) <= 0) return null;
  const realmIndex = Math.max(0, Math.floor(Number(boss.realmIndex) || playerMajorRealmIndex));
  const candidates = stageEnemyData.filter(Boolean);
  const source = candidates.length ? candidates[(realmIndex * 7) % candidates.length] : {};
  const enemyData = {
    ...source,
    id: 'world_boss',
    name: boss.bossName || 'Thiên Ngoại Ma Tướng',
    skillName: source.skillName || 'Thiên Ngoại Trấn Thế',
    description: 'Boss thế giới cùng đại cảnh giới với người chơi.',
    rank: 'leader',
    combatStyle: source.combatStyle || 'defense',
  };
  return {
    id: `world-boss-${boss.bossId}`,
    isWorldBoss: true,
    worldBossId: boss.bossId,
    worldBossMaxHp: Math.max(1, Math.floor(Number(boss.maxHp) || 1000000000)),
    worldBossCurrentHp: Math.max(1, Math.floor(Number(boss.currentHp) || 1)),
    enemyTier: 1,
    enemyLevel: 1,
    enemyMajorRealmIndex: realmIndex,
    enemyRankLevel: 3,
    title: boss.realmText || 'Boss thế giới',
    realmText: boss.realmText || 'Boss thế giới',
    enemyData,
  };
}

async function loadWorldBossState({ silent = false } = {}) {
  if (isWorldBossInDevelopment()) return false;
  if (!cloudUser || cloudSessionInvalid) return false;
  if (worldBossLoadInFlight) return worldBossLoadInFlight;
  worldBossLoadInFlight = (async () => {
    try {
      const response = await fetch(`${worldBossEndpoint}?realmIndex=${encodeURIComponent(playerMajorRealmIndex)}`, {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (handleCloudResponseFailure(response, payload)) return false;
      if (!response.ok || !payload.boss) {
        if (!silent) showGameToast(payload.error || 'Không thể tải Boss thế giới.', 'error');
        return false;
      }
      worldBossData = payload;
      if (activeActivityTab === 'worldBoss' && !activityPanel?.classList.contains('is-hidden')) {
        renderWorldBossActivity();
      }
      return true;
    } catch (error) {
      if (!silent) showGameToast('Dịch vụ Boss thế giới tạm thời không khả dụng.', 'error');
      return false;
    } finally {
      worldBossLoadInFlight = null;
    }
  })();
  return worldBossLoadInFlight;
}

function renderWorldBossDevelopmentActivity() {
  const list = $('activityList');
  const summary = $('activitySummary');
  if (!list) return;
  if (summary) summary.textContent = 'Boss thế giới đang được phát triển.';
  list.innerHTML = `
    <div class="activity-empty">
      <i class="activity-icon icon-activity-locked" aria-hidden="true"></i>
      <strong>Boss thế giới</strong>
      <span>Chức năng đang phát triển và sẽ được mở lại trong phiên bản sau.</span>
    </div>
  `;
}

function renderWorldBossActivity() {
  const list = $('activityList');
  const summary = $('activitySummary');
  if (!list) return;
  const boss = worldBossData?.boss;
  if (!boss) {
    if (summary) summary.textContent = 'Đang tải dữ liệu Boss thế giới...';
    list.innerHTML = '<div class="activity-empty"><span>Đang tải Boss thế giới...</span></div>';
    return;
  }
  const isActive = boss.state === 'active' && Number(boss.currentHp) > 0;
  const currentUser = boss.currentUser || {};
  const maxAttempts = Math.max(1, Number(boss.maxAttemptsPerPlayer) || 3);
  const canAttack = isActive && Number(currentUser.attemptsRemaining) > 0;
  if (summary) {
    summary.textContent = isActive
      ? `${formatRealmDisplayText(boss.realmText)} · còn ${formatGameNumber(boss.currentHp)} sinh lực (${Number(boss.hpPercent || 0).toFixed(1)}%)`
      : `Boss đã bị hạ · hồi sinh sau ${formatWorldBossCountdown(boss.respawnAt)}`;
  }
  const participantRows = Array.isArray(boss.participants) && boss.participants.length
    ? boss.participants.map((participant) => `
      <div class="world-boss-ranking-row${participant.isCurrentUser ? ' is-current-user' : ''}">
        <span><b>#${participant.rank}</b><strong>${escapeMailHtml(participant.name)}${participant.isCurrentUser ? ' (Bạn)' : ''}</strong></span>
        <span>${formatGameNumber(participant.damage)} · ${Number(participant.damagePercent || 0).toFixed(2)}%</span>
      </div>
    `).join('')
    : '<div class="world-boss-ranking-empty">Chưa có người chơi gây sát thương.</div>';
  const actionLabel = !isActive
    ? 'Boss đang hồi sinh'
    : canAttack ? 'Vào đánh Boss' : 'Đã hết 3 lượt đánh';
  const actionHint = !isActive
    ? `Boss sẽ xuất hiện lại sau ${formatWorldBossCountdown(boss.respawnAt)}.`
    : `Bạn đã dùng ${Number(currentUser.attacksUsed) || 0}/${maxAttempts} lượt. Mỗi lượt chiến đấu tối đa ${maxTurns} lượt giao tranh.`;
  list.innerHTML = `
    <article class="activity-item world-boss-activity">
      <div class="activity-item-heading">
        <span><i class="activity-icon icon-activity-breakthrough" aria-hidden="true"></i>${escapeMailHtml(boss.bossName)}</span>
        <strong>${escapeMailHtml(formatRealmDisplayText(boss.realmText))}</strong>
      </div>
      <h3>Boss thế giới</h3>
      <p>Người chơi cùng đại cảnh giới chia sẻ một Boss. Bảng xếp hạng được tính theo tổng sát thương gây ra; phần thưởng chỉ gửi qua Thư khi Boss bị hạ.</p>
      <div class="world-boss-hp">
        <div class="world-boss-hp-heading"><span>Sinh lực Boss</span><strong>${Number(boss.hpPercent || 0).toFixed(1)}%</strong></div>
        <div class="world-boss-hp-bar"><i style="width: ${Math.max(0, Math.min(100, Number(boss.hpPercent) || 0))}%"></i></div>
        <small>${formatGameNumber(boss.currentHp)} / ${formatGameNumber(boss.maxHp)}</small>
      </div>
      <div class="world-boss-player-status">
        <span><b>Thứ hạng của bạn</b><strong>${currentUser.rank ? `Top ${currentUser.rank}` : 'Chưa xếp hạng'}</strong></span>
        <span><b>Sát thương của bạn</b><strong>${formatGameNumber(currentUser.damage)}</strong></span>
        <span><b>Lượt còn lại</b><strong>${Math.max(0, Number(currentUser.attemptsRemaining) || 0)}/${maxAttempts}</strong></span>
      </div>
      <div class="world-boss-ranking">
        <div class="world-boss-ranking-heading"><strong>Bảng sát thương Top 10</strong><span>${Number(boss.participantCount) || 0} người tham gia</span></div>
        ${participantRows}
      </div>
      <small class="world-boss-action-hint">${actionHint}</small>
      <div class="world-boss-actions">
        <button type="button" class="breakthrough compact world-boss-start-button"><i class="game-icon icon-sword" aria-hidden="true"></i>${actionLabel}</button>
        <button type="button" class="secondary compact world-boss-refresh-button"><i class="game-icon icon-reset" aria-hidden="true"></i>Làm mới</button>
      </div>
    </article>
  `;
  const startButton = list.querySelector('.world-boss-start-button');
  setButtonDisabledState(startButton, !canAttack || worldBossAttackInFlight, worldBossAttackInFlight ? 'Đang cập nhật lượt đánh.' : actionHint);
  startButton?.addEventListener('click', startWorldBossBattle);
  list.querySelector('.world-boss-refresh-button')?.addEventListener('click', () => loadWorldBossState());
}

function canAccessBeastHunt() {
  return getPlayerCultivationTier() >= getBeastHuntUnlockTier();
}

function getBeastHuntEligibleMaps() {
  return wanderMapList.filter((map) => (
    isWanderMapUnlocked(map) && map.id !== currentWanderMapId
  ));
}

function ensureBeastHuntSpawn() {
  if (!canAccessBeastHunt() || beastHuntBattleActive || beastHuntPendingReward) return false;
  if (beastHuntMapId && wanderMaps[beastHuntMapId]) {
    if (Number(beastHuntRespawnAt) > Date.now() || !beastHuntRespawnAt) return false;
    beastHuntMapId = '';
  }
  beastHuntMapId = '';
  if (Number(beastHuntRespawnAt) > Date.now()) return false;
  const eligibleMaps = getBeastHuntEligibleMaps();
  if (!eligibleMaps.length) return false;
  const map = eligibleMaps[Math.floor(Math.random() * eligibleMaps.length)];
  beastHuntMapId = map.id;
  beastHuntRespawnAt = 0;
  beastHuntNotificationPending = true;
  return true;
}

function formatBeastHuntCountdown(timestamp) {
  const remainingSeconds = Math.max(0, Math.ceil((Number(timestamp) - Date.now()) / 1000));
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút ${seconds} giây`;
}

function createBeastHuntStage() {
  const map = wanderMaps[beastHuntMapId];
  if (!map || !canAccessBeastHunt()) return null;
  const tier = getPlayerCultivationTier();
  const enemyData = pickEnemyDataForMapTier(map, tier)
    || stageEnemyData[Math.floor(Math.random() * Math.max(1, stageEnemyData.length))];
  if (!enemyData) return null;
  return {
    id: `beast-hunt-${map.id}-${Date.now()}`,
    isBeastHunt: true,
    mapId: map.id,
    enemyTier: tier,
    enemyLevel: playerLevel,
    enemyMajorRealmIndex: playerMajorRealmIndex,
    enemyRankLevel: 3,
    title: 'Săn yêu vật',
    realmText: getTierRealmText(tier),
    enemyData: {
      ...enemyData,
      name: `${enemyData.name} Thủ lĩnh`,
    },
  };
}

function createBeastHuntReward(stage) {
  const config = getBeastHuntRewardConfig();
  const highestMap = getBestUnlockedWanderMap();
  const equipmentChestTier = getEquipmentChestTier(highestMap);
  const skillChest = getWanderSkillChestShopItem(highestMap);
  const rewardTypes = [
    { type: 'equipmentChest', minKey: 'equipmentChestMin', maxKey: 'equipmentChestMax' },
    { type: 'enhancementStones', minKey: 'enhancementStonesMin', maxKey: 'enhancementStonesMax' },
    { type: 'healthPotions', minKey: 'healthPotionsMin', maxKey: 'healthPotionsMax' },
    { type: 'manaPotions', minKey: 'manaPotionsMin', maxKey: 'manaPotionsMax' },
    { type: 'skillChest', minKey: 'skillChestMin', maxKey: 'skillChestMax' },
  ].filter((entry) => entry.type !== 'skillChest' || skillChest);
  const rewardType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)] || rewardTypes[0];
  const min = Math.max(1, Math.floor(Number(config[rewardType.minKey]) || 1));
  const max = Math.max(min, Math.floor(Number(config[rewardType.maxKey]) || min));
  const reward = {
    type: rewardType.type,
    amount: min + Math.floor(Math.random() * (max - min + 1)),
  };
  if (reward.type === 'equipmentChest') {
    reward.chestTier = equipmentChestTier;
    reward.majorRealmIndex = clamp(Number(playerMajorRealmIndex) || 0, 0, getMajorRealmMaxIndex());
  }
  if (reward.type === 'skillChest') reward.shopItemId = skillChest.id;
  return reward;
}

function normalizeBeastHuntReward(reward) {
  if (!reward || typeof reward !== 'object') return null;
  const allowedTypes = new Set(['equipmentChest', 'enhancementStones', 'healthPotions', 'manaPotions', 'skillChest']);
  const type = String(reward.type || '');
  if (!allowedTypes.has(type)) return null;
  const config = getBeastHuntRewardConfig();
  const minKeyByType = {
    equipmentChest: 'equipmentChestMin',
    enhancementStones: 'enhancementStonesMin',
    healthPotions: 'healthPotionsMin',
    manaPotions: 'manaPotionsMin',
    skillChest: 'skillChestMin',
  };
  const maxKeyByType = {
    equipmentChest: 'equipmentChestMax',
    enhancementStones: 'enhancementStonesMax',
    healthPotions: 'healthPotionsMax',
    manaPotions: 'manaPotionsMax',
    skillChest: 'skillChestMax',
  };
  const rewardMin = Math.max(1, Math.floor(Number(config[minKeyByType[type]]) || 1));
  const rewardMax = Math.max(rewardMin, Math.floor(Number(config[maxKeyByType[type]]) || rewardMin));
  const normalized = {
    type,
    amount: clamp(Math.floor(Number(reward.amount) || rewardMin), rewardMin, rewardMax),
  };
  if (type === 'equipmentChest') {
    normalized.chestTier = clamp(Math.floor(Number(reward.chestTier) || 1), 1, 10);
    normalized.majorRealmIndex = clamp(Math.floor(Number(reward.majorRealmIndex) || 0), 0, getMajorRealmMaxIndex());
  }
  if (type === 'skillChest') {
    const shopItem = shopItems.find((item) => item.id === reward.shopItemId && item.type === 'skillChest');
    if (!shopItem) return null;
    normalized.shopItemId = shopItem.id;
  }
  return normalized;
}

function getBeastHuntRewardEntries(reward = beastHuntPendingReward) {
  if (!reward) return [];
  const amountText = `x${formatGameNumber(reward.amount)}`;
  if (reward.type === 'equipmentChest') {
    return [{ iconClass: 'activity-icon icon-activity-chest', label: `Rương trang bị cấp ${formatGameNumber(reward.chestTier)} ${amountText}` }];
  }
  if (reward.type === 'enhancementStones') {
    return [{ iconClass: 'item-icon icon-item-enhancement-stone', label: `Đá cường hóa ${amountText}` }];
  }
  if (reward.type === 'healthPotions') {
    return [{ iconClass: 'item-icon icon-item-health-pill', label: `Sinh Huyết Đan ${amountText}` }];
  }
  if (reward.type === 'manaPotions') {
    return [{ iconClass: 'item-icon icon-item-mana-flame', label: `Tụ Linh Đan ${amountText}` }];
  }
  const skillChest = shopItems.find((item) => item.id === reward.shopItemId);
  return skillChest ? [{ iconClass: 'activity-icon icon-activity-chest', label: `${skillChest.name} ${amountText}` }] : [];
}

function formatBeastHuntRewardMarkup(reward = beastHuntPendingReward) {
  return getBeastHuntRewardEntries(reward)
    .map((entry) => `<span><i class="${entry.iconClass}" aria-hidden="true"></i>${entry.label}</span>`)
    .join('');
}

function claimBeastHuntReward() {
  const reward = normalizeBeastHuntReward(beastHuntPendingReward);
  if (busy || !reward) return;
  const rewardItems = getBeastHuntRewardEntries(reward);
  beastHuntPendingReward = null;
  if (reward.type === 'equipmentChest') {
    for (let index = 0; index < reward.amount; index += 1) {
      addEquipmentChest({ majorRealmIndex: reward.majorRealmIndex }, { chestTier: reward.chestTier });
    }
  } else if (reward.type === 'enhancementStones') {
    enhancementStones += reward.amount;
  } else if (reward.type === 'healthPotions') {
    healthPotionCount += reward.amount;
  } else if (reward.type === 'manaPotions') {
    manaPotionCount += reward.amount;
  } else if (reward.type === 'skillChest') {
    addShopInventoryItem(reward.shopItemId, reward.amount);
  }
  beastHuntRespawnAt = Date.now() + getBeastHuntRespawnMs();
  beastHuntMapId = '';
  beastHuntNotificationPending = false;
  showGameToast('Đã nhận phần thưởng săn yêu vật.', 'success', rewardItems);
  renderCultivation();
  renderInventory();
  renderShop();
  renderActivities();
  saveGame();
}

function renderBeastHuntEncounterOverlay(stage) {
  if (!stage) return;
  const preview = createStageEnemy(stage);
  wanderEventOverlay.classList.remove('is-hidden');
  wanderEventOverlay.innerHTML = '<div class="wander-event-modal beast-hunt-encounter-modal"></div>';
  const modal = wanderEventOverlay.querySelector('.wander-event-modal');
  modal.innerHTML = `
    <span><i class="activity-icon icon-activity-encounter" aria-hidden="true"></i>Săn yêu vật</span>
    <strong>${stage.enemyData.name}</strong>
    <em>Yêu vật thủ lĩnh đã bị đạo hữu phát hiện.</em>
    <div class="enemy-encounter-meta">
      <span><b>Phẩm chất</b><strong>${getEnemyRankLabel(stage.enemyData, stage.enemyRankLevel)}</strong></span>
      <span><b>Tu vi</b><strong>${formatRealmDisplayText(stage.realmText)}</strong></span>
      <span><b>Nội tại</b><strong>${getCombatStyleLabel(stage.enemyData)}</strong></span>
      <span><b>Skill</b><strong>${stage.enemyData.skillName}</strong></span>
    </div>
    <div class="enemy-encounter-summary">
      <span><b>Lực chiến</b><strong>${formatGameNumber(getCombatPower(preview))}</strong></span>
      <span><b>Phần thưởng</b><strong>Nhận trong Hoạt động nếu thắng</strong></span>
    </div>
    <div class="wander-actions beast-hunt-actions">
      <button type="button" class="breakthrough compact"><i class="item-icon icon-item-sword" aria-hidden="true"></i>Chiến đấu</button>
    </div>
  `;
  const fightButton = modal.querySelector('button');
  setButtonDisabledState(fightButton, !canEnterDungeon(), canEnterDungeon() ? '' : 'Sinh lực chưa đủ để khiêu chiến.');
  fightButton.addEventListener('click', () => {
    hideWanderEventOverlay();
    startBeastHuntBattle(stage);
  });
}

function renderBeastHuntMapEncounter() {
  if (!canAccessBeastHunt()
    || beastHuntMapId !== currentWanderMapId
    || beastHuntBattleActive
    || beastHuntPendingReward
    || Number(beastHuntRespawnAt) > Date.now()
    || !wanderEventOverlay.classList.contains('is-hidden')) return;
  const stage = createBeastHuntStage();
  if (!stage) return;
  renderBeastHuntEncounterOverlay(stage);
}

function renderActivities() {
  ensureBeastHuntSpawn();
  const list = $('activityList');
  const summary = $('activitySummary');
  if (!list || !activityPanel) return;
  activityCategoryFilters?.querySelectorAll('[data-activity-tab]').forEach((tab) => {
    const active = tab.dataset.activityTab === activeActivityTab;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  if (activeActivityTab === 'resourceDungeon') {
    list.classList.add('is-hidden');
    resourceDungeonPanel?.classList.remove('is-hidden');
    if (summary) summary.textContent = 'Chọn một phụ bản để nhận tài nguyên.';
    renderResourceDungeons();
    return;
  }
  if (activeActivityTab === 'playerBattle') {
    list.classList.remove('is-hidden');
    resourceDungeonPanel?.classList.add('is-hidden');
    renderPlayerBattleActivity();
    return;
  }
  if (activeActivityTab === 'trainingDummy') {
    list.classList.remove('is-hidden');
    resourceDungeonPanel?.classList.add('is-hidden');
    renderTrainingDummyActivity();
    return;
  }
  if (activeActivityTab === 'worldBoss') {
    list.classList.remove('is-hidden');
    resourceDungeonPanel?.classList.add('is-hidden');
    if (isWorldBossInDevelopment()) renderWorldBossDevelopmentActivity();
    else renderWorldBossActivity();
    return;
  }
  list.classList.remove('is-hidden');
  resourceDungeonPanel?.classList.add('is-hidden');
  if (!canAccessBeastHunt()) {
    if (summary) summary.textContent = `Mở khóa từ ${getTierRealmText(getBeastHuntUnlockTier())}.`;
    list.innerHTML = `
      <div class="activity-empty">
        <i class="activity-icon icon-activity-locked" aria-hidden="true"></i>
        <strong>Săn yêu vật chưa mở</strong>
        <span>Cần đạt tu vi ${getTierRealmText(getBeastHuntUnlockTier())} để tham gia hoạt động.</span>
      </div>
    `;
    return;
  }

  if (beastHuntPendingReward) {
    if (summary) summary.textContent = 'Đạo hữu có phần thưởng săn yêu vật chưa nhận.';
    list.innerHTML = `
      <article class="activity-item beast-hunt-activity">
        <div class="activity-item-heading">
          <span><i class="activity-icon icon-activity-encounter" aria-hidden="true"></i>Phần thưởng săn yêu vật</span>
          <strong>Đang chờ nhận</strong>
        </div>
        <h3>Chiến thắng yêu vật thủ lĩnh</h3>
        <p>Nhận phần thưởng bên dưới để bắt đầu thời gian hồi yêu vật trong 1 giờ.</p>
        <div class="enemy-encounter-summary">${formatBeastHuntRewardMarkup()}</div>
        <button type="button" class="breakthrough compact beast-hunt-claim-button"><i class="game-icon icon-gift" aria-hidden="true"></i>Nhận thưởng</button>
      </article>
    `;
    list.querySelector('.beast-hunt-claim-button')?.addEventListener('click', claimBeastHuntReward);
    return;
  }

  if (beastHuntMapId) {
    if (summary) summary.textContent = 'Một hoạt động đang chờ đạo hữu khám phá.';
    list.innerHTML = `
      <article class="activity-item beast-hunt-activity">
        <div class="activity-item-heading">
          <span><i class="activity-icon icon-activity-encounter" aria-hidden="true"></i>Săn yêu vật</span>
          <strong>Đang xuất hiện</strong>
        </div>
        <h3>Yêu vật thủ lĩnh đã xuất hiện</h3>
        <p>Yêu vật có tu vi bằng đạo hữu. Hãy vào Ngao du và lần lượt chọn các map đã mở khóa để tìm kiếm.</p>
      </article>
    `;
    return;
  }

  if (summary) summary.textContent = `Yêu vật sẽ xuất hiện lại sau ${formatBeastHuntCountdown(beastHuntRespawnAt)}.`;
  list.innerHTML = `
    <div class="activity-empty">
      <i class="activity-icon icon-activity-encounter" aria-hidden="true"></i>
      <strong>Đang chờ yêu vật xuất hiện lại</strong>
      <span>Thời gian còn lại: ${formatBeastHuntCountdown(beastHuntRespawnAt)}.</span>
    </div>
  `;
}

function startActivityRefresh() {
  window.clearInterval(activityRefreshTimer);
  activityRefreshTimer = 0;
  window.clearInterval(worldBossRefreshTimer);
  worldBossRefreshTimer = 0;
  if (!gameStarted) return;
  activityRefreshTimer = window.setInterval(() => {
    const hadSpawn = Boolean(beastHuntMapId);
    const spawned = ensureBeastHuntSpawn();
    updateNotificationBadges();
    if (spawned && !hadSpawn) {
      if (!activityPanel?.classList.contains('is-hidden')) renderActivities();
      if (!mapPanel?.classList.contains('is-hidden')) renderStageMap();
    } else if (!activityPanel?.classList.contains('is-hidden')) {
      renderActivities();
    }
  }, 1000);
  worldBossRefreshTimer = window.setInterval(() => {
    if (!isWorldBossInDevelopment()
      && activeActivityTab === 'worldBoss'
      && !activityPanel?.classList.contains('is-hidden')) {
      loadWorldBossState({ silent: true });
    }
  }, 5000);
}

function setNotificationBadge(element, count) {
  if (!element) return;
  const safeCount = Math.max(0, Math.floor(Number(count) || 0));
  element.hidden = safeCount <= 0;
  element.textContent = '';
}

function updateNotificationBadges() {
  const readyQuestCount = questData.quests
    .filter((quest) => !quest.hidden)
    .filter((quest) => !temporarilyDisabledQuestCategories.has(quest.category || 'side'))
    .filter(isQuestReady).length;
  const wanderReadyToStart = canEnterDungeon() && !busy && !currentWanderEvent;
  const wanderChestFull = wanderChestRewards.length >= getWanderChestCapacity();
  const pendingWanderCount = Number(wanderReadyToStart || wanderChestFull);
  const trainingCount = Number(dantianCultivation > 0) + Number(canBreakthrough());
  const resourceSweepCount = (progressionFeatures.resourceDungeons || [])
    .filter((dungeon) => getResourceDungeonHighestFloor(dungeon.id) > 0)
    .filter((dungeon) => getRemainingResourceAttempts(dungeon.id) > 0)
    .length;
  setNotificationBadge(questBadge, readyQuestCount);
  setNotificationBadge(dungeonBadge, pendingWanderCount);
  const beastHuntNeedsAttention = beastHuntNotificationPending || beastHuntMapId || beastHuntPendingReward;
  setNotificationBadge(activityBadge, Number(Boolean(beastHuntNeedsAttention) && canAccessBeastHunt()));
  setNotificationBadge(mailBadge, mailUnreadCount);
  setNotificationBadge(trainingBadge, trainingCount);
  setNotificationBadge(resourceDungeonBadge, resourceSweepCount);
  setNotificationBadge(equipmentBadge, Number(hasQuickEquipCandidate()));
  updateFeatureAvailability();
}
