let maxTurns = 0;
let turnInterval = 0;
let playerMaxMinorLevel = 0;
let wanderEventDelay = 0;
let cultivationRewardMultiplier = 0;
let questRewardGrowthMultiplier = 1.3;
let gameConfig = {};
const cultivationRealmsPath = '/assets/Resources/Data/Shared/CultivationRealms.json';
const cultivationRealmOrderVersion = 2;
const legacyMajorRealmOrder = Object.freeze([
  'Thối Thể', 'Khai Nguyên', 'Khí Động', 'Ly Hợp', 'Chân Nguyên', 'Trúc Cơ',
  'Thần Du', 'Kết Đan', 'Nguyên Anh', 'Siêu Phàm', 'Nhập Thánh', 'Thánh Vương',
  'Hóa Thần', 'Phản Hư', 'Anh Biến', 'Hư Vương', 'Vấn Đỉnh', 'Đạo Nguyên',
  'Luyện Hư', 'Hợp Thể', 'Đại Thừa', 'Đế Tôn', 'Độ Kiếp', 'Đạo Ấn',
  'Khai Thiên', 'Sáng Thế', 'Luyện Khí', 'Kết Tinh', 'Kim Đan', 'Cụ Linh',
  'Ngộ Đạo', 'Vũ Hóa', 'Đăng Tiên',
]);
const gameConfigPath = '/assets/Resources/Data/System/GameConfig.json?v=20260906-resource-dungeon-boss-development-v1';
const shopItemsPath = '/assets/Resources/Data/Tabs/Shop/ShopItems.json?v=20260909-pet-chest-rates-v1';
const starterDataPath = '/assets/Resources/Data/System/StarterData.json';
const equipmentPath = '/assets/Resources/Data/Shared/equipment.json';
const progressionFeaturesPath = '/assets/Resources/Data/System/ProgressionFeatures.json?v=20260906-resource-dungeon-boss-development-v1';
const cultivationSchoolsPath = '/assets/Resources/Data/Shared/CultivationSchools.json?v=20260906-blade-school-skills-v1';
const cultivationSkillsPath = '/assets/Resources/Data/Shared/CultivationSkills.json?v=20260906-sword-intent-v12';
const combatStatsPath = '/assets/Resources/Data/Shared/CombatStats.json';
const combatStylesPath = '/assets/Resources/Data/Shared/CombatStyles.json';
const enemyStatsPath = '/assets/Resources/Data/Shared/EnemyStats.json?v=20260906-enemy-realm-rates-v1';
const enemySkillsPath = '/assets/Resources/Data/Shared/EnemySkills.json?v=20260906-enemy-skill-damage-v2';
const questDataPath = '/assets/Resources/Data/Tabs/Quests/Quests.json?v=20260906-explore-reward-v1';
const petDataPath = '/assets/Resources/Data/Tabs/Pets/PetData.json?v=20260909-pet-ui-v1';
const petRealmsPath = '/assets/Resources/Data/Tabs/Pets/PetRealms.json';
const enemySkillEffectSpritePath = '/assets/Art/Sprites/Effects/chibi-sword-slash-sheet.png';
const battleSkillAnimationFps = 12;
const battleSkillImpactRatio = 0.5;
const battleSkillTurnBuffer = 120;
const battleEnemyTurnDelay = 100;
const playerSkillEffectSprites = Object.freeze({
  beginner_sword_art: '/assets/Art/Sprites/Effects/skill-beginner-sword-art-sheet-premium.png',
  sword_quickdraw: '/assets/Art/Sprites/Effects/skill-sword-quickdraw-sheet-premium.png',
  sword_flash: '/assets/Art/Sprites/Effects/skill-sword-flash-sheet-premium.png',
  sword_flow: '/assets/Art/Sprites/Effects/skill-sword-flow-sheet-premium.png',
  sword_domain: '/assets/Art/Sprites/Effects/skill-sword-domain-sheet-premium.png',
  sword_storm: '/assets/Art/Sprites/Effects/skill-sword-storm-sheet-premium.png',
  sword_earth_rift: '/assets/Art/Sprites/Effects/skill-sword-earth-rift-sheet-premium.png',
  sword_earth_lotus: '/assets/Art/Sprites/Effects/skill-sword-earth-lotus-sheet-premium.png',
  sword_heaven_starfall: '/assets/Art/Sprites/Effects/skill-sword-heaven-starfall-sheet-premium.png',
  sword_heaven_realm: '/assets/Art/Sprites/Effects/skill-sword-heaven-realm-sheet-premium.png',
  beginner_blade_art: '/assets/Art/Sprites/Effects/skill-blade-beginner-art-sheet-premium.png',
  blade_heavy: '/assets/Art/Sprites/Effects/skill-blade-heavy-sheet-premium.png',
  blade_blood: '/assets/Art/Sprites/Effects/skill-blade-blood-sheet-premium.png',
  blade_rend: '/assets/Art/Sprites/Effects/skill-blade-rend-sheet-premium.png',
  blade_heaven: '/assets/Art/Sprites/Effects/skill-blade-heaven-sheet-premium.png',
  blade_apocalypse: '/assets/Art/Sprites/Effects/skill-blade-apocalypse-sheet-premium.png',
  blade_earth_sunder: '/assets/Art/Sprites/Effects/skill-blade-earth-sunder-sheet-premium.png',
  blade_earth_warcry: '/assets/Art/Sprites/Effects/skill-blade-earth-warcry-sheet-premium.png',
  blade_heaven_overlord: '/assets/Art/Sprites/Effects/skill-blade-heaven-overlord-sheet-premium.png',
  blade_heaven_worldsplitter: '/assets/Art/Sprites/Effects/skill-blade-heaven-worldsplitter-sheet-premium.png',
});
const maxEquipmentLevel = 50;
const equipmentLevelsPerChestTier = 5;
const maxEquipmentInventory = 100;
const maxShopPurchaseQuantity = 999;
const cloudSaveEndpoint = '/api/game-state';
const cloudAuthEndpoint = '/api/auth';
const mailEndpoint = '/api/mail';
const worldBossEndpoint = '/api/world-boss';
let saveKey = '';
let baseSaveKey = '';
let legacySaveKeys = [];
let defaultPlayerName = '';
let ascensionPermitItemId = '';
let cloudUser = null;
let authMode = 'login';
let authSubmitting = false;
let cloudSaveTimer = 0;
let cloudPendingData = null;
let cloudPeriodicSaveTimer = 0;
let cloudPeriodicSyncInFlight = false;
let cloudSaveInFlight = null;
let cloudSyncUnavailable = false;
let cloudSessionId = '';
let cloudSaveVersion = 0;
let cloudSessionInvalid = false;
let cloudForegroundSyncTimer = 0;
let cloudForegroundSyncInFlight = false;
let cloudWasHidden = false;
let cloudLastForegroundSyncAt = 0;
let cloudExitSaveSent = false;
let authServiceAvailable = false;
let mailMessages = [];
let mailUnreadCount = 0;
let mailLastCheckedAt = 0;
let mailNewCount = 0;
let mailPollingTimer = 0;
let mailPollingInFlight = false;
let mailClaimInFlight = new Set();
let mailExpandedId = '';
let mailNextBefore = null;

let baseStats = {};

let perLevel = {};
let cultivationPowerTable = null;

let majorRealmNames = [];
let majorRealmBreakthroughs = [];
let majorRealmMinorGrowths = [];
let cultivationProgression = [];
const enemyResourcePath = '/assets/Resources/Data/Shared/Enemies.json';
const wanderMapsPath = '/assets/Resources/Data/Tabs/Wander/WanderMaps.json';
let wanderMapDefaults = {};
let stageEnemyData = [];
let stages = [];
let wanderMaps = {};
let wanderMapList = [];
let enemyRankData = {};
let enemyStats = {};
let featureAccessNoticeTimer = 0;

function getCultivationTier(majorIndex, minorLevel) {
  const index = Math.max(0, Math.floor(Number(majorIndex) || 0));
  const level = Math.max(1, Math.floor(Number(minorLevel) || 1));
  if (!cultivationProgression.length) return index * playerMaxMinorLevel + level;
  return getRealmTierStart(index) + Math.min(level, getMinorRealmLevelCap(index)) - 1;
}

function getPlayerCultivationTier() {
  return getCultivationTier(playerMajorRealmIndex, playerLevel);
}

function getTierMajorIndex(tier) {
  const normalizedTier = Math.max(1, Math.floor(Number(tier) || 1));
  if (!cultivationProgression.length) {
    return Math.max(0, Math.floor((normalizedTier - 1) / playerMaxMinorLevel));
  }
  let start = 1;
  for (let index = 0; index < cultivationProgression.length; index += 1) {
    const cap = getMinorRealmLevelCap(index);
    if (normalizedTier < start + cap) return index;
    start += cap;
  }
  return Math.max(0, cultivationProgression.length - 1);
}

function getTierMinorLevel(tier) {
  const normalizedTier = Math.max(1, Math.floor(Number(tier) || 1));
  const majorIndex = getTierMajorIndex(normalizedTier);
  return Math.max(1, Math.min(
    getMinorRealmLevelCap(majorIndex),
    normalizedTier - getRealmTierStart(majorIndex) + 1,
  ));
}

function getMinorRealmNames(majorIndex = playerMajorRealmIndex) {
  const configured = cultivationProgression[majorIndex]?.minorRealms;
  return Array.isArray(configured) && configured.length
    ? [...configured]
    : ['Nhất tầng', 'Nhị tầng', 'Tam tầng', 'Tứ tầng', 'Ngũ tầng', 'Lục tầng', 'Thất tầng', 'Bát tầng', 'Cửu tầng'];
}

function getMinorRealmLevelCap(majorIndex = playerMajorRealmIndex) {
  const names = cultivationProgression[majorIndex]?.minorRealms;
  return Array.isArray(names) && names.length ? names.length : playerMaxMinorLevel;
}

function getMajorRealmMaxIndex() {
  return Math.max(0, majorRealmNames.length - 1);
}

function migrateRealmIndexForCurrentOrder(value, savedOrderVersion = 1) {
  const savedIndex = Math.max(0, Math.floor(Number(value) || 0));
  if (Number(savedOrderVersion) >= cultivationRealmOrderVersion) {
    return clamp(savedIndex, 0, getMajorRealmMaxIndex());
  }
  const savedRealmName = legacyMajorRealmOrder[savedIndex];
  const currentIndex = majorRealmNames.indexOf(savedRealmName);
  return clamp(currentIndex >= 0 ? currentIndex : savedIndex, 0, getMajorRealmMaxIndex());
}

function getRealmTierStart(majorIndex = playerMajorRealmIndex) {
  const index = Math.max(0, Math.floor(Number(majorIndex) || 0));
  let start = 1;
  for (let realmIndex = 0; realmIndex < index; realmIndex += 1) {
    start += getMinorRealmLevelCap(realmIndex);
  }
  return start;
}

function getMinorRealmName(level, majorIndex = playerMajorRealmIndex) {
  const names = getMinorRealmNames(majorIndex);
  const index = Math.max(0, Math.floor(Number(level) || 1) - 1);
  return names[index] || `Tầng ${index + 1}`;
}

function formatRealmDisplayText(value) {
  return String(value ?? '').replace(/\s+cảnh\s+/g, ' ');
}

function getTierRealmText(tier) {
  const majorIndex = clamp(getTierMajorIndex(tier), 0, majorRealmNames.length - 1);
  const minorLevel = getTierMinorLevel(tier);
  return `${majorRealmNames[majorIndex]} ${getMinorRealmName(minorLevel, majorIndex)}`;
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
let equipmentIconSheets = {};
let equipmentIconFramesBySlot = {};
let equipmentLevelColorGroups = [];
let equipmentSetNames = [];
let specialLineData = [];
let equipmentChestRarityProfiles = [];
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
let trialTowerData = { entryRequiredTier: 31, entryText: '', floors: [] };
let enemySkillData = { defaultSkill: {}, skills: [], assignments: {} };
let questData = { title: 'Nhiệm vụ', quests: [] };
let petData = { maxStars: 5, feed: {}, starUpgrade: {}, pets: [] };
let petRealmData = { realmSystem: 'pet', realms: [] };

let shopItems = [];
let minorBreakthroughPillConfig = {};
let majorAscensionTreasureConfig = {};
let majorAscensionTreasureChestConfig = {};
let shopCategory = 'all';
let questCategory = 'main';
const temporarilyDisabledQuestCategories = new Set(['side']);
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
let skillLearningComprehension = 0;
let redeemedCodes = {};
let claimedMailIds = [];
let foundationFindCounts = {};
let foundationPillPurchases = {};
let cultivationPillPurchases = {};
let potionPurchaseCounts = {};
let ascensionPillPurchases = {};
let majorAscensionTreasureChestPurchases = {};
let cultivationSpeedBonus = 0;
let playerCurrentHp = null;
let playerCurrentMana = null;
let healthPotionCount = 0;
let manaPotionCount = 0;
let enhancementStones = 0;
let skillBooks = {};
let skillFragments = {};
let shopInventoryCounts = {};
let talentTreasureInventory = [];
let talentTreasureIdSeed = 1;
let playerTalentStatBonuses = {};
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
let trainingDummyDamageDealt = 0;
let worldBossDamageDealt = 0;
let worldBossData = null;
let worldBossLoadInFlight = null;
let worldBossAttackInFlight = false;
let worldBossAttackId = '';
let battleReturnTab = 'map';
let battleReturnToWander = false;
let beastHuntBattleActive = false;
let turn = 0;
let battleTurn20BoostApplied = false;
let timer = 0;
let battleResultTimer = 0;
let wanderTimer = 0;
let wanderRefreshTimer = 0;
let wanderContinueTimer = 0;
let autoWanderRecoveryTimer = 0;
let autoWanderAfterRecovery = false;
let wanderChestRewards = [];
let wanderChestCapacity = 0;
let wanderChestCapacityPerMajorRealm = 0;
let highEnemyEncounterChance = false;
let autoWanderEnabled = false;
let wanderEventRollCount = 0;
let dantianCultivation = 0;
let dantianCultivationSeconds = 0;
let offlineCapSeconds = 0;
let resourceRegenTimer = 0;
let activityRefreshTimer = 0;
let worldBossRefreshTimer = 0;
let selectedStage = null;
let selectedEnhancementItemId = 0;
let currentDungeonId = '';
let currentWanderMapId = '';
let beastHuntMapId = '';
let beastHuntRespawnAt = 0;
let beastHuntNotificationPending = false;
let beastHuntPendingReward = null;
let activeActivityTab = 'beastHunt';
let trainingDummyLastDamage = 0;
let trainingDummyLastTurns = 0;
let wanderCarouselCleanup = null;
let trialTowerHighestCleared = 0;
let claimedQuestIds = new Set();
let wanderWinCount = 0;
let wanderRewardCount = 0;
let wanderDefeatedByMap = {};
let wanderBossDefeatedByMap = {};
let trialTowerWinCount = 0;
let equipmentEquipCounts = {};
let dailyQuestProgress = { date: getDailyKey(), wanderWins: 0, wanderRewards: 0, trialTowerWins: 0, resourceDungeonWins: 0 };
let currentWanderEvent = null;
let dailyDungeonAttempts = { date: getDailyKey() };
let dailyResourceAttempts = { date: getDailyKey() };
let dailyEquipmentChestPurchases = { date: getDailyKey(), total: 0 };
let dailyShopPurchases = { date: getDailyKey(), counts: {} };
let resourceDungeonProgress = {};
let playerBattleState = createDefaultPlayerBattleState();
let activeSkillId = '';
let skillTrainingId = '';
let expandedSkillDetailsId = '';
let selectedPetId = '';
let deployedPetId = '';
let petStates = {};
let petFragments = {};
let ownedPetIds = [];
let hasMajorAscensionPermit = false;
let resettingGameData = false;
let loadingTargetProgress = 1;
let loadingShownProgress = 1;
let loadingAnimationFrame = 0;
let loadingComplete = false;
let loadingHideScheduled = false;
const audioPreferenceKey = 'tuTienAudioEnabled';
let audioEnabled = true;
let audioContext = null;
let audioMasterGain = null;
let audioResumePromise = null;
let audioFallbackEnabled = false;
const audioFallbackCache = new Map();
const criticalAssetPaths = [
  '/assets/Art/Textures/game-background-mobile.png',
  '/assets/Art/Sprites/UI/chibi-ui-icon-sheet-12-1254.png',
  '/assets/Art/Sprites/UI/chibi-stat-icon-sheet.png',
  '/assets/Art/Sprites/UI/chibi-item-status-icon-sheet.png',
  '/assets/Art/Sprites/UI/chibi-activity-icon-sheet.png',
  '/assets/Art/Sprites/UI/chibi-pet-reward-action-icon-sheet-16-1254.png',
];

const $ = (id) => document.getElementById(id);
function setPanelMessage(id, message, useHtml = false) {
  const element = $(id);
  if (!element) return;
  if (useHtml) element.innerHTML = message;
  else element.textContent = message;
}
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
const petPanel = $('petPanel');
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
const petButton = $('petButton');
const shopButton = $('shopButton');
const resourceDungeonButton = $('resourceDungeonButton');
const playerBattleButton = document.querySelector('[data-activity-tab="playerBattle"]');
const trialTowerButton = $('trialTowerButton');
const audioToggleButton = $('audioToggleButton');
const codeInput = $('codeInput');
const redeemCodeButton = $('redeemCodeButton');
const questButton = $('questButton');
const activityButton = $('activityButton');
const mailButton = $('mailButton');
const activityCategoryFilters = $('activityCategoryFilters');
const questCategoryFilters = $('questCategoryFilters');
const dungeonBadge = $('dungeonBadge');
const trainingBadge = $('trainingBadge');
const questBadge = $('questBadge');
const activityBadge = $('activityBadge');
const mailBadge = $('mailBadge');
const resourceDungeonBadge = $('resourceDungeonBadge');
const equipmentBadge = $('equipmentBadge');
const resourceDungeonPanel = $('resourceDungeonPanel');
const trialTowerPanel = $('trialTowerPanel');
const questPanel = $('questPanel');
const activityPanel = $('activityPanel');
const mailPanel = $('mailPanel');
const mailInboxPanel = $('mailInboxPanel');
const mailList = $('mailList');
const mailSummary = $('mailSummary');
const mailUnreadSummary = $('mailUnreadSummary');
const mailRefreshButton = $('mailRefreshButton');
const codeRedeemPanel = $('codeRedeemPanel');
const mailLoadMoreButton = $('mailLoadMoreButton');
const resetDataButton = $('resetDataButton');
const featureAccessNotice = $('featureAccessNotice');
const resetConfirmModal = $('resetConfirmModal');
const logoutConfirmModal = $('logoutConfirmModal');
const authOverlay = $('authOverlay');
const authForm = $('authForm');
const authTitle = $('authTitle');
const authUsername = $('authUsername');
const authPassword = $('authPassword');
const authPasswordConfirmationWrap = $('authPasswordConfirmationWrap');
const authPasswordConfirmation = $('authPasswordConfirmation');
const authMessage = $('authMessage');
const authSubmitButton = $('authSubmitButton');
const loginModeButton = $('loginModeButton');
const registerModeButton = $('registerModeButton');
const accountBar = $('accountBar');
const accountName = $('accountName');
const logoutButton = $('logoutButton');
const closeLogoutModalButton = $('closeLogoutModalButton');
const cancelLogoutButton = $('cancelLogoutButton');
const confirmLogoutButton = $('confirmLogoutButton');

const closeResetModalButton = $('closeResetModalButton');
const cancelResetButton = $('cancelResetButton');
const confirmResetButton = $('confirmResetButton');
const breakthroughModal = $('breakthroughModal');
const closeBreakthroughModalButton = $('closeBreakthroughModalButton');
const confirmBreakthroughButton = $('confirmBreakthroughButton');
const breakthroughModalTitle = $('breakthroughModalTitle');
const breakthroughModalSummary = $('breakthroughModalSummary');
const breakthroughStatList = $('breakthroughStatList');
const breakthroughRequiredItem = $('breakthroughRequiredItem');
const breakthroughTreasureSection = $('breakthroughTreasureSection');
const breakthroughTreasureList = $('breakthroughTreasureList');
let selectedBreakthroughTreasureId = '';
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
  quests: questButton,
  activities: activityButton,
  mail: mailButton,
  equipment: equipmentButton,
  inventory: inventoryButton,
  pets: petButton,
  shop: shopButton,
  trialTower: trialTowerButton,
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
const enhancementDetailOverlay = document.createElement('div');
enhancementDetailOverlay.className = 'wander-event-overlay is-hidden';
document.body.appendChild(enhancementDetailOverlay);
const onboardingOverlay = document.createElement('div');
onboardingOverlay.className = 'onboarding-overlay is-hidden';
document.body.appendChild(onboardingOverlay);
let onboardingStep = 0;
let onboardingTargetElement = null;
let onboardingTargetClickHandler = null;
let onboardingAdvanceQueued = false;

const onboardingSteps = [
  {
    iconType: 'game-icon',
    icon: 'icon-flame',
    title: 'Chào mừng đạo hữu',
    text: 'Ta sẽ dẫn đạo hữu làm quen với những thao tác đầu tiên. Sau mỗi lời nhắc, hãy bấm nút Tiếp theo để ta chỉ đúng nơi cần dùng.',
    action: 'Bắt đầu hướng dẫn',
  },
  {
    iconType: 'game-icon',
    icon: 'icon-compass',
    title: 'Bước 1: Mở Tu luyện',
    text: 'Tu luyện tự động tạo tu vi theo thời gian và giúp hồi phục tài nguyên. Hãy bấm vào nút Tu luyện đang phát sáng.',
    targetSelector: '#trainingButton',
    targetLabel: 'nút Tu luyện',
  },
  {
    iconType: 'activity-icon',
    icon: 'icon-activity-path',
    title: 'Bước 2: Mở Ngao du',
    text: 'Ngao du giúp đạo hữu gặp cơ duyên hoặc kẻ địch sau mỗi khoảng thời gian. Hãy bấm vào nút Ngao du để mở bản đồ.',
    targetSelector: '#dungeonButton',
    targetLabel: 'nút Ngao du',
  },
  {
    iconType: 'game-icon',
    icon: 'icon-compass',
    title: 'Bước 3: Xem thông tin map',
    text: 'Map đang sáng là nơi đạo hữu có thể đi ngay. Hãy xem khoảng tu vi, phần thưởng và dòng kẻ địch trước khi lên đường.',
    action: 'Chỉ mình nút bắt đầu',
  },
  {
    iconType: 'activity-icon',
    icon: 'icon-activity-path',
    title: 'Bước 4: Bắt đầu ngao du',
    text: 'Đọc nhanh khoảng tu vi, phần thưởng và kẻ địch trong map. Khi đã sẵn sàng, hãy bấm nút bắt đầu đang phát sáng.',
    targetSelector: '.wander-info-panel > button:not(:disabled)',
    targetLabel: 'nút Bắt đầu ngao du',
  },
  {
    iconType: 'activity-icon',
    icon: 'icon-activity-fortune',
    title: 'Đạo hữu đã sẵn sàng',
    text: 'Rất tốt! Hãy tu luyện để mạnh lên, ngao du để nhận tài nguyên và quay lại khi cần xem hướng dẫn trong game.',
    action: 'Tiếp tục chơi',
  },
];

function readAudioPreference() {
  try {
    return window.localStorage.getItem(audioPreferenceKey) !== 'off';
  } catch (error) {
    return true;
  }
}

function saveAudioPreference() {
  try {
    window.localStorage.setItem(audioPreferenceKey, audioEnabled ? 'on' : 'off');
  } catch (error) {
    // Audio preference is optional when browser storage is unavailable.
  }
}

function updateAudioToggleButton() {
  if (!audioToggleButton) return;
  audioToggleButton.classList.toggle('is-muted', !audioEnabled);
  audioToggleButton.setAttribute('aria-pressed', String(audioEnabled));
  audioToggleButton.title = audioEnabled ? 'Tắt âm thanh' : 'Bật âm thanh';
  const label = audioToggleButton.querySelector('span');
  if (label) label.textContent = audioEnabled ? 'Âm thanh' : 'Âm thanh tắt';
}

function ensureAudioStarted() {
  if (!audioEnabled) return false;
  if (audioContext) {
    if (audioContext.state === 'suspended') {
      audioResumePromise = audioContext.resume().catch(() => {});
    }
    return true;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    audioFallbackEnabled = typeof window.Audio === 'function';
    if (!audioFallbackEnabled) {
      console.warn('Trình duyệt không hỗ trợ phát âm thanh.');
    }
    return audioFallbackEnabled;
  }
  try {
    audioContext = new AudioContextClass();
    audioMasterGain = audioContext.createGain();
    audioMasterGain.gain.value = 0.7;
    audioMasterGain.connect(audioContext.destination);
    if (audioContext.state === 'suspended') {
      audioResumePromise = audioContext.resume().catch(() => {});
    }
    return true;
  } catch (error) {
    audioContext = null;
    audioMasterGain = null;
    audioFallbackEnabled = typeof window.Audio === 'function';
    return audioFallbackEnabled;
  }
}

function createFallbackToneDataUri(frequency, duration, volume, endFrequency) {
  const sampleRate = 22050;
  const sampleCount = Math.max(1, Math.floor(sampleRate * duration));
  const cacheKey = [frequency, duration, volume, endFrequency || ''].join(':');
  if (audioFallbackCache.has(cacheKey)) return audioFallbackCache.get(cacheKey);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  const writeText = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, sampleCount * 2, true);
  for (let index = 0; index < sampleCount; index += 1) {
    const progress = index / sampleCount;
    const currentFrequency = endFrequency
      ? frequency + (endFrequency - frequency) * progress
      : frequency;
    const envelope = Math.min(1, index / (sampleRate * 0.015), (sampleCount - index) / (sampleRate * 0.05));
    const sample = Math.sin((2 * Math.PI * currentFrequency * index) / sampleRate) * volume * envelope;
    view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, sample)) * 32767, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  const dataUri = `data:audio/wav;base64,${window.btoa(binary)}`;
  audioFallbackCache.set(cacheKey, dataUri);
  return dataUri;
}

function playFallbackTone(frequency, duration, options = {}) {
  if (!audioEnabled || !audioFallbackEnabled || typeof window.Audio !== 'function') return;
  const delay = Math.max(0, Number(options.delay) || 0);
  const source = new window.Audio(createFallbackToneDataUri(
    Math.max(40, Number(frequency) || 440),
    duration,
    Math.min(1, Math.max(0.08, (Number(options.volume) || 0.04) * 8)),
    options.endFrequency,
  ));
  source.volume = 0.7;
  source.preload = 'auto';
  const play = () => source.play().catch(() => {});
  if (delay) window.setTimeout(play, delay * 1000);
  else play();
}

function playAudioTone(frequency, duration = 0.12, options = {}) {
  if (!audioEnabled) return;
  if (!audioContext || !audioMasterGain) {
    playFallbackTone(frequency, duration, options);
    return;
  }
  const start = audioContext.currentTime + Math.max(0, Number(options.delay) || 0);
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const volume = Math.max(0.0001, Number(options.volume) || 0.04);
  const attack = Math.min(0.04, duration * 0.35);
  const release = Math.min(0.1, duration * 0.45);
  oscillator.type = options.type || 'sine';
  oscillator.frequency.setValueAtTime(Math.max(40, Number(frequency) || 440), start);
  if (options.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, Number(options.endFrequency)), start + duration);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + attack);
  gain.gain.setValueAtTime(volume, start + Math.max(attack, duration - release));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audioMasterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

async function playAudioCue(cue) {
  if (!ensureAudioStarted()) return;
  if (audioResumePromise) await audioResumePromise;
  if (audioContext && audioContext.state !== 'running') {
    audioFallbackEnabled = typeof window.Audio === 'function';
    if (audioFallbackEnabled) {
      audioContext.close().catch(() => {});
      audioContext = null;
      audioMasterGain = null;
    }
  }
  const patterns = {
    click: [[440, 0.055, 'square', 0.025]],
    confirm: [[523.25, 0.1, 'triangle', 0.045], [659.25, 0.14, 'triangle', 0.045, 0.07]],
    success: [[523.25, 0.1, 'triangle', 0.05], [659.25, 0.1, 'triangle', 0.05, 0.08], [783.99, 0.16, 'triangle', 0.05, 0.16]],
    error: [[220, 0.14, 'sawtooth', 0.035], [165, 0.2, 'sawtooth', 0.03, 0.1]],
    reward: [[659.25, 0.08, 'triangle', 0.05], [783.99, 0.08, 'triangle', 0.05, 0.07], [1046.5, 0.2, 'triangle', 0.06, 0.14]],
    breakthrough: [[392, 0.12, 'triangle', 0.045], [523.25, 0.12, 'triangle', 0.05, 0.1], [783.99, 0.3, 'triangle', 0.06, 0.2]],
    hit: [[150, 0.08, 'square', 0.035, 0, 90]],
    skill: [[330, 0.09, 'sine', 0.04], [660, 0.14, 'triangle', 0.045, 0.06]],
    critical: [[220, 0.08, 'square', 0.04], [440, 0.16, 'sawtooth', 0.045, 0.06]],
    dodge: [[500, 0.12, 'sine', 0.035, 0, 180]],
    victory: [[523.25, 0.12, 'triangle', 0.055], [659.25, 0.12, 'triangle', 0.055, 0.1], [1046.5, 0.3, 'triangle', 0.06, 0.2]],
    defeat: [[247, 0.18, 'sine', 0.04], [196, 0.28, 'sine', 0.035, 0.14]],
  };
  (patterns[cue] || patterns.click).forEach(([frequency, duration, type, volume, delay = 0, endFrequency]) => {
    playAudioTone(frequency, duration, { type, volume, delay, endFrequency });
  });
}

function toggleAudio() {
  audioEnabled = !audioEnabled;
  saveAudioPreference();
  updateAudioToggleButton();
  if (audioEnabled) {
    ensureAudioStarted();
    playAudioCue('confirm');
  } else {
    if (audioContext?.state === 'running') audioContext.suspend().catch(() => {});
  }
}

function hideBattleResultOverlay() {
  window.clearTimeout(battleResultTimer);
  battleResultTimer = 0;
  battleResultOverlay.classList.add('is-hidden');
  battleResultOverlay.innerHTML = '';
}

function hideOnboardingGuide() {
  clearOnboardingTarget();
  onboardingOverlay.classList.remove('has-target');
  onboardingOverlay.classList.add('is-hidden');
  onboardingOverlay.innerHTML = '';
}

function clearOnboardingTarget() {
  if (onboardingTargetElement && onboardingTargetClickHandler) {
    document.removeEventListener('click', onboardingTargetClickHandler, true);
    onboardingTargetElement.removeEventListener('click', onboardingTargetClickHandler, true);
  }
  onboardingTargetElement?.classList.remove('onboarding-target');
  onboardingTargetElement = null;
  onboardingTargetClickHandler = null;
  onboardingAdvanceQueued = false;
}

function positionOnboardingCard(target) {
  const card = onboardingOverlay.querySelector('.onboarding-card');
  if (!card || !target) return;
  const targetRect = target.getBoundingClientRect();
  const margin = 14;
  const cardRect = card.getBoundingClientRect();
  const maxLeft = Math.max(margin, window.innerWidth - cardRect.width - margin);
  const left = Math.min(Math.max(margin, targetRect.left), maxLeft);
  const belowTop = targetRect.bottom + margin;
  const aboveTop = targetRect.top - cardRect.height - margin;
  const top = belowTop + cardRect.height <= window.innerHeight - margin || aboveTop < margin
    ? Math.min(belowTop, window.innerHeight - cardRect.height - margin)
    : aboveTop;
  card.style.left = `${left}px`;
  card.style.top = `${Math.max(margin, top)}px`;
}

function queueOnboardingTargetAdvance() {
  if (onboardingAdvanceQueued) return;
  onboardingAdvanceQueued = true;
  window.setTimeout(() => {
    clearOnboardingTarget();
    onboardingStep += 1;
    if (onboardingStep >= onboardingSteps.length) {
      hideOnboardingGuide();
      return;
    }
    renderOnboardingGuide();
  }, 0);
}

function bindOnboardingTarget(step) {
  if (!step.targetSelector) return;
  const target = document.querySelector(step.targetSelector);
  if (!target) return;
  onboardingTargetElement = target;
  onboardingAdvanceQueued = false;
  target.classList.add('onboarding-target');
  onboardingTargetClickHandler = (event) => {
    const clickedTarget = event.currentTarget === target
      ? target
      : event.target instanceof Element
      ? event.target.closest(step.targetSelector)
      : null;
    if (clickedTarget !== target) return;
    queueOnboardingTargetAdvance();
  };
  document.addEventListener('click', onboardingTargetClickHandler, true);
  target.addEventListener('click', onboardingTargetClickHandler, true);
  target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
  window.requestAnimationFrame(() => positionOnboardingCard(target));
}

function renderOnboardingGuide() {
  clearOnboardingTarget();
  const step = onboardingSteps[onboardingStep] || onboardingSteps[0];
  const hasTarget = Boolean(step.targetSelector);
  onboardingOverlay.classList.toggle('has-target', hasTarget);
  onboardingOverlay.innerHTML = `
    <div class="onboarding-card ${hasTarget ? 'has-target' : ''}" role="dialog" aria-modal="true" aria-labelledby="onboardingTitle">
      <div class="onboarding-guide-visual"><img src="/assets/Art/Sprites/Characters/onboarding-guide.png" alt="Nữ hướng dẫn viên chibi" /></div>
      <span class="onboarding-kicker"><i class="${step.iconType} ${step.icon}" aria-hidden="true"></i>Hướng dẫn nhập môn · ${onboardingStep + 1}/${onboardingSteps.length}</span>
      <h2 id="onboardingTitle">${step.title}</h2>
      <p>${step.text}</p>
      ${hasTarget ? `<p class="onboarding-target-hint"><i class="activity-icon icon-activity-guide" aria-hidden="true"></i>Hãy bấm vào ${step.targetLabel} đang phát sáng để tiếp tục.</p>` : ''}
      <div class="onboarding-actions">
        <button type="button" class="secondary compact onboarding-skip">Bỏ qua</button>
        <button type="button" class="${hasTarget ? 'secondary' : 'breakthrough'} compact onboarding-next" ${buttonDisabledAttributes(hasTarget, 'Hãy thực hiện thao tác được hướng dẫn trước.')}><i class="${step.iconType} ${step.icon}" aria-hidden="true"></i>${hasTarget ? 'Đang chờ thao tác' : step.action}</button>
      </div>
    </div>
  `;
  onboardingOverlay.querySelector('.onboarding-skip').addEventListener('click', hideOnboardingGuide);
  if (!hasTarget) {
    onboardingOverlay.querySelector('.onboarding-next').addEventListener('click', () => {
      onboardingStep += 1;
      if (onboardingStep >= onboardingSteps.length) {
        hideOnboardingGuide();
        return;
      }
      renderOnboardingGuide();
    });
  }
  bindOnboardingTarget(step);
}

function showOnboardingGuide() {
  onboardingStep = 0;
  onboardingOverlay.classList.remove('is-hidden');
  renderOnboardingGuide();
}

audioEnabled = readAudioPreference();
updateAudioToggleButton();
audioToggleButton?.addEventListener('click', toggleAudio);
document.addEventListener('pointerdown', () => {
  if (audioEnabled) ensureAudioStarted();
}, { passive: true });
function getButtonDisabledMessage(button) {
  return button.dataset.disabledToast || button.title || 'Chức năng này hiện chưa thể sử dụng.';
}

function buttonDisabledAttributes(disabled, message) {
  if (!disabled) return '';
  const safeMessage = String(message || 'Chức năng này hiện chưa thể sử dụng.')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return `aria-disabled="true" data-disabled-toast="${safeMessage}"`;
}

function setButtonDisabledState(button, disabled, message) {
  if (!button) return;
  const unavailable = Boolean(disabled);
  button.disabled = false;
  button.classList.toggle('is-unavailable', unavailable);
  button.setAttribute('aria-disabled', String(unavailable));
  if (unavailable) button.dataset.disabledToast = message || 'Chức năng này hiện chưa thể sử dụng.';
  else delete button.dataset.disabledToast;
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('button[data-disabled-toast]') : null;
  if (!target) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  showGameToast(getButtonDisabledMessage(target), 'locked');
}, true);
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('button') : null;
  if (target && target !== audioToggleButton && !target.disabled) playAudioCue('click');
}, true);

backButton?.addEventListener('click', () => {
  if (battlePanel?.classList.contains('is-hidden')) {
    showMap();
    return;
  }
  returnFromBattleScreen();
});
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
petButton?.addEventListener('click', showPets);
shopButton.addEventListener('click', showShop);
shopCategoryFilters?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-shop-category]');
  if (!button) return;
  shopCategory = button.dataset.shopCategory || 'all';
  renderShop();
});
trialTowerButton?.addEventListener('click', showTrialTower);
redeemCodeButton?.addEventListener('click', redeemCode);
codeInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') redeemCode();
});
questButton?.addEventListener('click', showQuests);
activityButton?.addEventListener('click', showActivities);
mailButton?.addEventListener('click', showMail);
activityCategoryFilters?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-activity-tab]');
  if (!button) return;
  const tabId = button.dataset.activityTab || 'beastHunt';
  if (tabId === 'arena') {
    showGameToast('Hoạt động này đang phát triển.', 'locked');
    return;
  }
  showActivities(tabId);
});
mailRefreshButton?.addEventListener('click', () => loadMailList(true));
mailLoadMoreButton?.addEventListener('click', loadOlderMail);
mailList?.addEventListener('click', (event) => {
  const claimButton = event.target.closest('[data-mail-claim]');
  if (claimButton) {
    claimMailReward(claimButton.dataset.mailClaim);
    return;
  }
  const openButton = event.target.closest('[data-mail-open]');
  if (!openButton) return;
  const mailId = openButton.dataset.mailOpen;
  mailExpandedId = mailExpandedId === mailId ? '' : mailId;
  renderMailList();
  if (mailExpandedId === mailId) markMailRead(mailId);
});
questCategoryFilters?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-quest-category]');
  if (!button || temporarilyDisabledQuestCategories.has(button.dataset.questCategory)) return;
  questCategory = button.dataset.questCategory || 'main';
  renderQuests();
});
resetDataButton.addEventListener('click', openLogoutConfirm);
closeResetModalButton?.addEventListener('click', closeResetConfirm);
cancelResetButton?.addEventListener('click', closeResetConfirm);
confirmResetButton?.addEventListener('click', resetGameData);
closeLogoutModalButton?.addEventListener('click', closeLogoutConfirm);
cancelLogoutButton?.addEventListener('click', closeLogoutConfirm);
confirmLogoutButton?.addEventListener('click', logout);
closeBreakthroughModalButton?.addEventListener('click', closeBreakthroughPanel);
confirmBreakthroughButton?.addEventListener('click', breakthrough);
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
  if (target.dataset.inventorySell) return sellInventoryItem(target.dataset.inventorySell);
  if (target.dataset.inventoryDetail) return openInventoryItemDetail(target.dataset.inventoryDetail);
  if (target.dataset.petAction === 'select') return selectPet(target.dataset.petId);
  if (target.dataset.petAction === 'feed') return openPetConsumablePanel();
  if (target.dataset.petAction === 'close-items') return closePetConsumablePanel();
  if (target.dataset.petAction === 'use-item') {
    const quantity = target.closest('.pet-item-row')?.querySelector('input[type="number"]')?.value || 1;
    return usePetConsumableItem(target.dataset.itemId, quantity);
  }
  if (target.dataset.petAction === 'star') return upgradeSelectedPetStar();
  if (target.dataset.petAction === 'deploy') return deploySelectedPet();
  if (target.dataset.skillAction === 'details') return toggleSkillDetails(target.dataset.skillId);
  if (target.dataset.skillAction === 'select') return selectSkillTraining(target.dataset.skillId);
  if (target.dataset.skillAction === 'equip') return toggleEquipSkill(target.dataset.skillId);
  if (target.dataset.skillAction === 'upgrade') return upgradeSkill(target.dataset.skillId);
  if (target.dataset.resourceDungeon) return challengeResourceDungeon(target.dataset.resourceDungeon);
  if (target.dataset.trialFloor) return startTrialTowerBattle(Number(target.dataset.trialFloor));
  if (target.dataset.enhanceEquipped) return showEnhancement(Number(target.dataset.enhanceEquipped));
  if (target.dataset.enhanceItem) return enhanceEquipment(Number(target.dataset.enhanceItem));
  if (target.dataset.refundEnhancement) return refundEquipmentEnhancement(Number(target.dataset.refundEnhancement));
});
resetConfirmModal?.addEventListener('click', (event) => {
  if (event.target === resetConfirmModal) closeResetConfirm();
});
logoutConfirmModal?.addEventListener('click', (event) => {
  if (event.target === logoutConfirmModal) closeLogoutConfirm();
});
breakthroughModal?.addEventListener('click', (event) => {
  const treasureOption = event.target.closest('[data-breakthrough-treasure]');
  if (treasureOption) {
    selectedBreakthroughTreasureId = treasureOption.dataset.breakthroughTreasure || '';
    renderBreakthroughPanel();
    return;
  }
  if (event.target === breakthroughModal) closeBreakthroughPanel();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !resetConfirmModal?.classList.contains('is-hidden')) {
    closeResetConfirm();
    return;
  }
  if (event.key === 'Escape' && !logoutConfirmModal?.classList.contains('is-hidden')) {
    closeLogoutConfirm();
    return;
  }
  if (event.key === 'Escape' && !breakthroughModal?.classList.contains('is-hidden')) {
    closeBreakthroughPanel();
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
    return;
  }
  if (event.key === 'Escape' && !enhancementDetailOverlay.classList.contains('is-hidden')) {
    hideEnhancementDetail();
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
window.addEventListener('beforeunload', flushCloudSaveOnPageExit);
window.addEventListener('pagehide', (event) => {
  flushCloudSaveForLifecycle({ markExit: !event.persisted });
});
document.addEventListener('visibilitychange', handleCloudVisibilityChange);
window.addEventListener('pageshow', handleCloudPageShow);

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

function showGameToast(message, variant = 'success', rewardItems = []) {
  if (!featureAccessNotice) return;
  playAudioCue(variant === 'error' || variant === 'locked' ? 'error' : variant === 'info' ? 'click' : rewardItems.length ? 'reward' : 'success');
  window.clearTimeout(featureAccessNoticeTimer);
  featureAccessNotice.classList.remove('toast-success', 'toast-error', 'toast-locked');
  featureAccessNotice.classList.add(`toast-${variant}`);
  featureAccessNotice.replaceChildren();
  const messageNode = document.createElement('span');
  messageNode.textContent = message;
  featureAccessNotice.append(messageNode);
  if (Array.isArray(rewardItems) && rewardItems.length) {
    const rewardList = document.createElement('span');
    rewardList.className = 'toast-reward-list';
    rewardItems.forEach((item) => {
      const reward = document.createElement('span');
      reward.className = 'toast-reward-item';
      const icon = document.createElement('i');
      icon.className = item.iconClass;
      icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('b');
      label.textContent = item.label;
      reward.append(icon, label);
      rewardList.append(reward);
    });
    featureAccessNotice.append(rewardList);
  }
  featureAccessNotice.classList.remove('is-hidden');
  featureAccessNoticeTimer = window.setTimeout(hideFeatureAccessNotice, 3600);
}

function showEquipmentChangeToast(message, powerDelta) {
  if (!featureAccessNotice) return;
  playAudioCue('success');
  window.clearTimeout(featureAccessNoticeTimer);
  featureAccessNotice.classList.remove('toast-success', 'toast-error', 'toast-locked');
  featureAccessNotice.classList.add('toast-success');
  featureAccessNotice.replaceChildren();
  const messageNode = document.createElement('span');
  messageNode.textContent = `${message} lực chiến `;
  const deltaNode = document.createElement('strong');
  const delta = Number(powerDelta) || 0;
  deltaNode.className = delta >= 0 ? 'toast-power-increase' : 'toast-power-decrease';
  deltaNode.textContent = `${delta >= 0 ? '+' : '-'}${formatGameNumber(Math.abs(delta))}`;
  messageNode.append(deltaNode);
  featureAccessNotice.append(messageNode);
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
  showGameToast(`Đã lưu tên nhân vật: ${playerName}.`, 'success');
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
  return Math.max(1, Number(cultivationSkillData.upgrade?.maxLevel) || 15);
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

function getSkillGradeRarityKey(gradeId) {
  const gradeIndex = cultivationSkillData.grades.findIndex((grade) => grade.id === gradeId);
  return cultivationSkillData.gradeColorRarityMap?.[gradeId]
    || equipmentQualityOrder[Math.max(0, gradeIndex)]
    || 'common';
}

function getSkillGradeColor(gradeId) {
  const rarityKey = getSkillGradeRarityKey(gradeId);
  return rarityData[rarityKey]?.color || '#f5f7fa';
}

const talentTreasureStatMeta = Object.freeze({
  attack: { name: 'Xích Viêm', icon: 'icon-talent-treasure-attack' },
  maxHp: { name: 'Thanh Mộc', icon: 'icon-talent-treasure-maxHp' },
  defense: { name: 'Huyền Thuẫn', icon: 'icon-talent-treasure-defense' },
  maxMana: { name: 'Lam Hải', icon: 'icon-talent-treasure-maxMana' },
  mastery: { name: 'Tử Tinh', icon: 'icon-talent-treasure-mastery' },
});

const talentTreasureStatPriority = ['attack', 'mastery', 'maxHp', 'defense', 'maxMana'];

function getTalentTreasurePrimaryStat(item = {}) {
  const source = item.allocation && Object.keys(item.allocation).length
    ? item.allocation
    : item.statBonuses || {};
  const config = majorAscensionTreasureConfig || {};
  const caps = {
    maxHp: Math.max(1, Number(config.maxHpPercent) || 50),
    attack: Math.max(1, Number(config.maxAttackPercent) || 50),
    mastery: Math.max(1, Number(config.maxMasteryPercent) || 50),
    defense: Math.max(1, Number(config.maxDefensePercent) || 20),
    maxMana: Math.max(1, Number(config.maxManaPercent) || 5),
  };
  let selectedStat = talentTreasureStatPriority[0];
  let selectedValue = -1;
  talentTreasureStatPriority.forEach((stat) => {
    const value = Math.max(0, Number(source[stat]) || 0) / caps[stat];
    if (value > selectedValue) {
      selectedStat = stat;
      selectedValue = value;
    }
  });
  return selectedStat;
}

function getTalentTreasureName(item = {}) {
  const stat = getTalentTreasurePrimaryStat(item);
  const meta = talentTreasureStatMeta[stat] || talentTreasureStatMeta.attack;
  const targetMajorRealmIndex = clamp(
    Math.floor(Number(item.targetMajorRealmIndex) || 0),
    0,
    Math.max(0, cultivationProgression.length - 1),
  );
  const realmName = cultivationProgression[targetMajorRealmIndex]?.name || majorRealmNames[targetMajorRealmIndex];
  return `${meta.name}${realmName ? ` ${realmName}` : ''}`.trim();
}

function getTalentTreasureIconClass(item = {}) {
  const stat = getTalentTreasurePrimaryStat(item);
  return talentTreasureStatMeta[stat]?.icon || 'icon-talent-treasure-generic';
}

function getSkillRequiredTier(skill) {
  const gradeTier = cultivationSkillData.gradeRequiredTier?.[skill.gradeId];
  const skillTier = Number(skill.requiredTier ?? skill.requiredLevel);
  return Math.max(1, Number.isFinite(skillTier) ? skillTier : Number(gradeTier) || 1);
}

function getShopSkillRequiredTier(shopItem) {
  const skill = cultivationSkills.find((entry) => entry.id === shopItem.skillId);
  return skill ? getSkillRequiredTier(skill) : Math.max(1, Number(shopItem.requiredTier) || 1);
}

function getSkillBookCount(skillId) {
  return Math.max(0, Math.floor(Number(skillBooks[skillId]) || 0));
}

function getSkillFragmentCount(skillId) {
  return Math.max(0, Math.floor(Number(skillFragments[skillId]) || 0));
}

function addSkillFragments(skillId, amount = 1) {
  const incoming = Math.max(0, Math.floor(Number(amount) || 0));
  const total = getSkillFragmentCount(skillId) + incoming;
  const completedBooks = Math.floor(total / 5);
  skillFragments[skillId] = total % 5;
  if (completedBooks > 0) skillBooks[skillId] = getSkillBookCount(skillId) + completedBooks;
  return { fragments: incoming, completedBooks };
}

function getSkillChestSkills(shopItem) {
  return getPlayerSkills().filter((skill) => skill.gradeId === shopItem?.gradeId);
}

function getPetFragmentCount(petId) {
  return Math.max(0, Math.floor(Number(petFragments[petId]) || 0));
}

function getPetFragmentRequirement() {
  return Math.max(1, Math.floor(Number(petData.fragmentRequirement) || 50));
}

function getOwnedPets() {
  return petData.pets.filter((pet) => ownedPetIds.includes(pet.id));
}

function pickPetChestFragmentAmount(shopItem) {
  const rewards = Array.isArray(shopItem?.fragmentRewards) ? shopItem.fragmentRewards : [];
  const normalizedRewards = rewards
    .map((reward) => ({
      amount: Math.max(1, Math.floor(Number(reward?.amount) || 1)),
      chance: Math.max(0, Number(reward?.chance) || 0),
    }))
    .filter((reward) => reward.chance > 0);
  const totalChance = normalizedRewards.reduce((total, reward) => total + reward.chance, 0);
  if (!totalChance) return 1;
  let roll = Math.random() * totalChance;
  for (const reward of normalizedRewards) {
    roll -= reward.chance;
    if (roll < 0) return reward.amount;
  }
  return normalizedRewards[normalizedRewards.length - 1].amount;
}

function pickWeightedPetChestReward(shopItem, rewardsKey, fallbackType) {
  const rewards = Array.isArray(shopItem?.[rewardsKey]) ? shopItem[rewardsKey] : [];
  const normalizedRewards = rewards
    .map((reward) => ({
      value: reward?.shopItemId || reward?.type,
      chance: Math.max(0, Number(reward?.chance) || 0),
    }))
    .filter((reward) => reward.value && reward.chance > 0);
  const totalChance = normalizedRewards.reduce((total, reward) => total + reward.chance, 0);
  if (!totalChance) return fallbackType;
  let roll = Math.random() * totalChance;
  for (const reward of normalizedRewards) {
    roll -= reward.chance;
    if (roll < 0) return reward.value;
  }
  return normalizedRewards[normalizedRewards.length - 1].value;
}

function pickPetChestItemReward(shopItem, rewardsKey) {
  const itemId = pickWeightedPetChestReward(shopItem, rewardsKey, '');
  return shopItems.find((item) => item.id === itemId) || null;
}

function openPetChest(shopItem) {
  const rewardType = ownedPetIds.length
    ? pickWeightedPetChestReward(shopItem, 'rewardTypes', 'fragment')
    : 'fragment';
  if (rewardType === 'petFood') {
    const item = pickPetChestItemReward(shopItem, 'petFoodRewards');
    return item ? { kind: 'item', item, amount: 1 } : null;
  }
  if (rewardType === 'petCultivationPill') {
    const item = pickPetChestItemReward(shopItem, 'petCultivationRewards');
    return item ? { kind: 'item', item, amount: 1 } : null;
  }
  if (rewardType === 'petSoulJade') {
    const item = shopItems.find((entry) => entry.id === shopItem?.petSoulJadeReward);
    return item ? { kind: 'item', item, amount: 1 } : null;
  }
  if (rewardType === 'petBreakthroughStone') {
    const item = shopItems.find((entry) => entry.id === shopItem?.petBreakthroughStoneReward);
    return item ? { kind: 'item', item, amount: 1 } : null;
  }
  const candidates = petData.pets.filter((pet) => !ownedPetIds.includes(pet.id));
  const fallbackCandidates = candidates.length ? candidates : petData.pets;
  if (!fallbackCandidates.length) return null;
  const pet = fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];
  const fragments = pickPetChestFragmentAmount(shopItem);
  let remaining = getPetFragmentCount(pet.id) + fragments;
  let createdPets = 0;
  while (remaining >= getPetFragmentRequirement() && !ownedPetIds.includes(pet.id)) {
    ownedPetIds.push(pet.id);
    getPetState(pet.id);
    remaining -= getPetFragmentRequirement();
    createdPets += 1;
  }
  petFragments[pet.id] = remaining;
  if (createdPets > 0 && !selectedPetId) selectedPetId = pet.id;
  return { kind: 'fragment', pet, fragments, createdPets };
}

function openSkillChest(shopItem) {
  const candidates = getSkillChestSkills(shopItem);
  if (!candidates.length) return null;
  const skill = candidates[Math.floor(Math.random() * candidates.length)];
  const bookChance = Math.max(0, Math.min(1, Number(shopItem.bookChance) || 0.1));
  if (Math.random() < bookChance) {
    skillBooks[skill.id] = getSkillBookCount(skill.id) + 1;
    return { skill, kind: 'book', completedBooks: 0 };
  }
  return { skill, kind: 'fragment', ...addSkillFragments(skill.id, 1) };
}

function openTalentTreasureChest(shopItem) {
  const configuredTarget = Number.isInteger(Number(shopItem?.targetMajorRealmIndex))
    ? Math.floor(Number(shopItem.targetMajorRealmIndex))
    : playerMajorRealmIndex + 1;
  const maxMajorRealmIndex = getMajorRealmMaxIndex();
  if (configuredTarget < 0 || configuredTarget > maxMajorRealmIndex) return null;
  // The chest can be opened before its realm is immediately needed. The
  // breakthrough panel will still filter the resulting treasure to the next
  // realm, so opening a valid realm-specific chest never silently fails.
  const targetMajorRealmIndex = configuredTarget;
  const rewardItem = createTalentTreasureItem(targetMajorRealmIndex);
  if (!rewardItem) return null;
  return rewardItem;
}

function grantSkillLearningComprehension() {
  const maxSkillLearningComprehension = 3;
  if (skillLearningComprehension >= maxSkillLearningComprehension) return 0;
  skillLearningComprehension += 1;
  playerComprehension += 1;
  return 1;
}

const skillItemIconIds = new Set([
  'beginner_sword_art', 'sword_quickdraw', 'sword_flash', 'sword_flow', 'sword_domain', 'sword_storm',
  'sword_earth_rift', 'sword_earth_lotus', 'sword_heaven_starfall', 'sword_heaven_realm',
  'beginner_blade_art', 'blade_heavy', 'blade_blood', 'blade_rend', 'blade_heaven', 'blade_apocalypse',
  'blade_earth_sunder', 'blade_earth_warcry', 'blade_heaven_overlord', 'blade_heaven_worldsplitter',
  'beginner_body_art', 'martial_skin', 'martial_fist', 'martial_guard', 'martial_breaker', 'martial_rebirth',
]);

function getSkillItemIconClass(skillId) {
  return skillItemIconIds.has(skillId) ? `icon-skill-item-${skillId}` : 'icon-item-skill-book';
}

function getSkillItemIconMarkupClass(skillId) {
  const iconClass = getSkillItemIconClass(skillId);
  const iconTypeClass = iconClass.startsWith('icon-skill-item-') ? 'skill-item-icon' : 'item-icon';
  return `${iconTypeClass} ${iconClass}`;
}

function getSkillChestCostByGrade(gradeId) {
  const chest = shopItems.find((item) => item.type === 'skillChest' && item.gradeId === gradeId);
  return Math.max(0, Math.floor(Number(chest?.cost) || 0));
}

function getSkillMaterialSellPrice(skill, materialType) {
  const priceConfig = cultivationSkillData.upgrade?.skillMaterialSellPrice || {};
  const gradeIndex = Math.max(
    0,
    cultivationSkillData.grades.findIndex((grade) => grade.id === skill?.gradeId),
  );
  const fragmentBase = Math.max(0, Number(priceConfig.fragmentBase) || 20);
  const gradeStep = Math.max(0, Number(priceConfig.gradeStep) || 20);
  const fragmentPrice = Math.max(1, Math.floor(fragmentBase + gradeIndex * gradeStep));
  if (materialType === 'fragment') return fragmentPrice;
  if (materialType === 'book') {
    const bookMultiplier = Math.max(1, Number(priceConfig.bookMultiplier) || 3);
    return Math.max(1, Math.floor(fragmentPrice * bookMultiplier));
  }
  const chestCost = getSkillChestCostByGrade(skill?.gradeId);
  const sellRatio = materialType === 'fragment' ? 0.25 : 0.5;
  return Math.max(1, Math.floor(chestCost * sellRatio));
}

function getSkillBookRequirement(skill, targetLevel) {
  const config = cultivationSkillData.upgrade?.skillBookRequirement || {};
  const milestoneEveryLevels = Math.max(1, Math.floor(Number(config.milestoneEveryLevels) || 3));
  const levelBooksPerMilestone = Math.max(0, Math.floor(Number(config.levelBooksPerMilestone) || 1));
  const level = Math.max(0, Math.floor(Number(targetLevel) || 0));
  const milestoneCount = level > 0 && level % milestoneEveryLevels === 0
    ? Math.floor(level / milestoneEveryLevels)
    : 0;
  const configuredGradeBooks = config.gradeBooksByGrade?.[skill?.gradeId];
  const booksPerMilestone = milestoneCount
    ? Math.max(1, Math.floor(Number(levelBooksPerMilestone) || 1))
      * Math.max(1, Math.floor(Number(configuredGradeBooks ?? 1) || 1))
      * milestoneCount
    : 0;
  return {
    levelBooks: booksPerMilestone,
    gradeBooks: 0,
    total: booksPerMilestone,
  };
}

function getSkillBookRequired(skill, targetLevel) {
  return getSkillBookRequirement(skill, targetLevel).total;
}

function getTotalSkillBooks() {
  return Object.values(skillBooks).reduce((total, count) => total + Math.max(0, Math.floor(Number(count) || 0)), 0);
}

function getSkillMultiplier(skill, level = getSkillLevel(skill.id)) {
  const perLevelByGrade = cultivationSkillData.upgrade?.multiplierPerLevelByGrade || {};
  const perLevel = Number(skill?.damageMultiplierPerLevel
    ?? perLevelByGrade[skill?.gradeId]
    ?? cultivationSkillData.upgrade?.multiplierPerLevel) || 0;
  return (Number(skill.multiplier) || 1) + Math.max(0, level) * perLevel;
}

function getSkillManaCost(skill, level = getSkillLevel(skill?.id)) {
  if (!skill) return 0;
  const baseCost = Math.max(0, Number(skill.cost) || 0);
  const perLevelBySchool = cultivationSkillData.upgrade?.manaCostPerLevelBySchool || {};
  const schoolPerLevel = perLevelBySchool[skill.schoolId] || {};
  const perLevelByGrade = cultivationSkillData.upgrade?.manaCostPerLevelByGrade || {};
  const perLevel = Math.max(0, Number(schoolPerLevel[skill.gradeId]
    ?? perLevelByGrade[skill.gradeId]
    ?? cultivationSkillData.upgrade?.manaCostPerLevel) || 0);
  const schoolMultiplier = Math.max(0.1, Number(cultivationSkillData.upgrade?.manaCostMultiplierBySchool?.[skill.schoolId]) || 1);
  return Math.max(0, Math.round((baseCost + Math.max(0, Number(level) || 0) * perLevel) * schoolMultiplier));
}

function getSkillCombatPower(skill, level = getSkillLevel(skill.id)) {
  if (!skill) return 0;
  if (Number.isFinite(Number(skill.combatPowerValue))) return Math.max(0, Math.round(Number(skill.combatPowerValue)));
  const perLevelBySchool = cultivationSkillData.upgrade?.combatPowerPerLevelBySchool || {};
  const schoolPerLevel = perLevelBySchool[skill.schoolId] || {};
  const perLevel = Math.max(0, Number(schoolPerLevel[skill.gradeId]
    ?? cultivationSkillData.upgrade?.combatPowerPerLevel) || 0);
  const perMilestoneBySchool = cultivationSkillData.upgrade?.combatPowerPerMilestoneBySchool || {};
  const perMilestone = Math.max(0, Number(perMilestoneBySchool[skill.schoolId]
    ?? cultivationSkillData.upgrade?.combatPowerPerMilestone) || 0);
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
    const nextEffect = { ...effect };
    if (effect.type === 'conditionalDamage') {
      const currentLevel = Math.max(0, Number(level) || 0);
      nextEffect.targetHpThreshold = clamp(
        (Number(effect.targetHpThreshold) || 0) + (Number(effect.thresholdIncreasePerLevel) || 0) * currentLevel,
        0,
        1,
      );
      nextEffect.damageMultiplier = Math.max(
        0,
        (Number(effect.damageMultiplier) || 0) + (Number(effect.damageMultiplierIncreasePerLevel) || 0) * currentLevel,
      );
      nextEffect.damageMultiplierPerIntentStack = Math.max(
        0,
        (Number(effect.damageMultiplierPerIntentStack) || 0)
          + (Number(effect.damageMultiplierPerIntentStackIncreasePerLevel) || 0) * currentLevel,
      );
      return nextEffect;
    }
    if (effect.type === 'bladeBleed') {
      const currentLevel = Math.max(0, Number(level) || 0);
      nextEffect.hpPercentPerTurn = Math.max(
        0,
        (Number(effect.hpPercentPerTurn) || 0)
          + (Number(effect.hpPercentIncreasePerLevel) || 0) * currentLevel,
      );
      nextEffect.maxDamageAttackMultiplier = Math.max(
        0,
        (Number(effect.maxDamageAttackMultiplier) || 0)
          + (Number(effect.maxDamageAttackMultiplierIncreasePerLevel) || 0) * currentLevel,
      );
      return nextEffect;
    }
    if (effect.type === 'bladeRendBurst') {
      const currentLevel = Math.max(0, Number(level) || 0);
      nextEffect.bleedDamageBonus = Math.max(
        0,
        (Number(effect.bleedDamageBonus) || 0)
          + (Number(effect.bleedDamageBonusIncreasePerLevel) || 0) * currentLevel,
      );
      nextEffect.noBleedGainIntentChance = clamp(
        (Number(effect.noBleedGainIntentChance) || 0)
          + (Number(effect.noBleedGainIntentChanceIncreasePerLevel) || 0) * currentLevel,
        0,
        1,
      );
      nextEffect.noBleedExtraDamageMaxAttackMultiplier = Math.max(
        0,
        (Number(effect.noBleedExtraDamageMaxAttackMultiplier) || 0)
          + (Number(effect.noBleedExtraDamageMaxAttackMultiplierIncreasePerLevel) || 0) * currentLevel,
      );
      return nextEffect;
    }
    if (effect.type === 'bladeIntentSkillBurst') {
      const currentLevel = Math.max(0, Number(level) || 0);
      nextEffect.perIntentDamageBonus = Math.max(
        0,
        (Number(effect.perIntentDamageBonus) || 0)
          + (Number(effect.perIntentDamageBonusIncreasePerLevel) || 0) * currentLevel,
      );
      return nextEffect;
    }
    if (effect.type === 'swordIntent') {
      const currentLevel = Math.max(0, Number(level) || 0);
      if (effect.levelIncrease) {
        const field = effect.levelIncreaseField || 'value';
        nextEffect[field] = (Number(effect[field]) || 0) + Number(effect.levelIncrease) * currentLevel;
      }
      nextEffect.chance = clamp(Number(nextEffect.chance) || 0, 0, 1);
      nextEffect.critRate = Math.max(
        0,
        (Number(effect.critRate) || 0) + (Number(effect.critRateIncreasePerLevel) || 0) * currentLevel,
      );
      nextEffect.critDamage = Math.max(
        0,
        (Number(effect.critDamage) || 0) + (Number(effect.critDamageIncreasePerLevel) || 0) * currentLevel,
      );
      return nextEffect;
    }
    const levelIncrease = Number(effect.levelIncrease) || 0;
    if (levelIncrease) {
      const field = effect.levelIncreaseField || 'value';
      nextEffect[field] = (Number(effect[field]) || 0) + levelIncrease * Math.max(0, level);
    }
    const growthKey = effect.type === 'healPercent'
      ? 'healPercent'
      : effect.type === 'percentBuff'
        ? `${effect.stat}Percent`
        : effect.stat;
    const perMilestone = Number(effect.milestoneIncrease ?? growth[growthKey]) || 0;
    if (perMilestone && milestoneCount) {
      nextEffect.value = (Number(effect.value) || 0) + perMilestone * milestoneCount;
    }
    return nextEffect;
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
  const practiceRate = config.practiceStat === 'comprehension'
    ? Math.max(1, Math.floor(Number(playerComprehension) || 1))
    : Math.max(1, Number(config.gainPerSecond) || 1);
  const gain = trainingSeconds * practiceRate;
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

function getEquippedSkillWithGrade(gradeId, excludeSkillId = '') {
  return getEquippedSkills().find((skill) => (
    skill.id !== excludeSkillId && skill.gradeId === gradeId
  )) || null;
}

function createSkillRuntime(skill) {
  const level = getSkillLevel(skill.id);
  const cooldown = Math.max(1, Number(skill.cooldown) || 1);
  return {
    id: skill.id,
    schoolId: skill.schoolId,
    name: skill.name,
    level,
    cost: getSkillManaCost(skill, level),
    multiplier: getSkillMultiplier(skill, level),
    cooldown,
    cooldownRemaining: cooldown,
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
  skillFragments = Object.fromEntries(Object.entries(skillFragments || {})
    .filter(([skillId]) => ids.has(skillId))
    .map(([skillId, count]) => [skillId, Math.max(0, Math.floor(Number(count) || 0) % 5)]));
  if (skills[0] && !isSkillLearned(skills[0].id)) learnedSkillIds.push(skills[0].id);
  equippedSkillIds = equippedSkillIds.filter((skillId) => ids.has(skillId) && isSkillLearned(skillId));
  const equippedGrades = new Set();
  equippedSkillIds = equippedSkillIds.filter((skillId) => {
    const skill = skills.find((entry) => entry.id === skillId);
    if (!skill || equippedGrades.has(skill.gradeId)) return false;
    equippedGrades.add(skill.gradeId);
    return true;
  });
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
    mastery: 'Tinh thông',
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
  if (enemyName.includes('ma') || enemyName.includes('hồn') || enemyName.includes('quỷ')) return 'enemy-ghost';
  if (enemyName.includes('chu') || enemyName.includes('nhện') || enemyName.includes('xà')) return 'enemy-spider';
  return 'enemy-ghost';
}

function getEnemyVisualStyle(enemyData = {}) {
  const visual = enemyData.visual || {};
  return {
    image: typeof visual.image === 'string' ? visual.image : '',
    position: typeof visual.position === 'string' ? visual.position : 'center',
    size: typeof visual.size === 'string' ? visual.size : 'contain',
  };
}

function renderStartScreen() {
  const availableSchoolIds = ['sword_cultivator', 'blade_cultivator', 'martial_cultivator'];
  const availableSchools = availableSchoolIds
    .map((id) => cultivationSchools.find((school) => school.id === id))
    .filter((school) => school?.selectable !== false)
    .filter(Boolean);

  schoolChoiceGrid.innerHTML = availableSchools.map((school) => {
    const available = school.selectable !== false;
    return `
    <button type="button" class="school-choice ${school.id === playerSchoolId ? 'selected' : ''} ${available ? '' : 'is-developing'}" data-school-id="${school.id}" aria-disabled="${!available}">
      <span class="school-choice-art ${getSchoolVisualClass(school.id)}" aria-hidden="true"></span>
      <strong>${school.name}</strong>
      <span>Nhập môn</span>
      <small>${available ? getSchoolFocusText(school) : 'Đang phát triển'}</small>
    </button>
  `;
  }).join('');

  schoolChoiceGrid.querySelectorAll('[data-school-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const school = cultivationSchools.find((entry) => entry.id === button.dataset.schoolId);
      if (!school || school.selectable === false) {
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
  const hasSchool = cultivationSchools.some((school) => school.id === playerSchoolId && school.selectable !== false);
  setButtonDisabledState(enterGameButton, !hasName || !hasSchool, !hasName ? 'Vui lòng nhập tên nhân vật.' : 'Vui lòng chọn môn phái.');
  if (startSchoolHint) {
    startSchoolHint.textContent = hasSchool
      ? `${getPlayerSchool().name}: Nhập môn`
      : 'Chọn một phái';
  }
}

function showStartScreen() {
  gameStarted = false;
  if (!cultivationSchools.some((school) => school.id === playerSchoolId && school.selectable !== false)) {
    playerSchoolId = 'sword_cultivator';
  }
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

function getActiveTabId() {
  if (playerAvatarButton?.classList.contains('is-active')) return 'profile';
  return Object.entries(tabButtons)
    .find(([, button]) => button?.classList.contains('is-active'))?.[0] || 'map';
}

function rememberBattleReturnTab(stage = currentStage) {
  const activeTab = getActiveTabId();
  battleReturnTab = activeTab;
  battleReturnToWander = Boolean(stage?.isWanderGenerated);
}

function showBattleReturnTab() {
  const returnTab = battleReturnTab || 'map';
  if (returnTab === 'training') {
    showTraining();
    return;
  }
  if (returnTab === 'profile') {
    showProfile();
    return;
  }
  if (returnTab === 'equipment') {
    showEquipment();
    return;
  }
  if (returnTab === 'inventory') {
    showInventory();
    return;
  }
  if (returnTab === 'shop') {
    showShop();
    return;
  }
  if (returnTab === 'resourceDungeon') {
    showActivities('resourceDungeon');
    return;
  }
  if (returnTab === 'trialTower') {
    showTrialTower();
    return;
  }
  if (returnTab === 'code') {
    showMail();
    return;
  }
  if (returnTab === 'quests') {
    showQuests();
    return;
  }
  if (returnTab === 'activities') {
    showActivities();
    return;
  }
  showMap();
}

function returnFromBattleScreen() {
  const shouldResumeWander = battleReturnToWander;
  battleReturnToWander = false;
  if (shouldResumeWander && autoWanderEnabled) {
    if (!canEnterDungeon()) {
      autoWanderAfterRecovery = true;
      showTrainingMessage('Tự động ngao du đang hồi phục vì đạo hữu đã trọng thương.');
      scheduleAutoWanderAfterRecovery();
    } else {
      continueAutoWander();
    }
    return;
  }
  if (currentStage?.isTrainingDummy) {
    showActivities('trainingDummy');
    return;
  }
  if (currentStage?.isWorldBoss) {
    showActivities('worldBoss');
    return;
  }
  if (currentStage?.isPlayerBattle) {
    showActivities('playerBattle');
    return;
  }
  if (lastBattleOutcome === 'lose') {
    showTrainingMessage('Đã thua, hãy về tu luyện để hồi phục.');
    return;
  }

  showBattleReturnTab();
  if (shouldResumeWander && canEnterDungeon()) beginWander();
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
  petPanel?.classList.add('is-hidden');
  resourceDungeonPanel?.classList.add('is-hidden');
  trialTowerPanel?.classList.add('is-hidden');
  questPanel?.classList.add('is-hidden');
  activityPanel?.classList.add('is-hidden');
  mailPanel?.classList.add('is-hidden');
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

function showEnhancement(itemId = 0) {
  const requiredTier = getEnhancementEntryRequiredTier();
  if (!canAccessEnhancement()) {
    showLockedFeatureNotice('Cường hóa', `Cần đạt tu vi ${getTierRealmText(requiredTier)} để mở`);
    return;
  }
  const item = Object.values(equippedItems).find((entry) => entry?.id === Number(itemId));
  if (!item) {
    showGameToast('Chưa chọn trang bị để cường hóa.', 'info');
    return;
  }
  selectedEnhancementItemId = item.id;
  renderEnhancement();
}

function showResourceDungeons() {
  const requiredTier = getResourceDungeonEntryRequiredTier();
  if (!canAccessResourceDungeons()) {
    showLockedFeatureNotice('Phụ bản', `Cần đạt tu vi ${getTierRealmText(requiredTier)} để mở`);
    return;
  }
  showActivities('resourceDungeon');
}

function showQuests() {
  prepareFeatureView(questPanel, 'quests', renderQuests);
}

function showActivities(tabId = activeActivityTab) {
  const requestedTab = ['resourceDungeon', 'playerBattle', 'trainingDummy', 'worldBoss'].includes(tabId) ? tabId : 'beastHunt';
  if (requestedTab === 'playerBattle' && isPlayerBattleInDevelopment()) {
    showGameToast('Chiến đấu đang phát triển.', 'locked');
    return;
  }
  if (requestedTab === 'resourceDungeon' && !canAccessResourceDungeons()) {
    showLockedFeatureNotice('Phụ bản', `Cần đạt tu vi ${getTierRealmText(getResourceDungeonEntryRequiredTier())} để mở`);
    return;
  }
  activeActivityTab = requestedTab;
  prepareFeatureView(activityPanel, 'activities', renderActivities);
  if (activeActivityTab === 'worldBoss' && !isWorldBossInDevelopment()) {
    loadWorldBossState({ silent: true });
  }
  updateNotificationBadges();
}

function showMail() {
  prepareFeatureView(mailPanel, 'mail', () => {
    mailInboxPanel?.classList.remove('is-hidden');
    codeRedeemPanel?.classList.remove('is-hidden');
    mailUnreadSummary?.classList.remove('is-hidden');
    renderMail();
  });
  loadMailView();
}

function canAccessEnhancement() {
  return getPlayerCultivationTier() >= getEnhancementEntryRequiredTier();
}

function getEnhancementEntryRequiredTier() {
  return Math.max(1, Number(progressionFeatures.enhancement?.entryRequiredTier) || 11);
}

function getResourceDungeonEntryRequiredTier() {
  return Math.max(1, Number(progressionFeatures.resourceDungeonEntryRequiredTier) || 41);
}

function canAccessResourceDungeons() {
  return getPlayerCultivationTier() >= getResourceDungeonEntryRequiredTier();
}

function updateFeatureAvailability() {
  const featureStates = [
    [resourceDungeonButton, canAccessResourceDungeons(), getResourceDungeonEntryRequiredTier()],
    [trialTowerButton, canEnterTrialTower(), getTrialTowerEntryRequiredTier()],
    [playerBattleButton, !isPlayerBattleInDevelopment(), null],
  ];
  featureStates.forEach(([button, unlocked, requiredTier]) => {
    if (!button) return;
    button.disabled = false;
    button.classList.toggle('locked-tab', !unlocked);
    button.setAttribute('aria-disabled', String(!unlocked));
    button.title = unlocked
      ? ''
      : requiredTier ? `Mở từ ${getTierRealmText(requiredTier)}` : 'Chức năng đang phát triển';
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
  const equipmentChestCount = Math.max(0, Math.floor(Number(reward.equipmentChests) || 0));
  const equipmentChestTier = Math.max(1, Math.floor(Number(reward.equipmentChestTier) || 1));
  for (let index = 0; index < equipmentChestCount; index += 1) {
    addEquipmentChest({ majorRealmIndex: playerMajorRealmIndex }, { chestTier: equipmentChestTier });
  }
  const skillChestCount = Math.max(0, Math.floor(Number(reward.skillChests) || 0));
  if (skillChestCount > 0 && reward.skillChestId) addShopInventoryItem(reward.skillChestId, skillChestCount);
  enhancementStones += Math.max(0, Math.floor(Number(reward.enhancementStones) || 0));
  const skillBookReward = Math.max(0, Math.floor(Number(reward.skillBooks) || 0));
  const skillBookTarget = skillTrainingId || learnedSkillIds[0];
  if (skillBookReward > 0 && skillBookTarget) {
    skillBooks[skillBookTarget] = getSkillBookCount(skillBookTarget) + skillBookReward;
  }
  playerFoundation += Math.max(0, Math.floor(Number(reward.foundation) || 0));
  playerComprehension += Math.max(0, Math.floor(Number(reward.comprehension) || 0));
  setPanelMessage('questMessage', `Đã nhận: ${formatQuestReward(reward)}.`, true);
  showGameToast(`Đã nhận thưởng nhiệm vụ: ${quest.title}.`, 'success');
  renderQuests();
  renderCultivation();
  renderProfile();
  renderShop();
  saveGame();
}

function showMap() {
  document.body.classList.remove('battle-active');
  hideBattleResultOverlay();
  hideShopItemDetail();
  hideInventoryItemDetail();
  window.clearTimeout(timer);
  busy = false;
  battleOver = false;
  setButtonDisabledState(startButton, false);
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

function showPets() {
  prepareFeatureView(petPanel, 'pets', renderPets);
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

breakthroughButton.addEventListener('click', openBreakthroughPanel);

startButton.addEventListener('click', () => {
  if (busy) return;

  if (battleOver) {
    continueBattle();
    return;
  }

  startBattle();
});

loginModeButton?.addEventListener('click', () => {
  authMode = 'login';
  renderAuthMode();
  setAuthMessage('');
  authPassword?.focus();
});

registerModeButton?.addEventListener('click', () => {
  authMode = 'register';
  renderAuthMode();
  setAuthMessage('');
  authPassword?.focus();
});

authForm?.addEventListener('submit', submitAuth);
logoutButton?.addEventListener('click', openLogoutConfirm);

loadAllResources()
  .then(async () => {
    const canStart = await prepareCloudSession();
    if (canStart) startGame();
    hideResourceLoader();
  })
  .catch((error) => {
    console.error(error);
    finishResourceLoading('Không tải được tài nguyên.');
    setSubtitle('Không tải được dữ liệu tài nguyên.');
    stageGrid.innerHTML = '<div class="inventory-empty"><i class="activity-icon icon-activity-locked" aria-hidden="true"></i><span>Lỗi file tài nguyên, kiểm tra lại các file dữ liệu trong assets/Resources/Data.</span></div>';
    hideResourceLoader();
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
}

function finishResourceLoading(status = 'Sẵn sàng nhập đạo.') {
  loadingComplete = true;
  updateResourceLoading(100, status);
}

function hideResourceLoader() {
  if (!loadingComplete || resourceLoader.classList.contains('is-hidden')) return;
  loadingTargetProgress = 100;
  loadingShownProgress = 100;
  resourceLoadingBar.style.width = '100%';
  resourceLoadingPercent.textContent = '100%';
  resourceProgress.setAttribute('aria-valuenow', '100');
  loadingHideScheduled = true;
  resourceLoader.classList.add('is-hidden');
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
  await loadCultivationRealms();
  createMinorBreakthroughPillShopItems();
  createMajorAscensionTreasureShopItems();
  createMajorAscensionTreasureChestShopItems();
  updateResourceLoading(20, 'Đã tải dữ liệu cảnh giới.');

  const resourceTasks = [
    ['trang bị', loadEquipmentData],
    ['bản đồ và quái', loadEnemyData],
    ['tính năng tu luyện', loadProgressionFeatures],
    ['hệ phái', loadCultivationSchools],
    ['skill', loadCultivationSkills],
    ['chỉ số chiến đấu', loadCombatStats],
    ['thông số kẻ thù', loadEnemyStats],
    ['skill kẻ thù', loadEnemySkills],
    ['nội tại', loadCombatStyles],
    ['Tháp thí luyện', loadTrialTowerData],
    ['nhiệm vụ', loadQuestData],
    ['linh thú', loadPetData],
    ['cảnh giới Linh thú', loadPetRealmData],
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
  applyEnemySkillAssignments();

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
    || !shopConfig.minorBreakthroughPillConfig
    || !Array.isArray(starterConfig.starterInventory) || !starterConfig.initialPlayer) {
    throw new Error('Demo config resources are incomplete.');
  }
  dailyFarmLimit = Number(gameConfig.dailyFarmLimit);
  maxTurns = Number(gameConfig.gameplay.maxTurns);
  turnInterval = Number(gameConfig.gameplay.turnInterval);
  playerMaxMinorLevel = Number(gameConfig.gameplay.playerMaxMinorLevel);
  wanderEventDelay = Number(gameConfig.gameplay.wanderEventDelay);
  cultivationRewardMultiplier = Math.max(0, Number(gameConfig.gameplay.cultivationRewardMultiplier ?? 1));
  questRewardGrowthMultiplier = Math.max(1, Number(gameConfig.gameplay.questRewardGrowthMultiplier ?? 1.3));
  wanderChestCapacity = Math.max(1, Math.floor(Number(gameConfig.runtime.wanderChestCapacity) || 30));
  wanderChestCapacityPerMajorRealm = Math.max(
    0,
    Math.floor(Number(gameConfig.runtime.wanderChestCapacityPerMajorRealm) || 0),
  );
  offlineCapSeconds = Number(gameConfig.runtime.offlineCapSeconds);
  baseSaveKey = gameConfig.persistence.saveKey;
  setAccountSaveKey();
  legacySaveKeys = gameConfig.persistence.legacySaveKeys || [];
  ascensionPermitItemId = gameConfig.runtime.ascensionPermitItemId;
  dungeonConfigs = gameConfig.dungeonConfigs;
  dungeonList = Object.values(dungeonConfigs);
  wanderMapDefaults = gameConfig.wanderMapDefaults || {};
  shopItems = shopConfig.shopItems;
  minorBreakthroughPillConfig = shopConfig.minorBreakthroughPillConfig;
  majorAscensionTreasureConfig = shopConfig.majorAscensionTreasureConfig || {};
  majorAscensionTreasureChestConfig = shopConfig.majorAscensionTreasureChestConfig || {};
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
  skillLearningComprehension = 0;
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
  if (!Array.isArray(data.stats) || data.stats.length === 0
    || !data.cultivationPowerTable || !Array.isArray(data.cultivationPowerTable.realms)) {
    throw new Error('Combat stats data is incomplete.');
  }
  combatStatDefinitions = data.stats;
  cultivationPowerTable = data.cultivationPowerTable;
}

async function loadEnemyStats() {
  const response = await fetch(enemyStatsPath);
  if (!response.ok) throw new Error(`Cannot load enemy stats: ${response.status}`);
  const data = await response.json();
  if (!data.baseStats || !data.defaultMinorGrowth || !data.defaultMajorBreakthrough
    || !Array.isArray(data.minorGrowthByRealm) || !data.majorBreakthroughByRealm) {
    throw new Error('Enemy stats data is incomplete.');
  }
  enemyStats = data;
  baseStats = data.baseStats;
  perLevel = data.defaultMinorGrowth;
  majorRealmMinorGrowths = data.minorGrowthByRealm;
}

async function loadEnemySkills() {
  const response = await fetch(enemySkillsPath);
  if (!response.ok) throw new Error(`Cannot load enemy skills: ${response.status}`);
  const data = await response.json();
  if (!data.defaultSkill || !Array.isArray(data.skills) || !data.assignments) {
    throw new Error('Enemy skill data is incomplete.');
  }
  enemySkillData = data;
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

async function loadQuestData() {
  const response = await fetch(questDataPath);
  if (!response.ok) throw new Error(`Cannot load quest data: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.quests) || data.quests.length === 0) {
    throw new Error('Quest data is incomplete.');
  }
  questData = data;
}

async function loadPetData() {
  const response = await fetch(petDataPath);
  if (!response.ok) throw new Error(`Cannot load pet data: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.pets) || data.pets.length === 0
    || !Array.isArray(data.rarities) || data.rarities.length !== 5
    || !data.feed || !data.starUpgrade) {
    throw new Error('Pet data is incomplete.');
  }
  const rarityIds = new Set(data.rarities.map((rarity) => rarity.id));
  if (data.pets.some((pet) => !rarityIds.has(pet.rarity))) {
    throw new Error('Pet rarity data is incomplete.');
  }
  petData = data;
}

async function loadPetRealmData() {
  const response = await fetch(petRealmsPath);
  if (!response.ok) throw new Error(`Cannot load pet realm data: ${response.status}`);
  const data = await response.json();
  if (data.realmSystem !== 'pet' || !Array.isArray(data.realms) || data.realms.length !== 10
    || data.realms.some((realm) => !realm.name || !Array.isArray(realm.minorRealms) || realm.minorRealms.length !== 9)) {
    throw new Error('Pet realm data is incomplete.');
  }
  petRealmData = data;
}

async function loadEquipmentData() {
  const response = await fetch(equipmentPath);
  if (!response.ok) throw new Error(`Cannot load equipment data: ${response.status}`);
  const data = await response.json();
  equipmentSlots = data.slots;
  rarityData = data.rarities;
  equipmentQualityOrder = data.qualityOrder || ['common', 'uncommon', 'rare'];
  equipmentTemplates = data.templates;
  equipmentIconSheets = data.iconSheets || {};
  equipmentIconFramesBySlot = data.iconFramesBySlot || {};
  equipmentLevelColorGroups = Array.isArray(data.levelColorGroups) ? data.levelColorGroups : [];
  equipmentSetNames = Array.isArray(data.setNames) ? data.setNames : [];
  specialLineData = data.specialLines;
  equipmentChestRarityProfiles = Array.isArray(data.chestRarityProfiles)
    ? data.chestRarityProfiles
    : [];
  equipmentStatGeneration = { ...equipmentStatGeneration, ...(data.statGeneration || {}) };
  validateEquipmentData();
}

async function loadCultivationRealms() {
  const response = await fetch(cultivationRealmsPath);
  if (!response.ok) throw new Error(`Cannot load cultivation realms: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.realms) || data.realms.length < 3) {
    throw new Error('Cultivation realms data is incomplete.');
  }
  majorRealmNames = data.realms.map((realm) => realm.name);
  majorRealmBreakthroughs = data.realms.map(() => ({}));
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

function createMinorBreakthroughPillShopItems() {
  const config = minorBreakthroughPillConfig || {};
  const idPrefix = String(config.idPrefix || 'minorAscensionPill');
  const namePrefix = String(config.namePrefix || '');
  const nameSuffix = String(config.nameSuffix || 'Đan');
  const firstBaseCost = Math.max(1, Number(config.firstMajorRealmBaseCost) || 100);
  const firstPriceStep = Math.max(1, Number(config.firstMajorRealmPriceStep) || firstBaseCost);
  const otherBaseCost = Math.max(1, Number(config.otherMajorRealmBaseCost) || 200);
  const otherPriceStep = Math.max(1, Number(config.otherMajorRealmPriceStep) || otherBaseCost);
  const majorRealmBaseCostStep = Math.max(
    0,
    Number(config.majorRealmBaseCostStep) || Math.max(0, otherBaseCost - firstBaseCost),
  );
  const existingIds = new Set(shopItems.map((item) => item.id));

  cultivationProgression.forEach((realm, index) => {
    const id = `${idPrefix}${realm.id}`;
    if (existingIds.has(id)) return;
    const baseCost = firstBaseCost + majorRealmBaseCostStep * index;
    const priceStep = index === 0 ? firstPriceStep : otherPriceStep;
    shopItems.push({
      id,
      name: `${namePrefix}${realm.name}${nameSuffix ? ` ${nameSuffix}` : ''}`.trim(),
      description: `${config.description || 'Dùng để đột phá tiểu cảnh giới.'} Chỉ dùng khi đang ở ${realm.name}.`,
      cost: baseCost,
      type: 'minorAscension',
      priceStep,
      requiredMajorRealmIndex: index,
      breakthroughMajorRealmIndex: index,
    });
    existingIds.add(id);
  });
}

function createMajorAscensionTreasureShopItems() {
  const config = majorAscensionTreasureConfig || {};
  const idPrefix = String(config.idPrefix || 'majorAscensionTreasure');
  const namePrefix = String(config.namePrefix || 'Cục Thiên Tài Địa Bảo');
  const description = String(config.description || 'Vật phẩm dùng để đột phá đại cảnh giới tương ứng.');
  const existingIds = new Set(shopItems.map((item) => item.id));

  cultivationProgression.forEach((realm, index) => {
    const id = `${idPrefix}${realm.id}`;
    if (existingIds.has(id)) return;
    shopItems.push({
      id,
      name: `${namePrefix} ${realm.name}`.trim(),
      description: `${description} Dành cho lần đột phá lên ${realm.name}.`,
      cost: 0,
      type: 'majorAscensionTreasure',
      hidden: true,
      targetMajorRealmIndex: index,
    });
    existingIds.add(id);
  });
}

function createMajorAscensionTreasureChestShopItems() {
  const config = majorAscensionTreasureChestConfig || {};
  const idPrefix = String(config.idPrefix || 'majorAscensionTreasureChest');
  const namePrefix = String(config.namePrefix || 'Rương');
  const description = String(config.description || 'Rương Boss map mở ra Cục Thiên Tài Địa Bảo của đại cảnh giới kế tiếp.');
  const existingIds = new Set(shopItems.map((item) => item.id));

  cultivationProgression.forEach((realm, sourceMajorRealmIndex) => {
    const targetMajorRealmIndex = sourceMajorRealmIndex + 1;
    const targetRealm = cultivationProgression[targetMajorRealmIndex];
    if (!targetRealm) return;
    const id = `${idPrefix}${targetRealm.id}`;
    if (existingIds.has(id)) return;
    shopItems.push({
      id,
      name: `${namePrefix} ${targetRealm.name}`.trim(),
      description: `${description} Boss ${realm.name} Đại viên mãn có thể rơi rương này.`,
      cost: 0,
      type: 'majorAscensionTreasureChest',
      hidden: true,
      sourceMajorRealmIndex,
      targetMajorRealmIndex,
    });
    existingIds.add(id);
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
  if (equipmentChestRarityProfiles.length !== 10) {
    throw new Error('Equipment data must contain rarity profiles for 10 chest tiers.');
  }
  const profileIds = new Set();
  equipmentChestRarityProfiles.forEach((profile) => {
    const chestTier = Number(profile?.chestTier);
    const weights = profile?.weights;
    if (!Number.isInteger(chestTier) || chestTier < 1 || chestTier > 10 || profileIds.has(chestTier)) {
      throw new Error(`Invalid equipment rarity profile for chest tier ${chestTier}.`);
    }
    if (!Array.isArray(weights) || weights.length !== equipmentQualityOrder.length
      || weights.some((weight) => !Number.isFinite(Number(weight)) || Number(weight) < 0)
      || Math.round(weights.reduce((sum, weight) => sum + Number(weight), 0)) !== 100) {
      throw new Error(`Equipment rarity profile ${chestTier} must contain 10 weights totaling 100.`);
    }
    profileIds.add(chestTier);
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
    const configuredDefaults = wanderMapDefaults[map.id] || {};
    const defaults = map.id === 'novice' || !wanderMapDefaults.allOther?.enemyRankWeights
      ? configuredDefaults
      : {
        ...configuredDefaults,
        enemyRankWeights: wanderMapDefaults.allOther.enemyRankWeights,
      };
    const [minEnemyTier, maxEnemyTier] = normalizeTierRange(map.tierRange, [1, playerMaxMinorLevel]);
    const equipmentChestTier = Math.max(
      1,
      Math.floor(Number(map.equipmentChestTier ?? defaults.equipmentChestTier) || 1),
    );
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
      enemyChance: defaults.enemyChance ?? (Number(gameConfig.gameplay?.wanderEnemyChance) || 0.4),
    }];
  }));
  wanderMapList = Object.values(wanderMaps);
  stages = stageEnemyData.slice(0, 10).map((enemyData, index) => {
    const level = index + 1;
    const majorIndex = getTierMajorIndex(level);
    return {
      id: level,
      enemyLevel: level,
      enemyTier: level,
      enemyMajorRealmIndex: majorIndex,
      title: `Tầng ${level}`,
      realmText: getTierRealmText(level),
      enemyData,
    };
  });
}

function validateEnemyData(data) {
  if (!Array.isArray(data.maps) || data.maps.length === 0) throw new Error('Enemy data missing maps.');
  if (!Array.isArray(data.enemyPools) || data.enemyPools.length === 0) throw new Error('Enemy data missing enemyPools.');
  const enemyTypesById = new Map(data.enemyPools.map((enemy) => [enemy.id, enemy.type || 'Tu sĩ']));
  data.maps.forEach((map) => {
    if (!map.id || !map.name || !Array.isArray(map.tierRange)) throw new Error(`Invalid enemy map: ${map.id || 'unknown'}`);
    if (!Array.isArray(map.enemyPoolIds) || map.enemyPoolIds.length !== 6) {
      throw new Error(`Map ${map.id} must contain exactly 6 enemies.`);
    }
    const typeCounts = map.enemyPoolIds.reduce((counts, enemyId) => {
      if (!enemyTypesById.has(enemyId)) throw new Error(`Map ${map.id} references unknown enemy: ${enemyId}`);
      const type = enemyTypesById.get(enemyId);
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {});
    if (Object.values(typeCounts).some((count) => count > 2)) {
      throw new Error(`Map ${map.id} cannot contain more than 2 enemies of the same type.`);
    }
  });
  data.enemyPools.forEach((enemy) => {
    if (!enemy.id || !enemy.name || !enemy.skillName) {
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
    skillId: enemy.skillId || '',
    skillDescription: enemy.skillDescription || '',
    description: enemy.description || '',
    visual: {
      image: typeof enemy.visual?.image === 'string' ? enemy.visual.image : '',
      position: typeof enemy.visual?.position === 'string' ? enemy.visual.position : 'center',
      size: typeof enemy.visual?.size === 'string' ? enemy.visual.size : 'contain',
    },
    canEquip: true,
    combatStyle: enemy.combatStyle || 'counter',
    weight: Math.max(1, Number(enemy.weight) || 1),
  };
}

function applyEnemySkillAssignments() {
  const assignments = enemySkillData.assignments || {};
  const definitions = new Map((enemySkillData.skills || []).map((skill) => [skill.id, skill]));
  stageEnemyData.forEach((enemyData) => {
    const skillId = assignments[enemyData.id] || enemyData.skillId || '';
    const definition = definitions.get(skillId);
    enemyData.skillId = definition?.id || '';
    if (definition) {
      enemyData.skillName = definition.name;
      enemyData.skillDescription = definition.description || 'Không có hiệu ứng thêm';
    }
  });
}

function getEnemySkillDefinition(enemyData = {}) {
  const definition = (enemySkillData.skills || []).find((skill) => skill.id === enemyData.skillId);
  return {
    ...(enemySkillData.defaultSkill || {}),
    ...(definition || {}),
    name: enemyData.skillName || definition?.name || enemySkillData.defaultSkill?.name || 'Đánh cơ bản',
    description: enemyData.skillDescription || definition?.description || 'Không có hiệu ứng thêm',
  };
}

function createEnemySkillRuntime(enemyData) {
  const definition = getEnemySkillDefinition(enemyData);
  const cooldown = Math.max(1, Number(definition.cooldown) || 1);
  return {
    id: definition.id || `enemy-skill-${enemyData.id}`,
    name: definition.name,
    description: definition.description,
    cost: Math.max(0, Number(definition.cost) || 0),
    multiplier: Math.max(0, Number(definition.multiplier) || 0),
    cooldown,
    cooldownRemaining: cooldown,
    effects: Array.isArray(definition.effects) ? definition.effects.map((effect) => ({ ...effect })) : [],
  };
}

function applyEnemySkillRuntime(fighter, enemyData) {
  const specialSkill = createEnemySkillRuntime(enemyData);
  const basicSkill = createEnemySkillRuntime({ skillId: 'enemy_basic' });
  fighter.skillId = specialSkill.id;
  fighter.skillName = specialSkill.name;
  fighter.skillDescription = specialSkill.description;
  fighter.skillCost = specialSkill.cost;
  fighter.skillMultiplier = specialSkill.multiplier;
  fighter.skillCooldown = specialSkill.cooldown;
  fighter.skillCooldownRemaining = specialSkill.cooldownRemaining;
  fighter.skills = [specialSkill, basicSkill];
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
  startActivityRefresh();
  startCloudAutoSave();
  startMailPolling();
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

function setAccountSaveKey(user = null) {
  saveKey = user?.id && baseSaveKey ? `${baseSaveKey}:${user.id}` : baseSaveKey;
}

function renderAccountBar() {
  if (!accountBar) return;
  const signedIn = Boolean(cloudUser);
  accountBar.classList.toggle('is-hidden', !signedIn);
  if (signedIn && accountName) accountName.textContent = cloudUser.username;
}

function setAuthMessage(message = '', variant = '') {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.className = `auth-message${variant ? ` auth-message-${variant}` : ''}`;
}

function renderAuthMode() {
  const registering = authMode === 'register';
  if (authTitle) authTitle.textContent = registering ? 'Đăng ký' : 'Đăng nhập';
  if (authSubmitButton) authSubmitButton.textContent = registering ? 'Tạo tài khoản' : 'Đăng nhập';
  authPasswordConfirmationWrap?.classList.toggle('is-hidden', !registering);
  if (authPasswordConfirmation) authPasswordConfirmation.required = registering;
  loginModeButton?.classList.toggle('is-active', !registering);
  registerModeButton?.classList.toggle('is-active', registering);
  loginModeButton?.setAttribute('aria-selected', String(!registering));
  registerModeButton?.setAttribute('aria-selected', String(registering));
  if (authPassword) authPassword.autocomplete = registering ? 'new-password' : 'current-password';
}

function showAuthOverlay(message = '') {
  renderAuthMode();
  setAuthMessage(message);
  authOverlay?.classList.remove('is-hidden');
  window.setTimeout(() => authUsername?.focus(), 0);
}

function hideAuthOverlay() {
  authOverlay?.classList.add('is-hidden');
  setAuthMessage('');
}

function clearCloudSaveQueue() {
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = 0;
  cloudPendingData = null;
}

function pauseCloudAutosave() {
  window.clearInterval(cloudPeriodicSaveTimer);
  cloudPeriodicSaveTimer = 0;
  clearCloudSaveQueue();
}

function showSessionReplaced() {
  if (cloudSessionInvalid) return;
  cloudSessionInvalid = true;
  gameStarted = false;
  pauseCloudAutosave();
  startActivityRefresh();
  clearWanderTimer();
  window.clearTimeout(timer);
  window.clearTimeout(resourceRegenTimer);
  timer = 0;
  resourceRegenTimer = 0;
  window.clearInterval(turnInterval);
  turnInterval = 0;
  window.clearInterval(mailPollingTimer);
  mailPollingTimer = 0;
  window.clearTimeout(cloudForegroundSyncTimer);
  cloudForegroundSyncTimer = 0;
  cloudUser = null;
  cloudSessionId = '';
  cloudSaveVersion = 0;
  cloudForegroundSyncInFlight = false;
  window.sessionStorage.removeItem('tuTienSessionId');
  renderAccountBar();
  showAuthOverlay('Tài khoản đã được đăng nhập trên thiết bị khác. Vui lòng đăng nhập lại.');
}

function handleCloudResponseFailure(response, payload = {}) {
  if (payload.code === 'SESSION_REPLACED' || response?.status === 409 && payload.code === 'SESSION_REPLACED') {
    showSessionReplaced();
    return true;
  }
  return false;
}

function rememberCloudSession(sessionId) {
  cloudSessionId = String(sessionId || '');
  if (cloudSessionId) window.sessionStorage.setItem('tuTienSessionId', cloudSessionId);
  else window.sessionStorage.removeItem('tuTienSessionId');
}

function resetCloudSessionState() {
  cloudSessionInvalid = false;
  cloudSyncUnavailable = false;
  cloudSaveVersion = 0;
  cloudLastForegroundSyncAt = 0;
  cloudExitSaveSent = false;
  rememberCloudSession('');
}

async function prepareCloudSession() {
  try {
    const response = await fetch(cloudAuthEndpoint, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (handleCloudResponseFailure(response, payload)) return false;
    if (response.status === 404 || response.status === 503 || !response.ok) {
      cloudSyncUnavailable = true;
      setAccountSaveKey();
      showAuthOverlay('Cần đăng nhập để bắt đầu chơi.');
      return false;
    }
    authServiceAvailable = true;
    if (!payload.user || !payload.sessionId) {
      showAuthOverlay();
      return false;
    }
    resetCloudSessionState();
    cloudUser = payload.user;
    rememberCloudSession(payload.sessionId);
    setAccountSaveKey(cloudUser);
    const cloudStateLoaded = await loadCloudSave();
    if (!cloudStateLoaded) {
      if (!cloudSessionInvalid) showAuthOverlay('Không thể tải dữ liệu tài khoản. Vui lòng thử lại trang.');
      return false;
    }
    renderAccountBar();
    return true;
  } catch (error) {
    cloudSyncUnavailable = true;
    setAccountSaveKey();
    showAuthOverlay('Cần đăng nhập để bắt đầu chơi.');
    return false;
  }
}

async function finishAuthentication(user, sessionId) {
  resetCloudSessionState();
  cloudUser = user;
  rememberCloudSession(sessionId);
  authServiceAvailable = true;
  setAccountSaveKey(cloudUser);
  const cloudStateLoaded = await loadCloudSave();
  if (!cloudStateLoaded) {
    if (!cloudSessionInvalid) showAuthOverlay('Không thể tải dữ liệu tài khoản. Vui lòng thử lại.');
    return;
  }
  renderAccountBar();
  hideAuthOverlay();
  startGame();
}

async function submitAuth(event) {
  event.preventDefault();
  if (authSubmitting) return;
  authSubmitting = true;
  setButtonDisabledState(authSubmitButton, true, 'Đang xác thực, vui lòng chờ.');
  setAuthMessage('Đang xác thực...');
  try {
    const response = await fetch(cloudAuthEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: authMode,
        username: authUsername?.value || '',
        password: authPassword?.value || '',
        passwordConfirmation: authPasswordConfirmation?.value || '',
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (handleCloudResponseFailure(response, payload)) return;
    if (!response.ok || !payload.user || !payload.sessionId) {
      setAuthMessage(payload.error || 'Không thể xác thực tài khoản.', 'error');
      return;
    }
    await finishAuthentication(payload.user, payload.sessionId);
  } catch (error) {
    setAuthMessage('Không thể kết nối dịch vụ tài khoản.', 'error');
  } finally {
    authSubmitting = false;
    setButtonDisabledState(authSubmitButton, false);
  }
}

async function logout() {
  if (!cloudUser) return;
  const dataToSave = !cloudSessionInvalid ? saveGame() : null;
  pauseCloudAutosave();
  if (dataToSave && !cloudSessionInvalid) await syncCloudState(dataToSave);
  cloudUser = null;
  cloudSessionId = '';
  window.sessionStorage.removeItem('tuTienSessionId');
  try {
    await fetch(cloudAuthEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
  } finally {
    window.location.reload();
  }
}

async function syncCloudState(data) {
  if (!cloudUser || cloudSessionInvalid || cloudSyncUnavailable || !data) return false;
  const previousSave = cloudSaveInFlight;
  let releaseSave;
  const currentSave = new Promise((resolve) => {
    releaseSave = resolve;
  });
  cloudSaveInFlight = currentSave;
  if (previousSave) await previousSave;
  try {
    if (!cloudUser || cloudSessionInvalid || cloudSyncUnavailable) return false;
    const response = await fetch(cloudSaveEndpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: data, baseSaveVersion: cloudSaveVersion }),
    });
    const payload = await response.json().catch(() => ({}));
    if (handleCloudResponseFailure(response, payload)) return false;
    if (!response.ok) {
      if (payload.code === 'SAVE_CONFLICT') {
        pauseCloudAutosave();
        cloudSyncUnavailable = true;
        let replacedWithServerState = false;
        if (payload.state && typeof payload.state === 'object' && !Array.isArray(payload.state)) {
          cloudSaveVersion = Math.max(0, Number(payload.saveVersion) || 0);
          window.localStorage.setItem(saveKey, JSON.stringify(payload.state));
          replacedWithServerState = loadSavedGame();
        } else {
          replacedWithServerState = await loadCloudSave() && loadSavedGame();
        }
        if (replacedWithServerState) {
          cloudSyncUnavailable = false;
          saveGame();
          renderCultivation();
          renderInventory();
          renderShop();
          renderEquipment();
          renderProfile();
          startCloudAutoSave();
        }
      } else {
        pauseCloudAutosave();
        cloudSyncUnavailable = true;
      }
      return false;
    }
    cloudSaveVersion = Math.max(cloudSaveVersion, Number(payload.saveVersion) || 0);
    return true;
  } catch (error) {
    if (!cloudSessionInvalid) {
      pauseCloudAutosave();
      cloudSyncUnavailable = true;
    }
    return false;
  } finally {
    releaseSave();
    if (cloudSaveInFlight === currentSave) cloudSaveInFlight = null;
  }
}

function queueCloudSave(data) {
  if (!cloudUser || cloudSessionInvalid || cloudSyncUnavailable) return;
  cloudPendingData = data;
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(async () => {
    const pendingData = cloudPendingData;
    cloudPendingData = null;
    cloudSaveTimer = 0;
    await syncCloudState(pendingData);
    if (cloudPendingData && !cloudSessionInvalid && !cloudSyncUnavailable) queueCloudSave(cloudPendingData);
  }, 500);
}

function startCloudAutoSave() {
  window.clearInterval(cloudPeriodicSaveTimer);
  cloudPeriodicSaveTimer = 0;
  if (!cloudUser || cloudSessionInvalid || cloudSyncUnavailable) return;
  cloudPeriodicSaveTimer = window.setInterval(async () => {
    if (!gameStarted || !cloudUser || cloudSessionInvalid || cloudSyncUnavailable || cloudPeriodicSyncInFlight || mailClaimInFlight.size > 0) return;
    const latestData = saveGame();
    if (!latestData) return;
    window.clearTimeout(cloudSaveTimer);
    cloudSaveTimer = 0;
    cloudPendingData = null;
    cloudPeriodicSyncInFlight = true;
    try {
      await syncCloudState(latestData);
    } finally {
      cloudPeriodicSyncInFlight = false;
    }
  }, 5000);
}

async function loadCloudSave() {
  if (!cloudUser || !saveKey || cloudSessionInvalid) return false;
  try {
    const response = await fetch(cloudSaveEndpoint, {
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    if (handleCloudResponseFailure(response, payload)) return false;
    if (response.status === 404 || response.status === 503) {
      cloudSyncUnavailable = true;
      return false;
    }
    if (!response.ok) {
      cloudSyncUnavailable = true;
      return false;
    }
    cloudSaveVersion = Math.max(0, Number(payload.saveVersion) || 0);
    if (!payload.state || typeof payload.state !== 'object' || Array.isArray(payload.state)) {
      window.localStorage.removeItem(saveKey);
      return true;
    }
    window.localStorage.setItem(saveKey, JSON.stringify(payload.state));
    return true;
  } catch (error) {
    cloudSyncUnavailable = true;
    return false;
  }
}

function scheduleCloudForegroundSync() {
  window.clearTimeout(cloudForegroundSyncTimer);
  cloudForegroundSyncTimer = window.setTimeout(syncCloudAfterForeground, 350);
}

async function syncCloudAfterForeground() {
  cloudForegroundSyncTimer = 0;
  if (!cloudUser || cloudSessionInvalid || !gameStarted || cloudForegroundSyncInFlight) return;
  if (Date.now() - cloudLastForegroundSyncAt < 1500) return;
  cloudLastForegroundSyncAt = Date.now();
  cloudForegroundSyncInFlight = true;
  pauseCloudAutosave();
  try {
    const authResponse = await fetch(cloudAuthEndpoint, { cache: 'no-store' });
    const authPayload = await authResponse.json().catch(() => ({}));
    if (handleCloudResponseFailure(authResponse, authPayload)) return;
    if (!authResponse.ok || !authPayload.user || !authPayload.sessionId) {
      cloudSyncUnavailable = true;
      return;
    }
    rememberCloudSession(authPayload.sessionId);
    if (authPayload.user.id !== cloudUser.id) {
      showSessionReplaced();
      return;
    }
    if (busy) {
      cloudSyncUnavailable = false;
      startCloudAutoSave();
      startMailPolling();
      return;
    }
    if (!await flushPendingCloudSaveBeforePull()) return;
    if (!await loadCloudSave() || !loadSavedGame()) {
      cloudSyncUnavailable = true;
      return;
    }
    cloudSyncUnavailable = false;
    saveGame();
    renderCultivation();
    renderInventory();
    renderShop();
    renderEquipment();
    renderProfile();
    startCloudAutoSave();
    startMailPolling();
  } catch (error) {
    cloudSyncUnavailable = true;
  } finally {
    cloudForegroundSyncInFlight = false;
  }
}

function handleCloudVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    cloudWasHidden = true;
    pauseCloudAutosave();
    flushCloudSaveForLifecycle();
    return;
  }
  if (cloudWasHidden) {
    cloudWasHidden = false;
    scheduleCloudForegroundSync();
  }
}

function handleCloudPageShow(event) {
  if (event.persisted || cloudWasHidden) scheduleCloudForegroundSync();
}

async function flushPendingCloudSaveBeforePull() {
  if (cloudSaveInFlight) await cloudSaveInFlight;
  const pendingData = cloudPendingData;
  if (!pendingData) return true;
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = 0;
  cloudPendingData = null;
  return syncCloudState(pendingData);
}

function flushCloudSaveForLifecycle({ markExit = false } = {}) {
  if (!gameStarted || resettingGameData || !cloudUser || cloudSessionInvalid || cloudSyncUnavailable) return;
  if (markExit && cloudExitSaveSent) return;
  if (markExit) cloudExitSaveSent = true;

  const data = saveGame();
  if (!data) return;
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = 0;
  cloudPendingData = null;

  const body = JSON.stringify({ state: data, baseSaveVersion: cloudSaveVersion });
  const blob = new Blob([body], { type: 'application/json' });
  if (navigator.sendBeacon?.(cloudSaveEndpoint, blob)) return;

  void fetch(cloudSaveEndpoint, {
    method: 'PUT',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(() => {});
}

function flushCloudSaveOnPageExit() {
  flushCloudSaveForLifecycle({ markExit: true });
}

function openResetConfirm() {
  if (resettingGameData) return;
  resetConfirmModal?.classList.remove('is-hidden');
  confirmResetButton?.focus();
}

function closeResetConfirm() {
  resetConfirmModal?.classList.add('is-hidden');
}

function openLogoutConfirm() {
  if (!cloudUser || authSubmitting) return;
  logoutConfirmModal?.classList.remove('is-hidden');
  confirmLogoutButton?.focus();
}

function closeLogoutConfirm() {
  logoutConfirmModal?.classList.add('is-hidden');
}

async function resetGameData() {
  resettingGameData = true;
  closeResetConfirm();
  clearWanderTimer();
  window.clearTimeout(autoWanderRecoveryTimer);
  autoWanderRecoveryTimer = 0;
  autoWanderAfterRecovery = false;
  window.clearTimeout(timer);
  window.clearTimeout(resourceRegenTimer);
  let savedData = null;
  try {
    const raw = window.localStorage.getItem(saveKey);
    savedData = raw ? JSON.parse(raw) : null;
  } catch (error) {
    savedData = null;
  }
  if (savedData && typeof savedData === 'object') {
    const resetData = {
      ...savedData,
      foundationFindCounts: {},
      highEnemyEncounterChance: false,
      autoWanderEnabled: false,
      wanderEventRollCount: 0,
      wanderWinCount: 0,
      wanderRewardCount: 0,
      wanderDefeatedByMap: {},
      wanderBossDefeatedByMap: {},
      equipmentEquipCounts: {},
      foundationPillPurchases: {},
      cultivationPillPurchases: {},
      potionPurchaseCounts: {},
      ascensionPillPurchases: {},
      majorAscensionTreasureChestPurchases: {},
      talentTreasureInventory: [],
      talentTreasureIdSeed: 1,
      playerTalentStatBonuses: {},
      dailyEquipmentChestPurchases: { date: getDailyKey(), total: 0 },
      dailyShopPurchases: { date: getDailyKey(), counts: {} },
      dailyResourceAttempts: { date: getDailyKey() },
      playerBattleState: createDefaultPlayerBattleState(),
      cultivationSpeedBonus: 0,
      completedStages: [],
      currentStageId: stages[0]?.id || 1,
      currentDungeonId: initialState.dungeonId,
      currentWanderMapId: initialState.wanderMapId,
      beastHuntMapId: '',
      beastHuntRespawnAt: 0,
      beastHuntNotificationPending: false,
      beastHuntPendingReward: null,
      beastHuntBattleActive: false,
      trainingDummyLastDamage: 0,
      trainingDummyLastTurns: 0,
      autoWanderAfterRecovery: false,
      hasMajorAscensionPermit: false,
      lastActiveAt: Date.now(),
      trainingWasActive: true,
    };
    window.localStorage.setItem(saveKey, JSON.stringify(resetData));
    await syncCloudState(resetData);
  } else {
    window.localStorage.removeItem(saveKey);
  }
  clearLegacySaves();
  window.location.reload();
}

function hasExistingCharacterSave(data = {}) {
  const savedName = sanitizePlayerName(data.playerName);
  const hasName = Boolean(data.hasSetPlayerName) || (savedName && savedName !== defaultPlayerName);
  const hasProgress = Number(data.playerLevel) > 1
    || Number(data.playerCultivation) > 0
    || Number(data.playerSpiritStones) > 0
    || Number(data.playerFoundation) > 1
    || Array.isArray(data.learnedSkillIds) && data.learnedSkillIds.length > 0
    || Array.isArray(data.inventory) && data.inventory.length > 0
    || data.equippedItems && Object.values(data.equippedItems).some(Boolean);
  return Boolean(data.playerSchoolId) || hasName || hasProgress;
}

function loadSavedGame() {
  try {
    const raw = window.localStorage.getItem(saveKey);
    if (!raw) return false;

    const data = JSON.parse(raw);
    const savedRealmOrderVersion = Number(data.cultivationRealmOrderVersion) || 1;
    playerName = sanitizePlayerName(data.playerName);
    if (playerName === 'Đạo hữu vô danh') playerName = defaultPlayerName;
    hasSetPlayerName = Boolean(data.hasSetPlayerName) || playerName !== defaultPlayerName;
    const hasCharacterSave = hasExistingCharacterSave(data);
    playerSchoolId = cultivationSchools.some((school) => school.id === data.playerSchoolId)
      ? data.playerSchoolId
      : hasCharacterSave ? 'sword_cultivator' : '';
    hasCompletedStartScreen = Boolean(data.hasCompletedStartScreen || hasCharacterSave) && Boolean(playerSchoolId);
    playerMajorRealmIndex = migrateRealmIndexForCurrentOrder(data.playerMajorRealmIndex, savedRealmOrderVersion);
    playerLevel = clamp(Number(data.playerLevel) || 1, 1, getMinorRealmLevelCap(playerMajorRealmIndex));
    playerCultivation = Math.max(0, Number(data.playerCultivation) || 0);
    playerSpiritStones = Math.max(0, Number(data.playerSpiritStones) || 0);
    playerFoundation = Math.max(1, Number(data.playerFoundation) || 1);
    playerComprehension = Math.max(1, Math.floor(Number(data.playerComprehension) || 1));
    redeemedCodes = data.redeemedCodes && typeof data.redeemedCodes === 'object'
      ? Object.fromEntries(Object.entries(data.redeemedCodes).map(([code, used]) => [String(code), Boolean(used)]))
      : {};
    claimedMailIds = Array.isArray(data.claimedMailIds)
      ? [...new Set(data.claimedMailIds.map(String))].slice(-500)
      : [];
    foundationFindCounts = normalizeFoundationFindCounts(data.foundationFindCounts);
    wanderChestRewards = normalizeWanderChestRewards(data.wanderChestRewards);
    highEnemyEncounterChance = Boolean(data.highEnemyEncounterChance);
    autoWanderEnabled = Boolean(data.autoWanderEnabled ?? data.skipEnemyEncounters);
    wanderEventRollCount = Math.max(0, Math.floor(Number(data.wanderEventRollCount) || 0));
    wanderWinCount = Math.max(0, Math.floor(Number(data.wanderWinCount) || 0));
    wanderRewardCount = Math.max(0, Math.floor(Number(data.wanderRewardCount) || 0));
    wanderDefeatedByMap = normalizeWanderMapCounts(data.wanderDefeatedByMap);
    wanderBossDefeatedByMap = normalizeWanderMapFlags(data.wanderBossDefeatedByMap);
    trialTowerWinCount = Math.max(0, Math.floor(Number(data.trialTowerWinCount) || 0));
    equipmentEquipCounts = data.equipmentEquipCounts && typeof data.equipmentEquipCounts === 'object'
      ? Object.fromEntries(Object.entries(data.equipmentEquipCounts).map(([key, value]) => [key, Math.max(0, Math.floor(Number(value) || 0))]))
      : {};
    dailyQuestProgress = normalizeDailyQuestProgress(data.dailyQuestProgress);
    foundationPillPurchases = normalizeFoundationPillPurchases(data.foundationPillPurchases);
    cultivationPillPurchases = normalizeCultivationPillPurchases(data.cultivationPillPurchases);
    potionPurchaseCounts = normalizeCultivationPillPurchases(data.potionPurchaseCounts);
    ascensionPillPurchases = normalizeCultivationPillPurchases(data.ascensionPillPurchases);
    majorAscensionTreasureChestPurchases = normalizeCultivationPillPurchases(data.majorAscensionTreasureChestPurchases);
    cultivationSpeedBonus = Math.max(0, Number(data.cultivationSpeedBonus) || 0);
    playerCurrentHp = data.playerCurrentHp ?? null;
    playerCurrentMana = data.playerCurrentMana ?? null;
    healthPotionCount = Math.max(0, Number(data.healthPotionCount) || 0);
    manaPotionCount = Math.max(0, Number(data.manaPotionCount) || 0);
    enhancementStones = Math.max(0, Number(data.enhancementStones) || Number(data.enhancementMaterials) || 0);
    skillBooks = data.skillBooks && typeof data.skillBooks === 'object' ? data.skillBooks : {};
    skillFragments = data.skillFragments && typeof data.skillFragments === 'object' ? data.skillFragments : {};
    petFragments = data.petFragments && typeof data.petFragments === 'object'
      ? Object.fromEntries(Object.entries(data.petFragments).map(([petId, count]) => [
        petId,
        Math.max(0, Math.floor(Number(count) || 0)),
      ]))
      : {};
    shopInventoryCounts = normalizeShopInventoryCounts(data.shopInventoryCounts);
    talentTreasureInventory = normalizeTalentTreasureInventory(data.talentTreasureInventory);
    talentTreasureIdSeed = Math.max(
      1,
      Number(data.talentTreasureIdSeed) || 1,
      ...talentTreasureInventory
        .map((item) => Number(String(item.id).replace(/^talentTreasure-/, '')) + 1)
        .filter(Number.isFinite),
    );
    playerTalentStatBonuses = Object.fromEntries(['maxHp', 'attack', 'mastery', 'defense', 'maxMana'].map((stat) => [
      stat,
      Math.max(0, Math.round(Number(data.playerTalentStatBonuses?.[stat]) || 0)),
    ]));
    skillLevels = data.skillLevels && typeof data.skillLevels === 'object' ? data.skillLevels : {};
    skillPractice = data.skillPractice && typeof data.skillPractice === 'object' ? data.skillPractice : {};
    learnedSkillIds = Array.isArray(data.learnedSkillIds) ? data.learnedSkillIds : [];
    skillLearningComprehension = clamp(
      Number.isFinite(Number(data.skillLearningComprehension))
        ? Number(data.skillLearningComprehension)
        : Math.max(0, learnedSkillIds.length - 1),
      0,
      3,
    );
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
    dailyEquipmentChestPurchases = normalizeDailyEquipmentChestPurchases(data.dailyEquipmentChestPurchases);
    dailyShopPurchases = normalizeDailyShopPurchases(data.dailyShopPurchases);
    resourceDungeonProgress = normalizeResourceDungeonProgress(data.resourceDungeonProgress);
    playerBattleState = normalizePlayerBattleState(data.playerBattleState);
    const interruptedBeastHuntBattle = Boolean(data.beastHuntBattleActive);
    beastHuntMapId = wanderMaps[data.beastHuntMapId] ? data.beastHuntMapId : '';
    beastHuntRespawnAt = Math.max(0, Number(data.beastHuntRespawnAt) || 0);
    beastHuntNotificationPending = Boolean(data.beastHuntNotificationPending);
    beastHuntPendingReward = normalizeBeastHuntReward(data.beastHuntPendingReward);
    trainingDummyLastDamage = Math.max(0, Number(data.trainingDummyLastDamage) || 0);
    trainingDummyLastTurns = Math.max(0, Math.floor(Number(data.trainingDummyLastTurns) || 0));
    beastHuntBattleActive = false;
    if (interruptedBeastHuntBattle) {
      beastHuntMapId = '';
      beastHuntPendingReward = null;
      beastHuntNotificationPending = false;
      beastHuntRespawnAt = Date.now() + getBeastHuntRespawnMs();
    }
    activeSkillId = data.activeSkillId || initialState.skillId;
    const savedOwnedPetIds = Array.isArray(data.ownedPetIds) ? data.ownedPetIds : [];
    const legacySelectedPetId = petData.pets.some((pet) => pet.id === data.selectedPetId)
      ? data.selectedPetId
      : '';
    ownedPetIds = [...new Set(savedOwnedPetIds
      .filter((petId) => petData.pets.some((pet) => pet.id === petId))
      .concat(savedOwnedPetIds.length ? [] : legacySelectedPetId))];
    selectedPetId = ownedPetIds.includes(data.selectedPetId) ? data.selectedPetId : ownedPetIds[0] || '';
    deployedPetId = ownedPetIds.includes(data.deployedPetId) ? data.deployedPetId : '';
    petStates = normalizePetStates(data.petStates);
    skillTrainingId = data.skillTrainingManual ? (data.skillTrainingId || '') : '';
    ensureActiveSkill();
    hasMajorAscensionPermit = false;
    if (Boolean(data.hasMajorAscensionPermit) && hasNextMajorRealm()
      && getShopInventoryCount('majorAscensionPermit') <= 0) {
      addShopInventoryItem('majorAscensionPermit');
    }
    clampDantianCultivation();

    equippedItems = Object.fromEntries(equipmentSlots.map((slot) => [slot.id, null]));
    Object.entries(data.equippedItems || {}).forEach(([slotId, item]) => {
      if (equipmentTemplates[slotId] && item) equippedItems[slotId] = normalizeSavedItem(item);
    });
    inventory = (data.inventory || []).map(normalizeSavedItem).filter(Boolean);
    const savedChestInventory = Array.isArray(data.equipmentChestInventory)
      ? data.equipmentChestInventory.map((item) => (
        savedRealmOrderVersion < cultivationRealmOrderVersion && item && Number.isInteger(Number(item.majorRealmIndex))
          ? { ...item, majorRealmIndex: migrateRealmIndexForCurrentOrder(item.majorRealmIndex, savedRealmOrderVersion) }
          : item
      ))
      : data.equipmentChestInventory;
    equipmentChestInventory = normalizeEquipmentChestInventory(savedChestInventory);
    equipmentChestIdSeed = Math.max(1, Number(data.equipmentChestIdSeed) || 1, ...equipmentChestInventory.map((item) => item.idNumber + 1));

    const allItemIds = [
      ...inventory.map((item) => item.id),
      ...Object.values(equippedItems).filter(Boolean).map((item) => item.id),
    ];
    equipmentIdSeed = Math.max(1, Number(data.equipmentIdSeed) || 1, ...allItemIds.map((id) => id + 1));
    if (!isWanderMapUnlocked(getCurrentWanderMap())) currentWanderMapId = getBestUnlockedWanderMap().id;
    currentStage = stages.find((stage) => stage.id === data.currentStageId) || getCurrentDungeonStage() || stages[0];
    syncPlayerResourceCaps();
    applyOfflineProgress(data);
    return true;
  } catch (error) {
    console.warn('Cannot load save data.', error);
    window.localStorage.removeItem(saveKey);
    return false;
  }
}

function normalizePetStates(states = {}) {
  const maxStars = Math.max(0, Math.floor(Number(petData.maxStars) || 5));
  const maxFeedPoints = Math.max(1, Math.floor(Number(petData.feed?.pointsPerStar) || 100));
  if (!states || typeof states !== 'object') return {};
  return Object.fromEntries(petData.pets.map((pet) => {
    const state = states[pet.id] || {};
    return [pet.id, {
      stars: clamp(Math.floor(Number(state.stars) || 0), 0, maxStars),
      feedPoints: clamp(Math.floor(Number(state.feedPoints) || 0), 0, maxFeedPoints),
      cultivation: Math.max(0, Number(state.cultivation) || 0),
      realmIndex: clamp(Math.floor(Number(state.realmIndex) || 0), 0, Math.max(0, petRealmData.realms.length - 1)),
      level: clamp(
        Math.floor(Number(state.level) || 1),
        1,
        petRealmData.realms[Math.floor(Number(state.realmIndex) || 0)]?.minorRealms?.length || 9,
      ),
    }];
  }).filter(([, state]) => state.stars > 0 || state.feedPoints > 0 || state.cultivation > 0));
}

function normalizeCombatStatObject(stats = {}) {
  if (!stats || typeof stats !== 'object') return {};
  const normalized = Object.fromEntries(
    Object.entries(stats).filter(([stat]) => stat !== 'blockReduction' && stat !== 'speed'),
  );
  if (stats.mastery == null && stats.speed != null) {
    normalized.mastery = Number(stats.speed) || 0;
  }
  return normalized;
}

function normalizeSavedItem(item) {
  if (!item || !equipmentTemplates[item.slotId] || !rarityData[item.rarityKey]) return null;
  const itemLevel = Number(item.level) || 1;
  const normalizedItemLevel = clamp(itemLevel, 1, maxEquipmentLevel);
  const stats = item.stats
    ? normalizeCombatStatObject(item.stats)
    : createEquipmentStats(item.slotId, Number(item.level) || 1, item.rarityKey);
  const enhancementLevel = Math.max(0, Number(item.enhancementLevel) || 0);
  const normalizedEnhancementLevel = Math.min(
    getEquipmentEnhancementQualityMax(item),
    enhancementLevel,
  );
  const baseStats = getBaseEquipmentStats({
    stats,
    baseStats: normalizeCombatStatObject(item.baseStats),
    enhancementLevel,
  });
  const name = item.name || pickRandom(getEquipmentNamePool(item.slotId, normalizedItemLevel));
  return {
    id: Number(item.id) || equipmentIdSeed++,
    slotId: item.slotId,
    name,
    setName: item.setName || getEquipmentSetName(item.slotId, name),
    rarityKey: item.rarityKey,
    level: normalizedItemLevel,
    sourceChestTier: Math.max(0, Number(item.sourceChestTier) || 0),
    enhancementLevel: normalizedEnhancementLevel,
    stats: getEnhancedEquipmentStats({ stats, baseStats, rarityKey: item.rarityKey }, normalizedEnhancementLevel),
    baseStats,
    specialLines: Array.isArray(item.specialLines)
      ? item.specialLines
        .filter((line) => !['victoryRecovery', 'reflectDamage'].includes(line?.id))
        .map((line) => {
          const definition = specialLineData.find((entry) => entry.id === line?.id);
          if (!definition) return null;
          const [min, max] = definition.valueRange || [0.01, 0.05];
          return {
            ...line,
            name: definition.name,
            value: roundStat(clamp(Number(line.value) || min, min, max)),
          };
        })
        .filter(Boolean)
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
        getMajorRealmMaxIndex(),
      );
      const levelRange = getEquipmentLevelRange({ chestTier: storedTier });
      const rarityProfile = getEquipmentRarityProfile({ chestTier: storedTier });
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
    cultivationRealmOrderVersion,
    playerMajorRealmIndex,
    playerLevel,
    playerCultivation,
    playerSpiritStones,
    playerFoundation,
    playerComprehension,
    skillLearningComprehension,
    redeemedCodes,
    claimedMailIds,
    foundationFindCounts,
    wanderChestRewards,
    highEnemyEncounterChance,
    autoWanderEnabled,
    wanderEventRollCount,
    wanderWinCount,
    wanderRewardCount,
    wanderDefeatedByMap,
    wanderBossDefeatedByMap,
    trialTowerWinCount,
    equipmentEquipCounts,
    dailyQuestProgress: normalizeDailyQuestProgress(dailyQuestProgress),
    foundationPillPurchases,
    cultivationPillPurchases,
    potionPurchaseCounts,
    ascensionPillPurchases,
    majorAscensionTreasureChestPurchases,
    cultivationSpeedBonus,
    playerCurrentHp,
    playerCurrentMana,
    healthPotionCount,
    manaPotionCount,
    enhancementStones,
    skillBooks,
    skillFragments,
    shopInventoryCounts,
    talentTreasureInventory,
    talentTreasureIdSeed,
    playerTalentStatBonuses,
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
    beastHuntMapId,
    beastHuntRespawnAt,
    beastHuntNotificationPending,
    beastHuntPendingReward,
    beastHuntBattleActive,
    trainingDummyLastDamage,
    trainingDummyLastTurns,
    autoWanderAfterRecovery,
    trialTowerHighestCleared,
    claimedQuestIds: [...claimedQuestIds],
    dailyDungeonAttempts,
    dailyResourceAttempts,
    dailyEquipmentChestPurchases: normalizeDailyEquipmentChestPurchases(dailyEquipmentChestPurchases),
    dailyShopPurchases: normalizeDailyShopPurchases(dailyShopPurchases),
    resourceDungeonProgress,
    playerBattleState: normalizePlayerBattleState(playerBattleState),
    activeSkillId,
    selectedPetId,
    deployedPetId,
    petStates,
    petFragments,
    ownedPetIds,
    hasMajorAscensionPermit: false,
    equipmentIdSeed,
    equipmentChestIdSeed,
    equippedItems,
    inventory,
    equipmentChestInventory,
  };
  window.localStorage.setItem(saveKey, JSON.stringify(data));
  queueCloudSave(data);
  return data;
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
    return { date: today, wanderWins: 0, wanderRewards: 0, trialTowerWins: 0, resourceDungeonWins: 0 };
  }
  return {
    date: today,
    wanderWins: Math.max(0, Math.floor(Number(progress.wanderWins) || 0)),
    wanderRewards: Math.max(0, Math.floor(Number(progress.wanderRewards) || 0)),
    trialTowerWins: Math.max(0, Math.floor(Number(progress.trialTowerWins) || 0)),
    resourceDungeonWins: Math.max(0, Math.floor(Number(progress.resourceDungeonWins) || 0)),
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

function ensureDailyAttempts() {
  dailyDungeonAttempts = normalizeDailyAttempts(dailyDungeonAttempts);
  dailyResourceAttempts = normalizeDailyResourceAttempts(dailyResourceAttempts);
  dailyEquipmentChestPurchases = normalizeDailyEquipmentChestPurchases(dailyEquipmentChestPurchases);
  dailyShopPurchases = normalizeDailyShopPurchases(dailyShopPurchases);
}

function getEquipmentChestDailyPurchaseLimit() {
  return Math.max(1, Math.floor(Number(gameConfig.gameplay?.equipmentChestDailyPurchaseLimit) || 20));
}

function normalizeDailyEquipmentChestPurchases(purchases = {}) {
  const today = getDailyKey();
  if (purchases.date !== today) return { date: today, total: 0 };
  return {
    date: today,
    total: clamp(Math.floor(Number(purchases.total) || 0), 0, getEquipmentChestDailyPurchaseLimit()),
  };
}

function getDailyEquipmentChestPurchaseCount() {
  dailyEquipmentChestPurchases = normalizeDailyEquipmentChestPurchases(dailyEquipmentChestPurchases);
  return dailyEquipmentChestPurchases.total;
}

function getRemainingEquipmentChestPurchases() {
  return Math.max(0, getEquipmentChestDailyPurchaseLimit() - getDailyEquipmentChestPurchaseCount());
}

function recordEquipmentChestPurchase() {
  dailyEquipmentChestPurchases = normalizeDailyEquipmentChestPurchases(dailyEquipmentChestPurchases);
  dailyEquipmentChestPurchases.total = Math.min(
    getEquipmentChestDailyPurchaseLimit(),
    dailyEquipmentChestPurchases.total + 1,
  );
}

function getDailyShopPurchaseLimit(shopItem) {
  if (!shopItem) return 0;
  const limits = gameConfig.gameplay?.dailyShopPurchaseLimits || {};
  const limitKey = shopItem.type === 'potion'
    ? `${shopItem.potionType || 'health'}Potion`
    : shopItem.type;
  return Math.max(0, Math.floor(Number(limits[limitKey]) || 0));
}

function normalizeDailyShopPurchases(purchases = {}) {
  const today = getDailyKey();
  if (purchases.date !== today) return { date: today, counts: {} };
  const source = purchases.counts && typeof purchases.counts === 'object' ? purchases.counts : {};
  return {
    date: today,
    counts: Object.fromEntries(Object.entries(source).map(([itemId, count]) => [
      itemId,
      Math.max(0, Math.floor(Number(count) || 0)),
    ])),
  };
}

function getDailyShopPurchaseCount(shopItem) {
  dailyShopPurchases = normalizeDailyShopPurchases(dailyShopPurchases);
  return dailyShopPurchases.counts[shopItem?.id] || 0;
}

function getRemainingShopPurchases(shopItem) {
  const limit = getDailyShopPurchaseLimit(shopItem);
  if (limit <= 0) return maxShopPurchaseQuantity;
  return Math.max(0, limit - getDailyShopPurchaseCount(shopItem));
}

function recordShopItemPurchase(shopItem) {
  const dailyLimit = getDailyShopPurchaseLimit(shopItem);
  const tracksDailyPrice = ['enhancementStone', 'potion'].includes(shopItem?.type);
  if (dailyLimit <= 0 && !tracksDailyPrice) return;
  dailyShopPurchases = normalizeDailyShopPurchases(dailyShopPurchases);
  const current = getDailyShopPurchaseCount(shopItem);
  dailyShopPurchases.counts[shopItem.id] = dailyLimit > 0
    ? Math.min(dailyLimit, current + 1)
    : current + 1;
}

function normalizeDailyResourceAttempts(attempts = {}) {
  const today = getDailyKey();
  if (attempts.date !== today) return { date: today };
  const source = attempts.counts && typeof attempts.counts === 'object'
    ? attempts.counts
    : attempts;
  return Object.fromEntries([
    ['date', today],
    ...(progressionFeatures.resourceDungeons || []).map((dungeon) => [
      dungeon.id,
      Math.max(0, Math.floor(Number(source[dungeon.id]) || 0)),
    ]),
  ]);
}

function getResourceDungeonDailyLimit(dungeon) {
  return Math.max(1, Math.floor(Number(dungeon?.dailyLimit) || 3));
}

function getRemainingResourceAttempts(dungeonId) {
  dailyResourceAttempts = normalizeDailyResourceAttempts(dailyResourceAttempts);
  const dungeon = getResourceDungeon(dungeonId);
  if (!dungeon) return 0;
  return Math.max(0, getResourceDungeonDailyLimit(dungeon) - (dailyResourceAttempts[dungeonId] || 0));
}

function consumeResourceAttempt(dungeonId) {
  if (getRemainingResourceAttempts(dungeonId) <= 0) return false;
  dailyResourceAttempts[dungeonId] = (dailyResourceAttempts[dungeonId] || 0) + 1;
  return true;
}

function refundResourceAttempt(dungeonId) {
  dailyResourceAttempts = normalizeDailyResourceAttempts(dailyResourceAttempts);
  dailyResourceAttempts[dungeonId] = Math.max(0, (dailyResourceAttempts[dungeonId] || 0) - 1);
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

function addCombatPowerGrowthToStats(stats, combatPower, allocation) {
  const power = Math.max(0, Number(combatPower) || 0);
  const ratios = allocation?.ratios;
  if (!power || !ratios) return;
  Object.entries(ratios).forEach(([stat, ratio]) => {
    const definition = combatStatDefinitions.find((item) => item.id === stat);
    const powerPerPoint = Number(definition?.powerPerPoint) || 0;
    const statRatio = Math.max(0, Number(ratio) || 0);
    if (!powerPerPoint || !statRatio) return;
    stats[stat] = (stats[stat] || 0) + Math.max(0, Math.round((power * statRatio) / powerPerPoint));
  });
}

function resetCombatPowerAllocationStats(stats, allocation) {
  Object.keys(allocation?.ratios || {}).forEach((stat) => {
    stats[stat] = 0;
  });
}

function applyEnemyMajorRealmRateGrowth(stats, majorIndex, config = enemyStats) {
  const growth = config?.majorRealmRateGrowth || {};
  const breakthroughCount = Math.max(0, Math.floor(Number(majorIndex) || 0));
  Object.entries(growth).forEach(([stat, value]) => {
    if (stat === 'description') return;
    stats[stat] = (stats[stat] || 0) + (Number(value) || 0) * breakthroughCount;
  });
}

function createEnemyProgressionStats(majorIndex, level) {
  const config = enemyStats || {};
  const stats = { ...(config.baseStats || baseStats) };
  const usesCombatPowerProgression = Boolean(
    config.combatPowerAllocation?.ratios && cultivationPowerTable?.realms?.length,
  );
  if (usesCombatPowerProgression) {
    resetCombatPowerAllocationStats(stats, config.combatPowerAllocation);
    addCombatPowerGrowthToStats(
      stats,
      config.combatPowerAllocation.initialCombatPower,
      config.combatPowerAllocation,
    );
    for (let realmIndex = 0; realmIndex < majorIndex; realmIndex += 1) {
      const realmPower = cultivationPowerTable.realms[realmIndex];
      (realmPower?.minorPowerByTier || []).forEach((power) => {
        addCombatPowerGrowthToStats(stats, power, config.combatPowerAllocation);
      });
    }

    const currentRealmPower = cultivationPowerTable.realms[majorIndex];
    addCombatPowerGrowthToStats(stats, currentRealmPower?.majorRealmPower, config.combatPowerAllocation);
    const minorPowerByTier = currentRealmPower?.minorPowerByTier || [];
    for (let tierIndex = 0; tierIndex < Math.max(0, level - 1); tierIndex += 1) {
      addCombatPowerGrowthToStats(stats, minorPowerByTier[tierIndex], config.combatPowerAllocation);
    }
    applyEnemyMajorRealmRateGrowth(stats, majorIndex, config);
    return stats;
  }

  const minorGrowthByRealm = Array.isArray(config.minorGrowthByRealm) ? config.minorGrowthByRealm : [];
  const defaultMinorGrowth = config.defaultMinorGrowth || perLevel;
  const defaultMajorGrowth = config.defaultMajorBreakthrough || {};
  const majorGrowthByRealm = config.majorBreakthroughByRealm || {};
  const addGrowth = (growth, times) => {
    Object.entries(growth || {}).forEach(([stat, value]) => {
      stats[stat] = (stats[stat] || 0) + (Number(value) || 0) * times;
    });
  };
  const getMinorGrowth = (realmIndex) => minorGrowthByRealm[realmIndex] || defaultMinorGrowth;

  for (let realmIndex = 0; realmIndex < majorIndex; realmIndex += 1) {
    addGrowth(getMinorGrowth(realmIndex), getMinorRealmLevelCap(realmIndex));
    addGrowth(majorGrowthByRealm[String(realmIndex + 1)] || defaultMajorGrowth, 1);
  }
  addGrowth(getMinorGrowth(majorIndex), Math.max(0, level - 1));
  applyEnemyMajorRealmRateGrowth(stats, majorIndex, config);
  return stats;
}

function createFighter(name, minorLevel, includeEquipment = false, majorRealmIndex = playerMajorRealmIndex, useEnemyStats = false) {
  const majorIndex = clamp(Number(majorRealmIndex) || 0, 0, majorRealmNames.length - 1);
  const level = Math.max(1, Math.min(getMinorRealmLevelCap(majorIndex), Math.floor(minorLevel)));
  const progressionStats = useEnemyStats
    ? createEnemyProgressionStats(majorIndex, level)
    : getProgressionStats(majorIndex, level, includeEquipment ? playerSchoolId : '');
  const statBase = useEnemyStats ? (enemyStats.baseStats || baseStats) : baseStats;
  const getGrowthStat = (stat) => progressionStats[stat] ?? statBase[stat] ?? 0;
  const maxHp = getGrowthStat('maxHp');
  const maxMana = getGrowthStat('maxMana');

  const equippedSkills = includeEquipment
    ? getEquippedSkills().map((skill) => createSkillRuntime(skill))
    : [];
  const selectedSkill = equippedSkills.find((skill) => skill.id === activeSkillId) || equippedSkills[0] || null;
  const fighter = {
    name,
    isPlayerFighter: includeEquipment && name === playerName,
    realm: majorRealmNames[majorIndex],
    majorRealmIndex: majorIndex,
    level,
    minorRealm: getMinorRealmName(level, majorIndex),
    hp: maxHp,
    maxHp,
    mana: maxMana,
    maxMana,
    foundation: includeEquipment ? playerFoundation : 0,
    attack: getGrowthStat('attack'),
    defense: getGrowthStat('defense'),
    mastery: getGrowthStat('mastery'),
    accuracy: getGrowthStat('accuracy'),
    dodgeRate: getGrowthStat('dodgeRate'),
    blockRate: getGrowthStat('blockRate'),
    blockReduction: statBase.blockReduction,
    critRate: useEnemyStats ? getGrowthStat('critRate') : (statBase.critRate ?? 0),
    critDamage: useEnemyStats ? getGrowthStat('critDamage') : statBase.critDamage,
    armorPierce: useEnemyStats ? getGrowthStat('armorPierce') : statBase.armorPierce,
    damageReduction: getGrowthStat('damageReduction'),
    healingReduction: 0,
    lifeSteal: statBase.lifeSteal,
    luck: statBase.luck,
    spiritSense: statBase.spiritSense,
    comprehension: includeEquipment ? playerComprehension : getGrowthStat('comprehension'),
    victoryRecovery: 0,
    spiritStoneBonus: 0,
    skillName: selectedSkill?.name || 'Tuyệt Ảnh Kiếm',
    skillCost: selectedSkill?.cost || 20,
    skillMultiplier: selectedSkill?.multiplier || 1.4,
    skillCooldown: selectedSkill?.cooldown || 2,
    skillCooldownRemaining: selectedSkill?.cooldownRemaining || 0,
    skills: equippedSkills,
    battleBuffs: [],
  };

  if (includeEquipment) applyEquipmentStats(fighter);
  if (includeEquipment && !useEnemyStats) {
    Object.entries(playerTalentStatBonuses).forEach(([stat, amount]) => {
      fighter[stat] = (fighter[stat] || 0) + Math.max(0, Number(amount) || 0);
    });
  }
  fighter.hp = fighter.maxHp;
  fighter.mana = fighter.maxMana;
  return fighter;
}

function getProgressionStats(majorIndex, level, schoolId = '') {
  const school = cultivationSchools.find((item) => item.id === schoolId);
  const usesCombatPowerProgression = Boolean(
    school?.combatPowerAllocation?.ratios && cultivationPowerTable?.realms?.length,
  );
  const stats = {
    ...baseStats,
    ...(usesCombatPowerProgression ? {} : (school?.initialStats || {})),
  };
  const addGrowth = (growth, times) => {
    Object.entries(growth || {}).forEach(([stat, value]) => {
      stats[stat] = (stats[stat] || 0) + (Number(value) || 0) * times;
    });
  };
  if (usesCombatPowerProgression) {
    resetCombatPowerAllocationStats(stats, school.combatPowerAllocation);
    addCombatPowerGrowthToStats(
      stats,
      school.combatPowerAllocation.initialCombatPower,
      school.combatPowerAllocation,
    );
    for (let realmIndex = 0; realmIndex < majorIndex; realmIndex += 1) {
      const realmPower = cultivationPowerTable.realms[realmIndex];
      (realmPower?.minorPowerByTier || []).forEach((power) => {
        addCombatPowerGrowthToStats(stats, power, school.combatPowerAllocation);
      });
    }

    const currentRealmPower = cultivationPowerTable.realms[majorIndex];
    addCombatPowerGrowthToStats(stats, currentRealmPower?.majorRealmPower, school.combatPowerAllocation);
    const minorPowerByTier = currentRealmPower?.minorPowerByTier || [];
    for (let tierIndex = 0; tierIndex < Math.max(0, level - 1); tierIndex += 1) {
      addCombatPowerGrowthToStats(stats, minorPowerByTier[tierIndex], school.combatPowerAllocation);
    }
    return stats;
  }

  const getCommonMinorGrowth = (realmIndex) => majorRealmMinorGrowths[realmIndex] || perLevel;
  const getMinorGrowth = (realmIndex) => school?.minorGrowthByRealm?.[realmIndex] || getCommonMinorGrowth(realmIndex);
  const getMajorGrowth = (realmIndex) => majorRealmBreakthroughs[realmIndex + 1]
    || {};
  const getSchoolMajorGrowth = (realmIndex) => school?.majorBreakthroughGrowthByRealm?.[realmIndex]
    || school?.majorBreakthroughGrowth
    || {};

  for (let realmIndex = 0; realmIndex < majorIndex; realmIndex += 1) {
    addGrowth(getMinorGrowth(realmIndex), getMinorRealmLevelCap(realmIndex));
    addGrowth(getMajorGrowth(realmIndex), 1);
    addGrowth(getSchoolMajorGrowth(realmIndex), 1);
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
  trainingDummyDamageDealt = 0;
  worldBossDamageDealt = 0;
  worldBossAttackId = '';
  turn = 0;
  battleTurn20BoostApplied = false;
  logList.innerHTML = '';
  battleResult.classList.add('is-hidden');
  hideBattleResultOverlay();
  setButtonDisabledState(startButton, true, 'Trận đấu đang diễn ra.');
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
  showGameToast(`Đã chuyển sang ${dungeonConfigs[dungeonId].name}.`, 'info');
  saveGame();
}

function renderStageMap(options = {}) {
  updateNotificationBadges();
  updateWanderEventOverlay();
  const config = getDungeonConfig();
  const previousWanderScrollLeft = options.resetWanderCarouselPosition
    ? 0
    : Number(stageGrid.querySelector('.wander-map-viewport')?.scrollLeft) || 0;
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
  renderWanderMapSelector(previousWanderScrollLeft);
  if (!currentWanderEvent) {
    renderWanderStart(enoughHealth);
    renderBeastHuntMapEncounter();
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
      <em>${getEnemyRankLabel(stage.enemyData, stage.enemyRankLevel)} | ${formatRealmDisplayText(stage.realmText)} | ${stage.enemyData.skillName}</em>
      <small>Lực chiến ${formatGameNumber(getCombatPower(preview))} | ${config.description}</small>
      <b>${remaining <= 0 ? 'Hết lượt' : enoughHealth ? 'Chọn ải' : 'Sinh lực thấp'}</b>
    `;
    button.addEventListener('click', () => selectStage(stage));
    stageGrid.appendChild(button);
  });
}

function renderWanderMapSelector(initialScrollLeft = 0) {
  wanderCarouselCleanup?.();
  wanderCarouselCleanup = null;
  const lockedByEvent = Boolean(currentWanderEvent && currentWanderEvent.type !== 'result');
  const selector = document.createElement('div');
  selector.className = 'wander-map-carousel';
  selector.setAttribute('aria-label', 'Chọn bản đồ ngao du');

  const viewport = document.createElement('div');
  viewport.className = 'wander-map-viewport';
  viewport.setAttribute('tabindex', '0');
  viewport.setAttribute('aria-label', 'Danh sách map ngao du');

  const mapList = document.createElement('div');
  mapList.className = 'wander-map-list';
  mapList.setAttribute('role', 'tablist');
  mapList.setAttribute('aria-label', 'Danh sách map ngao du');

  wanderMapList.forEach((map) => {
    const unlocked = isWanderMapUnlocked(map);
    const active = map.id === currentWanderMapId;
    const mapTitle = map.name.replace(/^Map \d+:\s*/, '');
    const mapIcon = getWanderMapIconClass(map.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `wander-map-card ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}`;
    button.classList.toggle('locked-tab', !unlocked);
    setButtonDisabledState(button, lockedByEvent, 'Đang trong trận đấu, chưa thể đổi map.');
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(active));
    button.innerHTML = `
      <strong><i class="activity-icon ${mapIcon}" aria-hidden="true"></i>${mapTitle}</strong>
    `;
    button.title = unlocked ? map.name : `${map.name} - ${getWanderMapUnlockText(map)}`;
    button.addEventListener('click', () => setWanderMap(map.id));
    mapList.appendChild(button);
  });

  const scrollHint = document.createElement('div');
  scrollHint.className = 'wander-map-scroll-hint';
  scrollHint.innerHTML = `
    <strong data-wander-map-position></strong>
  `;

  viewport.appendChild(mapList);
  selector.append(viewport, scrollHint);
  stageGrid.appendChild(selector);

  const cards = [...mapList.querySelectorAll('.wander-map-card')];
  const updateScrollState = () => {
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const hasPrevious = viewport.scrollLeft > 2;
    const hasNext = viewport.scrollLeft < maxScroll - 2;
    selector.classList.toggle('has-previous', hasPrevious);
    selector.classList.toggle('has-next', hasNext);

    const openedMapCount = wanderMapList.filter((map) => isWanderMapUnlocked(map)).length;
    const position = selector.querySelector('[data-wander-map-position]');
    if (position) position.textContent = `${openedMapCount}/${cards.length}`;
  };

  const updateCardWidth = () => {
    const cardWidth = Math.max(0, (viewport.clientWidth - 8) / 3);
    mapList.style.setProperty('--wander-map-card-width', `${cardWidth}px`);
  };

  const dragController = new AbortController();
  viewport.addEventListener('wheel', (event) => {
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;
    const distance = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!distance) return;
    event.preventDefault();
    viewport.scrollLeft += distance;
  }, { passive: false, signal: dragController.signal });

  viewport.addEventListener('scroll', updateScrollState, { passive: true, signal: dragController.signal });
  const handleResize = () => {
    updateCardWidth();
    updateScrollState();
  };
  window.addEventListener('resize', handleResize, { passive: true, signal: dragController.signal });
  wanderCarouselCleanup = () => dragController.abort();
  window.requestAnimationFrame(() => {
    updateCardWidth();
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const activeCard = cards.find((card) => card.classList.contains('active'));
    const activeIndex = cards.indexOf(activeCard);
    const focusedScrollLeft = activeIndex <= 0
      ? 0
      : activeIndex === cards.length - 1
      ? maxScroll
      : activeCard.offsetLeft - (viewport.clientWidth - activeCard.offsetWidth) / 2;
    viewport.scrollLeft = Math.min(Math.max(0, initialScrollLeft), maxScroll);
    if (initialScrollLeft === 0 && activeCard) {
      viewport.scrollLeft = Math.min(Math.max(0, focusedScrollLeft), maxScroll);
    }
    updateScrollState();
  });
}

function startBeastHuntBattle(stage = createBeastHuntStage()) {
  if (busy || battleOver || beastHuntBattleActive || beastHuntPendingReward
    || Number(beastHuntRespawnAt) > Date.now()
    || !stage || !canAccessBeastHunt() || stage.mapId !== beastHuntMapId) return;
  if (!canEnterDungeon()) {
    showGameToast('Sinh lực chưa đủ để khiêu chiến yêu vật.', 'error');
    return;
  }
  beastHuntBattleActive = true;
  startStageBattle(stage);
  if (battlePanel?.classList.contains('is-hidden')) beastHuntBattleActive = false;
}

function startTrainingDummyBattle(stage = createTrainingDummyStage()) {
  if (busy || !stage) return;
  startStageBattle(stage);
}

async function startWorldBossBattle() {
  if (isWorldBossInDevelopment()) {
    showGameToast('Boss thế giới đang phát triển.', 'locked');
    return;
  }
  if (busy || worldBossAttackInFlight) return;
  if (!worldBossData?.boss) {
    await loadWorldBossState();
  }
  const boss = worldBossData?.boss;
  if (!boss || boss.state !== 'active' || Number(boss.currentHp) <= 0) {
    showGameToast('Boss thế giới hiện đang hồi sinh.', 'locked');
    return;
  }
  const maxAttempts = Math.max(1, Number(boss.maxAttemptsPerPlayer) || 3);
  if (Number(boss.currentUser?.attemptsRemaining) <= 0) {
    showGameToast(`Bạn đã dùng hết ${maxAttempts} lượt đánh Boss thế giới.`, 'locked');
    return;
  }
  const stage = createWorldBossStage(boss);
  if (!stage) {
    showGameToast('Chưa thể tạo trận đánh Boss thế giới.', 'error');
    return;
  }
  startStageBattle(stage);
}

function createWorldBossAttackId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `world-boss-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

async function submitWorldBossDamage(stage, damage) {
  if (!stage?.isWorldBoss || worldBossAttackInFlight) return;
  worldBossAttackInFlight = true;
  worldBossAttackId = worldBossAttackId || createWorldBossAttackId();
  try {
    const response = await fetch(worldBossEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        action: 'attack',
        attackId: worldBossAttackId,
        damage: Math.max(0, Math.floor(Number(damage) || 0)),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (handleCloudResponseFailure(response, payload)) return;
    if (!response.ok) {
      showGameToast(payload.error || 'Không thể ghi nhận sát thương Boss thế giới.', 'error');
      await loadWorldBossState({ silent: true });
      return;
    }
    worldBossData = { ok: true, boss: payload.boss };
    if (payload.killed) {
      showGameToast('Boss thế giới đã bị hạ. Phần thưởng đã được gửi qua Thư.', 'success');
    } else {
      showGameToast(`Đã ghi nhận ${formatGameNumber(payload.acceptedDamage)} sát thương Boss.`, 'success');
    }
    saveGame();
    if (activeActivityTab === 'worldBoss' && !activityPanel?.classList.contains('is-hidden')) {
      renderWorldBossActivity();
    }
  } catch (error) {
    showGameToast('Dịch vụ Boss thế giới tạm thời không khả dụng.', 'error');
  } finally {
    worldBossAttackInFlight = false;
    worldBossAttackId = '';
  }
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
    cultivationMultiplier: (map.rewardSettings?.cultivationMultiplier
      ?? config.cultivationMultiplier
      ?? 1) * cultivationRewardMultiplier,
    equipmentDropChance: config.equipmentDropChance ?? map.rewardSettings?.equipmentDropChance ?? 0,
    equipmentRarityBonus: map.rewardSettings?.equipmentRarityBonus ?? config.equipmentRarityBonus ?? 0,
    equipmentQualityMax: map.rewardSettings?.equipmentQualityMax ?? 1,
    equipmentQualityWeights: map.rewardSettings?.equipmentQualityWeights || [],
    foundationFindLimit: map.rewardSettings?.foundationFindLimit ?? 0,
    foundationChance: map.rewardSettings?.foundationChance ?? 0,
    foundationAmount: map.rewardSettings?.foundationAmount ?? 1,
  };
}

function getWanderCultivationAmount(stage, settings = getRewardSettings(stage)) {
  return Math.max(1, Math.round(rollWanderRewardBase('cultivation') * settings.cultivationMultiplier));
}

function getWanderSpiritStoneAmount(stage, settings = getRewardSettings(stage)) {
  return Math.max(1, Math.round(rollWanderRewardBase('spiritStone') * settings.cultivationMultiplier));
}

function rollWanderRewardBase(type) {
  const [min, max] = getWanderRewardBaseRange(type);
  return randomBetween(min, max);
}

function getWanderRewardBaseRange(type) {
  const configured = gameConfig.gameplay?.wanderRewardBase?.[type];
  if (Array.isArray(configured)) {
    const min = Math.max(1, Math.floor(Number(configured[0]) || 1));
    const max = Math.max(min, Math.floor(Number(configured[1]) || min));
    return [min, max];
  }
  const amount = Math.max(1, Math.floor(Number(configured) || 1));
  return [amount, amount];
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
      .slice(0, getWanderChestCapacity())
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
  if (Number.isInteger(chestIndex)) return clamp(chestIndex, 0, getMajorRealmMaxIndex());

  const directIndex = Number(source?.enemyMajorRealmIndex);
  if (Number.isInteger(directIndex)) return clamp(directIndex, 0, getMajorRealmMaxIndex());

  const tier = Number(source?.enemyTier);
  if (Number.isFinite(tier) && tier > 0) return clamp(getTierMajorIndex(tier), 0, getMajorRealmMaxIndex());

  const level = Number(source?.enemyLevel);
  if (source?.enemyData && Number.isFinite(level) && level > 0) {
    return clamp(getTierMajorIndex(level), 0, getMajorRealmMaxIndex());
  }

  const mapId = source?.mapId || source?.id;
  const mapIndex = wanderMapList.findIndex((map) => map.id === mapId);
  if (mapIndex >= 0) return clamp(mapIndex, 0, 25);

  return clamp(Number(playerMajorRealmIndex) || 0, 0, getMajorRealmMaxIndex());
}

function getEquipmentRarityProfile(source = currentStage) {
  const chestTier = getEquipmentChestTier(source);
  const configured = equipmentChestRarityProfiles.find((profile) => Number(profile.chestTier) === chestTier);
  if (configured) {
    const sourceWeights = configured.weights.map((weight) => Math.max(0, Number(weight) || 0));
    let qualityMax = sourceWeights.reduce((last, weight, index) => (weight > 0 ? index + 1 : last), 0);
    qualityMax = clamp(qualityMax || 1, 1, equipmentQualityOrder.length);
    return { qualityMax, weights: sourceWeights };
  }
  return { qualityMax: 1, weights: [100] };
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

  const baseCultivation = rollWanderRewardBase('cultivation');
  const multiplier = getRewardSettings(stage).cultivationMultiplier * getEnemyRewardMultiplier(stage);

  return Math.round(baseCultivation * multiplier);
}

function getEnemyRewardMultiplier(stage = currentStage) {
  const rankLevel = clamp(Math.floor(Number(stage?.enemyRankLevel) || 1), 1, 5);
  return 1 + ((rankLevel - 1) * 0.05);
}

function getEnemyRewardBonusPercent(stage = currentStage) {
  return Math.round((getEnemyRewardMultiplier(stage) - 1) * 100);
}

function getSpiritStoneDropRange(stage = currentStage) {
  const [minBase, maxBase] = getWanderRewardBaseRange('spiritStone');
  const multiplier = getRewardSettings(stage).cultivationMultiplier * getEnemyRewardMultiplier(stage);
  return {
    min: Math.max(1, Math.round(minBase * multiplier)),
    max: Math.max(1, Math.round(maxBase * multiplier)),
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
  const baseDrop = rollWanderRewardBase('spiritStone');
  const multiplier = getRewardSettings(currentStage).cultivationMultiplier * getEnemyRewardMultiplier(currentStage);
  const reward = Math.max(1, Math.round(baseDrop * multiplier));
  const bonus = player?.spiritStoneBonus || 0;
  return Math.round(reward * (1 + bonus));
}

function createEquipmentItem(slotId, level, rarityKey, options = {}) {
  const stats = options.stats || createEquipmentStats(slotId, level, rarityKey);
  const normalizedItemLevel = clamp(Number(level) || 1, 1, maxEquipmentLevel);
  const name = options.name || pickRandom(getEquipmentNamePool(slotId, level));
  return {
    id: equipmentIdSeed++,
    slotId,
    name,
    setName: options.setName || getEquipmentSetName(slotId, name),
    rarityKey,
    level: normalizedItemLevel,
    enhancementLevel: 0,
    stats,
    baseStats: options.baseStats || { ...stats },
    specialLines: options.specialLines ?? createEquipmentSpecialLines(slotId, level, rarityKey),
  };
}

function createEquipmentLikeItem(slotId, level, rarityKey) {
  const stats = createEquipmentStats(slotId, level, rarityKey);
  const normalizedItemLevel = clamp(Number(level) || 1, 1, maxEquipmentLevel);
  const name = pickRandom(getEquipmentNamePool(slotId, level));
  return {
    id: 0,
    slotId,
    name,
    setName: getEquipmentSetName(slotId, name),
    rarityKey,
    level: normalizedItemLevel,
    enhancementLevel: 0,
    stats,
    baseStats: { ...stats },
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

function getEquipmentSetName(slotId, itemName) {
  const names = equipmentTemplates[slotId]?.names || [];
  const itemIndex = names.indexOf(itemName);
  return equipmentSetNames[itemIndex] || '';
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
    const [min, max] = definition.valueRange || [0.01, 0.05];
    const value = roundStat(randomBetween(min, max));
    lines.push({ id: definition.id, name: definition.name, value });
  }

  return lines;
}

function rollEquipmentDrop(outcome) {
  if (outcome !== 'win') return null;

  const settings = getRewardSettings(currentStage);
  const chance = Math.min(1, settings.equipmentDropChance * getEnemyRewardMultiplier(currentStage));
  if (Math.random() > chance) return null;

  const map = getRewardMap(currentStage);
  const chestTier = currentStage?.isWanderGenerated
    ? pickWanderEquipmentChestTier(map)
    : getEquipmentChestTier(currentStage);
  const chest = addEquipmentChest(currentStage, { chestTier });
  renderEquipment();
  renderInventory();
  return chest;
}

function getEquipmentLevelRange(source = currentStage) {
  const chestTier = getEquipmentChestTier(source);
  const min = (chestTier - 1) * equipmentLevelsPerChestTier + 1;
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
  if (Number.isInteger(directIndex)) return clamp(directIndex, 0, getMajorRealmMaxIndex());

  const tier = Number(source?.enemyTier);
  if (Number.isFinite(tier) && tier > 0) return clamp(getTierMajorIndex(tier), 0, getMajorRealmMaxIndex());

  const enemyIndex = Number(source?.enemyMajorRealmIndex);
  if (Number.isInteger(enemyIndex)) return clamp(enemyIndex, 0, getMajorRealmMaxIndex());

  return clamp(Number(playerMajorRealmIndex) || 0, 0, getMajorRealmMaxIndex());
}

function getEquipmentChestTier(source = currentStage) {
  const directTier = Number(source?.chestTier ?? source?.tier);
  if (Number.isInteger(directTier) && directTier > 0) return clamp(directTier, 1, 10);

  const map = source?.mapId && wanderMaps[source.mapId]
    ? wanderMaps[source.mapId]
    : wanderMaps[source?.id];
  if (map) {
    const mapNumber = getWanderMapNumber(map);
    return clamp(Math.ceil(mapNumber / getWanderChestTierStepMaps()), 1, 10);
  }
  const configuredTier = Number(source?.equipmentChestTier);
  if (Number.isInteger(configuredTier) && configuredTier > 0) return clamp(configuredTier, 1, 10);
  return 1;
}

function getEquipmentChestDisplayRarityKey(source = currentStage) {
  const chestTier = clamp(getEquipmentChestTier(source), 1, equipmentQualityOrder.length);
  return equipmentQualityOrder[chestTier - 1] || equipmentQualityOrder[0] || 'common';
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
    rarityProfile: options.rarityProfile || getEquipmentRarityProfile({ chestTier }),
    count: 1,
  };
  equipmentChestInventory.unshift(chest);
  return chest;
}

function getShopItemQuantityLimit(shopItem) {
  if (shopItem?.type === 'talentTreasureChest') return 1;
  const dailyLimit = getDailyShopPurchaseLimit(shopItem);
  if (dailyLimit <= 0) return maxShopPurchaseQuantity;
  return Math.max(1, Math.min(maxShopPurchaseQuantity, getRemainingShopPurchases(shopItem)));
}

function getShopPurchaseTotal(shopItem, quantity = 1) {
  const count = clamp(Math.floor(Number(quantity) || 1), 1, getShopItemQuantityLimit(shopItem));
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    if (shopItem.type === 'cultivation') {
      const baseCost = Math.max(1, Number(shopItem.cost) || 1);
      const priceStep = Math.max(0, Number(shopItem.priceStep) || 0);
      const purchases = Math.max(0, Number(cultivationPillPurchases[shopItem.id]) || 0);
      total += baseCost + priceStep * (purchases + index);
    } else if (shopItem.type === 'enhancementStone') {
      const baseCost = Math.max(1, Number(shopItem.cost) || 50);
      const priceStep = Math.max(0, Number(shopItem.priceStep) || 5);
      const purchaseCount = getDailyShopPurchaseCount(shopItem);
      total += baseCost + priceStep * (purchaseCount + index);
    } else if (shopItem.type === 'potion') {
      const baseCost = Math.max(1, Number(shopItem.cost) || 5);
      const priceStep = Math.max(1, Number(shopItem.priceStep) || 5);
      const purchaseCount = getDailyShopPurchaseCount(shopItem);
      const increaseEvery = Math.max(1, Number(shopItem.priceIncreaseEvery) || 5);
      total += baseCost + Math.floor((purchaseCount + index) / increaseEvery) * priceStep;
    } else if (isBreakthroughPillShopItem(shopItem)) {
      const baseCost = Math.max(1, Number(shopItem.cost) || 1);
      const purchaseCount = Math.max(0, Number(ascensionPillPurchases[shopItem.id]) || 0);
      const priceStep = Math.max(0, Number(shopItem.priceStep) || 0);
      total += baseCost + priceStep * (purchaseCount + index);
    } else if (shopItem.type === 'skillBook') {
      const baseCost = Math.max(1, Number(shopItem.cost) || 1);
      const multiplier = Math.max(0.01, Number(shopItem.priceMultiplier) || 1);
      total += Math.max(1, Math.round(baseCost * multiplier));
    } else {
      total += Math.max(1, Number(shopItem.cost) || 1);
    }
  }
  return Math.max(1, Math.round(total));
}

function buyShopItem(itemId, amount = 1) {
  if (busy) return;

  const shopItem = shopItems.find((item) => item.id === itemId);
  if (!shopItem) return;
  const dailyLimit = getDailyShopPurchaseLimit(shopItem);
  if (dailyLimit > 0 && getRemainingShopPurchases(shopItem) <= 0) {
    setShopMessage(`Đã đạt giới hạn ${dailyLimit} lần mua ${shopItem.name} hôm nay.`);
    renderShop();
    return;
  }
  if (!canBuyShopItem(shopItem)) return;
  let requested = clamp(Math.floor(Number(amount) || 1), 1, getShopItemQuantityLimit(shopItem));
  if (dailyLimit > 0) {
    requested = Math.min(requested, getRemainingShopPurchases(shopItem));
  }
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

    if (shopItem.type === 'enhancementStone') {
      enhancementStones += Math.max(1, Number(shopItem.amount) || 1);
    }

    if (['cultivation', 'foundation', 'ascension', 'minorAscension', 'skillChest', 'petChest', 'talentTreasureChest', 'majorAscensionTreasure', 'enhancementRefund'].includes(shopItem.type)) {
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

    if (isBreakthroughPillShopItem(shopItem)) {
      ascensionPillPurchases[shopItem.id] = (ascensionPillPurchases[shopItem.id] || 0) + 1;
    }
    if (shopItem.type === 'talentTreasureChest') {
      majorAscensionTreasureChestPurchases[playerMajorRealmIndex] = getMajorAscensionTreasureChestPurchaseCount(shopItem) + 1;
    }
    if (dailyLimit > 0 || ['enhancementStone', 'potion'].includes(shopItem.type)) {
      recordShopItemPurchase(shopItem);
    }
    purchased += 1;
  }

  if (!purchased) return;
  enforceEquipmentInventoryLimit();
  const suffix = purchased > 1 ? ` x${purchased}` : '';
  if (shopItem.type === 'cultivation' || shopItem.type === 'foundation' || isBreakthroughPillShopItem(shopItem)) {
    setShopMessage(`Đã mua ${shopItem.name}${suffix}, đã chuyển vào Túi đồ.`);
  } else if (shopItem.type === 'equipment' || shopItem.type === 'equipmentRandom') {
    setShopMessage(`Đã mua${suffix}: ${lastItem ? `${getRarityName(lastItem)} ${lastItem.name}` : shopItem.name}.`);
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
  if (getDailyShopPurchaseLimit(shopItem) > 0 && getRemainingShopPurchases(shopItem) <= 0) return false;
  if (shopItem.requiredLevel && playerLevel < shopItem.requiredLevel) return false;
  if (shopItem.type === 'skillBook' && (
    shopItem.schoolId !== playerSchoolId
    || getPlayerCultivationTier() < getShopSkillRequiredTier(shopItem)
    || getSkillLevel(shopItem.skillId) >= getSkillMaxLevel()
  )) return false;
  if (shopItem.type === 'skillChest' && !getSkillChestSkills(shopItem).length) return false;
  if (shopItem.type === 'skillChest'
    && getPlayerCultivationTier() < Math.max(1, Number(shopItem.requiredTier) || 1)) return false;
  if (Number.isInteger(shopItem.requiredMajorRealmIndex)
    && playerMajorRealmIndex < shopItem.requiredMajorRealmIndex) return false;
  if (shopItem.type === 'minorAscension'
    && Number.isInteger(shopItem.requiredMajorRealmIndex)
    && playerMajorRealmIndex !== shopItem.requiredMajorRealmIndex) return false;
  if (shopItem.requiredMapId && !isWanderMapUnlocked(wanderMaps[shopItem.requiredMapId])) return false;
  if (shopItem.type === 'foundation' && !canBuyFoundationPill(shopItem)) return false;
  if (shopItem.type === 'talentTreasureChest' && !canBuyMajorAscensionTreasureChest(shopItem)) return false;
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
  if (isBreakthroughPillShopItem(shopItem)) {
    const baseCost = Math.max(1, Number(shopItem.cost) || 1);
    const purchaseCount = Math.max(0, Number(ascensionPillPurchases[shopItem.id]) || 0);
    const priceStep = Math.max(0, Number(shopItem.priceStep) || 0);
    return Math.max(1, Math.round(baseCost + priceStep * purchaseCount));
  }
  if (shopItem.type === 'enhancementStone') {
    const baseCost = Math.max(1, Number(shopItem.cost) || 50);
    const priceStep = Math.max(0, Number(shopItem.priceStep) || 5);
    const purchaseCount = getDailyShopPurchaseCount(shopItem);
    return Math.max(1, Math.round(baseCost + priceStep * purchaseCount));
  }
  if (shopItem.type === 'potion') {
    const baseCost = Math.max(1, Number(shopItem.cost) || 5);
    const priceStep = Math.max(1, Number(shopItem.priceStep) || 5);
    const purchaseCount = getDailyShopPurchaseCount(shopItem);
    const increaseEvery = Math.max(1, Number(shopItem.priceIncreaseEvery) || 5);
    return baseCost + Math.floor(purchaseCount / increaseEvery) * priceStep;
  }
  const baseCost = Math.max(1, Number(shopItem.cost) || 1);
  const multiplier = shopItem.type === 'skillBook'
    ? Math.max(0.01, Number(shopItem.priceMultiplier) || 1)
    : 1;
  return Math.max(1, Math.round(baseCost * multiplier));
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

function getMajorAscensionTreasureChestPurchaseCount(shopItem) {
  if (shopItem?.type !== 'talentTreasureChest') return 0;
  return Math.max(0, Math.floor(Number(majorAscensionTreasureChestPurchases[playerMajorRealmIndex]) || 0));
}

function canBuyMajorAscensionTreasureChest(shopItem) {
  if (shopItem?.type !== 'talentTreasureChest') return true;
  const requiredLevel = Math.max(1, Number(shopItem.requiredMinorRealmLevel) || getMinorRealmLevelCap());
  const limit = Math.max(1, Number(shopItem.maxPurchasesPerMajorRealm) || 1);
  return playerLevel >= requiredLevel && getMajorAscensionTreasureChestPurchaseCount(shopItem) < limit;
}

function normalizeShopInventoryCounts(counts = {}) {
  return Object.fromEntries(Object.entries(counts || {}).map(([itemId, count]) => [
    itemId,
    Math.max(0, Math.floor(Number(count) || 0)),
  ]));
}

function getMajorAscensionTreasureDefinition(targetMajorRealmIndex) {
  const index = clamp(Math.floor(Number(targetMajorRealmIndex) || 0), 0, Math.max(0, cultivationProgression.length - 1));
  const realm = cultivationProgression[index];
  if (!realm) return null;
  const idPrefix = String(majorAscensionTreasureConfig.idPrefix || 'majorAscensionTreasure');
  return shopItems.find((item) => item.id === `${idPrefix}${realm.id}` && item.type === 'majorAscensionTreasure') || null;
}

function getMajorAscensionTreasurePower(targetMajorRealmIndex) {
  return Math.max(0, Number(cultivationPowerTable?.realms?.[targetMajorRealmIndex]?.majorRealmPower) || 0);
}

function rollTalentTreasureAllocation() {
  const config = majorAscensionTreasureConfig || {};
  const caps = {
    maxHp: clamp(Math.floor(Number(config.maxHpPercent) || 50), 1, 98),
    attack: clamp(Math.floor(Number(config.maxAttackPercent) || 50), 1, 98),
    mastery: clamp(Math.floor(Number(config.maxMasteryPercent) || 50), 1, 98),
    defense: clamp(Math.floor(Number(config.maxDefensePercent) || 20), 1, 98),
  };
  const minimums = {
    maxHp: clamp(Math.floor(Number(config.minHpPercent) || 10), 1, caps.maxHp),
    attack: clamp(Math.floor(Number(config.minAttackPercent) || 10), 1, caps.attack),
    mastery: clamp(Math.floor(Number(config.minMasteryPercent) || 10), 1, caps.mastery),
    defense: clamp(Math.floor(Number(config.minDefensePercent) || 5), 1, caps.defense),
  };
  const manaMinPercent = clamp(
    Math.floor(Number(config.minManaPercent ?? config.fixedManaPercent) || 1),
    1,
    98,
  );
  const manaMaxPercent = clamp(
    Math.floor(Number(config.maxManaPercent ?? config.fixedManaPercent) || 3),
    manaMinPercent,
    98,
  );
  const manaPercent = manaMinPercent + Math.floor(Math.random() * (manaMaxPercent - manaMinPercent + 1));
  const allocation = { ...minimums, maxMana: manaPercent };
  let remaining = 100 - manaPercent - Object.values(minimums).reduce((total, value) => total + value, 0);
  const keys = Object.keys(caps);
  while (remaining > 0) {
    const available = keys.filter((key) => allocation[key] < caps[key]);
    if (!available.length) break;
    const key = available[Math.floor(Math.random() * available.length)];
    const room = caps[key] - allocation[key];
    const amount = Math.min(room, 1 + Math.floor(Math.random() * Math.min(room, remaining)));
    allocation[key] += amount;
    remaining -= amount;
  }
  if (remaining > 0) allocation.attack += remaining;
  return allocation;
}

function rollTalentTreasureStats(targetMajorRealmIndex) {
  const combatPower = getMajorAscensionTreasurePower(targetMajorRealmIndex);
  const allocation = rollTalentTreasureAllocation();
  const statBonuses = {};
  Object.entries(allocation).forEach(([stat, percent]) => {
    const powerPerPoint = Number(combatStatDefinitions.find((item) => item.id === stat)?.powerPerPoint) || 0;
    statBonuses[stat] = powerPerPoint
      ? Math.max(0, Math.round((combatPower * percent / 100) / powerPerPoint))
      : 0;
  });
  const realizedCombatPower = Object.entries(statBonuses).reduce((total, [stat, amount]) => (
    total + amount * (Number(combatStatDefinitions.find((item) => item.id === stat)?.powerPerPoint) || 0)
  ), 0);
  return { combatPower, realizedCombatPower, allocation, statBonuses };
}

function normalizeTalentTreasureInventory(items = []) {
  return (Array.isArray(items) ? items : []).map((item, index) => {
    const targetMajorRealmIndex = clamp(
      Math.floor(Number(item?.targetMajorRealmIndex) || 0),
      0,
      Math.max(0, cultivationProgression.length - 1),
    );
    const definition = getMajorAscensionTreasureDefinition(targetMajorRealmIndex);
    if (!definition || !item || typeof item !== 'object') return null;
    const statBonuses = Object.fromEntries(['maxHp', 'attack', 'mastery', 'defense', 'maxMana'].map((stat) => [
      stat,
      Math.max(0, Math.round(Number(item.statBonuses?.[stat]) || 0)),
    ]));
    const allocation = Object.fromEntries(['maxHp', 'attack', 'mastery', 'defense', 'maxMana'].map((stat) => [
      stat,
      Math.max(0, Math.floor(Number(item.allocation?.[stat]) || 0)),
    ]));
    const normalized = {
      id: String(item.id || `talentTreasure-${index + 1}`),
      shopItemId: definition.id,
      targetMajorRealmIndex,
      combatPower: Math.max(0, Math.round(Number(item.combatPower) || getMajorAscensionTreasurePower(targetMajorRealmIndex))),
      realizedCombatPower: Math.max(0, Number(item.realizedCombatPower) || 0),
      allocation,
      statBonuses,
    };
    const talentStat = getTalentTreasurePrimaryStat(normalized);
    return {
      ...normalized,
      talentStat,
      name: getTalentTreasureName({ ...normalized, talentStat }),
    };
  }).filter(Boolean);
}

function createTalentTreasureItem(targetMajorRealmIndex) {
  const definition = getMajorAscensionTreasureDefinition(targetMajorRealmIndex);
  if (!definition) return null;
  const item = {
    id: `talentTreasure-${talentTreasureIdSeed++}`,
    shopItemId: definition.id,
    targetMajorRealmIndex,
    ...rollTalentTreasureStats(targetMajorRealmIndex),
  };
  item.talentStat = getTalentTreasurePrimaryStat(item);
  item.name = getTalentTreasureName(item);
  talentTreasureInventory.unshift(item);
  return item;
}

function getTalentTreasureStatEntries(item) {
  return Object.entries(item?.statBonuses || {})
    .filter(([, amount]) => Number(amount) > 0)
    .map(([stat, amount]) => ({ stat, amount }));
}

function getTalentTreasureIconMarkup(item, extraClass = '') {
  const iconClass = getTalentTreasureIconClass(item);
  return `<i class="talent-icon ${iconClass} breakthrough-treasure-icon ${extraClass}" aria-hidden="true"></i>`;
}

function formatTalentTreasureStats(item) {
  return getTalentTreasureStatEntries(item)
    .map(({ stat, amount }) => `${getStatLabel(stat)} +${formatGameNumber(amount)}`)
    .join(' · ');
}

function getShopInventoryCount(itemId) {
  return Math.max(0, Math.floor(Number(shopInventoryCounts[itemId]) || 0));
}

function addShopInventoryItem(itemId, amount = 1) {
  shopInventoryCounts[itemId] = getShopInventoryCount(itemId) + Math.max(0, Math.floor(Number(amount) || 0));
}

function setShopMessage(message) {
  setPanelMessage('shopMessage', message);
  showGameToast(message, /^(Không|Chưa|Đã đạt giới hạn)/.test(message) ? 'error' : 'success');
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

function exchangePotions(direction, amount = 1) {
  if (busy) return false;

  const exchangeCost = 6;
  const requestedExchanges = Math.max(1, Math.floor(Number(amount) || 1));
  if (direction === 'healthToMana') {
    const availableExchanges = Math.floor(healthPotionCount / exchangeCost);
    const exchanges = Math.min(requestedExchanges, availableExchanges);
    if (exchanges <= 0) {
      showGameToast('Cần 6 Sinh Huyết Đan để đổi.', 'error');
      return false;
    }
    healthPotionCount -= exchanges * exchangeCost;
    manaPotionCount += exchanges;
    showGameToast('Đã đổi ' + (exchanges * exchangeCost) + ' Sinh Huyết Đan thành ' + exchanges + ' Tụ Linh Đan.', 'success');
  } else if (direction === 'manaToHealth') {
    const availableExchanges = Math.floor(manaPotionCount / exchangeCost);
    const exchanges = Math.min(requestedExchanges, availableExchanges);
    if (exchanges <= 0) {
      showGameToast('Cần 6 Tụ Linh Đan để đổi.', 'error');
      return false;
    }
    manaPotionCount -= exchanges * exchangeCost;
    healthPotionCount += exchanges;
    showGameToast('Đã đổi ' + (exchanges * exchangeCost) + ' Tụ Linh Đan thành ' + exchanges + ' Sinh Huyết Đan.', 'success');
  } else {
    return false;
  }

  renderCultivation();
  renderInventory();
  saveGame();
  return true;
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
  if (playerCultivation >= getCultivationRequiredForNextLevel()
    && dantianCultivation >= getDantianCultivationCap()) return 0;
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
  const previousPower = getEquipmentPower();
  inventory.splice(index, 1);
  const oldItem = equippedItems[item.slotId];
  if (oldItem) inventory.unshift(oldItem);
  equippedItems[item.slotId] = item;
  enforceEquipmentInventoryLimit();
  equipmentEquipCounts[item.rarityKey] = (equipmentEquipCounts[item.rarityKey] || 0) + 1;
  refreshPlayerAfterEquipmentChange();
  showEquipmentChangeToast(`Đã mặc ${getRarityName(item)} ${item.name}`, getEquipmentPower() - previousPower);
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

  const previousPower = getEquipmentPower();
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
      .filter((item) => item.slotId === slot.id)
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
  showEquipmentChangeToast('Đã mặc nhanh bộ trang bị', getEquipmentPower() - previousPower);
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
  fighter.maxHp = Math.max(1, Math.round(fighter.maxHp * (1 + getSpecial('maxHpPercent'))));
  fighter.maxMana = Math.max(0, Math.round(fighter.maxMana * (1 + getSpecial('maxManaPercent'))));
  fighter.attack = Math.max(1, Math.round(fighter.attack * (1 + getSpecial('attackPercent'))));
  fighter.defense = Math.max(0, Math.round(fighter.defense * (1 + getSpecial('defensePercent'))));

  fighter.lifeSteal = clamp(fighter.lifeSteal, 0, 0.35);
  fighter.armorPierce = clamp(fighter.armorPierce, 0, 0.55);
  fighter.damageReduction = clamp(fighter.damageReduction, 0, 0.9);
  fighter.dodgeRate = clamp(fighter.dodgeRate, 0, 0.45);
  fighter.critDamage = Math.max(1.5, fighter.critDamage);
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

function getBattleSkillFrameMeta(skillId) {
  const spritePath = playerSkillEffectSprites[skillId] || enemySkillEffectSpritePath;
  const isPremiumSkillEffect = spritePath.includes('-premium.png');
  return {
    spritePath,
    frameCount: isPremiumSkillEffect ? 16 : 12,
    rowCount: isPremiumSkillEffect ? 4 : 3,
  };
}

function getBattleSkillAnimationDuration(skillId) {
  const { frameCount } = getBattleSkillFrameMeta(skillId);
  return frameCount * (1000 / battleSkillAnimationFps);
}

function getBattleSkillSequenceDuration(result) {
  if (!result?.skill) return 0;
  const primaryDuration = getBattleSkillAnimationDuration(result.skillId);
  const followupDuration = result.bonusHit
    ? getBattleSkillAnimationDuration(result.bonusHit.skillId || result.skillId)
    : 0;
  return primaryDuration + followupDuration;
}

function getBattleActionDelay(result, baseDelay) {
  if (!result?.skill) return baseDelay;
  return Math.max(
    baseDelay,
    getBattleSkillSequenceDuration(result) + battleSkillTurnBuffer,
  );
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

  if (result.skill) {
    spawnFloat($(sourceId).querySelector('.float-layer'), result.skillName || attacker.skillName, 'skill-name');
    playBattleSkillEffect(target, result.skillId);
  }
  const text = result.dodged ? 'NÉ' : result.blocked ? `ĐỠ -${formatGameNumber(result.damage)}` : result.critical ? `BẠO -${formatGameNumber(result.damage)}!` : `-${formatGameNumber(result.damage)}`;
  const damageClass = result.dodged ? 'dodge' : result.blocked ? 'block' : result.critical ? 'crit' : result.skill ? 'skill' : '';
  const showDamageFloat = () => spawnFloat($(floatId), text, damageClass);
  if (result.skill) {
    window.setTimeout(
      showDamageFloat,
      getBattleSkillAnimationDuration(result.skillId) * battleSkillImpactRatio,
    );
  } else {
    showDamageFloat();
  }
  if (result.heal > 0) spawnFloat($(sourceId).querySelector('.float-layer'), `+${formatGameNumber(result.heal)}`, 'heal');
}

function playBattleSkillEffect(target, skillId) {
  const panel = $('battlePanel');
  const effect = $('battleSkillEffect');
  if (!panel || !effect || !target || panel.classList.contains('is-hidden')) return;

  const panelRect = panel.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const size = Math.min(190, Math.max(130, targetRect.width * 0.72));
  const left = targetRect.left - panelRect.left + (targetRect.width - size) / 2;
  const top = targetRect.top - panelRect.top + targetRect.height * 0.08;
  const { spritePath, frameCount, rowCount } = getBattleSkillFrameMeta(skillId);

  window.clearTimeout(effect.hideTimer);
  const animationToken = (effect.animationToken || 0) + 1;
  effect.animationToken = animationToken;
  effect.style.width = `${size}px`;
  effect.style.left = `${left}px`;
  effect.style.top = `${top}px`;
  effect.style.backgroundImage = `url("${spritePath}")`;
  effect.style.backgroundSize = `400% ${rowCount * 100}%`;
  effect.style.backgroundPosition = '0% 0%';
  const frameDuration = 1000 / battleSkillAnimationFps;
  const animationDuration = getBattleSkillAnimationDuration(skillId);
  effect.style.animationDuration = `${animationDuration}ms`;
  effect.classList.remove('is-hidden', 'is-playing');
  void effect.offsetWidth;
  effect.classList.add('is-playing');
  for (let frame = 0; frame < frameCount; frame += 1) {
    window.setTimeout(() => {
      if (effect.animationToken !== animationToken) return;
      const column = frame % 4;
      const row = Math.floor(frame / 4);
      effect.style.backgroundPosition = `${column * (100 / 3)}% ${row * (100 / (rowCount - 1))}%`;
    }, frame * frameDuration);
  }
  effect.hideTimer = window.setTimeout(() => {
    if (effect.animationToken !== animationToken) return;
    effect.classList.remove('is-playing');
    effect.classList.add('is-hidden');
  }, animationDuration);
}

function spawnFloat(parent, text, className) {
  const el = document.createElement('div');
  el.className = `float-text ${className}`;
  if (className === 'skill-name') {
    const label = document.createElement('span');
    label.textContent = text;
    el.appendChild(label);
  } else {
    el.textContent = text;
  }
  parent.appendChild(el);
  window.setTimeout(() => el.remove(), 800);
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
    const enemyData = currentStage?.enemyData || {};
    const visual = getEnemyVisualStyle(enemyData);
    enemyAvatar.classList.add('chibi-enemy', getEnemyVisualClass(enemyData));
    enemyAvatar.style.backgroundImage = visual.image ? `url("${visual.image}")` : 'none';
    enemyAvatar.style.backgroundPosition = visual.position;
    enemyAvatar.style.backgroundSize = visual.size;
  }
}

function getEquipmentEnhancementQualityMax(item) {
  const configured = progressionFeatures.enhancement.maxLevelByRarity?.[item.rarityKey];
  return Math.max(1, Number(configured) || 30);
}

function getEquipmentEnhancementMax(item) {
  return getEquipmentEnhancementQualityMax(item);
}

function getEnhancementCost(item) {
  const config = progressionFeatures.enhancement;
  const rarityMultiplier = Number(config.linhThachRarityMultiplier?.[item.rarityKey]) || 1;
  const targetLevel = Math.max(1, Math.floor(Number(item.enhancementLevel) || 0) + 1);
  const stoneCost = getEnhancementStoneCost(item, targetLevel);
  const baseCostPerStone = Math.max(0, Number(config.spiritStoneBaseCostPerStone) || 50);
  const costIncreasePerLevel = Math.max(0, Number(config.spiritStoneCostIncreasePerLevel) || 15);
  const costPerStone = baseCostPerStone + Math.max(0, targetLevel - 1) * costIncreasePerLevel;
  return Math.max(1, Math.round(costPerStone * stoneCost * rarityMultiplier));
}

function getEnhancementStatGrowth(stat) {
  const configured = progressionFeatures.enhancement.statGrowth || {};
  if (stat === 'critDamage') return Number(configured.critDamage) || 0.02;
  if (['maxHp', 'maxMana', 'attack', 'defense', 'mastery'].includes(stat)) {
    return Number(configured.coreMultiplier) || 0.1;
  }
  return Number(configured.normalMultiplier) || 0.002;
}

function getEquipmentEnhancementRarityMultiplier(item) {
  const configured = progressionFeatures.enhancement.enhancementStatRarityMultiplier?.[item?.rarityKey];
  if (Number.isFinite(Number(configured))) return Math.max(1, Number(configured));
  const rarityIndex = equipmentQualityOrder.indexOf(item?.rarityKey);
  return 1.5 + Math.max(0, rarityIndex) * 0.5;
}

function getEnhancedStatValue(stat, baseValue, targetLevel, rarityMultiplier = 1) {
  const base = Math.max(0, Number(baseValue) || 0);
  const level = Math.max(0, Math.floor(Number(targetLevel) || 0));
  const baseMultiplier = Math.max(1, Number(progressionFeatures.enhancement.statGrowth?.baseMultiplier) || 1);
  const growth = getEnhancementStatGrowth(stat) * Math.max(1, Number(rarityMultiplier) || 1);
  if (isPercentStat(stat)) return roundStat(base + growth * level);
  return Math.max(1, Math.round(base * (baseMultiplier + growth * level)));
}

function getEnhancedEquipmentStats(item, targetLevel = Number(item?.enhancementLevel) || 0) {
  const baseStats = getBaseEquipmentStats(item);
  const rarityMultiplier = getEquipmentEnhancementRarityMultiplier(item);
  return Object.fromEntries(Object.entries(baseStats).map(([stat, value]) => [
    stat,
    getEnhancedStatValue(stat, value, targetLevel, rarityMultiplier),
  ]));
}

function getBaseEquipmentStats(item) {
  const storedBase = item?.baseStats && typeof item.baseStats === 'object'
    ? normalizeCombatStatObject(item.baseStats)
    : null;
  if (storedBase && Object.keys(storedBase).length) return storedBase;

  const levels = Math.max(0, Math.floor(Number(item?.enhancementLevel) || 0));
  const stats = normalizeCombatStatObject(item?.stats);
  for (let level = 0; level < levels; level += 1) {
    Object.entries(stats).forEach(([stat, value]) => {
      const growth = getEnhancementStatGrowth(stat);
      stats[stat] = isPercentStat(stat)
        ? roundStat(Number(value) - growth)
        : Math.max(1, Math.round(Number(value) / (1 + growth)));
    });
  }
  return stats;
}

function formatEnhancementStats(item) {
  const baseStats = getBaseEquipmentStats(item);
  return Object.entries(item.stats || {})
    .filter(([, value]) => Number(value) !== 0)
    .map(([stat, value]) => {
      const icon = getStatIconClass(stat);
      const iconType = icon.startsWith('icon-unique-') ? 'unique-icon' : 'stat-icon';
      const baseValue = Number(baseStats[stat]) || 0;
      const addedValue = Math.max(0, Number(value) - baseValue);
      const formatValue = (amount) => isPercentStat(stat) ? toPercent(amount) : formatGameNumber(amount);
      return `<span class="enhancement-stat-line" title="${getStatLabel(stat)}"><i class="${iconType} ${icon}" aria-hidden="true"></i><b>+${formatValue(baseValue)}</b>${addedValue > 0 ? `<small>+${formatValue(addedValue)}</small>` : ''}</span>`;
    })
    .join('');
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
  const item = Object.values(equippedItems).find((entry) => entry?.id === selectedEnhancementItemId);
  if (!item) {
    hideEnhancementDetail();
    return;
  }

  const qualityMax = getEquipmentEnhancementQualityMax(item);
  const currentLevel = Math.max(0, Math.floor(Number(item.enhancementLevel) || 0));
  const enhancementColor = getEnhancementLevelColor(currentLevel);
  const equipmentStyle = `--enhancement-level-color: ${enhancementColor}; --equipment-level-color: ${getEquipmentLevelColor(item)}; --rarity-color: ${getEquipmentRarityColor(item)};`;
  enhancementDetailOverlay.innerHTML = `
    <div class="wander-event-modal shop-detail-modal enhancement-detail-modal" role="dialog" aria-modal="true" aria-label="Chi tiết cường hóa">
      <button type="button" class="icon-button shop-detail-close enhancement-detail-close" title="Đóng" aria-label="Đóng"><i class="unique-icon icon-unique-close" aria-hidden="true"></i></button>
      <span><i class="game-icon icon-hammer" aria-hidden="true"></i>Chi tiết cường hóa</span>
      <strong class="enhancement-detail-resource" id="enhancementStoneText">Linh thạch: ${formatGameNumber(playerSpiritStones)} | Đá cường hóa: ${formatGameNumber(enhancementStones)}</strong>
      <div class="feature-list enhancement-detail-list" id="enhancementList"></div>
    </div>
  `;
  enhancementDetailOverlay.classList.remove('is-hidden');
  enhancementDetailOverlay.querySelector('.enhancement-detail-close')?.addEventListener('click', hideEnhancementDetail);
  enhancementDetailOverlay.onclick = (event) => {
    if (event.target === enhancementDetailOverlay) hideEnhancementDetail();
  };

  const list = $('enhancementList');
  list.innerHTML = `<div class="feature-item enhancement-equipment-item ${rarityData[item.rarityKey].className}" style="${equipmentStyle}">${getEnhancementItemMarkup(item)}</div>`;
}

function getEnhancementItemMarkup(item) {
  const qualityMax = getEquipmentEnhancementQualityMax(item);
  const maxLevel = getEquipmentEnhancementMax(item);
  const currentLevel = Math.max(0, Math.floor(Number(item.enhancementLevel) || 0));
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
  const refundCount = getShopInventoryCount('enhancementRefund');
  const refundTotal = getEnhancementRefundAmount(item);
  const canRefund = currentLevel > 0 && refundCount > 0;
  const refundDisabledReason = currentLevel <= 0
    ? 'Trang bị chưa có cấp cường hóa để hoàn.'
    : refundCount <= 0
    ? 'Cần Đá Hoàn Nguyên trong túi.'
    : '';
  return `
    ${renderEquippedEquipmentSummary(item, getSlotName(item.slotId), { showStats: false, showSpecials: false })}
    <div class="enhancement-stat-list">${formatEnhancementStats(item)}</div>
    <div class="enhancement-cost-grid">
      <span><i class="item-icon icon-item-enhancement-stone" aria-hidden="true"></i><b>${formatGameNumber(stoneCost)}</b> đá</span>
      <span><i class="game-icon icon-hammer" aria-hidden="true"></i><b>+${formatGameNumber(currentLevel)}/${formatGameNumber(qualityMax)}</b></span>
      <span><i class="unique-icon icon-unique-spirit-stone" aria-hidden="true"></i><b>${formatGameNumber(cost)}</b></span>
      <span><i class="stat-icon icon-stat-reward" aria-hidden="true"></i><b>${toPercent(successRate)}</b></span>
    </div>
    <button type="button" class="secondary compact enhancement-action-button" data-enhance-item="${item.id}" ${buttonDisabledAttributes(!canEnhance, maxed ? 'Trang bị đã đạt cấp độ tối đa.' : cultivationLocked ? `Tu vi chỉ mở đến +${maxLevel}.` : stoneCost && enhancementStones < stoneCost ? `Cần ${formatGameNumber(stoneCost)} đá cường hóa.` : `Cần ${formatGameNumber(cost)} linh thạch.`)}>
      <i class="game-icon icon-hammer" aria-hidden="true"></i>${maxed ? 'Đã đạt cấp độ tối đa' : cultivationLocked ? `Tu vi chỉ mở đến +${maxLevel}` : canEnhance ? `Cường hóa lên +${targetLevel}` : stoneCost && enhancementStones < stoneCost ? `Cần ${formatGameNumber(stoneCost)} đá cường hóa` : `Cần ${formatGameNumber(cost)} linh thạch`}
    </button>
    <button type="button" class="secondary compact enhancement-refund-button" data-refund-enhancement="${item.id}" ${buttonDisabledAttributes(!canRefund, refundDisabledReason)}>
      Hoàn đá${currentLevel > 0 ? ` +${formatGameNumber(refundTotal)}` : ''}
    </button>
  `;
}

function hideEnhancementDetail() {
  selectedEnhancementItemId = 0;
  enhancementDetailOverlay.classList.add('is-hidden');
  enhancementDetailOverlay.innerHTML = '';
  enhancementDetailOverlay.onclick = null;
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
    showGameToast(`Cường hóa thất bại: ${item.name} ở cấp +${targetLevel}.`, 'error');
    renderEnhancement();
    renderCultivation();
    saveGame();
    return;
  }
  playerSpiritStones -= cost;
  item.enhancementLevel = currentLevel + 1;
  item.stats = getEnhancedEquipmentStats(item, item.enhancementLevel);
  showGameToast(`Cường hóa thành công: ${item.name} lên +${item.enhancementLevel}.`, 'success');
  renderEnhancement();
  renderEquipment();
  renderCultivation();
  saveGame();
}

function getEnhancementRefundAmount(item) {
  const currentLevel = Math.max(0, Math.floor(Number(item?.enhancementLevel) || 0));
  let total = 0;
  for (let level = 1; level <= currentLevel; level += 1) {
    total += getEnhancementStoneCost(item, level);
  }
  return total;
}

function refundEquipmentEnhancement(itemId) {
  if (busy) return;
  const item = Object.values(equippedItems).find((entry) => entry?.id === Number(itemId));
  if (!item) return;
  const currentLevel = Math.max(0, Math.floor(Number(item.enhancementLevel) || 0));
  if (currentLevel <= 0) {
    showGameToast('Trang bị chưa có cấp cường hóa để hoàn.', 'info');
    return;
  }
  if (getShopInventoryCount('enhancementRefund') <= 0) {
    showGameToast('Cần Đá Hoàn Nguyên trong túi.', 'error');
    return;
  }

  const refundAmount = getEnhancementRefundAmount(item);
  if (!window.confirm(`Dùng 1 Đá Hoàn Nguyên để đưa ${item.name} từ +${currentLevel} về +0 và nhận lại ${formatGameNumber(refundAmount)} đá cường hóa?`)) return;

  shopInventoryCounts.enhancementRefund = getShopInventoryCount('enhancementRefund') - 1;
  enhancementStones += refundAmount;
  item.enhancementLevel = 0;
  item.stats = { ...getBaseEquipmentStats(item) };
  const message = `Đã hoàn lại đá cường hóa: ${item.name} nhận ${formatGameNumber(refundAmount)} đá.`;
  showGameToast(message, 'success');
  renderEnhancement();
  renderEquipment();
  renderCultivation();
  renderInventory();
  renderShop();
  saveGame();
}

function getPreviewReward(stage, outcome) {
  return calculateCultivationReward(stage, outcome);
}

function renderFighter(prefix, fighter) {
  $(`${prefix}NameText`).textContent = fighter.name;
  $(`${prefix}RealmText`).textContent = `${fighter.realm} ${fighter.minorRealm}`;
  const hudName = $(`${prefix}HudName`);
  const hudRealm = $(`${prefix}HudRealm`);
  if (hudName) hudName.textContent = fighter.name;
  if (hudRealm) hudRealm.textContent = `${fighter.realm} ${fighter.minorRealm}`;
  $(`${prefix}HpText`).textContent = `${Math.ceil(fighter.hp)}/${fighter.maxHp}`;
  $(`${prefix}ManaText`).textContent = `${Math.floor(fighter.mana)}/${fighter.maxMana}`;
  $(`${prefix}HpBar`).style.width = `${(fighter.hp / fighter.maxHp) * 100}%`;
  $(`${prefix}ManaBar`).style.width = `${(fighter.mana / fighter.maxMana) * 100}%`;
  renderSkillStatus(prefix, fighter);
  $(`${prefix}Stats`).innerHTML = `
    <strong class="combat-power">Lực chiến ${formatGameNumber(Number.isFinite(Number(fighter.displayCombatPower)) ? fighter.displayCombatPower : (Number.isFinite(Number(fighter.combatPower)) ? fighter.combatPower : getCombatPower(fighter)))}</strong>
    <span><i class="stat-icon icon-stat-attack" aria-hidden="true"></i>Công <b>${fighter.attack}</b></span>
    <span><i class="unique-icon icon-unique-defense" aria-hidden="true"></i>Thủ <b>${fighter.defense}</b></span>
    <span><i class="stat-icon icon-stat-mastery" aria-hidden="true"></i>Tinh thông <b>${Math.round(fighter.mastery)}</b></span>
    <span><i class="stat-icon icon-stat-dodge" aria-hidden="true"></i>Né <b>${toPercent(fighter.dodgeRate)}</b></span>
    <span><i class="unique-icon icon-unique-block" aria-hidden="true"></i>Đỡ <b>${toPercent(fighter.blockRate)}</b></span>
    <span><i class="stat-icon icon-stat-crit" aria-hidden="true"></i>Chí mạng <b>${toPercent(fighter.critRate)}</b></span>
  `;
}

function renderSkillStatus(prefix, fighter) {
  const el = $(`${prefix}SkillStatus`);
  if (!el || !fighter) return;
  const skills = fighter.skills?.length
    ? fighter.skills.slice(0, 3)
    : [{
      id: 'legacy_skill',
      name: fighter.skillName || 'Skill',
      cost: fighter.skillCost,
      multiplier: fighter.skillMultiplier,
      cooldown: fighter.skillCooldown,
      cooldownRemaining: fighter.skillCooldownRemaining,
    }];
  const skillLabels = skills.map((skill) => {
    const skillCost = Math.max(0, Number(skill.cost) || 0);
    const skillMultiplier = Math.max(0, Number(skill.multiplier) || 0);
    const skillCooldown = Math.max(1, Number(skill.cooldown) || 1);
    const cooldownRemaining = Math.max(0, Number(skill.cooldownRemaining) || 0);
    const enoughMana = fighter.mana >= skillCost;
    const ready = cooldownRemaining <= 0 && enoughMana;
    const skillIcon = skill.id === 'legacy_skill' ? 'icon-item-skill-book' : getSkillItemIconClass(skill.id);
    const skillIconType = skillIcon.startsWith('icon-skill-item-') ? 'skill-item-icon' : 'item-icon';
    const cooldownText = cooldownRemaining > 0
      ? `Còn ${cooldownRemaining}/${skillCooldown} lượt`
      : 'Sẵn sàng';
    const skillLabel = `${skill.name} · Gây ${Math.round(skillMultiplier * 100)}% Công · ${cooldownText}`;
    const statusBadge = cooldownRemaining > 0
      ? `<b class="skill-status-cooldown">${cooldownRemaining}</b>`
      : !enoughMana
      ? `<i class="stat-icon icon-stat-mana skill-status-mana missing" title="Thiếu linh lực ${Math.floor(fighter.mana)}/${skillCost}" aria-label="Thiếu linh lực ${Math.floor(fighter.mana)}/${skillCost}"></i>`
      : '';
    return {
      ready,
      label: skillLabel + (enoughMana ? '' : ` · Thiếu linh lực ${Math.floor(fighter.mana)}/${skillCost}`),
      markup: `
        <span class="skill-status-icon-wrap ${ready ? 'ready' : 'waiting'}" title="${skillLabel}">
          <i class="${skillIconType} skill-status-icon ${skillIcon}" aria-hidden="true"></i>
          ${statusBadge}
        </span>
      `,
    };
  });
  const ready = skillLabels.some((skill) => skill.ready);
  const buffLabels = (fighter.battleBuffs || [])
    .filter((buff) => buff && Number(buff.remaining) > 0 && buff.stat)
    .map((buff) => {
      const remaining = Math.max(1, Math.floor(Number(buff.remaining) || 1));
      const icon = getStatIconClass(buff.stat);
      const iconType = icon.startsWith('icon-unique-') ? 'unique-icon' : 'stat-icon';
      const value = Number(buff.value) || 0;
      const valueText = isPercentStat(buff.stat) ? toPercent(value) : formatGameNumber(value);
      const label = `${getStatLabel(buff.stat)} +${valueText} · Còn ${remaining} lượt`;
      return {
        label,
        markup: `
          <span class="battle-buff-icon-wrap" title="${label}" aria-label="${label}">
            <i class="${iconType} battle-buff-icon ${icon}" aria-hidden="true"></i>
            <b class="battle-buff-remaining">${remaining}</b>
          </span>
        `,
      };
    });
  el.classList.toggle('ready', ready);
  el.classList.toggle('waiting', !ready);
  el.setAttribute('aria-label', [
    skillLabels.map((skill) => skill.label).join(' · '),
    buffLabels.length ? `Buff: ${buffLabels.map((buff) => buff.label).join(' · ')}` : '',
  ].filter(Boolean).join(' · '));
  el.innerHTML = `
    <span class="skill-status-icons">${skillLabels.map((skill) => skill.markup).join('')}</span>
    ${buffLabels.length ? `<span class="battle-buff-icons" aria-label="Buff đang có">${buffLabels.map((buff) => buff.markup).join('')}</span>` : ''}
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

function renderEquipmentSpecials(lines = []) {
  const specialText = formatSpecialLinesWithoutIcons(lines);
  return specialText ? `<div class="equipped-equipment-specials">${specialText}</div>` : '';
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
    mastery: 'icon-stat-mastery',
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
    mastery: 'Tinh thông',
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
    attackPercent: 'Tăng tấn công',
  };
  return labels[stat] || stat;
}

function isPercentStat(stat) {
  return ['accuracy', 'dodgeRate', 'blockRate', 'blockReduction', 'critRate', 'critDamage', 'lifeSteal', 'armorPierce', 'victoryRecovery', 'spiritStoneBonus', 'damageReduction', 'maxHpPercent', 'maxManaPercent', 'defensePercent', 'attackPercent'].includes(stat);
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
