const crypto = require('crypto');

const starterData = require('../assets/Resources/Data/System/StarterData.json');
const gameConfig = require('../assets/Resources/Data/System/GameConfig.json');
const progression = require('../assets/Resources/Data/Shared/CultivationRealms.json');
const progressionFeatures = require('../assets/Resources/Data/System/ProgressionFeatures.json');
const schools = require('../assets/Resources/Data/Shared/CultivationSchools.json');
const skills = require('../assets/Resources/Data/Shared/CultivationSkills.json');
const equipment = require('../assets/Resources/Data/Shared/equipment.json');
const shop = require('../assets/Resources/Data/Tabs/Shop/ShopItems.json');
const wanderData = require('../assets/Resources/Data/Tabs/Wander/WanderMaps.json');

const maxMinorLevel = Math.max(1, Number(gameConfig.gameplay?.playerMaxMinorLevel) || 10);
const npcDailyHangSeconds = 8 * 60 * 60;
const realms = Array.isArray(progression.realms) ? progression.realms : [];
const schoolList = Array.isArray(schools.schools) ? schools.schools : [];
const skillList = Array.isArray(skills.skills) ? skills.skills : [];
const equipmentSlots = Array.isArray(equipment.slots) ? equipment.slots : [];
const baseShopItems = Array.isArray(shop.shopItems) ? shop.shopItems : [];
const wanderMaps = Array.isArray(wanderData.maps) ? wanderData.maps : [];
const wanderBossRequiredWins = Math.max(1, int(gameConfig.gameplay?.wanderBossRequiredWins, 30));
const npcPersonalities = new Set(['balanced', 'aggressive', 'cautious', 'collector']);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function int(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

function randomChoice(items, fallback = '') {
  return items.length ? items[Math.floor(Math.random() * items.length)] : fallback;
}

function getToday() {
  return new Date().toLocaleDateString('en-CA');
}

function getRealm(state) {
  return realms[clamp(int(state.playerMajorRealmIndex), 0, Math.max(0, realms.length - 1))] || {};
}

function getCultivationRequirement(state) {
  const realm = getRealm(state);
  if (int(state.playerLevel, 1) >= maxMinorLevel) return Math.max(1, int(realm.majorBreakthroughRequirement, 900));
  return Math.max(1, int(realm.minorBaseRequirement, 180)
    + (int(state.playerLevel, 1) - 1) * int(realm.minorStepRequirement, 30));
}

function getTier(state) {
  return int(state.playerMajorRealmIndex) * maxMinorLevel + clamp(int(state.playerLevel, 1), 1, maxMinorLevel);
}

function getShopItem(id) {
  return baseShopItems.find((item) => item.id === id) || null;
}

function getStateCount(state, id) {
  return Math.max(0, int(state.shopInventoryCounts?.[id]));
}

function addStateItem(state, id, amount = 1) {
  state.shopInventoryCounts = state.shopInventoryCounts || {};
  state.shopInventoryCounts[id] = getStateCount(state, id) + Math.max(0, int(amount));
}

function ensureDailyState(state) {
  const today = getToday();
  if (state.dailyKey === today) return;
  state.dailyKey = today;
  state.dailyDungeonAttempts = {};
  state.dailyResourceAttempts = {};
  state.dailyShopPurchases = { date: today, counts: {} };
  state.playerBattleState = {
    date: today,
    battleCount: 0,
    rerollCount: 0,
    searchIndex: 0,
    opponent: null,
    lastResult: null,
    lastSettledBattleId: '',
  };
}

function createGenericEquipment(state, actionCount) {
  const slot = randomChoice(equipmentSlots, { id: 'weapon', name: 'Vũ khí' });
  const rarityKeys = Object.keys(equipment.rarities || {});
  const rarity = rarityKeys[clamp(Math.floor(getTier(state) / 10), 0, Math.max(0, rarityKeys.length - 1))] || 'common';
  const level = clamp(int(state.playerLevel, 1) + Math.floor(Math.random() * 3) - 1, 1, 50);
  const item = {
    id: `npc-${actionCount}-${crypto.randomBytes(3).toString('hex')}`,
    name: `${slot.name} NPC ${level}`,
    slotId: slot.id,
    level,
    rarity,
    enhancementLevel: 0,
    statBonuses: {
      attack: slot.id === 'weapon' ? Math.max(1, level * 2) : 0,
      defense: slot.id === 'armor' || slot.id === 'boots' ? Math.max(1, level) : 0,
      maxHp: slot.id === 'amulet' ? Math.max(1, level * 4) : 0,
      maxMana: slot.id === 'artifact' ? Math.max(1, level) : 0,
    },
    specialBonuses: {},
  };
  return item;
}

function createTalentTreasure(state) {
  const stats = ['attack', 'mastery', 'maxHp', 'defense', 'maxMana'];
  const stat = stats[(int(state.npc?.actionCount) || 0) % stats.length];
  return {
    id: `npc-treasure-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    name: `Thiên Tài Địa Bảo ${getTier(state) + 1}`,
    targetMajorRealmIndex: int(state.playerMajorRealmIndex) + 1,
    talentStat: stat,
    statBonuses: { [stat]: stat === 'maxMana' ? 2 : 12 },
    allocation: { [stat]: stat === 'maxMana' ? 2 : 12 },
    combatPower: 12,
    realizedCombatPower: 12,
  };
}

function createNpcState(profile = {}) {
  const initial = starterData.initialPlayer || {};
  const initialState = starterData.initialState || {};
  const schoolId = schoolList.some((school) => school.id === profile.schoolId)
    ? profile.schoolId
    : schoolList[0]?.id || 'sword_cultivator';
  const starterSkill = skillList.find((skill) => skill.schoolId === schoolId) || skillList[0];
  const skillId = starterSkill?.id || initialState.skillId || '';
  const initialHp = 100;
  const initialMana = 20;
  const firstWanderMapId = wanderMaps[0]?.id || initialState.wanderMapId || 'novice';
  return {
    playerName: String(profile.name || initial.name || 'NPC Tu sĩ').slice(0, 40),
    hasSetPlayerName: true,
    hasCompletedStartScreen: true,
    playerSchoolId: schoolId,
    cultivationRealmOrderVersion: progression.version || 1,
    playerMajorRealmIndex: Math.max(0, int(initial.majorRealmIndex)),
    playerLevel: Math.max(1, int(initial.level, 1)),
    playerCultivation: Math.max(0, int(initial.cultivation)),
    playerSpiritStones: Math.max(0, int(initial.spiritStones, 50)),
    playerFoundation: Math.max(1, int(initial.foundation, 1)),
    playerComprehension: 1,
    playerCurrentHp: initialHp,
    playerCurrentMana: initialMana,
    dantianCultivation: 0,
    dantianCultivationSeconds: 0,
    cultivationSpeedBonus: 0,
    healthPotionCount: Math.max(0, int(initial.healthPotions, 1)),
    manaPotionCount: Math.max(0, int(initial.manaPotions, 1)),
    enhancementStones: Math.max(0, int(initial.enhancementStones)),
    playerTalentStatBonuses: {},
    skillLearningComprehension: 0,
    skillBooks: skillId ? { [skillId]: 3 } : {},
    skillFragments: {},
    learnedSkillIds: skillId ? [skillId] : [],
    equippedSkillIds: skillId ? [skillId] : [],
    activeSkillId: skillId,
    skillLevels: skillId ? { [skillId]: 0 } : {},
    skillPractice: skillId ? { [skillId]: 0 } : {},
    skillTrainingId: skillId,
    inventory: [],
    equipmentChestInventory: [],
    equipmentChestIdSeed: 1,
    equipmentIdSeed: 1,
    equippedItems: Object.fromEntries(equipmentSlots.map((slot) => [slot.id, null])),
    talentTreasureInventory: [],
    shopInventoryCounts: {},
    currentDungeonId: initialState.dungeonId || 'main',
    currentWanderMapId: firstWanderMapId,
    currentStageId: 1,
    completedStages: [],
    wanderWinCount: 0,
    wanderRewardCount: 0,
    resourceDungeonProgress: {},
    trialTowerHighestCleared: 0,
    trialTowerWinCount: 0,
    dailyKey: getToday(),
    dailyDungeonAttempts: {},
    dailyResourceAttempts: {},
    dailyShopPurchases: { date: getToday(), counts: {} },
    playerBattleState: {
      date: getToday(), battleCount: 0, rerollCount: 0, searchIndex: 0, opponent: null,
      lastResult: null, lastSettledBattleId: '',
    },
    lastActiveAt: Date.now(),
    npc: {
      version: 1,
      actionCount: 0,
      lastAction: 'Khởi tạo tài khoản NPC',
      lastActionAt: Date.now(),
      activityDate: getToday(),
      wanderSecondsToday: 0,
      wanderMapId: firstWanderMapId,
      wanderMapIndex: 0,
      wanderWinsByMap: { [firstWanderMapId]: 0 },
      wanderBossDefeatedByMap: {},
      wanderBossAttemptsByMap: {},
      mode: 'maintenance',
    },
  };
}

function getNpcPower(state) {
  const tier = getTier(state);
  const equipmentPower = Object.values(state.equippedItems || {}).reduce((total, item) => (
    total + int(item?.level) * (1 + int(item?.enhancementLevel)) * 10
  ), 0);
  return Math.max(1, tier * 100 + int(state.playerFoundation) * 20 + int(state.playerComprehension) * 8 + equipmentPower);
}

function buyNpcItem(state, id, amount = 1) {
  const item = getShopItem(id);
  const quantity = Math.max(1, int(amount, 1));
  const minorPrefix = shop.minorBreakthroughPillConfig?.idPrefix || 'minorAscensionPill';
  const dynamicMinorPill = String(id).startsWith(minorPrefix);
  const cost = item?.cost || (dynamicMinorPill ? 100 + Math.max(0, int(state.playerMajorRealmIndex)) * 25 : 0);
  if ((!item && !dynamicMinorPill) || !cost || int(state.playerSpiritStones) < cost * quantity) return false;
  state.playerSpiritStones -= cost * quantity;
  addStateItem(state, id, quantity);
  return true;
}

function grantChest(state, tier = 1, amount = 1) {
  const existing = state.equipmentChestInventory.find((chest) => int(chest.tier) === tier);
  if (existing) existing.count = int(existing.count) + amount;
  else state.equipmentChestInventory.push({ id: `npc-chest-${tier}`, name: `Rương trang bị cấp ${tier}`, tier, count: amount });
}

function advanceCultivation(state, amount) {
  const before = int(state.playerCultivation);
  state.playerCultivation = Math.max(0, before + Math.max(0, int(amount)));
  return state.playerCultivation - before;
}

function useBreakthroughResource(state) {
  const realm = getRealm(state);
  if (int(state.playerLevel, 1) < maxMinorLevel) {
    const id = `${shop.minorBreakthroughPillConfig?.idPrefix || 'minorAscensionPill'}${realm.id || int(state.playerMajorRealmIndex) + 1}`;
    if (!getStateCount(state, id) && !buyNpcItem(state, id)) return false;
    state.shopInventoryCounts[id] -= 1;
    state.playerCultivation -= getCultivationRequirement(state);
    state.playerLevel += 1;
    return true;
  }

  if (int(state.playerMajorRealmIndex) >= realms.length - 1) return false;
  const permitId = 'majorAscensionPermit';
  if (!getStateCount(state, permitId) && !buyNpcItem(state, permitId)) return false;
  const treasureIndex = (state.talentTreasureInventory || []).findIndex((item) => (
    int(item.targetMajorRealmIndex) === int(state.playerMajorRealmIndex) + 1
  ));
  if (treasureIndex < 0) return false;
  const treasure = state.talentTreasureInventory.splice(treasureIndex, 1)[0];
  state.shopInventoryCounts[permitId] -= 1;
  state.playerCultivation -= getCultivationRequirement(state);
  state.playerMajorRealmIndex += 1;
  state.playerLevel = 1;
  Object.entries(treasure.statBonuses || {}).forEach(([key, value]) => {
    state.playerTalentStatBonuses[key] = (state.playerTalentStatBonuses[key] || 0) + Math.max(0, int(value));
  });
  return true;
}

function recoverNpc(state, elapsedSeconds) {
  const maxHp = 100 + getTier(state) * 12;
  const maxMana = 20 + getTier(state) * 3;
  state.playerCurrentHp = clamp(int(state.playerCurrentHp, maxHp) + Math.max(1, Math.floor(elapsedSeconds / 4)), 0, maxHp);
  state.playerCurrentMana = clamp(int(state.playerCurrentMana, maxMana) + Math.max(1, Math.floor(elapsedSeconds / 6)), 0, maxMana);
  if (state.playerCurrentHp < maxHp * 0.65 && state.healthPotionCount > 0) {
    state.healthPotionCount -= 1;
    state.playerCurrentHp = Math.min(maxHp, state.playerCurrentHp + Math.ceil(maxHp * 0.25));
  }
  if (state.playerCurrentMana < maxMana * 0.65 && state.manaPotionCount > 0) {
    state.manaPotionCount -= 1;
    state.playerCurrentMana = Math.min(maxMana, state.playerCurrentMana + Math.ceil(maxMana * 0.25));
  }
}

function ensureNpcWanderProgress(state) {
  const firstMap = wanderMaps[0] || { id: 'novice', name: 'Thôn Tân thủ', tierRange: [1, 5] };
  state.npc = state.npc || {};
  state.npc.wanderWinsByMap = state.npc.wanderWinsByMap || {};
  state.npc.wanderBossDefeatedByMap = state.npc.wanderBossDefeatedByMap || {};
  state.npc.wanderBossAttemptsByMap = state.npc.wanderBossAttemptsByMap || {};

  const requestedMapId = state.npc.wanderMapId || state.currentWanderMapId || firstMap.id;
  const requestedIndex = wanderMaps.findIndex((map) => map.id === requestedMapId);
  const mapIndex = clamp(
    int(state.npc.wanderMapIndex, requestedIndex >= 0 ? requestedIndex : 0),
    0,
    Math.max(0, wanderMaps.length - 1),
  );
  const currentMap = wanderMaps[mapIndex] || firstMap;

  state.npc.wanderMapIndex = mapIndex;
  state.npc.wanderMapId = currentMap.id;
  state.currentWanderMapId = currentMap.id;
  if (!Number.isFinite(Number(state.npc.wanderWinsByMap[currentMap.id]))) {
    state.npc.wanderWinsByMap[currentMap.id] = Math.max(0, int(state.wanderWinCount));
  }
  state.wanderDefeatedByMap = state.npc.wanderWinsByMap;
  state.wanderBossDefeatedByMap = state.npc.wanderBossDefeatedByMap;
  return currentMap;
}

function getNpcMapTierRange(map) {
  const rawRange = Array.isArray(map?.tierRange) ? map.tierRange : [1, 5];
  const minTier = Math.max(1, int(rawRange[0], 1));
  const maxTier = Math.max(minTier, int(rawRange[1], minTier));
  return [minTier, maxTier];
}

function getNpcMapWinCount(state, mapId) {
  return Math.max(0, int(state.npc?.wanderWinsByMap?.[mapId]));
}

function getNpcCombatChance(state, enemyPower, personality, isBoss = false) {
  const personalityBonus = personality === 'aggressive' ? 0.08 : personality === 'cautious' ? -0.03 : 0;
  const powerRatio = getNpcPower(state) / Math.max(1, enemyPower);
  const baseChance = isBoss ? 0.36 : 0.58;
  return clamp(baseChance + (powerRatio - 1) * (isBoss ? 0.32 : 0.24) + personalityBonus, 0.12, 0.94);
}

function rewardNpcWanderVictory(state, map, personality, mapWinCount) {
  const multiplier = personality === 'aggressive' ? 1.25 : personality === 'cautious' ? 0.85 : 1;
  const rewardSettings = map.rewardSettings || {};
  const cultivationMultiplier = Math.max(0.5, Number(rewardSettings.cultivationMultiplier) || 1);
  advanceCultivation(state, Math.max(10, Math.round((25 + getTier(state) * 8) * multiplier * cultivationMultiplier)));
  state.playerSpiritStones += Math.max(5, Math.round((10 + getTier(state) * 2) * cultivationMultiplier));
  state.wanderRewardCount = int(state.wanderRewardCount) + 1;

  if (mapWinCount % 3 === 0) {
    grantChest(state, clamp(int(map.equipmentChestTier, Math.ceil(getTier(state) / 10)), 1, 10));
  }
  if (mapWinCount % 5 === 0) state.healthPotionCount += 1;
}

function advanceNpcWanderMap(state, map) {
  const currentIndex = clamp(int(state.npc.wanderMapIndex), 0, Math.max(0, wanderMaps.length - 1));
  const nextMap = wanderMaps[currentIndex + 1];
  if (!nextMap) return '';
  state.npc.wanderMapIndex = currentIndex + 1;
  state.npc.wanderMapId = nextMap.id;
  state.npc.wanderWinsByMap[nextMap.id] = getNpcMapWinCount(state, nextMap.id);
  state.currentWanderMapId = nextMap.id;
  return nextMap;
}

function runNpcWanderBoss(state, map, personality) {
  const [, maxTier] = getNpcMapTierRange(map);
  const bossPower = Math.max(80, maxTier * 105);
  state.npc.wanderBossAttemptsByMap[map.id] = int(state.npc.wanderBossAttemptsByMap[map.id]) + 1;
  const won = Math.random() < getNpcCombatChance(state, bossPower, personality, true);

  if (!won) {
    state.npc.wanderWinsByMap[map.id] = 0;
    state.wanderWinCount = 0;
    state.playerCurrentHp = Math.max(1, Math.floor((int(state.playerCurrentHp) || 100) * 0.35));
    return `Thua Boss ${map.name}; làm lại 0/${wanderBossRequiredWins} trận quái`;
  }

  state.npc.wanderBossDefeatedByMap[map.id] = true;
  state.npc.wanderWinsByMap[map.id] = 0;
  state.wanderWinCount = 0;
  state.wanderRewardCount = int(state.wanderRewardCount) + 1;
  grantChest(state, clamp(int(map.equipmentChestTier, Math.ceil(maxTier / 10)), 1, 10), 2);
  const nextMap = advanceNpcWanderMap(state, map);
  if (nextMap) return `Hạ Boss ${map.name}; chuyển sang ${nextMap.name}`;
  return `Hạ Boss ${map.name}; đã chinh phục toàn bộ map Ngao du`;
}

function runNpcWander(state, personality) {
  const map = ensureNpcWanderProgress(state);
  const mapWinCount = getNpcMapWinCount(state, map.id);
  const bossDefeated = Boolean(state.npc.wanderBossDefeatedByMap[map.id]);
  if (!bossDefeated && mapWinCount >= wanderBossRequiredWins) {
    return runNpcWanderBoss(state, map, personality);
  }

  const [minTier, maxTier] = getNpcMapTierRange(map);
  const currentTier = clamp(getTier(state), minTier, maxTier);
  const enemyTier = clamp(currentTier + Math.floor(Math.random() * 3) - 1, minTier, maxTier);
  const enemyPower = Math.max(40, enemyTier * 72);
  const encounterChance = Number(gameConfig.gameplay?.wanderEnemyChance) || 0.4;
  if (Math.random() >= encounterChance) return `Ngao du ${map.name}, tìm thấy cơ duyên`;

  const won = Math.random() < getNpcCombatChance(state, enemyPower, personality);
  if (!won) {
    state.playerCurrentHp = Math.max(1, Math.floor((int(state.playerCurrentHp) || 100) * 0.55));
    return `Ngao du ${map.name}, đánh quái thất bại và lui về hồi phục`;
  }

  const nextWinCount = mapWinCount + 1;
  state.npc.wanderWinsByMap[map.id] = nextWinCount;
  state.wanderWinCount = nextWinCount;
  rewardNpcWanderVictory(state, map, personality, nextWinCount);
  if (nextWinCount >= wanderBossRequiredWins) {
    return `Ngao du ${map.name}, thắng quái ${wanderBossRequiredWins}/${wanderBossRequiredWins}; sẵn sàng đánh Boss`;
  }
  return `Ngao du ${map.name}, thắng quái ${nextWinCount}/${wanderBossRequiredWins}`;
}

function runNpcResources(state) {
  const tier = getTier(state);
  if (tier < int(gameConfig.resourceDungeonEntryRequiredTier || 41)) return false;
  const resources = Array.isArray(progressionFeatures.resourceDungeons) ? progressionFeatures.resourceDungeons : [];
  const resource = resources[int(state.npc?.actionCount) % Math.max(1, resources.length)];
  if (!resource) return false;
  const attempts = int(state.dailyResourceAttempts?.[resource.id]);
  if (attempts >= int(resource.dailyLimit, 3)) return false;
  state.dailyResourceAttempts[resource.id] = attempts + 1;
  const floor = int(state.resourceDungeonProgress?.[resource.id]?.highestCleared) + 1;
  state.resourceDungeonProgress[resource.id] = { highestCleared: floor, lastRewardAt: Date.now() };
  const reward = int(resource.rewardMin, 10) + Math.max(0, floor - 1) * int(resource.rewardGrowthMin, 1);
  if (resource.rewardType === 'cultivation') advanceCultivation(state, reward);
  if (resource.rewardType === 'spiritStone') state.playerSpiritStones += reward;
  if (resource.rewardType === 'enhancementStone') state.enhancementStones += reward;
  return `Vượt ${resource.name} tầng ${floor}`;
}

function runNpcTower(state) {
  const nextFloor = int(state.trialTowerHighestCleared) + 1;
  if (nextFloor > 80 || nextFloor > getTier(state) + 2) return false;
  state.trialTowerHighestCleared = nextFloor;
  state.trialTowerWinCount = int(state.trialTowerWinCount) + 1;
  advanceCultivation(state, 20 + nextFloor * 8);
  state.playerSpiritStones += 15 + nextFloor * 4;
  if (nextFloor % 5 === 0) grantChest(state, clamp(Math.ceil(nextFloor / 8), 1, 10));
  return `Vượt Tháp Thí Luyện tầng ${nextFloor}`;
}

function runNpcPlayerBattle(state) {
  const battle = state.playerBattleState;
  if (!battle || int(battle.battleCount) >= 3) return false;
  battle.battleCount = int(battle.battleCount) + 1;
  const won = Math.random() < 0.6;
  battle.lastResult = won ? 'win' : 'lose';
  battle.lastSettledBattleId = `npc-${Date.now()}`;
  if (won) state.playerSpiritStones += Math.max(25, Math.round(getNpcPower(state) * 0.01));
  return won ? 'Đấu pháp thắng một tu sĩ khác' : 'Đấu pháp thất bại, trở về hồi phục';
}

function trainNpcSkill(state) {
  const skillId = state.activeSkillId || state.learnedSkillIds?.[0];
  if (!skillId) return false;
  const skill = skillList.find((item) => item.id === skillId);
  const level = int(state.skillLevels?.[skillId]);
  const required = Math.max(10, int(skill?.practiceRequired, 100) * (level + 1));
  state.skillPractice[skillId] = Math.min(required, int(state.skillPractice?.[skillId]) + Math.max(1, getTier(state)));
  if (state.skillPractice[skillId] >= required && int(state.skillBooks?.[skillId]) > 0) {
    state.skillPractice[skillId] -= required;
    state.skillBooks[skillId] -= 1;
    state.skillLevels[skillId] = level + 1;
    return `Nâng ${skill?.name || 'skill'} lên cấp ${level + 1}`;
  }
  return `Tu luyện ${skill?.name || 'skill'}`;
}

function improveNpcEquipment(state) {
  const tier = clamp(Math.ceil(getTier(state) / 10), 1, 10);
  const chest = state.equipmentChestInventory.find((item) => int(item.tier) <= tier && int(item.count) > 0);
  if (chest) {
    chest.count -= 1;
    const item = createGenericEquipment(state, int(state.npc?.actionCount));
    const current = state.equippedItems[item.slotId];
    if (!current || int(item.level) > int(current.level)) {
      if (current) state.inventory.push(current);
      state.equippedItems[item.slotId] = item;
      return `Mở rương và trang bị ${item.name}`;
    }
    state.inventory.push(item);
    return 'Mở rương và cất trang bị mới';
  }
  const equipped = Object.values(state.equippedItems || {}).find((item) => item && int(item.level) <= int(state.playerLevel));
  if (equipped && state.enhancementStones > 0 && int(state.playerSpiritStones) >= 50) {
    const levels = Math.min(state.enhancementStones, Math.floor(int(state.playerSpiritStones) / 50), 3);
    equipped.enhancementLevel = int(equipped.enhancementLevel) + levels;
    state.enhancementStones -= levels;
    state.playerSpiritStones -= levels * 50;
    return `Cường hóa ${equipped.name} +${equipped.enhancementLevel}`;
  }
  return false;
}

function prepareNpcBreakthrough(state) {
  if (int(state.playerCultivation) < getCultivationRequirement(state)) return false;
  if (int(state.playerLevel) < maxMinorLevel) return useBreakthroughResource(state) ? 'Đột phá tiểu cảnh giới' : false;
  const target = int(state.playerMajorRealmIndex) + 1;
  if (!state.talentTreasureInventory.some((item) => int(item.targetMajorRealmIndex) === target)) {
    state.talentTreasureInventory.push(createTalentTreasure(state));
    return 'Mở Rương Thiên Tài Địa Bảo';
  }
  return useBreakthroughResource(state) ? 'Thăng đại cảnh giới' : false;
}

function tickNpcState(state, profile = {}, now = Date.now()) {
  const personality = npcPersonalities.has(profile.personality) ? profile.personality : 'balanced';
  ensureDailyState(state);
  state.npc = state.npc || { version: 1, actionCount: 0 };
  const today = getToday();
  if (state.npc.activityDate !== today) {
    state.npc.activityDate = today;
    state.npc.wanderSecondsToday = 0;
    state.npc.lastTickAt = now;
  }
  const lastTick = int(state.npc.lastTickAt, int(state.lastActiveAt, now));
  const elapsedSeconds = clamp(Math.floor((now - lastTick) / 1000), 1, 3600);
  const previousWanderSeconds = Math.max(0, int(state.npc.wanderSecondsToday, int(state.npc.activeSecondsToday)));
  if (state.npc.mode === 'wandering') {
    state.npc.wanderSecondsToday = Math.min(npcDailyHangSeconds, previousWanderSeconds + elapsedSeconds);
  } else if (!Number.isFinite(Number(state.npc.wanderSecondsToday))) {
    state.npc.wanderSecondsToday = previousWanderSeconds;
  }
  state.npc.lastTickAt = now;
  state.lastActiveAt = now;
  state.dantianCultivationSeconds = int(state.dantianCultivationSeconds) + elapsedSeconds;
  advanceCultivation(state, Math.max(1, Math.floor(elapsedSeconds * (1 + getTier(state) * 0.15))));
  recoverNpc(state, elapsedSeconds);

  let action = prepareNpcBreakthrough(state);
  if (!action) {
    const actionIndex = int(state.npc.actionCount) % 6;
    const actions = [
      () => runNpcWander(state, personality),
      () => runNpcResources(state),
      () => runNpcTower(state),
      () => runNpcPlayerBattle(state),
      () => trainNpcSkill(state),
      () => improveNpcEquipment(state),
    ];
    const wanderSeconds = Math.max(0, int(state.npc.wanderSecondsToday, int(state.npc.activeSecondsToday)));
    if (wanderSeconds >= npcDailyHangSeconds) {
      const maintenanceActions = actions.slice(1);
      action = maintenanceActions[int(state.npc.actionCount) % maintenanceActions.length]();
    } else {
      action = actions[actionIndex]();
    }
  }
  action = action || 'Tu luyện và hồi phục';
  state.npc.actionCount = int(state.npc.actionCount) + 1;
  state.npc.lastAction = action;
  state.npc.lastActionAt = now;
  state.npc.mode = /^Ngao du/i.test(action) ? 'wandering' : 'maintenance';
  state.npc.nextActionAt = now + (personality === 'aggressive' ? 30000 : 60000);
  return { state, action, elapsedSeconds, power: getNpcPower(state) };
}

function normalizeNpcProfile(input = {}) {
  const name = String(input.name || 'NPC Tu sĩ').trim().slice(0, 40) || 'NPC Tu sĩ';
  const personality = npcPersonalities.has(input.personality) ? input.personality : 'balanced';
  const schoolId = schoolList.some((school) => school.id === input.schoolId) ? input.schoolId : schoolList[0]?.id || '';
  return { name, personality, schoolId, enabled: input.enabled !== false };
}

function createNpcUsername(name) {
  const safe = String(name || 'npc').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 14) || 'npc';
  return `npc_${safe}_${crypto.randomBytes(3).toString('hex')}`.slice(0, 24);
}

function summarizeNpc(account, state) {
  const npc = state?.npc || {};
  const currentMap = ensureNpcWanderProgress(state || {});
  const currentMapWins = getNpcMapWinCount(state || {}, currentMap.id);
  return {
    id: account?._id?.toString?.() || String(account?.id || ''),
    username: account?.username || '',
    name: state?.playerName || account?.npcProfile?.name || account?.username || 'NPC',
    personality: account?.npcProfile?.personality || 'balanced',
    schoolId: state?.playerSchoolId || account?.npcProfile?.schoolId || '',
    majorRealmIndex: int(state?.playerMajorRealmIndex),
    level: int(state?.playerLevel, 1),
    tier: getTier(state || {}),
    power: getNpcPower(state || {}),
    spiritStones: int(state?.playerSpiritStones),
    lastAction: npc.lastAction || '',
    lastActionAt: npc.lastActionAt || null,
    currentWanderMapId: currentMap.id,
    currentWanderMapName: currentMap.name || currentMap.id,
    wanderMapWins: currentMapWins,
    wanderBossReady: currentMapWins >= wanderBossRequiredWins && !Boolean(npc.wanderBossDefeatedByMap?.[currentMap.id]),
    wanderHoursToday: Math.min(8, Math.round((Math.max(0, int(npc.wanderSecondsToday, int(npc.activeSecondsToday))) / 3600) * 100) / 100),
    hangHoursRemaining: Math.max(0, Math.round(((npcDailyHangSeconds - Math.max(0, int(npc.wanderSecondsToday, int(npc.activeSecondsToday))) ) / 3600) * 100) / 100),
    enabled: account?.npcProfile?.enabled !== false,
  };
}

module.exports = {
  createNpcState,
  createNpcUsername,
  getNpcPower,
  normalizeNpcProfile,
  summarizeNpc,
  tickNpcState,
};
