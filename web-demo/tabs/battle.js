// Battle flow and result handlers. Shared state remains owned by main.js.
function startStageBattle(stage) {
  const isTrialTower = Boolean(stage?.isTrialTower);
  const isResourceDungeon = Boolean(stage?.isResourceDungeon);
  const isBeastHunt = Boolean(stage?.isBeastHunt);
  const isTrainingDummy = Boolean(stage?.isTrainingDummy);
  const isWorldBoss = Boolean(stage?.isWorldBoss);
  const isPlayerBattle = Boolean(stage?.isPlayerBattle);
  const config = isTrialTower || isResourceDungeon || isTrainingDummy || isWorldBoss || isPlayerBattle ? null : getDungeonConfig();
  if (!stage || (!isTrialTower && !isResourceDungeon && !isBeastHunt && !isTrainingDummy && !isWorldBoss && !isPlayerBattle && !isStageUnlockedForDungeon(stage, config.id))) return;
  if (isBeastHunt && (!canAccessBeastHunt() || stage.mapId !== beastHuntMapId)) return;
  if (isTrialTower && (stage.trialFloor !== trialTowerHighestCleared + 1 || !canEnterTrialTower())) return;
  if (isResourceDungeon) {
    const dungeon = getResourceDungeon(stage.resourceDungeonId);
    const expectedFloor = getResourceDungeonHighestFloor(stage.resourceDungeonId) + 1;
    if (!dungeon || stage.resourceDungeonFloor !== expectedFloor
      || getPlayerCultivationTier() < getResourceDungeonRequiredTier(dungeon, expectedFloor)
    || getRemainingResourceAttempts(stage.resourceDungeonId) <= 0) return;
  }
  if (!isTrialTower && !isTrainingDummy && !isPlayerBattle && !canEnterDungeon()) {
    renderCultivation();
    showTrainingMessage('Đang bị trọng thương, không thể ngao du tiếp.');
    showGameToast('Đang bị trọng thương, không thể bắt đầu trận đấu.', 'error');
    return;
  }
  if (!isTrialTower && !isResourceDungeon && !isBeastHunt && !isTrainingDummy && !isWorldBoss && !isPlayerBattle && !canRunDungeon(config.id)) {
    setSubtitle('');
    renderDungeonModes();
    renderStageDetail(stage);
    return;
  }
  if (isResourceDungeon) {
    if (!consumeResourceAttempt(stage.resourceDungeonId)) return;
  } else if (!isTrialTower && !isResourceDungeon && !isBeastHunt && !isTrainingDummy && !isWorldBoss && !isPlayerBattle) {
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
  const entryText = isBeastHunt
    ? 'Săn yêu vật'
    : isWorldBoss
    ? 'Boss thế giới'
    : isTrainingDummy
    ? 'Thử sát thương với Mộc nhân'
    : isTrialTower
    ? `Tiến vào tháp thí luyện ${stage.title}`
    : isResourceDungeon
    ? `Tiến vào ${stage.title}`
    : isPlayerBattle
    ? 'Đấu pháp với người chơi'
    : 'Bắt đầu ngao du';
  pushLog(`${entryText}. Gặp ${enemy.name}, ${formatRealmDisplayText(stage.realmText)}.`);
  if (isResourceDungeon) {
    const resourceDungeon = getResourceDungeon(stage.resourceDungeonId);
    pushLog(`${resourceDungeon?.name || 'Phụ bản'}: còn ${getRemainingResourceAttempts(stage.resourceDungeonId)}/${getResourceDungeonDailyLimit(resourceDungeon)} lượt riêng hôm nay.`);
  }
  if (!isTrialTower && !isResourceDungeon && !isBeastHunt && !isTrainingDummy && !isWorldBoss && !isPlayerBattle && !config.unlimited) pushLog(`${config.name}: còn ${getRemainingDungeonAttempts(config.id)}/${dailyFarmLimit} lượt hôm nay.`);
  if (isTrainingDummy) {
    pushLog(`Mộc nhân có ${formatGameNumber(enemy.maxHp)} sinh lực và không tấn công người chơi.`);
  } else if (isWorldBoss) {
    pushLog(`${enemy.name} thuộc ${formatRealmDisplayText(stage.realmText)}, sinh lực hiện tại ${formatGameNumber(enemy.hp)}/${formatGameNumber(enemy.maxHp)}.`);
  } else if (isPlayerBattle) {
    pushLog(`${enemy.name} dùng ${enemy.skillName}; người chơi ra đòn trước.`);
  } else {
    pushLog(`${enemy.name} dùng ${enemy.skillName} và có nội tại ${getCombatStyleLabel(stage.enemyData)}.`);
  }
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
  $('stageDetailRealm').textContent = `${getEnemyRankLabel(stage.enemyData, stage.enemyRankLevel)} | ${formatRealmDisplayText(stage.realmText)} | ${getCombatStyleLabel(stage.enemyData)} | ${stage.enemyData.skillName}`;
  $('stageDetailStats').innerHTML = `
    <div><span>Lực chiến</span><strong>${formatGameNumber(getCombatPower(preview))}</strong></div>
    <div><span>Công</span><strong>${formatGameNumber(preview.attack)}</strong></div>
    <div><span>Thủ</span><strong>${formatGameNumber(preview.defense)}</strong></div>
    <div><span>Chí mạng</span><strong>${toPercent(preview.critRate)}</strong></div>
    <div><span>Đỡ đòn</span><strong>${toPercent(preview.blockRate)}</strong></div>
  `;
  $('stageDetailRewards').textContent = `Thắng nhận ${formatGameNumber(winReward)} tu vi, rớt ${formatGameNumber(stoneDrop.min)}-${formatGameNumber(stoneDrop.max)} linh thạch và tiếp tục ngao du; thua thì về tu luyện.`;
  setButtonDisabledState(
    challengeStageButton,
    busy || !canEnterDungeon() || !canRunDungeon(config.id),
    busy ? 'Trận đấu đang diễn ra.' : !canEnterDungeon() ? 'Sinh lực chưa đủ để khiêu chiến.' : 'Chưa đủ điều kiện để khiêu chiến phụ bản.',
  );
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
  setButtonDisabledState(startButton, true, 'Trận đấu đang diễn ra.');
  startButton.textContent = 'Đang đấu';
  startButton.classList.add('is-hidden');
  battleResult.classList.add('is-hidden');
  pushLog('Đấu pháp bắt đầu.');
  if (enemy.combatStyleLabel) {
    pushLog(`${enemy.name} sở hữu nội tại ${enemy.combatStyleLabel}: ${enemy.combatStyleDescription}`);
  }
  pushLog(`${player.name} ra đòn trước.`);
  timer = window.setTimeout(playerTurn, 250);
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
    continueAutoWander();
  };

  if (canEnterDungeon()) {
    resume();
    return;
  }

  autoWanderRecoveryTimer = window.setTimeout(resume, 1000);
  saveGame();
}

function continueAutoWander() {
  if (!autoWanderEnabled || busy) return;
  if (!canEnterDungeon()) {
    autoWanderAfterRecovery = true;
    showTrainingMessage('Tự động ngao du đang hồi phục vì đạo hữu đã trọng thương.');
    scheduleAutoWanderAfterRecovery();
    return;
  }
  if (wanderChestRewards.length >= getWanderChestCapacity()) claimWanderChest();
  showMap();
  beginWander();
}

function getNextBattleStage() {
  if (currentStage?.isResourceDungeon || currentStage?.isPlayerBattle) return null;
  const config = getDungeonConfig();
  if (!currentStage) return null;
  if (!config.unlimited) return canRunDungeon(config.id) ? currentStage : null;
  if (currentStage.isAmbush || currentStage.isWanderGenerated) return getRandomWanderEnemyStage(getCurrentWanderMap());
  if (!completedStages.has(currentStage.id)) return currentStage;
  return stages.find((stage) => isStageUnlocked(stage) && !completedStages.has(stage.id)) || null;
}

function createStageEnemy(stage) {
  if (stage?.isPlayerBattle) return createPlayerBattleOpponentFighter(stage.playerBattleOpponent);
  if (stage?.isWorldBoss) {
    const boss = createFighter(
      stage.enemyData?.name || 'Thiên Ngoại Ma Tướng',
      1,
      false,
      stage.enemyMajorRealmIndex || 0,
      true,
    );
    applyEnemySkillRuntime(boss, stage.enemyData || {});
    applyEnemyCombatStyle(boss, stage.enemyData || {});
    applyEnemyRankMultiplier(boss, 3);
    boss.realm = stage.realmText || boss.realm;
    boss.minorRealm = getMinorRealmName(1, stage.enemyMajorRealmIndex || 0);
    boss.maxHp = Math.max(1, Math.floor(Number(stage.worldBossMaxHp) || 1000000000));
    const currentHp = Math.max(1, Math.min(boss.maxHp, Math.floor(Number(stage.worldBossCurrentHp) || boss.maxHp)));
    boss.displayCombatPower = boss.combatPower;
    const finalizedBoss = finalizeEnemyFighter(boss);
    finalizedBoss.hp = currentHp;
    return finalizedBoss;
  }
  if (stage?.isTrainingDummy) {
    const dummy = createFighter('Mộc nhân', 1, false, 0, true);
    dummy.maxHp = Math.max(1, Math.floor(Number(stage.dummyMaxHp) || getTrainingDummyMaxHp()));
    dummy.hp = dummy.maxHp;
    dummy.maxMana = 1;
    dummy.mana = 0;
    dummy.attack = 1;
    dummy.defense = 1;
    dummy.mastery = 1;
    dummy.accuracy = 0.1;
    dummy.dodgeRate = 0;
    dummy.blockRate = 0;
    dummy.critRate = 0;
    dummy.damageReduction = 0;
    dummy.skills = [];
    dummy.skillName = 'Không phản công';
    dummy.skillDescription = 'Mộc nhân không tấn công người chơi.';
    dummy.combatStyle = 'trainingDummy';
    dummy.combatStyleState = null;
    return finalizeEnemyFighter(dummy);
  }
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
  enemyFighter.dodgeRate = 0;
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
  const rankMultiplier = Number(rankStats.multiplier);
  if (Number.isFinite(rankMultiplier) && rankMultiplier > 0) {
    const scalableStats = [
      'maxHp', 'maxMana', 'attack', 'defense', 'mastery',
      'accuracy', 'dodgeRate', 'blockRate', 'critRate', 'critDamage',
      'armorPierce', 'damageReduction', 'healingReduction', 'lifeSteal',
      'luck', 'spiritSense', 'comprehension',
    ];
    applyEnemyStatMultipliers(
      fighter,
      Object.fromEntries(scalableStats.map((stat) => [stat, rankMultiplier])),
    );
    return;
  }
  const { label, ...multipliers } = rankStats;
  applyEnemyStatMultipliers(fighter, multipliers);
}

function finalizeEnemyFighter(fighter) {
  ['maxHp', 'maxMana', 'attack', 'defense', 'mastery'].forEach((stat) => {
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
  ['maxHp', 'maxMana', 'attack', 'defense', 'mastery'].forEach((stat) => {
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
    attackBoost: 0,
    accuracyBoost: 0,
    lifeStealBoost: 0,
  };
}

function getCombatStyleDefinition(styleId) {
  return combatStyles[styleId] || combatStyles.counter || {};
}

function getCombatStyleLabel(source = {}) {
  return source.combatStyleLabel || getCombatStyleDefinition(source.combatStyle).label || 'Phản đòn';
}

function playerTurn() {
  if (!busy || battleOver) return;
  const turnLimit = currentStage?.isTrainingDummy ? getTrainingDummyMaxTurns() : maxTurns;
  if (turn >= turnLimit) {
    if (currentStage?.isTrainingDummy) return finishBattle('Đã hoàn tất lượt thử sát thương.', 'win');
    if (currentStage?.isWorldBoss) return finishBattle('Đã hoàn tất 1 lượt đánh Boss thế giới.', 'draw');
    return finishByTurnLimit();
  }

  turn += 1;
  if (turn === 21) applyTurn20PowerBoost();
  tickBattleBuffs(player);
  const playerStatusEvents = tickBattleStatuses(player);
  playerStatusEvents.forEach((event) => pushLog(event));
  if (player.hp <= 0) return finishBattle(`${enemy.name} thắng nhờ hiệu ứng Xuất Huyết.`, 'lose');
  const result = attack(player, enemy);
  animateAttack('playerCard', 'enemyCard', 'enemyFloat', result, player);
  if (result.bonusHit) {
    window.setTimeout(() => animateAttack('playerCard', 'enemyCard', 'enemyFloat', result.bonusHit, player), battleSkillAnimationDuration);
  }
  render();
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

  if (currentStage?.isTrainingDummy) {
    trainingDummyDamageDealt += Math.max(0, Number(result.damage) || 0)
      + Math.max(0, Number(result.bonusHit?.damage) || 0);
    if (enemy.hp <= 0 || turn >= getTrainingDummyMaxTurns()) {
      return finishBattle(`Mộc nhân đã nhận ${formatGameNumber(trainingDummyDamageDealt)} sát thương.`, 'win');
    }
    timer = window.setTimeout(playerTurn, turnInterval * 0.5 + (result.skill ? battleEnemyTurnDelay : 0));
    return;
  }

  if (currentStage?.isWorldBoss) {
    worldBossDamageDealt += Math.max(0, Number(result.damage) || 0)
      + Math.max(0, Number(result.bonusHit?.damage) || 0);
    if (enemy.hp <= 0) return finishBattle(`Đã hạ Boss thế giới trong lượt đánh.`, 'win');
    if (turn >= maxTurns) return finishBattle('Đã hoàn tất 1 lượt đánh Boss thế giới.', 'draw');
    timer = window.setTimeout(playerTurn, turnInterval * 0.5 + (result.skill ? battleEnemyTurnDelay : 0));
    return;
  }

  if (player.hp <= 0) return finishBattle(`${enemy.name} thắng nhờ phản đòn.`, 'lose');
  if (enemy.hp <= 0) return finishBattle(`${player.name} thắng.`, 'win');
  timer = window.setTimeout(
    enemyTurn,
    turnInterval * 0.5 + (result.skill ? battleEnemyTurnDelay : 0),
  );
}

function applyTurn20PowerBoost() {
  if (battleTurn20BoostApplied || !player || !enemy) return;
  [player, enemy].forEach((fighter) => {
    fighter.attack = Math.max(0, Number(fighter.attack) || 0) * 2;
    fighter.mastery = Math.max(0, Number(fighter.mastery) || 0) * 2;
    fighter.combatPower = getCombatPower(fighter);
  });
  battleTurn20BoostApplied = true;
  pushLog('Sau lượt 20, Công và Tinh thông của cả hai bên tăng 100%.');
}

function enemyTurn() {
  if (!busy || battleOver) return;

  if (currentStage?.isTrainingDummy) {
    if (turn >= getTrainingDummyMaxTurns()) return finishBattle('Đã hoàn tất lượt thử sát thương.', 'win');
    timer = window.setTimeout(playerTurn, turnInterval * 0.5);
    return;
  }

  tickBattleBuffs(enemy);
  const enemyStatusEvents = tickBattleStatuses(enemy);
  enemyStatusEvents.forEach((event) => pushLog(event));
  if (enemy.hp <= 0) return finishBattle(`${player.name} thắng nhờ hiệu ứng Xuất Huyết.`, 'win');
  const passiveResult = applyEnemyCombatPassives(enemy);
  const result = attack(enemy, player);
  enemy.combatStyleState.critBoost = 0;
  animateAttack('enemyCard', 'playerCard', 'playerFloat', result, enemy);
  if (result.bonusHit) {
    window.setTimeout(() => animateAttack('enemyCard', 'playerCard', 'playerFloat', result.bonusHit, enemy), battleSkillAnimationDuration);
  }
  render();
  if (passiveResult.healAmount > 0) {
    pushLog(`${enemy.name} kích hoạt nội tại ${getCombatStyleLabel(enemy)}, hồi ${passiveResult.healAmount} sinh lực.`);
  }
  pushLog(formatAttackLog(enemy, result));

  if (player.hp <= 0) return finishBattle(`${enemy.name} thắng.`, 'lose');
  if (currentStage?.isWorldBoss && turn >= maxTurns) {
    return finishBattle('Đã hoàn tất 1 lượt đánh Boss thế giới.', 'draw');
  }
  if (turn >= maxTurns) return window.setTimeout(finishByTurnLimit, turnInterval * 0.5);

  timer = window.setTimeout(
    playerTurn,
    turnInterval + (result.skill ? battleEnemyTurnDelay : 0),
  );
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

function getBladeIntentStacks(fighter) {
  return Math.max(0, Math.floor(Number(fighter?.bladeIntentStacks) || 0));
}

function addBladeIntent(fighter, amount = 1, maxStacks = 5) {
  if (!fighter) return 0;
  const current = getBladeIntentStacks(fighter);
  const next = Math.min(Math.max(1, Math.floor(Number(maxStacks) || 5)), current + Math.max(0, Math.floor(Number(amount) || 0)));
  fighter.bladeIntentStacks = next;
  return next - current;
}

function consumeBladeIntent(fighter) {
  const stacks = getBladeIntentStacks(fighter);
  if (fighter) fighter.bladeIntentStacks = 0;
  return stacks;
}

function getSwordIntentConfig(skill) {
  if (skill?.schoolId !== 'sword_cultivator') return null;
  return skill.effects?.find((effect) => effect.type === 'swordIntent' && effect.action === 'gain') || null;
}

function getSwordIntentConsumeEffect(skill) {
  if (skill?.schoolId !== 'sword_cultivator') return null;
  return skill.effects?.find((effect) => effect.type === 'swordIntent' && effect.action === 'consumeCriticalBuff') || null;
}

function getSwordIntentStacks(fighter) {
  return Math.max(0, Math.floor(Number(fighter?.swordIntentStacks) || 0));
}

function consumeSwordIntent(fighter) {
  const stacks = getSwordIntentStacks(fighter);
  if (fighter) fighter.swordIntentStacks = 0;
  return stacks;
}

function addSwordIntent(fighter, amount = 1, maxStacks = 5) {
  if (!fighter) return 0;
  const current = getSwordIntentStacks(fighter);
  const next = Math.min(Math.max(1, Math.floor(Number(maxStacks) || 5)), current + Math.max(0, Math.floor(Number(amount) || 0)));
  fighter.swordIntentStacks = next;
  return next - current;
}

function applySwordIntentCriticalBuff(fighter, effect, stacks) {
  if (!fighter || !effect) return { critRate: 0, critDamage: 0 };
  const duration = Math.max(1, Math.floor(Number(effect.duration) || 1));
  const critRate = Math.max(0, Number(effect.critRate) || 0)
    + stacks * Math.max(0, Number(effect.critRatePerIntentStack) || 0);
  const critDamage = Math.max(0, Number(effect.critDamage) || 0)
    + stacks * Math.max(0, Number(effect.critDamagePerIntentStack) || 0);
  fighter.battleBuffs = fighter.battleBuffs || [];
  [
    ['critRate', critRate],
    ['critDamage', critDamage],
  ].forEach(([stat, value]) => {
    const key = `swordIntent:${stat}`;
    fighter.battleBuffs = fighter.battleBuffs.filter((buff) => {
      if (buff.key !== key) return true;
      fighter[buff.stat] = (fighter[buff.stat] || 0) - buff.value;
      return false;
    });
    fighter[stat] = (fighter[stat] || 0) + value;
    fighter.battleBuffs.push({ key, stat, value, remaining: duration });
  });
  return { critRate, critDamage };
}

function hasBladeBleed(target) {
  return Array.isArray(target?.battleStatuses)
    && target.battleStatuses.some((status) => status.type === 'bladeBleed' && status.remaining > 0);
}

function tickBattleStatuses(fighter) {
  if (!Array.isArray(fighter?.battleStatuses)) return [];
  const events = [];
  fighter.battleStatuses = fighter.battleStatuses.filter((status) => {
    status.remaining -= 1;
    if (status.type === 'bladeBleed' && fighter.hp > 0) {
      const rawDamage = Math.max(1, Math.round(fighter.maxHp * Math.max(0, Number(status.hpPercentPerTurn) || 0)));
      const maxDamage = Math.max(1, Math.round((Number(status.sourceAttack) || 0) * Math.max(0, Number(status.maxDamageAttackMultiplier) || 0)));
      const damage = Math.min(rawDamage, maxDamage);
      fighter.hp = Math.max(0, fighter.hp - damage);
      events.push(`${fighter.name} mất ${formatGameNumber(damage)} sinh lực do Xuất Huyết.`);
    }
    return status.remaining > 0;
  });
  return events;
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

function applyEnemyCombatPassives(fighter) {
  const style = getCombatStyleDefinition(fighter.combatStyle);
  const state = fighter.combatStyleState || { cooldown: 0, guarding: false, critBoost: 0 };
  fighter.combatStyleState = state;
  state.cooldown = Math.max(0, Number(state.cooldown) - 1);
  state.guarding = false;
  state.critBoost = clamp(Number(style.critBonus) || 0, 0, 0.35);
  state.attackBoost = fighter.combatStyle === 'berserker'
    && fighter.hp / fighter.maxHp <= clamp(Number(style.hpThreshold) || 0.5, 0.2, 0.7)
    ? clamp(Number(style.attackBonus) || 0.12, 0.05, 0.25)
    : 0;
  state.accuracyBoost = clamp(Number(style.accuracyBonus) || 0, 0, 0.2);
  state.lifeStealBoost = clamp(Number(style.lifeStealBonus) || 0, 0, 0.15);

  let healAmount = 0;
  const healInterval = Math.max(1, Math.floor(Number(style.healInterval) || 4));
  const healThreshold = clamp(Number(style.hpThreshold) || 0.5, 0.2, 0.8);
  if (fighter.combatStyle === 'heal'
    && turn % healInterval === 0
    && fighter.hp / fighter.maxHp <= healThreshold) {
    healAmount = Math.min(
      fighter.maxHp - fighter.hp,
      Math.max(1, Math.round(fighter.maxHp * clamp(Number(style.healPercent) || 0.2, 0.05, 0.3) * getHealingMultiplier(fighter))),
    );
    fighter.hp += healAmount;
  }

  return { healAmount };
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

function getSkillMasteryBonus(attacker, effectType = 'damage') {
  const mastery = Math.max(0, Number(attacker?.mastery) || 0);
  const coefficient = 0.5;
  return Math.max(0, Math.round(mastery * coefficient));
}

function getHealingMultiplier(receiver) {
  return 1 - clamp(Number(receiver?.healingReduction) || 0, 0, 0.95);
}

function applySkillEffects(attacker, target, skill) {
  const effectTexts = [];
  (skill.effects || []).forEach((effect) => {
    if (
      effect.type === 'extraCast'
      || effect.type === 'manaRefund'
      || effect.type === 'conditionalDamage'
      || effect.type === 'bladeIntentSkillBurst'
      || effect.type === 'swordIntent'
    ) return;
    const chance = Math.max(0, Math.min(1, Number(effect.chance) || 0));
    if (Math.random() > chance) return;
    const receiver = effect.target === 'enemy' ? target : attacker;
    if (effect.type === 'bladeIntent') {
      const gained = effect.action === 'gain'
        ? addBladeIntent(attacker, 1, effect.maxStacks)
        : 0;
      if (gained > 0) effectTexts.push(`Đao Ý +${gained} tầng`);
      return;
    }
    if (effect.type === 'bladeBleed') {
      const duration = Math.max(1, Math.floor(Number(effect.duration) || 1));
      target.battleStatuses = Array.isArray(target.battleStatuses) ? target.battleStatuses : [];
      const statusKey = `${skill.id}:bladeBleed`;
      if (effect.nonStacking) target.battleStatuses = target.battleStatuses.filter((status) => status.key !== statusKey);
      target.battleStatuses.push({
        key: statusKey,
        type: 'bladeBleed',
        remaining: duration,
        hpPercentPerTurn: Math.max(0, Number(effect.hpPercentPerTurn) || 0),
        maxDamageAttackMultiplier: Math.max(0, Number(effect.maxDamageAttackMultiplier) || 0),
        sourceAttack: Math.max(0, Number(attacker.attack) || 0),
      });
      effectTexts.push(`Xuất Huyết ${toPercent(effect.hpPercentPerTurn)} HP trong ${duration} lượt`);
      return;
    }
    if (effect.type === 'normalAttackBuff') {
      const value = Math.max(0, Number(effect.value) || 0);
      const duration = Math.max(1, Math.floor(Number(effect.duration) || 1));
      const buffKey = `${skill.id}:normalAttackDamageBonus`;
      attacker.battleBuffs = attacker.battleBuffs || [];
      if (effect.nonStacking) {
        attacker.battleBuffs = attacker.battleBuffs.filter((buff) => {
          if (buff.key !== buffKey) return true;
          attacker[buff.stat] = (attacker[buff.stat] || 0) - buff.value;
          return false;
        });
      }
      attacker.normalAttackDamageBonus = (attacker.normalAttackDamageBonus || 0) + value;
      attacker.battleBuffs.push({ key: buffKey, stat: 'normalAttackDamageBonus', value, remaining: duration });
      effectTexts.push(`sát thương đánh thường +${toPercent(value)}`);
      return;
    }
    if (effect.type === 'hpSacrifice') {
      const hpCost = Math.min(
        Math.max(0, attacker.hp - 1),
        Math.max(1, Math.round(attacker.hp * Math.max(0, Number(effect.value) || 0))),
      );
      attacker.hp = Math.max(1, attacker.hp - hpCost);
      attacker.nextNormalAttackDamageBonus = Math.max(0, Number(effect.nextNormalAttackDamageBonus) || 0);
      effectTexts.push(`hy sinh ${formatGameNumber(hpCost)} HP để cường hóa đòn kế tiếp`);
      return;
    }
    if (effect.type === 'bladeRendBurst') {
      if (!hasBladeBleed(target)) {
        const gained = Math.random() <= Math.max(0, Math.min(1, Number(effect.noBleedGainIntentChance) || 0))
          ? addBladeIntent(attacker, 1, effect.maxStacks)
          : 0;
        if (gained > 0) effectTexts.push(`Đao Ý +${gained} tầng`);
      }
      return;
    }
    if (effect.type === 'bladeCriticalIntent') {
      const stacks = consumeBladeIntent(attacker);
      attacker.nextCritDamageBonus = Math.max(0, Number(effect.baseCritDamageBonus) || 0)
        + stacks * Math.max(0, Number(effect.critDamagePerIntentStack) || 0);
      effectTexts.push(`đòn chí mạng kế tiếp +${toPercent(attacker.nextCritDamageBonus)} sát thương chí mạng`);
      return;
    }
    if (effect.type === 'healReduction') {
      const value = clamp(Number(effect.value) || 0, 0, 0.95);
      const duration = Math.max(1, Number(effect.duration) || 1);
      const buffKey = `${skill.id}:healingReduction`;
      receiver.battleBuffs = receiver.battleBuffs || [];
      if (effect.nonStacking) {
        receiver.battleBuffs = receiver.battleBuffs.filter((buff) => {
          if (buff.key !== buffKey) return true;
          receiver[buff.stat] = (receiver[buff.stat] || 0) - buff.value;
          return false;
        });
      }
      receiver.healingReduction = (receiver.healingReduction || 0) + value;
      receiver.battleBuffs.push({ key: buffKey, stat: 'healingReduction', value, remaining: duration });
      effectTexts.push(`giảm hồi phục của kẻ địch ${toPercent(value)}`);
      return;
    }
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
    if (effect.type === 'percentDebuff') {
      const rate = clamp(Number(effect.value) || 0, 0, 1);
      const duration = Math.max(1, Number(effect.duration) || 1);
      if (!(effect.stat in receiver)) return;
      const value = Math.max(1, Math.round((receiver[effect.stat] || 0) * rate));
      const buffKey = `${skill.id}:${effect.stat}:debuff`;
      receiver.battleBuffs = receiver.battleBuffs || [];
      if (effect.nonStacking) {
        receiver.battleBuffs = receiver.battleBuffs.filter((buff) => {
          if (buff.key !== buffKey) return true;
          receiver[buff.stat] = (receiver[buff.stat] || 0) - buff.value;
          return false;
        });
      }
      receiver[effect.stat] = Math.max(0, (receiver[effect.stat] || 0) - value);
      receiver.battleBuffs.push({ key: buffKey, stat: effect.stat, value: -value, remaining: duration });
      effectTexts.push(`${getStatLabel(effect.stat)} -${toPercent(rate)}`);
    }
    if (effect.type === 'healPercent') {
      const heal = Math.min(
        receiver.maxHp - receiver.hp,
        Math.floor((Math.floor(receiver.maxHp * (Number(effect.value) || 0)) + getSkillMasteryBonus(attacker, 'heal')) * getHealingMultiplier(receiver)),
      );
      if (heal > 0) {
        receiver.hp += heal;
        effectTexts.push(`hồi ${heal} sinh lực`);
      }
    }
  });
  return effectTexts;
}

function resolveAttackHit(attacker, target, multiplier = 1, isSkill = false) {
  const dodged = Math.random() > getHitChance(attacker, target);
  if (dodged) return { damage: 0, critical: false, dodged: true, blocked: false, heal: 0 };

  const styleCritBoost = attacker.combatStyleState?.critBoost || 0;
  const critChance = clamp(attacker.critRate + styleCritBoost, 0, 0.95);
  const critical = Math.random() < critChance;
  const skillMasteryBonus = isSkill ? getSkillMasteryBonus(attacker) : 0;
  const nextCritDamageBonus = critical ? Math.max(0, Number(attacker.nextCritDamageBonus) || 0) : 0;
  const rawDamage = Math.round(
    (attacker.attack * multiplier + skillMasteryBonus) * rollDamagePercent()
      * (critical ? attacker.critDamage + nextCritDamageBonus : 1),
  );
  if (critical && nextCritDamageBonus > 0) attacker.nextCritDamageBonus = 0;
  const blocked = Math.random() < target.blockRate;
  const blockMultiplier = blocked ? 0.2 : 1;
  const styleDamageReduction = target.combatStyle === 'defense'
    ? clamp(Number(getCombatStyleDefinition('defense').damageReduction) || 0.12, 0, 0.35)
    : 0;
  const targetStyle = getCombatStyleDefinition(target.combatStyle);
  const styleDefenseBonus = target.combatStyle === 'ironbody'
    ? clamp(Number(targetStyle.defenseBonus) || 0.1, 0, 0.2)
    : 0;
  const armorPierceDefinition = combatStatDefinitions.find((definition) => definition.id === 'armorPierce');
  const armorPierceChance = clamp(Number(attacker.armorPierce) || 0, 0, 1);
  const pierced = armorPierceChance > 0 && Math.random() < armorPierceChance;
  const armorPierceDefenseIgnore = pierced
    ? clamp(Number(armorPierceDefinition?.defenseIgnoreRate) || 0.5, 0, 1)
    : 0;
  const effectiveDefense = Math.max(
    0,
    Math.round(target.defense * (1 + styleDefenseBonus) * (1 - armorPierceDefenseIgnore)),
  );
  const reducedRawDamage = rawDamage
    * (1 - clamp(target.damageReduction, 0, 0.9))
    * (1 - styleDamageReduction);
  const damage = Math.max(1, Math.round(reducedRawDamage * blockMultiplier) - effectiveDefense);
  target.hp = Math.max(0, target.hp - damage);
  if (target.combatStyleState?.guarding) target.combatStyleState.guarding = false;
  const lifeSteal = Math.max(0, Number(attacker.lifeSteal) || 0)
    + Math.max(0, Number(attacker.combatStyleState?.lifeStealBoost) || 0);
  const heal = Math.min(attacker.maxHp - attacker.hp, Math.floor(damage * lifeSteal * getHealingMultiplier(attacker)));
  if (heal > 0) attacker.hp += heal;
  return {
    damage,
    heal,
    critical,
    dodged: false,
    blocked,
    pierced,
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

  const attackerStyle = getCombatStyleDefinition(attacker.combatStyle);
  const predatorThreshold = clamp(Number(attackerStyle.targetHpThreshold) || 0.5, 0.2, 0.8);
  const predatorBonus = attacker.combatStyle === 'predator'
    && target.hp / target.maxHp <= predatorThreshold
    ? clamp(Number(attackerStyle.attackBonus) || 0.1, 0.05, 0.2)
    : 0;
  const styleDamageMultiplier = 1 + clamp(
    (Number(attacker.combatStyleState?.attackBoost) || 0) + predatorBonus,
    0,
    0.35,
  );
  const bladeRendBurst = selectedSkill?.effects?.find((effect) => effect.type === 'bladeRendBurst');
  const targetHadBladeBleed = Boolean(bladeRendBurst && hasBladeBleed(target));
  const bladeRendDamageBonus = targetHadBladeBleed
    ? Math.max(0, Number(bladeRendBurst.bleedDamageBonus) || 0)
    : 0;
  const bladeIntentSkillBurst = selectedSkill?.effects?.find((effect) => effect.type === 'bladeIntentSkillBurst');
  const bladeIntentSkillStacks = skill && bladeIntentSkillBurst ? consumeBladeIntent(attacker) : 0;
  const bladeIntentSkillBonus = bladeIntentSkillStacks * Math.max(0, Number(bladeIntentSkillBurst?.perIntentDamageBonus) || 0);
  const swordIntentConfig = getSwordIntentConfig(selectedSkill);
  const swordIntentBonus = swordIntentConfig
    ? getSwordIntentStacks(attacker) * Math.max(0, Number(swordIntentConfig.skillDamagePerStack) || 0)
    : 0;
  const swordIntentCriticalEffect = getSwordIntentConsumeEffect(selectedSkill);
  const swordIntentCriticalStacks = skill && swordIntentCriticalEffect
    ? consumeSwordIntent(attacker)
    : 0;
  const swordIntentEffectTexts = [];
  if (skill && swordIntentCriticalEffect) {
    const criticalBuff = applySwordIntentCriticalBuff(attacker, swordIntentCriticalEffect, swordIntentCriticalStacks);
    swordIntentEffectTexts.push(
      `tiêu hao ${swordIntentCriticalStacks} tầng Kiếm Ý; Chí mạng +${toPercent(criticalBuff.critRate)}, Sát thương chí mạng +${toPercent(criticalBuff.critDamage)}`,
    );
  }
  const normalAttackBonus = !skill
    ? getBladeIntentStacks(attacker) * 0.02 + Math.max(0, Number(attacker.normalAttackDamageBonus) || 0)
      + Math.max(0, Number(attacker.nextNormalAttackDamageBonus) || 0)
    : 0;
  if (!skill && attacker.nextNormalAttackDamageBonus > 0) attacker.nextNormalAttackDamageBonus = 0;
  const conditionalDamageEffect = selectedSkill?.effects?.find((effect) => effect.type === 'conditionalDamage');
  const swordIntentDamageStacks = skill && conditionalDamageEffect?.consumesIntent
    ? consumeSwordIntent(attacker)
    : 0;
  const conditionalDamageBonus = conditionalDamageEffect
    && target.hp / Math.max(1, target.maxHp) < clamp(Number(conditionalDamageEffect.targetHpThreshold) || 0, 0, 1)
    ? Math.max(0, Number(conditionalDamageEffect.damageMultiplier) || 0)
      + swordIntentDamageStacks * Math.max(0, Number(conditionalDamageEffect.damageMultiplierPerIntentStack) || 0)
    : 0;
  const conditionalDamageMultiplier = conditionalDamageEffect && conditionalDamageBonus > 0
    ? 1 + conditionalDamageBonus
    : 1;
  if (skill && conditionalDamageEffect?.consumesIntent) {
    swordIntentEffectTexts.push(
      `tiêu hao ${swordIntentDamageStacks} tầng Kiếm Ý; sát thương điều kiện +${toPercent(conditionalDamageBonus)}`,
    );
  }
  const primaryHit = resolveAttackHit(
    attacker,
    target,
    (skill
      ? selectedSkill.multiplier
        * conditionalDamageMultiplier
        * (1 + bladeRendDamageBonus + bladeIntentSkillBonus + swordIntentBonus)
      : 1 + normalAttackBonus) * styleDamageMultiplier,
    skill,
  );
  if (skill) {
    primaryHit.skill = true;
    primaryHit.skillId = selectedSkill.id;
    primaryHit.skillName = selectedSkill.name;
  }
  playAudioCue(primaryHit.dodged ? 'dodge' : primaryHit.critical ? 'critical' : skill ? 'skill' : 'hit');
  const effectTexts = [
    ...swordIntentEffectTexts,
    ...(skill && !primaryHit.dodged ? applySkillEffects(attacker, target, selectedSkill) : []),
  ];
  if (skill && !primaryHit.dodged && swordIntentConfig) {
    const chance = clamp(Number(swordIntentConfig.chance) || 0, 0, 1);
    if (Math.random() <= chance) {
      const gained = addSwordIntent(attacker, swordIntentConfig.stackGainOnSkillHit, swordIntentConfig.maxStacks);
      if (gained > 0) effectTexts.push(`Kiếm Ý +${gained} tầng`);
    }
  }
  let effectDamage = 0;
  if (skill && !primaryHit.dodged && bladeRendBurst && !targetHadBladeBleed && target.hp > 0) {
    const extraDamage = Math.min(
      Math.max(1, Math.round(target.maxHp * Math.max(0, Number(bladeRendBurst.noBleedExtraHpPercent) || 0))),
      Math.max(1, Math.round(attacker.attack * Math.max(0, Number(bladeRendBurst.noBleedExtraDamageMaxAttackMultiplier) || 0))),
      target.hp,
    );
    target.hp = Math.max(0, target.hp - extraDamage);
    effectDamage = extraDamage;
    effectTexts.push(`sát thương thêm ${formatGameNumber(extraDamage)} từ HP mục tiêu`);
  }
  let bonusHit = null;
  const extraCastEffect = selectedSkill?.effects?.find((effect) => effect.type === 'extraCast');
  if (extraCastEffect
    && !primaryHit.dodged
    && target.hp > 0
    && Math.random() <= clamp(Number(extraCastEffect.chance) || 0, 0, 1)) {
    const secondCastDamageMultiplier = clamp(
      Number(extraCastEffect.secondCastDamageMultiplier) || 1,
      0.1,
      1,
    );
    bonusHit = resolveAttackHit(
      attacker,
      target,
      selectedSkill.multiplier * secondCastDamageMultiplier * styleDamageMultiplier,
      true,
    );
    bonusHit.skill = true;
    bonusHit.skillId = selectedSkill.id;
    bonusHit.skillName = selectedSkill.name;
  }
  const counterDamage = primaryHit.dodged ? 0 : resolveCounterStrike(target, attacker);

  return {
    ...primaryHit,
    counterDamage,
    manaRefunded,
    skill,
    skillId: selectedSkill?.id,
    skillName: selectedSkill?.name,
    effectTexts,
    effectDamage,
    bonusHit,
  };
}

function getHitChance(attacker, target) {
  const targetStyle = getCombatStyleDefinition(target.combatStyle);
  const styleDodgeBonus = target.combatStyle === 'shadowstep'
    ? clamp(Number(targetStyle.dodgeBonus) || 0.06, 0, 0.12)
    : 0;
  return clamp(
    attacker.accuracy
      + (Number(attacker.combatStyleState?.accuracyBoost) || 0)
      - target.dodgeRate
      - styleDodgeBonus,
    0.1,
    0.98,
  );
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
  const configuredStep = Math.max(1, Math.floor(Number(trialTowerData.rewardChestTierStepFloors) || 15));
  const chestTier = floorNumber > 0
    ? clamp(2 + Math.floor((floorNumber - 1) / configuredStep), 1, 10)
    : Math.max(0, Math.floor(Number(reward.equipmentChestTier) || 0));
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
  const isTrialTower = Boolean(currentStage?.isTrialTower);
  const isResourceDungeon = Boolean(currentStage?.isResourceDungeon);
  const isBeastHunt = Boolean(currentStage?.isBeastHunt);
  const isTrainingDummy = Boolean(currentStage?.isTrainingDummy);
  const isWorldBoss = Boolean(currentStage?.isWorldBoss);
  const isPlayerBattle = Boolean(currentStage?.isPlayerBattle);
  if (!isTrainingDummy) savePlayerResourcesFromBattle(outcome);
  const isWanderBattle = !isTrialTower && !isResourceDungeon && !isBeastHunt && !isTrainingDummy && !isWorldBoss && !isPlayerBattle && Boolean(currentStage?.isWanderGenerated);
  const resourceAttemptRefunded = isResourceDungeon && outcome === 'lose'
    ? refundResourceAttempt(currentStage.resourceDungeonId)
    : false;
  if (currentStage.isAmbush && outcome !== 'win') rollbackAmbushLoot(currentStage);
  const recovered = isTrainingDummy || isWorldBoss ? null : applyVictoryRecovery(outcome);
  if (isTrainingDummy) {
    trainingDummyLastDamage = Math.max(0, Math.round(trainingDummyDamageDealt));
    trainingDummyLastTurns = Math.max(0, Math.floor(turn));
  }
  if (outcome === 'win' && !isTrialTower && !isResourceDungeon && !isBeastHunt && !isTrainingDummy && !isWorldBoss && !isPlayerBattle && getDungeonConfig().unlimited && !currentStage.isAmbush && !currentStage.isWanderGenerated) {
    completedStages.add(currentStage.id);
  }
  if (outcome === 'win' && isTrialTower) trialTowerWinCount += 1;
  if (outcome === 'win' && !isTrialTower && !isResourceDungeon && !isBeastHunt && !isTrainingDummy && !isWorldBoss && !isPlayerBattle) {
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
  if (outcome === 'win' && !isTrialTower && !isResourceDungeon && !isBeastHunt && !isTrainingDummy && !isWorldBoss && !isPlayerBattle) {
    dailyQuestProgress.wanderWins += 1;
    dailyQuestProgress.wanderRewards += 1;
  }
  let reward = 0;
  let cultivationAward = 0;
  let spiritStoneReward = 0;
  let droppedItem = null;
  let bonusRewardText = '';
  let bossTreasureChest = null;
  let playerBattleReward = null;
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
    bonusRewardText = formatResourceReward(resourceDungeon, resourceReward.amount, resourceReward);
    message = `${message} Vượt qua ${currentStage.title}.`;
  } else if (isPlayerBattle) {
    playerBattleReward = settlePlayerBattleResult(outcome);
    spiritStoneReward = playerBattleReward.stolen;
    bonusRewardText = outcome === 'win'
      ? `Cướp được ${formatGameNumber(playerBattleReward.stolen)} Linh thạch`
      : 'Không cướp được Linh thạch';
  } else if (!isTrialTower && !isResourceDungeon && !isBeastHunt && !isTrainingDummy && !isWorldBoss) {
    cultivationAward = getCultivationReward(outcome);
    reward = addPlayerCultivation(cultivationAward);
    spiritStoneReward = addSpiritStoneReward(outcome);
    droppedItem = rollEquipmentDrop(outcome);
  }
  if (outcome === 'win' && isWanderBattle && !currentStage.isWanderBoss) {
    const bonusResults = grantWanderBattleBonusRewards(currentStage);
    const bonusMessages = bonusResults.map((result) => result.message).filter(Boolean);
    if (bonusMessages.length) {
      bonusRewardText = [
        bonusRewardText,
        droppedItem ? getDroppedRewardText(droppedItem) : '',
        ...bonusMessages,
      ].filter(Boolean).join(' | ');
    }
  }
  if (outcome === 'win' && isWanderBattle && currentStage.isWanderBoss) {
    bossTreasureChest = grantWanderBossTreasureChest(currentStage);
    if (bossTreasureChest) bonusRewardText = `${bossTreasureChest.name} vào Túi đồ`;
  }
  if (isBeastHunt) {
    beastHuntBattleActive = false;
    beastHuntPendingReward = outcome === 'win' ? createBeastHuntReward(currentStage) : null;
    beastHuntMapId = '';
    beastHuntRespawnAt = outcome === 'win' ? 0 : Date.now() + getBeastHuntRespawnMs();
    beastHuntNotificationPending = outcome === 'win';
  }
  setButtonDisabledState(startButton, false);
  startButton.textContent = getPostBattleButtonText(outcome);
  startButton.classList.add('is-hidden');
  renderBattleResult(message, outcome, reward, spiritStoneReward, droppedItem, bonusRewardText, cultivationAward);
  renderStageMap();
  pushLog(`${message} Trận đấu kết thúc.`);
  pushLog(isWorldBoss
    ? `Boss thế giới ghi nhận ${formatGameNumber(worldBossDamageDealt)} sát thương từ lượt đánh này.`
    : isTrainingDummy
    ? `Mộc nhân ghi nhận tổng ${formatGameNumber(trainingDummyLastDamage)} sát thương sau ${formatGameNumber(trainingDummyLastTurns)} lượt.`
    : isPlayerBattle
    ? outcome === 'win'
      ? `Đấu thắng ${currentStage.playerBattleOpponent?.name || enemy.name}, nhận ${formatGameNumber(playerBattleReward?.stolen || 0)} Linh thạch.`
      : `Đấu thua ${enemy.name}, không nhận Linh thạch.`
    : isBeastHunt
    ? outcome === 'win'
      ? 'Đã mở phần thưởng trong tab Hoạt động > Săn yêu vật.'
      : 'Không nhận phần thưởng săn yêu vật.'
    : (cultivationAward > 0 || reward > 0)
    ? `Nhận ${formatGameNumber(cultivationAward || reward)} tu vi${cultivationAward > reward ? `, đã lưu ${formatGameNumber(reward)} vào Đan điền/thanh tu vi.` : ''} Hiện tại: ${formatGameNumber(playerCultivation)}/${formatGameNumber(getCultivationRequiredForNextLevel())}.`
    : 'Không nhận tu vi.');
  if (recovered) pushLog(`Dưỡng khí hồi ${recovered.hp} sinh lực và ${recovered.mana} linh lực.`);
  if (spiritStoneReward > 0) pushLog(`Rớt ${formatGameNumber(spiritStoneReward)} linh thạch.`);
  if (droppedItem) pushLog(`Nhặt được ${getDroppedRewardText(droppedItem)}.`);
  if (bossTreasureChest) pushLog(`Nhận ${bossTreasureChest.name} từ Boss map.`);
  if (outcome === 'win' && isWanderBattle && !currentStage.isWanderBoss) {
    const rewardBonus = getEnemyRewardBonusPercent(currentStage);
    if (rewardBonus > 0) pushLog(`Phẩm chất kẻ địch tăng thưởng +${rewardBonus}%.`);
  }
  if (outcome === 'win' && isWanderBattle && currentStage.isWanderBoss) {
    pushLog(`Đã chinh phục Boss ${getCurrentWanderMap().name}.`);
  }
  if (isBeastHunt) {
    pushLog('Săn yêu vật kết thúc. Yêu vật sẽ xuất hiện lại sau 1 giờ.');
  }
  if (bonusRewardText) pushLog(`Nhận ${bonusRewardText}.`);
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
  if (isWorldBoss) submitWorldBossDamage(currentStage, worldBossDamageDealt);
}

function renderBattleResult(message, outcome, reward, spiritStoneReward, droppedItem, bonusRewardText = '', cultivationAward = reward) {
  const nextStage = getNextBattleStage();
  const config = getDungeonConfig();
  const isBeastHunt = Boolean(currentStage?.isBeastHunt);
  const isTrainingDummy = Boolean(currentStage?.isTrainingDummy);
  const isWorldBoss = Boolean(currentStage?.isWorldBoss);
  const isPlayerBattle = Boolean(currentStage?.isPlayerBattle);
  const resultTitle = isWorldBoss
    ? 'Hoàn tất lượt đánh Boss'
    : isTrainingDummy
    ? 'Hoàn tất thử sát thương'
    : outcome === 'win' ? 'Thắng lợi' : outcome === 'draw' ? 'Hòa' : 'Thất bại';
  const resultIcon = isWorldBoss || isTrainingDummy
    ? 'icon-unique-draw'
    : outcome === 'win' ? 'icon-item-victory' : outcome === 'draw' ? 'icon-unique-draw' : 'icon-item-defeat';
  const itemText = droppedItem
    ? getDroppedRewardText(droppedItem)
    : 'Không rơi trang bị';
  const displayedCultivation = Number(cultivationAward) || 0;
  const storedCultivationNote = displayedCultivation > Number(reward || 0)
    ? ` (đã lưu +${formatGameNumber(reward)} vào Đan điền/thanh tu vi)`
    : '';
  const nextText = isWorldBoss
    ? 'Cập nhật bảng sát thương trong Hoạt động > Boss thế giới'
    : isTrainingDummy
    ? 'Xem kết quả trong Hoạt động > Mộc nhân'
    : isPlayerBattle
    ? 'Trở về Hoạt động > Chiến đấu để tìm đối thủ mới'
    : isBeastHunt
    ? outcome === 'win'
      ? 'Nhận thưởng trong Hoạt động để bắt đầu hồi 1 giờ'
      : `Yêu vật xuất hiện lại sau ${Math.round(getBeastHuntRespawnMs() / 60000)} phút`
    : currentStage?.isResourceDungeon
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
    <em>${isWorldBoss
      ? `Sát thương lượt này: ${formatGameNumber(worldBossDamageDealt)}`
      : isTrainingDummy
      ? `Tổng sát thương gây ra: ${formatGameNumber(trainingDummyLastDamage)}`
      : isPlayerBattle
      ? outcome === 'win'
        ? `Cướp được ${formatGameNumber(spiritStoneReward)} Linh thạch từ đối thủ.`
        : 'Không nhận Linh thạch từ trận đấu này.'
      : isBeastHunt
      ? outcome === 'win'
        ? 'Đã thắng. Mở tab Hoạt động > Săn yêu vật để nhận phần thưởng.'
        : 'Không nhận phần thưởng.'
      : `Tu vi nhận +${formatGameNumber(displayedCultivation)}${storedCultivationNote} | Rớt linh thạch +${formatGameNumber(spiritStoneReward)} | ${bonusRewardText || itemText}`}</em>
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

function getWanderBossTreasureChestDefinition(stage) {
  return shopItems.find((item) => (
    item.type === 'talentTreasureChest'
      && item.id === 'talentTreasureChest'
  )) || null;
}

function grantWanderBossTreasureChest(stage) {
  const chest = getWanderBossTreasureChestDefinition(stage);
  if (!chest) return null;
  addShopInventoryItem(chest.id, 1);
  return chest;
}

function getPostBattleButtonText(outcome) {
  return 'Thoát';
}

function finishByTurnLimit() {
  if (battleOver) return;
  if (currentStage?.isWanderGenerated || currentStage?.isPlayerBattle) {
    const playerRemainingPower = Math.max(0, Number(player.hp) || 0) + Math.max(0, Number(player.mana) || 0);
    const enemyRemainingPower = Math.max(0, Number(enemy.hp) || 0) + Math.max(0, Number(enemy.mana) || 0);
    if (playerRemainingPower > enemyRemainingPower) {
      return finishBattle(`${player.name} thắng nhờ tổng HP + MP cao hơn.`, 'win');
    }
    if (enemyRemainingPower > playerRemainingPower) {
      return finishBattle(`${enemy.name} thắng nhờ tổng HP + MP cao hơn.`, 'lose');
    }
  } else {
    if (player.hp > enemy.hp) return finishBattle(`${player.name} thắng nhờ sinh lực.`, 'win');
    if (enemy.hp > player.hp) return finishBattle(`${enemy.name} thắng nhờ sinh lực.`, 'lose');
  }
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
