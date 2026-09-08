// Daily player battle activity. Opponents are local player-like profiles for the MVP.
const playerBattleOpponentTemplates = Object.freeze([
  { name: 'Lạc Thanh Vân', schoolId: 'sword_cultivator', combatStyle: 'counter' },
  { name: 'Hạ Trường Phong', schoolId: 'blade_cultivator', combatStyle: 'berserker' },
  { name: 'Mộ Dung Tuyết', schoolId: 'sword_cultivator', combatStyle: 'defense' },
  { name: 'Tần Liệt Dương', schoolId: 'blade_cultivator', combatStyle: 'predator' },
  { name: 'Cố Nguyệt Dao', schoolId: 'sword_cultivator', combatStyle: 'heal' },
  { name: 'Ninh Vô Trần', schoolId: 'blade_cultivator', combatStyle: 'counter' },
]);

let npcPlayerBattleOpponents = [];
let npcPlayerBattleOpponentsPromise = null;

function loadNpcPlayerBattleOpponents() {
  if (npcPlayerBattleOpponentsPromise) return npcPlayerBattleOpponentsPromise;
  npcPlayerBattleOpponentsPromise = fetch('/api/npc?action=opponents', { cache: 'no-store' })
    .then((response) => response.ok ? response.json() : null)
    .then((payload) => {
      npcPlayerBattleOpponents = Array.isArray(payload?.opponents) ? payload.opponents : [];
      if (npcPlayerBattleOpponents.length && typeof activeActivityTab !== 'undefined' && activeActivityTab === 'playerBattle') {
        renderActivities('playerBattle');
      }
      return npcPlayerBattleOpponents;
    })
    .catch(() => {
      npcPlayerBattleOpponents = [];
      return npcPlayerBattleOpponents;
    });
  return npcPlayerBattleOpponentsPromise;
}

function getPlayerBattleConfig() {
  return gameConfig.gameplay?.playerBattle && typeof gameConfig.gameplay.playerBattle === 'object'
    ? gameConfig.gameplay.playerBattle
    : {};
}

function isPlayerBattleInDevelopment() {
  const config = getPlayerBattleConfig();
  return config.enabled === false || config.status === 'development';
}

function getPlayerBattleDailyLimit() {
  return Math.max(1, Math.floor(Number(getPlayerBattleConfig().dailyBattleLimit) || 3));
}

function getPlayerBattleRerollLimit() {
  return Math.max(0, Math.floor(Number(getPlayerBattleConfig().dailyRerollLimit) || 5));
}

function getPlayerBattleStealRate() {
  return Math.max(0, Math.min(1, Number(getPlayerBattleConfig().stealRate) || 0.1));
}

function createDefaultPlayerBattleState() {
  return {
    date: getDailyKey(),
    battleCount: 0,
    rerollCount: 0,
    searchIndex: 0,
    opponent: null,
    lastResult: null,
    lastSettledBattleId: '',
  };
}

function normalizePlayerBattleState(state = {}) {
  const today = getDailyKey();
  if (!state || state.date !== today) return createDefaultPlayerBattleState();
  return {
    ...createDefaultPlayerBattleState(),
    ...state,
    date: today,
    battleCount: Math.max(0, Math.floor(Number(state.battleCount) || 0)),
    rerollCount: Math.max(0, Math.floor(Number(state.rerollCount) || 0)),
    searchIndex: Math.max(0, Math.floor(Number(state.searchIndex) || 0)),
    opponent: state.opponent && typeof state.opponent === 'object' ? state.opponent : null,
    lastResult: state.lastResult && typeof state.lastResult === 'object' ? state.lastResult : null,
    lastSettledBattleId: String(state.lastSettledBattleId || ''),
  };
}

function ensureDailyPlayerBattle() {
  playerBattleState = normalizePlayerBattleState(playerBattleState);
  return playerBattleState;
}

function getPlayerBattleSkillIds(schoolId, tier) {
  const available = cultivationSkills
    .filter((skill) => skill.schoolId === schoolId)
    .filter((skill) => getSkillRequiredTier(skill) <= tier);
  const source = available.length ? available : cultivationSkills.filter((skill) => skill.schoolId === schoolId);
  return source.slice(0, 3).map((skill) => skill.id);
}

function createPlayerBattleOpponent(searchIndex = 0) {
  const index = Math.max(0, Math.floor(Number(searchIndex) || 0));
  const template = playerBattleOpponentTemplates[index % playerBattleOpponentTemplates.length];
  const npc = npcPlayerBattleOpponents.length
    ? npcPlayerBattleOpponents[index % npcPlayerBattleOpponents.length]
    : null;
  const opponentMajorRealmIndex = npc ? Math.max(0, Number(npc.majorRealmIndex) || 0) : playerMajorRealmIndex;
  const tier = npc ? Math.max(1, Number(npc.tier) || 1) : getPlayerCultivationTier();
  const levelShift = [-1, 0, 1, 0, -2, 1][index % 6] || 0;
  const level = npc
    ? clamp(Number(npc.level) || 1, 1, getMinorRealmLevelCap(opponentMajorRealmIndex))
    : clamp(playerLevel + levelShift, 1, getMinorRealmLevelCap(playerMajorRealmIndex));
  const reference = createFighter('__player_battle_reference__', level, true, opponentMajorRealmIndex, false);
  const powerMultiplier = npc
    ? clamp((Number(npc.power) || getCombatPower(reference)) / Math.max(1, getCombatPower(reference)), 0.65, 1.8)
    : 0.86 + ((index * 17) % 27) / 100;
  const statKeys = [
    'maxHp', 'maxMana', 'attack', 'defense', 'mastery', 'accuracy', 'dodgeRate',
    'blockRate', 'critRate', 'critDamage', 'armorPierce', 'damageReduction',
    'healingReduction', 'lifeSteal', 'luck', 'spiritSense', 'comprehension',
  ];
  const stats = Object.fromEntries(statKeys.map((stat) => {
    const value = Math.max(0, Number(reference[stat]) || 0);
    const scaled = ['accuracy', 'dodgeRate', 'blockRate', 'critRate', 'critDamage', 'armorPierce', 'damageReduction', 'healingReduction', 'lifeSteal'].includes(stat)
      ? value * (0.96 + ((index * 11) % 9) / 100)
      : value * powerMultiplier;
    return [stat, stat === 'critDamage' ? Math.max(1.5, scaled) : Math.max(0, Math.round(scaled))];
  }));
  const opponentSchoolId = npc?.schoolId || template.schoolId;
  const skillIds = getPlayerBattleSkillIds(opponentSchoolId, tier);
  const runtimeSkills = skillIds
    .map((skillId) => cultivationSkills.find((skill) => skill.id === skillId))
    .filter(Boolean)
    .map((skill) => createSkillRuntime(skill));
  const combatPower = getCombatPower({ ...stats, skills: runtimeSkills, specialBonuses: {} });
  const stoneMultiplier = 0.55 + ((index * 23) % 71) / 100;
  const spiritStones = Math.max(500, Math.round(Math.max(0, Number(playerSpiritStones) || 0) * stoneMultiplier));
  return {
    id: npc?.id ? `npc-${npc.id}` : `${getDailyKey()}-${index}`,
    name: npc?.name || template.name,
    schoolId: opponentSchoolId,
    schoolName: cultivationSchools.find((school) => school.id === opponentSchoolId)?.name || 'Tu sĩ',
    combatStyle: npc?.personality === 'aggressive' ? 'berserker' : npc?.personality === 'cautious' ? 'defense' : template.combatStyle,
    majorRealmIndex: opponentMajorRealmIndex,
    level,
    tier: npc ? tier : getCultivationTier(playerMajorRealmIndex, level),
    realmText: getTierRealmText(npc ? tier : getCultivationTier(playerMajorRealmIndex, level)),
    spiritStones: npc ? Math.max(0, Number(npc.spiritStones) || 0) : spiritStones,
    skillIds,
    stats,
    combatPower,
    battleId: `player-battle-${getDailyKey()}-${index}`,
  };
}

function getCurrentPlayerBattleOpponent() {
  ensureDailyPlayerBattle();
  return playerBattleState.opponent;
}

function ensurePlayerBattleOpponent() {
  ensureDailyPlayerBattle();
  if (playerBattleState.opponent || playerBattleState.battleCount >= getPlayerBattleDailyLimit()) return false;
  playerBattleState.opponent = createPlayerBattleOpponent(playerBattleState.searchIndex);
  saveGame();
  return true;
}

function searchPlayerBattleOpponent(isReroll = false) {
  ensureDailyPlayerBattle();
  if (playerBattleState.battleCount >= getPlayerBattleDailyLimit()) return;
  if (isReroll) {
    if (playerBattleState.rerollCount >= getPlayerBattleRerollLimit()) {
      showGameToast('Hôm nay đã hết lượt đổi đối thủ.', 'error');
      return;
    }
    playerBattleState.rerollCount += 1;
  }
  playerBattleState.searchIndex += 1;
  playerBattleState.opponent = createPlayerBattleOpponent(playerBattleState.searchIndex);
  playerBattleState.lastResult = null;
  saveGame();
  renderActivities('playerBattle');
}

function getPlayerBattleStage() {
  const opponent = getCurrentPlayerBattleOpponent();
  if (!opponent) return null;
  const firstSkill = cultivationSkills.find((skill) => skill.id === opponent.skillIds?.[0]);
  return {
    id: opponent.battleId,
    isPlayerBattle: true,
    playerBattleId: opponent.battleId,
    playerBattleOpponent: opponent,
    title: 'Đấu pháp',
    realmText: opponent.realmText,
    enemyTier: opponent.tier,
    enemyLevel: opponent.level,
    enemyMajorRealmIndex: opponent.majorRealmIndex,
    enemyData: {
      id: 'player-battle-opponent',
      name: opponent.name,
      skillName: firstSkill?.name || 'Đòn đánh thường',
      skillDescription: `Đối thủ ${opponent.schoolName}, đang dùng ${opponent.skillIds?.length || 0} skill.`,
      combatStyle: opponent.combatStyle,
    },
  };
}

function createPlayerBattleOpponentFighter(opponent = {}) {
  const fighter = createFighter(
    opponent.name || 'Đối thủ',
    opponent.level || 1,
    false,
    opponent.majorRealmIndex || 0,
    false,
  );
  Object.assign(fighter, opponent.stats || {});
  fighter.name = opponent.name || 'Đối thủ';
  fighter.isPlayerFighter = false;
  fighter.schoolId = opponent.schoolId || '';
  fighter.specialBonuses = {};
  fighter.skills = (opponent.skillIds || [])
    .map((skillId) => cultivationSkills.find((skill) => skill.id === skillId))
    .filter(Boolean)
    .map((skill) => createSkillRuntime(skill));
  const selectedSkill = fighter.skills[0];
  fighter.skillName = selectedSkill?.name || 'Đòn đánh thường';
  fighter.skillCost = selectedSkill?.cost || 0;
  fighter.skillMultiplier = selectedSkill?.multiplier || 1;
  fighter.skillCooldown = selectedSkill?.cooldown || 1;
  applyEnemyCombatStyle(fighter, { combatStyle: opponent.combatStyle || 'counter' });
  fighter.displayCombatPower = Number(opponent.combatPower) || getCombatPower(fighter);
  return finalizeEnemyFighter(fighter);
}

function getPlayerBattleStealAmount(opponent = {}) {
  return Math.max(0, Math.floor((Number(opponent.spiritStones) || 0) * getPlayerBattleStealRate()));
}

function settlePlayerBattleResult(outcome) {
  ensureDailyPlayerBattle();
  const stage = currentStage?.isPlayerBattle ? currentStage : null;
  const opponent = stage?.playerBattleOpponent || playerBattleState.opponent;
  if (!stage || !opponent || playerBattleState.lastSettledBattleId === stage.playerBattleId) {
    return { stolen: 0, opponent };
  }
  const stolen = outcome === 'win' ? getPlayerBattleStealAmount(opponent) : 0;
  if (stolen > 0) playerSpiritStones += stolen;
  playerBattleState.battleCount += 1;
  playerBattleState.lastSettledBattleId = stage.playerBattleId;
  playerBattleState.lastResult = {
    outcome,
    opponentName: opponent.name,
    stolen,
  };
  playerBattleState.opponent = null;
  return { stolen, opponent };
}

function startPlayerBattle() {
  ensureDailyPlayerBattle();
  if (busy) return;
  if (playerBattleState.battleCount >= getPlayerBattleDailyLimit()) {
    showGameToast('Hôm nay đã hết lượt đấu.', 'error');
    return;
  }
  if (!playerBattleState.opponent) ensurePlayerBattleOpponent();
  const stage = getPlayerBattleStage();
  if (!stage) return;
  startStageBattle(stage);
}

function formatPlayerBattleSkills(opponent) {
  const skills = (opponent?.skillIds || [])
    .map((skillId) => cultivationSkills.find((skill) => skill.id === skillId))
    .filter(Boolean);
  return skills.length
    ? skills.map((skill) => `<span><i class="activity-icon icon-activity-skill" aria-hidden="true"></i>${escapeMailHtml(skill.name)}</span>`).join('')
    : '<span>Chưa có skill</span>';
}

function renderPlayerBattleActivity() {
  const list = $('activityList');
  const summary = $('activitySummary');
  if (!list) return;
  loadNpcPlayerBattleOpponents();
  ensureDailyPlayerBattle();
  ensurePlayerBattleOpponent();
  const config = getPlayerBattleConfig();
  const dailyLimit = getPlayerBattleDailyLimit();
  const rerollLimit = getPlayerBattleRerollLimit();
  const opponent = playerBattleState.opponent;
  const remainingBattles = Math.max(0, dailyLimit - playerBattleState.battleCount);
  if (summary) summary.textContent = `Đấu người chơi mô phỏng · còn ${remainingBattles}/${dailyLimit} lượt hôm nay.`;
  if (!opponent) {
    const resultText = playerBattleState.lastResult
      ? playerBattleState.lastResult.outcome === 'win'
        ? `Đã thắng ${playerBattleState.lastResult.opponentName}, cướp ${formatGameNumber(playerBattleState.lastResult.stolen)} Linh thạch.`
        : `Đã thua ${playerBattleState.lastResult.opponentName}, không cướp được Linh thạch.`
      : remainingBattles <= 0 ? 'Hôm nay đã hết lượt đấu.' : 'Chưa có đối thủ đang chờ.';
    list.innerHTML = `
      <article class="activity-item player-battle-activity">
        <div class="activity-item-heading"><span><i class="game-icon icon-sword" aria-hidden="true"></i>Đấu pháp</span><strong>${formatGameNumber(playerBattleState.battleCount)}/${dailyLimit}</strong></div>
        <h3>Tìm người chơi</h3>
        <p>${resultText}</p>
        ${remainingBattles > 0 ? '<button type="button" class="breakthrough compact player-battle-search-button"><i class="game-icon icon-compass" aria-hidden="true"></i>Tìm đối thủ</button>' : ''}
      </article>
    `;
    list.querySelector('.player-battle-search-button')?.addEventListener('click', () => searchPlayerBattleOpponent());
    return;
  }
  const stealAmount = getPlayerBattleStealAmount(opponent);
  const canReroll = playerBattleState.rerollCount < rerollLimit;
  const skillNames = (opponent.skillIds || [])
    .map((skillId) => cultivationSkills.find((skill) => skill.id === skillId)?.name)
    .filter(Boolean);
  list.innerHTML = `
    <article class="activity-item player-battle-activity">
      <div class="activity-item-heading"><span><i class="game-icon icon-sword" aria-hidden="true"></i>Đấu pháp</span><strong>Còn ${remainingBattles}/${dailyLimit} lượt</strong></div>
      <h3>Đối thủ đã tìm thấy</h3>
      <div class="player-battle-opponent">
        <div class="player-battle-opponent-heading"><strong>${escapeMailHtml(opponent.name)}</strong><span>${escapeMailHtml(opponent.schoolName)}</span></div>
        <div class="player-battle-stats">
          <span><b>Tu vi</b><strong>${escapeMailHtml(opponent.realmText)}</strong></span>
          <span><b>Lực chiến</b><strong>${formatGameNumber(opponent.combatPower)}</strong></span>
          <span><b>Có thể cướp</b><strong>${formatGameNumber(stealAmount)} Linh thạch</strong></span>
        </div>
        <div class="player-battle-skills"><b>Skill đang trang bị</b><div>${formatPlayerBattleSkills(opponent)}</div></div>
      </div>
      <small>Thắng sẽ nhận ${formatGameNumber(stealAmount)} Linh thạch, tương đương ${Math.round(getPlayerBattleStealRate() * 100)}% số Linh thạch của đối thủ.</small>
      <div class="player-battle-actions">
        <button type="button" class="secondary compact player-battle-reroll-button" ${canReroll ? '' : 'disabled'}><i class="game-icon icon-reset" aria-hidden="true"></i>Đổi lại</button>
        <button type="button" class="breakthrough compact player-battle-start-button"><i class="game-icon icon-sword" aria-hidden="true"></i>Chiến đấu</button>
      </div>
      <small>Đã đổi ${playerBattleState.rerollCount}/${rerollLimit} lần hôm nay.</small>
    </article>
  `;
  setButtonDisabledState(list.querySelector('.player-battle-start-button'), busy, busy ? 'Trận đấu đang diễn ra.' : '');
  list.querySelector('.player-battle-reroll-button')?.addEventListener('click', () => searchPlayerBattleOpponent(true));
  list.querySelector('.player-battle-start-button')?.addEventListener('click', startPlayerBattle);
}
