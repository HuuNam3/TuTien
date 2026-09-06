// Trial Tower tab, stage generation, and data loading. Shared save state remains in main.js.
const trialTowerPath = '/assets/Resources/Data/Tabs/TrialTower/TrialTower.json?v=20260906-trial-enemy-progression-v1';

function getTrialTowerEntryRequiredTier() {
  return Math.max(1, Number(trialTowerData.entryRequiredTier) || 31);
}

function getTrialTowerEnemyTier(floorNumber) {
  const floor = Math.max(1, Math.floor(Number(floorNumber) || 1));
  const startTier = Math.max(1, Math.floor(Number(trialTowerData.enemyStartTier) || getTrialTowerEntryRequiredTier()));
  const tierPerFloor = Math.max(1, Math.floor(Number(trialTowerData.enemyTierPerFloor) || 1));
  return startTier + (floor - 1) * tierPerFloor;
}

function showTrialTower() {
  const requiredTier = getTrialTowerEntryRequiredTier();
  if (!canEnterTrialTower()) {
    showLockedFeatureNotice('Tháp thí luyện', `Cần đạt tu vi ${getTierRealmText(requiredTier)} để mở`);
    return;
  }
  prepareFeatureView(trialTowerPanel, 'trialTower', renderTrialTower);
}

function getTrialTowerFloor(floorNumber) {
  return trialTowerData.floors.find((floor) => Number(floor.floor) === Number(floorNumber)) || null;
}

function getTrialTowerPowerMultiplier(floorNumber) {
  const normalizedFloor = Math.max(1, Math.floor(Number(floorNumber) || 1));
  const floorInBlock = ((normalizedFloor - 1) % 10) + 1;
  const completedThreeFloorMilestones = Math.floor((floorInBlock - 1) / 3);
  const completedTenFloorMilestones = Math.floor((normalizedFloor - 1) / 10);
  return 1.5 + completedThreeFloorMilestones * 0.1 + completedTenFloorMilestones * 0.5;
}

function createTrialTowerStage(floorNumber) {
  const floor = getTrialTowerFloor(floorNumber);
  if (!floor) return null;
  const guardian = floor.guardian || {};
  const rankLevel = Math.max(1, Number(floor.rankLevel) || 1);
  const towerTier = getTrialTowerEnemyTier(floor.floor);
  const majorIndex = getTierMajorIndex(towerTier);
  const realmLevel = getTierMinorLevel(towerTier);
  const visualSource = stageEnemyData[(Math.max(1, Number(floor.floor) || 1) - 1) % Math.max(1, stageEnemyData.length)] || {};
  return {
    id: `trial-tower-${floor.floor}`,
    title: floor.title || `Tầng ${floor.floor}`,
    enemyLevel: realmLevel,
    enemyTier: towerTier,
    enemyMajorRealmIndex: majorIndex,
    towerPowerMultiplier: Number.isFinite(Number(floor.towerPowerMultiplier))
      ? Number(floor.towerPowerMultiplier)
      : getTrialTowerPowerMultiplier(floor.floor),
    realmText: getTierRealmText(towerTier),
    enemyRankLevel: rankLevel,
    enemyData: {
      id: guardian.id || `trial-guardian-${floor.floor}`,
      name: guardian.name || `Thủ vệ tầng ${floor.floor}`,
      type: guardian.type || 'Tu sĩ',
      visual: {
        image: guardian.visual?.image || visualSource.visual?.image || '',
        position: guardian.visual?.position || visualSource.visual?.position || 'center',
        size: guardian.visual?.size || visualSource.visual?.size || '300% 300%',
      },
      rank: Number(floor.rankLevel) >= 4 ? 'king' : Number(floor.rankLevel) === 3 ? 'leader' : 'elite',
      skillName: guardian.skillName || 'Võ kỹ thủ hộ',
      description: guardian.description || '',
      canEquip: Boolean(trialTowerData.enemyEquipmentEnabled),
      combatStyle: guardian.combatStyle || 'counter',
    },
    isTrialTower: true,
    trialFloor: Number(floor.floor),
    trialReward: floor.reward || {},
  };
}

function canEnterTrialTower() {
  return getPlayerCultivationTier() >= getTrialTowerEntryRequiredTier();
}

function formatTrialTowerReward(reward = {}) {
  const parts = [];
  if (Number(reward.cultivation) > 0) parts.push(`<i class="stat-icon icon-stat-cultivation" aria-hidden="true"></i>Tu vi +${formatGameNumber(reward.cultivation)}`);
  if (Number(reward.spiritStones) > 0) parts.push(`<i class="item-icon icon-item-spirit-stone" aria-hidden="true"></i>Linh thạch +${formatGameNumber(reward.spiritStones)}`);
  if (Number(reward.enhancementStones) > 0) parts.push(`<i class="item-icon icon-item-enhancement-stone" aria-hidden="true"></i>Đá cường hóa +${formatGameNumber(reward.enhancementStones)}`);
  if (Number(reward.equipmentChestTier) > 0) parts.push(`<i class="activity-icon icon-activity-chest" aria-hidden="true"></i>Rương trang bị cấp ${formatGameNumber(reward.equipmentChestTier)}`);
  return parts.join(' | ') || 'Phần thưởng đang cập nhật';
}

function getTrialTowerVisibleFloors() {
  const windowSize = 10;
  const totalFloors = trialTowerData.floors.length;
  const firstVisibleFloor = clamp(
    (Number(trialTowerHighestCleared) || 0) + 1,
    1,
    Math.max(1, totalFloors - windowSize + 1),
  );
  return trialTowerData.floors.filter((floor) => {
    const floorNumber = Number(floor.floor);
    return floorNumber >= firstVisibleFloor && floorNumber < firstVisibleFloor + windowSize;
  });
}

function renderTrialTower() {
  const entered = canEnterTrialTower();
  const totalFloors = trialTowerData.floors.length;
  trialTowerHighestCleared = clamp(Number(trialTowerHighestCleared) || 0, 0, totalFloors);
  $('trialTowerProgressText').textContent = `Đã vượt ${trialTowerHighestCleared}/${totalFloors}`;
  $('trialTowerList').innerHTML = getTrialTowerVisibleFloors().map((floor) => {
    const floorNumber = Number(floor.floor);
    const cleared = floorNumber <= trialTowerHighestCleared;
    const unlocked = entered && floorNumber === trialTowerHighestCleared + 1;
    const locked = !entered || floorNumber > trialTowerHighestCleared + 1;
    const stage = createTrialTowerStage(floorNumber);
    const preview = stage ? createStageEnemy(stage) : null;
    const rankText = enemyRankData[String(stage?.enemyRankLevel)]?.label || 'Tinh anh';
    const floorIcon = cleared
      ? 'icon-item-victory'
      : locked
      ? 'icon-stat-lock'
      : 'icon-item-sword';
    return `
      <div class="trial-floor ${cleared ? 'cleared' : ''} ${locked ? 'locked' : ''}">
        <div class="trial-floor-heading">
          <span><i class="${floorIcon.startsWith('icon-stat') ? 'stat-icon' : 'item-icon'} ${floorIcon}" aria-hidden="true"></i>${floor.title || `Tầng ${floorNumber}`}</span>
          <strong>${floor.guardian?.name || 'Thủ vệ'}</strong>
        </div>
        <em>${rankText} | ${formatRealmDisplayText(stage?.realmText)} | ${getCombatStyleLabel(stage?.enemyData)} | Lực chiến ${formatGameNumber(preview ? getCombatPower(preview) : 0)}</em>
        <small>${formatTrialTowerReward(floor.reward)}</small>
        <button type="button" class="${unlocked ? 'breakthrough' : 'secondary'} compact" ${buttonDisabledAttributes(!unlocked, !entered || locked ? 'Tầng này chưa mở.' : 'Chưa thể khiêu chiến tầng này.')} data-trial-floor="${floorNumber}">
          ${cleared ? 'Đã vượt' : !entered ? 'Chưa mở' : locked ? 'Chưa mở' : 'Khiêu chiến'}
        </button>
      </div>
    `;
  }).join('');
}

function startTrialTowerBattle(floorNumber) {
  if (busy || !canEnterTrialTower()) return;
  if (Number(floorNumber) !== trialTowerHighestCleared + 1) return;
  const stage = createTrialTowerStage(floorNumber);
  if (!stage) return;
  startStageBattle(stage);
}

async function loadTrialTowerData() {
  const response = await fetch(trialTowerPath);
  if (!response.ok) throw new Error(`Cannot load trial tower data: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.floors) || data.floors.length !== 80 || !Number.isFinite(Number(data.entryRequiredTier))) {
    throw new Error('Trial tower data is incomplete.');
  }
  trialTowerData = data;
}
