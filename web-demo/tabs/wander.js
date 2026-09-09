// Wander tab handlers. Shared state remains owned by main.js.
function getWanderChestCapacity() {
  const majorRealmIndex = Math.max(0, Math.floor(Number(playerMajorRealmIndex) || 0));
  return Math.max(1, wanderChestCapacity + majorRealmIndex * wanderChestCapacityPerMajorRealm);
}

function renderWanderChestButton() {
  if (!wanderChestButton) return;
  const rewardCount = wanderChestRewards.length;
  const capacity = getWanderChestCapacity();
  const blockedByEvent = Boolean(currentWanderEvent && ['enemy', 'ambush'].includes(currentWanderEvent.type));
  const hasRewards = rewardCount > 0;
  const unavailable = busy || !hasRewards || blockedByEvent;
  const unavailableMessage = busy
    ? 'Đang xử lý ngao du, vui lòng chờ.'
    : blockedByEvent
    ? 'Hãy kết thúc trận đấu trước khi mở rương.'
    : 'Rương Ngao du đang trống.';
  setButtonDisabledState(wanderChestButton, unavailable, unavailableMessage);
  wanderChestButton.classList.toggle('has-rewards', hasRewards);
  wanderChestButton.title = hasRewards
    ? `Rương Ngao du: ${rewardCount}/${capacity} phần thưởng`
    : 'Rương Ngao du đang trống';
  wanderChestButton.setAttribute('aria-label', wanderChestButton.title);
}

function getWanderRewardIconClass(type) {
  if (type === 'cultivation') return 'stat-icon icon-stat-cultivation';
  if (type === 'spiritStone') return 'item-icon icon-item-spirit-stone';
  if (type === 'healthPotion') return 'item-icon icon-item-health-pill';
  if (type === 'manaPotion') return 'item-icon icon-item-mana-flame';
  if (type === 'enhancementStone') return 'item-icon icon-item-enhancement-stone';
  if (type === 'foundation') return 'stat-icon icon-stat-gem';
  if (type === 'equipment') return 'unique-icon icon-unique-equipment';
  return 'activity-icon icon-activity-chest';
}

function openWanderChest() {
  if (busy || !wanderChestRewards.length) return;
  if (currentWanderEvent && ['enemy', 'ambush'].includes(currentWanderEvent.type)) return;

  const previewRewards = groupWanderChestRewards(wanderChestRewards);
  wanderChestOverlay.innerHTML = `
    <div class="wander-event-modal wander-chest-modal" role="dialog" aria-modal="true" aria-label="Kho phần thưởng">
      <button type="button" class="icon-button wander-chest-close" title="Đóng" aria-label="Đóng"><i class="unique-icon icon-unique-close" aria-hidden="true"></i></button>
      <span><i class="activity-icon icon-activity-chest" aria-hidden="true"></i> Kho phần thưởng</span>
      <em>${wanderChestRewards.length}/${getWanderChestCapacity()} phần thưởng đang chờ mở.</em>
      <div class="wander-chest-reward-list">
        ${previewRewards.map((reward) => `
          <div class="wander-chest-reward">
            <i class="${getWanderRewardIconClass(reward.type)}" aria-hidden="true"></i>
            <span>${formatWanderRewardPreview(reward)}</span>
          </div>
        `).join('')}
      </div>
      <button type="button" class="breakthrough compact wander-chest-claim"><i class="activity-icon icon-activity-chest" aria-hidden="true"></i>Mở rương</button>
    </div>
  `;
  wanderChestOverlay.classList.remove('is-hidden');
  wanderChestOverlay.querySelector('.wander-chest-close').addEventListener('click', hideWanderChestOverlay);
  wanderChestOverlay.querySelector('.wander-chest-claim').addEventListener('click', claimWanderChest);
  wanderChestOverlay.addEventListener('click', handleWanderChestBackdropClick, { once: true });
}

function handleWanderChestBackdropClick(event) {
  if (event.target === wanderChestOverlay) hideWanderChestOverlay();
}

function hideWanderChestOverlay() {
  wanderChestOverlay.classList.add('is-hidden');
  wanderChestOverlay.innerHTML = '';
}

function formatWanderRewardPreview(reward) {
  const prefix = reward.count > 1 ? `x${reward.count} ` : '';
  if (reward.type === 'cultivation') return `${prefix}${reward.title}: +${formatGameNumber(reward.amount)} tu vi`;
  if (reward.type === 'spiritStone') return `${prefix}${reward.title}: +${formatGameNumber(reward.amount)} linh thạch`;
  if (reward.type === 'foundation') return `${prefix}${reward.title}: +${formatGameNumber(reward.amount)} căn cơ`;
  return `${prefix}${reward.title}`;
}

function groupWanderChestRewards(rewards = []) {
  const groups = new Map();
  rewards.forEach((reward) => {
    const key = `${reward.type}:${reward.title}`;
    const current = groups.get(key) || { ...reward, count: 0, amount: 0 };
    current.count += 1;
    if (typeof reward.amount === 'number') current.amount += reward.amount;
    groups.set(key, current);
  });
  return [...groups.values()];
}

function setWanderMap(mapId) {
  if (busy || currentWanderEvent?.type === 'traveling' || currentWanderEvent?.type === 'enemy' || currentWanderEvent?.type === 'ambush') return;
  const map = wanderMaps[mapId];
  if (!map) return;
  if (!isWanderMapUnlocked(map)) {
    showLockedFeatureNotice(map.name, `${getWanderMapUnlockText(map)} để mở`);
    return;
  }
  if (map.id === currentWanderMapId) return;

  hideWanderEventOverlay();
  currentWanderMapId = map.id;
  currentWanderEvent = null;
  renderStageMap({ resetWanderCarouselPosition: true });
  saveGame();
  showGameToast(`Đã chọn ${map.name.replace(/^Map \d+:\s*/, '')}.`, 'info');
}

function isWanderMapUnlocked(map) {
  if (!map) return false;
  const mapIndex = wanderMapList.findIndex((entry) => entry.id === map.id);
  if (mapIndex <= 0) return mapIndex === 0;
  const previousMap = wanderMapList[mapIndex - 1];
  return Boolean(previousMap && wanderBossDefeatedByMap[previousMap.id]);
}

function getAvailableEquipmentChestTier() {
  return Math.max(1, Math.ceil(getUnlockedWanderMapCount() / getWanderChestTierStepMaps()));
}

function getWanderChestTierStepMaps() {
  const configured = Number(gameConfig.gameplay?.wanderChestTierStepMaps);
  return Math.max(1, Math.floor(configured) || 4);
}

function getWanderEquipmentChestDistribution(map = getCurrentWanderMap()) {
  const mapNumber = getWanderMapNumber(map);
  const mapsPerTier = getWanderChestTierStepMaps();
  const currentTier = clamp(Math.floor((mapNumber - 1) / mapsPerTier) + 1, 1, 10);
  const progress = Math.max(0, (mapNumber - 1) % mapsPerTier);
  const nextTier = Math.min(10, currentTier + 1);
  if (currentTier >= 10 || progress === 0) return [{ tier: currentTier, chance: 100 }];

  const nextChance = Math.round((progress / mapsPerTier) * 100);
  return [
    { tier: currentTier, chance: 100 - nextChance },
    { tier: nextTier, chance: nextChance },
  ];
}

function pickWanderEquipmentChestTier(map = getCurrentWanderMap()) {
  const distribution = getWanderEquipmentChestDistribution(map);
  let roll = Math.random() * 100;
  for (const entry of distribution) {
    roll -= entry.chance;
    if (roll < 0) return entry.tier;
  }
  return distribution[distribution.length - 1]?.tier || 1;
}

function getWanderEquipmentChestRewardText(map = getCurrentWanderMap()) {
  return getWanderEquipmentChestDistribution(map)
    .map((entry) => `Cấp ${entry.tier} ${entry.chance}%`)
    .join(' · ');
}

function getUnlockedWanderMapCount() {
  return wanderMapList.filter((map) => isWanderMapUnlocked(map)).length;
}

function getWanderMapUnlockText(map) {
  const mapIndex = wanderMapList.findIndex((entry) => entry.id === map?.id);
  if (mapIndex <= 0) return 'Đã mở';
  const previousMap = wanderMapList[mapIndex - 1];
  return previousMap ? `Cần đánh bại Boss ${previousMap.name}` : 'Cần đánh bại Boss map trước';
}

function getBestUnlockedWanderMap() {
  return [...wanderMapList]
    .reverse()
    .find((map) => isWanderMapUnlocked(map)) || wanderMaps.novice;
}

function renderWanderStart(enoughHealth) {
  const map = getCurrentWanderMap();
  syncWanderEncounterToggles(map);
  const minTier = Math.max(1, Number(map.minEnemyTier) || 1);
  const maxTier = Math.max(minTier, Number(map.maxEnemyTier) || minTier);
  const chestRewardText = getWanderEquipmentChestRewardText(map);
  const defeatedCount = getWanderMapDefeatedCount(map.id);
  const bossDefeated = Boolean(wanderBossDefeatedByMap[map.id]);
  const bossRequiredWins = getWanderBossRequiredWins();
  const bossUnlocked = defeatedCount >= bossRequiredWins && !bossDefeated;
  const highEnemyUnlocked = canUseHighEnemyEncounter(map);
  const autoWanderUnlocked = canUseAutoWander(map);
  const highEnemyRequiredWins = Math.max(0, Math.floor(Number(gameConfig.gameplay?.wanderHighEnemyRequiredWins) || 10));
  const panel = document.createElement('section');
  panel.className = 'wander-info-panel';
  panel.innerHTML = `
    <div class="wander-info-heading">
      <strong><i class="activity-icon ${getWanderMapIconClass(map.id)}" aria-hidden="true"></i>${map.name}</strong>
    </div>
    <div class="wander-map-rules">
      <div class="wander-reward-list">
        <strong><i class="game-icon icon-gift" aria-hidden="true"></i>Phần thưởng cơ duyên</strong>
        <span><i class="stat-icon icon-stat-cultivation" aria-hidden="true"></i>Tu vi</span>
        <span><i class="item-icon icon-item-spirit-stone" aria-hidden="true"></i>Linh thạch</span>
        <span title="${chestRewardText}"><i class="special-icon icon-special-equipment-chest" aria-hidden="true"></i>Rương trang bị: ${chestRewardText}</span>
        <span><i class="special-icon icon-special-skill-chest" aria-hidden="true"></i>${getWanderSkillChestName(map)}</span>
        <span><i class="item-icon icon-item-health-pill" aria-hidden="true"></i>Sinh Huyết Đan</span>
        <span><i class="item-icon icon-item-mana-flame" aria-hidden="true"></i>Tụ Linh Đan</span>
        <span><i class="item-icon icon-item-enhancement-stone" aria-hidden="true"></i>Đá cường hóa</span>
        <span><i class="special-icon icon-special-minor-pill" aria-hidden="true"></i>Đan đột phá tiểu cảnh giới</span>
        <span><i class="special-icon icon-special-talent-chest" aria-hidden="true"></i>Rương Thiên Tài Địa Bảo</span>
      </div>
    </div>
    <div class="wander-encounter-toggle">
      <div>
        <strong><i class="activity-icon icon-wander-increase-enemy" aria-hidden="true"></i>Tăng tỉ lệ gặp kẻ địch</strong>
      </div>
      <button type="button" class="secondary compact ${highEnemyEncounterChance ? 'is-active' : ''} ${highEnemyUnlocked ? '' : 'is-locked'}" data-wander-high-enemy aria-pressed="${String(highEnemyEncounterChance)}" aria-disabled="false" title="${highEnemyUnlocked ? 'Tăng tỉ lệ gặp kẻ địch lên 70%' : `Cần đánh bại ${highEnemyRequiredWins} kẻ địch trong map`}">
        <i class="activity-icon icon-wander-increase-enemy" aria-hidden="true"></i>${highEnemyEncounterChance ? 'Đang bật' : 'Bật'}
      </button>
    </div>
    <div class="wander-encounter-toggle">
      <div>
        <strong><i class="activity-icon icon-activity-path" aria-hidden="true"></i>Tự động ngao du</strong>
      </div>
      <button type="button" class="secondary compact ${autoWanderEnabled ? 'is-active' : ''} ${autoWanderUnlocked ? '' : 'is-locked'}" data-wander-auto aria-pressed="${String(autoWanderEnabled)}" aria-disabled="false" title="${autoWanderUnlocked ? 'Tự động ngao du và chiến đấu trong map này' : 'Cần đánh bại Boss trong map'}">
        <i class="activity-icon icon-activity-path" aria-hidden="true"></i>${autoWanderEnabled ? 'Đang bật' : 'Bật'}
      </button>
    </div>
    ${bossDefeated ? '' : `
      <div class="wander-boss-panel">
        <div>
          <strong><i class="activity-icon icon-activity-encounter" aria-hidden="true"></i>Boss map</strong>
          <small>Đã đánh bại ${defeatedCount}/${bossRequiredWins} kẻ địch</small>
        </div>
        <button type="button" class="secondary compact ${bossUnlocked ? '' : 'is-locked'}" data-wander-boss ${buttonDisabledAttributes(false, 'Boss trong map đã bị đánh bại.')}>
          <i class="item-icon icon-item-sword" aria-hidden="true"></i>Khiêu chiến
        </button>
      </div>
    `}
    <small>Sau ${Math.ceil(wanderEventDelay / 1000)} giây sẽ gặp cơ duyên hoặc kẻ địch.</small>
    <button class="${enoughHealth ? 'breakthrough' : 'secondary'}" type="button" data-wander-start>
      <i class="activity-icon icon-activity-path" aria-hidden="true"></i>${enoughHealth ? 'Bắt đầu ngao du' : 'Đang trọng thương'}
    </button>
  `;
  const button = panel.querySelector('[data-wander-start]');
  const encounterToggle = panel.querySelector('[data-wander-high-enemy]');
  setButtonDisabledState(button, !enoughHealth, 'Sinh lực chưa đủ để bắt đầu ngao du.');
  if (autoWanderEnabled) {
    encounterToggle.classList.add('is-locked');
    encounterToggle.title = 'Không dùng cùng Tự động ngao du';
    setButtonDisabledState(encounterToggle, true, 'Không thể bật tăng tỉ lệ gặp kẻ địch khi đang tự động ngao du.');
  }
  button.addEventListener('click', () => beginWander(false));
  encounterToggle.addEventListener('click', () => {
    if (!canUseHighEnemyEncounter(map)) {
      showLockedFeatureNotice('Tăng tỉ lệ gặp kẻ địch', `Cần đánh bại ${highEnemyRequiredWins} kẻ địch trong map`);
      return;
    }
    highEnemyEncounterChance = !highEnemyEncounterChance;
    if (highEnemyEncounterChance) autoWanderEnabled = false;
    saveGame();
    showGameToast(highEnemyEncounterChance ? 'Đã bật tăng tỉ lệ gặp kẻ địch.' : 'Đã tắt tăng tỉ lệ gặp kẻ địch.', 'success');
    renderStageMap();
  });
  const autoWanderToggle = panel.querySelector('[data-wander-auto]');
  autoWanderToggle.addEventListener('click', () => {
    if (!canUseAutoWander(map)) {
      showLockedFeatureNotice('Tự động ngao du', 'Cần đánh bại Boss trong map');
      return;
    }
    autoWanderEnabled = !autoWanderEnabled;
    if (autoWanderEnabled) highEnemyEncounterChance = false;
    saveGame();
    showGameToast(autoWanderEnabled ? 'Đã bật tự động ngao du.' : 'Đã tắt tự động ngao du.', 'success');
    renderStageMap();
    if (autoWanderEnabled) {
      if (canEnterDungeon()) beginWander();
      else {
        autoWanderAfterRecovery = true;
        showTrainingMessage('Tự động ngao du đang chờ hồi phục vì đạo hữu đã trọng thương.');
        scheduleAutoWanderAfterRecovery();
      }
    } else {
      autoWanderAfterRecovery = false;
      window.clearTimeout(autoWanderRecoveryTimer);
      autoWanderRecoveryTimer = 0;
    }
  });
  const bossButton = panel.querySelector('[data-wander-boss]');
  if (bossButton) {
    bossButton.addEventListener('click', () => {
      if (!bossUnlocked) {
        showLockedFeatureNotice('Boss map', `Cần đánh bại ${bossRequiredWins} kẻ địch trong map`);
        return;
      }
      const bossStage = createWanderBossStage(map);
      if (bossStage) {
        showGameToast(`Bắt đầu khiêu chiến Boss ${map.name}.`, 'info');
        startStageBattle(bossStage);
      }
    });
  }
  stageGrid.appendChild(panel);
}

function beginWander() {
  if (busy) return;
  if (autoWanderEnabled && wanderChestRewards.length >= getWanderChestCapacity()) {
    claimWanderChest();
  }
  if (!canEnterDungeon()) {
    renderCultivation();
    showTrainingMessage('Đang bị trọng thương, không thể ngao du tiếp.');
    showGameToast('Đang bị trọng thương, không thể ngao du tiếp.', 'error');
    return;
  }

  if (onboardingSteps[onboardingStep]?.targetSelector === '.wander-info-panel > button:not(:disabled)') {
    queueOnboardingTargetAdvance();
  }

  clearWanderTimer();
  currentWanderEvent = {
    type: 'traveling',
    mapId: getCurrentWanderMap().id,
    startedAt: Date.now(),
  };
  hideWanderEventOverlay();
  wanderTimer = window.setTimeout(resolveWanderEvent, wanderEventDelay);
  const refreshWanderCountdown = () => {
    if (currentWanderEvent?.type !== 'traveling') {
      wanderRefreshTimer = 0;
      return;
    }
    updateWanderCountdown(currentWanderEvent);
    wanderRefreshTimer = window.setTimeout(refreshWanderCountdown, 1000);
  };
  wanderRefreshTimer = window.setTimeout(refreshWanderCountdown, 1000);
  renderStageMap();
  saveGame();
}

function clearWanderTimer() {
  window.clearTimeout(wanderTimer);
  wanderTimer = 0;
  window.clearTimeout(wanderRefreshTimer);
  wanderRefreshTimer = 0;
  window.clearTimeout(wanderContinueTimer);
  wanderContinueTimer = 0;
}

function resolveWanderEvent() {
  if (currentWanderEvent?.type !== 'traveling') return;
  clearWanderTimer();
  try {
    currentWanderEvent = rollWanderEvent();
    if (autoWanderEnabled && currentWanderEvent.type === 'enemy') {
      const stage = currentWanderEvent.stage;
      renderStageMap();
      saveGame();
      startStageBattle(stage);
      return;
    }
    if (autoWanderEnabled && currentWanderEvent.type === 'result'
      && wanderChestRewards.length >= getWanderChestCapacity()) {
      currentWanderEvent = null;
      hideWanderEventOverlay();
      claimWanderChest();
      continueAutoWander();
      return;
    }
    renderStageMap();
    updateWanderEventOverlay();
    saveGame();
  } catch (error) {
    console.error('Failed to resolve wander event', error);
    currentWanderEvent = {
      type: 'result',
      title: 'Cơ duyên tạm gián đoạn',
      message: 'Không thể xác định sự kiện lần này, đạo hữu có thể tiếp tục ngao du.',
      detail: 'Hãy thử tiếp tục ngao du.',
      autoContinue: false,
    };
    showGameToast('Không thể xác định sự kiện Ngao du, hãy thử lại.', 'error');
    renderStageMap();
    saveGame();
  }
}

function rollWanderEvent() {
  const map = getCurrentWanderMap();
  syncWanderEncounterToggles(map);
  const stage = getRandomWanderEnemyStage(map);
  const enemyChance = highEnemyEncounterChance
    ? Number(gameConfig.gameplay?.wanderHighEnemyChance) || 0.7
    : Number(map.enemyChance) || Number(gameConfig.gameplay?.wanderEnemyChance) || 0.4;
  wanderEventRollCount += 1;
  const encounterRoll = Math.random();
  if (stage && encounterRoll < enemyChance) {
    return {
      type: 'enemy',
      mapId: map.id,
      stage,
    };
  }

  const reward = createWanderReward(map);
  const stored = queueWanderReward(reward, map);
  return {
    type: 'result',
    title: stored ? 'Đã nhận cơ duyên' : 'Rương Ngao du đã đầy',
    message: stored
      ? `Đã cất ${reward.title} vào Rương Ngao du.`
      : `Phần thưởng mới bị bỏ qua vì Rương Ngao du đã đủ ${getWanderChestCapacity()} phần.`,
    detail: stored ? 'Mở Rương Ngao du để nhận phần thưởng.' : 'Hãy mở rương trước khi tiếp tục ngao du.',
    autoContinue: stored && wanderChestRewards.length < getWanderChestCapacity(),
  };
}

function createWanderReward(map = getCurrentWanderMap()) {
  const type = pickWanderRewardType(map);
  if (type === 'cultivation') return createWanderCultivationChoice(map);
  if (type === 'spiritStone') return createWanderSpiritStoneChoice(map);
  if (['healthPotion', 'manaPotion', 'enhancementStone'].includes(type)) return createWanderConsumableChoice(type, map);
  if (type === 'minorAscensionPill') return createWanderMinorAscensionPillChoice(map) || createWanderChestChoice(map);
  if (type === 'skillChest') return createWanderSkillChestChoice(map) || createWanderChestChoice(map);
  if (type === 'talentTreasureChest') return createWanderTalentTreasureChestChoice(map) || createWanderChestChoice(map);
  if (type === 'petChest') return createWanderPetChestChoice() || createWanderChestChoice(map);
  return createWanderChestChoice(map);
}

function queueWanderReward(reward, map = getCurrentWanderMap()) {
  if (wanderChestRewards.length >= getWanderChestCapacity()) return false;
  if (!reward || reward.type === 'foundation') return false;
  wanderChestRewards.push({ ...reward });
  renderWanderChestButton();
  return true;
}

function claimWanderChest() {
  if (busy || !wanderChestRewards.length) return;
  hideWanderChestOverlay();
  const rewards = wanderChestRewards.filter((reward) => reward.type !== 'foundation');
  wanderChestRewards = [];
  rewards.forEach((reward) => applyWanderChoice(reward));
  const preview = groupWanderChestRewards(rewards)
    .slice(0, 3)
    .map((reward) => formatWanderRewardPreview(reward))
    .join(' | ');
  setSubtitle(`Đã mở ${rewards.length} phần thưởng: ${preview}.`);
  showGameToast('Đã nhận phần thưởng trong Rương Ngao du.', 'success');
  renderCultivation();
  renderEquipment();
  renderInventory();
  renderShop();
  renderStageMap();
  saveGame();
}

function getCurrentWanderMap() {
  return wanderMaps[currentWanderMapId] || wanderMaps.novice;
}

function getWanderMapIconClass(mapId) {
  const iconByMap = {
    novice: 'icon-activity-village',
    demonForest: 'icon-activity-forest',
    spiritCave: 'icon-activity-cave',
    hollowRealm: 'icon-activity-path',
    thunderPeak: 'icon-wander-map-5',
    primordialWastes: 'icon-wander-map-6',
    ashenAbyss: 'icon-wander-map-7',
    skyThunderPass: 'icon-wander-map-8',
    frostMysticLand: 'icon-wander-map-9',
    nineHeavenCloudSea: 'icon-wander-map-10',
    celestialGateRoad: 'icon-wander-map-11',
    thunderHeavenDomain: 'icon-wander-map-12',
    starRiverVoid: 'icon-wander-map-13',
    endlessHolyRealm: 'icon-wander-map-14',
    celestialStarSea: 'icon-wander-map-15',
    nineNetherThunderAbyss: 'icon-wander-map-16',
    myriadFormDivineDomain: 'icon-wander-map-17',
    voidStarGate: 'icon-wander-map-18',
    chaosEmperorRealm: 'icon-wander-map-19',
    creationHeavenRuin: 'icon-wander-map-20',
    celestialRuinFrontier: 'icon-wander-map-21',
    frostStarValley: 'icon-wander-map-22',
    astralSeaTemple: 'icon-wander-map-23',
    voidEmperorPass: 'icon-wander-map-24',
    chaosLotusSanctum: 'icon-wander-map-25',
    creationDawnRealm: 'icon-wander-map-26',
  };
  return iconByMap[mapId] || 'icon-activity-path';
}

function getRandomWanderEnemyStage(map = getCurrentWanderMap()) {
  const mapMinTier = Math.max(1, Math.floor(map.minEnemyTier || 1));
  const mapMaxTier = Math.max(mapMinTier, Math.floor(map.maxEnemyTier || stages.length));
  const minAllowedTier = mapMinTier;

  if (minAllowedTier > mapMaxTier) return null;

  const availableTiers = [];
  for (let tier = minAllowedTier; tier <= mapMaxTier; tier += 1) {
    if (getMapEnemyCandidates(map, tier).length) availableTiers.push(tier);
  }
  if (!availableTiers.length) return null;

  const enemyTier = availableTiers[Math.floor(Math.random() * availableTiers.length)];
  return createWanderEnemyStage(enemyTier, map);
}

function createWanderEnemyStage(enemyTier, map = getCurrentWanderMap()) {
  const tier = Math.max(1, Math.floor(enemyTier));
  const minorLevel = getTierMinorLevel(tier);
  const majorIndex = clamp(getTierMajorIndex(tier), 0, majorRealmNames.length - 1);
  const enemyData = pickEnemyDataForMapTier(map, tier);
  if (!enemyData) return null;

  return {
    id: `wander-${map.id}-${tier}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    isWanderGenerated: true,
    mapId: map.id,
    enemyTier: tier,
    enemyLevel: minorLevel,
    enemyMajorRealmIndex: majorIndex,
    title: map.name,
    realmText: getTierRealmText(tier),
    enemyData,
  };
}

function getWanderMapDefeatedCount(mapId) {
  return Math.max(0, Math.floor(Number(wanderDefeatedByMap[mapId]) || 0));
}

function canUseHighEnemyEncounter(map = getCurrentWanderMap()) {
  const requiredWins = Math.max(0, Math.floor(Number(gameConfig.gameplay?.wanderHighEnemyRequiredWins) || 10));
  return getWanderMapDefeatedCount(map?.id) >= requiredWins;
}

function getWanderBossRequiredWins() {
  return Math.max(0, Math.floor(Number(gameConfig.gameplay?.wanderBossRequiredWins) || 30));
}

function canUseAutoWander(map = getCurrentWanderMap()) {
  const requiresBoss = gameConfig.gameplay?.wanderSkipEnemyRequiresBoss !== false;
  return !requiresBoss || Boolean(wanderBossDefeatedByMap[map?.id]);
}

function syncWanderEncounterToggles(map = getCurrentWanderMap()) {
  if (!canUseHighEnemyEncounter(map)) highEnemyEncounterChance = false;
  if (!canUseAutoWander(map)) autoWanderEnabled = false;
  if (autoWanderEnabled) highEnemyEncounterChance = false;
}

function normalizeWanderMapCounts(counts = {}) {
  return Object.fromEntries(Object.keys(wanderMaps).map((mapId) => [
    mapId,
    Math.max(0, Math.floor(Number(counts?.[mapId]) || 0)),
  ]));
}

function normalizeWanderDefeatedEnemyIds(ids = []) {
  return new Set(
    (Array.isArray(ids) ? ids : [])
      .map((id) => String(id || '').trim())
      .filter(Boolean),
  );
}

function normalizeWanderMapFlags(flags = {}) {
  return Object.fromEntries(Object.keys(wanderMaps).map((mapId) => [
    mapId,
    normalizeBooleanFlag(flags?.[mapId]),
  ]));
}

function normalizeBooleanFlag(value) {
  if (typeof value === 'string') {
    return ['true', '1', 'yes'].includes(value.trim().toLowerCase());
  }
  return Boolean(value);
}

function createWanderBossStage(map = getCurrentWanderMap()) {
  const bossTier = Math.max(1, Math.floor(Number(map.maxEnemyTier) || map.minEnemyTier || 1));
  const stage = createWanderEnemyStage(bossTier, map);
  if (!stage) return null;
  return {
    ...stage,
    id: `wander-boss-${map.id}`,
    title: `Boss ${map.name}`,
    isWanderBoss: true,
    enemyRankLevel: 5,
    enemyData: {
      ...stage.enemyData,
      name: `Boss ${map.name}`,
    },
  };
}

function pickEnemyDataForMapTier(map, tier) {
  const mapCandidates = getMapEnemyCandidates(map, tier);
  if (mapCandidates.length) return pickWeightedEnemy(mapCandidates);
  return null;
}

function getMapEnemyCandidates(map) {
  const mapEnemyIds = new Set(map.enemyPoolIds || []);
  return stageEnemyData.filter((enemyData) => (
    !mapEnemyIds.size || mapEnemyIds.has(enemyData.id)
  ));
}

function pickWeightedEnemy(candidates) {
  if (!candidates.length) return null;
  const totalWeight = candidates.reduce((total, enemyData) => total + enemyData.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const enemyData of candidates) {
    roll -= enemyData.weight;
    if (roll <= 0) return enemyData;
  }
  return candidates[candidates.length - 1];
}

function getWanderEventStage(event) {
  if (event?.stage) return event.stage;
  return stages.find((item) => item.id === event?.stageId) || null;
}

function renderWanderTraveling(event) {
  const map = wanderMaps[event.mapId] || getCurrentWanderMap();
  const card = document.createElement('div');
  card.className = 'stage-card dungeon-entry-card wander-card';
  card.innerHTML = `
    <span><i class="activity-icon icon-activity-path" aria-hidden="true"></i>${map.name}</span>
    <strong>Đang ngao du</strong>
    <em>Đạo hữu đang đi qua ${map.name.replace('Map 1: ', '')}, tìm kiếm cơ duyên và dấu vết đối thủ.</em>
    <small id="wanderCountdown">Sự kiện sẽ xuất hiện sau khoảng ...</small>
    <div class="wander-actions">
      <button type="button" class="secondary compact wander-stop-action"><i class="unique-icon icon-unique-close" aria-hidden="true"></i>Ngừng ngao du</button>
    </div>
  `;
  card.querySelector('button').addEventListener('click', stopWander);
  stageGrid.appendChild(card);
  updateWanderCountdown(event);
}

function stopWander() {
  if (busy) return;
  clearWanderTimer();
  autoWanderEnabled = false;
  autoWanderAfterRecovery = false;
  window.clearTimeout(autoWanderRecoveryTimer);
  autoWanderRecoveryTimer = 0;
  currentWanderEvent = null;
  hideWanderEventOverlay();
  renderStageMap();
  showGameToast('Đã ngừng ngao du.', 'success');
  saveGame();
}

function updateWanderCountdown(event) {
  const countdown = $('wanderCountdown');
  if (!countdown || event?.type !== 'traveling') return;
  const elapsed = Math.max(0, Date.now() - (event.startedAt || Date.now()));
  const remainingSeconds = Math.max(0, Math.ceil((wanderEventDelay - elapsed) / 1000));
  countdown.textContent = remainingSeconds > 0
    ? `Sự kiện sẽ xuất hiện sau ${remainingSeconds} giây.`
    : 'Đang tìm kiếm cơ duyên...';
}

function getWanderRewardTypeWeights(map = getCurrentWanderMap()) {
  const weights = gameConfig.gameplay?.wanderRewardTypeWeights || {};
  const adjustedWeights = { ...weights };
  const adjustments = gameConfig.gameplay?.wanderRewardTypeMapAdjustments || {};
  const fromMap = Math.max(1, Math.floor(Number(adjustments.fromMap) || Infinity));
  if (getWanderMapNumber(map) >= fromMap) {
    adjustedWeights.cultivation = Math.max(
      0,
      (Number(adjustedWeights.cultivation) || 0) + (Number(adjustments.cultivationWeightDelta) || 0),
    );
    adjustedWeights.petChest = Math.max(
      0,
      (Number(adjustedWeights.petChest) || 0) + (Number(adjustments.petChestWeight) || 0),
    );
  }
  return [
    { type: 'cultivation', weight: Math.max(0, Number(adjustedWeights.cultivation) || 0) },
    { type: 'spiritStone', weight: Math.max(0, Number(adjustedWeights.spiritStone) || 0) },
    { type: 'chest', weight: Math.max(0, Number(adjustedWeights.chest) || 0) },
    { type: 'healthPotion', weight: Math.max(0, Number(adjustedWeights.healthPotion) || 0) },
    { type: 'manaPotion', weight: Math.max(0, Number(adjustedWeights.manaPotion) || 0) },
    { type: 'enhancementStone', weight: Math.max(0, Number(adjustedWeights.enhancementStone) || 0) },
    { type: 'minorAscensionPill', weight: Math.max(0, Number(adjustedWeights.minorAscensionPill) || 0) },
    { type: 'skillChest', weight: Math.max(0, Number(adjustedWeights.skillChest) || 0) },
    { type: 'talentTreasureChest', weight: Math.max(0, Number(adjustedWeights.talentTreasureChest) || 0) },
    { type: 'petChest', weight: Math.max(0, Number(adjustedWeights.petChest) || 0) },
  ];
}

function pickWanderRewardType(map = getCurrentWanderMap()) {
  const entries = getWanderRewardTypeWeights(map);
  const totalWeight = entries.reduce((total, entry) => total + entry.weight, 0);
  if (!totalWeight) return 'cultivation';
  let roll = Math.random() * totalWeight;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll < 0) return entry.type;
  }
  return entries[entries.length - 1].type;
}

function createWanderCultivationChoice(map = getCurrentWanderMap()) {
  const stage = createWanderRewardStage(map);
  const settings = getRewardSettings(stage);
  const amount = getWanderCultivationAmount(stage, settings);
  return {
    type: 'cultivation',
    title: 'Linh khí tụ lại',
    detail: `Nhận ${formatGameNumber(amount)} tu vi.`,
    amount,
  };
}

function createWanderSpiritStoneChoice(map = getCurrentWanderMap()) {
  const stage = createWanderRewardStage(map);
  const settings = getRewardSettings(stage);
  const amount = getWanderSpiritStoneAmount(stage, settings);
  const bonus = createFighter(playerName, playerLevel, true).spiritStoneBonus || 0;
  const finalAmount = Math.max(1, Math.round(amount * (1 + bonus)));
  return {
    type: 'spiritStone',
    title: 'Mạch linh thạch nhỏ',
    detail: `Nhận ${formatGameNumber(finalAmount)} linh thạch.`,
    amount: finalAmount,
  };
}

function createWanderRewardStage(map = getCurrentWanderMap()) {
  const minTier = Math.max(1, Math.floor(Number(map.minEnemyTier) || 1));
  const maxTier = Math.max(minTier, Math.floor(Number(map.maxEnemyTier) || minTier));
  const availableTiers = [];
  for (let tier = minTier; tier <= maxTier; tier += 1) {
    if (getMapEnemyCandidates(map, tier).length) availableTiers.push(tier);
  }
  const tier = availableTiers.length
    ? availableTiers[Math.floor(Math.random() * availableTiers.length)]
    : minTier;
  return createWanderEnemyStage(tier, map) || {
    mapId: map.id,
    enemyTier: tier,
    enemyLevel: getTierMinorLevel(tier),
  };
}

function createWanderConsumableChoice(type, map = getCurrentWanderMap()) {
  const amount = Math.max(1, Math.floor(rollWanderRewardBase(type)));
  const rewardData = {
    healthPotion: {
      title: 'Sinh Huyết Đan',
    },
    manaPotion: {
      title: 'Tụ Linh Đan',
    },
    enhancementStone: {
      title: 'Đá cường hóa',
    },
  }[type];
  if (!rewardData) return null;
  return {
    type,
    title: rewardData.title,
    detail: `Nhận ${amount} ${rewardData.title} vào Rương Ngao du.`,
    amount,
  };
}

function createWanderFoundationChoice(map = getCurrentWanderMap()) {
  const settings = getRewardSettings(map);
  const found = foundationFindCounts[map.id] || 0;
  return {
    type: 'foundation',
    title: 'Căn cơ khai mở',
    detail: `Căn cơ +${settings.foundationAmount}, map còn ${Math.max(0, settings.foundationFindLimit - found)} lần nhận.`,
    amount: settings.foundationAmount,
  };
}

function createWanderChestChoice(map = getCurrentWanderMap()) {
  const majorRealmIndex = clamp(Number(playerMajorRealmIndex) || 0, 0, getMajorRealmMaxIndex());
  const chestTier = pickWanderEquipmentChestTier(map);
  const chestSource = { chestTier };
  const [minLevel, maxLevel] = getEquipmentLevelRange(chestSource);
  return {
    type: 'chest',
    title: getEquipmentChestName(chestSource),
    detail: `Cất vào Túi đồ | ${majorRealmNames[majorRealmIndex] || 'Đại cảnh giới hiện tại'} · trang bị cấp ${minLevel}-${maxLevel}.`,
    majorRealmIndex,
    chestTier,
  };
}

function getWanderMapNumber(map = getCurrentWanderMap()) {
  const mapIndex = wanderMapList.findIndex((entry) => entry.id === map?.id);
  if (mapIndex >= 0) return mapIndex + 1;
  const minTier = Math.max(1, Math.floor(Number(map?.minEnemyTier) || 1));
  return Math.max(1, Math.floor((minTier - 1) / 5) + 1);
}

function getWanderSkillChestShopItem(map = getCurrentWanderMap()) {
  const mapNumber = getWanderMapNumber(map);
  const grades = Array.isArray(cultivationSkillData.grades) ? cultivationSkillData.grades : [];
  const grade = grades[Math.min(grades.length - 1, Math.floor((mapNumber - 1) / 5))];
  if (grade) {
    const matchingChest = shopItems.find((item) => item.type === 'skillChest' && item.gradeId === grade.id);
    if (matchingChest) return matchingChest;
  }
  return shopItems.find((item) => item.id === 'skillChestMortal') || null;
}

function getWanderSkillChestName(map = getCurrentWanderMap()) {
  return getWanderSkillChestShopItem(map)?.name || 'Rương skill';
}

function createWanderSkillChestChoice(map = getCurrentWanderMap()) {
  const shopItem = getWanderSkillChestShopItem(map);
  if (!shopItem) return null;
  return {
    type: 'skillChest',
    title: shopItem.name,
    detail: 'Cất vào Túi đồ | Mở rương có 90% nhận mảnh skill và 10% nhận sách skill.',
    amount: 1,
    shopItemId: shopItem.id,
  };
}

function createWanderPetChestChoice() {
  const shopItem = shopItems.find((item) => item.id === 'petChest' && item.type === 'petChest');
  if (!shopItem) return null;
  return {
    type: 'petChest',
    title: shopItem.name,
    detail: 'Cất vào Túi đồ | Mở rương nhận mảnh linh thú.',
    amount: 1,
    shopItemId: shopItem.id,
  };
}

function getWanderMinorAscensionPillShopItem(map = getCurrentWanderMap(), sourceStage = null) {
  const stage = sourceStage || createWanderRewardStage(map);
  const majorRealmIndex = clamp(
    Number(stage?.enemyMajorRealmIndex ?? getTierMajorIndex(stage?.enemyTier)) || 0,
    0,
    getMajorRealmMaxIndex(),
  );
  const idPrefix = String(minorBreakthroughPillConfig?.idPrefix || 'minorAscensionPill');
  return shopItems.find((item) => item.id === `${idPrefix}${cultivationProgression[majorRealmIndex]?.id}`)
    || null;
}

function createWanderMinorAscensionPillChoice(map = getCurrentWanderMap(), sourceStage = null) {
  const shopItem = getWanderMinorAscensionPillShopItem(map, sourceStage);
  if (!shopItem) return null;
  return {
    type: 'minorAscensionPill',
    title: shopItem.name,
    detail: `Cất vào Túi đồ | Đan dùng để đột phá tiểu cảnh giới ${majorRealmNames[shopItem.requiredMajorRealmIndex] || ''}.`,
    amount: 1,
    shopItemId: shopItem.id,
  };
}

function rollWanderBattleBonusRewards(stage) {
  if (!stage?.isWanderGenerated) return [];
  const map = wanderMaps[stage.mapId] || getCurrentWanderMap();
  const weights = gameConfig.gameplay?.wanderBattleBonusRewardWeights || {};
  const rewards = [];
  const roll = (type, factory) => {
    const chance = Math.max(0, Math.min(1, Number(weights[type]) || 0));
    if (Math.random() < chance) {
      const reward = factory();
      if (reward) rewards.push(reward);
    }
  };

  roll('healthPotion', () => createWanderConsumableChoice('healthPotion', map));
  roll('manaPotion', () => createWanderConsumableChoice('manaPotion', map));
  roll('enhancementStone', () => createWanderConsumableChoice('enhancementStone', map));
  roll('minorAscensionPill', () => createWanderMinorAscensionPillChoice(map, stage));
  roll('skillChest', () => createWanderSkillChestChoice(map));
  roll('talentTreasureChest', () => createWanderTalentTreasureChestChoice(map));
  return rewards;
}

function grantWanderBattleBonusRewards(stage) {
  return rollWanderBattleBonusRewards(stage)
    .map((choice) => applyWanderChoice(choice))
    .filter(Boolean);
}

function getWanderTalentTreasureChestShopItem(map = getCurrentWanderMap()) {
  return shopItems.find((item) => (
    item.type === 'talentTreasureChest'
      && item.id === 'talentTreasureChest'
  )) || null;
}

function createWanderTalentTreasureChestChoice(map = getCurrentWanderMap()) {
  const shopItem = getWanderTalentTreasureChestShopItem(map);
  if (!shopItem) return null;
  return {
    type: 'talentTreasureChest',
    title: shopItem.name,
    detail: 'Cất vào Túi đồ | Khi mở sẽ nhận Cục Thiên Tài Địa Bảo của đại cảnh giới kế tiếp.',
    amount: 1,
    shopItemId: shopItem.id,
  };
}

function renderWanderEnemyEvent(event) {
  const stage = getWanderEventStage(event);
  if (!stage) {
    currentWanderEvent = null;
    renderStageMap();
    return;
  }

  const preview = createStageEnemy(stage);
  const fleeChance = getFleeChance(stage);
  const card = document.createElement('div');
  card.className = 'stage-card dungeon-entry-card wander-card';
  card.innerHTML = `
    <span><i class="activity-icon icon-activity-encounter" aria-hidden="true"></i>Gặp đối thủ</span>
    <strong>${stage.enemyData.name}</strong>
    <div class="enemy-encounter-meta">
      <span><b>Phẩm chất</b><strong>${getEnemyRankLabel(stage.enemyData, stage.enemyRankLevel)}</strong></span>
      <span><b>Tu vi</b><strong>${formatRealmDisplayText(stage.realmText)}</strong></span>
      <span><b>Skill</b><strong>${stage.enemyData.skillName}</strong></span>
    </div>
    <div class="enemy-encounter-summary">
      <span><b>Lực chiến</b><strong>${formatGameNumber(getCombatPower(preview))}</strong></span>
      <span><b>Chạy thoát</b><strong>${toPercent(fleeChance)}</strong></span>
    </div>
    <small>Đánh thắng để mở đường ngao du tiếp.</small>
    <div class="wander-actions">
      <button type="button" class="breakthrough compact"><i class="item-icon icon-item-sword" aria-hidden="true"></i>Chiến đấu</button>
      <button type="button" class="secondary compact"><i class="unique-icon icon-unique-flee" aria-hidden="true"></i>Chạy</button>
    </div>
  `;
  const [fightButton, fleeButton] = card.querySelectorAll('button');
  fightButton.addEventListener('click', () => startStageBattle(stage));
  fleeButton.addEventListener('click', () => fleeWanderEnemy(stage));
  stageGrid.appendChild(card);
}

function renderWanderAmbushEvent(event) {
  const stage = event.stage;
  if (!stage) {
    currentWanderEvent = null;
    renderStageMap();
    return;
  }

  const preview = createStageEnemy(stage);
  const fleeChance = getFleeChance(stage);
  const card = document.createElement('div');
  card.className = 'stage-card dungeon-entry-card wander-card';
  card.innerHTML = `
    <span><i class="activity-icon icon-activity-ambush" aria-hidden="true"></i>Bị phục kích</span>
    <strong>${stage.enemyData.name}</strong>
    <em>${event.lootResult?.message || 'Cơ duyên vừa lấy phát ra dị động.'}</em>
    <div class="enemy-encounter-meta">
      <span><b>Phẩm chất</b><strong>${getEnemyRankLabel(stage.enemyData, stage.enemyRankLevel)}</strong></span>
      <span><b>Tu vi</b><strong>${formatRealmDisplayText(stage.realmText)}</strong></span>
      <span><b>Nội tại</b><strong>${getCombatStyleLabel(stage.enemyData)}</strong></span>
      <span><b>Skill</b><strong>${stage.enemyData.skillName}</strong></span>
    </div>
    <div class="enemy-encounter-summary">
      <span><b>Lực chiến</b><strong>${formatGameNumber(getCombatPower(preview))}</strong></span>
      <span><b>Chạy thoát</b><strong>${toPercent(fleeChance)}</strong></span>
    </div>
    <div class="wander-actions">
      <button type="button" class="breakthrough compact"><i class="item-icon icon-item-sword" aria-hidden="true"></i>Chiến đấu</button>
      <button type="button" class="secondary compact"><i class="unique-icon icon-unique-flee" aria-hidden="true"></i>Chạy</button>
    </div>
  `;
  const [fightButton, fleeButton] = card.querySelectorAll('button');
  fightButton.addEventListener('click', () => startStageBattle(stage));
  fleeButton.addEventListener('click', () => fleeWanderEnemy(stage));
  stageGrid.appendChild(card);
}

function renderWanderResult(event) {
  const card = document.createElement('div');
  card.className = 'stage-card dungeon-entry-card';
  const canContinue = event.autoContinue !== false && canEnterDungeon();
  const chestIsFull = event.title === 'Rương Ngao du đã đầy';
  card.innerHTML = `
    <span><i class="activity-icon icon-activity-fortune" aria-hidden="true"></i>${event.title}</span>
    <em>${event.message}</em>
    <small>${chestIsFull
      ? 'Rương Ngao du đã đầy, ngao du đã dừng. Hãy mở rương trước khi tiếp tục.'
      : canContinue
      ? 'Đang chuẩn bị lượt ngao du tiếp theo...'
      : 'Sinh lực thấp, ngao du đã dừng. Hãy về tu luyện hồi phục.'}</small>
    <div class="wander-actions">
      <button type="button" class="secondary compact wander-stop-action"><i class="unique-icon icon-unique-close" aria-hidden="true"></i>Ngừng ngao du</button>
    </div>
  `;
  const stopButton = card.querySelector('button');
  stopButton.addEventListener('click', stopWander);
  stageGrid.appendChild(card);

  if (autoWanderEnabled && !canEnterDungeon()) {
    autoWanderAfterRecovery = true;
    showTrainingMessage('Tự động ngao du đang hồi phục vì đạo hữu đã trọng thương.');
    scheduleAutoWanderAfterRecovery();
    return;
  }

  if (canContinue) {
    wanderContinueTimer = window.setTimeout(() => {
      wanderContinueTimer = 0;
      if (currentWanderEvent?.type !== 'result' || !canEnterDungeon()) return;
      beginWander(false);
    }, 900);
  }
}

function applyWanderChoice(choice) {
  if (choice.type === 'cultivation') {
    const gained = addPlayerCultivation(choice.amount);
    return {
      title: 'Đã hấp thu linh khí',
      message: gained > 0 ? `Nhận ${formatGameNumber(gained)} tu vi.` : 'Tu vi đã chạm ngưỡng, tu vi dư chuyển vào Đan điền.',
      iconClass: 'stat-icon icon-stat-cultivation',
    };
  }

  if (choice.type === 'spiritStone') {
    playerSpiritStones += choice.amount;
    return {
      title: 'Đã nhặt linh thạch',
      message: `Nhận ${formatGameNumber(choice.amount)} linh thạch.`,
      iconClass: 'item-icon icon-item-spirit-stone',
    };
  }

  if (choice.type === 'healthPotion' || choice.type === 'manaPotion') {
    const amount = Math.max(1, Math.floor(Number(choice.amount) || 1));
    if (choice.type === 'healthPotion') healthPotionCount += amount;
    if (choice.type === 'manaPotion') manaPotionCount += amount;
    return {
      title: `Đã nhận ${choice.title}`,
      message: `Nhận ${formatGameNumber(amount)} ${choice.title}.`,
      iconClass: choice.type === 'healthPotion'
        ? 'item-icon icon-item-health-pill'
        : 'item-icon icon-item-mana-flame',
    };
  }

  if (choice.type === 'enhancementStone') {
    const amount = Math.max(1, Math.floor(Number(choice.amount) || 1));
    enhancementStones += amount;
    return {
      title: 'Đã nhận Đá cường hóa',
      message: `Nhận ${formatGameNumber(amount)} Đá cường hóa.`,
      iconClass: 'item-icon icon-item-enhancement-stone',
    };
  }

  if (choice.type === 'foundation') return null;

  if (choice.type === 'minorAscensionPill' || choice.type === 'talentTreasureChest') {
    const shopItem = shopItems.find((item) => item.id === choice.shopItemId);
    if (!shopItem) return null;
    const amount = Math.max(1, Math.floor(Number(choice.amount) || 1));
    addShopInventoryItem(shopItem.id, amount);
    return {
      title: `Đã cất ${shopItem.name} vào Túi đồ`,
      message: `${shopItem.name} x${amount}.`,
      iconClass: choice.type === 'minorAscensionPill'
        ? 'activity-icon icon-activity-gate'
        : 'activity-icon icon-activity-chest',
    };
  }

  if (choice.type === 'skillChest') {
    const shopItem = shopItems.find((item) => item.id === choice.shopItemId);
    if (!shopItem) return null;
    const amount = Math.max(1, Math.floor(Number(choice.amount) || 1));
    addShopInventoryItem(shopItem.id, amount);
    return {
      title: 'Đã cất rương skill vào Túi đồ',
      message: `${shopItem.name} x${amount}.`,
      detail: 'Khi mở: 90% nhận mảnh skill, 10% nhận sách skill.',
      iconClass: 'activity-icon icon-activity-chest',
    };
  }

  if (choice.type === 'petChest') {
    const shopItem = shopItems.find((item) => item.id === choice.shopItemId);
    if (!shopItem) return null;
    const amount = Math.max(1, Math.floor(Number(choice.amount) || 1));
    addShopInventoryItem(shopItem.id, amount);
    return {
      title: 'Đã cất Rương Linh Thú vào Túi đồ',
      message: `${shopItem.name} x${amount}.`,
      detail: 'Mở rương để nhận mảnh linh thú.',
      iconClass: 'activity-icon icon-activity-chest',
    };
  }

  const chest = addEquipmentChest({ majorRealmIndex: choice.majorRealmIndex }, { chestTier: choice.chestTier });
  return {
    title: 'Đã cất rương vào Túi đồ',
    message: `${chest.name} đã được chuyển vào Túi đồ.`,
    detail: `Rương sẽ tạo một trang bị trong khoảng cấp ${getChestLevelRange(chest).join('-')} khi mở.`,
    iconClass: 'activity-icon icon-activity-chest',
  };
}

function openEquipmentChest(chestId, amount = 1) {
  if (busy) return;
  const index = equipmentChestInventory.findIndex((item) => item.id === chestId);
  if (index < 0) return;
  const chest = equipmentChestInventory[index];
  const [minLevel, maxLevel] = getChestLevelRange(chest);
  const currentRarityProfile = getEquipmentRarityProfile(chest);
  chest.rarityProfile = currentRarityProfile;
  const quantity = clamp(Math.floor(Number(amount) || 1), 1, chest.count);
  const openedItems = [];
  for (let count = 0; count < quantity; count += 1) {
    const slot = equipmentSlots[Math.floor(Math.random() * equipmentSlots.length)];
    const rarityKey = rollEquipmentRarity(currentRarityProfile);
    const item = createEquipmentLikeItem(slot.id, rollEquipmentLevel(chest), rarityKey);
    item.id = equipmentIdSeed++;
    item.sourceChestTier = chest.tier;
    inventory.unshift(item);
    openedItems.push(item);
  }
  enforceEquipmentInventoryLimit();
  chest.count -= quantity;
  if (chest.count <= 0) equipmentChestInventory.splice(index, 1);
  const firstItem = openedItems[0];
  showGameToast(`Mở ${quantity} rương, nhận ${firstItem ? `${getRarityName(firstItem)} ${firstItem.name}` : 'trang bị'} cấp ${minLevel}-${maxLevel}.`, 'success');
  renderInventory();
  renderEquipment();
  renderProfile();
  saveGame();
  return openedItems.length;
}

function rollbackAmbushLoot(stage) {
  const snapshot = stage?.lootSnapshot;
  if (!snapshot) return;
  playerCultivation = snapshot.playerCultivation;
  playerSpiritStones = snapshot.playerSpiritStones;
  playerFoundation = snapshot.playerFoundation;
  foundationFindCounts = { ...snapshot.foundationFindCounts };
  inventory = inventory.filter((item) => snapshot.equipmentIds.has(item.id));
}

function rollLootAmbush() {
  return null;
}

function createAmbushStage(map = getCurrentWanderMap()) {
  const stage = getRandomWanderEnemyStage(map);
  if (!stage) return null;
  return {
    ...stage,
    id: `ambush-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    isAmbush: true,
  };
}

function fleeWanderEnemy(stage) {
  hideWanderEventOverlay();
  clearWanderTimer();
  syncPlayerResourceCaps();
  const manaBeforeFlee = playerCurrentMana;
  const fleeManaCost = Math.ceil(manaBeforeFlee * 0.25);
  playerCurrentMana = Math.max(0, manaBeforeFlee - fleeManaCost);
  if (player) player.mana = playerCurrentMana;
  const chance = getFleeChance(stage);
  if (Math.random() > chance) {
    currentWanderEvent = null;
    startStageBattle(stage);
    pushLog(`Chạy thoát thất bại, mất ${formatGameNumber(fleeManaCost)} linh lực.`);
    pushLog(`${stage.enemyData.name} đuổi kịp, không thể chạy thoát.`);
    return;
  }

  currentWanderEvent = {
    type: 'result',
    title: 'Đã rút lui',
    message: `Chạy thoát khỏi ${stage.enemyData.name}.`,
    detail: `Tỉ lệ chạy thoát: ${toPercent(chance)}. Mất 25% linh lực hiện tại, không nhận thưởng từ đối thủ này.`,
  };
  renderStageMap();
  renderCultivation();
  saveGame();
}

function getFleeChance() {
  const configuredChance = Number(gameConfig.gameplay?.wanderFleeChance);
  return Number.isFinite(configuredChance) ? clamp(configuredChance, 0, 1) : 0.8;
}

function selectStage(stage) {
  const config = getDungeonConfig();
  if (!isStageUnlockedForDungeon(stage, config.id)) return;
  if (config.unlimited && completedStages.has(stage.id)) return;
  currentStage = stage;
  selectedStage = stage;
  renderStageDetail(stage);
  mapPanel.classList.add('is-hidden');
  trainingPanel.classList.add('is-hidden');
  stageDetailPanel.classList.remove('is-hidden');
  setSubtitle('');
  showGameToast(`Đã chọn ${stage.title}.`, 'info');
}
