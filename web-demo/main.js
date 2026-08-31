let maxTurns = 0;
let turnInterval = 0;
let playerMaxMinorLevel = 0;
let wanderEventDelay = 0;
let cultivationRewardMultiplier = 0;
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
const enemyStatsPath = '/assets/Resources/Data/EnemyStats.json';
const enemySkillsPath = '/assets/Resources/Data/EnemySkills.json';
const trialTowerPath = '/assets/Resources/Data/TrialTower.json';
const questDataPath = '/assets/Resources/Data/Quests.json';
const maxEquipmentLevel = 120;
const equipmentLevelsPerChestTier = 5;
const maxEquipmentInventory = 100;
const maxShopPurchaseQuantity = 999;
const cloudSaveEndpoint = '/api/game-state';
const cloudAuthEndpoint = '/api/auth';
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
let cloudSyncUnavailable = false;
let authServiceAvailable = false;

let baseStats = {};

let perLevel = {};

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

function getTierRealmText(tier) {
  const majorIndex = clamp(getTierMajorIndex(tier), 0, majorRealmNames.length - 1);
  const minorLevel = getTierMinorLevel(tier);
  return `${majorRealmNames[majorIndex]} cảnh ${getMinorRealmName(minorLevel, majorIndex)}`;
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
let enemySkillData = { defaultSkill: {}, skills: [], assignments: {} };
let questData = { title: 'Nhiệm vụ', quests: [] };

let shopItems = [];
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
let devMode = false;
let redeemedCodes = {};
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
let skillFragments = {};
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
let battleReturnTab = 'map';
let battleReturnToWander = false;
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
let highEnemyEncounterChance = false;
let skipEnemyEncounters = false;
let wanderEventRollCount = 0;
let dantianCultivation = 0;
let dantianCultivationSeconds = 0;
let offlineCapSeconds = 0;
let resourceRegenTimer = 0;
let selectedStage = null;
let currentDungeonId = '';
let currentWanderMapId = '';
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
const audioPreferenceKey = 'tuTienAudioEnabled';
let audioEnabled = true;
let audioContext = null;
let audioMasterGain = null;
let audioResumePromise = null;
let audioFallbackEnabled = false;
const audioFallbackCache = new Map();
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
  '/assets/Art/Sprites/pet/chibi-enemy-ghost.png',
  '/assets/Art/Sprites/pet/chibi-enemy-spider.png',
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
const devButton = $('devButton');
const audioToggleButton = $('audioToggleButton');
const codeInput = $('codeInput');
const redeemCodeButton = $('redeemCodeButton');
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
const devPanel = $('devPanel');
const questPanel = $('questPanel');
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
  code: devButton,
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
        <button type="button" class="${hasTarget ? 'secondary' : 'breakthrough'} compact onboarding-next" ${hasTarget ? 'disabled' : ''}><i class="${step.iconType} ${step.icon}" aria-hidden="true"></i>${hasTarget ? 'Đang chờ thao tác' : step.action}</button>
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
devButton?.addEventListener('click', showCodePanel);
redeemCodeButton?.addEventListener('click', redeemCode);
codeInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') redeemCode();
});
questButton?.addEventListener('click', showQuests);
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
logoutConfirmModal?.addEventListener('click', (event) => {
  if (event.target === logoutConfirmModal) closeLogoutConfirm();
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
  return Math.max(1, Number(cultivationSkillData.upgrade?.maxLevel) || 15);
}

function getSkillInitialCooldown(majorRealmIndex = playerMajorRealmIndex) {
  const upgrade = cultivationSkillData.upgrade || {};
  const base = Math.max(0, Math.floor(Number(upgrade.initialCooldown) || 0));
  const perMajorRealm = Math.max(0, Math.floor(Number(upgrade.initialCooldownPerMajorRealm) || 0));
  return base + Math.max(0, Math.floor(Number(majorRealmIndex) || 0)) * perMajorRealm;
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

function grantSkillLearningComprehension() {
  const maxSkillLearningComprehension = 3;
  if (skillLearningComprehension >= maxSkillLearningComprehension) return 0;
  skillLearningComprehension += 1;
  playerComprehension += 1;
  return 1;
}

const skillItemIconIds = new Set([
  'beginner_sword_art', 'sword_quickdraw', 'sword_flash', 'sword_flow', 'sword_domain', 'sword_storm',
  'beginner_blade_art', 'blade_heavy', 'blade_blood', 'blade_rend', 'blade_heaven', 'blade_apocalypse',
]);

function getSkillItemIconClass(skillId) {
  return skillItemIconIds.has(skillId) ? `icon-skill-item-${skillId}` : 'icon-item-skill-book';
}

function getSkillBookRequirement(skill, targetLevel) {
  const config = cultivationSkillData.upgrade?.skillBookRequirement || {};
  const milestoneEveryLevels = Math.max(1, Math.floor(Number(config.milestoneEveryLevels) || 3));
  const levelBooksPerMilestone = Math.max(0, Math.floor(Number(config.levelBooksPerMilestone) || 1));
  const level = Math.max(0, Math.floor(Number(targetLevel) || 0));
  const milestoneCount = level > 0 && level % milestoneEveryLevels === 0
    ? Math.floor(level / milestoneEveryLevels)
    : 0;
  const levelBooks = milestoneCount * levelBooksPerMilestone;
  const configuredGradeBooks = config.gradeBooksByGrade?.[skill?.gradeId];
  const gradeBooks = milestoneCount
    ? Math.max(0, Math.floor(Number(configuredGradeBooks ?? 1)))
    : 0;
  return {
    levelBooks,
    gradeBooks,
    total: levelBooks + gradeBooks,
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

function createSkillRuntime(skill, majorRealmIndex = playerMajorRealmIndex) {
  const level = getSkillLevel(skill.id);
  const initialCooldown = getSkillInitialCooldown(majorRealmIndex);
  return {
    id: skill.id,
    name: skill.name,
    level,
    cost: Math.max(0, Number(skill.cost) || 0),
    multiplier: getSkillMultiplier(skill, level),
    cooldown: Math.max(1, Number(skill.cooldown) || 1),
    cooldownRemaining: initialCooldown,
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
  if (returnTab === 'enhancement') {
    showEnhancement();
    return;
  }
  if (returnTab === 'resourceDungeon') {
    showResourceDungeons();
    return;
  }
  if (returnTab === 'trialTower') {
    showTrialTower();
    return;
  }
  if (returnTab === 'code') {
    showCodePanel();
    return;
  }
  if (returnTab === 'quests') {
    showQuests();
    return;
  }
  showMap();
}

function returnFromBattleScreen() {
  const shouldResumeWander = battleReturnToWander;
  battleReturnToWander = false;
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
      <span><b>Tu vi</b><strong>${stage.realmText}</strong></span>
      <span><b>Lối đánh</b><strong>${getCombatStyleLabel(stage.enemyData)}</strong></span>
      <span><b>Skill</b><strong>${stage.enemyData.skillName}</strong></span>
    </div>
    <div class="enemy-encounter-summary">
      <span><b>Lực chiến</b><strong>${formatGameNumber(getCombatPower(preview))}</strong></span>
      <span><b>Chạy thoát</b><strong>${toPercent(fleeChance)}</strong></span>
    </div>
    <small class="enemy-equipment-preview"><b>Trang bị</b> ${getEnemyEquipmentText(stage)}</small>
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
      <span><b>Tu vi</b><strong>${stage.realmText}</strong></span>
      <span><b>Lối đánh</b><strong>${getCombatStyleLabel(stage.enemyData)}</strong></span>
      <span><b>Skill</b><strong>${stage.enemyData.skillName}</strong></span>
    </div>
    <div class="enemy-encounter-summary">
      <span><b>Lực chiến</b><strong>${formatGameNumber(getCombatPower(preview))}</strong></span>
      <span><b>Chạy thoát</b><strong>${toPercent(fleeChance)}</strong></span>
    </div>
    <small class="enemy-equipment-preview"><b>Trang bị</b> ${getEnemyEquipmentText(stage)}</small>
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

function showCodePanel() {
  if (busy) return;
  prepareFeatureView(devPanel, 'code', renderCodePanel);
}

function showQuests() {
  prepareFeatureView(questPanel, 'quests', renderQuests);
}

function renderCodePanel() {
  codeInput?.focus();
}

function getRedeemCodeConfig(code) {
  const codes = gameConfig.redeemCodes && typeof gameConfig.redeemCodes === 'object'
    ? gameConfig.redeemCodes
    : {};
  return codes[code] || null;
}

function getRedeemRewardToastItems(code, grant = {}) {
  if (code === 'devgame') {
    return [
      { iconClass: 'item-icon icon-item-spirit-stone', label: `Linh thạch +${formatGameNumber(grant.spiritStones)}` },
      { iconClass: 'stat-icon icon-stat-gem', label: `Căn cơ +${formatGameNumber(grant.foundation)}` },
      { iconClass: 'unique-icon icon-unique-comprehension', label: `Ngộ tính +${formatGameNumber(grant.comprehension)}` },
    ];
  }
  if (code === 'newbie') {
    return [
      { iconClass: 'item-icon icon-item-spirit-stone', label: `Linh thạch +${formatGameNumber(grant.spiritStones)}` },
      { iconClass: 'activity-icon icon-activity-chest', label: `Rương cấp 1 x${formatGameNumber(grant.equipmentChestTier1)}` },
      { iconClass: 'item-icon icon-item-enhancement-stone', label: `Đá cường hóa x${formatGameNumber(grant.enhancementStones)}` },
      { iconClass: 'activity-icon icon-activity-gate', label: `Phá Cảnh Đan x${formatGameNumber(grant.ascensionPermits)}` },
      { iconClass: 'item-icon icon-item-health-pill', label: `Sinh Huyết Đan x${formatGameNumber(grant.healthPotions)}` },
      { iconClass: 'item-icon icon-item-mana-flame', label: `Tụ Linh Đan x${formatGameNumber(grant.manaPotions)}` },
    ];
  }
  return [];
}

function redeemCode() {
  if (busy) return;
  const code = String(codeInput?.value || '').trim().toLowerCase();
  if (!code) {
    showGameToast('Hãy nhập mã quà tặng.', 'error');
    return;
  }

  const config = getRedeemCodeConfig(code);
  if (!config) {
    showGameToast('Mã quà tặng không hợp lệ.', 'error');
    return;
  }
  if (config.once !== false && redeemedCodes[code]) {
    showGameToast('Mã này đã được sử dụng.', 'error');
    return;
  }

  const grant = config.grant || {};
  playerSpiritStones += Math.max(0, Number(grant.spiritStones) || 0);
  playerFoundation += Math.max(0, Number(grant.foundation) || 0);
  playerComprehension += Math.max(0, Number(grant.comprehension) || 0);
  enhancementStones += Math.max(0, Number(grant.enhancementStones) || 0);
  healthPotionCount += Math.max(0, Number(grant.healthPotions) || 0);
  manaPotionCount += Math.max(0, Number(grant.manaPotions) || 0);
  addShopInventoryItem(ascensionPermitItemId, grant.ascensionPermits);
  for (let index = 0; index < Math.max(0, Number(grant.equipmentChestTier1) || 0); index += 1) {
    addEquipmentChest({ majorRealmIndex: playerMajorRealmIndex }, { chestTier: 1 });
  }

  if (code === 'devgame') devMode = true;
  redeemedCodes[code] = true;
  syncPlayerResourceCaps();
  updateNotificationBadges();
  renderCodePanel();
  renderCultivation();
  renderInventory();
  renderShop();
  renderEquipment();
  renderProfile();
  saveGame();
  if (codeInput) codeInput.value = '';
  showGameToast(
    code === 'devgame' ? 'Đã nhận quà Dev:' : 'Đã nhận quà tân thủ:',
    'success',
    getRedeemRewardToastItems(code, grant),
  );
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

function getQuestMilestoneIndex(quest, milestone) {
  return getCombinedQuestMilestones(quest).findIndex((entry) => entry === milestone);
}

function getCultivationRequirementForQuestMilestone(milestone) {
  if (!milestone) return 0;
  if (milestone.kind === 'major') {
    const previousRealm = cultivationProgression[Math.max(0, Number(milestone.target) - 1)];
    return Math.max(0, Number(previousRealm?.majorBreakthroughRequirement) || 0);
  }
  let remainingTier = Math.max(1, Math.floor(Number(milestone.target) || 1));
  for (let majorIndex = 0; majorIndex < cultivationProgression.length; majorIndex += 1) {
    const minorCap = getMinorRealmLevelCap(majorIndex);
    if (remainingTier <= minorCap) {
      const progression = cultivationProgression[majorIndex] || {};
      const level = Math.max(1, remainingTier);
      return Math.max(0,
        (Number(progression.minorBaseRequirement) || 0)
        + Math.max(0, level - 2) * (Number(progression.minorStepRequirement) || 0),
      );
    }
    remainingTier -= minorCap;
  }
  return 0;
}

function roundQuestCultivationReward(value, rounding = 'nearestTen') {
  const amount = Math.max(0, Number(value) || 0);
  if (rounding === 'nearestTen') return Math.max(0, Math.round(amount / 10) * 10);
  return Math.max(0, Math.round(amount));
}

function getFormulaQuestReward(quest, milestone) {
  const formula = quest?.objective?.rewardFormula;
  if (!formula || !milestone) return null;
  const milestoneIndex = getQuestMilestoneIndex(quest, milestone);
  if (milestoneIndex < 0) return null;
  const requirement = getCultivationRequirementForQuestMilestone(milestone);
  const divisor = Math.max(1, Number(formula.cultivationDivisor) || 1);
  const reward = {
    cultivation: roundQuestCultivationReward(requirement / divisor, formula.cultivationRounding),
    spiritStones: Math.max(0,
      Math.round((Number(formula.spiritStonesBase) || 0)
        + milestoneIndex * (Number(formula.spiritStonesPerMilestone) || 0)),
    ),
  };
  if (milestone.kind === 'major' && Number(formula.comprehensionPerMajorRealm) > 0) {
    reward.comprehension = Math.max(0, Math.floor(Number(formula.comprehensionPerMajorRealm)));
  }
  return reward;
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
  if (objective.type === 'dailyResourceDungeonWins') return dailyQuestProgress.resourceDungeonWins;
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
    const milestone = getCombinedQuestProgress(quest).milestone;
    const formulaReward = getFormulaQuestReward(quest, milestone);
    return formulaReward
      ? { ...(milestone?.reward || {}), ...formulaReward }
      : { ...(milestone?.reward || {}) };
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
  const majorIndex = Number(floor.realmMajorIndex) || 0;
  const realmLevel = Number(floor.realmLevel) || 1;
  const towerTier = Math.max(1, Number(floor.equipmentLevel) || Number(floor.floor) + 9);
  return {
    id: `trial-tower-${floor.floor}`,
    title: floor.title || `Tầng ${floor.floor}`,
    enemyLevel: realmLevel,
    enemyTier: towerTier,
    trialCombatPower: Math.max(0, Math.round(Number(floor.combatPower) || 0)),
    enemyMajorRealmIndex: majorIndex,
    towerPowerMultiplier: Number.isFinite(Number(floor.towerPowerMultiplier))
      ? Number(floor.towerPowerMultiplier)
      : getTrialTowerPowerMultiplier(floor.floor),
    realmText: floor.realmText || getTierRealmText(towerTier),
    enemyRankLevel: rankLevel,
    enemyData: {
      id: guardian.id || `trial-guardian-${floor.floor}`,
      name: guardian.name || `Thủ vệ tầng ${floor.floor}`,
      type: guardian.type || 'Tu sĩ',
      rank: Number(floor.rankLevel) >= 4 ? 'king' : Number(floor.rankLevel) === 3 ? 'leader' : 'elite',
      skillName: guardian.skillName || 'Võ kỹ thủ hộ',
      description: guardian.description || '',
      canEquip: true,
      combatStyle: guardian.combatStyle || 'counter',
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
        <em>${rankText} | ${floor.realmText} | ${getCombatStyleLabel(stage?.enemyData)} | Lực chiến ${formatGameNumber(stage?.trialCombatPower || (preview ? getCombatPower(preview) : 0))}</em>
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
  })
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
  await loadCultivationRealms();
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
    ['lối đánh', loadCombatStyles],
    ['Tháp thí luyện', loadTrialTowerData],
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
  wanderChestCapacity = Number(gameConfig.runtime.wanderChestCapacity);
  offlineCapSeconds = Number(gameConfig.runtime.offlineCapSeconds);
  baseSaveKey = gameConfig.persistence.saveKey;
  setAccountSaveKey();
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
  if (!Array.isArray(data.stats) || data.stats.length === 0) {
    throw new Error('Combat stats data is incomplete.');
  }
  combatStatDefinitions = data.stats;
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

async function loadTrialTowerData() {
  const response = await fetch(trialTowerPath);
  if (!response.ok) throw new Error(`Cannot load trial tower data: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.floors) || data.floors.length !== 50 || !Number.isFinite(Number(data.entryRequiredTier))) {
    throw new Error('Trial tower data is incomplete.');
  }
  trialTowerData = data;
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
    name: enemyData.skillName || definition?.name || 'Skill kẻ địch',
    description: enemyData.skillDescription || definition?.description || 'Không có hiệu ứng thêm',
  };
}

function createEnemySkillRuntime(enemyData, initialCooldown = null, majorRealmIndex = playerMajorRealmIndex) {
  const definition = getEnemySkillDefinition(enemyData);
  const cooldown = Math.max(1, Number(definition.cooldown) || 1);
  return {
    id: definition.id || `enemy-skill-${enemyData.id}`,
    name: definition.name,
    description: definition.description,
    cost: Math.max(0, Number(definition.cost) || 0),
    multiplier: Math.max(0, Number(definition.multiplier) || 0),
    cooldown,
    cooldownRemaining: initialCooldown === null
      ? getSkillInitialCooldown(majorRealmIndex)
      : Math.max(0, Number(initialCooldown) || 0),
    effects: Array.isArray(definition.effects) ? definition.effects.map((effect) => ({ ...effect })) : [],
  };
}

function applyEnemySkillRuntime(fighter, enemyData, initialCooldown = null) {
  const skill = createEnemySkillRuntime(enemyData, initialCooldown, fighter.majorRealmIndex);
  fighter.skillId = skill.id;
  fighter.skillName = skill.name;
  fighter.skillDescription = skill.description;
  fighter.skillCost = skill.cost;
  fighter.skillMultiplier = skill.multiplier;
  fighter.skillCooldown = skill.cooldown;
  fighter.skillCooldownRemaining = skill.cooldownRemaining;
  fighter.skills = [skill];
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
  startCloudAutoSave();
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

async function prepareCloudSession() {
  try {
    const response = await fetch(cloudAuthEndpoint, { cache: 'no-store' });
    if (response.status === 404 || response.status === 503) {
      cloudSyncUnavailable = true;
      setAccountSaveKey();
      showAuthOverlay('Cần đăng nhập để bắt đầu chơi.');
      return false;
    }
    if (!response.ok) {
      cloudSyncUnavailable = true;
      setAccountSaveKey();
      showAuthOverlay('Cần đăng nhập để bắt đầu chơi.');
      return false;
    }
    const payload = await response.json();
    authServiceAvailable = true;
    if (!payload.user) {
      showAuthOverlay();
      return false;
    }
    cloudUser = payload.user;
    setAccountSaveKey(cloudUser);
    await loadCloudSave();
    renderAccountBar();
    return true;
  } catch (error) {
    cloudSyncUnavailable = true;
    setAccountSaveKey();
    showAuthOverlay('Cần đăng nhập để bắt đầu chơi.');
    return false;
  }
}

async function finishAuthentication(user) {
  cloudUser = user;
  authServiceAvailable = true;
  cloudSyncUnavailable = false;
  setAccountSaveKey(cloudUser);
  await loadCloudSave();
  renderAccountBar();
  hideAuthOverlay();
  startGame();
}

async function submitAuth(event) {
  event.preventDefault();
  if (authSubmitting) return;
  authSubmitting = true;
  if (authSubmitButton) authSubmitButton.disabled = true;
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
    if (!response.ok || !payload.user) {
      setAuthMessage(payload.error || 'Không thể xác thực tài khoản.', 'error');
      return;
    }
    await finishAuthentication(payload.user);
  } catch (error) {
    setAuthMessage('Không thể kết nối dịch vụ tài khoản.', 'error');
  } finally {
    authSubmitting = false;
    if (authSubmitButton) authSubmitButton.disabled = false;
  }
}

async function logout() {
  if (!cloudUser) return;
  saveGame();
  try {
    await fetch(cloudAuthEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
  } finally {
    window.localStorage.removeItem(saveKey);
    window.location.reload();
  }
}

async function syncCloudState(data) {
  if (!cloudUser || cloudSyncUnavailable || !data) return false;
  try {
    const response = await fetch(cloudSaveEndpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: data }),
    });
    if (!response.ok) {
      cloudSyncUnavailable = true;
      return false;
    }
    return true;
  } catch (error) {
    cloudSyncUnavailable = true;
    return false;
  }
}

function queueCloudSave(data) {
  if (!cloudUser || cloudSyncUnavailable) return;
  cloudPendingData = data;
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(async () => {
    const pendingData = cloudPendingData;
    cloudPendingData = null;
    cloudSaveTimer = 0;
    await syncCloudState(pendingData);
    if (cloudPendingData) queueCloudSave(cloudPendingData);
  }, 500);
}

function startCloudAutoSave() {
  window.clearInterval(cloudPeriodicSaveTimer);
  cloudPeriodicSaveTimer = 0;
  if (!cloudUser || cloudSyncUnavailable) return;
  cloudPeriodicSaveTimer = window.setInterval(async () => {
    if (!gameStarted || !cloudUser || cloudSyncUnavailable || cloudPeriodicSyncInFlight) return;
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
  if (!cloudUser || !saveKey || cloudSyncUnavailable) return false;
  try {
    const response = await fetch(cloudSaveEndpoint, {
      cache: 'no-store',
    });
    if (response.status === 404 || response.status === 503) {
      cloudSyncUnavailable = true;
      return false;
    }
    if (!response.ok) return false;
    const payload = await response.json();
    if (!payload.state || typeof payload.state !== 'object') return false;
    window.localStorage.setItem(saveKey, JSON.stringify(payload.state));
    return true;
  } catch (error) {
    cloudSyncUnavailable = true;
    return false;
  }
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
      devMode: false,
      foundationFindCounts: {},
      highEnemyEncounterChance: false,
      skipEnemyEncounters: false,
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
      cultivationSpeedBonus: 0,
      completedStages: [],
      currentStageId: stages[0]?.id || 1,
      currentDungeonId: initialState.dungeonId,
      currentWanderMapId: initialState.wanderMapId,
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
    playerLevel = clamp(Number(data.playerLevel) || 1, 1, getMinorRealmLevelCap(playerMajorRealmIndex));
    playerCultivation = Math.max(0, Number(data.playerCultivation) || 0);
    playerSpiritStones = Math.max(0, Number(data.playerSpiritStones) || 0);
    playerFoundation = Math.max(1, Number(data.playerFoundation) || 1);
    playerComprehension = Math.max(1, Math.floor(Number(data.playerComprehension) || 1));
    devMode = Boolean(data.devMode);
    redeemedCodes = data.redeemedCodes && typeof data.redeemedCodes === 'object'
      ? Object.fromEntries(Object.entries(data.redeemedCodes).map(([code, used]) => [String(code), Boolean(used)]))
      : {};
    foundationFindCounts = normalizeFoundationFindCounts(data.foundationFindCounts);
    wanderChestRewards = normalizeWanderChestRewards(data.wanderChestRewards);
    highEnemyEncounterChance = Boolean(data.highEnemyEncounterChance);
    skipEnemyEncounters = Boolean(data.skipEnemyEncounters);
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
    cultivationSpeedBonus = Math.max(0, Number(data.cultivationSpeedBonus) || 0);
    playerCurrentHp = data.playerCurrentHp ?? null;
    playerCurrentMana = data.playerCurrentMana ?? null;
    healthPotionCount = Math.max(0, Number(data.healthPotionCount) || 0);
    manaPotionCount = Math.max(0, Number(data.manaPotionCount) || 0);
    enhancementStones = Math.max(0, Number(data.enhancementStones) || Number(data.enhancementMaterials) || 0);
    skillBooks = data.skillBooks && typeof data.skillBooks === 'object' ? data.skillBooks : {};
    skillFragments = data.skillFragments && typeof data.skillFragments === 'object' ? data.skillFragments : {};
    shopInventoryCounts = normalizeShopInventoryCounts(data.shopInventoryCounts);
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
  const stats = item.stats
    ? Object.fromEntries(Object.entries(item.stats).filter(([stat]) => stat !== 'blockReduction'))
    : createEquipmentStats(item.slotId, Number(item.level) || 1, item.rarityKey);
  const enhancementLevel = Math.max(0, Number(item.enhancementLevel) || 0);
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
      enhancementLevel,
    ),
    stats,
    baseStats: getBaseEquipmentStats({ stats, baseStats: item.baseStats, enhancementLevel }),
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
    skillLearningComprehension,
    devMode,
    redeemedCodes,
    foundationFindCounts,
    wanderChestRewards,
    highEnemyEncounterChance,
    skipEnemyEncounters,
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
    cultivationSpeedBonus,
    playerCurrentHp,
    playerCurrentMana,
    healthPotionCount,
    manaPotionCount,
    enhancementStones,
    skillBooks,
    skillFragments,
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

function createEnemyProgressionStats(majorIndex, level) {
  const config = enemyStats || {};
  const stats = { ...(config.baseStats || baseStats) };
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
    ? getEquippedSkills().map((skill) => createSkillRuntime(skill, majorIndex))
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
    speed: getGrowthStat('speed'),
    accuracy: getGrowthStat('accuracy'),
    dodgeRate: getGrowthStat('dodgeRate'),
    blockRate: getGrowthStat('blockRate'),
    blockReduction: statBase.blockReduction,
    critRate: statBase.critRate,
    critDamage: statBase.critDamage,
    armorPierce: statBase.armorPierce,
    damageReduction: getGrowthStat('damageReduction'),
    lifeSteal: statBase.lifeSteal,
    luck: statBase.luck,
    spiritSense: statBase.spiritSense,
    comprehension: includeEquipment ? playerComprehension : getGrowthStat('comprehension'),
    victoryRecovery: 0,
    spiritStoneBonus: 0,
    reflectDamage: 0,
    skillName: selectedSkill?.name || 'Tuyệt Ảnh Kiếm',
    skillCost: selectedSkill?.cost || 20,
    skillMultiplier: selectedSkill?.multiplier || 1.4,
    skillCooldown: selectedSkill?.cooldown || 2,
    skillCooldownRemaining: getSkillInitialCooldown(majorIndex),
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
  viewport.setAttribute('aria-label', 'Cuộn ngang để xem các map khác');

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
    button.disabled = lockedByEvent;
    button.classList.toggle('locked-tab', !unlocked);
    button.setAttribute('aria-disabled', String(lockedByEvent));
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
    <span>PC: Cuộn chuột · Mobile: Kéo ngang để xem thêm map</span>
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
  const chestTier = getEquipmentChestTier(map);
  const defeatedCount = getWanderMapDefeatedCount(map.id);
  const bossDefeated = Boolean(wanderBossDefeatedByMap[map.id]);
  const bossRequiredWins = getWanderBossRequiredWins();
  const bossUnlocked = defeatedCount >= bossRequiredWins && !bossDefeated;
  const highEnemyUnlocked = canUseHighEnemyEncounter(map);
  const skipEnemyUnlocked = canUseSkipEnemyEncounters(map);
  const highEnemyRequiredWins = Math.max(0, Math.floor(Number(gameConfig.gameplay?.wanderHighEnemyRequiredWins) || 10));
  const panel = document.createElement('section');
  panel.className = 'wander-info-panel';
  panel.innerHTML = `
    <div class="wander-info-heading">
      <strong><i class="activity-icon ${getWanderMapIconClass(map.id)}" aria-hidden="true"></i>${map.name}</strong>
    </div>
    <div class="wander-map-rules">
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
        <strong><i class="unique-icon icon-wander-skip-enemy" aria-hidden="true"></i>Bỏ qua kẻ địch</strong>
      </div>
      <button type="button" class="secondary compact ${skipEnemyEncounters ? 'is-active' : ''} ${skipEnemyUnlocked ? '' : 'is-locked'}" data-wander-skip-enemy aria-pressed="${String(skipEnemyEncounters)}" aria-disabled="false" title="${skipEnemyUnlocked ? 'Bỏ qua kẻ địch trong map này' : 'Cần đánh bại Boss trong map'}">
        <i class="unique-icon icon-wander-skip-enemy" aria-hidden="true"></i>${skipEnemyEncounters ? 'Đang bật' : 'Bật'}
      </button>
    </div>
    <div class="wander-boss-panel ${bossDefeated ? 'is-defeated' : ''}">
      <div>
        <strong><i class="activity-icon icon-activity-encounter" aria-hidden="true"></i>Boss map</strong>
        <small>${bossDefeated ? 'Đã chinh phục' : `Đã đánh bại ${defeatedCount}/${bossRequiredWins} kẻ địch`}</small>
      </div>
      <button type="button" class="secondary compact ${bossUnlocked ? '' : bossDefeated ? 'is-defeated' : 'is-locked'}" data-wander-boss aria-disabled="${String(bossDefeated)}" ${bossDefeated ? 'disabled' : ''}>
        <i class="item-icon icon-item-sword" aria-hidden="true"></i>${bossDefeated ? 'Đã thắng' : 'Khiêu chiến'}
      </button>
    </div>
    <small>Sau ${Math.ceil(wanderEventDelay / 1000)} giây sẽ gặp cơ duyên hoặc kẻ địch.</small>
    <button class="${enoughHealth ? 'breakthrough' : 'secondary'}" type="button" data-wander-start>
      <i class="activity-icon icon-activity-path" aria-hidden="true"></i>${enoughHealth ? 'Bắt đầu ngao du' : 'Đang trọng thương'}
    </button>
  `;
  const button = panel.querySelector('[data-wander-start]');
  const encounterToggle = panel.querySelector('[data-wander-high-enemy]');
  button.disabled = !enoughHealth;
  button.addEventListener('click', () => beginWander(false));
  encounterToggle.addEventListener('click', () => {
    if (!canUseHighEnemyEncounter(map)) {
      showLockedFeatureNotice('Tăng tỉ lệ gặp kẻ địch', `Cần đánh bại ${highEnemyRequiredWins} kẻ địch trong map`);
      return;
    }
    highEnemyEncounterChance = !highEnemyEncounterChance;
    if (highEnemyEncounterChance) skipEnemyEncounters = false;
    saveGame();
    showGameToast(highEnemyEncounterChance ? 'Đã bật tăng tỉ lệ gặp kẻ địch.' : 'Đã tắt tăng tỉ lệ gặp kẻ địch.', 'success');
    renderStageMap();
  });
  const skipEnemyToggle = panel.querySelector('[data-wander-skip-enemy]');
  skipEnemyToggle.addEventListener('click', () => {
    if (!canUseSkipEnemyEncounters(map)) {
      showLockedFeatureNotice('Bỏ qua kẻ địch', 'Cần đánh bại Boss trong map');
      return;
    }
    skipEnemyEncounters = !skipEnemyEncounters;
    if (skipEnemyEncounters) highEnemyEncounterChance = false;
    saveGame();
    showGameToast(skipEnemyEncounters ? 'Đã bật bỏ qua kẻ địch.' : 'Đã tắt bỏ qua kẻ địch.', 'success');
    renderStageMap();
  });
  const bossButton = panel.querySelector('[data-wander-boss]');
  bossButton.addEventListener('click', () => {
    if (bossDefeated) {
      showGameToast('Boss map này đã được đánh bại.', 'info');
      return;
    }
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
  const enemyChance = skipEnemyEncounters
    ? 0
    : highEnemyEncounterChance
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
      : `Phần thưởng mới bị bỏ qua vì Rương Ngao du đã đủ ${wanderChestCapacity} phần.`,
    detail: stored ? 'Mở Rương Ngao du để nhận phần thưởng.' : 'Hãy mở rương trước khi tiếp tục ngao du.',
    autoContinue: stored && wanderChestRewards.length < wanderChestCapacity,
  };
}

function createWanderReward(map = getCurrentWanderMap()) {
  const type = pickWanderRewardType();
  if (type === 'cultivation') return createWanderCultivationChoice(map);
  if (type === 'spiritStone') return createWanderSpiritStoneChoice(map);
  if (['healthPotion', 'manaPotion', 'enhancementStone'].includes(type)) return createWanderConsumableChoice(type, map);
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

function canUseSkipEnemyEncounters(map = getCurrentWanderMap()) {
  const requiresBoss = gameConfig.gameplay?.wanderSkipEnemyRequiresBoss !== false;
  return !requiresBoss || Boolean(wanderBossDefeatedByMap[map?.id]);
}

function syncWanderEncounterToggles(map = getCurrentWanderMap()) {
  if (!canUseHighEnemyEncounter(map)) highEnemyEncounterChance = false;
  if (!canUseSkipEnemyEncounters(map)) skipEnemyEncounters = false;
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
    Boolean(flags?.[mapId]),
  ]));
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
  const amount = Math.max(1, Math.floor(rollWanderRewardBase(type) * getRewardSettings(map).cultivationMultiplier));
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
    <div class="enemy-encounter-meta">
      <span><b>Phẩm chất</b><strong>${getEnemyRankLabel(stage.enemyData, stage.enemyRankLevel)}</strong></span>
      <span><b>Tu vi</b><strong>${stage.realmText}</strong></span>
      <span><b>Skill</b><strong>${stage.enemyData.skillName}</strong></span>
    </div>
    <div class="enemy-encounter-summary">
      <span><b>Lực chiến</b><strong>${formatGameNumber(getCombatPower(preview))}</strong></span>
      <span><b>Chạy thoát</b><strong>${toPercent(fleeChance)}</strong></span>
    </div>
    <small>Đánh thắng để mở đường ngao du tiếp.</small>
    <small class="enemy-equipment-preview"><b>Trang bị</b> ${getEnemyEquipmentText(stage)}</small>
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
      <span><b>Tu vi</b><strong>${stage.realmText}</strong></span>
      <span><b>Lối đánh</b><strong>${getCombatStyleLabel(stage.enemyData)}</strong></span>
      <span><b>Skill</b><strong>${stage.enemyData.skillName}</strong></span>
    </div>
    <div class="enemy-encounter-summary">
      <span><b>Lực chiến</b><strong>${formatGameNumber(getCombatPower(preview))}</strong></span>
      <span><b>Chạy thoát</b><strong>${toPercent(fleeChance)}</strong></span>
    </div>
    <small class="enemy-equipment-preview"><b>Trang bị</b> ${getEnemyEquipmentText(stage)}</small>
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
  const chance = getFleeChance(stage);
  if (Math.random() > chance) {
    currentWanderEvent = null;
    startStageBattle(stage);
    pushLog(`${stage.enemyData.name} đuổi kịp, không thể chạy thoát.`);
    return;
  }

  player.mana = Math.max(0, Math.round(player.mana * 0.9));
  currentWanderEvent = {
    type: 'result',
    title: 'Đã rút lui',
    message: `Chạy thoát khỏi ${stage.enemyData.name}.`,
    detail: `Tỉ lệ chạy thoát: ${toPercent(chance)}. Mất 10% linh lực hiện tại, không nhận thưởng từ đối thủ này.`,
  };
  renderStageMap();
  renderCultivation();
  saveGame();
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

  rememberBattleReturnTab(stage);
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
  stage.enemyRankLevel = stage.isWanderBoss
    ? 5
    : stage.enemyRankLevel
    && (!rankMap?.enemyRankWeights || Object.prototype.hasOwnProperty.call(rankMap.enemyRankWeights, String(stage.enemyRankLevel)))
    ? stage.enemyRankLevel
    : rollEnemyRank(rankMap);
  if (stage.isAmbush && stage.ambushStats) {
    const base = createFighter(
      stage.enemyData.name,
      stage.enemyLevel,
      false,
      stage.enemyMajorRealmIndex || 0,
      true,
    );
    const stats = stage.ambushStats;
    const enemyFighter = {
      ...base,
      name: stage.enemyData.name,
      realm: stage.title,
      minorRealm: getMinorRealmName(stage.enemyLevel, stage.enemyMajorRealmIndex || 0),
      maxHp: stats.maxHp,
      maxMana: stats.maxMana,
      attack: stats.attack,
      defense: stats.defense,
      accuracy: stats.accuracy,
      dodgeRate: stats.dodgeRate,
      blockRate: stats.blockRate,
      skills: [],
    };
    applyEnemySkillRuntime(enemyFighter, stage.enemyData);
    applyEnemyRankMultiplier(enemyFighter, stage.enemyRankLevel);
    applyEnemyCombatStyle(enemyFighter, stage.enemyData);
    applyItemStats(enemyFighter, getEnemyEquipment(stage));
    enemyFighter.dodgeRate = 0;
    return finalizeEnemyFighter(enemyFighter);
  }

  const enemyFighter = createFighter(
    stage.enemyData.name,
    stage.enemyLevel,
    false,
    stage.enemyMajorRealmIndex || 0,
    true,
  );
  applyTrialTowerPowerScaling(enemyFighter, stage);
  applyEnemyRankMultiplier(enemyFighter, stage.enemyRankLevel);
  applyEnemySkillRuntime(enemyFighter, stage.enemyData);
  applyEnemyCombatStyle(enemyFighter, stage.enemyData);
  applyItemStats(enemyFighter, getEnemyEquipment(stage));
  enemyFighter.dodgeRate = 0;
  if (stage.isTrialTower && Number.isFinite(Number(stage.trialCombatPower))) {
    enemyFighter.displayCombatPower = stage.trialCombatPower;
  }
  return finalizeEnemyFighter(enemyFighter);
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

function finalizeEnemyFighter(fighter) {
  ['maxHp', 'maxMana', 'attack', 'defense', 'speed'].forEach((stat) => {
    fighter[stat] = Math.max(1, Math.round(Number(fighter[stat]) || 0));
  });
  fighter.accuracy = clamp(Number(fighter.accuracy) || 0, 0.1, 0.98);
  fighter.dodgeRate = clamp(Number(fighter.dodgeRate) || 0, 0, 0.45);
  fighter.blockRate = clamp(Number(fighter.blockRate) || 0, 0, 0.55);
  fighter.critRate = clamp(Number(fighter.critRate) || 0, 0, 0.75);
  fighter.critDamage = Math.max(1.5, Number(fighter.critDamage) || 1.5);
  fighter.hp = fighter.maxHp;
  fighter.mana = fighter.maxMana;
  fighter.combatPower = getCombatPower(fighter);
  return fighter;
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

function applyTrialTowerPowerScaling(fighter, stage) {
  if (!stage?.isTrialTower) return;
  const multiplier = Number(stage.towerPowerMultiplier);
  if (!Number.isFinite(multiplier) || multiplier <= 1) return;
  ['maxHp', 'maxMana', 'attack', 'defense', 'speed'].forEach((stat) => {
    fighter[stat] *= multiplier;
  });
  applyEnemyStatMultipliers(fighter);
}

function applyEnemyCombatStyle(fighter, enemyData = {}) {
  const styleId = enemyData.combatStyle || 'counter';
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
  const majorIndex = getTierMajorIndex(tier);
  return Number.isInteger(Number(tier))
    && Number(tier) > 0
    && getTierMinorLevel(Number(tier)) === getMinorRealmLevelCap(majorIndex);
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
      const rarityKey = stage.isTrialTower
        ? 'uncommon'
        : isFixedEquipmentStage
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
    if (effect.type === 'percentBuff') {
      const rate = clamp(Number(effect.value) || 0, 0, 1);
      const duration = Math.max(1, Number(effect.duration) || 1);
      if (!(effect.stat in receiver)) return;
      const value = Math.max(1, Math.round((receiver[effect.stat] || 0) * rate));
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
      effectTexts.push(`${getStatLabel(effect.stat)} +${toPercent(rate)}`);
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
  if (skill) {
    primaryHit.skill = true;
    primaryHit.skillName = selectedSkill.name;
  }
  playAudioCue(primaryHit.dodged ? 'dodge' : primaryHit.critical ? 'critical' : skill ? 'skill' : 'hit');
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
  playAudioCue(outcome === 'win' ? 'victory' : outcome === 'draw' ? 'click' : 'defeat');
  savePlayerResourcesFromBattle(outcome);
  const isTrialTower = Boolean(currentStage?.isTrialTower);
  const isResourceDungeon = Boolean(currentStage?.isResourceDungeon);
  const isWanderBattle = !isTrialTower && !isResourceDungeon && Boolean(currentStage?.isWanderGenerated);
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
    if (isWanderBattle && currentStage.isWanderBoss) {
      wanderBossDefeatedByMap[currentStage.mapId] = true;
    } else if (isWanderBattle && currentStage.mapId) {
      wanderDefeatedByMap[currentStage.mapId] = getWanderMapDefeatedCount(currentStage.mapId) + 1;
    }
  }
  dailyQuestProgress = normalizeDailyQuestProgress(dailyQuestProgress);
  if (outcome === 'win' && isTrialTower) dailyQuestProgress.trialTowerWins += 1;
  if (outcome === 'win' && isResourceDungeon) dailyQuestProgress.resourceDungeonWins += 1;
  if (outcome === 'win' && !isTrialTower && !isResourceDungeon) {
    dailyQuestProgress.wanderWins += 1;
    dailyQuestProgress.wanderRewards += 1;
  }
  let reward = 0;
  let cultivationAward = 0;
  let spiritStoneReward = 0;
  let droppedItem = null;
  let bonusRewardText = '';
  if (resourceAttemptRefunded) bonusRewardText = 'Đã hoàn lại 1 lượt Phụ bản';
  if (isTrialTower && outcome === 'win') {
    const towerReward = applyTrialTowerReward(currentStage);
    reward = towerReward.cultivation;
    cultivationAward = reward;
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
    cultivationAward = reward;
    spiritStoneReward = resourceReward.spiritStones;
    bonusRewardText = resourceDungeon?.rewardType === 'enhancementStone'
      ? formatResourceReward(resourceDungeon, resourceReward.amount)
      : '';
    message = `${message} Vượt qua ${currentStage.title}.`;
  } else if (!isTrialTower && !isResourceDungeon) {
    cultivationAward = getCultivationReward(outcome);
    reward = addPlayerCultivation(cultivationAward);
    spiritStoneReward = addSpiritStoneReward(outcome);
    droppedItem = rollEquipmentDrop(outcome);
  }
  startButton.disabled = false;
  startButton.textContent = getPostBattleButtonText(outcome);
  startButton.classList.add('is-hidden');
  renderBattleResult(message, outcome, reward, spiritStoneReward, droppedItem, bonusRewardText, cultivationAward);
  renderStageMap();
  pushLog(`${message} Trận đấu kết thúc.`);
  pushLog((cultivationAward > 0 || reward > 0)
    ? `Nhận ${formatGameNumber(cultivationAward || reward)} tu vi${cultivationAward > reward ? `, đã lưu ${formatGameNumber(reward)} vào Đan điền/thanh tu vi.` : ''} Hiện tại: ${formatGameNumber(playerCultivation)}/${formatGameNumber(getCultivationRequiredForNextLevel())}.`
    : 'Không nhận tu vi.');
  if (recovered) pushLog(`Dưỡng khí hồi ${recovered.hp} sinh lực và ${recovered.mana} linh lực.`);
  if (spiritStoneReward > 0) pushLog(`Rớt ${formatGameNumber(spiritStoneReward)} linh thạch.`);
  if (droppedItem) pushLog(`Nhặt được ${getDroppedRewardText(droppedItem)}.`);
  if (outcome === 'win' && isWanderBattle && !currentStage.isWanderBoss) {
    const rewardBonus = getEnemyRewardBonusPercent(currentStage);
    if (rewardBonus > 0) pushLog(`Phẩm chất kẻ địch tăng thưởng +${rewardBonus}%.`);
  }
  if (outcome === 'win' && isWanderBattle && currentStage.isWanderBoss) {
    pushLog(`Đã chinh phục Boss ${getCurrentWanderMap().name}.`);
  }
  if (bonusRewardText) pushLog(`Nhận ${bonusRewardText}. Căn cơ hiện tại: ${playerFoundation}.`);
  if (playerCultivation >= getCultivationRequiredForNextLevel()) {
    if (playerLevel >= getMinorRealmLevelCap() && hasNextMajorRealm() && getShopInventoryCount('majorAscensionPermit') <= 0) {
      pushLog(`Tu vi đã đầy, hãy mua Phá Cảnh Đan trong shop để thăng ${getNextMajorRealmName()}.`);
    } else if (canBreakthrough()) {
      pushLog(playerLevel >= getMinorRealmLevelCap()
        ? `Tu vi đã đầy, có thể thăng ${getNextMajorRealmName()}.`
        : `Tu vi đã đầy, có thể đột phá ${getMinorRealmName(playerLevel + 1)}.`);
    }
  }
  renderCultivation();
  saveGame();
}

function renderBattleResult(message, outcome, reward, spiritStoneReward, droppedItem, bonusRewardText = '', cultivationAward = reward) {
  const nextStage = getNextBattleStage();
  const config = getDungeonConfig();
  const resultTitle = outcome === 'win' ? 'Thắng lợi' : outcome === 'draw' ? 'Hòa' : 'Thất bại';
  const resultIcon = outcome === 'win' ? 'icon-item-victory' : outcome === 'draw' ? 'icon-unique-draw' : 'icon-item-defeat';
  const itemText = droppedItem
    ? getDroppedRewardText(droppedItem)
    : 'Không rơi trang bị';
  const displayedCultivation = Number(cultivationAward) || 0;
  const storedCultivationNote = displayedCultivation > Number(reward || 0)
    ? ` (đã lưu +${formatGameNumber(reward)} vào Đan điền/thanh tu vi)`
    : '';
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
    <em>Tu vi nhận +${formatGameNumber(displayedCultivation)}${storedCultivationNote} | Rớt linh thạch +${formatGameNumber(spiritStoneReward)} | ${bonusRewardText || itemText}</em>
    <small>Tiếp theo: ${nextText}</small>
    <button type="button" class="breakthrough compact">${getPostBattleButtonText(outcome)}</button>
  `;

  battleResult.querySelector('button').addEventListener('click', () => {
    battleResult.classList.add('is-hidden');
    returnFromBattleScreen();
  });
  battleResultTimer = window.setTimeout(() => {
    if (!battleOver || battleResult.classList.contains('is-hidden')) return;
    battleResult.classList.add('is-hidden');
    returnFromBattleScreen();
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
  return 'Thoát';
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
  if (playerCultivation >= required && dantianCultivation >= getDantianCultivationCap()) return 0;
  const beforeTotal = playerCultivation + dantianCultivation;
  const progressGain = Math.min(gain, Math.max(0, required - playerCultivation));
  playerCultivation += progressGain;
  dantianCultivation += gain - progressGain;
  clampDantianCultivation();
  transferDantianCultivationToBar();
  return Math.max(0, playerCultivation + dantianCultivation - beforeTotal);
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
    cultivationMultiplier: (map.rewardSettings?.cultivationMultiplier
      ?? config.cultivationMultiplier
      ?? 1) * cultivationRewardMultiplier,
    spiritStoneBonus: Math.max(0, Number(map.rewardSettings?.spiritStoneBonus) || 0),
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
  return Math.max(1, Math.round(rollWanderRewardBase('cultivation') * settings.cultivationMultiplier));
}

function getWanderSpiritStoneAmount(stage, settings = getRewardSettings(stage)) {
  return Math.max(1, Math.round(rollWanderRewardBase('spiritStone') + settings.spiritStoneBonus));
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

  const enemyCultivation = getStageDifficulty(stage);
  const baseCultivation = rollWanderRewardBase('cultivation');
  const multiplier = getRewardSettings(stage).cultivationMultiplier * getEnemyRewardMultiplier(stage);

  return Math.round((baseCultivation + enemyCultivation / 2) * multiplier);
}

function getEnemyRewardMultiplier(stage = currentStage) {
  const rankLevel = clamp(Math.floor(Number(stage?.enemyRankLevel) || 1), 1, 5);
  return 1 + ((rankLevel - 1) * 0.1);
}

function getEnemyRewardBonusPercent(stage = currentStage) {
  return Math.round((getEnemyRewardMultiplier(stage) - 1) * 100);
}

function getSpiritStoneDropRange(stage = currentStage) {
  const enemyCultivation = getStageDifficulty(stage);
  const [minBase, maxBase] = getWanderRewardBaseRange('spiritStone');
  const multiplier = getRewardSettings(stage).cultivationMultiplier * getEnemyRewardMultiplier(stage);
  return {
    min: Math.max(1, Math.round((minBase + enemyCultivation / 4) * multiplier)),
    max: Math.max(1, Math.round((maxBase + enemyCultivation / 4) * multiplier)),
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
  const enemyCultivation = getStageDifficulty(currentStage);
  const baseDrop = rollWanderRewardBase('spiritStone');
  const multiplier = getRewardSettings(currentStage).cultivationMultiplier * getEnemyRewardMultiplier(currentStage);
  const reward = Math.max(1, Math.round((baseDrop + enemyCultivation / 4) * multiplier));
  const bonus = player?.spiritStoneBonus || 0;
  return Math.round(reward * (1 + bonus));
}

function breakthrough() {
  if (busy || !canBreakthrough()) return;

  if (playerLevel >= getMinorRealmLevelCap()) {
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
  pushLog(`Đột phá thành công: ${getCurrentRealmText()}.`);
  showGameToast(`Đột phá thành công: ${getCurrentRealmText()}.`, 'success');
  saveGame();
}

function canBreakthrough() {
  if (playerCultivation < getCultivationRequiredForNextLevel()) return false;
  if (playerLevel < getMinorRealmLevelCap()) return true;
  return getShopInventoryCount('majorAscensionPermit') > 0 && hasNextMajorRealm();
}

function getCultivationRequiredForNextLevel() {
  const progression = cultivationProgression[playerMajorRealmIndex];
  if (!progression) return 0;
  if (playerLevel >= getMinorRealmLevelCap()) return progression.majorBreakthroughRequirement;
  return progression.minorBaseRequirement + (playerLevel - 1) * progression.minorStepRequirement;
}

function hasNextMajorRealm() {
  return playerMajorRealmIndex < majorRealmNames.length - 1;
}

function getNextMajorRealmName() {
  return majorRealmNames[Math.min(playerMajorRealmIndex + 1, majorRealmNames.length - 1)];
}

function getCurrentRealmText() {
  return `${majorRealmNames[playerMajorRealmIndex]} cảnh ${getMinorRealmName(playerLevel)}`;
}

function createEquipmentItem(slotId, level, rarityKey, options = {}) {
  const stats = options.stats || createEquipmentStats(slotId, level, rarityKey);
  return {
    id: equipmentIdSeed++,
    slotId,
    name: options.name || pickRandom(getEquipmentNamePool(slotId, level)),
    rarityKey,
    level,
    requiredLevel: Math.min(level, playerMaxMinorLevel),
    requiredTier: Math.max(1, Number(options.requiredTier) || getEquipmentRequiredTier(rarityKey, level)),
    enhancementLevel: 0,
    stats,
    baseStats: options.baseStats || { ...stats },
    specialLines: options.specialLines ?? createEquipmentSpecialLines(slotId, level, rarityKey),
  };
}

function createEquipmentLikeItem(slotId, level, rarityKey) {
  const stats = createEquipmentStats(slotId, level, rarityKey);
  return {
    id: 0,
    slotId,
    name: pickRandom(getEquipmentNamePool(slotId, level)),
    rarityKey,
    level,
    requiredLevel: Math.min(level, playerMaxMinorLevel),
    requiredTier: getEquipmentRequiredTier(rarityKey, level),
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
  const chance = Math.min(1, settings.equipmentDropChance * getEnemyRewardMultiplier(currentStage));
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

    if (['cultivation', 'foundation', 'ascension', 'skillChest'].includes(shopItem.type)) {
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
  if (shopItem.type === 'skillChest' && !getSkillChestSkills(shopItem).length) return false;
  if (shopItem.type === 'skillChest'
    && getPlayerCultivationTier() < Math.max(1, Number(shopItem.requiredTier) || 1)) return false;
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
  if (className === 'skill-name') {
    const label = document.createElement('span');
    label.textContent = text;
    el.appendChild(label);
  } else {
    el.textContent = text;
  }
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
    const enemyData = currentStage?.enemyData || {};
    const visual = getEnemyVisualStyle(enemyData);
    enemyAvatar.classList.add('chibi-enemy', getEnemyVisualClass(enemyData));
    enemyAvatar.style.backgroundImage = visual.image ? `url("${visual.image}")` : 'none';
    enemyAvatar.style.backgroundPosition = visual.position;
    enemyAvatar.style.backgroundSize = visual.size;
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
  if (playerLevel < getMinorRealmLevelCap()) return 'Đột phá';
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
    if (effect.type === 'selfBuff' || effect.type === 'percentBuff') {
      const value = Number(effect.value) || 0;
      const isPercentBuff = effect.type === 'percentBuff';
      const amount = isPercentBuff || isPercentStat(effect.stat) ? toPercent(value) : formatGameNumber(value);
      const nonStackingText = effect.nonStacking ? ', không cộng dồn' : '';
      return `${chanceText}tăng ${getStatLabel(effect.stat)} +${amount} trong ${effect.duration || 1} lượt${nonStackingText}`;
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
  const skills = getPlayerSkills()
    .filter((skill) => isSkillLearned(skill.id))
    .sort((left, right) => {
      const leftIndex = equippedSkillIds.indexOf(left.id);
      const rightIndex = equippedSkillIds.indexOf(right.id);
      if (leftIndex >= 0 && rightIndex < 0) return -1;
      if (leftIndex < 0 && rightIndex >= 0) return 1;
      if (leftIndex >= 0 && rightIndex >= 0) return leftIndex - rightIndex;
      return 0;
    });
  const maxEquipped = getMaxEquippedSkills();
  $('skillSlotText').textContent = `Ô skill: ${equippedSkillIds.length}/${maxEquipped}`;
  $('skillPowerText').textContent = `LC skill: ${formatGameNumber(getEquippedSkillCombatPower(skills.filter((skill) => equippedSkillIds.includes(skill.id))))}`;
  $('skillsList').innerHTML = skills.length ? skills.map((skill) => {
    const equipped = equippedSkillIds.includes(skill.id);
    const level = getSkillLevel(skill.id);
    const maxLevel = getSkillMaxLevel();
    const nextLevel = level + 1;
    const bookCount = getSkillBookCount(skill.id);
    const bookRequirement = getSkillBookRequirement(skill, nextLevel);
    const bookRequired = bookRequirement.total;
    const skillPower = getSkillCombatPower(skill, level);
    const practice = getSkillPractice(skill.id);
    const practiceRequired = getSkillPracticeRequired(skill, nextLevel);
    const practicePercent = getSkillPracticePercent(skill, practice);
    const practiceReady = level < maxLevel && practice >= practiceRequired;
    const bookReady = !bookRequired || bookCount >= bookRequired;
    const canUpgrade = level < maxLevel && practiceReady && bookReady;
    const upgradeText = bookRequired
      ? `Nâng cấp · ${bookRequirement.levelBooks} cấp + ${bookRequirement.gradeBooks} phẩm chất = ${bookRequired} sách`
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
  grantSkillLearningComprehension();
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
  const bookRequirement = getSkillBookRequirement(skill, targetLevel);
  const bookRequired = bookRequirement.total;
  if (getSkillPractice(skill.id) < practiceRequired) {
    $('skillsMessage').textContent = `Cần tu luyện ${skill.name} đạt ${practiceRequired} trước.`;
    showGameToast(`Chưa đủ tiến độ để nâng ${skill.name}.`, 'error');
    return;
  }
  if (getSkillBookCount(skill.id) < bookRequired) {
    $('skillsMessage').textContent = `Cần ${bookRequirement.levelBooks} sách cấp độ + ${bookRequirement.gradeBooks} sách phẩm chất = ${bookRequired} sách ${skill.name} để mở cấp ${targetLevel}.`;
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

function getBaseEquipmentStats(item) {
  const storedBase = item?.baseStats && typeof item.baseStats === 'object'
    ? Object.fromEntries(Object.entries(item.baseStats).filter(([stat]) => stat !== 'blockReduction'))
    : null;
  if (storedBase && Object.keys(storedBase).length) return storedBase;

  const levels = Math.max(0, Math.floor(Number(item?.enhancementLevel) || 0));
  const stats = Object.fromEntries(Object.entries(item?.stats || {}));
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
          ${renderEquippedEquipmentSummary(item, getSlotName(item.slotId), { showStats: false, showSpecials: false })}
          <div class="enhancement-stat-list">${formatEnhancementStats(item)}</div>
          <div class="enhancement-cost-grid">
            <span><i class="item-icon icon-item-enhancement-stone" aria-hidden="true"></i><b>${formatGameNumber(stoneCost)}</b> đá</span>
            <span><i class="game-icon icon-hammer" aria-hidden="true"></i><b>+${formatGameNumber(currentLevel)}/${formatGameNumber(qualityMax)}</b></span>
            <span><i class="unique-icon icon-unique-spirit-stone" aria-hidden="true"></i><b>${formatGameNumber(cost)}</b></span>
            <span><i class="stat-icon icon-stat-reward" aria-hidden="true"></i><b>${toPercent(successRate)}</b></span>
          </div>
          <button type="button" class="secondary compact enhancement-action-button" data-enhance-item="${item.id}" ${canEnhance ? '' : 'disabled'}>
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
    || stageEnemyData[stageEnemyData.length - 1];
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
  if (item.type === 'skillBook' || item.type === 'skillChest') return 'skill';
  if (item.type === 'cultivation' || item.type === 'foundation' || item.type === 'ascension') return 'cultivation';
  if (item.type === 'potion') return 'consumable';
  return 'material';
}

function getShopItemIconClass(item) {
  if (item.type === 'skillBook') return getSkillItemIconClass(item.skillId);
  if (item.type === 'skillChest') return 'icon-activity-chest';
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
  const lockedByTier = ['skillBook', 'skillChest'].includes(item.type)
    && getPlayerCultivationTier() < skillRequiredTier;
  if (lockedByMap) return `Cần mở ${wanderMaps[item.requiredMapId]?.name || 'map yêu cầu'}`;
  if (lockedByTier) return `Yêu cầu ${getTierRealmText(skillRequiredTier)}`;
  if (lockedByRealm) return `Yêu cầu ${majorRealmNames[item.requiredMajorRealmIndex]}`;
  if (lockedByLevel) return `Yêu cầu ${getMinorRealmName(item.requiredLevel)}`;
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
  if (item.type === 'skillBook') return 'Giá bán bằng 1/4 giá gốc, làm tròn đến linh thạch gần nhất.';
  if (item.type === 'skillChest') return 'Giá cố định; mỗi rương mở ra mảnh skill hoặc sách skill.';
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
  if (item.type === 'skillChest') {
    const candidates = getSkillChestSkills(item);
    const skillNames = candidates.length
      ? candidates.map((skill) => skill.name).join(', ')
      : 'skill của phái hiện tại';
    const fragmentChance = Math.round((Number(item.fragmentChance) || 0.9) * 100);
    const bookChance = Math.round((Number(item.bookChance) || 0.1) * 100);
    lines.push(`Phẩm chất: ${getSkillGradeName({ gradeId: item.gradeId })}.`);
    lines.push(`Mỗi lần mở: ${fragmentChance}% nhận 1 mảnh skill, ${bookChance}% nhận 1 sách skill.`);
    lines.push(`Skill có thể nhận: ${skillNames}.`);
    lines.push('Đủ 5 mảnh của cùng một skill sẽ tự ghép thành 1 sách trong Túi đồ.');
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
    const lockedByTier = ['skillBook', 'skillChest'].includes(item.type)
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
        : `Yêu cầu ${getMinorRealmName(item.requiredLevel)}`
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
      usable: false,
    },
    {
      id: 'mana-potion',
      name: 'Tụ Linh Đan',
      category: 'Tiêu hao',
      count: manaPotionCount,
      iconClass: 'item-icon icon-item-mana-flame',
      description: 'Hồi phục 25% MP mỗi lần dùng.',
      usable: false,
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
    .filter((shopItem) => ['cultivation', 'foundation', 'ascension', 'skillChest'].includes(shopItem.type))
    .forEach((shopItem) => {
      const count = getShopInventoryCount(shopItem.id);
      if (count <= 0) return;
      const category = shopItem.type === 'skillChest'
        ? 'Rương skill'
        : shopItem.type === 'ascension'
        ? 'Đột phá'
        : shopItem.type === 'foundation'
        ? 'Tu luyện'
        : 'Tu vi';
      items.push({
        id: `shop-item-${shopItem.id}`,
        shopItemId: shopItem.id,
        name: shopItem.name,
        category,
        count,
        iconClass: getShopItemBagIconClass(shopItem),
        description: shopItem.description || getShopItemDetailLines(shopItem).join(' '),
        usable: shopItem.type !== 'ascension',
        useLabel: shopItem.type === 'skillChest' ? 'Mở' : shopItem.type === 'ascension' ? '' : 'Dùng',
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

  Object.entries(skillFragments).forEach(([skillId, count]) => {
    const skill = cultivationSkills.find((entry) => entry.id === skillId);
    const safeCount = getSkillFragmentCount(skillId);
    if (!skill || safeCount <= 0) return;
    items.push({
      id: `skill-fragment-${skillId}`,
      name: `Mảnh skill: ${skill.name}`,
      category: 'Mảnh skill',
      count: safeCount,
      iconClass: `item-icon ${getSkillItemIconClass(skillId)}`,
      description: `Mảnh dùng để ghép sách skill ${skill.name}.`,
      usable: false,
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
  grantSkillLearningComprehension();
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
  if (item.category === 'Mảnh skill') {
    const skillId = String(item.id).replace(/^skill-fragment-/, '');
    const skill = cultivationSkills.find((entry) => entry.id === skillId);
    if (skill) details.push(`Đủ 5 mảnh sẽ tự ghép thành 1 sách skill ${skill.name}.`);
  }
  if (item.shopItemId) {
    const shopItem = shopItems.find((entry) => entry.id === item.shopItemId);
    if (shopItem?.type === 'cultivation') details.push(`Nhận ${formatGameNumber(shopItem.cultivation)} tu vi khi dùng.`);
    if (shopItem?.type === 'foundation') details.push(`Nhận ${formatGameNumber(getFoundationPillAmount(shopItem))} căn cơ khi dùng.`);
    if (shopItem?.type === 'ascension') details.push('Chỉ dùng tại nút thăng đại cảnh giới tiếp theo.');
    if (shopItem?.type === 'skillChest') details.push('Mở rương để nhận 1 mảnh skill hoặc 1 sách skill theo tỉ lệ của rương.');
  }
  if (item.category === 'Rương') details.push(`Có thể mở nhiều rương cùng lúc; mỗi lần mở tạo một trang bị.`);
  if (item.category === 'Rương skill') details.push(`Có thể mở nhiều rương cùng lúc; đủ 5 mảnh của cùng skill sẽ tự ghép thành 1 sách.`);
  return details;
}

function usePurchasedShopItem(item, amount = 1) {
  const shopItem = shopItems.find((entry) => entry.id === item.shopItemId);
  if (!shopItem) return 0;
  const requested = Math.max(1, Math.floor(Number(amount) || 1));
  let used = 0;
  const skillChestRewards = [];

  for (let index = 0; index < requested; index += 1) {
    if (getShopInventoryCount(shopItem.id) <= 0) break;
    let canUse = true;
    if (shopItem.type === 'cultivation') {
      canUse = addPlayerCultivation(shopItem.cultivation) > 0;
    } else if (shopItem.type === 'foundation') {
      playerFoundation += getFoundationPillAmount(shopItem);
    } else if (shopItem.type === 'ascension') {
      canUse = false;
    } else if (shopItem.type === 'skillChest') {
      const reward = openSkillChest(shopItem);
      canUse = Boolean(reward);
      if (reward) skillChestRewards.push(reward);
    }
    if (!canUse) break;
    shopInventoryCounts[shopItem.id] = getShopInventoryCount(shopItem.id) - 1;
    used += 1;
  }

  if (!used) return 0;
  if (shopItem.type === 'skillChest') {
    const bookRewards = skillChestRewards.filter((reward) => reward.kind === 'book').length;
    const fragmentRewards = skillChestRewards.filter((reward) => reward.kind === 'fragment').length;
    const completedBooks = skillChestRewards.reduce((total, reward) => total + reward.completedBooks, 0);
    const rewardParts = [];
    if (fragmentRewards) rewardParts.push(`${fragmentRewards} mảnh skill`);
    if (bookRewards) rewardParts.push(`${bookRewards} sách skill`);
    if (completedBooks) rewardParts.push(`ghép ${completedBooks} sách skill`);
    showGameToast(`Đã mở ${shopItem.name}${used > 1 ? ` x${used}` : ''}: ${rewardParts.join(', ')}.`, 'success');
  } else {
    showGameToast(`Đã dùng ${shopItem.name}${used > 1 ? ` x${used}` : ''}.`, 'success');
  }
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
    ${renderEquipmentSpecials(item.specialLines)}
  `;
}

function renderEquippedEquipmentSummary(item, slotName, options = {}) {
  const enhancementLevel = Number(item.enhancementLevel) || 0;
  const enhancementMax = getEquipmentEnhancementQualityMax(item);
  const iconClass = getEquipmentIconClass(item.slotId);
  const iconType = iconClass.startsWith('icon-unique-') ? 'unique-icon' : 'item-icon';
  const specialMarkup = renderEquipmentSpecials(item.specialLines || []);
  return `
    <div class="equipped-equipment-summary">
      <div class="equipped-equipment-heading"><span>${slotName}</span><b>LC +${formatGameNumber(getItemPower(item))}</b></div>
      <div class="equipped-equipment-name">
        <span class="equipped-equipment-visual"><i class="${iconType} ${iconClass}" aria-hidden="true"></i><em>Cấp ${formatGameNumber(item.level)}</em></span>
        <span class="equipped-equipment-name-copy"><strong>${item.name}</strong><b>+${formatGameNumber(enhancementLevel)}/${formatGameNumber(enhancementMax)}</b></span>
      </div>
      ${options.showStats !== false && formatItemStats(item.stats) ? `<div class="equipped-equipment-stats">${formatItemStats(item.stats)}</div>` : ''}
      ${options.showSpecials !== false ? specialMarkup : ''}
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
    <strong class="combat-power">Lực chiến ${formatGameNumber(Number.isFinite(Number(fighter.displayCombatPower)) ? fighter.displayCombatPower : (Number.isFinite(Number(fighter.combatPower)) ? fighter.combatPower : getCombatPower(fighter)))}</strong>
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
  el.classList.toggle('ready', ready);
  el.classList.toggle('waiting', !ready);
  el.setAttribute('aria-label', skillLabels.map((skill) => skill.label).join(' · '));
  el.innerHTML = `
    <span class="skill-status-icons">${skillLabels.map((skill) => skill.markup).join('')}</span>
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
