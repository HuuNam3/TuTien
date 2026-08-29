let maxTurns = 0;
let turnInterval = 0;
let playerMaxMinorLevel = 0;
let wanderEventDelay = 0;
let rewardMultiplier = 0;
let spiritStoneToCultivationRatio = 0.5;
let questRewardGrowthMultiplier = 1.3;
let gameConfig = {};
const cultivationRealmsPath = '/assets/Resources/Data/CultivationRealms.json';
const gameConfigPath = '/assets/Resources/Data/GameConfig.json';
const shopItemsPath = '/assets/Resources/Data/ShopItems.json';
const starterDataPath = '/assets/Resources/Data/StarterData.json';
const equipmentPath = '/assets/Resources/Data/equipment.json';
const progressionFeaturesPath = '/assets/Resources/Data/ProgressionFeatures.json';
const cultivationSchoolsPath = '/assets/Resources/Data/CultivationSchools.json';
const cultivationSkillsPath = '/assets/Resources/Data/CultivationSkills.json';
const combatStatsPath = '/assets/Resources/Data/CombatStats.json';
const combatStylesPath = '/assets/Resources/Data/CombatStyles.json';
const trialTowerPath = '/assets/Resources/Data/TrialTower.json';
const changeLogPath = '/assets/Resources/Data/ChangeLog.json';
const questDataPath = '/assets/Resources/Data/Quests.json';
const maxEquipmentLevel = 120;
const equipmentLevelsPerChestTier = 5;
const maxEquipmentInventory = 100;
const maxShopPurchaseQuantity = 999;
let saveKey = '';
let legacySaveKeys = [];
let defaultPlayerName = '';
let ascensionPermitItemId = '';

let baseStats = {};

let perLevel = {};

let minorRealmNames = [];
let majorRealmNames = [];
let majorRealmBreakthroughs = [];
let majorRealmMinorGrowths = [];
let cultivationProgression = [];
const enemyResourcePath = '/assets/Resources/Data/Enemies.json';
const wanderMapsPath = '/assets/Resources/Data/WanderMaps.json';
let wanderMapDefaults = {};
let stageEnemyData = [];
let stages = [];
let wanderMaps = {};
let wanderMapList = [];
let enemyRankData = {};
let featureAccessNoticeTimer = 0;

function getCultivationTier(majorIndex, minorLevel) {
  return majorIndex * playerMaxMinorLevel + minorLevel;
}

function getPlayerCultivationTier() {
  return getCultivationTier(playerMajorRealmIndex, playerLevel);
}

function getTierMajorIndex(tier) {
  return Math.max(0, Math.floor((Math.max(1, tier) - 1) / playerMaxMinorLevel));
}

function getTierMinorLevel(tier) {
  return ((Math.max(1, tier) - 1) % playerMaxMinorLevel) + 1;
}

function getTierRealmText(tier) {
  const majorIndex = clamp(getTierMajorIndex(tier), 0, majorRealmNames.length - 1);
  const minorLevel = getTierMinorLevel(tier);
  return `${majorRealmNames[majorIndex]} cảnh ${minorRealmNames[minorLevel - 1]}`;
}

function getStageDifficulty(stage) {
  return Math.max(1, Math.floor(stage?.enemyTier || stage?.enemyLevel || 1));
}

function formatGameNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  const rounded = Math.round(number);
  if (Math.abs(rounded) < 10000) return String(rounded);
  const wan = Math.round((rounded / 10000) * 10) / 10;
  return `${wan.toFixed(1).replace(/\.0$/, '')} vạn`;
}

let dailyFarmLimit = 0;
let dungeonConfigs = {};
let dungeonList = [];

let equipmentSlots = [];
let rarityData = {};
let equipmentQualityOrder = [];
let equipmentTemplates = {};
let specialLineData = [];
let equipmentMajorRealmRarityProfiles = [];
let equipmentStatGeneration = {
  varianceMin: 0.8,
  varianceMax: 1.2,
  levelBase: 1,
  levelGrowth: 0.1,
  fixedCount: 2,
  randomCount: 2,
  randomCountMin: 2,
  randomCountMax: 4,
};
let progressionFeatures = { skills: [], enhancement: {}, resourceDungeons: [] };
let cultivationSchools = [];
let cultivationSkillData = { skills: [], grades: [], upgrade: {} };
let cultivationSkills = [];
let combatStatDefinitions = [];
let combatStyles = {};
let trialTowerData = { entryRequiredTier: 10, entryText: '', floors: [] };
let changeLogData = { title: 'Lịch sử cập nhật', entries: [] };
let questData = { title: 'Nhiệm vụ', quests: [] };

let shopItems = [];
let shopCategory = 'all';
let questCategory = 'main';
const temporarilyDisabledQuestCategories = new Set(['side']);
let changeLogCategory = 'all';
let starterInventory = [];
let initialState = {};
let newCharacterPendingGuide = false;

let player;
let enemy;
let currentStage = stages[0];
let completedStages = new Set();
let playerName = defaultPlayerName;
let hasSetPlayerName = false;
let playerSchoolId = '';
let hasCompletedStartScreen = false;
let gameStarted = false;
let playerMajorRealmIndex = 0;
let playerLevel = 0;
let playerCultivation = 0;
let playerSpiritStones = 0;
let playerFoundation = 0;
let playerComprehension = 1;
let devMode = false;
let foundationFindCounts = {};
let foundationPillPurchases = {};
let cultivationPillPurchases = {};
let potionPurchaseCounts = {};
let ascensionPillPurchases = {};
let cultivationSpeedBonus = 0;
let playerCurrentHp = null;
let playerCurrentMana = null;
let healthPotionCount = 0;
let manaPotionCount = 0;
let enhancementStones = 0;
let skillBooks = {};
let shopInventoryCounts = {};
let skillLevels = {};
let skillPractice = {};
let learnedSkillIds = [];
let equippedSkillIds = [];
let equipmentIdSeed = 1;
let equippedItems = {};
let inventory = [];
let equipmentChestIdSeed = 1;
let equipmentChestInventory = [];
let busy = false;
let battleOver = false;
let lastBattleOutcome = null;
let turn = 0;
let timer = 0;
let battleResultTimer = 0;
let wanderTimer = 0;
let wanderRefreshTimer = 0;
let wanderContinueTimer = 0;
let autoWanderRecoveryTimer = 0;
let autoWanderAfterRecovery = false;
let wanderChestRewards = [];
let wanderChestCapacity = 0;
let dantianCultivation = 0;
let dantianCultivationSeconds = 0;
let offlineCapSeconds = 0;
let resourceRegenTimer = 0;
let selectedStage = null;
let currentDungeonId = '';
let currentWanderMapId = '';
let trialTowerHighestCleared = 0;
let claimedQuestIds = new Set();
let wanderWinCount = 0;
let wanderRewardCount = 0;
let trialTowerWinCount = 0;
let equipmentEquipCounts = {};
let dailyQuestProgress = { date: getDailyKey(), wanderWins: 0, wanderRewards: 0, trialTowerWins: 0 };
let currentWanderEvent = null;
let dailyDungeonAttempts = { date: getDailyKey() };
let dailyResourceAttempts = { date: getDailyKey() };
let resourceDungeonProgress = {};
let activeSkillId = '';
let skillTrainingId = '';
let hasMajorAscensionPermit = false;
let resettingGameData = false;
let loadingTargetProgress = 1;
let loadingShownProgress = 1;
let loadingAnimationFrame = 0;
let loadingComplete = false;
let loadingHideScheduled = false;
const criticalAssetPaths = [
  '/assets/Art/Textures/game-background-mobile.png',
  '/assets/Art/Textures/game-background-chibi-mobile.png',
  '/assets/Art/Sprites/UI/chibi-ui-icon-sheet.png',
  '/assets/Art/Sprites/UI/chibi-stat-icon-sheet.png',
  '/assets/Art/Sprites/UI/chibi-item-status-icon-sheet.png',
  '/assets/Art/Sprites/UI/chibi-activity-icon-sheet.png',
  '/assets/Art/Sprites/UI/chibi-unique-icon-sheet.png',
  '/assets/Art/Sprites/UI/chibi-critical-damage-icon.png',
  '/assets/Art/Sprites/Items/chibi-skill-item-sheet.png',
  '/assets/Art/Sprites/Characters/chibi-sword-cultivator.png',
  '/assets/Art/Sprites/Characters/chibi-blade-cultivator.png',
  '/assets/Art/Sprites/Characters/chibi-martial-cultivator.png',
  '/assets/Art/Sprites/Enemies/chibi-enemy-dog.png',
  '/assets/Art/Sprites/Enemies/chibi-enemy-bandit.png',
  '/assets/Art/Sprites/Enemies/chibi-enemy-ghost.png',
  '/assets/Art/Sprites/Enemies/chibi-enemy-spider.png',
  '/assets/Art/Sprites/Enemies/chibi-enemy-beasts-sheet.png',
  '/assets/Art/Sprites/Enemies/chibi-enemy-cultivators-sheet.png',
  '/assets/Art/Sprites/Enemies/chibi-enemy-spirits-sheet.png',
  '/assets/Art/Sprites/Enemies/chibi-enemy-constructs-sheet.png',
  '/assets/Art/Sprites/Enemies/chibi-enemy-specials-sheet.png',
];

const $ = (id) => document.getElementById(id);
const resourceLoader = $('resourceLoader');
const resourceLoadingStatus = $('resourceLoadingStatus');
const resourceLoadingBar = $('resourceLoadingBar');
const resourceLoadingPercent = $('resourceLoadingPercent');
const resourceProgress = document.querySelector('.resource-progress');
const subtitle = $('subtitle');
const mapPanel = $('mapPanel');
const battlePanel = $('battlePanel');
const trainingPanel = $('trainingPanel');
const profilePanel = $('profilePanel');
const equipmentPanel = $('equipmentPanel');
const inventoryPanel = $('inventoryPanel');
const shopPanel = $('shopPanel');
const battleResult = $('battleResult');
const stageGrid = $('stageGrid');
const dungeonModeGrid = $('dungeonModeGrid');
const dungeonAttemptText = $('dungeonAttemptText');
const wanderChestButton = $('wanderChestButton');
const stageDetailPanel = $('stageDetailPanel');
const startButton = $('startButton');
const backButton = $('backButton');
const trainingButton = $('trainingButton');
const dungeonButton = $('dungeonButton');
const profileButton = $('profileButton');
const playerAvatarButton = $('playerAvatarButton');
const playerAvatarVisual = $('playerAvatarVisual');
const equipmentButton = $('equipmentButton');
const inventoryButton = $('inventoryButton');
const shopButton = $('shopButton');
const enhancementButton = $('enhancementButton');
const resourceDungeonButton = $('resourceDungeonButton');
const trialTowerButton = $('trialTowerButton');
const changeLogButton = $('changeLogButton');
const changeLogCategoryFilters = $('changeLogCategoryFilters');
const devButton = $('devButton');
const questButton = $('questButton');
const questCategoryFilters = $('questCategoryFilters');
const dungeonBadge = $('dungeonBadge');
const trainingBadge = $('trainingBadge');
const questBadge = $('questBadge');
const resourceDungeonBadge = $('resourceDungeonBadge');
const equipmentBadge = $('equipmentBadge');
const enhancementPanel = $('enhancementPanel');
const resourceDungeonPanel = $('resourceDungeonPanel');
const trialTowerPanel = $('trialTowerPanel');
const changeLogPanel = $('changeLogPanel');
const devPanel = $('devPanel');
const questPanel = $('questPanel');
const resetDataButton = $('resetDataButton');
const featureAccessNotice = $('featureAccessNotice');
const resetConfirmModal = $('resetConfirmModal');

const isPublicDeployment = window.location.hostname.toLowerCase() === 'dao-huu-tu-tien.vercel.app';
if (devButton) {
  devButton.hidden = isPublicDeployment;
  devButton.setAttribute('aria-hidden', String(isPublicDeployment));
}
const closeResetModalButton = $('closeResetModalButton');
const cancelResetButton = $('cancelResetButton');
const confirmResetButton = $('confirmResetButton');
const equipmentFilter = $('equipmentFilter');
const equipmentSort = $('equipmentSort');
const equipmentBulkSellRarity = $('equipmentBulkSellRarity');
const equipmentBulkSellButton = $('equipmentBulkSellButton');
const useHealthPotionButton = $('useHealthPotionButton');
const useManaPotionButton = $('useManaPotionButton');
const closeProfileButton = $('closeProfileButton');
const closeEquipmentButton = $('closeEquipmentButton');
const closeShopButton = $('closeShopButton');
const shopCategoryFilters = $('shopCategoryFilters');
const shopList = $('shopList');
const quickEquipButton = $('quickEquipButton');
const challengeStageButton = $('challengeStageButton');
const closeStageDetailButton = $('closeStageDetailButton');
const breakthroughButton = $('breakthroughButton');
const playerNameInput = $('playerNameInput');
const saveNameButton = $('saveNameButton');
const nameEditor = document.querySelector('.name-editor');
const startScreen = $('startScreen');
const startPlayerNameInput = $('startPlayerNameInput');
const schoolChoiceGrid = $('schoolChoiceGrid');
const enterGameButton = $('enterGameButton');
const startSchoolHint = $('startSchoolHint');
const tabButtons = {
  map: dungeonButton,
  training: trainingButton,
  equipment: equipmentButton,
  inventory: inventoryButton,
  shop: shopButton,
  enhancement: enhancementButton,
  resourceDungeon: resourceDungeonButton,
  trialTower: trialTowerButton,
  changeLog: changeLogButton,
  dev: devButton,
  quests: questButton,
};
const logList = $('battleLog');
const wanderEventOverlay = document.createElement('div');
wanderEventOverlay.className = 'wander-event-overlay is-hidden';
document.body.appendChild(wanderEventOverlay);
const battleResultOverlay = document.createElement('div');
battleResultOverlay.className = 'wander-event-overlay is-hidden';
document.body.appendChild(battleResultOverlay);
const wanderChestOverlay = document.createElement('div');
wanderChestOverlay.className = 'wander-event-overlay is-hidden';
document.body.appendChild(wanderChestOverlay);
const shopDetailOverlay = document.createElement('div');
shopDetailOverlay.className = 'wander-event-overlay is-hidden';
document.body.appendChild(shopDetailOverlay);
const inventoryDetailOverlay = document.createElement('div');
inventoryDetailOverlay.className = 'wander-event-overlay is-hidden';
document.body.appendChild(inventoryDetailOverlay);
const onboardingOverlay = document.createElement('div');
onboardingOverlay.className = 'onboarding-overlay is-hidden';
document.body.appendChild(onboardingOverlay);
let onboardingStep = 0;

const onboardingSteps = [
  {
    iconType: 'game-icon',
    icon: 'icon-flame',
    title: 'Tu luyện',
    text: 'Tu luyện giúp đạo hữu tích lũy tu vi và hồi phục sinh lực, linh lực. Hãy để tu vi đầy trước khi đột phá.',
    action: 'Xem Tu luyện',
    tab: 'training',
  },
  {
    iconType: 'game-icon',
    icon: 'icon-compass',
    title: 'Ngao du',
    text: 'Chọn một map đã mở. Sau mỗi 10 giây, đạo hữu sẽ gặp cơ duyên hoặc kẻ địch để nhận thưởng hoặc chiến đấu.',
    action: 'Xem Ngao du',
    tab: 'map',
  },
  {
    iconType: 'activity-icon',
    icon: 'icon-activity-path',
    title: 'Bắt đầu hành trình',
    text: 'Tu luyện để mạnh lên, sau đó Ngao du để kiếm tài nguyên và mở những map mới theo tu vi.',
    action: 'Bắt đầu chơi',
    tab: 'map',
  },
];

function hideBattleResultOverlay() {
  window.clearTimeout(battleResultTimer);
  battleResultTimer = 0;
  battleResultOverlay.classList.add('is-hidden');
  battleResultOverlay.innerHTML = '';
}

function hideOnboardingGuide() {
  onboardingOverlay.classList.add('is-hidden');
  onboardingOverlay.innerHTML = '';
}

function renderOnboardingGuide() {
  const step = onboardingSteps[onboardingStep] || onboardingSteps[0];
  onboardingOverlay.innerHTML = `
    <div class="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboardingTitle">
      <span class="onboarding-kicker"><i class="${step.iconType} ${step.icon}" aria-hidden="true"></i>Hướng dẫn nhập môn · ${onboardingStep + 1}/${onboardingSteps.length}</span>
      <h2 id="onboardingTitle">${step.title}</h2>
      <p>${step.text}</p>
      <div class="onboarding-actions">
        <button type="button" class="secondary compact onboarding-skip">Bỏ qua</button>
        <button type="button" class="breakthrough compact onboarding-next"><i class="${step.iconType} ${step.icon}" aria-hidden="true"></i>${step.action}</button>
      </div>
    </div>
  `;
  onboardingOverlay.querySelector('.onboarding-skip').addEventListener('click', hideOnboardingGuide);
  onboardingOverlay.querySelector('.onboarding-next').addEventListener('click', () => {
    if (step.tab === 'training') showTraining();
    if (step.tab === 'map') showMap();
    if (onboardingStep >= onboardingSteps.length - 1) {
      hideOnboardingGuide();
      return;
    }
    onboardingStep += 1;
    renderOnboardingGuide();
  });
}

function showOnboardingGuide() {
  onboardingStep = 0;
  onboardingOverlay.classList.remove('is-hidden');
  renderOnboardingGuide();
}

backButton?.addEventListener('click', showMap);
closeProfileButton?.addEventListener('click', showMap);
closeEquipmentButton?.addEventListener('click', showMap);
closeShopButton?.addEventListener('click', showMap);
trainingButton.addEventListener('click', showTraining);
dungeonButton.addEventListener('click', showMap);
wanderChestButton?.addEventListener('click', openWanderChest);
profileButton?.addEventListener('click', showProfile);
playerAvatarButton?.addEventListener('click', showProfile);
equipmentButton.addEventListener('click', showEquipment);
inventoryButton?.addEventListener('click', showInventory);
shopButton.addEventListener('click', showShop);
shopCategoryFilters?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-shop-category]');
  if (!button) return;
  shopCategory = button.dataset.shopCategory || 'all';
  renderShop();
});
enhancementButton.addEventListener('click', showEnhancement);
resourceDungeonButton.addEventListener('click', showResourceDungeons);
trialTowerButton?.addEventListener('click', showTrialTower);
changeLogButton?.addEventListener('click', showChangeLog);
changeLogCategoryFilters?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-change-log-category]');
  if (!button) return;
  changeLogCategory = button.dataset.changeLogCategory || 'all';
  renderChangeLog();
});
devButton?.addEventListener('click', showDevMode);
questButton?.addEventListener('click', showQuests);
questCategoryFilters?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-quest-category]');
  if (!button || temporarilyDisabledQuestCategories.has(button.dataset.questCategory)) return;
  questCategory = button.dataset.questCategory || 'main';
  renderQuests();
});
resetDataButton.addEventListener('click', openResetConfirm);
closeResetModalButton?.addEventListener('click', closeResetConfirm);
cancelResetButton?.addEventListener('click', closeResetConfirm);
confirmResetButton?.addEventListener('click', resetGameData);
document.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) {
    const card = event.target.closest('.shop-item[data-shop-detail]');
    if (card) openShopItemDetail(card.dataset.shopDetail);
    return;
  }
  if (target.dataset.shopItem) return buyShopItem(target.dataset.shopItem);
  if (target.dataset.shopDetail) return openShopItemDetail(target.dataset.shopDetail);
  if (target.dataset.inventoryUse) return useInventoryItem(target.dataset.inventoryUse);
  if (target.dataset.inventoryDetail) return openInventoryItemDetail(target.dataset.inventoryDetail);
  if (target.dataset.skillAction === 'select') return selectSkillTraining(target.dataset.skillId);
  if (target.dataset.skillAction === 'equip') return toggleEquipSkill(target.dataset.skillId);
  if (target.dataset.skillAction === 'upgrade') return upgradeSkill(target.dataset.skillId);
  if (target.dataset.resourceDungeon) return challengeResourceDungeon(target.dataset.resourceDungeon);
  if (target.dataset.trialFloor) return startTrialTowerBattle(Number(target.dataset.trialFloor));
  if (target.dataset.enhanceItem) return enhanceEquipment(Number(target.dataset.enhanceItem));
});
resetConfirmModal?.addEventListener('click', (event) => {
  if (event.target === resetConfirmModal) closeResetConfirm();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !resetConfirmModal?.classList.contains('is-hidden')) {
    closeResetConfirm();
    return;
  }
  if (event.key === 'Escape' && !wanderChestOverlay.classList.contains('is-hidden')) {
    hideWanderChestOverlay();
    return;
  }
  if (event.key === 'Escape' && !shopDetailOverlay.classList.contains('is-hidden')) {
    hideShopItemDetail();
    return;
  }
  if (event.key === 'Escape' && !inventoryDetailOverlay.classList.contains('is-hidden')) {
    hideInventoryItemDetail();
  }
  if (event.key === 'Enter' && event.target.closest('.shop-item[data-shop-detail]')
    && !event.target.closest('button, input')) {
    openShopItemDetail(event.target.closest('.shop-item').dataset.shopDetail);
  }
});
$('absorbDantianButton')?.addEventListener('click', absorbDantianCultivation);
equipmentFilter?.addEventListener('change', renderEquipment);
equipmentSort?.addEventListener('change', renderEquipment);
equipmentBulkSellButton?.addEventListener('click', () => {
  sellEquipmentByRarity(equipmentBulkSellRarity?.value || 'all');
});
useHealthPotionButton.addEventListener('click', () => usePotion('health'));
useManaPotionButton.addEventListener('click', () => usePotion('mana'));
quickEquipButton.addEventListener('click', quickEquipBestItems);
challengeStageButton.addEventListener('click', () => startStageBattle(selectedStage || currentStage));
closeStageDetailButton?.addEventListener('click', showMap);
saveNameButton.addEventListener('click', savePlayerName);
playerNameInput.addEventListener('change', savePlayerName);
playerNameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    savePlayerName();
    playerNameInput.blur();
  }
});
startPlayerNameInput?.addEventListener('input', updateStartScreenAvailability);
enterGameButton?.addEventListener('click', completeStartScreen);
window.addEventListener('beforeunload', () => {
  if (!resettingGameData) saveGame();
});

function setSubtitle(text) {
  if (subtitle) subtitle.textContent = text;
}

function hideFeatureAccessNotice() {
  window.clearTimeout(featureAccessNoticeTimer);
  featureAccessNoticeTimer = 0;
  featureAccessNotice?.classList.add('is-hidden');
  featureAccessNotice?.classList.remove('toast-success', 'toast-error', 'toast-locked');
  if (featureAccessNotice) featureAccessNotice.textContent = '';
}

function showGameToast(message, variant = 'success') {
  if (!featureAccessNotice) return;
  window.clearTimeout(featureAccessNoticeTimer);
  featureAccessNotice.classList.remove('toast-success', 'toast-error', 'toast-locked');
  featureAccessNotice.classList.add(`toast-${variant}`);
  featureAccessNotice.textContent = message;
  featureAccessNotice.classList.remove('is-hidden');
  featureAccessNoticeTimer = window.setTimeout(hideFeatureAccessNotice, 3600);
}

function showLockedFeatureNotice(featureName, requirementText) {
  showGameToast(`${featureName} chưa mở. ${requirementText}.`, 'locked');
}

function setTurnLabel(text) {
  const el = $('turnLabel');
  if (el) el.textContent = text;
  const battleTurn = $('battleTurnText');
  if (battleTurn) battleTurn.textContent = String(text || '').replace(/^Lượt\s*/i, '') || '1';
}

function savePlayerName() {
  const nextName = sanitizePlayerName(playerNameInput.value);
  playerName = nextName;
  hasSetPlayerName = true;
  playerNameInput.value = playerName;
  if (player) player.name = playerName;
  updateNameEditorVisibility();
  renderCultivation();
  if (!profilePanel.classList.contains('is-hidden')) renderProfile();
  if (!battlePanel.classList.contains('is-hidden')) render();
  saveGame();
}

function updateNameEditorVisibility() {
  nameEditor?.classList.toggle('is-hidden', hasSetPlayerName);
}

function getPlayerSchool() {
  return cultivationSchools.find((school) => school.id === playerSchoolId) || null;
}

function getPlayerSkills() {
  const schoolSkills = cultivationSkills.filter((skill) => skill.schoolId === playerSchoolId);
  return schoolSkills.length ? schoolSkills : progressionFeatures.skills;
}

function getSkillMaxLevel() {
  return Math.max(1, Number(cultivationSkillData.upgrade?.maxLevel) || 10);
}

function getSkillLevel(skillId) {
  return clamp(Number(skillLevels[skillId]) || 0, 0, getSkillMaxLevel());
}

function isSkillLearned(skillId) {
  return learnedSkillIds.includes(skillId);
}

function getSkillGradeName(skill) {
  return cultivationSkillData.grades.find((grade) => grade.id === skill.gradeId)?.name || 'Phẩm cấp chưa định';
}

function getSkillRequiredTier(skill) {
  const gradeTier = cultivationSkillData.gradeRequiredTier?.[skill.gradeId];
  return Math.max(1, Number(gradeTier) || Number(skill.requiredTier) || Number(skill.requiredLevel) || 1);
}

function getShopSkillRequiredTier(shopItem) {
  const skill = cultivationSkills.find((entry) => entry.id === shopItem.skillId);
  return skill ? getSkillRequiredTier(skill) : Math.max(1, Number(shopItem.requiredTier) || 1);
}

function getSkillBookCount(skillId) {
  return Math.max(0, Math.floor(Number(skillBooks[skillId]) || 0));
}

const skillItemIconIds = new Set([
  'beginner_sword_art', 'sword_quickdraw', 'sword_flash', 'sword_flow', 'sword_domain', 'sword_storm',
  'beginner_blade_art', 'blade_heavy', 'blade_blood', 'blade_rend', 'blade_heaven', 'blade_apocalypse',
]);

function getSkillItemIconClass(skillId) {
  return skillItemIconIds.has(skillId) ? `icon-skill-item-${skillId}` : 'icon-item-skill-book';
}

function getSkillBookRequired(targetLevel) {
  const levels = cultivationSkillData.upgrade?.skillBookRequiredLevels || [3, 6, 9];
  return levels.map(Number).includes(Number(targetLevel)) ? 1 : 0;
}

function getTotalSkillBooks() {
  return Object.values(skillBooks).reduce((total, count) => total + Math.max(0, Math.floor(Number(count) || 0)), 0);
}

function getSkillMultiplier(skill, level = getSkillLevel(skill.id)) {
  const perLevelByGrade = cultivationSkillData.upgrade?.multiplierPerLevelByGrade || {};
  const perLevel = Number(perLevelByGrade[skill?.gradeId]
    ?? cultivationSkillData.upgrade?.multiplierPerLevel) || 0;
  return (Number(skill.multiplier) || 1) + Math.max(0, level) * perLevel;
}

function getSkillCombatPower(skill, level = getSkillLevel(skill.id)) {
  if (!skill) return 0;
  if (Number.isFinite(Number(skill.combatPowerValue))) return Math.max(0, Math.round(Number(skill.combatPowerValue)));
  const perLevel = Math.max(0, Number(cultivationSkillData.upgrade?.combatPowerPerLevel) || 0);
  const perMilestone = Math.max(0, Number(cultivationSkillData.upgrade?.combatPowerPerMilestone) || 0);
  const milestoneCount = Math.floor(Math.max(0, level) / 3);
  return Math.max(0, Math.round((Number(skill.combatPower) || 0) + Math.max(0, level) * perLevel + milestoneCount * perMilestone));
}

function getEquippedSkillCombatPower(skills = getEquippedSkills()) {
  return skills.reduce((total, skill) => total + getSkillCombatPower(skill), 0);
}

function getSkillPracticeConfig() {
  return cultivationSkillData.practice || {};
}

function getSkillPractice(skillId) {
  return Math.max(0, Math.floor(Number(skillPractice[skillId]) || 0));
}

function getSkillPracticeRequired(skill, targetLevel = getSkillLevel(skill.id) + 1) {
  const config = getSkillPracticeConfig();
  const baseRequired = Math.max(1, Number(config.baseRequired) || 20);
  const requiredPerLevel = Math.max(0, Number(config.requiredPerLevel) || 15);
  const gradeMultiplier = Math.max(1, Number(config.gradeMultiplier?.[skill?.gradeId]) || 1);
  return Math.max(1, Math.round((baseRequired + Math.max(0, targetLevel - 1) * requiredPerLevel) * gradeMultiplier));
}

function getSkillPracticePercent(skill, practice = getSkillPractice(skill.id)) {
  if (!skill || getSkillLevel(skill.id) >= getSkillMaxLevel()) return 100;
  return Math.min(100, Math.round((practice / getSkillPracticeRequired(skill)) * 100));
}

function getSkillMilestoneCount(level) {
  return Math.floor(Math.max(0, Number(level) || 0) / 3);
}

function getSkillEffects(skill, level = getSkillLevel(skill.id)) {
  const growth = getSkillPracticeConfig().milestoneEffectGrowth || {};
  const milestoneCount = getSkillMilestoneCount(level);
  return (skill?.effects || []).map((effect) => {
    const levelIncrease = Number(effect.levelIncrease) || 0;
    if (levelIncrease) {
      const field = effect.levelIncreaseField || 'value';
      return {
        ...effect,
        [field]: (Number(effect[field]) || 0) + levelIncrease * Math.max(0, level),
      };
    }
    const growthKey = effect.type === 'healPercent' ? 'healPercent' : effect.stat;
    const perMilestone = Number(effect.milestoneIncrease ?? growth[growthKey]) || 0;
    if (!perMilestone || !milestoneCount) return { ...effect };
    return {
      ...effect,
      value: (Number(effect.value) || 0) + perMilestone * milestoneCount,
    };
  });
}

function gainSkillPractice(seconds = 1) {
  const skill = getPlayerSkills().find((entry) => entry.id === skillTrainingId && isSkillLearned(entry.id));
  if (!skill || getSkillLevel(skill.id) >= getSkillMaxLevel()) return false;
  const required = getSkillPracticeRequired(skill);
  const current = getSkillPractice(skill.id);
  if (current >= required) return false;
  const trainingSeconds = Math.max(1, Math.floor(Number(seconds) || 1));
  const config = getSkillPracticeConfig();
  const speed = config.speedStat === 'comprehension'
    ? Math.max(1, Math.floor(Number(playerComprehension) || 1))
    : Math.max(1, Number(config.gainPerSecond) || 1);
  const gain = trainingSeconds * speed;
  const next = Math.min(required, current + gain);
  skillPractice[skill.id] = next;
  if (next >= required && skillTrainingId === skill.id) skillTrainingId = '';
  return next > current;
}

function getMaxEquippedSkills() {
  return (cultivationSkillData.equipSlots || []).reduce((maxSlot, slot) => (
    getPlayerCultivationTier() >= Number(slot.requiredTier || Infinity)
      ? Math.max(maxSlot, Number(slot.slot) || 1)
      : maxSlot
  ), 1);
}

function getEquippedSkills() {
  const skillMap = new Map(getPlayerSkills().map((skill) => [skill.id, skill]));
  return equippedSkillIds.map((skillId) => skillMap.get(skillId)).filter(Boolean);
}

function createSkillRuntime(skill) {
  const level = getSkillLevel(skill.id);
  return {
    id: skill.id,
    name: skill.name,
    level,
    cost: Math.max(0, Number(skill.cost) || 0),
    multiplier: getSkillMultiplier(skill, level),
    cooldown: Math.max(1, Number(skill.cooldown) || 1),
    cooldownRemaining: Math.max(1, Number(skill.cooldown) || 1),
    combatPowerValue: getSkillCombatPower(skill, level),
    effects: getSkillEffects(skill, level),
  };
}

function ensureActiveSkill() {
  const skills = getPlayerSkills();
  const ids = new Set(skills.map((skill) => skill.id));
  learnedSkillIds = learnedSkillIds.filter((skillId) => ids.has(skillId));
  skillLevels = Object.fromEntries(Object.entries(skillLevels || {})
    .filter(([skillId]) => ids.has(skillId))
    .map(([skillId, level]) => [skillId, getSkillLevel(skillId)]));
  skillPractice = Object.fromEntries(Object.entries(skillPractice || {})
    .filter(([skillId]) => ids.has(skillId))
    .map(([skillId, practice]) => {
      const skill = skills.find((entry) => entry.id === skillId);
      const required = skill ? getSkillPracticeRequired(skill, getSkillLevel(skill.id) + 1) : 0;
      return [skillId, Math.min(required, Math.max(0, Math.floor(Number(practice) || 0)))];
    }));
  skillBooks = Object.fromEntries(Object.entries(skillBooks || {})
    .filter(([skillId]) => ids.has(skillId))
    .map(([skillId, count]) => [skillId, Math.max(0, Math.floor(Number(count) || 0))]));
  if (skills[0] && !isSkillLearned(skills[0].id)) learnedSkillIds.push(skills[0].id);
  equippedSkillIds = equippedSkillIds.filter((skillId) => ids.has(skillId) && isSkillLearned(skillId));
  if (!equippedSkillIds.length && skills[0]) equippedSkillIds = [skills[0].id];
  equippedSkillIds = equippedSkillIds.slice(0, getMaxEquippedSkills());
  if (!equippedSkillIds.includes(activeSkillId)) activeSkillId = equippedSkillIds[0] || '';
  if (!ids.has(skillTrainingId) || !isSkillLearned(skillTrainingId)) skillTrainingId = '';
}

function getSchoolFocusText(school) {
  const labels = {
    attack: 'Công',
    accuracy: 'Chính xác',
    blockRate: 'Đỡ',
    blockReduction: 'Giảm đỡ',
    critDamage: 'ST chí mạng',
    critRate: 'Chí mạng',
    defense: 'Thủ',
    dodgeRate: 'Né',
    lifeSteal: 'Hút máu',
    maxHp: 'Sinh lực',
    maxMana: 'Linh lực',
    speed: 'Tốc độ',
    spiritSense: 'Thần thức',
    comprehension: 'Ngộ tính',
  };
  return (school.focusStats || []).slice(0, 3).map((stat) => labels[stat] || stat).join(' · ');
}

function getSchoolVisualClass(schoolId = playerSchoolId) {
  if (schoolId === 'blade_cultivator') return 'school-blade';
  if (schoolId === 'martial_cultivator') return 'school-martial';
  return 'school-sword';
}

const enemyVisualIds = new Set([
  'wild_dog_demon', 'blood_claw_wolf', 'iron_back_bear_demon', 'thorn_rat_demon', 'red_mane_boar', 'crystal_shell_beast',
  'rogue_cultivator', 'stone_skin_bandit', 'young_sword_servant', 'dark_saber_cultivator', 'fallen_inner_disciple',
  'spirit_mine_keeper', 'wandering_miner', 'poison_blade_rogue', 'ghost_faced_swordsman',
  'mist_ghost', 'bone_charm_ghost', 'yin_flame_spirit', 'black_mist_scholar', 'mud_corpse', 'grave_lord',
  'ancient_grudge_wraith', 'fractured_soul',
  'crystal_cave_guard', 'stone_armor_demon', 'void_miner', 'void_gate_guardian', 'ancient_sky_beast',
  'poison_vine_spirit', 'forest_spider',
]);

const enemyNameVisualIds = new Map([
  ['dã khuyển yêu', 'wild_dog_demon'],
  ['tán tu lâm mộc', 'rogue_cultivator'],
  ['sơn đạo da đá', 'stone_skin_bandit'],
  ['kiếm đồng hứa nham', 'young_sword_servant'],
  ['sương hồn', 'mist_ghost'],
  ['huyết trảo lang yêu', 'blood_claw_wolf'],
  ['độc đằng tinh', 'poison_vine_spirit'],
  ['đao tu hắc nham', 'dark_saber_cultivator'],
  ['bạch cốt mị ảnh', 'bone_charm_ghost'],
  ['thiết bối hùng yêu', 'iron_back_bear_demon'],
  ['nội môn sa ngã', 'fallen_inner_disciple'],
  ['tinh thạch hộ vệ', 'crystal_cave_guard'],
  ['âm hỏa tinh', 'yin_flame_spirit'],
  ['thạch giáp yêu', 'stone_armor_demon'],
  ['quỷ diện kiếm khách', 'ghost_faced_swordsman'],
  ['thủ khoáng giả', 'spirit_mine_keeper'],
  ['cổ oán linh', 'ancient_grudge_wraith'],
  ['gai gai yêu', 'thorn_rat_demon'],
  ['thi bùn', 'mud_corpse'],
  ['tán tu khai khoáng', 'wandering_miner'],
  ['mộc võng yêu', 'forest_spider'],
  ['xích mao trư yêu', 'red_mane_boar'],
  ['hắc vụ quỷ sinh', 'black_mist_scholar'],
  ['độc nhận tà tu', 'poison_blade_rogue'],
  ['tinh giáp thú', 'crystal_shell_beast'],
  ['hư không khôi lỗi', 'void_miner'],
  ['mộ huyệt quỷ vương', 'grave_lord'],
  ['huyền môn thủ vệ', 'void_gate_guardian'],
  ['ly hợp tàn hồn', 'fractured_soul'],
  ['thái hư cổ thú', 'ancient_sky_beast'],
]);

function getEnemyVisualClass(enemyData = {}) {
  const enemyName = String(enemyData.name || '').toLowerCase();
  const visualId = enemyVisualIds.has(enemyData.id) ? enemyData.id : enemyNameVisualIds.get(enemyName);
  if (visualId) return `enemy-${visualId}`;
  if (enemyName.includes('lang') || enemyName.includes('cẩu') || enemyName.includes('hổ')) return 'enemy-dog';
  if (enemyName.includes('ma') || enemyName.includes('hồn') || enemyName.includes('quỷ')) return 'enemy-ghost';
  if (enemyName.includes('chu') || enemyName.includes('nhện') || enemyName.includes('xà')) return 'enemy-spider';
  return 'enemy-bandit';
}

function renderStartScreen() {
  const availableSchoolIds = ['sword_cultivator', 'blade_cultivator', 'martial_cultivator'];
  const availableSchools = availableSchoolIds
    .map((id) => cultivationSchools.find((school) => school.id === id))
    .filter(Boolean);

  schoolChoiceGrid.innerHTML = availableSchools.map((school) => {
    const available = school.id === 'sword_cultivator';
    return `
    <button type="button" class="school-choice ${school.id === playerSchoolId ? 'selected' : ''} ${available ? '' : 'is-developing'}" data-school-id="${school.id}" aria-disabled="${!available}">
      <span class="school-choice-art ${getSchoolVisualClass(school.id)}" aria-hidden="true"></span>
      <strong>${school.name}</strong>
      <span>${school.starterSkill?.name || school.skills?.[0]?.name || 'Nhập môn'}</span>
      <small>${available ? getSchoolFocusText(school) : 'Đang phát triển'}</small>
    </button>
  `;
  }).join('');

  schoolChoiceGrid.querySelectorAll('[data-school-id]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.schoolId !== 'sword_cultivator') {
        const school = cultivationSchools.find((entry) => entry.id === button.dataset.schoolId);
        showGameToast(`${school?.name || 'Phái này'} đang phát triển.`, 'locked');
        return;
      }
      playerSchoolId = button.dataset.schoolId;
      renderStartScreen();
      updateStartScreenAvailability();
    });
  });

  updateStartScreenAvailability();
}

function updateStartScreenAvailability() {
  const hasName = Boolean(sanitizePlayerName(startPlayerNameInput?.value));
  const hasSchool = playerSchoolId === 'sword_cultivator';
  if (enterGameButton) enterGameButton.disabled = !hasName || !hasSchool;
  if (startSchoolHint) {
    startSchoolHint.textContent = hasSchool
      ? `${getPlayerSchool().name}: ${getPlayerSchool().starterSkill?.name || 'Nhập môn'}`
      : 'Chọn một phái';
  }
}

function showStartScreen() {
  gameStarted = false;
  if (playerSchoolId !== 'sword_cultivator') playerSchoolId = 'sword_cultivator';
  startScreen?.classList.remove('is-hidden');
  if (startPlayerNameInput) startPlayerNameInput.value = playerName || defaultPlayerName;
  renderStartScreen();
}

function completeStartScreen() {
  if (!getPlayerSchool()) return;
  playerName = sanitizePlayerName(startPlayerNameInput.value);
  hasSetPlayerName = true;
  hasCompletedStartScreen = true;
  ensureActiveSkill();
  playerNameInput.value = playerName;
  startScreen?.classList.add('is-hidden');
  finishGameStart();
}

function setActiveTab(tabId) {
  Object.entries(tabButtons).forEach(([id, button]) => {
    button?.classList.toggle('is-active', id === tabId);
  });
  playerAvatarButton?.classList.toggle('is-active', tabId === 'profile');
  document.body.classList.toggle('profile-active', tabId === 'profile');
}

function animatePanelIn(panel) {
  if (!panel) return;
  panel.classList.remove('ui-panel-enter');
  void panel.offsetWidth;
  panel.classList.add('ui-panel-enter');
  window.setTimeout(() => panel.classList.remove('ui-panel-enter'), 360);
}

function resetViewScroll() {
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelectorAll('.app-scroll-area').forEach((element) => {
      element.scrollTop = 0;
      element.scrollLeft = 0;
    });
  });
}

function updateWanderEventOverlay() {
  const shouldShow = currentWanderEvent &&
    ['enemy', 'ambush'].includes(currentWanderEvent.type) &&
    battlePanel.classList.contains('is-hidden');

  if (!shouldShow) {
    hideWanderEventOverlay();
    return;
  }

  wanderEventOverlay.classList.remove('is-hidden');
  wanderEventOverlay.innerHTML = '<div class="wander-event-modal"></div>';
  const modal = wanderEventOverlay.querySelector('.wander-event-modal');

  if (currentWanderEvent.type === 'enemy') {
    renderWanderEnemyOverlay(modal, currentWanderEvent);
    return;
  }

  if (currentWanderEvent.type === 'ambush') {
    renderWanderAmbushOverlay(modal, currentWanderEvent);
    return;
  }

  hideWanderEventOverlay();
}

function hideWanderEventOverlay() {
  wanderEventOverlay.classList.add('is-hidden');
  wanderEventOverlay.innerHTML = '';
}

function renderWanderEnemyOverlay(container, event) {
  const stage = getWanderEventStage(event);
  if (!stage) {
    hideWanderEventOverlay();
    return;
  }

  const preview = createStageEnemy(stage);
  const fleeChance = getFleeChance(stage);
  container.innerHTML = `
    <span><i class="activity-icon icon-activity-encounter" aria-hidden="true"></i>Gặp đối thủ</span>
    <strong>${stage.enemyData.name}</strong>
    <em>${getEnemyRankLabel(stage.enemyData, stage.enemyRankLevel)} | ${stage.realmText} | ${getCombatStyleLabel(stage.enemyData)} | ${stage.enemyData.skillName}</em>
    <small>Lực chiến ${formatGameNumber(getCombatPower(preview))} | Chạy thoát ${toPercent(fleeChance)}</small>
    <small class="enemy-equipment-preview">Trang bị: ${getEnemyEquipmentText(stage)}</small>
    <div class="wander-actions">
      <button type="button" class="breakthrough compact"><i class="item-icon icon-item-sword" aria-hidden="true"></i>Chiến đấu</button>
      <button type="button" class="secondary compact"><i class="unique-icon icon-unique-flee" aria-hidden="true"></i>Chạy</button>
    </div>
  `;
  const [fightButton, fleeButton] = container.querySelectorAll('button');
  fightButton.addEventListener('click', () => {
    hideWanderEventOverlay();
    startStageBattle(stage);
  });
  fleeButton.addEventListener('click', () => {
    hideWanderEventOverlay();
    fleeWanderEnemy(stage);
  });
}

function renderWanderAmbushOverlay(container, event) {
  const stage = event.stage;
  if (!stage) {
    hideWanderEventOverlay();
    return;
  }

  const preview = createStageEnemy(stage);
  const fleeChance = getFleeChance(stage);
  container.innerHTML = `
    <span><i class="activity-icon icon-activity-ambush" aria-hidden="true"></i>Bị phục kích</span>
    <strong>${stage.enemyData.name}</strong>
    <em>${event.lootResult?.message || 'Cơ duyên vừa lấy phát ra dị động.'}</em>
    <small>${getEnemyRankLabel(stage.enemyData, stage.enemyRankLevel)} | ${stage.realmText} | ${getCombatStyleLabel(stage.enemyData)} | Lực chiến ${formatGameNumber(getCombatPower(preview))} | Chạy thoát ${toPercent(fleeChance)}</small>
    <small class="enemy-equipment-preview">Trang bị: ${getEnemyEquipmentText(stage)}</small>
    <div class="wander-actions">
      <button type="button" class="breakthrough compact"><i class="item-icon icon-item-sword" aria-hidden="true"></i>Chiến đấu</button>
      <button type="button" class="secondary compact"><i class="unique-icon icon-unique-flee" aria-hidden="true"></i>Chạy</button>
    </div>
  `;
  const [fightButton, fleeButton] = container.querySelectorAll('button');
  fightButton.addEventListener('click', () => {
    hideWanderEventOverlay();
    startStageBattle(stage);
  });
  fleeButton.addEventListener('click', () => {
    hideWanderEventOverlay();
    fleeWanderEnemy(stage);
  });
}

function hideFeaturePanels() {
  inventoryPanel?.classList.add('is-hidden');
  enhancementPanel?.classList.add('is-hidden');
  resourceDungeonPanel?.classList.add('is-hidden');
  trialTowerPanel?.classList.add('is-hidden');
  changeLogPanel?.classList.add('is-hidden');
  devPanel?.classList.add('is-hidden');
  questPanel?.classList.add('is-hidden');
}

function prepareFeatureView(panel, tabId, renderFunction) {
  if (busy) return;
  hideFeatureAccessNotice();
  document.body.classList.remove('battle-active');
  hideBattleResultOverlay();
  hideShopItemDetail();
  hideInventoryItemDetail();
  hideFeaturePanels();
  mapPanel.classList.add('is-hidden');
  trainingPanel.classList.add('is-hidden');
  stageDetailPanel.classList.add('is-hidden');
  battlePanel.classList.add('is-hidden');
  profilePanel.classList.add('is-hidden');
  equipmentPanel.classList.add('is-hidden');
  shopPanel.classList.add('is-hidden');
  panel.classList.remove('is-hidden');
  animatePanelIn(panel);
  renderFunction();
  setSubtitle('');
  setTurnLabel('');
  setActiveTab(tabId);
  resetViewScroll();
  updateWanderEventOverlay();
  saveGame();
}

function showEnhancement() {
  const requiredTier = Math.max(1, Number(progressionFeatures.enhancement.entryRequiredTier) || 15);
  if (!canAccessEnhancement()) {
    showLockedFeatureNotice('Cường hóa', `Cần đạt tu vi ${getTierRealmText(requiredTier)} để mở`);
    return;
  }
  prepareFeatureView(enhancementPanel, 'enhancement', renderEnhancement);
}

function showResourceDungeons() {
  const requiredTier = Math.max(1, Number(progressionFeatures.resourceDungeonEntryRequiredTier) || 12);
  if (!canAccessResourceDungeons()) {
    showLockedFeatureNotice('Phụ bản', `Cần đạt tu vi ${getTierRealmText(requiredTier)} để mở`);
    return;
  }
  prepareFeatureView(resourceDungeonPanel, 'resourceDungeon', renderResourceDungeons);
}

function showTrialTower() {
  const requiredTier = Math.max(1, Number(trialTowerData.entryRequiredTier) || 10);
  if (!canEnterTrialTower()) {
    showLockedFeatureNotice('Tháp thí luyện', `Cần đạt tu vi ${getTierRealmText(requiredTier)} để mở`);
    return;
  }
  prepareFeatureView(trialTowerPanel, 'trialTower', renderTrialTower);
}

function showChangeLog() {
  prepareFeatureView(changeLogPanel, 'changeLog', renderChangeLog);
}

function showDevMode() {
  if (busy) return;
  devMode = true;
  playerSpiritStones = 10000000;
  playerFoundation = 1000000;
  playerComprehension = 10000;
  syncPlayerResourceCaps();
  updateNotificationBadges();
  showGameToast('Đã kích hoạt chế độ Dev.', 'success');
  prepareFeatureView(devPanel, 'dev', renderDevMode);
}

function showQuests() {
  prepareFeatureView(questPanel, 'quests', renderQuests);
}

function renderDevMode() {
  $('devModeStatus').textContent = devMode ? 'Đã kích hoạt' : 'Chưa kích hoạt';
  $('devSpiritStonesText').textContent = formatGameNumber(playerSpiritStones);
  $('devFoundationText').textContent = formatGameNumber(playerFoundation);
  $('devComprehensionText').textContent = formatGameNumber(playerComprehension);
  $('devModeMessage').textContent = devMode
    ? 'Đã cộng tài nguyên Dev; các điều kiện mở khóa vẫn giữ nguyên.'
    : 'Bấm tab Dev để kích hoạt.';
}

function getCombinedQuestMilestones(quest) {
  return Array.isArray(quest?.objective?.milestones) ? quest.objective.milestones : [];
}

function getCombinedQuestInstanceId(quest, milestone) {
  return `${quest.id}:${milestone.id || `${milestone.kind || 'step'}-${milestone.target}`}`;
}

function isCombinedQuestMilestoneClaimed(quest, milestone) {
  if (claimedQuestIds.has(getCombinedQuestInstanceId(quest, milestone))) return true;
  if (milestone.kind === 'minor' && claimedQuestIds.has(`cultivation-milestones:${milestone.target}`)) return true;
  if (milestone.kind === 'major' && claimedQuestIds.has(`major-realm-milestones:${milestone.target}`)) return true;
  return false;
}

function getNextCombinedQuestMilestone(quest) {
  return getCombinedQuestMilestones(quest).find((milestone) => !isCombinedQuestMilestoneClaimed(quest, milestone)) || null;
}

function getCombinedQuestMetric(milestone) {
  return milestone?.kind === 'major' ? playerMajorRealmIndex : getPlayerCultivationTier();
}

function getCombinedQuestProgress(quest) {
  const milestone = getNextCombinedQuestMilestone(quest);
  if (!milestone) return { current: 0, target: null, instanceId: null, finished: true, milestone: null };
  const target = Math.max(1, Math.floor(Number(milestone.target) || 1));
  return {
    current: Math.min(target, Math.max(0, Math.floor(Number(getCombinedQuestMetric(milestone)) || 0))),
    target,
    instanceId: getCombinedQuestInstanceId(quest, milestone),
    finished: false,
    milestone,
  };
}

function getQuestProgress(quest) {
  const objective = quest?.objective || {};
  if (objective.type === 'combinedMilestones') return getCombinedQuestProgress(quest);
  const target = getQuestTarget(quest);
  const current = getQuestMetric(quest);
  if (target === null) return { current, target: null, instanceId: null, finished: true };
  const normalizedTarget = Math.max(1, Math.floor(Number(target) || 1));
  return {
    current: Math.min(normalizedTarget, Math.max(0, Math.floor(Number(current) || 0))),
    target: normalizedTarget,
    instanceId: getQuestInstanceId(quest, normalizedTarget),
    finished: false,
  };
}

function getQuestMetric(quest) {
  const objective = quest?.objective || {};
  dailyQuestProgress = normalizeDailyQuestProgress(dailyQuestProgress);
  if (objective.type === 'cultivationTier') return getPlayerCultivationTier();
  if (objective.type === 'majorRealm') return playerMajorRealmIndex;
  if (objective.type === 'learnedSkills') return learnedSkillIds.length;
  if (objective.type === 'skillLevel') return Math.max(0, ...learnedSkillIds.map((skillId) => getSkillLevel(skillId)));
  if (objective.type === 'equippedItems') return Object.values(equippedItems).filter(Boolean).length;
  if (objective.type === 'equippedRarityCount') return equipmentEquipCounts[objective.rarityKey] || 0;
  if (objective.type === 'completedStages') return completedStages.size;
  if (objective.type === 'wanderWins') return wanderWinCount;
  if (objective.type === 'wanderRewards') return wanderRewardCount;
  if (objective.type === 'trialTowerFloor') return trialTowerHighestCleared;
  if (objective.type === 'trialTowerWins') return trialTowerWinCount;
  if (objective.type === 'dailyWanderWins') return dailyQuestProgress.wanderWins;
  if (objective.type === 'dailyWanderRewards') return dailyQuestProgress.wanderRewards;
  if (objective.type === 'dailyTrialTowerWins') return dailyQuestProgress.trialTowerWins;
  return 0;
}

function getQuestInstanceId(quest, target) {
  if (quest?.category === 'daily') {
    dailyQuestProgress = normalizeDailyQuestProgress(dailyQuestProgress);
    return `${quest.id}:${dailyQuestProgress.date}`;
  }
  return Array.isArray(quest?.objective?.milestones)
    || quest?.objective?.type === 'majorRealm'
    ? `${quest.id}:${target}`
    : quest.id;
}

function getQuestTarget(quest) {
  const objective = quest?.objective || {};
  if (objective.type === 'majorRealm') return playerMajorRealmIndex + 1;
  if (!Array.isArray(objective.milestones) || objective.milestones.length === 0) {
    return Math.max(1, Math.floor(Number(objective.target) || 1));
  }

  const milestones = objective.milestones
    .map((milestone) => Math.max(1, Math.floor(Number(milestone) || 0)))
    .filter(Boolean);
  const nextMilestone = milestones.find((milestone) => !claimedQuestIds.has(getQuestInstanceId(quest, milestone)));
  if (nextMilestone) return nextMilestone;
  if (objective.repeatable !== true) return null;

  const last = milestones[milestones.length - 1];
  const previous = milestones[milestones.length - 2] || 0;
  const step = Math.max(1, Math.floor(Number(objective.repeatStep) || last - previous || 1));
  const claimedCount = milestones.filter((milestone) => claimedQuestIds.has(getQuestInstanceId(quest, milestone))).length;
  return last + step * Math.max(0, claimedCount - milestones.length + 1);
}

function isQuestReady(quest) {
  if (!quest) return false;
  const progress = getQuestProgress(quest);
  return !progress.finished
    && !claimedQuestIds.has(progress.instanceId)
    && progress.current >= progress.target;
}

function getQuestDescription(quest, progress) {
  const objective = quest?.objective || {};
  if (objective.type === 'combinedMilestones') {
    const milestone = progress?.milestone;
    if (milestone?.kind === 'major') {
      const fromRealm = majorRealmNames[Math.max(0, milestone.target - 1)] || 'đại cảnh giới hiện tại';
      const toRealm = majorRealmNames[milestone.target] || 'đại cảnh giới tiếp theo';
      return `Đột phá ${fromRealm} → ${toRealm}.`;
    }
    return `Đạt tu vi ${getTierRealmText(milestone?.target || 1)}.`;
  }
  if (objective.type === 'cultivationTier') {
    return `Đạt ${getTierRealmText(progress.target)}.`;
  }
  if (objective.type === 'majorRealm') {
    const targetRealm = majorRealmNames[Math.min(progress.target, majorRealmNames.length - 1)] || 'đại cảnh giới tiếp theo';
    return `Tăng cảnh giới lên ${targetRealm}.`;
  }
  return String(quest.description || '').replaceAll('{target}', progress.target ?? '');
}

function formatQuestReward(reward = {}) {
  const parts = [];
  if (Number(reward.cultivation) > 0) parts.push(`<i class="stat-icon icon-stat-cultivation" aria-hidden="true"></i>Tu vi +${formatGameNumber(reward.cultivation)}`);
  if (Number(reward.spiritStones) > 0) parts.push(`<i class="item-icon icon-item-spirit-stone" aria-hidden="true"></i>Linh thạch +${formatGameNumber(reward.spiritStones)}`);
  if (Number(reward.enhancementStones) > 0) parts.push(`<i class="item-icon icon-item-enhancement-stone" aria-hidden="true"></i>Đá cường hóa +${formatGameNumber(reward.enhancementStones)}`);
  if (Number(reward.skillBooks) > 0) parts.push(`<i class="item-icon icon-item-skill-book" aria-hidden="true"></i>Sách skill +${formatGameNumber(reward.skillBooks)}`);
  if (Number(reward.foundation) > 0) parts.push(`<i class="stat-icon icon-stat-gem" aria-hidden="true"></i>Căn cơ +${formatGameNumber(reward.foundation)}`);
  if (Number(reward.comprehension) > 0) parts.push(`<i class="unique-icon icon-unique-comprehension" aria-hidden="true"></i>Ngộ tính +${formatGameNumber(reward.comprehension)}`);
  return parts.join(' | ') || 'Phần thưởng đang cập nhật';
}

function getQuestClaimCount(quest) {
  const prefix = `${quest?.id || ''}:`;
  return [...claimedQuestIds].filter((instanceId) => instanceId === quest?.id || String(instanceId).startsWith(prefix)).length;
}

function getQuestReward(quest) {
  if (quest?.objective?.type === 'combinedMilestones') {
    return { ...(getCombinedQuestProgress(quest).milestone?.reward || {}) };
  }
  const reward = { ...(quest?.reward || {}) };
  if (!['main', 'realm'].includes(quest?.category)) return reward;
  const growthCount = getQuestClaimCount(quest);
  if (growthCount <= 0) return reward;
  Object.entries(reward).forEach(([key, value]) => {
    const baseValue = Number(value);
    if (Number.isFinite(baseValue) && baseValue > 0) {
      reward[key] = Math.round(baseValue * (questRewardGrowthMultiplier ** growthCount));
    }
  });
  return reward;
}

function renderQuests() {
  if (temporarilyDisabledQuestCategories.has(questCategory)) questCategory = 'main';
  const visibleQuests = questData.quests.filter((quest) => (quest.category || 'side') === questCategory);
  const readyCount = visibleQuests.filter(isQuestReady).length;
  $('questTitle').innerHTML = `<i class="game-icon icon-scroll" aria-hidden="true"></i>${questData.title || 'Nhiệm vụ'}`;
  $('questProgressText').textContent = `${readyCount} nhiệm vụ sẵn sàng`;
  questCategoryFilters?.querySelectorAll('[data-quest-category]').forEach((button) => {
    const active = button.dataset.questCategory === questCategory;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  $('questList').innerHTML = visibleQuests.map((quest) => {
    const progress = getQuestProgress(quest);
    const reward = getQuestReward(quest);
    const claimed = progress.finished || claimedQuestIds.has(progress.instanceId);
    const ready = isQuestReady(quest);
    const percent = progress.finished ? 100 : Math.round((progress.current / progress.target) * 100);
    const description = getQuestDescription(quest, progress);
    const questIcon = progress.milestone?.kind === 'major'
      ? 'icon-item-quest-check'
      : quest.category === 'daily'
      ? 'icon-item-daily-calendar'
      : quest.category === 'side'
      ? 'icon-item-side-pouch'
      : 'icon-item-quest-target';
    const objectiveLabel = quest.objective?.type === 'combinedMilestones'
      ? ''
      : progress.milestone?.label || quest.objective?.label || 'Mục tiêu';
    return `
      <article class="quest-entry${claimed ? ' claimed' : ''}${ready ? ' ready' : ''}">
        <div class="quest-entry-heading">
          <div><strong><i class="item-icon ${questIcon}" aria-hidden="true"></i>${quest.title}</strong>${objectiveLabel ? `<span>${objectiveLabel}</span>` : ''}</div>
          <em>${progress.finished ? 'Đã đủ mốc' : claimed ? 'Đã nhận' : `${progress.current}/${progress.target}`}</em>
        </div>
        <p>${description}</p>
        <div class="quest-progress-bar"><i style="width:${percent}%"></i></div>
        <small>Thưởng: ${formatQuestReward(reward)}</small>
        <button type="button" class="${ready ? 'breakthrough' : 'secondary'} compact" ${ready ? '' : 'disabled'} onclick="claimQuest('${quest.id}')">
          ${progress.finished ? 'Đã hoàn tất' : claimed ? 'Đã nhận' : ready ? 'Nhận thưởng' : 'Đang tiến hành'}
        </button>
      </article>
    `;
  }).join('');
  $('questMessage').textContent = readyCount > 0
    ? `Có ${readyCount} nhiệm vụ đã hoàn thành.`
    : 'Hoàn thành mục tiêu để mở khóa phần thưởng.';
  updateNotificationBadges();
}

function setNotificationBadge(element, count) {
  if (!element) return;
  const safeCount = Math.max(0, Math.floor(Number(count) || 0));
  element.hidden = safeCount <= 0;
  element.textContent = '';
}

function updateNotificationBadges() {
  const readyQuestCount = questData.quests
    .filter((quest) => !temporarilyDisabledQuestCategories.has(quest.category || 'side'))
    .filter(isQuestReady).length;
  const wanderReadyToStart = canEnterDungeon() && !busy && !currentWanderEvent;
  const wanderChestFull = wanderChestCapacity > 0 && wanderChestRewards.length >= wanderChestCapacity;
  const pendingWanderCount = Number(wanderReadyToStart || wanderChestFull);
  const trainingCount = Number(dantianCultivation > 0) + Number(canBreakthrough());
  const resourceSweepCount = (progressionFeatures.resourceDungeons || [])
    .filter((dungeon) => getResourceDungeonHighestFloor(dungeon.id) > 0)
    .length * Number(getRemainingResourceAttempts() > 0);
  setNotificationBadge(questBadge, readyQuestCount);
  setNotificationBadge(dungeonBadge, pendingWanderCount);
  setNotificationBadge(trainingBadge, trainingCount);
  setNotificationBadge(resourceDungeonBadge, resourceSweepCount);
  setNotificationBadge(equipmentBadge, Number(hasQuickEquipCandidate()));
  updateFeatureAvailability();
}

function canAccessEnhancement() {
  return getPlayerCultivationTier() >= Math.max(1, Number(progressionFeatures.enhancement.entryRequiredTier) || 15);
}

function canAccessResourceDungeons() {
  return getPlayerCultivationTier() >= Math.max(1, Number(progressionFeatures.resourceDungeonEntryRequiredTier) || 12);
}

function updateFeatureAvailability() {
  const featureStates = [
    [enhancementButton, canAccessEnhancement(), Math.max(1, Number(progressionFeatures.enhancement.entryRequiredTier) || 15)],
    [resourceDungeonButton, canAccessResourceDungeons(), Math.max(1, Number(progressionFeatures.resourceDungeonEntryRequiredTier) || 12)],
    [trialTowerButton, canEnterTrialTower(), Math.max(1, Number(trialTowerData.entryRequiredTier) || 10)],
  ];
  featureStates.forEach(([button, unlocked, requiredTier]) => {
    if (!button) return;
    button.disabled = false;
    button.classList.toggle('locked-tab', !unlocked);
    button.setAttribute('aria-disabled', String(!unlocked));
    button.title = unlocked ? '' : `Mở từ ${getTierRealmText(requiredTier)}`;
  });
}

function claimQuest(questId) {
  if (busy) return;
  const quest = questData.quests.find((item) => item.id === questId);
  if (temporarilyDisabledQuestCategories.has(quest?.category || 'side')) return;
  const progress = quest ? getQuestProgress(quest) : null;
  if (!quest || !progress || progress.finished || !isQuestReady(quest)) return;
  const reward = getQuestReward(quest);
  claimedQuestIds.add(progress.instanceId);
  addPlayerCultivation(reward.cultivation);
  playerSpiritStones += Math.max(0, Math.floor(Number(reward.spiritStones) || 0));
  enhancementStones += Math.max(0, Math.floor(Number(reward.enhancementStones) || 0));
  const skillBookReward = Math.max(0, Math.floor(Number(reward.skillBooks) || 0));
  const skillBookTarget = skillTrainingId || learnedSkillIds[0];
  if (skillBookReward > 0 && skillBookTarget) {
    skillBooks[skillBookTarget] = getSkillBookCount(skillBookTarget) + skillBookReward;
  }
  playerFoundation += Math.max(0, Math.floor(Number(reward.foundation) || 0));
  playerComprehension += Math.max(0, Math.floor(Number(reward.comprehension) || 0));
  $('questMessage').innerHTML = `Đã nhận: ${formatQuestReward(reward)}.`;
  showGameToast(`Đã nhận thưởng nhiệm vụ: ${quest.title}.`, 'success');
  renderQuests();
  renderCultivation();
  renderProfile();
  renderShop();
  renderEnhancement();
  saveGame();
}

function renderChangeLog() {
  $('changeLogTitle').innerHTML = `<i class="activity-icon icon-activity-history" aria-hidden="true"></i>${changeLogData.title || 'Lịch sử cập nhật'}`;
  const entries = changeLogData.entries.map((entry, index) => ({ ...entry, sortIndex: index })).sort((left, right) => {
    const dateOrder = String(right.date || '').localeCompare(String(left.date || ''));
    return dateOrder || left.sortIndex - right.sortIndex;
  });
  const categories = ['all', 'Tính năng', 'Sửa lỗi', 'Giao diện'];
  if (!categories.includes(changeLogCategory)) changeLogCategory = 'all';
  if (changeLogCategoryFilters) {
    const iconByCategory = {
      all: 'icon-activity-history',
      'Giao diện': 'icon-activity-guide',
      'Sửa lỗi': 'icon-activity-locked',
      'Tính năng': 'icon-activity-skill',
      'Tu luyện': 'icon-activity-lotus',
      'Trang bị': 'icon-unique-equipment',
      'Trải nghiệm': 'icon-activity-fortune',
      'Hướng dẫn': 'icon-activity-guide',
      'Kiểm thử': 'icon-activity-encounter',
    };
    changeLogCategoryFilters.innerHTML = categories.map((category) => {
      const isActive = category === changeLogCategory;
      const label = category === 'all' ? 'Tất cả' : category;
      const iconClass = iconByCategory[category] || 'icon-activity-history';
      const iconType = iconClass === 'icon-unique-equipment' ? 'unique-icon' : 'activity-icon';
      return `<button type="button" class="secondary compact${isActive ? ' is-active' : ''}" data-change-log-category="${category}" role="tab" aria-selected="${isActive}"><i class="${iconType} ${iconClass}" aria-hidden="true"></i>${label}</button>`;
    }).join('');
  }
  const visibleEntries = changeLogCategory === 'all'
    ? entries
    : entries.filter((entry) => (entry.category || 'Cập nhật') === changeLogCategory);
  $('changeLogList').innerHTML = visibleEntries.map((entry) => `
    <article class="change-log-entry">
      <div class="change-log-heading">
        <div><strong><i class="activity-icon icon-activity-history" aria-hidden="true"></i>${entry.title}</strong><span>${entry.category || 'Cập nhật'}</span></div>
        <time>${entry.date || ''}</time>
      </div>
      <p>${entry.summary || ''}</p>
      ${Array.isArray(entry.details) && entry.details.length ? `
        <div class="change-log-actions">
          <button type="button" class="secondary compact change-log-toggle" data-change-log-toggle aria-expanded="false">
            <i class="game-icon icon-scroll" aria-hidden="true"></i><span>Xem chi tiết</span>
          </button>
        </div>
        <div class="change-log-details" hidden>
          <ul>${entry.details.map((detail) => `<li>${detail}</li>`).join('')}</ul>
        </div>
      ` : ''}
    </article>
  `).join('');
  $('changeLogList').querySelectorAll('[data-change-log-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const entry = button.closest('.change-log-entry');
      const details = entry?.querySelector('.change-log-details');
      if (!details) return;
      const expanded = details.hidden;
      details.hidden = !expanded;
      button.setAttribute('aria-expanded', String(expanded));
      button.querySelector('span').textContent = expanded ? 'Ẩn chi tiết' : 'Xem chi tiết';
      entry.classList.toggle('is-expanded', expanded);
    });
  });
}

function getTrialTowerFloor(floorNumber) {
  return trialTowerData.floors.find((floor) => Number(floor.floor) === Number(floorNumber)) || null;
}

function createTrialTowerStage(floorNumber) {
  const floor = getTrialTowerFloor(floorNumber);
  if (!floor) return null;
  const guardian = floor.guardian || {};
  const rankLevel = Math.max(1, Number(floor.rankLevel) || 1);
  const towerRarityByRank = ['common', 'common', 'uncommon', 'rare', 'epic', 'legendary'];
  const equipment = equipmentSlots.map((slot) => [
    slot.id,
    towerRarityByRank[Math.min(rankLevel, towerRarityByRank.length - 1)],
  ]);
  return {
    id: `trial-tower-${floor.floor}`,
    title: floor.title || `Tầng ${floor.floor}`,
    enemyLevel: Number(floor.realmLevel) || 1,
    enemyTier: (Number(floor.realmMajorIndex) || 0) * playerMaxMinorLevel + (Number(floor.realmLevel) || 1),
    enemyMajorRealmIndex: Number(floor.realmMajorIndex) || 0,
    realmText: floor.realmText || getTierRealmText((Number(floor.realmMajorIndex) || 0) * playerMaxMinorLevel + (Number(floor.realmLevel) || 1)),
    enemyRankLevel: rankLevel,
    enemyData: {
      id: guardian.id || `trial-guardian-${floor.floor}`,
      name: guardian.name || `Thủ vệ tầng ${floor.floor}`,
      type: guardian.type || 'Tu sĩ',
      rank: Number(floor.rankLevel) >= 4 ? 'king' : Number(floor.rankLevel) === 3 ? 'leader' : 'elite',
      skillName: guardian.skillName || 'Võ kỹ thủ hộ',
      description: guardian.description || '',
      canEquip: true,
      equipment,
      statMultiplier: guardian.statMultiplier || {},
      combatStyle: guardian.combatStyle || inferEnemyCombatStyle(guardian),
    },
    isTrialTower: true,
    trialFloor: Number(floor.floor),
    trialReward: floor.reward || {},
  };
}

function canEnterTrialTower() {
  return getPlayerCultivationTier() >= Math.max(1, Number(trialTowerData.entryRequiredTier) || 10);
}

function formatTrialTowerReward(reward = {}) {
  const parts = [];
  if (Number(reward.cultivation) > 0) parts.push(`<i class="stat-icon icon-stat-cultivation" aria-hidden="true"></i>Tu vi +${formatGameNumber(reward.cultivation)}`);
  if (Number(reward.spiritStones) > 0) parts.push(`<i class="item-icon icon-item-spirit-stone" aria-hidden="true"></i>Linh thạch +${formatGameNumber(reward.spiritStones)}`);
  if (Number(reward.enhancementStones) > 0) parts.push(`<i class="item-icon icon-item-enhancement-stone" aria-hidden="true"></i>Đá cường hóa +${formatGameNumber(reward.enhancementStones)}`);
  if (Number(reward.equipmentChestTier) > 0) parts.push(`<i class="activity-icon icon-activity-chest" aria-hidden="true"></i>Rương trang bị cấp ${formatGameNumber(reward.equipmentChestTier)}`);
  return parts.join(' | ') || 'Phần thưởng đang cập nhật';
}

function renderTrialTower() {
  const entryTier = Math.max(1, Number(trialTowerData.entryRequiredTier) || 10);
  const entered = canEnterTrialTower();
  const totalFloors = trialTowerData.floors.length;
  trialTowerHighestCleared = clamp(Number(trialTowerHighestCleared) || 0, 0, totalFloors);
  $('trialTowerEntryText').textContent = entered
    ? `${trialTowerData.entryText || `Cần ${getTierRealmText(entryTier)}`} · Thắng mở tầng kế`
    : `Chưa đủ điều kiện · Cần ${getTierRealmText(entryTier)}`;
  $('trialTowerProgressText').textContent = `Đã vượt ${trialTowerHighestCleared}/${totalFloors}`;
  $('trialTowerList').innerHTML = trialTowerData.floors.map((floor) => {
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
        <em>${rankText} | ${floor.realmText} | ${getCombatStyleLabel(stage?.enemyData)} | Lực chiến ${formatGameNumber(preview ? getCombatPower(preview) : 0)}</em>
        <small>${formatTrialTowerReward(floor.reward)}</small>
        <button type="button" class="${unlocked ? 'breakthrough' : 'secondary'} compact" ${unlocked ? '' : 'disabled'} data-trial-floor="${floorNumber}">
          ${cleared ? 'Đã vượt' : !entered ? 'Chưa mở' : locked ? 'Chưa mở' : 'Khiêu chiến'}
        </button>
      </div>
    `;
  }).join('');
  $('trialTowerMessage').textContent = entered
    ? 'Mỗi tầng chỉ nhận thưởng một lần. Hãy chuẩn bị kỹ trước khi khiêu chiến.'
    : `Tháp thí luyện mở từ ${getTierRealmText(entryTier)}.`;
}

function startTrialTowerBattle(floorNumber) {
  if (busy || !canEnterTrialTower()) return;
  if (Number(floorNumber) !== trialTowerHighestCleared + 1) return;
  const stage = createTrialTowerStage(floorNumber);
  if (!stage) return;
  startStageBattle(stage);
}

function showMap() {
  document.body.classList.remove('battle-active');
  hideBattleResultOverlay();
  hideShopItemDetail();
  hideInventoryItemDetail();
  window.clearTimeout(timer);
  busy = false;
  battleOver = false;
  startButton.disabled = false;
  startButton.textContent = 'Tiếp tục ngao du';
  selectedStage = null;
  battleResult.classList.add('is-hidden');
  battlePanel.classList.add('is-hidden');
  trainingPanel.classList.add('is-hidden');
  stageDetailPanel.classList.add('is-hidden');
  profilePanel.classList.add('is-hidden');
  equipmentPanel.classList.add('is-hidden');
  shopPanel.classList.add('is-hidden');
  hideFeaturePanels();
  mapPanel.classList.remove('is-hidden');
  animatePanelIn(mapPanel);
  setSubtitle('');
  setTurnLabel('');
  setActiveTab('map');
  resetViewScroll();
  renderStageMap();
  renderCultivation();
  updateWanderEventOverlay();
  saveGame();
}

function showTraining() {
  if (busy) return;
  document.body.classList.remove('battle-active');
  hideBattleResultOverlay();
  hideInventoryItemDetail();
  renderCultivation();
  mapPanel.classList.add('is-hidden');
  stageDetailPanel.classList.add('is-hidden');
  battlePanel.classList.add('is-hidden');
  profilePanel.classList.add('is-hidden');
  equipmentPanel.classList.add('is-hidden');
  shopPanel.classList.add('is-hidden');
  hideFeaturePanels();
  trainingPanel.classList.remove('is-hidden');
  animatePanelIn(trainingPanel);
  setSubtitle('');
  setTurnLabel('');
  setActiveTab('training');
  resetViewScroll();
  updateWanderEventOverlay();
  saveGame();
}

function showTrainingMessage(message) {
  showTraining();
  setSubtitle(message);
}

function showProfile() {
  if (busy) return;
  document.body.classList.remove('battle-active');
  hideBattleResultOverlay();
  hideInventoryItemDetail();
  renderProfile();
  mapPanel.classList.add('is-hidden');
  trainingPanel.classList.add('is-hidden');
  stageDetailPanel.classList.add('is-hidden');
  battlePanel.classList.add('is-hidden');
  equipmentPanel.classList.add('is-hidden');
  shopPanel.classList.add('is-hidden');
  hideFeaturePanels();
  profilePanel.classList.remove('is-hidden');
  animatePanelIn(profilePanel);
  setSubtitle('');
  setTurnLabel('');
  setActiveTab('profile');
  resetViewScroll();
  updateWanderEventOverlay();
  saveGame();
}

function showEquipment() {
  if (busy) return;
  document.body.classList.remove('battle-active');
  hideBattleResultOverlay();
  hideInventoryItemDetail();
  renderEquipment();
  mapPanel.classList.add('is-hidden');
  trainingPanel.classList.add('is-hidden');
  stageDetailPanel.classList.add('is-hidden');
  battlePanel.classList.add('is-hidden');
  profilePanel.classList.add('is-hidden');
  shopPanel.classList.add('is-hidden');
  hideFeaturePanels();
  equipmentPanel.classList.remove('is-hidden');
  animatePanelIn(equipmentPanel);
  setSubtitle('');
  setTurnLabel('');
  setActiveTab('equipment');
  resetViewScroll();
  updateWanderEventOverlay();
  saveGame();
}

function showInventory() {
  prepareFeatureView(inventoryPanel, 'inventory', renderInventory);
}

function showShop() {
  if (busy) return;
  document.body.classList.remove('battle-active');
  hideBattleResultOverlay();
  hideShopItemDetail();
  hideInventoryItemDetail();
  renderShop();
  mapPanel.classList.add('is-hidden');
  trainingPanel.classList.add('is-hidden');
  stageDetailPanel.classList.add('is-hidden');
  battlePanel.classList.add('is-hidden');
  profilePanel.classList.add('is-hidden');
  equipmentPanel.classList.add('is-hidden');
  hideFeaturePanels();
  shopPanel.classList.remove('is-hidden');
  animatePanelIn(shopPanel);
  setSubtitle('');
  setTurnLabel('');
  setActiveTab('shop');
  resetViewScroll();
  updateWanderEventOverlay();
  saveGame();
}

breakthroughButton.addEventListener('click', breakthrough);

startButton.addEventListener('click', () => {
  if (busy) return;

  if (battleOver) {
    continueBattle();
    return;
  }

  startBattle();
});

loadAllResources()
  .then(startGame)
  .catch((error) => {
    console.error(error);
    finishResourceLoading('Không tải được tài nguyên.');
    setSubtitle('Không tải được dữ liệu tài nguyên.');
    stageGrid.innerHTML = '<div class="inventory-empty"><i class="activity-icon icon-activity-locked" aria-hidden="true"></i><span>Lỗi file tài nguyên, kiểm tra lại các file dữ liệu trong assets/Resources/Data.</span></div>';
  });

function updateResourceLoading(progress, status) {
  loadingTargetProgress = Math.max(1, Math.min(100, Math.round(progress)));
  if (status) resourceLoadingStatus.textContent = status;
  if (!loadingAnimationFrame) loadingAnimationFrame = window.requestAnimationFrame(animateResourceLoading);
}

function animateResourceLoading() {
  const distance = loadingTargetProgress - loadingShownProgress;
  if (Math.abs(distance) > 0.05) {
    const step = Math.min(Math.abs(distance), Math.max(0.18, Math.abs(distance) * 0.12));
    loadingShownProgress += step * Math.sign(distance);
  } else {
    loadingShownProgress = loadingTargetProgress;
  }
  const displayed = Math.max(1, Math.min(100, Math.round(loadingShownProgress)));
  resourceLoadingBar.style.width = `${displayed}%`;
  resourceLoadingPercent.textContent = `${displayed}%`;
  resourceProgress.setAttribute('aria-valuenow', String(displayed));
  if (loadingShownProgress !== loadingTargetProgress) {
    loadingAnimationFrame = window.requestAnimationFrame(animateResourceLoading);
    return;
  }
  loadingAnimationFrame = 0;
  if (loadingComplete && !loadingHideScheduled) {
    loadingHideScheduled = true;
    window.setTimeout(() => resourceLoader.classList.add('is-hidden'), 380);
  }
}

function finishResourceLoading(status = 'Sẵn sàng nhập đạo.') {
  loadingComplete = true;
  updateResourceLoading(100, status);
  window.setTimeout(() => {
    if (!loadingComplete || resourceLoader.classList.contains('is-hidden')) return;
    loadingTargetProgress = 100;
    loadingShownProgress = 100;
    resourceLoadingBar.style.width = '100%';
    resourceLoadingPercent.textContent = '100%';
    resourceProgress.setAttribute('aria-valuenow', '100');
    loadingHideScheduled = true;
    resourceLoader.classList.add('is-hidden');
  }, 1800);
}

function preloadImage(path) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = path;
  });
}

async function preloadVisualAssets() {
  await Promise.all(criticalAssetPaths.map((path) => preloadImage(path)));
}

async function loadAllResources() {
  updateResourceLoading(1, 'Chuẩn bị linh mạch...');
  await loadDemoConfig();
  updateResourceLoading(16, 'Đã tải cấu hình game.');

  const resourceTasks = [
    ['trang bị', loadEquipmentData],
    ['bản đồ và quái', loadEnemyData],
    ['cảnh giới', loadCultivationRealms],
    ['tính năng tu luyện', loadProgressionFeatures],
    ['hệ phái', loadCultivationSchools],
    ['skill', loadCultivationSkills],
    ['chỉ số chiến đấu', loadCombatStats],
    ['lối đánh', loadCombatStyles],
    ['Tháp thí luyện', loadTrialTowerData],
    ['ghi chú', loadChangeLogData],
    ['nhiệm vụ', loadQuestData],
  ];
  let completedTasks = 0;
  await Promise.all(resourceTasks.map(async ([name, task]) => {
    await task();
    completedTasks += 1;
    updateResourceLoading(
      16 + (completedTasks / resourceTasks.length) * 66,
      `Đang tải ${name}... ${completedTasks}/${resourceTasks.length}`,
    );
  }));

  updateResourceLoading(86, 'Đang tải hình ảnh giao diện...');
  await preloadVisualAssets();
  updateResourceLoading(98, 'Đang hoàn thiện giao diện...');
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  finishResourceLoading();
}

async function loadDemoConfig() {
  const responses = await Promise.all([
    fetch(gameConfigPath),
    fetch(shopItemsPath),
    fetch(starterDataPath),
  ]);
  if (responses.some((response) => !response.ok)) {
    throw new Error('Demo config resources could not be loaded.');
  }
  const [loadedGameConfig, shopConfig, starterConfig] = await Promise.all(responses.map((response) => response.json()));
  gameConfig = loadedGameConfig;
  if (!gameConfig.dungeonConfigs || !gameConfig.gameplay || !gameConfig.persistence
    || !gameConfig.runtime || !Array.isArray(shopConfig.shopItems)
    || !Array.isArray(starterConfig.starterInventory) || !starterConfig.initialPlayer) {
    throw new Error('Demo config resources are incomplete.');
  }
  dailyFarmLimit = Number(gameConfig.dailyFarmLimit);
  maxTurns = Number(gameConfig.gameplay.maxTurns);
  turnInterval = Number(gameConfig.gameplay.turnInterval);
  playerMaxMinorLevel = Number(gameConfig.gameplay.playerMaxMinorLevel);
  wanderEventDelay = Number(gameConfig.gameplay.wanderEventDelay);
  rewardMultiplier = Math.max(0, Number(gameConfig.gameplay.rewardMultiplier ?? 1));
  spiritStoneToCultivationRatio = Math.max(0, Number(gameConfig.gameplay.spiritStoneToCultivationRatio ?? 0.5));
  questRewardGrowthMultiplier = Math.max(1, Number(gameConfig.gameplay.questRewardGrowthMultiplier ?? 1.3));
  wanderChestCapacity = Number(gameConfig.runtime.wanderChestCapacity);
  offlineCapSeconds = Number(gameConfig.runtime.offlineCapSeconds);
  saveKey = gameConfig.persistence.saveKey;
  legacySaveKeys = gameConfig.persistence.legacySaveKeys || [];
  ascensionPermitItemId = gameConfig.runtime.ascensionPermitItemId;
  dungeonConfigs = gameConfig.dungeonConfigs;
  dungeonList = Object.values(dungeonConfigs);
  wanderMapDefaults = gameConfig.wanderMapDefaults || {};
  shopItems = shopConfig.shopItems;
  starterInventory = starterConfig.starterInventory;
  initialState = starterConfig.initialState || {};
  defaultPlayerName = starterConfig.initialPlayer.name;
  playerName = defaultPlayerName;
  playerMajorRealmIndex = Math.max(0, Number(starterConfig.initialPlayer.majorRealmIndex) || 0);
  playerLevel = Math.max(1, Number(starterConfig.initialPlayer.level) || 1);
  playerCultivation = Math.max(0, Number(starterConfig.initialPlayer.cultivation) || 0);
  playerSpiritStones = Math.max(0, Number(starterConfig.initialPlayer.spiritStones));
  playerFoundation = Math.max(1, Number(starterConfig.initialPlayer.foundation));
  playerComprehension = 1;
  healthPotionCount = Math.max(0, Number(starterConfig.initialPlayer.healthPotions));
  manaPotionCount = Math.max(0, Number(starterConfig.initialPlayer.manaPotions));
  enhancementStones = Math.max(0, Number(starterConfig.initialPlayer.enhancementStones));
  currentDungeonId = initialState.dungeonId;
  currentWanderMapId = initialState.wanderMapId;
  activeSkillId = initialState.skillId;
  if (!shopItems.some((item) => item.id === ascensionPermitItemId)) {
    throw new Error('Demo config is missing the ascension permit item.');
  }
}

async function loadProgressionFeatures() {
  const response = await fetch(progressionFeaturesPath);
  if (!response.ok) throw new Error(`Cannot load progression features: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.skills) || !Array.isArray(data.resourceDungeons) || !data.enhancement) {
    throw new Error('Progression features data is incomplete.');
  }
  progressionFeatures = data;
}

async function loadCultivationSchools() {
  const response = await fetch(cultivationSchoolsPath);
  if (!response.ok) throw new Error(`Cannot load cultivation schools: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.schools) || data.schools.length === 0) {
    throw new Error('Cultivation schools data is incomplete.');
  }
  cultivationSchools = data.schools;
}

async function loadCultivationSkills() {
  const response = await fetch(cultivationSkillsPath);
  if (!response.ok) throw new Error(`Cannot load cultivation skills: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.skills) || data.skills.length === 0 || !data.upgrade || !Array.isArray(data.grades)) {
    throw new Error('Cultivation skills data is incomplete.');
  }
  cultivationSkillData = data;
  cultivationSkills = data.skills;
}

async function loadCombatStats() {
  const response = await fetch(combatStatsPath);
  if (!response.ok) throw new Error(`Cannot load combat stats: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.stats) || data.stats.length === 0) {
    throw new Error('Combat stats data is incomplete.');
  }
  combatStatDefinitions = data.stats;
}

async function loadCombatStyles() {
  const response = await fetch(combatStylesPath);
  if (!response.ok) throw new Error(`Cannot load combat styles: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.styles) || data.styles.length === 0) {
    throw new Error('Combat styles data is incomplete.');
  }
  combatStyles = Object.fromEntries(data.styles.map((style) => [style.id, style]));
}

async function loadTrialTowerData() {
  const response = await fetch(trialTowerPath);
  if (!response.ok) throw new Error(`Cannot load trial tower data: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.floors) || data.floors.length !== 10 || !Number.isFinite(Number(data.entryRequiredTier))) {
    throw new Error('Trial tower data is incomplete.');
  }
  trialTowerData = data;
}

async function loadChangeLogData() {
  const response = await fetch(changeLogPath, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Cannot load change log data: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.entries)) throw new Error('Change log data is incomplete.');
  changeLogData = data;
}

async function loadQuestData() {
  const response = await fetch(questDataPath);
  if (!response.ok) throw new Error(`Cannot load quest data: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.quests) || data.quests.length === 0) {
    throw new Error('Quest data is incomplete.');
  }
  questData = data;
}

async function loadEquipmentData() {
  const response = await fetch(equipmentPath);
  if (!response.ok) throw new Error(`Cannot load equipment data: ${response.status}`);
  const data = await response.json();
  equipmentSlots = data.slots;
  rarityData = data.rarities;
  equipmentQualityOrder = data.qualityOrder || ['common', 'uncommon', 'rare'];
  equipmentTemplates = data.templates;
  specialLineData = data.specialLines;
  equipmentMajorRealmRarityProfiles = Array.isArray(data.majorRealmRarityProfiles)
    ? data.majorRealmRarityProfiles
    : [];
  equipmentStatGeneration = { ...equipmentStatGeneration, ...(data.statGeneration || {}) };
  validateEquipmentData();
}

async function loadCultivationRealms() {
  const response = await fetch(cultivationRealmsPath);
  if (!response.ok) throw new Error(`Cannot load cultivation realms: ${response.status}`);
  const data = await response.json();
  if (!data.baseStats || !Array.isArray(data.realms) || data.realms.length < 3) {
    throw new Error('Cultivation realms data is incomplete.');
  }
  baseStats = data.baseStats;
  minorRealmNames = data.minorRealmNames;
  majorRealmNames = data.realms.map((realm) => realm.name);
  perLevel = data.realms[0].perMinorLevel;
  majorRealmBreakthroughs = data.realms.map((realm) => realm.majorBreakthrough || {});
  majorRealmMinorGrowths = data.realms.map((realm) => realm.perMinorLevel || perLevel);
  cultivationProgression = data.realms;
  data.realms.forEach((realm, index) => {
    const isFinalRealm = index === data.realms.length - 1;
    const hasValidMajorRequirement = Number.isFinite(realm.majorBreakthroughRequirement)
      || (isFinalRealm && realm.majorBreakthroughRequirement === null);
    if (!Number.isFinite(realm.minorBaseRequirement)
      || !Number.isFinite(realm.minorStepRequirement)
      || !hasValidMajorRequirement) {
      throw new Error(`Cultivation realms are invalid for realm ${realm.id}.`);
    }
  });
}

function validateEquipmentData() {
  if (!equipmentSlots.length) throw new Error('Equipment data missing slots.');
  equipmentSlots.forEach((slot) => {
    if (!equipmentTemplates[slot.id]) throw new Error(`Equipment template missing: ${slot.id}`);
  });
  if (equipmentQualityOrder.length !== 10) throw new Error('Equipment data must contain 10 quality levels.');
  equipmentQualityOrder.forEach((rarityKey) => {
    if (!rarityData[rarityKey]) throw new Error(`Equipment rarity missing: ${rarityKey}`);
  });
  if (equipmentMajorRealmRarityProfiles.length < 26) {
    throw new Error('Equipment data must contain rarity profiles for 26 major realms.');
  }
  const profileIds = new Set();
  equipmentMajorRealmRarityProfiles.forEach((profile) => {
    const realmId = Number(profile?.majorRealmId);
    const weights = profile?.weights;
    if (!Number.isInteger(realmId) || realmId < 1 || realmId > 26 || profileIds.has(realmId)) {
      throw new Error(`Invalid equipment rarity profile for major realm ${realmId}.`);
    }
    if (!Array.isArray(weights) || weights.length !== equipmentQualityOrder.length
      || weights.some((weight) => !Number.isFinite(Number(weight)) || Number(weight) < 0)
      || Math.round(weights.reduce((sum, weight) => sum + Number(weight), 0)) !== 100) {
      throw new Error(`Equipment rarity profile ${realmId} must contain 10 weights totaling 100.`);
    }
    profileIds.add(realmId);
  });
}

async function loadEnemyData() {
  const responses = await Promise.all([fetch(enemyResourcePath), fetch(wanderMapsPath)]);
  if (responses.some((response) => !response.ok)) throw new Error('Cannot load enemy or wander map data.');
  const [enemyData, mapData] = await Promise.all(responses.map((response) => response.json()));
  const data = { ...mapData, ...enemyData };
  validateEnemyData(data);

  stageEnemyData = data.enemyPools.map(normalizeEnemyData);
  enemyRankData = data.rankStats || {};
  wanderMaps = Object.fromEntries(data.maps.map((map) => {
    const defaults = wanderMapDefaults[map.id] || {};
    const [minEnemyTier, maxEnemyTier] = normalizeTierRange(map.tierRange, [1, playerMaxMinorLevel]);
    const equipmentChestTier = Math.max(
      1,
      Math.floor(Number(map.equipmentChestTier ?? defaults.equipmentChestTier) || 1),
    );
    const defaultEquipmentMin = ((equipmentChestTier - 1) * 5) + 1;
    const defaultEquipmentMax = equipmentChestTier * 5;
    return [map.id, {
      ...defaults,
      id: map.id,
      name: map.name,
      description: map.description,
      minEnemyTier,
      maxEnemyTier,
      enemyPoolIds: map.enemyPoolIds || [],
      lootTypes: defaults.lootTypes || ['cultivation', 'spiritStone', 'chest'],
      rewardSettings: map.rewardSettings || defaults.rewardSettings || {},
      equipmentChestTier,
      equipmentLevelRange: normalizeEquipmentLevelRange(
        map.equipmentLevelRange || defaults.equipmentLevelRange,
        [defaultEquipmentMin, defaultEquipmentMax],
      ),
      enemyChance: defaults.enemyChance ?? 0.45,
      firstEnemyChance: defaults.firstEnemyChance ?? defaults.enemyChance ?? 0.45,
    }];
  }));
  wanderMapList = Object.values(wanderMaps);
  stages = stageEnemyData.slice(0, 10).map((enemyData, index) => {
    const level = index + 1;
    return {
      id: level,
      enemyLevel: level,
      title: `Tầng ${level}`,
      realmText: `Thối Thể cảnh ${minorRealmNames[level - 1]}`,
      enemyData,
    };
  });
}

function validateEnemyData(data) {
  if (!Array.isArray(data.maps) || data.maps.length === 0) throw new Error('Enemy data missing maps.');
  if (!Array.isArray(data.enemyPools) || data.enemyPools.length === 0) throw new Error('Enemy data missing enemyPools.');
  data.maps.forEach((map) => {
    if (!map.id || !map.name || !Array.isArray(map.tierRange)) throw new Error(`Invalid enemy map: ${map.id || 'unknown'}`);
  });
  data.enemyPools.forEach((enemy) => {
    if (!enemy.id || !enemy.name || !enemy.skillName || !Array.isArray(enemy.tierRange)) {
      throw new Error(`Invalid enemy: ${enemy.id || enemy.name || 'unknown'}`);
    }
  });
}

function normalizeEnemyData(enemy) {
  return {
    id: enemy.id,
    name: enemy.name,
    type: enemy.type || 'Tu sĩ',
    rank: enemy.rank || 'normal',
    skillName: enemy.skillName,
    description: enemy.description || '',
    tierRange: normalizeTierRange(enemy.tierRange, [1, playerMaxMinorLevel]),
    canEquip: true,
    equipment: Array.isArray(enemy.equipment) ? enemy.equipment : [],
    statMultiplier: enemy.statMultiplier || {},
    combatStyle: enemy.combatStyle || inferEnemyCombatStyle(enemy),
    weight: Math.max(1, Number(enemy.weight) || 1),
  };
}

function inferEnemyCombatStyle(enemy = {}) {
  const multipliers = enemy.statMultiplier || {};
  if (Number(multipliers.blockRate) >= 1.15 || Number(multipliers.defense) >= 1.2) return 'defense';
  if (Number(multipliers.critRate) >= 1.2) return 'crit';
  if (Number(multipliers.maxHp) >= 1.2) return 'heal';
  return 'counter';
}

function normalizeTierRange(range, fallback) {
  const min = Math.max(1, Math.floor(Number(range?.[0]) || fallback[0]));
  const max = Math.max(min, Math.floor(Number(range?.[1]) || fallback[1]));
  return [min, max];
}

function startGame() {
  clearLegacySaves();
  const loaded = loadSavedGame();
  newCharacterPendingGuide = !loaded;
  if (!loaded) {
    equippedItems = Object.fromEntries(equipmentSlots.map((slot) => [slot.id, null]));
    inventory = starterInventory.map((item) => createEquipmentItem(item.slotId, item.level, item.rarityKey, {
      name: item.name,
      specialLines: item.specialLines || [],
    }));
  }
  if (!loaded || !hasCompletedStartScreen || !getPlayerSchool()) {
    showStartScreen();
    return;
  }
  finishGameStart();
}

function finishGameStart() {
  if (gameStarted) return;
  const shouldShowOnboarding = newCharacterPendingGuide;
  newCharacterPendingGuide = false;
  gameStarted = true;
  startScreen?.classList.add('is-hidden');
  enforceEquipmentInventoryLimit();
  playerNameInput.value = playerName;
  updateNameEditorVisibility();
  renderStageMap();
  resetBattle();
  render();
  showMap();
  autoWanderAfterRecovery = false;
  saveGame();
  if (shouldShowOnboarding) showOnboardingGuide();
  const refreshResources = () => {
    if (!gameStarted) {
      resourceRegenTimer = 0;
      return;
    }
    regenerateResources();
    resourceRegenTimer = window.setTimeout(refreshResources, 1000);
  };
  resourceRegenTimer = window.setTimeout(refreshResources, 1000);
}

function clearLegacySaves() {
  legacySaveKeys.forEach((key) => window.localStorage.removeItem(key));
}

function openResetConfirm() {
  if (resettingGameData) return;
  resetConfirmModal?.classList.remove('is-hidden');
  confirmResetButton?.focus();
}

function closeResetConfirm() {
  resetConfirmModal?.classList.add('is-hidden');
}

function resetGameData() {
  resettingGameData = true;
  closeResetConfirm();
  clearWanderTimer();
  window.clearTimeout(autoWanderRecoveryTimer);
  autoWanderRecoveryTimer = 0;
  autoWanderAfterRecovery = false;
  window.clearTimeout(timer);
  window.clearTimeout(resourceRegenTimer);
  window.localStorage.removeItem(saveKey);
  clearLegacySaves();
  window.location.reload();
}

function loadSavedGame() {
  try {
    const raw = window.localStorage.getItem(saveKey);
    if (!raw) return false;

    const data = JSON.parse(raw);
    playerName = sanitizePlayerName(data.playerName);
    if (playerName === 'Đạo hữu vô danh') playerName = defaultPlayerName;
    hasSetPlayerName = Boolean(data.hasSetPlayerName) || playerName !== defaultPlayerName;
    playerSchoolId = cultivationSchools.some((school) => school.id === data.playerSchoolId)
      ? data.playerSchoolId
      : '';
    hasCompletedStartScreen = Boolean(data.hasCompletedStartScreen) && Boolean(playerSchoolId);
    playerMajorRealmIndex = clamp(Number(data.playerMajorRealmIndex) || 0, 0, majorRealmNames.length - 1);
    playerLevel = clamp(Number(data.playerLevel) || 1, 1, playerMaxMinorLevel);
    playerCultivation = Math.max(0, Number(data.playerCultivation) || 0);
    playerSpiritStones = Math.max(0, Number(data.playerSpiritStones) || 0);
    playerFoundation = Math.max(1, Number(data.playerFoundation) || 1);
    playerComprehension = Math.max(1, Math.floor(Number(data.playerComprehension) || 1));
    devMode = Boolean(data.devMode);
    foundationFindCounts = normalizeFoundationFindCounts(data.foundationFindCounts);
    wanderChestRewards = normalizeWanderChestRewards(data.wanderChestRewards);
    wanderWinCount = Math.max(0, Math.floor(Number(data.wanderWinCount) || 0));
    wanderRewardCount = Math.max(0, Math.floor(Number(data.wanderRewardCount) || 0));
    trialTowerWinCount = Math.max(0, Math.floor(Number(data.trialTowerWinCount) || 0));
    equipmentEquipCounts = data.equipmentEquipCounts && typeof data.equipmentEquipCounts === 'object'
      ? Object.fromEntries(Object.entries(data.equipmentEquipCounts).map(([key, value]) => [key, Math.max(0, Math.floor(Number(value) || 0))]))
      : {};
    dailyQuestProgress = normalizeDailyQuestProgress(data.dailyQuestProgress);
    foundationPillPurchases = normalizeFoundationPillPurchases(data.foundationPillPurchases);
    cultivationPillPurchases = normalizeCultivationPillPurchases(data.cultivationPillPurchases);
    potionPurchaseCounts = normalizeCultivationPillPurchases(data.potionPurchaseCounts);
    ascensionPillPurchases = normalizeCultivationPillPurchases(data.ascensionPillPurchases);
    cultivationSpeedBonus = Math.max(0, Number(data.cultivationSpeedBonus) || 0);
    playerCurrentHp = data.playerCurrentHp ?? null;
    playerCurrentMana = data.playerCurrentMana ?? null;
    healthPotionCount = Math.max(0, Number(data.healthPotionCount) || 0);
    manaPotionCount = Math.max(0, Number(data.manaPotionCount) || 0);
    enhancementStones = Math.max(0, Number(data.enhancementStones) || Number(data.enhancementMaterials) || 0);
    skillBooks = data.skillBooks && typeof data.skillBooks === 'object' ? data.skillBooks : {};
    shopInventoryCounts = normalizeShopInventoryCounts(data.shopInventoryCounts);
    skillLevels = data.skillLevels && typeof data.skillLevels === 'object' ? data.skillLevels : {};
    skillPractice = data.skillPractice && typeof data.skillPractice === 'object' ? data.skillPractice : {};
    learnedSkillIds = Array.isArray(data.learnedSkillIds) ? data.learnedSkillIds : [];
    equippedSkillIds = Array.isArray(data.equippedSkillIds)
      ? data.equippedSkillIds
      : data.activeSkillId ? [data.activeSkillId] : [];
    dantianCultivation = Math.max(0, Number(data.dantianCultivation) || Number(data.offlineCultivationChest) || 0);
    dantianCultivationSeconds = Math.max(0, Number(data.dantianCultivationSeconds) || Number(data.offlineCultivationChestSeconds) || 0);
    completedStages = new Set((data.completedStages || []).filter((id) => stages.some((stage) => stage.id === id)));
    currentDungeonId = dungeonConfigs[data.currentDungeonId] ? data.currentDungeonId : initialState.dungeonId;
    currentWanderMapId = wanderMaps[data.currentWanderMapId] ? data.currentWanderMapId : initialState.wanderMapId;
    autoWanderAfterRecovery = Boolean(data.autoWanderAfterRecovery);
    trialTowerHighestCleared = clamp(Number(data.trialTowerHighestCleared) || 0, 0, trialTowerData.floors.length);
    claimedQuestIds = new Set((Array.isArray(data.claimedQuestIds) ? data.claimedQuestIds : [])
      .filter((id) => questData.quests.some((quest) => id === quest.id || id.startsWith(`${quest.id}:`))));
    dailyDungeonAttempts = normalizeDailyAttempts(data.dailyDungeonAttempts);
    dailyResourceAttempts = normalizeDailyResourceAttempts(data.dailyResourceAttempts);
    resourceDungeonProgress = normalizeResourceDungeonProgress(data.resourceDungeonProgress);
    activeSkillId = data.activeSkillId || initialState.skillId;
    skillTrainingId = data.skillTrainingManual ? (data.skillTrainingId || '') : '';
    ensureActiveSkill();
    hasMajorAscensionPermit = false;
    if (Boolean(data.hasMajorAscensionPermit) && hasNextMajorRealm() && !devMode
      && getShopInventoryCount('majorAscensionPermit') <= 0) {
      addShopInventoryItem('majorAscensionPermit');
    }
    clampDantianCultivation();

    equippedItems = Object.fromEntries(equipmentSlots.map((slot) => [slot.id, null]));
    Object.entries(data.equippedItems || {}).forEach(([slotId, item]) => {
      if (equipmentTemplates[slotId] && item) equippedItems[slotId] = normalizeSavedItem(item);
    });
    inventory = (data.inventory || []).map(normalizeSavedItem).filter(Boolean);
    equipmentChestInventory = normalizeEquipmentChestInventory(data.equipmentChestInventory);
    equipmentChestIdSeed = Math.max(1, Number(data.equipmentChestIdSeed) || 1, ...equipmentChestInventory.map((item) => item.idNumber + 1));

    const allItemIds = [
      ...inventory.map((item) => item.id),
      ...Object.values(equippedItems).filter(Boolean).map((item) => item.id),
    ];
    equipmentIdSeed = Math.max(1, Number(data.equipmentIdSeed) || 1, ...allItemIds.map((id) => id + 1));
    if (!isWanderMapUnlocked(getCurrentWanderMap())) currentWanderMapId = getBestUnlockedWanderMap().id;
    currentStage = stages.find((stage) => stage.id === data.currentStageId) || getCurrentDungeonStage() || stages[0];
    capCultivationAtMajorGate();
    syncPlayerResourceCaps();
    applyOfflineProgress(data);
    return true;
  } catch (error) {
    console.warn('Cannot load save data.', error);
    window.localStorage.removeItem(saveKey);
    return false;
  }
}

function normalizeSavedItem(item) {
  if (!item || !equipmentTemplates[item.slotId] || !rarityData[item.rarityKey]) return null;
  const itemLevel = Number(item.level) || 1;
  return {
    id: Number(item.id) || equipmentIdSeed++,
    slotId: item.slotId,
    name: item.name || pickRandom(getEquipmentNamePool(item.slotId, itemLevel)),
    rarityKey: item.rarityKey,
    level: clamp(itemLevel, 1, maxEquipmentLevel),
    requiredLevel: clamp(Number(item.requiredLevel) || itemLevel, 1, playerMaxMinorLevel),
    requiredTier: Math.max(1, Number(item.requiredTier) || getEquipmentRequiredTier(item.rarityKey, itemLevel)),
    sourceChestTier: Math.max(0, Number(item.sourceChestTier) || 0),
    enhancementLevel: Math.min(
      getEquipmentEnhancementQualityMax(item),
      Math.max(0, Number(item.enhancementLevel) || 0),
    ),
    stats: item.stats
      ? Object.fromEntries(Object.entries(item.stats).filter(([stat]) => stat !== 'blockReduction'))
      : createEquipmentStats(item.slotId, Number(item.level) || 1, item.rarityKey),
    specialLines: Array.isArray(item.specialLines)
      ? item.specialLines.filter((line) => line?.id !== 'victoryRecovery')
      : [],
  };
}

function normalizeEquipmentChestInventory(items) {
  if (!Array.isArray(items)) return [];
  const normalized = items
    .map((item) => {
      if (!item || item.type !== 'equipmentChest') return null;
      const namedTier = Number(String(item.name || '').match(/(\d+)/)?.[1]) || 0;
      const legacyMap = wanderMaps[item.mapId];
      const legacyMapIndex = legacyMap ? wanderMapList.findIndex((map) => map.id === legacyMap.id) : -1;
      const storedTier = Math.max(
        1,
        Math.floor(Number(namedTier) || Number(item.chestTier) || Number(item.tier) || legacyMap?.equipmentChestTier || 1),
      );
      const majorRealmIndex = clamp(
        Number.isInteger(Number(item.majorRealmIndex))
          ? Number(item.majorRealmIndex)
          : legacyMapIndex >= 0
          ? legacyMapIndex
          : Math.max(0, storedTier - 1),
        0,
        25,
      );
      const levelRange = getEquipmentLevelRange({ chestTier: storedTier });
      const rarityProfile = getEquipmentRarityProfile({ majorRealmIndex });
      const idNumber = Math.max(1, Number(item.idNumber) || equipmentChestIdSeed++);
      return {
        id: item.id || `equipmentChest-${idNumber}`,
        idNumber,
        type: 'equipmentChest',
        name: getEquipmentChestName({ chestTier: storedTier }),
        majorRealmIndex,
        tier: storedTier,
        chestTier: storedTier,
        levelRange,
        rarityProfile,
        count: Math.max(1, Math.floor(Number(item.count) || 1)),
      };
    })
    .filter(Boolean);

  return mergeEquipmentChestStacks(normalized);
}

function mergeEquipmentChestStacks(chests = []) {
  const merged = new Map();
  chests.forEach((chest) => {
    const existing = merged.get(chest.tier);
    if (existing) {
      existing.count += chest.count;
      return;
    }
    merged.set(chest.tier, chest);
  });
  return [...merged.values()];
}

function saveGame() {
  if (!equipmentSlots.length) return;

  ensureDailyAttempts();
  clampDantianCultivation();
  equipmentChestInventory = mergeEquipmentChestStacks(equipmentChestInventory);
  const data = {
    playerName,
    hasSetPlayerName,
    playerSchoolId,
    hasCompletedStartScreen,
    playerMajorRealmIndex,
    playerLevel,
    playerCultivation,
    playerSpiritStones,
    playerFoundation,
    playerComprehension,
    devMode,
    foundationFindCounts,
    wanderChestRewards,
    wanderWinCount,
    wanderRewardCount,
    trialTowerWinCount,
    equipmentEquipCounts,
    dailyQuestProgress: normalizeDailyQuestProgress(dailyQuestProgress),
    foundationPillPurchases,
    cultivationPillPurchases,
    potionPurchaseCounts,
    ascensionPillPurchases,
    cultivationSpeedBonus,
    playerCurrentHp,
    playerCurrentMana,
    healthPotionCount,
    manaPotionCount,
    enhancementStones,
    skillBooks,
    shopInventoryCounts,
    skillLevels,
    skillPractice,
    learnedSkillIds,
    equippedSkillIds,
    dantianCultivation,
    dantianCultivationSeconds,
    lastActiveAt: Date.now(),
    trainingWasActive: true,
    skillTrainingManual: Boolean(skillTrainingId),
    completedStages: [...completedStages],
    currentStageId: Number.isInteger(currentStage?.id) ? currentStage.id : getCurrentDungeonStage()?.id || 1,
    currentDungeonId,
    currentWanderMapId,
    autoWanderAfterRecovery,
    trialTowerHighestCleared,
    claimedQuestIds: [...claimedQuestIds],
    dailyDungeonAttempts,
    dailyResourceAttempts,
    resourceDungeonProgress,
    activeSkillId,
    hasMajorAscensionPermit: false,
    equipmentIdSeed,
    equipmentChestIdSeed,
    equippedItems,
    inventory,
    equipmentChestInventory,
  };
  window.localStorage.setItem(saveKey, JSON.stringify(data));
}

function applyOfflineProgress(data) {
  if (!data) return;
  const savedAt = Number(data.lastActiveAt);
  if (!Number.isFinite(savedAt)) return;

  const elapsedSeconds = Math.min(
    offlineCapSeconds,
    Math.max(0, Math.floor((Date.now() - savedAt) / 1000)),
  );
  if (elapsedSeconds < 60) return;

  dantianCultivation += Math.max(0, Math.round(getTrainingCultivationRate() * elapsedSeconds));
  if (data.skillTrainingManual) gainSkillPractice(elapsedSeconds);
  dantianCultivationSeconds += elapsedSeconds;
  clampDantianCultivation();
}

function sanitizePlayerName(name) {
  return String(name || '').trim().slice(0, 16) || defaultPlayerName;
}

function getDailyKey() {
  return new Date().toLocaleDateString('en-CA');
}

function normalizeDailyQuestProgress(progress = {}) {
  const today = getDailyKey();
  if (progress.date !== today) {
    return { date: today, wanderWins: 0, wanderRewards: 0, trialTowerWins: 0 };
  }
  return {
    date: today,
    wanderWins: Math.max(0, Math.floor(Number(progress.wanderWins) || 0)),
    wanderRewards: Math.max(0, Math.floor(Number(progress.wanderRewards) || 0)),
    trialTowerWins: Math.max(0, Math.floor(Number(progress.trialTowerWins) || 0)),
  };
}

function normalizeDailyAttempts(attempts = {}) {
  const today = getDailyKey();
  if (attempts.date !== today) {
    return { date: today };
  }

  return { ...attempts, date: today };
}

function normalizeResourceDungeonProgress(progress = {}) {
  const source = progress && typeof progress === 'object' ? progress : {};
  return Object.fromEntries((progressionFeatures.resourceDungeons || []).map((dungeon) => [
    dungeon.id,
    clamp(
      Math.floor(Number(source[dungeon.id]) || 0),
      0,
      Math.max(1, Number(dungeon.totalFloors) || 30),
    ),
  ]));
}

function capCultivationAtMajorGate() {
  normalizeCultivationStorage();
  if (isMajorAscensionGate()) {
    playerCultivation = getCultivationRequiredForNextLevel();
  }
}

function ensureDailyAttempts() {
  dailyDungeonAttempts = normalizeDailyAttempts(dailyDungeonAttempts);
  dailyResourceAttempts = normalizeDailyResourceAttempts(dailyResourceAttempts);
}

function normalizeDailyResourceAttempts(attempts = {}) {
  const today = getDailyKey();
  if (attempts.date !== today) return { date: today, total: 0 };
  const legacyTotal = Object.entries(attempts)
    .filter(([key]) => key !== 'date' && key !== 'total')
    .reduce((sum, [, value]) => sum + Math.max(0, Math.floor(Number(value) || 0)), 0);
  return {
    date: today,
    total: clamp(Math.max(Number(attempts.total) || 0, legacyTotal), 0, dailyFarmLimit),
  };
}

function getRemainingResourceAttempts() {
  dailyResourceAttempts = normalizeDailyResourceAttempts(dailyResourceAttempts);
  return Math.max(0, dailyFarmLimit - dailyResourceAttempts.total);
}

function consumeResourceAttempt() {
  if (getRemainingResourceAttempts() <= 0) return false;
  dailyResourceAttempts.total += 1;
  return true;
}

function refundResourceAttempt() {
  dailyResourceAttempts = normalizeDailyResourceAttempts(dailyResourceAttempts);
  dailyResourceAttempts.total = Math.max(0, dailyResourceAttempts.total - 1);
  return true;
}

function getDungeonConfig(dungeonId = currentDungeonId) {
  return dungeonConfigs[dungeonId] || dungeonConfigs.main;
}

function getRemainingDungeonAttempts(dungeonId = currentDungeonId) {
  const config = getDungeonConfig(dungeonId);
  if (config.unlimited) return Infinity;
  ensureDailyAttempts();
  return Math.max(0, dailyFarmLimit - (dailyDungeonAttempts[dungeonId] || 0));
}

function consumeDungeonAttempt(dungeonId = currentDungeonId) {
  const config = getDungeonConfig(dungeonId);
  if (config.unlimited) return true;
  if (getRemainingDungeonAttempts(dungeonId) <= 0) return false;
  dailyDungeonAttempts[dungeonId] = (dailyDungeonAttempts[dungeonId] || 0) + 1;
  return true;
}

function canRunDungeon(dungeonId = currentDungeonId) {
  return getDungeonConfig(dungeonId).unlimited || getRemainingDungeonAttempts(dungeonId) > 0;
}

function createFighter(name, minorLevel, includeEquipment = false, majorRealmIndex = playerMajorRealmIndex) {
  const level = Math.max(1, Math.min(minorRealmNames.length, Math.floor(minorLevel)));
  const majorIndex = clamp(Number(majorRealmIndex) || 0, 0, majorRealmNames.length - 1);
  const progressionStats = getProgressionStats(majorIndex, level, includeEquipment ? playerSchoolId : '');
  const getGrowthStat = (stat) => progressionStats[stat] ?? baseStats[stat] ?? 0;
  const maxHp = getGrowthStat('maxHp');
  const maxMana = getGrowthStat('maxMana');

  const equippedSkills = includeEquipment ? getEquippedSkills().map(createSkillRuntime) : [];
  const selectedSkill = equippedSkills.find((skill) => skill.id === activeSkillId) || equippedSkills[0] || null;
  const fighter = {
    name,
    isPlayerFighter: includeEquipment && name === playerName,
    realm: majorRealmNames[majorIndex],
    level,
    minorRealm: minorRealmNames[level - 1],
    hp: maxHp,
    maxHp,
    mana: maxMana,
    maxMana,
    foundation: includeEquipment ? playerFoundation : 0,
    attack: getGrowthStat('attack'),
    defense: getGrowthStat('defense'),
    speed: getGrowthStat('speed'),
    accuracy: getGrowthStat('accuracy'),
    dodgeRate: getGrowthStat('dodgeRate'),
    blockRate: getGrowthStat('blockRate'),
    blockReduction: baseStats.blockReduction,
    critRate: baseStats.critRate,
    critDamage: baseStats.critDamage,
    armorPierce: baseStats.armorPierce,
    damageReduction: getGrowthStat('damageReduction'),
    lifeSteal: baseStats.lifeSteal,
    luck: baseStats.luck,
    spiritSense: baseStats.spiritSense,
    comprehension: includeEquipment ? playerComprehension : getGrowthStat('comprehension'),
    victoryRecovery: 0,
    spiritStoneBonus: 0,
    reflectDamage: 0,
    skillName: selectedSkill?.name || 'Tuyệt Ảnh Kiếm',
    skillCost: selectedSkill?.cost || 20,
    skillMultiplier: selectedSkill?.multiplier || 1.4,
    skillCooldown: selectedSkill?.cooldown || 2,
    skillCooldownRemaining: 2,
    skills: equippedSkills,
    battleBuffs: [],
  };

  if (includeEquipment) applyEquipmentStats(fighter);
  fighter.hp = fighter.maxHp;
  fighter.mana = fighter.maxMana;
  return fighter;
}

function getProgressionStats(majorIndex, level, schoolId = '') {
  const school = cultivationSchools.find((item) => item.id === schoolId);
  const stats = { ...baseStats, ...(school?.initialStats || {}) };
  const addGrowth = (growth, times) => {
    Object.entries(growth || {}).forEach(([stat, value]) => {
      stats[stat] = (stats[stat] || 0) + (Number(value) || 0) * times;
    });
  };
  const getCommonMinorGrowth = (realmIndex) => majorRealmMinorGrowths[realmIndex] || perLevel;
  const getMinorGrowth = (realmIndex) => school?.minorGrowthByRealm?.[realmIndex] || getCommonMinorGrowth(realmIndex);

  for (let realmIndex = 0; realmIndex < majorIndex; realmIndex += 1) {
    addGrowth(getMinorGrowth(realmIndex), playerMaxMinorLevel);
    addGrowth(majorRealmBreakthroughs[realmIndex + 1], 1);
    addGrowth(school?.majorBreakthroughGrowth, 1);
  }
  addGrowth(getMinorGrowth(majorIndex), Math.max(0, level - 1));
  return stats;
}

function resetBattle() {
  window.clearTimeout(timer);
  player = createFighter(playerName, playerLevel, true);
  syncPlayerResourceCaps();
  applyPersistentResourcesToPlayer(player);
  enemy = createStageEnemy(currentStage);
  busy = false;
  battleOver = false;
  lastBattleOutcome = null;
  turn = 0;
  logList.innerHTML = '';
  battleResult.classList.add('is-hidden');
  hideBattleResultOverlay();
  startButton.disabled = true;
  startButton.textContent = 'Đang đấu';
  startButton.classList.remove('is-hidden');
}

function renderDungeonModes() {
  ensureDailyAttempts();
  if (dungeonList.length <= 1) {
    dungeonModeGrid.innerHTML = '';
    dungeonAttemptText.classList.add('is-hidden');
    return;
  }

  dungeonModeGrid.innerHTML = dungeonList.map((dungeon) => {
    const active = dungeon.id === currentDungeonId;
    const remainText = dungeon.unlimited ? 'Không giới hạn' : `${getRemainingDungeonAttempts(dungeon.id)}/${dailyFarmLimit} lượt`;
    return `
      <button type="button" class="dungeon-mode ${active ? 'active' : ''}" onclick="setDungeonMode('${dungeon.id}')">
        <strong>${dungeon.name}</strong>
        <span>${remainText}</span>
      </button>
    `;
  }).join('');

  const config = getDungeonConfig();
  dungeonAttemptText.textContent = config.unlimited
    ? 'Ngao du không giới hạn lượt, đánh bại đối thủ để đi tiếp.'
    : `${config.name}: còn ${getRemainingDungeonAttempts(config.id)}/${dailyFarmLimit} lượt hôm nay.`;
}

function setDungeonMode(dungeonId) {
  if (busy || !dungeonConfigs[dungeonId]) return;
  currentDungeonId = dungeonId;
  selectedStage = null;
  mapPanel.classList.remove('is-hidden');
  stageDetailPanel.classList.add('is-hidden');
  renderStageMap();
  renderCultivation();
  saveGame();
}

function renderStageMap() {
  updateNotificationBadges();
  updateWanderEventOverlay();
  const config = getDungeonConfig();
  stageGrid.innerHTML = '';
  renderDungeonModes();
  const enoughHealth = canEnterDungeon();
  stageGrid.classList.toggle('main-dungeon-grid', config.unlimited);
  stageGrid.classList.toggle('farm-dungeon-grid', !config.unlimited);

  if (!config.unlimited) {
    renderFarmStageMap(config, enoughHealth);
    return;
  }

  renderWanderChestButton();

  if (!isWanderMapUnlocked(getCurrentWanderMap())) {
    currentWanderMapId = getBestUnlockedWanderMap().id;
    currentWanderEvent = null;
  }

  if (!currentStage?.isTrialTower && !currentStage?.isResourceDungeon) {
    currentStage = getRandomWanderEnemyStage(getCurrentWanderMap()) || currentStage || stages[0];
  }
  renderWanderMapSelector();
  if (!currentWanderEvent) {
    renderWanderStart(enoughHealth);
    return;
  }

  if (currentWanderEvent.type === 'traveling') {
    renderWanderTraveling(currentWanderEvent);
    return;
  }

  if (currentWanderEvent.type === 'enemy') {
    return;
  }

  if (currentWanderEvent.type === 'ambush') {
    return;
  }

  if (currentWanderEvent.type === 'result') {
    renderWanderResult(currentWanderEvent);
  }
}

function renderFarmStageMap(config, enoughHealth) {
  const availableStages = getFarmAvailableStages();
  if (!availableStages.length) {
    stageGrid.innerHTML = '<div class="inventory-empty"><i class="activity-icon icon-activity-locked" aria-hidden="true"></i><span>Chưa mở đường farm. Hãy thắng đối thủ đầu tiên khi ngao du trước.</span></div>';
    return;
  }

  stageGrid.innerHTML = '';
  availableStages.forEach((stage) => {
    const preview = createStageEnemy(stage);
    const remaining = getRemainingDungeonAttempts(config.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stage-card';
    button.classList.toggle('active', selectedStage?.id === stage.id);
    button.classList.toggle('exhausted', !enoughHealth || remaining <= 0);
    button.innerHTML = `
      <span>${stage.title}</span>
      <strong>${stage.enemyData.name}</strong>
      <em>${getEnemyRankLabel(stage.enemyData, stage.enemyRankLevel)} | ${stage.realmText} | ${stage.enemyData.skillName}</em>
      <small>Lực chiến ${formatGameNumber(getCombatPower(preview))} | ${config.description}</small>
      <b>${remaining <= 0 ? 'Hết lượt' : enoughHealth ? 'Chọn ải' : 'Sinh lực thấp'}</b>
    `;
    button.addEventListener('click', () => selectStage(stage));
    stageGrid.appendChild(button);
  });
}

function renderWanderMapSelector() {
  const lockedByEvent = Boolean(currentWanderEvent && currentWanderEvent.type !== 'result');
  const selector = document.createElement('div');
  selector.className = 'wander-map-list';
  selector.setAttribute('role', 'tablist');
  selector.setAttribute('aria-label', 'Chọn bản đồ ngao du');

  wanderMapList.forEach((map, index) => {
    const unlocked = isWanderMapUnlocked(map);
    const active = map.id === currentWanderMapId;
    const mapTitle = map.name.replace(/^Map \d+:\s*/, '');
    const mapIcon = getWanderMapIconClass(map.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `wander-map-card ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}`;
    button.disabled = lockedByEvent;
    button.classList.toggle('locked-tab', !unlocked);
    button.setAttribute('aria-disabled', String(!unlocked || lockedByEvent));
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(active));
    button.innerHTML = `
      <strong><i class="activity-icon ${mapIcon}" aria-hidden="true"></i>${mapTitle}</strong>
    `;
    button.title = unlocked ? map.name : `${map.name} - ${getWanderMapUnlockText(map)}`;
    button.addEventListener('click', () => setWanderMap(map.id));
    selector.appendChild(button);
  });

  stageGrid.appendChild(selector);
}

function renderWanderChestButton() {
  if (!wanderChestButton) return;
  const rewardCount = wanderChestRewards.length;
  const blockedByEvent = Boolean(currentWanderEvent && ['enemy', 'ambush'].includes(currentWanderEvent.type));
  const hasRewards = rewardCount > 0;
  wanderChestButton.disabled = busy || !hasRewards || blockedByEvent;
  wanderChestButton.classList.toggle('has-rewards', hasRewards);
  wanderChestButton.title = hasRewards
    ? `Rương Ngao du: ${rewardCount}/${wanderChestCapacity} phần thưởng`
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
      <em>${wanderChestRewards.length}/${wanderChestCapacity} phần thưởng đang chờ mở.</em>
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
    showLockedFeatureNotice(map.name, `Cần đạt tu vi ${getWanderMapUnlockText(map).replace(/^Cần\s+/i, '')} để mở`);
    return;
  }

  hideWanderEventOverlay();
  currentWanderMapId = map.id;
  currentWanderEvent = null;
  renderStageMap();
  saveGame();
}

function isWanderMapUnlocked(map) {
  if (!map) return false;
  const requiredTier = Number(map.requiredTier);
  if (Number.isFinite(requiredTier) && requiredTier > 0) {
    return getPlayerCultivationTier() >= requiredTier;
  }
  if (!Number.isInteger(map.requiredMajorRealmIndex)) return true;
  return playerMajorRealmIndex >= map.requiredMajorRealmIndex;
}

function getWanderMapUnlockText(map) {
  const requiredTier = Number(map?.requiredTier);
  if (Number.isFinite(requiredTier) && requiredTier > 0) return `Cần ${getTierRealmText(requiredTier)}`;
  if (!Number.isInteger(map?.requiredMajorRealmIndex)) return 'Đã mở';
  const realmName = majorRealmNames[map.requiredMajorRealmIndex] || 'đại cảnh giới tiếp theo';
  return `Cần ${realmName} cảnh trở lên`;
}

function getBestUnlockedWanderMap() {
  return [...wanderMapList]
    .reverse()
    .find((map) => isWanderMapUnlocked(map)) || wanderMaps.novice;
}

function renderWanderStart(enoughHealth) {
  const map = getCurrentWanderMap();
  const minTier = Math.max(1, Number(map.minEnemyTier) || 1);
  const maxTier = Math.max(minTier, Number(map.maxEnemyTier) || minTier);
  const chestTier = getEquipmentChestTier(map);
  const enemyRealmRange = `${getTierRealmText(minTier)} - ${getTierRealmText(maxTier)}`;
  const panel = document.createElement('section');
  panel.className = 'wander-info-panel';
  panel.innerHTML = `
    <div class="wander-info-heading">
      <strong><i class="activity-icon ${getWanderMapIconClass(map.id)}" aria-hidden="true"></i>${map.name}</strong>
    </div>
    <div class="wander-map-rules">
      <p><i class="activity-icon icon-activity-encounter" aria-hidden="true"></i>Kẻ thù trong ${map.name} có tu vi từ ${enemyRealmRange}.</p>
      <div class="wander-reward-list">
        <strong><i class="activity-icon icon-activity-fortune" aria-hidden="true"></i>Phần thưởng cơ duyên</strong>
        <span><i class="stat-icon icon-stat-cultivation" aria-hidden="true"></i>Tu vi</span>
        <span><i class="item-icon icon-item-spirit-stone" aria-hidden="true"></i>Linh thạch</span>
        <span><i class="activity-icon icon-activity-chest" aria-hidden="true"></i>Rương trang bị cấp ${chestTier}</span>
        <span><i class="item-icon icon-item-health-pill" aria-hidden="true"></i>Sinh Huyết Đan</span>
        <span><i class="item-icon icon-item-mana-flame" aria-hidden="true"></i>Tụ Linh Đan</span>
        <span><i class="item-icon icon-item-enhancement-stone" aria-hidden="true"></i>Đá cường hóa</span>
      </div>
    </div>
    <small>Sau ${Math.ceil(wanderEventDelay / 1000)} giây sẽ gặp cơ duyên hoặc kẻ địch.</small>
    <button class="${enoughHealth ? 'breakthrough' : 'secondary'}" type="button">
      <i class="activity-icon icon-activity-path" aria-hidden="true"></i>${enoughHealth ? 'Bắt đầu ngao du' : 'Đang trọng thương'}
    </button>
  `;
  const button = panel.querySelector('button');
  button.disabled = !enoughHealth;
  button.addEventListener('click', () => beginWander(false));
  stageGrid.appendChild(panel);
}

function beginWander() {
  if (busy) return;
  if (!canEnterDungeon()) {
    renderCultivation();
    showTrainingMessage('Đang bị trọng thương, không thể ngao du tiếp.');
    showGameToast('Đang bị trọng thương, không thể ngao du tiếp.', 'error');
    return;
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
  const stage = getRandomWanderEnemyStage(map);
  const enemyChance = completedStages.size === 0 ? map.firstEnemyChance : map.enemyChance;
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
      : `Phần thưởng mới bị bỏ qua vì Rương Ngao du đã đủ ${wanderChestCapacity} phần.`,
    detail: stored ? 'Mở Rương Ngao du để nhận phần thưởng.' : 'Hãy mở rương trước khi tiếp tục ngao du.',
    autoContinue: stored && wanderChestRewards.length < wanderChestCapacity,
  };
}

function createWanderReward(map = getCurrentWanderMap()) {
  const type = pickWanderRewardType();
  if (type === 'cultivation') return createWanderCultivationChoice(map);
  if (type === 'spiritStone') return createWanderSpiritStoneChoice(map);
  if (['healthPotion', 'manaPotion', 'enhancementStone'].includes(type)) return createWanderConsumableChoice(type);
  return createWanderChestChoice(map);
}

function queueWanderReward(reward, map = getCurrentWanderMap()) {
  if (wanderChestRewards.length >= wanderChestCapacity) return false;
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
  showGameToast(`Đã mở Rương Ngao du, nhận ${rewards.length} phần thưởng.`, 'success');
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
  };
  return iconByMap[mapId] || 'icon-activity-path';
}

function getRandomWanderEnemyStage(map = getCurrentWanderMap()) {
  const mapMinTier = Math.max(1, Math.floor(map.minEnemyTier || 1));
  const mapMaxTier = Math.max(mapMinTier, Math.floor(map.maxEnemyTier || stages.length));
  const playerMajorRealmIndex = clamp(
    getTierMajorIndex(getPlayerCultivationTier()),
    0,
    majorRealmNames.length - 1,
  );
  const minimumPlayerRelativeTier = Math.max(
    1,
    (playerMajorRealmIndex - 1) * playerMaxMinorLevel + 1,
  );
  const minAllowedTier = Math.max(mapMinTier, minimumPlayerRelativeTier);

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

function pickEnemyDataForMapTier(map, tier) {
  const mapCandidates = getMapEnemyCandidates(map, tier);
  if (mapCandidates.length) return pickWeightedEnemy(mapCandidates);
  return null;
}

function getMapEnemyCandidates(map, tier) {
  const mapEnemyIds = new Set(map.enemyPoolIds || []);
  return stageEnemyData.filter((enemyData) => (
    (!mapEnemyIds.size || mapEnemyIds.has(enemyData.id)) &&
    isEnemyAvailableForTier(enemyData, tier)
  ));
}

function isEnemyAvailableForTier(enemyData, tier) {
  const [minTier, maxTier] = enemyData.tierRange || [1, playerMaxMinorLevel];
  return tier >= minTier && tier <= maxTier;
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

function getWanderRewardTypeWeights() {
  const weights = gameConfig.gameplay?.wanderRewardTypeWeights || {};
  return [
    { type: 'cultivation', weight: Math.max(0, Number(weights.cultivation) || 0) },
    { type: 'spiritStone', weight: Math.max(0, Number(weights.spiritStone) || 0) },
    { type: 'chest', weight: Math.max(0, Number(weights.chest) || 0) },
    { type: 'healthPotion', weight: Math.max(0, Number(weights.healthPotion) || 0) },
    { type: 'manaPotion', weight: Math.max(0, Number(weights.manaPotion) || 0) },
    { type: 'enhancementStone', weight: Math.max(0, Number(weights.enhancementStone) || 0) },
  ];
}

function pickWanderRewardType() {
  const entries = getWanderRewardTypeWeights();
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
  const cultivationAmount = getWanderCultivationAmount(stage, settings);
  const bonus = createFighter(playerName, playerLevel, true).spiritStoneBonus || 0;
  const amount = Math.max(1, Math.round(cultivationAmount * spiritStoneToCultivationRatio * (1 + bonus)));
  return {
    type: 'spiritStone',
    title: 'Mạch linh thạch nhỏ',
    detail: `Nhận ${formatGameNumber(amount)} linh thạch.`,
    amount,
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

function createWanderConsumableChoice(type) {
  const rewardData = {
    healthPotion: {
      title: 'Sinh Huyết Đan',
      detail: 'Nhận 1 Sinh Huyết Đan vào Rương Ngao du.',
    },
    manaPotion: {
      title: 'Tụ Linh Đan',
      detail: 'Nhận 1 Tụ Linh Đan vào Rương Ngao du.',
    },
    enhancementStone: {
      title: 'Đá cường hóa',
      detail: 'Nhận 1 Đá cường hóa vào Rương Ngao du.',
    },
  }[type];
  if (!rewardData) return null;
  return {
    type,
    title: rewardData.title,
    detail: rewardData.detail,
    amount: 1,
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
  const majorRealmIndex = clamp(Number(playerMajorRealmIndex) || 0, 0, 25);
  const chestTier = getEquipmentChestTier(map);
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
    <em>${getEnemyRankLabel(stage.enemyData, stage.enemyRankLevel)} | ${stage.realmText} | ${stage.enemyData.skillName}</em>
    <small>Lực chiến ${formatGameNumber(getCombatPower(preview))} | Chạy thoát ${toPercent(fleeChance)} | Đánh thắng để mở đường ngao du tiếp.</small>
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
    <small>${stage.realmText} | Lực chiến ${formatGameNumber(getCombatPower(preview))} | Chạy thoát ${toPercent(fleeChance)}</small>
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
    };
  }

  if (choice.type === 'spiritStone') {
    playerSpiritStones += choice.amount;
    return {
      title: 'Đã nhặt linh thạch',
      message: `Nhận ${formatGameNumber(choice.amount)} linh thạch.`,
    };
  }

  if (choice.type === 'healthPotion' || choice.type === 'manaPotion') {
    const amount = Math.max(1, Math.floor(Number(choice.amount) || 1));
    if (choice.type === 'healthPotion') healthPotionCount += amount;
    if (choice.type === 'manaPotion') manaPotionCount += amount;
    return {
      title: `Đã nhận ${choice.title}`,
      message: `Nhận ${formatGameNumber(amount)} ${choice.title}.`,
    };
  }

  if (choice.type === 'enhancementStone') {
    const amount = Math.max(1, Math.floor(Number(choice.amount) || 1));
    enhancementStones += amount;
    return {
      title: 'Đã nhận Đá cường hóa',
      message: `Nhận ${formatGameNumber(amount)} Đá cường hóa.`,
    };
  }

  if (choice.type === 'foundation') return null;

  const chest = addEquipmentChest({ majorRealmIndex: choice.majorRealmIndex }, { chestTier: choice.chestTier });
  return {
    title: 'Đã cất rương vào Túi đồ',
    message: `${chest.name} đã được chuyển vào Túi đồ.`,
    detail: `Rương sẽ tạo một trang bị trong khoảng cấp ${getChestLevelRange(chest).join('-')} khi mở.`,
  };
}

function openEquipmentChest(chestId, amount = 1) {
  if (busy) return;
  const index = equipmentChestInventory.findIndex((item) => item.id === chestId);
  if (index < 0) return;
  const chest = equipmentChestInventory[index];
  const [minLevel, maxLevel] = getChestLevelRange(chest);
  const currentRarityProfile = getEquipmentRarityProfile({ majorRealmIndex: playerMajorRealmIndex });
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
  const map = getCurrentWanderMap();
  const chance = map.rewardSettings?.ambushChance ?? 0.12;
  if (Math.random() > chance) return null;
  return createAmbushStage(map);
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
  const chance = getFleeChance(stage);
  if (Math.random() > chance) {
    currentWanderEvent = null;
    startStageBattle(stage);
    pushLog(`${stage.enemyData.name} đuổi kịp, không thể chạy thoát.`);
    return;
  }

  currentWanderEvent = {
    type: 'result',
    title: 'Đã rút lui',
    message: `Chạy thoát khỏi ${stage.enemyData.name}.`,
    detail: `Tỉ lệ chạy thoát: ${toPercent(chance)}. Không nhận thưởng từ đối thủ này.`,
  };
  renderStageMap();
}

function getFleeChance(stage) {
  const required = getCultivationRequiredForNextLevel();
  const cultivationProgress = required > 0 ? Math.min(playerCultivation / required, 1) : 0;
  const playerSnapshot = createFighter(playerName, playerLevel, true);
  const enemySnapshot = createStageEnemy(stage);
  const speedBase = Math.max(playerSnapshot.speed, enemySnapshot.speed, 1);
  const speedAdvantage = (playerSnapshot.speed - enemySnapshot.speed) / speedBase;
  const cultivationAdvantage = getPlayerCultivationTier() - getStageDifficulty(stage) + cultivationProgress;
  const ambushPenalty = stage.isAmbush ? 0.08 : 0;
  return clamp(0.5 + speedAdvantage * 0.36 + cultivationAdvantage * 0.035 - ambushPenalty, 0.05, 0.92);
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
}

function startStageBattle(stage) {
  const isTrialTower = Boolean(stage?.isTrialTower);
  const isResourceDungeon = Boolean(stage?.isResourceDungeon);
  const config = isTrialTower || isResourceDungeon ? null : getDungeonConfig();
  if (!stage || (!isTrialTower && !isResourceDungeon && !isStageUnlockedForDungeon(stage, config.id))) return;
  if (isTrialTower && (stage.trialFloor !== trialTowerHighestCleared + 1 || !canEnterTrialTower())) return;
  if (isResourceDungeon) {
    const dungeon = getResourceDungeon(stage.resourceDungeonId);
    const expectedFloor = getResourceDungeonHighestFloor(stage.resourceDungeonId) + 1;
    if (!dungeon || stage.resourceDungeonFloor !== expectedFloor
      || getPlayerCultivationTier() < getResourceDungeonRequiredTier(dungeon, expectedFloor)
      || getRemainingResourceAttempts() <= 0) return;
  }
  if (!isTrialTower && !canEnterDungeon()) {
    renderCultivation();
    showTrainingMessage('Đang bị trọng thương, không thể ngao du tiếp.');
    showGameToast('Đang bị trọng thương, không thể bắt đầu trận đấu.', 'error');
    return;
  }
  if (!isTrialTower && !isResourceDungeon && !canRunDungeon(config.id)) {
    setSubtitle('');
    renderDungeonModes();
    renderStageDetail(stage);
    return;
  }
  if (isResourceDungeon) {
    if (!consumeResourceAttempt()) return;
  } else if (!isTrialTower && !isResourceDungeon) {
    consumeDungeonAttempt(config.id);
  }

  clearWanderTimer();
  hideWanderEventOverlay();
  currentStage = stage;
  selectedStage = stage;
  currentWanderEvent = null;
  resetBattle();
  render();
  renderCultivation();
  battlePanel.classList.remove('is-hidden');
  document.body.classList.add('battle-active');
  hideBattleResultOverlay();
  setSubtitle('');
  const entryText = isTrialTower
    ? `Tiến vào tháp thí luyện ${stage.title}`
    : isResourceDungeon
    ? `Tiến vào ${stage.title}`
    : 'Bắt đầu ngao du';
  pushLog(`${entryText}. Gặp ${enemy.name}, ${stage.realmText}.`);
  if (isResourceDungeon) pushLog(`Phụ bản dùng chung lượt: còn ${getRemainingResourceAttempts()}/${dailyFarmLimit} lượt hôm nay.`);
  if (!isTrialTower && !isResourceDungeon && !config.unlimited) pushLog(`${config.name}: còn ${getRemainingDungeonAttempts(config.id)}/${dailyFarmLimit} lượt hôm nay.`);
  pushLog(`${enemy.name} mang ${getEnemyEquipmentText(stage)}, dùng ${enemy.skillName} và theo lối ${getCombatStyleLabel(stage.enemyData)}.`);
  saveGame();
  startBattle();
}

function renderStageDetail(stage) {
  const config = getDungeonConfig();
  const preview = createStageEnemy(stage);
  const winReward = getPreviewReward(stage, 'win');
  const stoneDrop = getSpiritStonePreviewRange(stage);
  const attemptText = config.unlimited ? 'Không giới hạn lượt' : `Còn ${getRemainingDungeonAttempts(config.id)}/${dailyFarmLimit} lượt hôm nay`;
  $('stageDetailStatus').textContent = `${config.name} | ${attemptText}`;
  $('stageDetailTitle').textContent = `${stage.title}: ${stage.enemyData.name}`;
  $('stageDetailRealm').textContent = `${getEnemyRankLabel(stage.enemyData, stage.enemyRankLevel)} | ${stage.realmText} | ${getCombatStyleLabel(stage.enemyData)} | ${stage.enemyData.skillName}`;
  $('stageDetailStats').innerHTML = `
    <div><span>Lực chiến</span><strong>${formatGameNumber(getCombatPower(preview))}</strong></div>
    <div><span>Công</span><strong>${formatGameNumber(preview.attack)}</strong></div>
    <div><span>Thủ</span><strong>${formatGameNumber(preview.defense)}</strong></div>
    <div><span>Trang bị</span><strong>${getEnemyEquipment(stage).length} món</strong></div>
    <div><span>Chí mạng</span><strong>${toPercent(preview.critRate)}</strong></div>
    <div><span>Đỡ đòn</span><strong>${toPercent(preview.blockRate)}</strong></div>
  `;
  $('stageDetailRewards').textContent = `Thắng nhận ${formatGameNumber(winReward)} tu vi, rớt ${formatGameNumber(stoneDrop.min)}-${formatGameNumber(stoneDrop.max)} linh thạch và tiếp tục ngao du; thua thì về tu luyện.`;
  challengeStageButton.disabled = busy || !canEnterDungeon() || !canRunDungeon(config.id);
}

function getCurrentDungeonStage() {
  return stages.find((stage) => !completedStages.has(stage.id) && isStageUnlocked(stage)) || null;
}

function getFarmAvailableStages() {
  const highestUnlocked = Math.max(1, ...[...completedStages].map((id) => id + 1));
  const capped = Math.min(stages.length, highestUnlocked);
  return stages.filter((stage) => stage.id <= capped);
}

function isStageUnlockedForDungeon(stage, dungeonId = currentDungeonId) {
  if (stage.isAmbush || stage.isWanderGenerated) return true;
  const config = getDungeonConfig(dungeonId);
  if (config.unlimited) return isStageUnlocked(stage) || isStageInCurrentWanderMap(stage);
  return getFarmAvailableStages().some((availableStage) => availableStage.id === stage.id);
}

function isStageInCurrentWanderMap(stage) {
  if (stage.isWanderGenerated) return stage.mapId === getCurrentWanderMap().id;
  return false;
}

function isStageUnlocked(stage) {
  if (stage.isAmbush || stage.isWanderGenerated) return true;
  return stage.id === 1 || completedStages.has(stage.id - 1);
}

function getStageStatusText(stage, enoughHealth = canEnterDungeon()) {
  if (completedStages.has(stage.id)) return 'Đã thắng';
  if (!isStageUnlocked(stage)) return 'Chưa mở';
  if (!enoughHealth) return 'Sinh lực thấp';
  return 'Đối mặt';
}

function getWanderStatusText(stage, enoughHealth = canEnterDungeon()) {
  if (!isStageUnlocked(stage)) return 'Chưa mở';
  if (!enoughHealth) return 'Về tu luyện hồi phục';
  return 'Chiến đấu';
}

function startBattle() {
  if (busy || battleOver) return;

  busy = true;
  startButton.disabled = true;
  startButton.textContent = 'Đang đấu';
  startButton.classList.add('is-hidden');
  battleResult.classList.add('is-hidden');
  pushLog('Đấu pháp bắt đầu.');
  const firstTurn = player.speed >= enemy.speed ? playerTurn : enemyTurn;
  pushLog(`${firstTurn === playerTurn ? player.name : enemy.name} có tốc độ cao hơn và ra đòn trước.`);
  timer = window.setTimeout(firstTurn, 250);
}

function continueBattle() {
  if (lastBattleOutcome && lastBattleOutcome !== 'win') {
    autoWanderAfterRecovery = false;
    window.clearTimeout(autoWanderRecoveryTimer);
    autoWanderRecoveryTimer = 0;
    if (currentStage && !currentStage.isTrialTower && !currentStage.isResourceDungeon && canEnterDungeon()) {
      showMap();
      beginWander();
    } else {
      renderCultivation();
      showTrainingMessage('Đã thua, sinh lực thấp nên Ngao du đã dừng.');
      showGameToast('Ngao du đã dừng vì sinh lực quá thấp.', 'error');
    }
    return;
  }

  if (currentStage?.isTrialTower) {
    showTrialTower();
    return;
  }

  if (currentStage?.isResourceDungeon) {
    showResourceDungeons();
    return;
  }

  const nextStage = getNextBattleStage();
  if (!nextStage) {
    showMap();
    return;
  }

  if (!canEnterDungeon()) {
    renderCultivation();
    showTrainingMessage('Đang bị trọng thương, không thể ngao du tiếp.');
    showGameToast('Đang bị trọng thương, không thể ngao du tiếp.', 'error');
    return;
  }

  showMap();
  beginWander();
}

function scheduleAutoWanderAfterRecovery() {
  window.clearTimeout(autoWanderRecoveryTimer);
  autoWanderRecoveryTimer = 0;
  if (!autoWanderAfterRecovery) return;

  const resume = () => {
    if (!autoWanderAfterRecovery || busy) return;
    if (!canEnterDungeon()) {
      autoWanderRecoveryTimer = window.setTimeout(resume, 1000);
      return;
    }
    window.clearTimeout(autoWanderRecoveryTimer);
    autoWanderRecoveryTimer = 0;
    autoWanderAfterRecovery = false;
    showMap();
    beginWander();
  };

  if (canEnterDungeon()) {
    resume();
    return;
  }

  autoWanderRecoveryTimer = window.setTimeout(resume, 1000);
  saveGame();
}

function getNextBattleStage() {
  if (currentStage?.isResourceDungeon) return null;
  const config = getDungeonConfig();
  if (!currentStage) return null;
  if (!config.unlimited) return canRunDungeon(config.id) ? currentStage : null;
  if (currentStage.isAmbush || currentStage.isWanderGenerated) return getRandomWanderEnemyStage(getCurrentWanderMap());
  if (!completedStages.has(currentStage.id)) return currentStage;
  return stages.find((stage) => isStageUnlocked(stage) && !completedStages.has(stage.id)) || null;
}

function createStageEnemy(stage) {
  const rankMap = stage?.mapId ? wanderMaps[stage.mapId] : null;
  stage.enemyRankLevel = stage.enemyRankLevel
    && (!rankMap?.enemyRankWeights || Object.prototype.hasOwnProperty.call(rankMap.enemyRankWeights, String(stage.enemyRankLevel)))
    ? stage.enemyRankLevel
    : rollEnemyRank(rankMap);
  if (stage.isAmbush && stage.ambushStats) {
    const base = createFighter(
      stage.enemyData.name,
      stage.enemyLevel,
      false,
      stage.enemyMajorRealmIndex || 0,
    );
    const stats = stage.ambushStats;
    const enemyFighter = {
      ...base,
      name: stage.enemyData.name,
      realm: stage.title,
      minorRealm: minorRealmNames[Math.min(stage.enemyLevel - 1, minorRealmNames.length - 1)],
      maxHp: stats.maxHp,
      maxMana: stats.maxMana,
      attack: stats.attack,
      defense: stats.defense,
      accuracy: stats.accuracy,
      dodgeRate: stats.dodgeRate,
      blockRate: stats.blockRate,
      skillName: stage.enemyData.skillName,
      skillMultiplier: 1.5,
      skillCooldownRemaining: 1,
      skills: [],
    };
    applyEnemyRankMultiplier(enemyFighter, stage.enemyRankLevel);
    applyEnemyCombatStyle(enemyFighter, stage.enemyData);
    applyItemStats(enemyFighter, getEnemyEquipment(stage));
    enemyFighter.hp = enemyFighter.maxHp;
    enemyFighter.mana = enemyFighter.maxMana;
    return enemyFighter;
  }

  const enemyFighter = createFighter(stage.enemyData.name, stage.enemyLevel, false, stage.enemyMajorRealmIndex || 0);
  applyEnemyStatMultipliers(enemyFighter, stage.enemyData.statMultiplier);
  applyEnemyRankMultiplier(enemyFighter, stage.enemyRankLevel);
  enemyFighter.skillName = stage.enemyData.skillName;
  enemyFighter.skillMultiplier = 1.4;
  applyEnemyCombatStyle(enemyFighter, stage.enemyData);
  applyItemStats(enemyFighter, getEnemyEquipment(stage));
  enemyFighter.hp = enemyFighter.maxHp;
  enemyFighter.mana = enemyFighter.maxMana;
  return enemyFighter;
}

function rollEnemyRank(map = null) {
  const configuredWeights = map?.enemyRankWeights && typeof map.enemyRankWeights === 'object'
    ? Object.entries(map.enemyRankWeights)
      .map(([rank, weight]) => ({ rank: Number(rank), weight: Number(weight) }))
      .filter(({ rank, weight }) => Number.isInteger(rank) && rank > 0 && Number.isFinite(weight) && weight > 0)
    : [];
  const rankWeights = configuredWeights.length
    ? configuredWeights
    : Array.from({ length: Math.max(1, Object.keys(enemyRankData).length) }, (_, index) => ({
      rank: index + 1,
      weight: Math.pow(0.82, index),
    }));
  let roll = Math.random() * rankWeights.reduce((sum, entry) => sum + entry.weight, 0);
  for (const entry of rankWeights) {
    roll -= entry.weight;
    if (roll < 0) return entry.rank;
  }
  return 1;
}

function getEnemyRankLabel(enemyData = {}, rankLevel = null) {
  if (rankLevel && enemyRankData[String(rankLevel)]) return enemyRankData[String(rankLevel)].label;
  if (enemyData.rank === 'elite') return enemyRankData['2']?.label || 'Tinh anh';
  return enemyRankData['1']?.label || 'Bình thường';
}

function applyEnemyRankMultiplier(fighter, rank = 1) {
  const rankStats = enemyRankData[String(rank)];
  if (!rankStats) return;
  const { label, ...multipliers } = rankStats;
  applyEnemyStatMultipliers(fighter, multipliers);
}

function applyEnemyStatMultipliers(fighter, multipliers = {}) {
  Object.entries(multipliers).forEach(([stat, multiplier]) => {
    if (!(stat in fighter)) return;
    const factor = Number(multiplier);
    if (!Number.isFinite(factor) || factor <= 0) return;
    fighter[stat] *= factor;
  });

  ['maxHp', 'maxMana', 'attack', 'defense'].forEach((stat) => {
    fighter[stat] = Math.max(1, Math.round(fighter[stat]));
  });
  fighter.accuracy = clamp(fighter.accuracy, 0.1, 0.98);
  fighter.dodgeRate = clamp(fighter.dodgeRate, 0, 0.72);
  fighter.blockRate = clamp(fighter.blockRate, 0, 0.7);
  fighter.blockReduction = 0.8;
  fighter.critRate = clamp(fighter.critRate, 0, 0.8);
  fighter.critDamage = clamp(fighter.critDamage, 1, 3.5);
}

function applyEnemyCombatStyle(fighter, enemyData = {}) {
  const styleId = enemyData.combatStyle || inferEnemyCombatStyle(enemyData);
  const style = combatStyles[styleId] || combatStyles.counter || {};
  fighter.combatStyle = styleId;
  fighter.combatStyleLabel = style.label || 'Phản đòn';
  fighter.combatStyleDescription = style.description || '';
  fighter.combatStyleState = {
    cooldown: 0,
    guarding: false,
    critBoost: 0,
  };
}

function getCombatStyleDefinition(styleId) {
  return combatStyles[styleId] || combatStyles.counter || {};
}

function getCombatStyleLabel(source = {}) {
  return source.combatStyleLabel || getCombatStyleDefinition(source.combatStyle).label || 'Phản đòn';
}

function isMajorRealmCompletionTier(tier) {
  return Number.isInteger(Number(tier))
    && Number(tier) > 0
    && getTierMinorLevel(Number(tier)) === playerMaxMinorLevel;
}

function getEnemyEquipmentMajorRealmIndex(stage) {
  const baseIndex = getEquipmentMajorRealmIndex(stage);
  return clamp(
    baseIndex + (isMajorRealmCompletionTier(stage?.enemyTier) ? 1 : 0),
    0,
    25,
  );
}

function getEnemyEquipmentChestTier(stage) {
  const baseTier = getEquipmentChestTier(stage);
  return baseTier + (isMajorRealmCompletionTier(stage?.enemyTier) ? 1 : 0);
}

function getEnemyEquipment(stage) {
  if (stage.mapId === 'novice') {
    stage.enemyEquipment = [];
    return [];
  }
  if (!stage.enemyEquipment) {
    const isFixedEquipmentStage = stage.isTrialTower || stage.isResourceDungeon;
    const equipmentCount = isFixedEquipmentStage
      ? equipmentSlots.length
      : clamp(Math.floor(Number(stage.enemyRankLevel) || 1) + 1, 2, equipmentSlots.length);
    const availableSlots = [...equipmentSlots];
    const rarityProfile = isFixedEquipmentStage
      ? null
      : getEquipmentRarityProfile({
        ...stage,
        majorRealmIndex: getEnemyEquipmentMajorRealmIndex(stage),
      });
    stage.enemyEquipment = [];
    for (let index = 0; index < equipmentCount && availableSlots.length; index += 1) {
      const slotIndex = Math.floor(Math.random() * availableSlots.length);
      const slot = availableSlots.splice(slotIndex, 1)[0];
      const rarityKey = isFixedEquipmentStage
        ? stage.enemyRankLevel >= 5
          ? 'legendary'
          : stage.enemyRankLevel >= 4
          ? 'epic'
          : stage.enemyRankLevel >= 3
          ? 'rare'
          : stage.enemyRankLevel >= 2
          ? 'uncommon'
          : 'common'
        : rollEquipmentRarity(rarityProfile);
      const level = isFixedEquipmentStage
        ? stage.enemyTier
        : rollEquipmentLevel({ chestTier: getEnemyEquipmentChestTier(stage) });
      stage.enemyEquipment.push(createEquipmentLikeItem(slot.id, level, rarityKey));
    }
  }
  return stage.enemyEquipment;
}

function getEnemyEquipmentText(stage) {
  const equipmentText = getEnemyEquipment(stage)
    .map((item) => `${item.name} [Cấp ${formatGameNumber(item.level)}] | LC ${formatGameNumber(getItemPower(item))}`)
    .join(' · ');
  return equipmentText || 'không mang trang bị';
}

function playerTurn() {
  if (!busy || battleOver) return;
  if (turn >= maxTurns) return finishByTurnLimit();

  turn += 1;
  tickBattleBuffs(player);
  const manaRecovered = regenerateBattleMana(player);
  const result = attack(player, enemy);
  animateAttack('playerCard', 'enemyCard', 'enemyFloat', result, player);
  if (result.bonusHit) {
    window.setTimeout(() => animateAttack('playerCard', 'enemyCard', 'enemyFloat', result.bonusHit, player), 180);
  }
  render();
  if (manaRecovered > 0) pushLog(`${player.name} hồi ${manaRecovered} linh lực.`);
  pushLog(formatAttackLog(player, result));
  if (result.counterDamage > 0) {
    animateAttack('enemyCard', 'playerCard', 'playerFloat', {
      damage: result.counterDamage,
      blocked: false,
      dodged: false,
      critical: false,
      skill: false,
    }, enemy);
    render();
    pushLog(`${enemy.name} phản đòn gây ${result.counterDamage} sát thương.`);
  }

  if (player.hp <= 0) return finishBattle(`${enemy.name} thắng nhờ phản đòn.`, 'lose');
  if (enemy.hp <= 0) return finishBattle(`${player.name} thắng.`, 'win');
  timer = window.setTimeout(enemyTurn, turnInterval * 0.5);
}

function enemyTurn() {
  if (!busy || battleOver) return;

  tickBattleBuffs(enemy);
  const manaRecovered = regenerateBattleMana(enemy);
  const styleAction = prepareEnemyCombatStyle(enemy);
  if (styleAction.type === 'guard') {
    render();
    pushLog(`${enemy.name} dùng ${getCombatStyleLabel(enemy)} và thủ thế, giảm ${toPercent(styleAction.reduction)} sát thương lượt kế.`);
    timer = window.setTimeout(playerTurn, turnInterval * 0.5);
    return;
  }
  if (styleAction.type === 'heal') {
    render();
    pushLog(`${enemy.name} dùng ${getCombatStyleLabel(enemy)} hồi ${styleAction.amount} sinh lực.`);
    timer = window.setTimeout(playerTurn, turnInterval * 0.5);
    return;
  }
  if (styleAction.type === 'crit') pushLog(`${enemy.name} dồn sát ý, chuẩn bị một đòn bạo kích.`);
  const result = attack(enemy, player);
  enemy.combatStyleState.critBoost = 0;
  animateAttack('enemyCard', 'playerCard', 'playerFloat', result, enemy);
  if (result.bonusHit) {
    window.setTimeout(() => animateAttack('enemyCard', 'playerCard', 'playerFloat', result.bonusHit, enemy), 180);
  }
  render();
  if (manaRecovered > 0) pushLog(`${enemy.name} hồi ${manaRecovered} linh lực.`);
  pushLog(formatAttackLog(enemy, result));

  if (player.hp <= 0) return finishBattle(`${enemy.name} thắng.`, 'lose');
  if (turn >= maxTurns) return window.setTimeout(finishByTurnLimit, turnInterval * 0.5);

  timer = window.setTimeout(playerTurn, turnInterval);
}

function regenerateBattleMana(fighter) {
  const amount = Math.max(0, Number(cultivationSkillData.upgrade?.manaRegenPerTurn) || 0);
  if (!amount || fighter.mana >= fighter.maxMana) return 0;
  const recovered = Math.min(amount, fighter.maxMana - fighter.mana);
  fighter.mana += recovered;
  return recovered;
}

function tickBattleBuffs(fighter) {
  if (!Array.isArray(fighter.battleBuffs)) return;
  fighter.battleBuffs = fighter.battleBuffs.filter((buff) => {
    buff.remaining -= 1;
    if (buff.remaining > 0) return true;
    fighter[buff.stat] = (fighter[buff.stat] || 0) - buff.value;
    return false;
  });
}

function getReadySkill(attacker) {
  const skill = attacker.skills?.find((entry) => (
    entry.cooldownRemaining <= 0 && attacker.mana >= entry.cost
  ));
  if (skill) return skill;
  if (!attacker.isPlayerFighter && !attacker.skills?.length && attacker.skillCooldownRemaining <= 0 && attacker.mana >= attacker.skillCost) {
    return {
      id: 'legacy_skill',
      name: attacker.skillName,
      cost: attacker.skillCost,
      multiplier: attacker.skillMultiplier,
      cooldown: attacker.skillCooldown,
      cooldownRemaining: attacker.skillCooldownRemaining,
      effects: [],
    };
  }
  return null;
}

function tickSkillCooldowns(attacker, usedSkillId = '') {
  if (attacker.skills?.length) {
    attacker.skills.forEach((skill) => {
      skill.cooldownRemaining = skill.id === usedSkillId
        ? skill.cooldown
        : Math.max(0, skill.cooldownRemaining - 1);
    });
    const selected = attacker.skills.find((skill) => skill.id === attacker.skillId) || attacker.skills[0];
    attacker.skillCooldownRemaining = selected?.cooldownRemaining || 0;
    return;
  }
  attacker.skillCooldownRemaining = usedSkillId
    ? attacker.skillCooldown
    : Math.max(0, attacker.skillCooldownRemaining - 1);
}

function prepareEnemyCombatStyle(fighter) {
  const style = getCombatStyleDefinition(fighter.combatStyle);
  const state = fighter.combatStyleState || { cooldown: 0, guarding: false, critBoost: 0 };
  fighter.combatStyleState = state;
  state.cooldown = Math.max(0, Number(state.cooldown) - 1);
  state.critBoost = 0;

  if (fighter.combatStyle === 'defense'
    && state.cooldown <= 0
    && (fighter.hp / fighter.maxHp <= 0.7 || turn % 4 === 0)) {
    state.cooldown = 3;
    state.guarding = true;
    fighter.guardReduction = clamp(Number(style.guardReduction) || 0.6, 0.1, 0.85);
    return { type: 'guard', reduction: fighter.guardReduction };
  }

  if (fighter.combatStyle === 'heal'
    && state.cooldown <= 0
    && fighter.hp / fighter.maxHp <= 0.58) {
    state.cooldown = 3;
    const amount = Math.min(
      fighter.maxHp - fighter.hp,
      Math.max(1, Math.round(fighter.maxHp * clamp(Number(style.healPercent) || 0.2, 0.05, 0.45))),
    );
    fighter.hp += amount;
    return { type: 'heal', amount };
  }

  if (fighter.combatStyle === 'crit' && turn % 3 === 0) {
    state.critBoost = clamp(Number(style.critBonus) || 0.2, 0.05, 0.5);
    return { type: 'crit' };
  }

  return { type: 'attack' };
}

function resolveCounterStrike(target, attacker) {
  if (target.combatStyle !== 'counter' || !target.combatStyleState || target.hp <= 0) return 0;
  if (target.combatStyleState.cooldown > 0 || Math.random() > (Number(getCombatStyleDefinition('counter').counterChance) || 0.3)) return 0;
  const style = getCombatStyleDefinition('counter');
  const multiplier = clamp(Number(style.counterMultiplier) || 0.55, 0.2, 0.9);
  const rawDamage = Math.round(target.attack * multiplier * rollDamagePercent());
  const damage = Math.max(1, rawDamage - Math.round(attacker.defense));
  attacker.hp = Math.max(0, attacker.hp - damage);
  target.combatStyleState.cooldown = 2;
  return damage;
}

function applySkillEffects(attacker, target, skill) {
  const effectTexts = [];
  (skill.effects || []).forEach((effect) => {
    if (effect.type === 'extraCast' || effect.type === 'manaRefund') return;
    const chance = Math.max(0, Math.min(1, Number(effect.chance) || 0));
    if (Math.random() > chance) return;
    const receiver = effect.target === 'enemy' ? target : attacker;
    if (effect.type === 'selfBuff') {
      const value = Number(effect.value) || 0;
      const duration = Math.max(1, Number(effect.duration) || 1);
      if (!(effect.stat in receiver)) return;
      const buffKey = `${skill.id}:${effect.stat}`;
      receiver.battleBuffs = receiver.battleBuffs || [];
      if (effect.nonStacking) {
        receiver.battleBuffs = receiver.battleBuffs.filter((buff) => {
          if (buff.key !== buffKey) return true;
          receiver[buff.stat] = (receiver[buff.stat] || 0) - buff.value;
          return false;
        });
      }
      receiver[effect.stat] = (receiver[effect.stat] || 0) + value;
      receiver.battleBuffs.push({ key: buffKey, stat: effect.stat, value, remaining: duration });
      effectTexts.push(`${getStatLabel(effect.stat)} +${isPercentStat(effect.stat) ? toPercent(value) : value}`);
    }
    if (effect.type === 'healPercent') {
      const heal = Math.min(receiver.maxHp - receiver.hp, Math.floor(receiver.maxHp * (Number(effect.value) || 0)));
      if (heal > 0) {
        receiver.hp += heal;
        effectTexts.push(`hồi ${heal} sinh lực`);
      }
    }
  });
  return effectTexts;
}

function resolveAttackHit(attacker, target, multiplier = 1) {
  const dodged = Math.random() > getHitChance(attacker, target);
  if (dodged) return { damage: 0, critical: false, dodged: true, blocked: false, heal: 0, reflectDamage: 0 };

  const styleCritBoost = attacker.combatStyleState?.critBoost || 0;
  const critChance = clamp(attacker.critRate + styleCritBoost, 0, 0.95);
  const critical = Math.random() < critChance;
  const rawDamage = Math.round(
    attacker.attack * multiplier * rollDamagePercent() * (critical ? attacker.critDamage : 1),
  );
  const blocked = Math.random() < target.blockRate;
  const blockMultiplier = blocked ? 0.2 : 1;
  const styleGuardMultiplier = target.combatStyleState?.guarding
    ? 1 - clamp(Number(target.guardReduction) || 0.6, 0.1, 0.85)
    : 1;
  const effectiveDefense = Math.max(0, Math.round(target.defense * (1 - attacker.armorPierce)));
  const reducedRawDamage = rawDamage
    * (1 - clamp(target.damageReduction, 0, 0.9))
    * styleGuardMultiplier;
  const damage = Math.max(1, Math.round(reducedRawDamage * blockMultiplier) - effectiveDefense);
  target.hp = Math.max(0, target.hp - damage);
  if (target.combatStyleState?.guarding) target.combatStyleState.guarding = false;
  const heal = Math.min(attacker.maxHp - attacker.hp, Math.floor(damage * attacker.lifeSteal));
  if (heal > 0) attacker.hp += heal;
  const reflectDamage = Math.min(
    attacker.hp,
    Math.max(0, Math.round(damage * (Number(target.reflectDamage) || 0))),
  );
  if (reflectDamage > 0) attacker.hp -= reflectDamage;

  return {
    damage,
    heal,
    reflectDamage,
    critical,
    dodged: false,
    blocked,
    pierced: attacker.armorPierce > 0,
  };
}

function attack(attacker, target) {
  const selectedSkill = getReadySkill(attacker);
  const skill = Boolean(selectedSkill);
  if (selectedSkill) {
    attacker.skillId = selectedSkill.id;
    attacker.skillName = selectedSkill.name;
  }
  if (skill) {
    attacker.mana = Math.max(0, attacker.mana - selectedSkill.cost);
  }
  tickSkillCooldowns(attacker, selectedSkill?.id || '');

  let manaRefunded = 0;
  const manaRefundEffect = selectedSkill?.effects?.find((effect) => effect.type === 'manaRefund');
  if (manaRefundEffect && Math.random() <= clamp(Number(manaRefundEffect.chance) || 0, 0, 1)) {
    manaRefunded = selectedSkill.cost;
    attacker.mana = Math.min(attacker.maxMana, attacker.mana + manaRefunded);
  }

  const primaryHit = resolveAttackHit(attacker, target, skill ? selectedSkill.multiplier : 1);
  const effectTexts = skill && !primaryHit.dodged ? applySkillEffects(attacker, target, selectedSkill) : [];
  let bonusHit = null;
  const extraCastEffect = selectedSkill?.effects?.find((effect) => effect.type === 'extraCast');
  if (extraCastEffect
    && !primaryHit.dodged
    && target.hp > 0
    && Math.random() <= clamp(Number(extraCastEffect.chance) || 0, 0, 1)) {
    bonusHit = resolveAttackHit(attacker, target, selectedSkill.multiplier);
    bonusHit.skill = true;
    bonusHit.skillName = selectedSkill.name;
  }
  const counterDamage = primaryHit.dodged ? 0 : resolveCounterStrike(target, attacker);

  return {
    ...primaryHit,
    counterDamage,
    manaRefunded,
    skill,
    skillName: selectedSkill?.name,
    effectTexts,
    bonusHit,
  };
}

function getHitChance(attacker, target) {
  return clamp(attacker.accuracy - target.dodgeRate, 0.1, 0.98);
}

function rollDamagePercent() {
  return 0.9 + Math.random() * 0.2;
}

function getTrialTowerChestMap(tier) {
  return Object.values(wanderMaps).find((map) => Number(map.equipmentChestTier) === Number(tier)) || getCurrentWanderMap();
}

function applyTrialTowerReward(stage) {
  const reward = stage.trialReward || {};
  const floorNumber = Number(stage.trialFloor) || 0;
  trialTowerHighestCleared = Math.max(trialTowerHighestCleared, floorNumber);
  const cultivation = addPlayerCultivation(Math.max(0, Number(reward.cultivation) || 0));
  const spiritStones = Math.max(0, Math.floor(Number(reward.spiritStones) || 0));
  playerSpiritStones += spiritStones;
  const enhancementStoneReward = Math.max(0, Math.floor(Number(reward.enhancementStones) || 0));
  enhancementStones += enhancementStoneReward;
  const chestTier = Math.max(0, Math.floor(Number(reward.equipmentChestTier) || 0));
  const droppedChest = chestTier > 0
    ? addEquipmentChest({ majorRealmIndex: stage.enemyMajorRealmIndex }, { chestTier })
    : null;
  return { cultivation, spiritStones, enhancementStones: enhancementStoneReward, droppedChest };
}

function finishBattle(message, outcome = 'lose') {
  busy = false;
  battleOver = true;
  lastBattleOutcome = outcome;
  savePlayerResourcesFromBattle(outcome);
  const isTrialTower = Boolean(currentStage?.isTrialTower);
  const isResourceDungeon = Boolean(currentStage?.isResourceDungeon);
  const resourceAttemptRefunded = isResourceDungeon && outcome === 'lose'
    ? refundResourceAttempt()
    : false;
  if (currentStage.isAmbush && outcome !== 'win') rollbackAmbushLoot(currentStage);
  const recovered = applyVictoryRecovery(outcome);
  if (outcome === 'win' && !isTrialTower && !isResourceDungeon && getDungeonConfig().unlimited && !currentStage.isAmbush && !currentStage.isWanderGenerated) {
    completedStages.add(currentStage.id);
  }
  if (outcome === 'win' && isTrialTower) trialTowerWinCount += 1;
  if (outcome === 'win' && !isTrialTower && !isResourceDungeon) {
    wanderWinCount += 1;
    wanderRewardCount += 1;
  }
  dailyQuestProgress = normalizeDailyQuestProgress(dailyQuestProgress);
  if (outcome === 'win' && isTrialTower) dailyQuestProgress.trialTowerWins += 1;
  if (outcome === 'win' && !isTrialTower && !isResourceDungeon) {
    dailyQuestProgress.wanderWins += 1;
    dailyQuestProgress.wanderRewards += 1;
  }
  let reward = 0;
  let spiritStoneReward = 0;
  let droppedItem = null;
  let bonusRewardText = '';
  if (resourceAttemptRefunded) bonusRewardText = 'Đã hoàn lại 1 lượt Phụ bản';
  if (isTrialTower && outcome === 'win') {
    const towerReward = applyTrialTowerReward(currentStage);
    reward = towerReward.cultivation;
    spiritStoneReward = towerReward.spiritStones;
    const towerBonusParts = [];
    if (towerReward.enhancementStones > 0) towerBonusParts.push(`Đá cường hóa +${formatGameNumber(towerReward.enhancementStones)}`);
    if (towerReward.droppedChest) towerBonusParts.push(`${towerReward.droppedChest.name} vào Túi đồ`);
    bonusRewardText = towerBonusParts.join(' | ');
    message = `${message} Vượt qua ${currentStage.title}.`;
  } else if (isResourceDungeon && outcome === 'win') {
    const resourceReward = grantResourceDungeonReward(currentStage.resourceDungeonId, currentStage.resourceDungeonFloor);
    const resourceDungeon = getResourceDungeon(currentStage.resourceDungeonId);
    reward = resourceReward.cultivation;
    spiritStoneReward = resourceReward.spiritStones;
    bonusRewardText = resourceDungeon?.rewardType === 'enhancementStone'
      ? formatResourceReward(resourceDungeon, resourceReward.amount)
      : '';
    message = `${message} Vượt qua ${currentStage.title}.`;
  } else if (!isTrialTower && !isResourceDungeon) {
    reward = addCultivationReward(outcome);
    spiritStoneReward = addSpiritStoneReward(outcome);
    droppedItem = rollEquipmentDrop(outcome);
  }
  startButton.disabled = false;
  startButton.textContent = getPostBattleButtonText(outcome);
  startButton.classList.add('is-hidden');
  renderBattleResult(message, outcome, reward, spiritStoneReward, droppedItem, bonusRewardText);
  renderStageMap();
  pushLog(`${message} Trận đấu kết thúc.`);
  pushLog(reward > 0
    ? `Nhận ${formatGameNumber(reward)} tu vi. Hiện tại: ${formatGameNumber(playerCultivation)}/${formatGameNumber(getCultivationRequiredForNextLevel())}.`
    : 'Không nhận tu vi.');
  if (recovered) pushLog(`Dưỡng khí hồi ${recovered.hp} sinh lực và ${recovered.mana} linh lực.`);
  if (spiritStoneReward > 0) pushLog(`Rớt ${formatGameNumber(spiritStoneReward)} linh thạch.`);
  if (droppedItem) pushLog(`Nhặt được ${getDroppedRewardText(droppedItem)}.`);
  if (bonusRewardText) pushLog(`Nhận ${bonusRewardText}. Căn cơ hiện tại: ${playerFoundation}.`);
  if (playerCultivation >= getCultivationRequiredForNextLevel()) {
    if (playerLevel >= playerMaxMinorLevel && hasNextMajorRealm() && getShopInventoryCount('majorAscensionPermit') <= 0) {
      pushLog(`Tu vi đã đầy, hãy mua Phá Cảnh Đan trong shop để thăng ${getNextMajorRealmName()}.`);
    } else if (canBreakthrough()) {
      pushLog(playerLevel >= playerMaxMinorLevel
        ? `Tu vi đã đầy, có thể thăng ${getNextMajorRealmName()}.`
        : `Tu vi đã đầy, có thể đột phá ${minorRealmNames[playerLevel]}.`);
    }
  }
  renderCultivation();
  saveGame();
}

function renderBattleResult(message, outcome, reward, spiritStoneReward, droppedItem, bonusRewardText = '') {
  const nextStage = getNextBattleStage();
  const config = getDungeonConfig();
  const resultTitle = outcome === 'win' ? 'Thắng lợi' : outcome === 'draw' ? 'Hòa' : 'Thất bại';
  const resultIcon = outcome === 'win' ? 'icon-item-victory' : outcome === 'draw' ? 'icon-unique-draw' : 'icon-item-defeat';
  const itemText = droppedItem
    ? getDroppedRewardText(droppedItem)
    : 'Không rơi trang bị';
  const nextText = currentStage?.isResourceDungeon
    ? outcome !== 'win'
      ? 'Về Phụ bản để thử lại tầng này'
      : getResourceDungeonHighestFloor(currentStage.resourceDungeonId) >= getResourceDungeonTotalFloors(getResourceDungeon(currentStage.resourceDungeonId))
        ? 'Đã chinh phục toàn bộ Phụ bản'
        : `Đã mở tầng ${getResourceDungeonHighestFloor(currentStage.resourceDungeonId) + 1}`
    : currentStage?.isTrialTower
    ? outcome !== 'win'
      ? 'Về tu luyện để hồi phục'
      : trialTowerHighestCleared < trialTowerData.floors.length
        ? `Mở ${trialTowerData.floors[trialTowerHighestCleared]?.title || 'tầng kế tiếp'}`
        : 'Đã chinh phục toàn bộ tháp'
    : outcome !== 'win'
    ? 'Về tu luyện để hồi phục'
    : nextStage
    ? `Tiếp tục ngao du, gặp ${nextStage.enemyData.name}`
    : config.unlimited ? 'Đã hết đối thủ đang mở' : `${config.name} đã hết lượt hôm nay`;

  // Keep the outcome inside the centered battle screen so the player can read it before continuing.
  battleResult.classList.remove('is-hidden');
  battleResult.innerHTML = `
    <strong><i class="${resultIcon.startsWith('icon-unique-') ? 'unique-icon' : resultIcon.startsWith('icon-stat') ? 'stat-icon' : 'item-icon'} ${resultIcon}" aria-hidden="true"></i>${resultTitle}</strong>
    <span>${message}</span>
    <em>Tu vi +${formatGameNumber(reward)} | Rớt linh thạch +${formatGameNumber(spiritStoneReward)} | ${bonusRewardText || itemText}</em>
    <small>Tiếp theo: ${nextText}</small>
    <button type="button" class="breakthrough compact">${getPostBattleButtonText(outcome)}</button>
  `;

  battleResult.querySelector('button').addEventListener('click', () => {
    battleResult.classList.add('is-hidden');
    continueBattle();
  });
  battleResultTimer = window.setTimeout(() => {
    if (!battleOver || battleResult.classList.contains('is-hidden')) return;
    battleResult.classList.add('is-hidden');
    continueBattle();
  }, 5000);
}

function getDroppedRewardText(reward) {
  if (reward?.type === 'equipmentChest') {
    const [minLevel, maxLevel] = getEquipmentLevelRange(reward);
    return `${reward.name} mở ra trang bị cấp ${minLevel}-${maxLevel}`;
  }
  return reward ? `${getRarityName(reward)} ${reward.name}` : 'Không rơi trang bị';
}

function getPostBattleButtonText(outcome) {
  if (currentStage?.isResourceDungeon) return outcome === 'win' ? 'Về Phụ bản' : 'Về tu luyện';
  if (currentStage?.isTrialTower) return outcome === 'win' ? 'Về tháp' : 'Về tu luyện';
  const config = getDungeonConfig();
  if (outcome !== 'win') return 'Về tu luyện';
  if (!config.unlimited && !canRunDungeon(config.id)) return 'Tiếp tục';
  return getNextBattleStage() ? 'Tiếp tục ngao du' : 'Tiếp tục';
}

function finishByTurnLimit() {
  if (battleOver) return;
  if (player.hp > enemy.hp) return finishBattle(`${player.name} thắng nhờ sinh lực.`, 'win');
  if (enemy.hp > player.hp) return finishBattle(`${enemy.name} thắng nhờ sinh lực.`, 'lose');
  finishBattle('Hai bên hòa.', 'draw');
}

function addCultivationReward(outcome) {
  const reward = getCultivationReward(outcome);
  return addPlayerCultivation(reward);
}

function addPlayerCultivation(amount) {
  const gain = Math.max(0, Math.round(Number(amount) || 0));
  if (gain <= 0) return 0;

  const required = getCultivationRequiredForNextLevel();
  normalizeCultivationStorage();
  transferDantianCultivationToBar();
  const progressGain = Math.min(gain, Math.max(0, required - playerCultivation));
  playerCultivation += progressGain;
  dantianCultivation += gain - progressGain;
  clampDantianCultivation();
  transferDantianCultivationToBar();
  return gain;
}

function normalizeCultivationStorage() {
  const required = getCultivationRequiredForNextLevel();
  if (required <= 0 || playerCultivation <= required) return;
  dantianCultivation += playerCultivation - required;
  playerCultivation = required;
  clampDantianCultivation();
}

function transferDantianCultivationToBar() {
  clampDantianCultivation();
  const required = getCultivationRequiredForNextLevel();
  if (required <= 0 || dantianCultivation <= 0 || playerCultivation >= required) return 0;
  const gained = Math.min(dantianCultivation, required - playerCultivation);
  dantianCultivation -= gained;
  playerCultivation += gained;
  return gained;
}

function getDantianCultivationCap() {
  return Math.max(0, Math.floor(Math.max(1, Number(playerFoundation) || 1) * 8 * 60 * 60));
}

function clampDantianCultivation() {
  dantianCultivation = Math.min(
    getDantianCultivationCap(),
    Math.max(0, Math.floor(Number(dantianCultivation) || 0)),
  );
}

function addSpiritStoneReward(outcome) {
  const reward = rollSpiritStoneDrop(outcome);
  playerSpiritStones += reward;
  return reward;
}

function getCultivationReward(outcome) {
  return calculateCultivationReward(currentStage, outcome);
}

function getRewardMap(stage = currentStage) {
  return wanderMaps[stage?.mapId] || wanderMaps[stage?.id] || getCurrentWanderMap();
}

function getRewardSettings(stage = currentStage) {
  const map = getRewardMap(stage);
  const config = getDungeonConfig();
  return {
    cultivationMultiplier: (map.rewardSettings?.cultivationMultiplier ?? config.cultivationMultiplier ?? 1) * rewardMultiplier,
    spiritStoneMultiplier: (map.rewardSettings?.spiritStoneMultiplier ?? config.spiritStoneMultiplier ?? 1) * rewardMultiplier,
    equipmentDropChance: map.rewardSettings?.equipmentDropChance ?? config.equipmentDropChance ?? 0,
    equipmentRarityBonus: map.rewardSettings?.equipmentRarityBonus ?? config.equipmentRarityBonus ?? 0,
    equipmentQualityMax: map.rewardSettings?.equipmentQualityMax ?? 1,
    equipmentQualityWeights: map.rewardSettings?.equipmentQualityWeights || [],
    foundationFindLimit: map.rewardSettings?.foundationFindLimit ?? 0,
    foundationChance: map.rewardSettings?.foundationChance ?? 0,
    foundationAmount: map.rewardSettings?.foundationAmount ?? 1,
  };
}

function getWanderCultivationAmount(stage, settings = getRewardSettings(stage)) {
  return Math.round((5 + getStageDifficulty(stage) * 3 + Math.random() * 6) * settings.cultivationMultiplier);
}

function normalizeFoundationFindCounts(counts = {}) {
  return Object.fromEntries(Object.keys(wanderMaps).map((mapId) => [
    mapId,
    Math.max(0, Number(counts?.[mapId]) || 0),
  ]));
}

function normalizeWanderChestRewards(rewards = []) {
  return Array.isArray(rewards)
    ? rewards
      .filter((reward) => reward && reward.type && reward.title && reward.type !== 'foundation')
      .slice(0, wanderChestCapacity)
    : [];
}

function canFindFoundation(map = getCurrentWanderMap()) {
  const settings = getRewardSettings(map);
  return (foundationFindCounts[map.id] || 0) < settings.foundationFindLimit;
}

function getEquipmentRarityKey(stage = currentStage) {
  return rollEquipmentRarity(getEquipmentRarityProfile(stage));
}

function normalizeEquipmentRarityProfile(profile, map = getCurrentWanderMap()) {
  const source = profile && typeof profile === 'object' ? profile : {};
  const fallback = source.qualityMax || source.equipmentQualityMax || source.weights || source.equipmentQualityWeights
    ? { qualityMax: equipmentQualityOrder.length, weights: [] }
    : getEquipmentRarityProfile(map);
  const maxQuality = clamp(
    Math.floor(Number(source.qualityMax ?? source.equipmentQualityMax ?? fallback.qualityMax)),
    1,
    equipmentQualityOrder.length,
  );
  const sourceWeights = source.weights || source.equipmentQualityWeights || fallback.weights;
  const weights = Array.from({ length: maxQuality }, (_, index) => Math.max(0, Number(sourceWeights?.[index]) || 0));
  return { qualityMax: maxQuality, weights };
}

function getEquipmentMajorRealmIndex(source = currentStage) {
  const chestIndex = Number(source?.majorRealmIndex);
  if (Number.isInteger(chestIndex)) return clamp(chestIndex, 0, 25);

  const directIndex = Number(source?.enemyMajorRealmIndex);
  if (Number.isInteger(directIndex)) return clamp(directIndex, 0, 25);

  const tier = Number(source?.enemyTier);
  if (Number.isFinite(tier) && tier > 0) return clamp(getTierMajorIndex(tier), 0, 25);

  const level = Number(source?.enemyLevel);
  if (source?.enemyData && Number.isFinite(level) && level > 0) {
    return clamp(getTierMajorIndex(level), 0, 25);
  }

  const mapId = source?.mapId || source?.id;
  const mapIndex = wanderMapList.findIndex((map) => map.id === mapId);
  if (mapIndex >= 0) return clamp(mapIndex, 0, 25);

  return clamp(Number(playerMajorRealmIndex) || 0, 0, 25);
}

function getEquipmentRarityProfile(source = currentStage) {
  const majorRealmId = getEquipmentMajorRealmIndex(source) + 1;
  const configured = equipmentMajorRealmRarityProfiles.find((profile) => Number(profile.majorRealmId) === majorRealmId);
  if (configured) {
    const sourceWeights = configured.weights.map((weight) => Math.max(0, Number(weight) || 0));
    let qualityMax = sourceWeights.reduce((last, weight, index) => (weight > 0 ? index + 1 : last), 0);
    qualityMax = clamp(qualityMax || 1, 1, equipmentQualityOrder.length);
    return { qualityMax, weights: sourceWeights.slice(0, qualityMax) };
  }

  const map = source?.mapId && wanderMaps[source.mapId]
    ? wanderMaps[source.mapId]
    : wanderMaps[source?.id] || getCurrentWanderMap();
  const settings = getRewardSettings(map);
  const qualityMax = clamp(Math.floor(Number(settings.equipmentQualityMax) || 1), 1, equipmentQualityOrder.length);
  const weights = Array.from({ length: qualityMax }, (_, index) => Math.max(0, Number(settings.equipmentQualityWeights?.[index]) || 0));
  return { qualityMax, weights };
}

function rollEquipmentRarity(profile) {
  const normalized = normalizeEquipmentRarityProfile(profile);
  const maxQuality = normalized.qualityMax;
  const weights = normalized.weights;
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * (totalWeight || maxQuality);
  let qualityIndex = 0;
  for (let index = 0; index < maxQuality; index += 1) {
    roll -= totalWeight ? weights[index] : 1;
    if (roll < 0) {
      qualityIndex = index;
      break;
    }
  }
  return equipmentQualityOrder[qualityIndex] || equipmentQualityOrder[0] || 'common';
}

function calculateCultivationReward(stage, outcome) {
  if (outcome !== 'win') return 0;

  const enemyLevel = getStageDifficulty(stage);
  const levelGap = Math.max(0, enemyLevel - getPlayerCultivationTier());
  const multiplier = getRewardSettings(stage).cultivationMultiplier;

  return Math.round((15 + enemyLevel * 7 + levelGap * 5) * multiplier);
}

function getSpiritStoneDropRange(stage = currentStage) {
  const cultivationReward = calculateCultivationReward(stage, 'win');
  const amount = Math.max(0, Math.round(cultivationReward * spiritStoneToCultivationRatio));
  return {
    min: amount,
    max: amount,
  };
}

function getSpiritStonePreviewRange(stage = currentStage) {
  const range = getSpiritStoneDropRange(stage);
  const bonus = createFighter(playerName, playerLevel, true).spiritStoneBonus || 0;
  return {
    min: Math.round(range.min * (1 + bonus)),
    max: Math.round(range.max * (1 + bonus)),
  };
}

function rollSpiritStoneDrop(outcome) {
  if (outcome !== 'win') return 0;
  const range = getSpiritStoneDropRange(currentStage);
  const baseDrop = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
  const bonus = player?.spiritStoneBonus || 0;
  return Math.round(baseDrop * (1 + bonus));
}

function breakthrough() {
  if (busy || !canBreakthrough()) return;

  if (playerLevel >= playerMaxMinorLevel) {
    const permitItemId = 'majorAscensionPermit';
    const required = getCultivationRequiredForNextLevel();
    playerCultivation -= required;
    playerMajorRealmIndex += 1;
    playerLevel = 1;
    shopInventoryCounts[permitItemId] = Math.max(0, getShopInventoryCount(permitItemId) - 1);
    hasMajorAscensionPermit = false;
    syncPlayerResourceCaps();
    absorbDantianCultivation();
    resetBattle();
    render();
    renderStageMap();
    renderProfile();
    renderEquipment();
    renderShop();
    pushLog(`Thăng đại cảnh giới thành công: ${getCurrentRealmText()}.`);
    showGameToast(`Thăng đại cảnh giới thành công: ${getCurrentRealmText()}.`, 'success');
    saveGame();
    return;
  }

  const required = getCultivationRequiredForNextLevel();
  playerCultivation -= required;
  playerLevel += 1;
  absorbDantianCultivation();
  resetBattle();
  render();
  renderStageMap();
  renderProfile();
  renderEquipment();
  renderShop();
  pushLog(`Đột phá thành công: Thối Thể cảnh ${minorRealmNames[playerLevel - 1]}.`);
  showGameToast(`Đột phá thành công: ${getCurrentRealmText()}.`, 'success');
  saveGame();
}

function canBreakthrough() {
  if (playerCultivation < getCultivationRequiredForNextLevel()) return false;
  if (playerLevel < playerMaxMinorLevel) return true;
  return getShopInventoryCount('majorAscensionPermit') > 0 && hasNextMajorRealm();
}

function getCultivationRequiredForNextLevel() {
  const progression = cultivationProgression[playerMajorRealmIndex];
  if (!progression) return 0;
  if (playerLevel >= playerMaxMinorLevel) return progression.majorBreakthroughRequirement;
  return progression.minorBaseRequirement + (playerLevel - 1) * progression.minorStepRequirement;
}

function hasNextMajorRealm() {
  return playerMajorRealmIndex < majorRealmNames.length - 1;
}

function isApproachingMajorAscension() {
  return playerLevel >= playerMaxMinorLevel && hasNextMajorRealm();
}

function isMajorAscensionGate() {
  return isApproachingMajorAscension() && playerCultivation >= getCultivationRequiredForNextLevel();
}

function getNextMajorRealmName() {
  return majorRealmNames[Math.min(playerMajorRealmIndex + 1, majorRealmNames.length - 1)];
}

function getCurrentRealmText() {
  return `${majorRealmNames[playerMajorRealmIndex]} cảnh ${minorRealmNames[playerLevel - 1]}`;
}

function createEquipmentItem(slotId, level, rarityKey, options = {}) {
  return {
    id: equipmentIdSeed++,
    slotId,
    name: options.name || pickRandom(getEquipmentNamePool(slotId, level)),
    rarityKey,
    level,
    requiredLevel: Math.min(level, playerMaxMinorLevel),
    requiredTier: Math.max(1, Number(options.requiredTier) || getEquipmentRequiredTier(rarityKey, level)),
    enhancementLevel: 0,
    stats: options.stats || createEquipmentStats(slotId, level, rarityKey),
    specialLines: options.specialLines ?? createEquipmentSpecialLines(slotId, level, rarityKey),
  };
}

function createEquipmentLikeItem(slotId, level, rarityKey) {
  return {
    id: 0,
    slotId,
    name: pickRandom(getEquipmentNamePool(slotId, level)),
    rarityKey,
    level,
    requiredLevel: Math.min(level, playerMaxMinorLevel),
    requiredTier: getEquipmentRequiredTier(rarityKey, level),
    enhancementLevel: 0,
    stats: createEquipmentStats(slotId, level, rarityKey),
    specialLines: createEquipmentSpecialLines(slotId, level, rarityKey),
  };
}

function getEquipmentNamePool(slotId, level = 1) {
  const names = equipmentTemplates[slotId]?.names || [];
  if (names.length <= 3) return names;

  const bandCount = Math.max(1, Math.floor(names.length / 3));
  const bandIndex = Math.min(
    bandCount - 1,
    Math.max(0, Math.floor((Math.max(1, Number(level) || 1) - 1) / 30)),
  );
  return names.slice(bandIndex * 3, bandIndex * 3 + 3);
}

function createEquipmentStats(slotId, level, rarityKey) {
  const template = equipmentTemplates[slotId];
  const rarity = rarityData[rarityKey];
  const levelFactor = Number(equipmentStatGeneration.levelBase) || 1;
  const levelGrowth = Number(equipmentStatGeneration.levelGrowth) || 0.1;
  const levelScale = levelFactor + Math.max(0, Number(level) - 1) * levelGrowth;
  const stats = {};

  (template.guaranteedStats || []).slice(0, Number(equipmentStatGeneration.fixedCount) || 2).forEach((line) => {
    addRolledStat(stats, line, (Number(rarity.statScale) || 1) * levelScale);
  });

  const usedStats = new Set(Object.keys(stats));
  const randomStatChance = clamp(Number(equipmentStatGeneration.randomStatChance) || 0.5, 0, 1);
  const bonusPool = (template.randomStats || []).slice(0, 2)
    .filter((line) => !usedStats.has(line.stat));

  bonusPool.forEach((line) => {
    if (Math.random() <= randomStatChance) {
      addRolledStat(stats, line, (Number(rarity.statScale) || 1) * levelScale);
    }
  });

  return stats;
}

function addRolledStat(stats, line, scale) {
  const { stat, min, max } = line;
  const baseValue = Number.isFinite(Number(line.base))
    ? Number(line.base)
    : (Number(min) + Number(max)) / 2;
  const variance = randomBetween(
    Number(equipmentStatGeneration.varianceMin) || 0.8,
    Number(equipmentStatGeneration.varianceMax) || 1.2,
  );
  const rolled = isPercentStat(stat)
    ? roundStat(baseValue * scale * variance)
    : Math.max(1, Math.round(baseValue * scale * variance));
  stats[stat] = (stats[stat] || 0) + rolled;
}

function createEquipmentSpecialLines(slotId, level, rarityKey) {
  const rarity = rarityData[rarityKey];
  const chance = Math.min(1, Number(rarity.specialChance) || 0);
  const lines = [];

  for (let i = 0; i < rarity.maxSpecialLines; i += 1) {
    const lineChance = i === 0 ? chance : chance * 0.38;
    if (Math.random() > lineChance) continue;

    const candidates = specialLineData
      .filter((line) => !lines.some((existing) => existing.id === line.id));
    if (candidates.length === 0) break;

    const definition = pickRandom(candidates);
    const [min, max] = definition.valueRange || [0.01, 0.15];
    const value = roundStat(randomBetween(min, max));
    lines.push({ id: definition.id, name: definition.name, value });
  }

  return lines;
}

function rollEquipmentDrop(outcome) {
  if (outcome !== 'win') return null;

  const settings = getRewardSettings(currentStage);
  const chance = settings.equipmentDropChance;
  if (Math.random() > chance) return null;

  const map = getRewardMap(currentStage);
  const chest = addEquipmentChest(currentStage);
  renderEquipment();
  renderInventory();
  return chest;
}

function getEquipmentLevelRange(source = currentStage) {
  const chestTier = getEquipmentChestTier(source);
  const min = chestTier === 1 ? 1 : (chestTier - 1) * equipmentLevelsPerChestTier;
  const max = chestTier * equipmentLevelsPerChestTier;
  return normalizeEquipmentLevelRange([min, max], [1, equipmentLevelsPerChestTier]);
}

function normalizeEquipmentLevelRange(range, fallback = [1, 10]) {
  const source = Array.isArray(range) ? range : fallback;
  const min = Math.max(1, Math.floor(Number(source[0]) || 1));
  const max = Math.max(min, Math.floor(Number(source[1]) || min));
  return [min, Math.min(maxEquipmentLevel, max)];
}

function getChestLevelRange(chest) {
  return getEquipmentLevelRange(chest);
}

function rollEquipmentLevel(map = getCurrentWanderMap()) {
  const [min, max] = getEquipmentLevelRange(map);
  return min + Math.floor(Math.random() * (max - min + 1));
}

function getEquipmentChestMajorRealmIndex(source = currentStage) {
  const directIndex = Number(source?.majorRealmIndex);
  if (Number.isInteger(directIndex)) return clamp(directIndex, 0, 25);

  const tier = Number(source?.enemyTier);
  if (Number.isFinite(tier) && tier > 0) return clamp(getTierMajorIndex(tier), 0, 25);

  const enemyIndex = Number(source?.enemyMajorRealmIndex);
  if (Number.isInteger(enemyIndex)) return clamp(enemyIndex, 0, 25);

  return clamp(Number(playerMajorRealmIndex) || 0, 0, 25);
}

function getEquipmentChestTier(source = currentStage) {
  const directTier = Number(source?.chestTier ?? source?.equipmentChestTier ?? source?.tier);
  if (Number.isInteger(directTier) && directTier > 0) return Math.max(1, directTier);

  const map = source?.mapId && wanderMaps[source.mapId]
    ? wanderMaps[source.mapId]
    : wanderMaps[source?.id];
  if (map?.equipmentChestTier) return Math.max(1, Math.floor(Number(map.equipmentChestTier)));
  return 1;
}

function getEquipmentChestName(source = currentStage) {
  return `Rương trang bị cấp ${getEquipmentChestTier(source)}`;
}

function addEquipmentChest(source = currentStage, options = {}) {
  equipmentChestInventory = mergeEquipmentChestStacks(equipmentChestInventory);
  const majorRealmIndex = getEquipmentChestMajorRealmIndex(source);
  const chestTier = Math.max(1, Math.floor(Number(options.chestTier) || getEquipmentChestTier(source)));
  const existing = equipmentChestInventory.find((chest) => chest.tier === chestTier);
  if (existing) {
    existing.count += 1;
    return existing;
  }
  const idNumber = equipmentChestIdSeed++;
  const chest = {
    id: `equipmentChest-${idNumber}`,
    idNumber,
    type: 'equipmentChest',
    name: getEquipmentChestName({ chestTier }),
    majorRealmIndex,
    tier: chestTier,
    chestTier,
    levelRange: getEquipmentLevelRange({ chestTier }),
    rarityProfile: options.rarityProfile || getEquipmentRarityProfile({ majorRealmIndex }),
    count: 1,
  };
  equipmentChestInventory.unshift(chest);
  return chest;
}

function getShopPurchaseTotal(shopItem, quantity = 1) {
  const count = clamp(Math.floor(Number(quantity) || 1), 1, maxShopPurchaseQuantity);
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    if (shopItem.type === 'cultivation') {
      const baseCost = Math.max(1, Number(shopItem.cost) || 1);
      const priceStep = Math.max(0, Number(shopItem.priceStep) || 0);
      const purchases = Math.max(0, Number(cultivationPillPurchases[shopItem.id]) || 0);
      total += baseCost + priceStep * (purchases + index);
    } else if (shopItem.type === 'potion') {
      const baseCost = Math.max(1, Number(shopItem.cost) || 5);
      const priceStep = Math.max(1, Number(shopItem.priceStep) || 5);
      const purchaseCount = Math.max(0, Number(potionPurchaseCounts[shopItem.id]) || 0);
      const increaseEvery = Math.max(1, Number(shopItem.priceIncreaseEvery) || 5);
      total += baseCost + Math.floor((purchaseCount + index) / increaseEvery) * priceStep;
    } else if (shopItem.type === 'ascension') {
      const baseCost = Math.max(1, Number(shopItem.cost) || 1);
      const purchaseCount = Math.max(0, Number(ascensionPillPurchases[shopItem.id]) || 0);
      const multiplier = Math.max(1, Number(shopItem.priceMultiplier) || 2);
      total += baseCost * Math.pow(multiplier, purchaseCount + index);
    } else {
      total += Math.max(1, Number(shopItem.cost) || 1);
    }
  }
  return Math.max(1, Math.round(total));
}

function buyShopItem(itemId, amount = 1) {
  if (busy) return;

  const shopItem = shopItems.find((item) => item.id === itemId);
  if (!shopItem || !canBuyShopItem(shopItem)) return;
  const requested = clamp(Math.floor(Number(amount) || 1), 1, maxShopPurchaseQuantity);
  const previewTotal = getShopPurchaseTotal(shopItem, requested);
  if (previewTotal > playerSpiritStones) {
    setShopMessage(`Không đủ linh thạch để mua ${requested} ${shopItem.name}.`);
    return;
  }
  const confirmationText = requested > 1
    ? `Mua ${requested} ${shopItem.name} với tổng giá ${formatGameNumber(previewTotal)} linh thạch?`
    : `Mua ${shopItem.name} với giá ${formatGameNumber(previewTotal)} linh thạch?`;
  if ((requested > 1 || getShopItemCost(shopItem) > 300) && !window.confirm(confirmationText)) return;

  let purchased = 0;
  let lastItem = null;
  while (purchased < requested && canBuyShopItem(shopItem)) {
    const shopCost = getShopItemCost(shopItem);
    if (playerSpiritStones < shopCost) break;
    playerSpiritStones -= shopCost;

    if (shopItem.type === 'equipment') {
      const availableSlots = equipmentSlots.filter((slot) => (
        !Array.isArray(shopItem.equipmentSlotIds) || shopItem.equipmentSlotIds.includes(slot.id)
      ));
      const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)] || equipmentSlots[0];
      const itemLevel = Math.max(1, Math.min(playerLevel, currentStage.enemyLevel));
      lastItem = createEquipmentItem(slot.id, itemLevel, shopItem.rarityKey);
      inventory.unshift(lastItem);
    }

    if (shopItem.type === 'equipmentRandom') {
      const rewardMap = getBestUnlockedWanderMap();
      const rarityKey = getEquipmentRarityKey({ mapId: rewardMap.id });
      const slot = equipmentSlots[Math.floor(Math.random() * equipmentSlots.length)];
      const itemLevel = Math.max(1, Math.min(playerLevel, currentStage.enemyLevel));
      lastItem = createEquipmentItem(slot.id, itemLevel, rarityKey);
      inventory.unshift(lastItem);
    }

    if (shopItem.type === 'equipmentChest') {
      const majorRealmIndex = Math.max(0, (Number(shopItem.equipmentMajorRealmId) || 1) - 1);
      addEquipmentChest({ majorRealmIndex }, {
        chestTier: Math.max(1, Number(shopItem.equipmentChestTier) || 1),
        rarityProfile: getEquipmentRarityProfile({ majorRealmIndex: playerMajorRealmIndex }),
      });
    }

    if (shopItem.type === 'enhancementStone') {
      enhancementStones += Math.max(1, Number(shopItem.amount) || 1);
    }

    if (shopItem.type === 'cultivation' || shopItem.type === 'foundation' || shopItem.type === 'ascension') {
      addShopInventoryItem(shopItem.id);
    }

    if (shopItem.type === 'skillBook') {
      const skill = cultivationSkills.find((entry) => entry.id === shopItem.skillId && entry.schoolId === playerSchoolId);
      if (skill) {
        const bookAmount = Math.max(1, Number(shopItem.amount) || 1);
        skillBooks[skill.id] = getSkillBookCount(skill.id) + bookAmount;
      }
    }

    if (shopItem.type === 'cultivation') {
      cultivationPillPurchases[shopItem.id] = (cultivationPillPurchases[shopItem.id] || 0) + 1;
    }

    if (shopItem.type === 'foundation') {
      const realmIndex = playerMajorRealmIndex;
      foundationPillPurchases[realmIndex] = (foundationPillPurchases[realmIndex] || 0) + 1;
      playerFoundation += getFoundationPillAmount(shopItem);
    }

    if (shopItem.type === 'potion') {
      if (shopItem.potionType === 'health') healthPotionCount += 1;
      if (shopItem.potionType === 'mana') manaPotionCount += 1;
      potionPurchaseCounts[shopItem.id] = (potionPurchaseCounts[shopItem.id] || 0) + 1;
    }

    if (shopItem.type === 'ascension') {
      ascensionPillPurchases[shopItem.id] = (ascensionPillPurchases[shopItem.id] || 0) + 1;
    }
    purchased += 1;
  }

  if (!purchased) return;
  enforceEquipmentInventoryLimit();
  const suffix = purchased > 1 ? ` x${purchased}` : '';
  if (shopItem.type === 'cultivation' || shopItem.type === 'foundation' || shopItem.type === 'ascension') {
    setShopMessage(`Đã mua ${shopItem.name}${suffix}, đã chuyển vào Túi đồ.`);
  } else if (shopItem.type === 'equipment' || shopItem.type === 'equipmentRandom') {
    setShopMessage(`Đã mua${suffix}: ${lastItem ? `${getRarityName(lastItem)} ${lastItem.name}` : shopItem.name}.`);
  } else if (shopItem.type === 'equipmentChest') {
    const chestTier = Math.max(1, Number(shopItem.equipmentChestTier) || 1);
    const [minLevel, maxLevel] = getEquipmentLevelRange({ chestTier });
    setShopMessage(`Đã mua ${shopItem.name}${suffix}, mở ra trang bị cấp ${minLevel}-${maxLevel} trong Túi đồ.`);
  } else if (shopItem.type === 'potion') {
    setShopMessage(`Đã mua ${shopItem.name}${suffix}.`);
  } else if (shopItem.type === 'skillBook') {
    setShopMessage(`Đã mua ${shopItem.name}${suffix}, đã chuyển vào Túi đồ.`);
  } else {
    setShopMessage(`Đã mua ${shopItem.name}${suffix}.`);
  }

  renderCultivation();
  renderEquipment();
  renderInventory();
  renderShop();
  saveGame();
}

function canBuyShopItem(shopItem) {
  if (playerSpiritStones < getShopItemCost(shopItem)) return false;
  if (shopItem.requiredLevel && playerLevel < shopItem.requiredLevel) return false;
  if (shopItem.type === 'skillBook' && (
    shopItem.schoolId !== playerSchoolId
    || getPlayerCultivationTier() < getShopSkillRequiredTier(shopItem)
    || getSkillLevel(shopItem.skillId) >= getSkillMaxLevel()
  )) return false;
  if (Number.isInteger(shopItem.requiredMajorRealmIndex)
    && playerMajorRealmIndex < shopItem.requiredMajorRealmIndex) return false;
  if (shopItem.requiredMapId && !isWanderMapUnlocked(wanderMaps[shopItem.requiredMapId])) return false;
  if (shopItem.type === 'foundation' && !canBuyFoundationPill(shopItem)) return false;
  if (shopItem.type === 'ascension') {
    return true;
  }
  return true;
}

function normalizeFoundationPillPurchases(purchases = {}) {
  return Object.fromEntries(Object.entries(purchases || {}).map(([realmIndex, count]) => [
    realmIndex,
    Math.max(0, Number(count) || 0),
  ]));
}

function getFoundationPillAmount(shopItem) {
  return Math.max(1, Number(shopItem.foundationByMajorRealm?.[playerMajorRealmIndex]) || 1);
}

function getShopItemCost(shopItem) {
  if (shopItem.type === 'foundation' && Array.isArray(shopItem.costByMajorRealm)) {
    return Math.max(1, Number(shopItem.costByMajorRealm[playerMajorRealmIndex]) || shopItem.cost || 1);
  }
  if (shopItem.type === 'cultivation') {
    const baseCost = Math.max(1, Number(shopItem.cost) || 1);
    const priceStep = Math.max(0, Number(shopItem.priceStep) || 0);
    const purchases = Math.max(0, Number(cultivationPillPurchases[shopItem.id]) || 0);
    return Math.max(1, Math.round(baseCost + priceStep * purchases));
  }
  if (shopItem.type === 'ascension') {
    const baseCost = Math.max(1, Number(shopItem.cost) || 1);
    const purchaseCount = Math.max(0, Number(ascensionPillPurchases[shopItem.id]) || 0);
    const multiplier = Math.max(1, Number(shopItem.priceMultiplier) || 2);
    return Math.max(1, Math.round(baseCost * Math.pow(multiplier, purchaseCount)));
  }
  if (shopItem.type === 'potion') {
    const baseCost = Math.max(1, Number(shopItem.cost) || 5);
    const priceStep = Math.max(1, Number(shopItem.priceStep) || 5);
    const purchaseCount = Math.max(0, Number(potionPurchaseCounts[shopItem.id]) || 0);
    const increaseEvery = Math.max(1, Number(shopItem.priceIncreaseEvery) || 5);
    return baseCost + Math.floor(purchaseCount / increaseEvery) * priceStep;
  }
  return Math.max(1, Number(shopItem.cost) || 1);
}

function canBuyFoundationPill(shopItem) {
  const limit = Math.max(1, Number(shopItem.maxPurchasesPerMajorRealm) || 1);
  return (foundationPillPurchases[playerMajorRealmIndex] || 0) < limit;
}

function normalizeCultivationPillPurchases(purchases = {}) {
  return Object.fromEntries(Object.entries(purchases || {}).map(([itemId, count]) => [
    itemId,
    Math.max(0, Math.floor(Number(count) || 0)),
  ]));
}

function normalizeShopInventoryCounts(counts = {}) {
  return Object.fromEntries(Object.entries(counts || {}).map(([itemId, count]) => [
    itemId,
    Math.max(0, Math.floor(Number(count) || 0)),
  ]));
}

function getShopInventoryCount(itemId) {
  return Math.max(0, Math.floor(Number(shopInventoryCounts[itemId]) || 0));
}

function addShopInventoryItem(itemId, amount = 1) {
  shopInventoryCounts[itemId] = getShopInventoryCount(itemId) + Math.max(0, Math.floor(Number(amount) || 0));
}

function setShopMessage(message) {
  $('shopMessage').textContent = message;
  showGameToast(message, /^Không đủ|^Chưa/.test(message) ? 'error' : 'success');
}

function usePotion(type, amount = 1) {
  if (busy) return 0;

  syncPlayerResourceCaps();
  const max = getPlayerMaxResources();
  const requested = Math.max(1, Math.floor(Number(amount) || 1));
  let used = 0;

  for (let index = 0; index < requested; index += 1) {
    if (type === 'health') {
      if (healthPotionCount <= 0 || playerCurrentHp >= max.maxHp) break;
      healthPotionCount -= 1;
      playerCurrentHp = Math.min(max.maxHp, playerCurrentHp + Math.ceil(max.maxHp * getPotionRecoveryPercent('health')));
      used += 1;
    }

    if (type === 'mana') {
      if (manaPotionCount <= 0 || playerCurrentMana >= max.maxMana) break;
      manaPotionCount -= 1;
      playerCurrentMana = Math.min(max.maxMana, playerCurrentMana + Math.ceil(max.maxMana * getPotionRecoveryPercent('mana')));
      used += 1;
    }
  }

  if (!used) return 0;
  const potionName = type === 'health' ? 'Sinh Huyết Đan' : 'Tụ Linh Đan';
  showGameToast(`Đã dùng ${potionName}${used > 1 ? ` x${used}` : ''}.`, 'success');
  renderCultivation();
  renderStageMap();
  renderInventory();
  if (!stageDetailPanel.classList.contains('is-hidden') && selectedStage) renderStageDetail(selectedStage);
  saveGame();
  return used;
}

function getPotionRecoveryPercent(potionType) {
  const item = shopItems.find((shopItem) => shopItem.type === 'potion' && shopItem.potionType === potionType);
  return Math.max(0, Math.min(1, Number(item?.recoveryPercent) || 0.25));
}

function regenerateResources() {
  if (busy) return;

  syncPlayerResourceCaps();
  const max = getPlayerMaxResources();
  const oldHp = playerCurrentHp;
  const oldMana = playerCurrentMana;
  const cultivationGain = getPassiveCultivationGain();
  const homeActive = isCultivationHomeActive();
  const hpRegen = getPassiveHpGain(max);
  const manaRegen = getPassiveManaGain(max);

  playerCurrentHp = Math.min(max.maxHp, playerCurrentHp + hpRegen);
  playerCurrentMana = Math.min(max.maxMana, playerCurrentMana + manaRegen);
  const actualCultivationGain = addPlayerCultivation(cultivationGain);
  const skillPracticeChanged = homeActive && gainSkillPractice(1);

  if (oldHp !== playerCurrentHp || oldMana !== playerCurrentMana || actualCultivationGain > 0 || skillPracticeChanged) {
    renderCultivation();
    renderStageMap();
    if (!stageDetailPanel.classList.contains('is-hidden') && selectedStage) renderStageDetail(selectedStage);
    if (!profilePanel.classList.contains('is-hidden')) renderProfile();
    saveGame();
  }
}

function getPassiveCultivationGain() {
  return getTrainingCultivationRate();
}

function getTrainingCultivationRate() {
  if (isMajorAscensionGate()) return 0;
  return Math.max(0, playerFoundation + cultivationSpeedBonus);
}

function getPassiveHpGain(max = getPlayerMaxResources()) {
  return Math.ceil(max.maxHp * 0.01);
}

function getPassiveManaGain(max = getPlayerMaxResources()) {
  return Math.ceil(max.maxMana * 0.01);
}

function isCultivationHomeActive() {
  return !trainingPanel.classList.contains('is-hidden') &&
    mapPanel.classList.contains('is-hidden') &&
    stageDetailPanel.classList.contains('is-hidden') &&
    battlePanel.classList.contains('is-hidden') &&
    profilePanel.classList.contains('is-hidden') &&
    equipmentPanel.classList.contains('is-hidden') &&
    shopPanel.classList.contains('is-hidden');
}

function canEnterDungeon() {
  syncPlayerResourceCaps();
  const max = getPlayerMaxResources();
  return playerCurrentHp > max.maxHp * 0.5;
}

function getPlayerMaxResources() {
  const snapshot = createFighter(playerName, playerLevel, true);
  return { maxHp: snapshot.maxHp, maxMana: snapshot.maxMana };
}

function syncPlayerResourceCaps() {
  const max = getPlayerMaxResources();
  if (playerCurrentHp === null) playerCurrentHp = max.maxHp;
  if (playerCurrentMana === null) playerCurrentMana = max.maxMana;
  playerCurrentHp = clamp(Math.ceil(playerCurrentHp), 0, max.maxHp);
  playerCurrentMana = clamp(Math.ceil(playerCurrentMana), 0, max.maxMana);
}

function applyPersistentResourcesToPlayer(fighter) {
  fighter.hp = clamp(playerCurrentHp, 0, fighter.maxHp);
  fighter.mana = clamp(playerCurrentMana, 0, fighter.maxMana);
}

function savePlayerResourcesFromBattle(outcome) {
  const minHpAfterLoss = Math.max(1, Math.ceil(player.maxHp * 0.05));
  playerCurrentHp = outcome === 'lose'
    ? minHpAfterLoss
    : clamp(Math.ceil(player.hp), 0, player.maxHp);
  playerCurrentMana = clamp(Math.floor(player.mana), 0, player.maxMana);
}

function applyVictoryRecovery(outcome) {
  if (outcome !== 'win' || !player?.victoryRecovery) return null;

  const hp = Math.ceil(player.maxHp * player.victoryRecovery);
  const mana = Math.ceil(player.maxMana * player.victoryRecovery);
  const beforeHp = playerCurrentHp;
  const beforeMana = playerCurrentMana;
  playerCurrentHp = Math.min(player.maxHp, playerCurrentHp + hp);
  playerCurrentMana = Math.min(player.maxMana, playerCurrentMana + mana);
  const recovered = { hp: playerCurrentHp - beforeHp, mana: playerCurrentMana - beforeMana };
  return recovered.hp > 0 || recovered.mana > 0 ? recovered : null;
}

function equipItem(itemId) {
  if (busy) return;
  const index = inventory.findIndex((item) => item.id === itemId);
  if (index < 0) return;

  const item = inventory[index];
  if (!canEquipEquipment(item)) {
    showGameToast(`Chưa đủ tu vi để mặc ${item.name}.`, 'error');
    return;
  }

  inventory.splice(index, 1);
  const oldItem = equippedItems[item.slotId];
  if (oldItem) inventory.unshift(oldItem);
  equippedItems[item.slotId] = item;
  enforceEquipmentInventoryLimit();
  equipmentEquipCounts[item.rarityKey] = (equipmentEquipCounts[item.rarityKey] || 0) + 1;
  refreshPlayerAfterEquipmentChange();
  showGameToast(`Đã mặc ${getRarityName(item)} ${item.name}.`, 'success');
}

function unequipItem(slotId) {
  if (busy || !equippedItems[slotId]) return;
  const item = equippedItems[slotId];
  inventory.unshift(equippedItems[slotId]);
  equippedItems[slotId] = null;
  enforceEquipmentInventoryLimit();
  refreshPlayerAfterEquipmentChange();
  showGameToast(`Đã tháo ${getRarityName(item)} ${item.name}.`, 'success');
}

function quickEquipBestItems() {
  if (busy) return;

  const allItems = [
    ...inventory,
    ...Object.values(equippedItems).filter(Boolean),
  ];
  const nextEquipped = Object.fromEntries(equipmentSlots.map((slot) => [slot.id, null]));
  const nextInventory = [];
  const equippedIds = new Set();
  const initiallyEquippedIds = new Set(Object.values(equippedItems).filter(Boolean).map((item) => item.id));

  equipmentSlots.forEach((slot) => {
    const candidates = allItems
      .filter((item) => item.slotId === slot.id && canEquipEquipment(item))
      .sort((a, b) => getItemPower(b) - getItemPower(a));

    if (candidates.length > 0) {
      nextEquipped[slot.id] = candidates[0];
      equippedIds.add(candidates[0].id);
    }
  });

  allItems.forEach((item) => {
    if (!equippedIds.has(item.id)) nextInventory.push(item);
  });

  Object.values(nextEquipped).filter(Boolean).forEach((item) => {
    if (!initiallyEquippedIds.has(item.id)) {
      equipmentEquipCounts[item.rarityKey] = (equipmentEquipCounts[item.rarityKey] || 0) + 1;
    }
  });

  equippedItems = nextEquipped;
  inventory = nextInventory.sort((a, b) => getItemPower(b) - getItemPower(a));
  enforceEquipmentInventoryLimit();
  refreshPlayerAfterEquipmentChange();
  showGameToast('Đã tự động trang bị bộ đồ có lực chiến cao nhất.', 'success');
}

function refreshPlayerAfterEquipmentChange() {
  syncPlayerResourceCaps();
  resetBattle();
  render();
  renderProfile();
  renderEquipment();
  saveGame();
}

function applyEquipmentStats(fighter) {
  applyItemStats(fighter, Object.values(equippedItems).filter(Boolean));
}

function applyItemStats(fighter, items) {
  const stats = {};
  const specials = {};
  items.forEach((item) => {
    Object.entries(item.stats).forEach(([stat, value]) => {
      stats[stat] = (stats[stat] || 0) + value;
    });
    (item.specialLines || []).forEach((line) => {
      specials[line.id] = (specials[line.id] || 0) + line.value;
    });
  });
  applyStatsToFighter(fighter, stats);
  applySpecialsToFighter(fighter, specials);
  fighter.specialBonuses = specials;
}

function applyStatsToFighter(fighter, stats) {
  Object.entries(stats).forEach(([stat, value]) => {
    fighter[stat] += value;
  });

  fighter.accuracy = clamp(fighter.accuracy, 0.1, 0.98);
  fighter.dodgeRate = clamp(fighter.dodgeRate, 0, 0.45);
  fighter.blockRate = clamp(fighter.blockRate, 0, 0.55);
  fighter.blockReduction = 0.8;
  fighter.critRate = clamp(fighter.critRate, 0, 0.75);
  fighter.critDamage = Math.max(1.5, fighter.critDamage);
}

function applySpecialsToFighter(fighter, specials) {
  const getSpecial = (id) => Math.max(0, Number(specials[id]) || 0);
  fighter.lifeSteal += getSpecial('lifeSteal');
  fighter.armorPierce += getSpecial('armorPierce');
  fighter.spiritStoneBonus += getSpecial('spiritStoneBonus');
  fighter.damageReduction += getSpecial('damageReduction');
  fighter.dodgeRate += getSpecial('dodgeRate');
  fighter.critDamage += getSpecial('critDamage');
  fighter.reflectDamage = getSpecial('reflectDamage');
  fighter.maxHp = Math.max(1, Math.round(fighter.maxHp * (1 + getSpecial('maxHpPercent'))));
  fighter.maxMana = Math.max(0, Math.round(fighter.maxMana * (1 + getSpecial('maxManaPercent'))));
  fighter.attack = Math.max(1, Math.round(fighter.attack * (1 + getSpecial('attackPercent'))));
  fighter.defense = Math.max(0, Math.round(fighter.defense * (1 + getSpecial('defensePercent'))));

  fighter.lifeSteal = clamp(fighter.lifeSteal, 0, 0.35);
  fighter.armorPierce = clamp(fighter.armorPierce, 0, 0.55);
  fighter.damageReduction = clamp(fighter.damageReduction, 0, 0.9);
  fighter.dodgeRate = clamp(fighter.dodgeRate, 0, 0.45);
  fighter.critDamage = Math.max(1.5, fighter.critDamage);
  fighter.reflectDamage = clamp(fighter.reflectDamage, 0, 0.9);
  fighter.victoryRecovery = clamp(fighter.victoryRecovery, 0, 0.35);
  fighter.spiritStoneBonus = clamp(fighter.spiritStoneBonus, 0, 0.8);
}

function getEquippedStats() {
  const total = {};
  Object.values(equippedItems).filter(Boolean).forEach((item) => {
    Object.entries(item.stats).forEach(([stat, value]) => {
      total[stat] = (total[stat] || 0) + value;
    });
  });
  return total;
}

function getEquippedSpecials() {
  const total = {};
  Object.values(equippedItems).filter(Boolean).forEach((item) => {
    (item.specialLines || []).forEach((line) => {
      total[line.id] = (total[line.id] || 0) + line.value;
    });
  });
  return total;
}

function getEquipmentPower() {
  const stats = getEquippedStats();
  return getStatsPower(stats, false) + getSpecialsPower(getEquippedSpecials());
}

function getCombatPower(fighter) {
  return getStatsPower(fighter)
    + getSpecialsPower(fighter.specialBonuses || {})
    + getEquippedSkillCombatPower(fighter.skills || []);
}

function getItemPower(item) {
  return getStatsPower(item.stats, false)
    + getSpecialLinesPower(item.specialLines || []);
}

function getStatsPower(stats, subtractBaseValues = true) {
  const rawPower = combatStatDefinitions.reduce((total, definition) => {
    if (definition.countsTowardCombatPower === false) return total;
    const value = Number(stats?.[definition.id]) || 0;
    const baseValue = Number(definition.baseValue);
    const powerValue = subtractBaseValues && Number.isFinite(baseValue)
      ? Math.max(0, value - baseValue)
      : value;
    return total + powerValue * (Number(definition.powerPerPoint) || 0);
  }, 0);

  return Math.round(rawPower);
}

function getSpecialLinesPower(lines) {
  return Math.round((lines || []).reduce((total, line) => {
    const definition = specialLineData.find((item) => item.id === line.id);
    return total + line.value * (definition?.power || 800);
  }, 0));
}

function getSpecialsPower(source) {
  const lines = specialLineData
    .map((definition) => ({ id: definition.id, value: source[definition.id] || 0 }))
    .filter((line) => line.value > 0);
  return getSpecialLinesPower(lines);
}

function formatAttackLog(attacker, result) {
  const action = result.skill ? `dùng ${result.skillName || attacker.skillName}` : result.critical ? 'bạo kích' : 'ra đòn';
  if (result.dodged) return `Lượt ${turn}: ${attacker.name} ${action}, mục tiêu né tránh.`;
  const extras = [
    result.blocked ? 'đỡ đòn' : '',
    result.pierced ? 'phá giáp' : '',
    result.heal > 0 ? `hấp huyết +${formatGameNumber(result.heal)}` : '',
    result.reflectDamage > 0 ? `phản chấn ${formatGameNumber(result.reflectDamage)}` : '',
    result.manaRefunded > 0 ? `hoàn linh lực +${formatGameNumber(result.manaRefunded)}` : '',
    ...(result.effectTexts || []),
  ].filter(Boolean);
  const bonusText = result.bonusHit
    ? result.bonusHit.dodged
      ? ' Thi triển lần 2 nhưng mục tiêu né tránh.'
      : ` Thi triển lần 2 gây ${formatGameNumber(result.bonusHit.damage)} sát thương${result.bonusHit.blocked ? ' (đỡ đòn)' : ''}.`
    : '';
  return `Lượt ${turn}: ${attacker.name} ${action} gây ${formatGameNumber(result.damage)} sát thương${extras.length ? ` (${extras.join(', ')})` : ''}.${bonusText}`;
}

function animateAttack(sourceId, targetId, floatId, result, attacker) {
  const source = $(sourceId);
  const target = $(targetId);
  const sourceAvatar = source?.querySelector('.avatar');
  const targetAvatar = target?.querySelector('.avatar');
  const motionClasses = ['attack-cast', 'skill-cast', 'hit-pulse', 'critical-hit', 'block-pulse', 'evade-pulse'];
  const sourceMotion = result.skill ? 'skill-cast' : 'attack-cast';
  const targetMotion = result.dodged
    ? 'evade-pulse'
    : result.blocked
    ? 'block-pulse'
    : result.critical
    ? 'critical-hit'
    : 'hit-pulse';
  motionClasses.forEach((className) => {
    source.classList.remove(className);
    target.classList.remove(className);
    sourceAvatar?.classList.remove(className);
    targetAvatar?.classList.remove(className);
  });
  void source.offsetWidth;
  source.classList.add(sourceMotion);
  sourceAvatar?.classList.add(sourceMotion);
  void target.offsetWidth;
  target.classList.add(targetMotion);
  targetAvatar?.classList.add(targetMotion);
  window.setTimeout(() => {
    motionClasses.forEach((className) => {
      source.classList.remove(className);
      target.classList.remove(className);
      sourceAvatar?.classList.remove(className);
      targetAvatar?.classList.remove(className);
    });
  }, 420);

  source.classList.remove('shake');
  void source.offsetWidth;
  source.classList.add('shake');

  if (!result.dodged) {
    target.classList.remove('flash');
    void target.offsetWidth;
    target.classList.add('flash');
  }

  if (result.skill) spawnFloat($(sourceId).querySelector('.float-layer'), result.skillName || attacker.skillName, 'skill-name');
  const text = result.dodged ? 'NÉ' : result.blocked ? `ĐỠ -${formatGameNumber(result.damage)}` : result.critical ? `BẠO -${formatGameNumber(result.damage)}!` : `-${formatGameNumber(result.damage)}`;
  spawnFloat($(floatId), text, result.dodged ? 'dodge' : result.blocked ? 'block' : result.critical ? 'crit' : result.skill ? 'skill' : '');
  if (result.heal > 0) spawnFloat($(sourceId).querySelector('.float-layer'), `+${formatGameNumber(result.heal)}`, 'heal');
}

function spawnFloat(parent, text, className) {
  const el = document.createElement('div');
  el.className = `float-text ${className}`;
  el.textContent = text;
  parent.appendChild(el);
  window.setTimeout(() => el.remove(), 1250);
}

function render() {
  renderFighter('player', player);
  renderFighter('enemy', enemy);
  renderBattleVisuals();
  renderCultivation();
  setTurnLabel(`Lượt ${turn}/${maxTurns}`);
}

function renderBattleVisuals() {
  const playerAvatar = document.querySelector('#playerCard .avatar');
  const enemyAvatar = document.querySelector('#enemyCard .avatar');
  if (playerAvatar) {
    playerAvatar.classList.remove('school-sword', 'school-blade', 'school-martial');
    playerAvatar.classList.add('chibi-character', getSchoolVisualClass());
  }
  if (enemyAvatar) {
    [...enemyAvatar.classList]
      .filter((className) => className.startsWith('enemy-'))
      .forEach((className) => enemyAvatar.classList.remove(className));
    enemyAvatar.classList.add('chibi-enemy', getEnemyVisualClass(currentStage?.enemyData));
  }
}

function renderCultivation() {
  syncPlayerResourceCaps();
  transferDantianCultivationToBar();
  const required = getCultivationRequiredForNextLevel();
  const capped = Math.min(playerCultivation, required);
  const winReward = getPreviewReward(currentStage, 'win');
  const stoneDrop = getSpiritStonePreviewRange(currentStage);
  const dungeonConfig = getDungeonConfig();
  const attemptSuffix = dungeonConfig.unlimited
    ? ''
    : ` Còn ${getRemainingDungeonAttempts(dungeonConfig.id)}/${dailyFarmLimit} lượt hôm nay.`;
  const playerSnapshot = createFighter(playerName, playerLevel, true);
  const resourceView = getVisiblePlayerResources();
  $('playerCultivationRealm').innerHTML = `<i class="activity-icon icon-activity-lotus" aria-hidden="true"></i>${player.realm} cảnh ${player.minorRealm}`;
  renderPlayerAvatar();
  $('playerCultivationText').textContent = `${formatGameNumber(capped)}/${formatGameNumber(required)}`;
  $('playerPowerText').innerHTML = `<i class="unique-icon icon-unique-power" aria-hidden="true"></i>Lực chiến ${formatGameNumber(getCombatPower(playerSnapshot))}`;
  $('playerSpiritStoneText').innerHTML = `<i class="unique-icon icon-unique-spirit-stone" aria-hidden="true"></i>Linh thạch ${formatGameNumber(playerSpiritStones)}`;
  $('playerCultivationBar').style.width = `${(capped / required) * 100}%`;
  $('playerReserveHpText').textContent = `${formatGameNumber(resourceView.hp)}/${formatGameNumber(playerSnapshot.maxHp)}`;
  $('playerReserveManaText').textContent = `${formatGameNumber(resourceView.mana)}/${formatGameNumber(playerSnapshot.maxMana)}`;
  $('playerReserveHpBar').style.width = `${(resourceView.hp / playerSnapshot.maxHp) * 100}%`;
  $('playerReserveManaBar').style.width = `${(resourceView.mana / playerSnapshot.maxMana) * 100}%`;
  $('trainingRateText').textContent = `Tu vi +${formatGameNumber(getTrainingCultivationRate())}/giây`;
  if ($('skillsList')) renderSkills();
  if ($('questList')) renderQuests();
  $('dantianCultivationText').textContent = `${formatGameNumber(dantianCultivation)}/${formatGameNumber(getDantianCultivationCap())} tu vi dự trữ`;
  useHealthPotionButton.textContent = `Sinh Huyết Đan x${healthPotionCount}`;
  useManaPotionButton.textContent = `Tụ Linh Đan x${manaPotionCount}`;
  useHealthPotionButton.disabled = busy || healthPotionCount <= 0 || resourceView.hp >= playerSnapshot.maxHp;
  useManaPotionButton.disabled = busy || manaPotionCount <= 0 || resourceView.mana >= playerSnapshot.maxMana;
  $('rewardPreview').textContent = canEnterDungeon()
    ? `${dungeonConfig.name}: thắng ${currentStage.title} nhận ${formatGameNumber(winReward)} tu vi, rớt ${formatGameNumber(stoneDrop.min)}-${formatGameNumber(stoneDrop.max)} linh thạch; thua không nhận tu vi.${attemptSuffix}`
    : 'Sinh lực dưới 15%, không thể ngao du. Dùng Sinh Huyết Đan hoặc chờ hồi phục.';
  breakthroughButton.disabled = busy || !canBreakthrough();
  breakthroughButton.textContent = getBreakthroughButtonText();
  updateNotificationBadges();
  updateBattleActionAvailability();
}

function absorbDantianCultivation() {
  if (busy || dantianCultivation <= 0) return;
  const gained = transferDantianCultivationToBar();
  if (gained > 0) {
    setSubtitle(`Đã chuyển ${formatGameNumber(gained)} tu vi từ Đan điền.`);
    showGameToast(`Đã chuyển ${formatGameNumber(gained)} tu vi từ Đan điền.`, 'success');
  } else {
    setSubtitle('Tu vi hiện tại đã đầy, Đan điền vẫn giữ nguyên tu vi dự trữ.');
    showGameToast('Thanh tu vi đã đầy, chưa thể chuyển thêm tu vi.', 'error');
  }
  renderCultivation();
  renderProfile();
  saveGame();
}

function getBreakthroughButtonText() {
  if (playerLevel < playerMaxMinorLevel) return 'Đột phá';
  if (!hasNextMajorRealm()) return 'Chưa mở';
  return getShopInventoryCount('majorAscensionPermit') > 0
    ? `Thăng ${getNextMajorRealmName()}`
    : 'Dùng Phá Cảnh Đan';
}

function updateBattleActionAvailability() {
  if (!battleOver) return;
  if (startButton.textContent === 'Tiếp tục' || startButton.textContent === 'Về tu luyện') {
    startButton.disabled = false;
    return;
  }
  startButton.disabled = !canEnterDungeon();
}

function getVisiblePlayerResources() {
  if (!battlePanel.classList.contains('is-hidden') && player) {
    return {
      hp: Math.ceil(player.hp),
      mana: Math.floor(player.mana),
    };
  }

  return {
    hp: playerCurrentHp,
    mana: playerCurrentMana,
  };
}

function formatSkillEffects(skill, level = getSkillLevel(skill.id)) {
  const effects = getSkillEffects(skill, level).map((effect) => {
    const chance = Number(effect.chance);
    const chanceText = Number.isFinite(chance) && chance < 1 ? `${toPercent(chance)}: ` : '';
    if (effect.type === 'extraCast') {
      return `${toPercent(chance)} cơ hội thi triển kỹ năng lần 2, không tiêu hao thêm linh lực và không lặp trong cùng lượt`;
    }
    if (effect.type === 'manaRefund') {
      return `${toPercent(chance)} cơ hội hoàn lại linh lực vừa sử dụng`;
    }
    if (effect.type === 'selfBuff') {
      const value = Number(effect.value) || 0;
      const amount = isPercentStat(effect.stat) ? toPercent(value) : value;
      return `${chanceText}tăng ${getStatLabel(effect.stat)} +${isPercentStat(effect.stat) ? amount : formatGameNumber(amount)} trong ${effect.duration || 1} lượt, không cộng dồn`;
    }
    if (effect.type === 'healPercent') return `${chanceText}Hồi ${toPercent(effect.value)} sinh lực`;
    return `${chanceText}${effect.type}`;
  });
  return effects.join(' · ') || 'Không có hiệu ứng thêm';
}

function formatSkillDisplayNote(skill, level = getSkillLevel(skill.id)) {
  const parts = [`Gây ${Math.round(getSkillMultiplier(skill, level) * 100)}% Công lên kẻ địch`];
  const effectText = formatSkillEffects(skill, level);
  if (effectText !== 'Không có hiệu ứng thêm') parts.push(effectText);
  const cooldownText = `thời gian hồi ${Math.max(1, Number(skill.cooldown) || 1)} lượt`;
  return `${parts.join(' và ')}; ${cooldownText}.`;
}

function renderSkills() {
  const skills = getPlayerSkills().filter((skill) => isSkillLearned(skill.id));
  const maxEquipped = getMaxEquippedSkills();
  $('skillSlotText').textContent = `Ô skill: ${equippedSkillIds.length}/${maxEquipped}`;
  $('skillPowerText').textContent = `LC skill: ${formatGameNumber(getEquippedSkillCombatPower(skills.filter((skill) => equippedSkillIds.includes(skill.id))))}`;
  $('skillsList').innerHTML = skills.length ? skills.map((skill) => {
    const equipped = equippedSkillIds.includes(skill.id);
    const level = getSkillLevel(skill.id);
    const maxLevel = getSkillMaxLevel();
    const nextLevel = level + 1;
    const bookCount = getSkillBookCount(skill.id);
    const bookRequired = getSkillBookRequired(nextLevel);
    const skillPower = getSkillCombatPower(skill, level);
    const practice = getSkillPractice(skill.id);
    const practiceRequired = getSkillPracticeRequired(skill, nextLevel);
    const practicePercent = getSkillPracticePercent(skill, practice);
    const practiceReady = level < maxLevel && practice >= practiceRequired;
    const bookReady = !bookRequired || bookCount >= bookRequired;
    const canUpgrade = level < maxLevel && practiceReady && bookReady;
    const upgradeText = bookRequired
      ? `Nâng cấp · cần ${bookRequired} sách skill`
      : 'Nâng cấp';
    const active = skill.id === skillTrainingId && !practiceReady && level < maxLevel;
    const equipText = equipped
      ? 'Tháo skill'
      : equippedSkillIds.length >= maxEquipped
      ? 'Đầy ô skill'
      : getPlayerCultivationTier() < getSkillRequiredTier(skill)
      ? `Yêu cầu ${getTierRealmText(getSkillRequiredTier(skill))}`
      : 'Trang bị';
    const trainingText = level >= maxLevel
      ? 'Đã đạt cấp tối đa'
      : practiceReady
      ? 'Đủ 100%, chờ nâng cấp'
      : active
      ? 'Đang tu luyện'
      : 'Tu luyện';
    return `
      <div class="feature-item grade-${skill.gradeId || 'mortal'} ${active ? 'active' : ''}">
        <strong class="skill-title"><i class="${getSkillItemIconClass(skill.id).startsWith('icon-skill-item-') ? 'skill-item-icon' : 'item-icon'} ${getSkillItemIconClass(skill.id)}" aria-hidden="true"></i><span class="skill-name">${skill.name}</span><small class="skill-grade">${getSkillGradeName(skill)}</small><span class="skill-level">+${level}</span><span class="skill-power">LC ${formatGameNumber(skillPower)}</span></strong>
        <small class="skill-mana-cost"><i class="stat-icon icon-stat-mana" aria-hidden="true"></i>Linh lực cần ${formatGameNumber(skill.cost)}</small>
        <small class="skill-effect-line">${formatSkillDisplayNote(skill, level)}</small>
        <div class="skill-practice-label"><span>Tu luyện ${practice}/${level >= maxLevel ? 'Tối đa' : practiceRequired}</span><strong>${level >= maxLevel ? 'Đã viên mãn' : `${practicePercent}%`}</strong></div>
        <div class="skill-practice-bar"><i style="width: ${practicePercent}%"></i></div>
        <div class="skill-actions">
          <button type="button" class="${active ? 'breakthrough' : 'secondary'} compact" ${level >= maxLevel || practiceReady ? 'disabled' : ''} data-skill-action="select" data-skill-id="${skill.id}">${trainingText}</button>
          <button type="button" class="${canUpgrade ? 'breakthrough skill-upgrade-ready' : 'secondary'} compact" ${canUpgrade ? '' : 'disabled'} data-skill-action="upgrade" data-skill-id="${skill.id}">${upgradeText}</button>
        </div>
        <button type="button" class="secondary compact" ${!equipped && (equippedSkillIds.length >= maxEquipped || getPlayerCultivationTier() < getSkillRequiredTier(skill)) ? 'disabled' : ''} data-skill-action="equip" data-skill-id="${skill.id}">${equipText}</button>
      </div>
    `;
  }).join('') : '<div class="inventory-empty"><i class="stat-icon icon-stat-skill" aria-hidden="true"></i><span>Chưa học skill nào.</span></div>';
}

function selectSkillTraining(skillId) {
  if (busy) return;
  const skill = getPlayerSkills().find((entry) => entry.id === skillId);
  if (!skill || !isSkillLearned(skill.id)) return;
  const level = getSkillLevel(skill.id);
  const practiceRequired = getSkillPracticeRequired(skill, level + 1);
  if (level >= getSkillMaxLevel() || getSkillPractice(skill.id) >= practiceRequired) {
    skillTrainingId = '';
    $('skillsMessage').textContent = `${skill.name} đã đạt 100%, hãy nâng cấp trước khi tu luyện tiếp.`;
    renderSkills();
    saveGame();
    return;
  }
  skillTrainingId = skill.id;
  $('skillsMessage').textContent = `Đang tu luyện ${skill.name}.`;
  renderSkills();
  saveGame();
}

function learnSkill(skillId) {
  if (busy) return;
  const skill = getPlayerSkills().find((entry) => entry.id === skillId);
  if (!skill || isSkillLearned(skill.id)) return;
  if (getPlayerCultivationTier() < getSkillRequiredTier(skill)) {
    $('skillsMessage').textContent = `Chưa đủ tu vi để học ${skill.name}.`;
    showGameToast(`Chưa đủ tu vi để học ${skill.name}.`, 'error');
    return;
  }
  learnedSkillIds.push(skill.id);
  playerComprehension += 1;
  skillLevels[skill.id] = 0;
  skillPractice[skill.id] = 0;
  skillTrainingId = '';
  activeSkillId = skill.id;
  $('skillsMessage').textContent = `Đã học ${skill.name}. Hãy bấm Tu luyện để bắt đầu.`;
  showGameToast(`Đã học ${skill.name}.`, 'success');
  renderSkills();
  renderCultivation();
  renderProfile();
  saveGame();
}

function upgradeSkill(skillId) {
  if (busy) return;
  const skill = getPlayerSkills().find((entry) => entry.id === skillId);
  if (!skill || !isSkillLearned(skill.id)) return;
  const currentLevel = getSkillLevel(skill.id);
  const maxLevel = getSkillMaxLevel();
  if (currentLevel >= maxLevel) return;
  const targetLevel = currentLevel + 1;
  const practiceRequired = getSkillPracticeRequired(skill, targetLevel);
  const bookRequired = getSkillBookRequired(targetLevel);
  if (getSkillPractice(skill.id) < practiceRequired) {
    $('skillsMessage').textContent = `Cần tu luyện ${skill.name} đạt ${practiceRequired} trước.`;
    showGameToast(`Chưa đủ tiến độ để nâng ${skill.name}.`, 'error');
    return;
  }
  if (getSkillBookCount(skill.id) < bookRequired) {
    $('skillsMessage').textContent = `Cần ${bookRequired} quyển skill ${skill.name} để mở cấp ${targetLevel}.`;
    showGameToast(`Chưa đủ sách skill để nâng ${skill.name}.`, 'error');
    return;
  }
  if (bookRequired) skillBooks[skill.id] = getSkillBookCount(skill.id) - bookRequired;
  skillLevels[skill.id] = targetLevel;
  skillPractice[skill.id] = 0;
  if (skillTrainingId === skill.id) skillTrainingId = '';
  $('skillsMessage').textContent = `${skill.name} đã tăng lên cấp ${targetLevel}. Hãy bấm Chọn tu luyện để luyện tiếp.`;
  showGameToast(`${skill.name} đã nâng lên cấp ${targetLevel}.`, 'success');
  renderSkills();
  renderCultivation();
  renderProfile();
  saveGame();
}

function toggleEquipSkill(skillId) {
  if (busy) return;
  const skill = getPlayerSkills().find((entry) => entry.id === skillId);
  if (!skill || !isSkillLearned(skill.id)) return;
  const equippedIndex = equippedSkillIds.indexOf(skill.id);
  if (equippedIndex >= 0) {
    equippedSkillIds.splice(equippedIndex, 1);
    if (activeSkillId === skill.id) activeSkillId = equippedSkillIds[0] || '';
    $('skillsMessage').textContent = `Đã tháo ${skill.name}.`;
    showGameToast(`Đã tháo ${skill.name}.`, 'success');
  } else {
    if (getPlayerCultivationTier() < getSkillRequiredTier(skill)) {
      showGameToast(`Chưa đủ tu vi để trang bị ${skill.name}.`, 'error');
      return;
    }
    if (equippedSkillIds.length >= getMaxEquippedSkills()) {
      $('skillsMessage').textContent = `Cần tu vi để mở ô skill tiếp theo hoặc hãy tháo một skill.`;
      showGameToast('Chưa thể trang bị thêm skill.', 'error');
      return;
    }
    equippedSkillIds.push(skill.id);
    if (!activeSkillId) activeSkillId = skill.id;
    $('skillsMessage').textContent = `Đã trang bị ${skill.name}.`;
    showGameToast(`Đã trang bị ${skill.name}.`, 'success');
  }
  renderSkills();
  renderCultivation();
  renderProfile();
  saveGame();
}

function selectSkill(skillId) {
  if (busy) return;
  const skill = getPlayerSkills().find((entry) => entry.id === skillId);
  if (!skill || !isSkillLearned(skill.id)) return;
  activeSkillId = skill.id;
  $('skillsMessage').textContent = `Đã chọn ${skill.name}.`;
  renderSkills();
  renderCultivation();
  renderProfile();
  saveGame();
}

function getEquipmentEnhancementQualityMax(item) {
  const configured = progressionFeatures.enhancement.maxLevelByRarity?.[item.rarityKey];
  return Math.max(1, Number(configured) || 30);
}

function getEquipmentRequiredTier(rarityKey, itemLevel = 1) {
  const configured = progressionFeatures.enhancement.equipmentRequiredTierByRarity?.[rarityKey];
  return Math.max(1, Number(configured) || Number(itemLevel) || 1);
}

function canEquipEquipment(item) {
  return getPlayerCultivationTier() >= (Number(item.requiredTier) || getEquipmentRequiredTier(item.rarityKey, item.level));
}

function getCultivationEnhancementLimit() {
  return Math.max(1, getPlayerCultivationTier() + 5);
}

function getEquipmentEnhancementMax(item) {
  return Math.min(getEquipmentEnhancementQualityMax(item), getCultivationEnhancementLimit());
}

function getEnhancementCost(item) {
  const config = progressionFeatures.enhancement;
  const rarityMultiplier = Number(config.linhThachRarityMultiplier?.[item.rarityKey]) || 1;
  return Math.max(1, Math.round((Number(config.baseCost) || 12) * rarityMultiplier * Math.pow(
    Number(config.costGrowth) || 1.35,
    Math.max(0, Number(item.enhancementLevel) || 0),
  )));
}

function getEnhancementStatGrowth(stat) {
  const configured = progressionFeatures.enhancement.statGrowth || {};
  if (stat === 'critDamage') return Number(configured.critDamage) || 0.02;
  if (['maxHp', 'maxMana', 'attack', 'defense', 'speed'].includes(stat)) {
    return Number(configured.coreMultiplier) || 0.1;
  }
  return Number(configured.normalMultiplier) || 0.002;
}

function getEnhancedStatValue(stat, value) {
  const current = Math.max(0, Number(value) || 0);
  const growth = getEnhancementStatGrowth(stat);
  if (isPercentStat(stat)) return roundStat(current + growth);
  return Math.max(1, Math.round(current * (1 + growth)));
}

function getEnhancementStoneCost(item, targetLevel = (Number(item.enhancementLevel) || 0) + 1) {
  const perLevel = Math.max(1, Number(progressionFeatures.enhancement.stoneCostPerLevel) || 1);
  return Math.max(1, Math.floor(targetLevel) * perLevel);
}

function getEnhancementSuccessRate(targetLevel) {
  const config = progressionFeatures.enhancement;
  const baseRate = Number(config.successRateBase) || 1;
  const lossPerLevel = Number(config.successRateLossPerLevel) || 0.03;
  const minimumRate = Number(config.successRateMinimum) || 0.05;
  return Math.max(minimumRate, baseRate - Math.max(0, targetLevel - 1) * lossPerLevel);
}

function renderEnhancement() {
  $('enhancementStoneText').textContent = `Linh thạch: ${formatGameNumber(playerSpiritStones)} | Đá cường hóa: ${formatGameNumber(enhancementStones)}`;
  const enhancementItems = Object.values(equippedItems).filter(Boolean);
  $('enhancementList').innerHTML = enhancementItems.length
    ? enhancementItems.map((item) => {
      const qualityMax = getEquipmentEnhancementQualityMax(item);
      const maxLevel = getEquipmentEnhancementMax(item);
      const currentLevel = Number(item.enhancementLevel) || 0;
      const cost = getEnhancementCost(item);
      const targetLevel = currentLevel + 1;
      const stoneCost = getEnhancementStoneCost(item, targetLevel);
      const successRate = getEnhancementSuccessRate(targetLevel);
      const qualityMaxed = currentLevel >= qualityMax;
      const cultivationLocked = currentLevel >= maxLevel && !qualityMaxed;
      const maxed = qualityMaxed;
      const canEnhance = !maxed && !cultivationLocked
        && playerSpiritStones >= cost
        && enhancementStones >= stoneCost;
      return `
        <div class="feature-item enhancement-equipment-item ${rarityData[item.rarityKey].className}">
          ${renderEquippedEquipmentSummary(item, getSlotName(item.slotId))}
          <div class="enhancement-cost-grid">
            <span><i class="item-icon icon-item-enhancement-stone" aria-hidden="true"></i><b>${formatGameNumber(stoneCost)}</b> đá</span>
            <span><i class="game-icon icon-hammer" aria-hidden="true"></i><b>+${formatGameNumber(currentLevel)}/${formatGameNumber(qualityMax)}</b></span>
            <span><i class="unique-icon icon-unique-spirit-stone" aria-hidden="true"></i><b>${formatGameNumber(cost)}</b></span>
            <span><i class="stat-icon icon-stat-reward" aria-hidden="true"></i><b>${toPercent(successRate)}</b></span>
          </div>
          <small class="enhancement-limit-text">${maxed ? 'Đã đạt giới hạn phẩm cấp.' : cultivationLocked ? `Tu vi hiện tại chỉ mở đến +${maxLevel}.` : `Cần ${formatGameNumber(stoneCost)} đá và ${formatGameNumber(cost)} linh thạch để cường hóa lên +${targetLevel}.`}</small>
          <button type="button" class="secondary compact" data-enhance-item="${item.id}" ${canEnhance ? '' : 'disabled'}>
            <i class="game-icon icon-hammer" aria-hidden="true"></i>${maxed ? 'Đã tối đa phẩm cấp' : cultivationLocked ? `Tu vi chỉ mở đến +${maxLevel}` : canEnhance ? `Cường hóa lên +${targetLevel}` : stoneCost && enhancementStones < stoneCost ? `Cần ${formatGameNumber(stoneCost)} đá cường hóa` : `Cần ${formatGameNumber(cost)} linh thạch`}
          </button>
        </div>
      `;
    }).join('')
    : '<div class="inventory-empty"><i class="item-icon icon-item-enhancement-stone" aria-hidden="true"></i><span>Chưa có trang bị để cường hóa.</span></div>';
}

function enhanceEquipment(itemId) {
  if (busy) return;
  const item = Object.values(equippedItems).find((entry) => entry?.id === Number(itemId));
  if (!item) return;
  const maxLevel = getEquipmentEnhancementMax(item);
  const qualityMax = getEquipmentEnhancementQualityMax(item);
  const currentLevel = Number(item.enhancementLevel) || 0;
  const cost = getEnhancementCost(item);
  const targetLevel = currentLevel + 1;
  const stoneCost = getEnhancementStoneCost(item, targetLevel);
  if (currentLevel >= maxLevel || currentLevel >= qualityMax
    || playerSpiritStones < cost || enhancementStones < stoneCost) return;
  enhancementStones -= stoneCost;
  const successRate = getEnhancementSuccessRate(targetLevel);
  if (Math.random() > successRate) {
    const failureMessage = `${item.name} cường hóa thất bại ở cấp +${targetLevel}. Chỉ mất ${formatGameNumber(stoneCost)} đá cường hóa, không mất linh thạch. Tỉ lệ lần này: ${toPercent(successRate)}.`;
    $('enhancementMessage').textContent = failureMessage;
    showGameToast(`Cường hóa thất bại: ${item.name} ở cấp +${targetLevel}.`, 'error');
    renderEnhancement();
    renderCultivation();
    saveGame();
    return;
  }
  playerSpiritStones -= cost;
  item.enhancementLevel = currentLevel + 1;
  item.stats = Object.fromEntries(Object.entries(item.stats || {}).map(([stat, value]) => [
    stat,
    getEnhancedStatValue(stat, value),
  ]));
  item.specialLines = (item.specialLines || []).map((line) => ({
    ...line,
    value: getEnhancedStatValue(line.id, line.value),
  }));
  const successMessage = `${item.name} đã cường hóa lên +${item.enhancementLevel}. Chỉ số và lực chiến đã tăng.`;
  $('enhancementMessage').textContent = successMessage;
  showGameToast(`Cường hóa thành công: ${item.name} lên +${item.enhancementLevel}.`, 'success');
  renderEnhancement();
  renderEquipment();
  renderCultivation();
  saveGame();
}

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
    || [...stageEnemyData].sort((left, right) => {
      const leftMax = Number(left.tierRange?.[1]) || 0;
      const rightMax = Number(right.tierRange?.[1]) || 0;
      return rightMax - leftMax;
    })[0];
  if (!enemyData) return null;
  const rankLevel = floor % 10 === 0 ? 3 : floor % 5 === 0 ? 2 : 1;
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
  if (!dungeon) return { amount: 0, cultivation: 0, spiritStones: 0, enhancementStones: 0 };
  const range = getResourceDungeonRewardRange(dungeon, floor);
  // Resource dungeon rewards are countable resources and should never display fractions.
  const amount = Math.round(randomBetween(range.min, range.max));
  let cultivation = 0;
  let spiritStones = 0;
  let enhancementReward = 0;
  if (dungeon.rewardType === 'cultivation') cultivation = addPlayerCultivation(amount);
  if (dungeon.rewardType === 'spiritStone') {
    spiritStones = amount;
    playerSpiritStones += amount;
  }
  if (dungeon.rewardType === 'enhancementStone') {
    enhancementReward = amount;
    enhancementStones += amount;
  }
  resourceDungeonProgress[dungeonId] = Math.max(getResourceDungeonHighestFloor(dungeonId), floor);
  return { amount, cultivation, spiritStones, enhancementStones: enhancementReward };
}

function formatResourceReward(dungeon, amount) {
  const rewardName = dungeon?.rewardType === 'cultivation'
    ? 'tu vi'
    : dungeon?.rewardType === 'spiritStone'
    ? 'linh thạch'
    : 'đá cường hóa';
  return `${formatGameNumber(amount)} ${rewardName}`;
}

function renderResourceDungeons() {
  dailyResourceAttempts = normalizeDailyResourceAttempts(dailyResourceAttempts);
  resourceDungeonProgress = normalizeResourceDungeonProgress(resourceDungeonProgress);
  const remainingAttempts = getRemainingResourceAttempts();
  const usedAttempts = Math.max(0, dailyFarmLimit - remainingAttempts);
  $('resourceDungeonSummary').textContent = `${remainingAttempts}/${dailyFarmLimit} lượt hôm nay`;
  const rewardLabels = {
    cultivation: { name: 'Tu vi', className: 'cultivation', iconClass: 'icon-item-daily-calendar' },
    spiritStone: { name: 'Linh thạch', className: 'spirit-stone', iconClass: 'icon-item-spirit-stone' },
    enhancementStone: { name: 'Đá cường hóa', className: 'enhancement', iconClass: 'icon-item-enhancement-stone' },
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
        <div class="resource-dungeon-attempts"><span>Tiến độ</span><strong>${highestFloor}/${totalFloors} tầng · ${usedAttempts}/${dailyFarmLimit} lượt</strong></div>
        <div class="resource-dungeon-progress"><i style="width:${progress}%"></i></div>
        <div class="resource-dungeon-actions">
        <button type="button" class="${canChallenge ? 'breakthrough' : 'secondary'} compact" ${canChallenge ? '' : 'disabled'} data-resource-dungeon="${dungeon.id}">
            ${cleared ? 'Đã hoàn thành' : locked ? `Cần ${getTierRealmText(nextTier)}` : exhausted ? 'Hết lượt' : `Đánh tầng ${nextFloor}`}
          </button>
          <button type="button" class="${canSweep ? 'secondary' : 'secondary'} compact" ${canSweep ? '' : 'disabled'} onclick="sweepResourceDungeon('${dungeon.id}')">
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
  if (busy || !canAccessResourceDungeons() || getRemainingResourceAttempts() <= 0) return;
  const dungeon = getResourceDungeon(dungeonId);
  const floor = getResourceDungeonHighestFloor(dungeonId);
  if (!dungeon || floor <= 0 || !consumeResourceAttempt()) return;
  const reward = grantResourceDungeonReward(dungeonId, floor);
  const rewardText = formatResourceReward(dungeon, reward.amount);
  $('resourceDungeonMessage').textContent = `${dungeon.name}: quét tầng ${floor}, nhận ${rewardText}.`;
  showGameToast(`Đã quét ${dungeon.name} tầng ${floor}, nhận ${rewardText}.`, 'success');
  renderResourceDungeons();
  renderCultivation();
  renderShop();
  saveGame();
}

function runResourceDungeon(dungeonId) {
  challengeResourceDungeon(dungeonId);
}

function getShopItemCategory(item) {
  if (item.type === 'equipment' || item.type === 'equipmentRandom' || item.type === 'equipmentChest') return 'equipment';
  if (item.type === 'skillBook') return 'skill';
  if (item.type === 'cultivation' || item.type === 'foundation' || item.type === 'ascension') return 'cultivation';
  if (item.type === 'potion') return 'consumable';
  return 'material';
}

function getShopItemIconClass(item) {
  if (item.type === 'skillBook') return getSkillItemIconClass(item.skillId);
  if (item.type === 'equipment' || item.type === 'equipmentRandom') return 'icon-unique-equipment';
  if (item.type === 'equipmentChest') return 'icon-activity-chest';
  if (item.type === 'potion') return 'icon-item-health-pill';
  if (item.type === 'enhancementStone') return 'icon-item-enhancement-stone';
  if (item.type === 'foundation') return 'icon-item-jade';
  if (item.type === 'cultivation') return 'icon-stat-cultivation';
  if (item.type === 'ascension') return 'icon-activity-gate';
  return 'icon-item-spirit-stone';
}

function getShopItemIconTypeClass(icon) {
  if (icon.startsWith('icon-unique-')) return 'unique-icon';
  if (icon.startsWith('icon-skill-item-')) return 'skill-item-icon';
  if (icon.startsWith('icon-activity-')) return 'activity-icon';
  if (icon.startsWith('icon-stat-')) return 'stat-icon';
  return 'item-icon';
}

function getShopItemBagIconClass(item) {
  const icon = getShopItemIconClass(item);
  return `${getShopItemIconTypeClass(icon)} ${icon}`;
}

function getShopItemIconMarkup(item, extraClass = '') {
  const icon = getShopItemIconClass(item);
  const iconType = getShopItemIconTypeClass(icon);
  return `<i class="${iconType} ${icon} ${extraClass}" aria-hidden="true"></i>`;
}

function getShopItemLockText(item) {
  const lockedByLevel = item.requiredLevel && playerLevel < item.requiredLevel;
  const lockedByRealm = Number.isInteger(item.requiredMajorRealmIndex)
    && playerMajorRealmIndex < item.requiredMajorRealmIndex;
  const lockedByMap = item.requiredMapId && !isWanderMapUnlocked(wanderMaps[item.requiredMapId]);
  const skillRequiredTier = item.type === 'skillBook'
    ? getShopSkillRequiredTier(item)
    : Math.max(1, Number(item.requiredTier) || 1);
  const lockedByTier = item.type === 'skillBook'
    && getPlayerCultivationTier() < skillRequiredTier;
  if (lockedByMap) return `Cần mở ${wanderMaps[item.requiredMapId]?.name || 'map yêu cầu'}`;
  if (lockedByTier) return `Yêu cầu ${getTierRealmText(skillRequiredTier)}`;
  if (lockedByRealm) return `Yêu cầu ${majorRealmNames[item.requiredMajorRealmIndex]}`;
  if (lockedByLevel) return `Yêu cầu ${minorRealmNames[item.requiredLevel - 1]}`;
  return '';
}

function getShopItemPriceDetail(item) {
  if (item.type === 'cultivation') {
    return `Mỗi lần mua tiếp theo tăng ${formatGameNumber(Number(item.priceStep) || 0)} linh thạch.`;
  }
  if (item.type === 'potion') {
    return `Cứ ${Math.max(1, Number(item.priceIncreaseEvery) || 5)} lần mua, giá tăng ${formatGameNumber(Number(item.priceStep) || 5)} linh thạch.`;
  }
  if (item.type === 'ascension') return 'Mỗi lần mua tiếp theo tăng gấp 2 lần giá; có thể mua nhiều.';
  return 'Giá cố định cho mỗi lần mua.';
}

function getShopItemDetailLines(item) {
  const lines = [item.description];
  if (item.type === 'cultivation') {
    lines.push(`Nhận ${formatGameNumber(item.cultivation)} tu vi.`);
  }
  if (item.type === 'skillBook') {
    const skill = cultivationSkills.find((entry) => entry.id === item.skillId);
    if (skill) {
      lines.push(`${getSkillGradeName(skill)} · Cấp 0 · LC ${formatGameNumber(getSkillCombatPower(skill, 0))}.`);
      lines.push(`Linh lực cần ${formatGameNumber(skill.cost)}.`);
      lines.push(formatSkillDisplayNote(skill, 0));
    }
  }
  if (item.type === 'equipmentChest') {
    const majorRealmIndex = clamp(Number(playerMajorRealmIndex) || 0, 0, majorRealmNames.length - 1);
    const chestTier = Math.max(1, Number(item.equipmentChestTier) || 1);
    const chestSource = { chestTier };
    const profile = getEquipmentRarityProfile({ majorRealmIndex });
    const rarityText = profile.weights
      .map((weight, index) => `${rarityData[equipmentQualityOrder[index]]?.name || equipmentQualityOrder[index]} ${weight}%`)
      .join(' · ');
    lines.push(`Đại cảnh giới: ${majorRealmNames[majorRealmIndex] || 'hiện tại'}.`);
    lines.push(`Tỉ lệ phẩm cấp của trang bị trong rương: ${rarityText}.`);
  }
  return lines;
}

function openShopItemDetail(itemId) {
  if (busy) return;
  const item = shopItems.find((entry) => entry.id === itemId);
  if (!item) return;
  const lockedText = getShopItemLockText(item);
  const canBuy = canBuyShopItem(item);
  const details = getShopItemDetailLines(item);
  shopDetailOverlay.innerHTML = `
    <div class="wander-event-modal shop-detail-modal" role="dialog" aria-modal="true" aria-labelledby="shopDetailTitle">
      <button type="button" class="icon-button shop-detail-close" title="Đóng" aria-label="Đóng"><i class="unique-icon icon-unique-close" aria-hidden="true"></i></button>
      <span>${getShopItemIconMarkup(item)} Chi tiết vật phẩm</span>
      <strong id="shopDetailTitle" class="shop-detail-title">${item.name}</strong>
      <div class="shop-detail-description">${details.map((line) => `<p>${line}</p>`).join('')}</div>
      <div class="shop-detail-price">
        <span>Giá lần này</span><strong id="shopDetailPrice">${formatGameNumber(getShopItemCost(item))} linh thạch</strong>
        <small>${getShopItemPriceDetail(item)}</small>
      </div>
      <label class="shop-detail-quantity">Số lượng
        <input id="shopDetailQuantity" type="number" min="1" max="${maxShopPurchaseQuantity}" value="1" ${canBuy ? '' : 'disabled'}>
      </label>
      ${lockedText ? `<em class="shop-detail-lock">${lockedText}</em>` : ''}
      <strong id="shopDetailTotal" class="shop-detail-total">Tổng: ${formatGameNumber(getShopItemCost(item))} linh thạch</strong>
      <button type="button" class="breakthrough shop-detail-buy" ${canBuy ? '' : 'disabled'}>${lockedText ? 'Chưa mở' : 'Xác nhận mua'}</button>
    </div>
  `;
  shopDetailOverlay.classList.remove('is-hidden');
  const closeButton = shopDetailOverlay.querySelector('.shop-detail-close');
  const quantityInput = shopDetailOverlay.querySelector('#shopDetailQuantity');
  const totalText = shopDetailOverlay.querySelector('#shopDetailTotal');
  const updateTotal = () => {
    const quantity = clamp(Math.floor(Number(quantityInput?.value) || 1), 1, maxShopPurchaseQuantity);
    if (quantityInput) quantityInput.value = quantity;
    if (totalText) totalText.textContent = `Tổng: ${formatGameNumber(getShopPurchaseTotal(item, quantity))} linh thạch`;
    const buyButton = shopDetailOverlay.querySelector('.shop-detail-buy');
    if (buyButton && canBuy) buyButton.disabled = getShopPurchaseTotal(item, quantity) > playerSpiritStones;
  };
  closeButton?.addEventListener('click', hideShopItemDetail);
  quantityInput?.addEventListener('input', updateTotal);
  shopDetailOverlay.querySelector('.shop-detail-buy')?.addEventListener('click', () => {
    const quantity = clamp(Math.floor(Number(quantityInput?.value) || 1), 1, maxShopPurchaseQuantity);
    buyShopItem(item.id, quantity);
    hideShopItemDetail();
  });
  shopDetailOverlay.onclick = (event) => {
    if (event.target === shopDetailOverlay) hideShopItemDetail();
  };
}

function hideShopItemDetail() {
  shopDetailOverlay.classList.add('is-hidden');
  shopDetailOverlay.innerHTML = '';
  shopDetailOverlay.onclick = null;
}

function renderShop() {
  $('shopStoneText').textContent = `Linh thạch: ${formatGameNumber(playerSpiritStones)}`;
  shopCategoryFilters?.querySelectorAll('[data-shop-category]').forEach((button) => {
    const active = button.dataset.shopCategory === shopCategory;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  const visibleShopItems = shopItems
    .filter((item) => item.type !== 'skillBook' || item.schoolId === playerSchoolId)
    .filter((item) => item.type !== 'equipmentChest' || Number(item.equipmentMajorRealmId || 0) <= 3)
    .filter((item) => shopCategory === 'all' || getShopItemCategory(item) === shopCategory);
  if (!visibleShopItems.length) {
    $('shopList').innerHTML = '<div class="inventory-empty"><i class="activity-icon icon-activity-chest" aria-hidden="true"></i><span>Chưa có vật phẩm trong phân loại này.</span></div>';
    return;
  }
  $('shopList').innerHTML = visibleShopItems.map((item) => {
    const lockedByLevel = item.requiredLevel && playerLevel < item.requiredLevel;
    const lockedByRealm = Number.isInteger(item.requiredMajorRealmIndex)
      && playerMajorRealmIndex < item.requiredMajorRealmIndex;
    const lockedByMap = item.requiredMapId && !isWanderMapUnlocked(wanderMaps[item.requiredMapId]);
    const skillRequiredTier = item.type === 'skillBook'
      ? getShopSkillRequiredTier(item)
      : Math.max(1, Number(item.requiredTier) || 1);
    const lockedByTier = item.type === 'skillBook'
      && getPlayerCultivationTier() < skillRequiredTier;
    const locked = lockedByLevel || lockedByRealm || lockedByTier || lockedByMap;
    const foundationBought = item.type === 'foundation' && !canBuyFoundationPill(item);
    const bought = foundationBought;
    const skillBook = item.type === 'skillBook'
      ? cultivationSkills.find((skill) => skill.id === item.skillId)
      : null;
    const skillBookLearned = Boolean(skillBook && isSkillLearned(skillBook.id));
    const skillBookMaxed = Boolean(skillBook && getSkillLevel(skillBook.id) >= getSkillMaxLevel());
    const potionPurchased = item.type === 'potion' ? Math.max(0, Number(potionPurchaseCounts[item.id]) || 0) : 0;
    const canBuy = canBuyShopItem(item);
    const meta = foundationBought
      ? `Đã mua trong ${majorRealmNames[playerMajorRealmIndex]}`
      : item.type === 'foundation'
      ? `${formatGameNumber(getShopItemCost(item))} linh thạch`
      : item.type === 'potion'
      ? `${formatGameNumber(getShopItemCost(item))} linh thạch · Đã mua ${potionPurchased} viên`
      : bought
      ? 'Đã mở khóa'
      : locked
      ? lockedByMap
        ? `Cần mở ${wanderMaps[item.requiredMapId]?.name || 'map yêu cầu'}`
        : lockedByTier
        ? `Yêu cầu ${getTierRealmText(skillRequiredTier)}`
        : lockedByRealm
        ? `Yêu cầu ${majorRealmNames[item.requiredMajorRealmIndex]}`
        : `Yêu cầu ${minorRealmNames[item.requiredLevel - 1]}`
      : `${formatGameNumber(getShopItemCost(item))} linh thạch`;
    const buttonText = item.type === 'skillBook'
      ? skillBookMaxed ? 'Đã đạt cấp 12' : locked ? 'Chưa mở' : 'Mua sách'
      : bought ? 'Đã mua' : locked ? 'Chưa mở' : 'Mua';
    const qualityClass = item.gradeId ? `grade-${item.gradeId}` : item.rarityKey ? `quality-${item.rarityKey}` : '';

    const canBuyOne = canBuy && !bought;
    const detailButtonText = canBuyOne ? 'Mua nhiều' : 'Chi tiết';
    return `
      <article class="shop-item ${qualityClass}" data-shop-detail="${item.id}" tabindex="0">
         <strong>${getShopItemIconMarkup(item)}${item.name}</strong>
        <span>${item.description}</span>
        <em>${meta}</em>
        <div class="shop-item-actions">
          <button type="button" ${canBuyOne ? '' : 'disabled'} data-shop-item="${item.id}">${canBuyOne ? 'Mua' : buttonText}</button>
          <button type="button" class="secondary" data-shop-detail="${item.id}">${detailButtonText}</button>
        </div>
      </article>
    `;
  }).join('');
}

function renderProfile() {
  const profileFighter = createFighter(playerName, playerLevel, true);
  const school = getPlayerSchool();
  const equippedSkills = getEquippedSkills();
  const visibleSkills = equippedSkills.length ? equippedSkills : getPlayerSkills().filter((skill) => isSkillLearned(skill.id)).slice(0, 2);

  $('profileSchoolTag').textContent = (school?.name || 'Chưa chọn').toUpperCase();
  $('profileNameText').textContent = playerName;
  $('profileAvatarText').classList.remove('school-sword', 'school-blade', 'school-martial');
  $('profileAvatarText').classList.add('chibi-character', 'game-avatar', getSchoolVisualClass());
  renderPlayerAvatar();
  $('profileSkillPowerText').textContent = `Lực chiến ${formatGameNumber(getEquippedSkillCombatPower(equippedSkills))}`;
  $('profileLoadoutPowerText').textContent = `Lực chiến ${formatGameNumber(getEquipmentPower())}`;

  const coreStats = [
    ['Sinh lực', 'icon-stat-hp', formatGameNumber(profileFighter.maxHp)],
    ['Linh lực', 'icon-stat-mana', formatGameNumber(profileFighter.maxMana)],
    ['Căn cơ', 'icon-stat-gem', formatGameNumber(playerFoundation)],
    ['Công', 'icon-stat-attack', formatGameNumber(profileFighter.attack)],
    ['Thủ', 'icon-unique-defense', formatGameNumber(profileFighter.defense)],
    ['Tốc độ', 'icon-stat-speed', formatGameNumber(profileFighter.speed)],
  ];
  const combatStats = [
    ['Chính xác', 'icon-stat-accuracy', toPercent(profileFighter.accuracy)],
    ['Né tránh', 'icon-stat-dodge', toPercent(profileFighter.dodgeRate)],
    ['Đỡ đòn', 'icon-unique-block', toPercent(profileFighter.blockRate)],
    ['Chí mạng', 'icon-stat-crit', toPercent(profileFighter.critRate)],
    ['Sát thương chí mạng', 'icon-unique-critical-damage', toPercent(profileFighter.critDamage), 'ST chí mạng'],
    ['Xuyên giáp', 'icon-unique-armor-pierce', toPercent(profileFighter.armorPierce)],
    ['Giảm sát thương', 'icon-unique-damage-reduction', toPercent(profileFighter.damageReduction), 'Giảm ST'],
    ['Hút máu', 'icon-unique-life-steal', toPercent(profileFighter.lifeSteal)],
    ['May mắn', 'icon-unique-luck', formatGameNumber(profileFighter.luck)],
    ['Ngộ tính', 'icon-unique-comprehension', formatGameNumber(profileFighter.comprehension)],
  ];
  const renderStatGroup = (title, stats) => `
    <div class="profile-stat-group">
      <span class="profile-stat-group-title">${title}</span>
      <div class="profile-stat-group-grid">
        ${stats.map(([label, icon, value, compactLabel]) => `
          <div title="${label}"><span><i class="${icon.startsWith('icon-unique-') ? 'unique-icon' : 'stat-icon'} ${icon}" aria-hidden="true"></i>${compactLabel || label}</span><strong>${value}</strong></div>
        `).join('')}
      </div>
    </div>
  `;
  $('profileStats').innerHTML = renderStatGroup('Thuộc tính', coreStats.concat(combatStats));

  $('profileSkillList').innerHTML = visibleSkills.length ? visibleSkills.map((skill) => {
    const level = getSkillLevel(skill.id);
    const active = skill.id === activeSkillId;
    const skillPower = getSkillCombatPower(skill, level);
    return `
      <div class="profile-skill-row ${active ? 'active' : ''}">
        <div class="profile-skill-icon"><i class="${getSkillItemIconClass(skill.id).startsWith('icon-skill-item-') ? 'skill-item-icon' : 'item-icon'} ${getSkillItemIconClass(skill.id)}" aria-hidden="true"></i></div>
        <div class="profile-skill-copy">
          <strong>${skill.name}</strong>
          <span>Lực chiến ${formatGameNumber(skillPower)}</span>
        </div>
      </div>
    `;
  }).join('') : '<div class="inventory-empty"><i class="activity-icon icon-activity-locked" aria-hidden="true"></i><span>Chưa học skill nào.</span></div>';

  $('profileEquipmentList').innerHTML = equipmentSlots.map((slot) => {
    const item = equippedItems[slot.id];
    const rarityClass = item ? rarityData[item.rarityKey]?.className || '' : '';
    return `
      <div class="profile-equipment-slot ${rarityClass}" title="${item ? `${getRarityName(item)} ${item.name}` : `${slot.name}: Trống`}">
        <i class="${getEquipmentIconClass(slot.id).startsWith('icon-unique-') ? 'unique-icon' : 'item-icon'} ${getEquipmentIconClass(slot.id)}" aria-hidden="true"></i>
        <span>${slot.name}</span>
        <strong>${item ? item.name : 'Trống'}</strong>
        <em>Lực chiến ${item ? formatGameNumber(getItemPower(item)) : '0'}</em>
      </div>
    `;
  }).join('');

}

function renderPlayerAvatar() {
  if (playerAvatarVisual) {
    playerAvatarVisual.classList.remove('school-sword', 'school-blade', 'school-martial');
    playerAvatarVisual.classList.add('chibi-character', 'game-avatar', getSchoolVisualClass());
  }
  if (playerAvatarButton) playerAvatarButton.setAttribute('aria-label', `Mở Trang cá nhân của ${playerName}`);
}

function renderEquipment() {
  const playerSnapshot = createFighter(playerName, playerLevel, true);
  $('equipmentPowerText').textContent = `Lực chiến ${formatGameNumber(getCombatPower(playerSnapshot))} | Trang bị +${formatGameNumber(getEquipmentPower())}`;
  if ($('equipmentInventorySummary')) $('equipmentInventorySummary').textContent = `${inventory.length} vật phẩm`;
  $('equipmentStatsSummary').innerHTML = renderEquipmentContributionSummary();
  if (equipmentBulkSellRarity && equipmentBulkSellRarity.options.length <= 1) {
    equipmentBulkSellRarity.innerHTML = [
      '<option value="all">Tất cả phẩm cấp</option>',
      ...equipmentQualityOrder.map((rarityKey) => `<option value="${rarityKey}">${rarityData[rarityKey]?.name || rarityKey}</option>`),
    ].join('');
  }
  const quickEquipAvailable = hasQuickEquipCandidate();
  quickEquipButton.disabled = busy || !quickEquipAvailable;
  setNotificationBadge(equipmentBadge, Number(quickEquipAvailable));
  $('equipmentSlots').innerHTML = equipmentSlots.map((slot) => {
    const item = equippedItems[slot.id];
    return `
      <div class="equipment-slot ${item ? rarityData[item.rarityKey].className : ''}">
        ${item ? renderEquippedEquipmentSummary(item, slot.name) : `<span>${slot.name}</span><strong>Trống</strong><em>Chưa mặc trang bị</em>`}
        ${item ? `<button type="button" onclick="unequipItem('${slot.id}')">Tháo</button>` : ''}
      </div>
    `;
  }).join('');

  const filter = equipmentFilter?.value || 'all';
  const sort = equipmentSort?.value || 'power';
  const visibleInventory = inventory
    .filter((item) => filter === 'all' || item.rarityKey === filter)
    .sort((a, b) => sort === 'newest'
      ? b.id - a.id
      : sort === 'level'
      ? (b.level - a.level) || (getItemPower(b) - getItemPower(a))
      : getItemPower(b) - getItemPower(a));

  $('equipmentInventoryList').innerHTML = visibleInventory.length
    ? visibleInventory.map((item) => {
      const locked = !canEquipEquipment(item);
      const equipped = isEquipmentEquipped(item);
      return `
        <div class="inventory-item ${rarityData[item.rarityKey].className}">
          ${renderEquipmentSummary(item)}
           <button type="button" ${locked ? 'disabled' : ''} onclick="equipItem(${item.id})">
             ${locked ? `Cần ${getTierRealmText(item.requiredTier)}` : 'Mặc'}
           </button>
           <button type="button" class="secondary" ${equipped ? 'disabled title="Không thể bán trang bị đang mặc"' : ''} onclick="sellItem(${item.id})">
             ${equipped ? 'Đang mặc' : `Bán ${formatGameNumber(getEquipmentSellPrice(item))}`}
           </button>
         </div>
       `;
    }).join('')
    : `<div class="inventory-empty"><i class="item-icon icon-item-robe" aria-hidden="true"></i><span>${inventory.length ? 'Không có trang bị phù hợp bộ lọc.' : 'Chưa có trang bị. Đánh tầng để nhặt thêm.'}</span></div>`;
}

function getBagItems() {
  const items = [
    {
      id: 'spirit-stones',
      name: 'Linh thạch',
      category: 'Tài nguyên',
      count: playerSpiritStones,
      iconClass: 'item-icon icon-item-spirit-stone',
      description: 'Dùng để mua vật phẩm và công pháp trong cửa hàng.',
    },
    {
      id: 'health-potion',
      name: 'Sinh Huyết Đan',
      category: 'Tiêu hao',
      count: healthPotionCount,
      iconClass: 'item-icon icon-item-health-pill',
      description: 'Hồi phục 25% HP mỗi lần dùng.',
      usable: true,
      useLabel: 'Dùng',
    },
    {
      id: 'mana-potion',
      name: 'Tụ Linh Đan',
      category: 'Tiêu hao',
      count: manaPotionCount,
      iconClass: 'item-icon icon-item-mana-flame',
      description: 'Hồi phục 25% MP mỗi lần dùng.',
      usable: true,
      useLabel: 'Dùng',
    },
    {
      id: 'enhancement-stones',
      name: 'Đá cường hóa',
      category: 'Nguyên liệu',
      count: enhancementStones,
      iconClass: 'item-icon icon-item-enhancement-stone',
      description: 'Nguyên liệu dùng cho các mốc cường hóa trang bị.',
    },
  ];

  shopItems
    .filter((shopItem) => ['cultivation', 'foundation', 'ascension'].includes(shopItem.type))
    .forEach((shopItem) => {
      const count = getShopInventoryCount(shopItem.id);
      if (count <= 0) return;
      const category = shopItem.type === 'ascension' ? 'Đột phá' : shopItem.type === 'foundation' ? 'Tu luyện' : 'Tu vi';
      items.push({
        id: `shop-item-${shopItem.id}`,
        shopItemId: shopItem.id,
        name: shopItem.name,
        category,
        count,
        iconClass: getShopItemBagIconClass(shopItem),
        description: shopItem.description || getShopItemDetailLines(shopItem).join(' '),
        usable: shopItem.type !== 'ascension',
        useLabel: shopItem.type === 'ascension' ? '' : 'Dùng',
      });
    });

  Object.entries(skillBooks).forEach(([skillId, count]) => {
    const skill = cultivationSkills.find((entry) => entry.id === skillId);
    const safeCount = getSkillBookCount(skillId);
    if (!skill || safeCount <= 0) return;
    items.push({
      id: `skill-book-${skillId}`,
      name: `Sách skill: ${skill.name}`,
      category: 'Công pháp',
      count: safeCount,
      iconClass: `item-icon ${getSkillItemIconClass(skillId)}`,
      description: `Dùng để nâng cấp ${skill.name}.`,
      usable: !isSkillLearned(skill.id) && getPlayerCultivationTier() >= getSkillRequiredTier(skill),
      useLabel: 'Học skill',
    });
  });

  equipmentChestInventory.forEach((chest) => {
    items.push({
      id: chest.id,
      name: chest.name,
      category: 'Rương',
      count: chest.count,
      iconClass: 'activity-icon icon-activity-chest',
      description: `${wanderMaps[chest.mapId]?.name || 'Ngao du'} | Trang bị cấp ${getChestLevelRange(chest).join('-')} khi mở.`,
      usable: true,
      useLabel: 'Mở',
    });
  });

  return items.filter((item) => Number(item.count) > 0);
}

function learnSkillFromBag(skillId) {
  if (busy) return;
  const skill = getPlayerSkills().find((entry) => entry.id === skillId);
  if (!skill || isSkillLearned(skill.id) || getSkillBookCount(skill.id) <= 0) return;
  if (getPlayerCultivationTier() < getSkillRequiredTier(skill)) return;
  skillBooks[skill.id] = getSkillBookCount(skill.id) - 1;
  learnedSkillIds.push(skill.id);
  playerComprehension += 1;
  skillLevels[skill.id] = 0;
  skillPractice[skill.id] = 0;
  skillTrainingId = '';
  activeSkillId = skill.id;
  setSubtitle(`Đã học ${skill.name}.`);
  showGameToast(`Đã học ${skill.name} từ sách trong túi.`, 'success');
  renderInventory();
  renderSkills();
  renderCultivation();
  renderProfile();
  saveGame();
}

function getInventoryItem(itemId) {
  return getBagItems().find((item) => String(item.id) === String(itemId)) || null;
}

function getInventoryItemDetails(item) {
  const details = [item.description];
  if (item.category === 'Công pháp') {
    const skillId = String(item.id).replace(/^skill-book-/, '');
    const skill = cultivationSkills.find((entry) => entry.id === skillId);
    if (skill) details.push(`Dùng để học hoặc nâng cấp ${skill.name}.`);
  }
  if (item.shopItemId) {
    const shopItem = shopItems.find((entry) => entry.id === item.shopItemId);
    if (shopItem?.type === 'cultivation') details.push(`Nhận ${formatGameNumber(shopItem.cultivation)} tu vi khi dùng.`);
    if (shopItem?.type === 'foundation') details.push(`Nhận ${formatGameNumber(getFoundationPillAmount(shopItem))} căn cơ khi dùng.`);
    if (shopItem?.type === 'ascension') details.push('Chỉ dùng tại nút thăng đại cảnh giới tiếp theo.');
  }
  if (item.category === 'Rương') details.push(`Có thể mở nhiều rương cùng lúc; mỗi lần mở tạo một trang bị.`);
  return details;
}

function usePurchasedShopItem(item, amount = 1) {
  const shopItem = shopItems.find((entry) => entry.id === item.shopItemId);
  if (!shopItem) return 0;
  const requested = Math.max(1, Math.floor(Number(amount) || 1));
  let used = 0;

  for (let index = 0; index < requested; index += 1) {
    if (getShopInventoryCount(shopItem.id) <= 0) break;
    let canUse = true;
    if (shopItem.type === 'cultivation') {
      canUse = !isMajorAscensionGate() && addPlayerCultivation(shopItem.cultivation) > 0;
    } else if (shopItem.type === 'foundation') {
      playerFoundation += getFoundationPillAmount(shopItem);
    } else if (shopItem.type === 'ascension') {
      canUse = false;
    }
    if (!canUse) break;
    shopInventoryCounts[shopItem.id] = getShopInventoryCount(shopItem.id) - 1;
    used += 1;
  }

  if (!used) return 0;
  showGameToast(`Đã dùng ${shopItem.name}${used > 1 ? ` x${used}` : ''}.`, 'success');
  renderCultivation();
  renderInventory();
  renderShop();
  saveGame();
  return used;
}

function useInventoryItem(itemId, amount = 1) {
  if (busy) return false;
  const item = getInventoryItem(itemId);
  if (!item?.usable) return false;
  const maxQuantity = item.category === 'Công pháp' ? 1 : Math.max(1, Number(item.count) || 1);
  const requested = clamp(Math.floor(Number(amount) || 1), 1, maxQuantity);
  if (requested > 1) {
    const action = item.category === 'Rương' ? 'mở' : 'dùng';
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} ${requested} ${item.name}?`)) return false;
  }

  let used = 0;
  if (item.id === 'health-potion') used = usePotion('health', requested);
  if (item.id === 'mana-potion') used = usePotion('mana', requested);
  if (item.category === 'Công pháp') {
    const skillId = String(item.id).replace(/^skill-book-/, '');
    learnSkillFromBag(skillId);
    used = 1;
  }
  if (item.category === 'Rương') {
    used = openEquipmentChest(item.id, requested) || 0;
  }
  if (item.shopItemId) used = usePurchasedShopItem(item, requested);
  return used > 0;
}

function openInventoryItemDetail(itemId) {
  if (busy) return;
  const item = getInventoryItem(itemId);
  if (!item) return;
  const canUse = Boolean(item.usable);
  const maxQuantity = item.category === 'Công pháp' ? 1 : Math.max(1, Number(item.count) || 1);
  inventoryDetailOverlay.innerHTML = `
    <div class="wander-event-modal shop-detail-modal inventory-detail-modal" role="dialog" aria-modal="true" aria-labelledby="inventoryDetailTitle">
      <button type="button" class="icon-button inventory-detail-close" title="Đóng" aria-label="Đóng"><i class="unique-icon icon-unique-close" aria-hidden="true"></i></button>
      <span>${item.iconClass ? `<i class="bag-item-icon ${item.iconClass}" aria-hidden="true"></i>` : ''} Chi tiết vật phẩm</span>
      <strong id="inventoryDetailTitle" class="shop-detail-title">${item.name}</strong>
      <div class="shop-detail-description">
        <p>Phân loại: ${item.category}</p>
        <p>Số lượng trong túi: x${formatGameNumber(item.count)}</p>
        ${getInventoryItemDetails(item).map((line) => `<p>${line}</p>`).join('')}
      </div>
      ${canUse ? `<label class="shop-detail-quantity">Số lượng
        <input id="inventoryDetailQuantity" type="number" min="1" max="${maxQuantity}" value="1">
      </label>
      <button type="button" class="breakthrough inventory-detail-use">${item.useLabel || 'Dùng'}</button>` : '<em class="shop-detail-lock">Vật phẩm này chưa có thao tác sử dụng trực tiếp.</em>'}
    </div>
  `;
  inventoryDetailOverlay.classList.remove('is-hidden');
  inventoryDetailOverlay.querySelector('.inventory-detail-close')?.addEventListener('click', hideInventoryItemDetail);
  inventoryDetailOverlay.querySelector('.inventory-detail-use')?.addEventListener('click', () => {
    const quantity = clamp(Math.floor(Number(inventoryDetailOverlay.querySelector('#inventoryDetailQuantity')?.value) || 1), 1, maxQuantity);
    if (useInventoryItem(item.id, quantity)) hideInventoryItemDetail();
  });
  inventoryDetailOverlay.onclick = (event) => {
    if (event.target === inventoryDetailOverlay) hideInventoryItemDetail();
  };
}

function hideInventoryItemDetail() {
  inventoryDetailOverlay.classList.add('is-hidden');
  inventoryDetailOverlay.innerHTML = '';
  inventoryDetailOverlay.onclick = null;
}

function renderInventory() {
  const bagItems = getBagItems();
  $('inventorySummary').textContent = `${bagItems.length} loại vật phẩm`;
  $('inventoryList').innerHTML = bagItems.length
    ? bagItems.map((item) => `
      <div class="inventory-item bag-item">
        <div class="bag-item-header">
          <div class="bag-item-identity">
            <i class="bag-item-icon ${item.iconClass}" aria-hidden="true"></i>
            <strong>${item.name}</strong>
          </div>
          <div class="bag-item-meta">
            <b class="bag-item-count">x${formatGameNumber(item.count)}</b>
          </div>
        </div>
         <div class="bag-item-actions">
           ${item.usable ? `<button type="button" class="breakthrough" data-inventory-use="${item.id}">${item.useLabel || 'Dùng'}</button>` : ''}
           <button type="button" class="secondary" data-inventory-detail="${item.id}">Chi tiết</button>
         </div>
       </div>
    `).join('')
    : '<div class="inventory-empty"><i class="item-icon icon-item-side-pouch" aria-hidden="true"></i><span>Chưa có vật phẩm trong túi đồ.</span></div>';
}

function renderEquipmentContributionSummary() {
  const stats = getEquippedStats();
  const specials = getEquippedSpecials();
  const statEntries = Object.entries(stats).filter(([, value]) => value);
  const specialEntries = Object.entries(specials).filter(([, value]) => value);
  if (!statEntries.length && !specialEntries.length) {
    return '<span class="equipment-summary-empty">Chưa có chỉ số cộng từ trang bị.</span>';
  }
  const entries = [
    ...statEntries.map(([stat, value]) => renderEquipmentStatSummaryEntry(stat, `+${isPercentStat(stat) ? toPercent(value) : formatGameNumber(value)}`)),
    ...specialEntries.map(([id, value]) => renderEquipmentStatSummaryEntry(id, `+${toPercent(value)}`)),
  ];
  return `<strong>Chỉ số đang nhận</strong><div>${entries.join('')}</div>`;
}

function renderEquipmentStatSummaryEntry(stat, value) {
  const icon = getStatIconClass(stat);
  const iconType = icon.startsWith('icon-unique-') ? 'unique-icon' : 'stat-icon';
  return `<span class="equipment-stat-entry" title="${getStatLabel(stat)}"><i class="${iconType} ${icon}" aria-hidden="true"></i><b>${value}</b></span>`;
}

function isEquipmentEquipped(item) {
  if (!item?.id) return false;
  return Object.values(equippedItems).some((equippedItem) => String(equippedItem?.id) === String(item.id));
}

function getEquipmentShopValue(item) {
  const level = Math.max(1, Math.floor(Number(item?.level) || 1));
  const chestTier = Math.max(
    1,
    Math.floor(Number(item?.sourceChestTier) || Math.ceil(level / equipmentLevelsPerChestTier)),
  );
  const exactChest = shopItems.find((shopItem) => (
    shopItem.type === 'equipmentChest'
      && Number(shopItem.equipmentChestTier) === chestTier
  ));
  if (exactChest) return Math.max(1, Number(exactChest.cost) || 1);

  const chestPrices = shopItems
    .filter((shopItem) => shopItem.type === 'equipmentChest' && Number(shopItem.cost) > 0)
    .sort((a, b) => Number(b.equipmentChestTier) - Number(a.equipmentChestTier));
  const highestChest = chestPrices[0];
  if (!highestChest) return 100;
  const highestTier = Math.max(1, Number(highestChest.equipmentChestTier) || 1);
  const highestPrice = Math.max(1, Number(highestChest.cost) || 1);
  return highestPrice + Math.max(0, chestTier - highestTier) * 100;
}

function getEquipmentSellPrice(item) {
  return Math.max(1, Math.floor(getEquipmentShopValue(item) / 4));
}

function enforceEquipmentInventoryLimit() {
  if (inventory.length <= maxEquipmentInventory) return 0;

  const soldItems = [];
  while (inventory.length > maxEquipmentInventory) {
    let index = inventory.length - 1;
    while (index >= 0 && isEquipmentEquipped(inventory[index])) index -= 1;
    if (index < 0) break;
    soldItems.push(inventory.splice(index, 1)[0]);
  }

  if (!soldItems.length) return 0;
  const totalPrice = soldItems.reduce((sum, item) => sum + getEquipmentSellPrice(item), 0);
  playerSpiritStones += totalPrice;
  showGameToast(`Túi đã đầy, tự bán ${soldItems.length} trang bị cũ và nhận ${formatGameNumber(totalPrice)} linh thạch.`, 'info');
  return soldItems.length;
}

function sellItem(itemId) {
  if (busy) return;
  const index = inventory.findIndex((item) => item.id === Number(itemId));
  if (index < 0) return;
  const item = inventory[index];
  if (isEquipmentEquipped(item)) {
    showGameToast('Không thể bán trang bị đang mặc.', 'error');
    return;
  }
  inventory.splice(index, 1);
  const price = getEquipmentSellPrice(item);
  playerSpiritStones += price;
  $('equipmentMessage').textContent = `Đã bán ${getRarityName(item)} ${item.name}, nhận ${formatGameNumber(price)} linh thạch.`;
  showGameToast(`Đã bán ${getRarityName(item)} ${item.name}, nhận ${formatGameNumber(price)} linh thạch.`, 'success');
  renderEquipment();
  renderCultivation();
  renderShop();
  saveGame();
}

function sellEquipmentByRarity(rarityKey = 'all') {
  if (busy) return;
  const sellable = inventory.filter((item) => (
    (rarityKey === 'all' || item.rarityKey === rarityKey) && !isEquipmentEquipped(item)
  ));
  if (!sellable.length) {
    const rarityName = rarityKey === 'all' ? 'nào' : (rarityData[rarityKey]?.name || 'phẩm cấp này');
    showGameToast(`Không có trang bị ${rarityName} để bán.`, 'error');
    return;
  }

  const rarityName = rarityKey === 'all' ? 'tất cả phẩm cấp' : (rarityData[rarityKey]?.name || rarityKey);
  if (!window.confirm(`Bán ${sellable.length} trang bị ${rarityName}? Trang bị đang mặc sẽ được giữ lại.`)) return;

  const sellableIds = new Set(sellable.map((item) => String(item.id)));
  const totalPrice = sellable.reduce((sum, item) => sum + getEquipmentSellPrice(item), 0);
  inventory = inventory.filter((item) => !sellableIds.has(String(item.id)) || isEquipmentEquipped(item));
  playerSpiritStones += totalPrice;
  const message = `Đã bán ${sellable.length} trang bị ${rarityName}, nhận ${formatGameNumber(totalPrice)} linh thạch.`;
  $('equipmentMessage').textContent = message;
  showGameToast(message, 'success');
  renderEquipment();
  renderProfile();
  renderCultivation();
  renderShop();
  saveGame();
}

function renderEquipmentSummary(item, options = {}) {
  const enhancementLevel = Number(item.enhancementLevel) || 0;
  const enhancementMax = getEquipmentEnhancementQualityMax(item);
  const iconClass = getEquipmentIconClass(item.slotId);
  const iconType = iconClass.startsWith('icon-unique-') ? 'unique-icon' : 'item-icon';
  return `
        ${options.showSlotName === false ? '' : `<strong><i class="${iconType} ${iconClass}" aria-hidden="true"></i>${getSlotName(item.slotId)}</strong>`}
        <strong><i class="${iconType} ${iconClass}" aria-hidden="true"></i>${getRarityName(item)} ${item.name}</strong>
    <em>Cấp trang bị ${formatGameNumber(item.level)} | Cường hóa +${enhancementLevel}/${enhancementMax}</em>
    <em>Lực chiến +${formatGameNumber(getItemPower(item))} | Yêu cầu ${getTierRealmText(item.requiredTier || getEquipmentRequiredTier(item.rarityKey, item.level))}</em>
    ${formatItemStats(item.stats) ? `<small class="item-stat-list">${formatItemStats(item.stats)}</small>` : ''}
    ${item.specialLines?.length ? `<small class="special-lines item-stat-list">${formatSpecialLines(item.specialLines)}</small>` : ''}
  `;
}

function renderEquippedEquipmentSummary(item, slotName) {
  const enhancementLevel = Number(item.enhancementLevel) || 0;
  const iconClass = getEquipmentIconClass(item.slotId);
  const iconType = iconClass.startsWith('icon-unique-') ? 'unique-icon' : 'item-icon';
  const specialText = formatSpecialLinesWithoutIcons(item.specialLines || []);
  return `
    <div class="equipped-equipment-summary">
      <div class="equipped-equipment-heading"><span>${slotName}</span><b>LC +${formatGameNumber(getItemPower(item))}</b></div>
      <strong class="equipped-equipment-name"><i class="${iconType} ${iconClass}" aria-hidden="true"></i>${item.name}<em>[Cấp ${formatGameNumber(item.level)}] +${formatGameNumber(enhancementLevel)}</em></strong>
      ${formatItemStats(item.stats) ? `<div class="equipped-equipment-stats">${formatItemStats(item.stats)}</div>` : ''}
      ${specialText ? `<div class="equipped-equipment-specials">${specialText}</div>` : ''}
    </div>
  `;
}

function getEquipmentIconClass(slotId) {
  const iconBySlot = {
    weapon: 'icon-item-sword',
    armor: 'icon-item-robe',
    boots: 'icon-unique-boots',
    ring: 'icon-item-ring',
    amulet: 'icon-item-jade',
    artifact: 'icon-unique-artifact',
  };
  return iconBySlot[slotId] || 'icon-unique-equipment';
}

function hasQuickEquipCandidate() {
  return inventory.some((item) => {
    if (!canEquipEquipment(item)) return false;
    const currentItem = equippedItems[item.slotId];
    return !currentItem || getItemPower(item) > getItemPower(currentItem);
  });
}

function getPreviewReward(stage, outcome) {
  return calculateCultivationReward(stage, outcome);
}

function renderFighter(prefix, fighter) {
  $(`${prefix}NameText`).textContent = fighter.name;
  $(`${prefix}RealmText`).textContent = `${fighter.realm} cảnh ${fighter.minorRealm}`;
  const hudName = $(`${prefix}HudName`);
  const hudRealm = $(`${prefix}HudRealm`);
  if (hudName) hudName.textContent = fighter.name;
  if (hudRealm) hudRealm.textContent = `${fighter.realm} cảnh ${fighter.minorRealm}`;
  $(`${prefix}HpText`).textContent = `${Math.ceil(fighter.hp)}/${fighter.maxHp}`;
  $(`${prefix}ManaText`).textContent = `${Math.floor(fighter.mana)}/${fighter.maxMana}`;
  $(`${prefix}HpBar`).style.width = `${(fighter.hp / fighter.maxHp) * 100}%`;
  $(`${prefix}ManaBar`).style.width = `${(fighter.mana / fighter.maxMana) * 100}%`;
  renderSkillStatus(prefix, fighter);
  $(`${prefix}Stats`).innerHTML = `
    <strong class="combat-power">Lực chiến ${formatGameNumber(getCombatPower(fighter))}</strong>
    <span><i class="stat-icon icon-stat-attack" aria-hidden="true"></i>Công <b>${fighter.attack}</b></span>
    <span><i class="unique-icon icon-unique-defense" aria-hidden="true"></i>Thủ <b>${fighter.defense}</b></span>
    <span><i class="stat-icon icon-stat-speed" aria-hidden="true"></i>Tốc <b>${Math.round(fighter.speed)}</b></span>
    <span><i class="stat-icon icon-stat-dodge" aria-hidden="true"></i>Né <b>${toPercent(fighter.dodgeRate)}</b></span>
    <span><i class="unique-icon icon-unique-block" aria-hidden="true"></i>Đỡ <b>${toPercent(fighter.blockRate)}</b></span>
    <span><i class="stat-icon icon-stat-crit" aria-hidden="true"></i>Chí mạng <b>${toPercent(fighter.critRate)}</b></span>
  `;
}

function renderSkillStatus(prefix, fighter) {
  const el = $(`${prefix}SkillStatus`);
  const enoughMana = fighter.mana >= fighter.skillCost;
  const ready = fighter.skillCooldownRemaining <= 0 && enoughMana;
  const cooldownText = fighter.skillCooldownRemaining > 0
    ? `Hồi chiêu: còn ${fighter.skillCooldownRemaining} lượt`
    : enoughMana
      ? 'Hồi chiêu: sẵn sàng'
      : `Thiếu linh lực: cần ${fighter.skillCost}`;

  el.classList.toggle('ready', ready);
  el.classList.toggle('waiting', !ready);
  el.innerHTML = `
    <span>${fighter.skillName}</span>
    <strong>${cooldownText}</strong>
    ${fighter.combatStyleLabel ? `<small>Lối đánh: ${fighter.combatStyleLabel}</small>` : ''}
  `;
}

function pushLog(message) {
  const li = document.createElement('li');
  li.textContent = message;
  logList.appendChild(li);
  while (logList.children.length > 8) logList.removeChild(logList.firstChild);
}

function toPercent(value) {
  const rounded = Math.round(Number(value) * 1000) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

function getSlotName(slotId) {
  return equipmentSlots.find((slot) => slot.id === slotId)?.name || slotId;
}

function getRarityName(item) {
  return rarityData[item.rarityKey].name;
}

function formatItemStats(stats) {
  return Object.entries(stats || {})
    .filter(([, value]) => Number(value) !== 0)
    .map(([stat, value]) => renderItemStatLine(stat, `+${isPercentStat(stat) ? toPercent(value) : formatGameNumber(value)}`))
    .join('');
}

function formatSpecialLines(lines) {
  return lines
    .map((line) => {
      const definition = specialLineData.find((item) => item.id === line.id);
      const valueText = definition ? describeSpecialLine(definition, line.value) : `+${toPercent(line.value)}`;
      return renderItemStatLine(line.id, `${line.name}: ${valueText}`, 'special-line');
    })
    .join('');
}

function formatSpecialLinesWithoutIcons(lines) {
  return lines
    .map((line) => {
      const definition = specialLineData.find((item) => item.id === line.id);
      const valueText = definition ? describeSpecialLine(definition, line.value) : `+${toPercent(line.value)}`;
      return `<span class="equipped-special-line"><strong>${line.name}:</strong> ${valueText}</span>`;
    })
    .join('');
}

function renderItemStatLine(stat, value, extraClass = '') {
  const icon = getStatIconClass(stat);
  const iconType = icon.startsWith('icon-unique-') ? 'unique-icon' : 'stat-icon';
  return `<span class="item-stat-line ${extraClass}"><i class="${iconType} ${icon}" aria-hidden="true"></i><span>${getStatLabel(stat)}</span><b>${value}</b></span>`;
}

function describeSpecialLine(definition, value) {
  return definition.descriptionTemplate.replace('{value}', toPercent(value));
}

function getStatIconClass(stat) {
  const icons = {
    maxHp: 'icon-stat-hp',
    maxMana: 'icon-stat-mana',
    attack: 'icon-stat-attack',
    defense: 'icon-unique-defense',
    speed: 'icon-stat-speed',
    accuracy: 'icon-stat-accuracy',
    dodgeRate: 'icon-stat-dodge',
    blockRate: 'icon-unique-block',
    critRate: 'icon-stat-crit',
    critDamage: 'icon-unique-critical-damage',
    armorPierce: 'icon-unique-armor-pierce',
    damageReduction: 'icon-unique-damage-reduction',
    lifeSteal: 'icon-unique-life-steal',
    spiritStoneBonus: 'icon-unique-spirit-stone',
    maxHpPercent: 'icon-stat-hp',
    maxManaPercent: 'icon-stat-mana',
    defensePercent: 'icon-unique-defense',
    reflectDamage: 'icon-unique-power',
    attackPercent: 'icon-stat-attack',
  };
  return icons[stat] || 'icon-unique-equipment';
}

function getStatLabel(stat) {
  const labels = {
    maxHp: 'Sinh lực',
    maxMana: 'Linh lực',
    attack: 'Công',
    defense: 'Thủ',
    accuracy: 'Chính xác',
    dodgeRate: 'Né',
    blockRate: 'Đỡ',
    blockReduction: 'Giảm khi đỡ',
    critRate: 'Chí mạng',
    critDamage: 'ST chí mạng',
    lifeSteal: 'Hấp huyết',
    armorPierce: 'Phá giáp',
    victoryRecovery: 'Dưỡng khí',
    spiritStoneBonus: 'Tầm bảo',
    damageReduction: 'Hộ thể',
    maxHpPercent: 'Cường thân',
    maxManaPercent: 'Tụ linh',
    defensePercent: 'Tăng thủ',
    reflectDamage: 'Phản chấn',
    attackPercent: 'Tăng tấn công',
  };
  return labels[stat] || stat;
}

function isPercentStat(stat) {
  return ['accuracy', 'dodgeRate', 'blockRate', 'blockReduction', 'critRate', 'critDamage', 'lifeSteal', 'armorPierce', 'victoryRecovery', 'spiritStoneBonus', 'damageReduction', 'maxHpPercent', 'maxManaPercent', 'defensePercent', 'reflectDamage', 'attackPercent'].includes(stat);
}

function roundStat(value) {
  return Math.round(value * 1000) / 1000;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
