// Resource-dungeon subtab rendered inside the Activity panel. Shared state remains owned by main.js.
function getResourceDungeon(dungeonId) {
  return progressionFeatures.resourceDungeons.find((entry) => entry.id === dungeonId) || null;
}

function getResourceDungeonTotalFloors(dungeon) {
  return Math.max(1, Math.floor(Number(dungeon?.totalFloors) || 30));
}

function getResourceDungeonHighestFloor(dungeonId) {
  return Math.max(0, Math.floor(Number(resourceDungeonProgress[dungeonId]) || 0));
}

function getResourceDungeonRequiredTier(dungeon, floor) {
  return Math.max(1, Math.floor(Number(dungeon?.requiredLevel) || 1) + Math.max(0, floor - 1));
}

function getResourceDungeonRewardRange(dungeon, floor) {
  const offset = Math.max(0, floor - 1);
  const min = Math.max(0, Math.floor(Number(dungeon?.rewardMin) || 0) + offset * Math.max(0, Number(dungeon?.rewardGrowthMin) || 0));
  const max = Math.max(min, Math.floor(Number(dungeon?.rewardMax) || min) + offset * Math.max(0, Number(dungeon?.rewardGrowthMax) || 0));
  return { min, max };
}

function createResourceDungeonStage(dungeonId, floor) {
  const dungeon = getResourceDungeon(dungeonId);
  if (!dungeon || floor < 1 || floor > getResourceDungeonTotalFloors(dungeon)) return null;
  const tier = getResourceDungeonRequiredTier(dungeon, floor);
  const map = getCurrentWanderMap();
  const enemyData = pickEnemyDataForMapTier(map, tier)
    || stageEnemyData[stageEnemyData.length - 1];
  if (!enemyData) return null;
  const rankLevel = floor % 5 === 0 ? 3 : 2;
  return {
    id: `resource-${dungeonId}-${floor}`,
    title: `${dungeon.name} · Tầng ${floor}`,
    enemyLevel: getTierMinorLevel(tier),
    enemyTier: tier,
    enemyMajorRealmIndex: getTierMajorIndex(tier),
    realmText: getTierRealmText(tier),
    enemyRankLevel: rankLevel,
    enemyData,
    isResourceDungeon: true,
    resourceDungeonId: dungeonId,
    resourceDungeonFloor: floor,
  };
}

function grantResourceDungeonReward(dungeonId, floor) {
  const dungeon = getResourceDungeon(dungeonId);
  if (!dungeon) return { amount: 0, cultivation: 0, spiritStones: 0, enhancementStones: 0, chestReward: null };
  const range = getResourceDungeonRewardRange(dungeon, floor);
  // Resource dungeon rewards are countable resources and should never display fractions.
  const amount = Math.round(randomBetween(range.min, range.max));
  let cultivation = 0;
  let spiritStones = 0;
  let enhancementReward = 0;
  let chestReward = null;
  if (dungeon.rewardType === 'cultivation') cultivation = addPlayerCultivation(amount);
  if (dungeon.rewardType === 'spiritStone') {
    spiritStones = amount;
    playerSpiritStones += amount;
  }
  if (dungeon.rewardType === 'enhancementStone') {
    enhancementReward = amount;
    enhancementStones += amount;
  }
  if (dungeon.rewardType === 'chest') {
    const skillChance = clamp(Number(dungeon.skillChestChance) || 0.5, 0, 1);
    if (Math.random() < skillChance) {
      const gradeByFloor = (dungeon.skillChestGradeByFloor || [])
        .find((entry) => floor <= Math.max(1, Number(entry.maxFloor) || 1));
      const gradeId = gradeByFloor?.gradeId || dungeon.skillChestGradeId || 'mortal';
      const skillChest = shopItems.find((item) => item.type === 'skillChest' && item.gradeId === gradeId);
      if (skillChest) {
        addShopInventoryItem(skillChest.id, amount);
        chestReward = { type: 'skillChest', name: skillChest.name, amount };
      }
    }
    if (!chestReward) {
      const tierByFloor = (dungeon.equipmentChestTierByFloor || [])
        .find((entry) => floor <= Math.max(1, Number(entry.maxFloor) || 1));
      const chestTier = Math.max(1, Math.floor(Number(tierByFloor?.tier) || Number(dungeon.equipmentChestTier) || 1));
      const chest = addEquipmentChest({ majorRealmIndex: playerMajorRealmIndex }, { chestTier });
      for (let index = 1; index < amount; index += 1) {
        addEquipmentChest({ majorRealmIndex: playerMajorRealmIndex }, { chestTier });
      }
      chestReward = { type: 'equipmentChest', name: chest.name, amount };
    }
  }
  resourceDungeonProgress[dungeonId] = Math.max(getResourceDungeonHighestFloor(dungeonId), floor);
  return { amount, cultivation, spiritStones, enhancementStones: enhancementReward, chestReward };
}

function formatResourceReward(dungeon, amount, reward = null) {
  if (dungeon?.rewardType === 'chest' && reward?.chestReward) {
    return `${reward.chestReward.name}${reward.chestReward.amount > 1 ? ` x${reward.chestReward.amount}` : ''}`;
  }
  const rewardName = dungeon?.rewardType === 'cultivation'
    ? 'tu vi'
    : dungeon?.rewardType === 'spiritStone'
    ? 'linh thạch'
    : dungeon?.rewardType === 'enhancementStone'
    ? 'đá cường hóa'
    : 'rương';
  return `${formatGameNumber(amount)} ${rewardName}`;
}

function renderResourceDungeons() {
  dailyResourceAttempts = normalizeDailyResourceAttempts(dailyResourceAttempts);
  resourceDungeonProgress = normalizeResourceDungeonProgress(resourceDungeonProgress);
  $('resourceDungeonSummary').textContent = 'Mỗi phụ bản 3 lượt/ngày';
  const rewardLabels = {
    cultivation: { name: 'Tu vi', className: 'cultivation', iconClass: 'icon-item-daily-calendar' },
    spiritStone: { name: 'Linh thạch', className: 'spirit-stone', iconClass: 'icon-item-spirit-stone' },
    enhancementStone: { name: 'Đá cường hóa', className: 'enhancement', iconClass: 'icon-item-enhancement-stone' },
    chest: { name: 'Rương skill hoặc rương trang bị', className: 'chest', iconClass: 'icon-activity-chest' },
  };
  $('resourceDungeonList').innerHTML = progressionFeatures.resourceDungeons.map((dungeon) => {
    const totalFloors = getResourceDungeonTotalFloors(dungeon);
    const highestFloor = Math.min(totalFloors, getResourceDungeonHighestFloor(dungeon.id));
    const nextFloor = highestFloor + 1;
    const nextTier = getResourceDungeonRequiredTier(dungeon, nextFloor);
    const locked = nextFloor <= totalFloors && getPlayerCultivationTier() < nextTier;
    const reward = rewardLabels[dungeon.rewardType] || { name: 'Tài nguyên', className: 'default', iconClass: 'icon-item-spirit-stone' };
    const previewFloor = Math.min(nextFloor, totalFloors);
    const range = getResourceDungeonRewardRange(dungeon, previewFloor);
    const dailyLimit = getResourceDungeonDailyLimit(dungeon);
    const remainingAttempts = getRemainingResourceAttempts(dungeon.id);
    const usedAttempts = Math.max(0, dailyLimit - remainingAttempts);
    const progress = Math.min(100, Math.round((highestFloor / totalFloors) * 100));
    const canChallenge = !locked && nextFloor <= totalFloors && remainingAttempts > 0;
    const canSweep = highestFloor > 0 && remainingAttempts > 0;
    const exhausted = remainingAttempts <= 0;
    const cleared = highestFloor >= totalFloors;
    return `
      <article class="resource-dungeon-card ${reward.className} ${locked ? 'is-locked' : ''} ${exhausted ? 'is-exhausted' : ''}">
        <div class="resource-dungeon-heading">
          <span class="resource-dungeon-icon"><i class="item-icon ${reward.iconClass}" aria-hidden="true"></i></span>
          <div><strong>${dungeon.name}</strong><small>${reward.name}</small></div>
        </div>
        <p>${dungeon.description} ${cleared ? `Đã hoàn thành ${totalFloors} tầng.` : `Tầng ${nextFloor} cần ${getTierRealmText(nextTier)}.`}</p>
        <div class="resource-dungeon-reward"><span>Thưởng tầng ${previewFloor}</span><strong>${formatGameNumber(range.min)}-${formatGameNumber(range.max)} ${reward.name}</strong></div>
        <div class="resource-dungeon-attempts"><span>Tiến độ</span><strong>${highestFloor}/${totalFloors} tầng · ${usedAttempts}/${dailyLimit} lượt</strong></div>
        <div class="resource-dungeon-progress"><i style="width:${progress}%"></i></div>
        <div class="resource-dungeon-actions">
        <button type="button" class="${canChallenge ? 'breakthrough' : 'secondary'} compact" ${buttonDisabledAttributes(!canChallenge, locked ? `Cần ${getTierRealmText(nextTier)} để mở phụ bản.` : exhausted ? 'Phụ bản đã hết lượt hôm nay.' : 'Chưa thể đánh phụ bản lúc này.')} data-resource-dungeon="${dungeon.id}">
            ${cleared ? 'Đã hoàn thành' : locked ? `Cần ${getTierRealmText(nextTier)}` : exhausted ? 'Hết lượt' : `Đánh tầng ${nextFloor}`}
          </button>
          <button type="button" class="${canSweep ? 'secondary' : 'secondary'} compact" ${buttonDisabledAttributes(!canSweep, highestFloor <= 0 ? 'Chưa có tầng để quét.' : 'Phụ bản đã hết lượt hôm nay.')} onclick="sweepResourceDungeon('${dungeon.id}')">
            ${highestFloor > 0 ? `Quét tầng ${highestFloor}` : 'Chưa có tầng để quét'}
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function challengeResourceDungeon(dungeonId) {
  if (busy || !canAccessResourceDungeons()) return;
  const dungeon = getResourceDungeon(dungeonId);
  const floor = getResourceDungeonHighestFloor(dungeonId) + 1;
  if (!dungeon || floor > getResourceDungeonTotalFloors(dungeon)) return;
  if (getPlayerCultivationTier() < getResourceDungeonRequiredTier(dungeon, floor)) return;
  const stage = createResourceDungeonStage(dungeonId, floor);
  if (stage) startStageBattle(stage);
}

function sweepResourceDungeon(dungeonId) {
  if (busy || !canAccessResourceDungeons() || getRemainingResourceAttempts(dungeonId) <= 0) return;
  const dungeon = getResourceDungeon(dungeonId);
  const floor = getResourceDungeonHighestFloor(dungeonId);
  if (!dungeon || floor <= 0 || !consumeResourceAttempt(dungeonId)) return;
  const reward = grantResourceDungeonReward(dungeonId, floor);
  const rewardText = formatResourceReward(dungeon, reward.amount, reward);
  setPanelMessage('resourceDungeonMessage', `${dungeon.name}: quét tầng ${floor}, nhận ${rewardText}.`);
  showGameToast(`Đã quét ${dungeon.name} tầng ${floor}, nhận ${rewardText}.`, 'success');
  renderResourceDungeons();
  renderCultivation();
  renderShop();
  saveGame();
}

function runResourceDungeon(dungeonId) {
  challengeResourceDungeon(dungeonId);
}
