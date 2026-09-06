// Quest tab handlers. Shared state remains owned by main.js.
function getCombinedQuestMilestones(quest) {
  return Array.isArray(quest?.objective?.milestones) ? quest.objective.milestones : [];
}

function getCombinedQuestInstanceId(quest, milestone) {
  return `${quest.id}:${milestone.id || `${milestone.kind || 'step'}-${milestone.target}`}`;
}

function isCombinedQuestMilestoneClaimed(quest, milestone) {
  if (milestone.kind === 'map' && Number(milestone.target) > getUnlockedWanderMapCount()) return false;
  if (claimedQuestIds.has(getCombinedQuestInstanceId(quest, milestone))) return true;
  if (milestone.kind === 'map' && claimedQuestIds.has(`explore-map-${milestone.target}`)) return true;
  if (milestone.kind === 'minor' && claimedQuestIds.has(`cultivation-milestones:${milestone.target}`)) return true;
  if (milestone.kind === 'major' && claimedQuestIds.has(`major-realm-milestones:${milestone.target}`)) return true;
  return false;
}

function getNextCombinedQuestMilestone(quest) {
  return getCombinedQuestMilestones(quest).find((milestone) => !isCombinedQuestMilestoneClaimed(quest, milestone)) || null;
}

function getCombinedQuestMetric(milestone) {
  if (milestone?.kind === 'map') return getUnlockedWanderMapCount();
  return milestone?.kind === 'major' ? playerMajorRealmIndex : getPlayerCultivationTier();
}

function getQuestMilestoneIndex(quest, milestone) {
  return getCombinedQuestMilestones(quest).findIndex((entry) => entry === milestone);
}

function getCultivationRequirementForQuestMilestone(milestone) {
  if (!milestone) return 0;
  if (milestone.kind === 'major') {
    const nextRealm = cultivationProgression[Math.max(0, Number(milestone.target))];
    return Math.max(0, Number(nextRealm?.minorBaseRequirement) || 0);
  }
  let remainingTier = Math.max(1, Math.floor(Number(milestone.target) || 1));
  for (let majorIndex = 0; majorIndex < cultivationProgression.length; majorIndex += 1) {
    const minorCap = getMinorRealmLevelCap(majorIndex);
    if (remainingTier <= minorCap) {
      const progression = cultivationProgression[majorIndex] || {};
      const level = Math.max(1, remainingTier);
      return Math.max(0,
        (Number(progression.minorBaseRequirement) || 0)
        + Math.max(0, level - 1) * (Number(progression.minorStepRequirement) || 0),
      );
    }
    remainingTier -= minorCap;
  }
  return 0;
}

function roundQuestCultivationReward(value, rounding = 'nearestTen') {
  const amount = Math.max(0, Number(value) || 0);
  if (rounding === 'ceilTen') return Math.max(0, Math.ceil(amount / 10) * 10);
  if (rounding === 'nearestTen') return Math.max(0, Math.round(amount / 10) * 10);
  return Math.max(0, Math.round(amount));
}

function getFormulaQuestReward(quest, milestone) {
  const formula = quest?.objective?.rewardFormula;
  if (!formula || !milestone) return null;
  const milestoneIndex = getQuestMilestoneIndex(quest, milestone);
  if (milestoneIndex < 0) return null;
  const requirement = getCultivationRequirementForQuestMilestone(milestone);
  const configuredDivisor = milestone.kind === 'major'
    ? formula.majorCultivationDivisor ?? formula.cultivationDivisor
    : formula.cultivationDivisor;
  const divisor = Math.max(1, Number(configuredDivisor) || 1);
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

function getDailyQuestCultivationReward() {
  const formula = questData.dailyRewardFormula || {};
  const divisor = Math.max(1, Number(formula.cultivationDivisor) || 1);
  const requirement = getCultivationRequirementForQuestMilestone({
    kind: 'minor',
    target: getPlayerCultivationTier(),
  });
  const bonus = Number(formula.cultivationBonus) || 0;
  const levelBonus = Number(formula.cultivationBonusPerLevel) || 0;
  return roundQuestCultivationReward(
    requirement / divisor + bonus + Math.max(1, Number(playerLevel) || 1) * levelBonus,
    formula.cultivationRounding || 'nearest',
  );
}

function getMilestoneQuestFormulaReward(quest) {
  const formula = quest?.objective?.rewardFormula;
  const milestones = quest?.objective?.milestones;
  if (!formula || !Array.isArray(milestones)) return null;
  const progress = getQuestProgress(quest);
  if (!progress || progress.target === null) return null;
  const milestoneIndex = milestones.findIndex((milestone) => Number(milestone) === Number(progress.target));
  if (milestoneIndex < 0) return null;
  const reward = {};
  const spiritStonesBase = Number(formula.spiritStonesBase);
  const spiritStonesPerMilestone = Number(formula.spiritStonesPerMilestone) || 0;
  if (Number.isFinite(spiritStonesBase)) {
    reward.spiritStones = Math.max(0, Math.round(spiritStonesBase + milestoneIndex * spiritStonesPerMilestone));
  }
  const enhancementStonesBase = Number(formula.enhancementStonesBase);
  const enhancementStonesEvery = Math.max(1, Math.floor(Number(formula.enhancementStonesEvery) || 1));
  const enhancementStonesPerStep = Number(formula.enhancementStonesPerStep) || 0;
  if (Number.isFinite(enhancementStonesBase)) {
    reward.enhancementStones = Math.max(0,
      Math.floor(enhancementStonesBase + Math.floor(milestoneIndex / enhancementStonesEvery) * enhancementStonesPerStep),
    );
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
    if (milestone?.kind === 'map') return milestone.description || `Mở khóa map ${milestone.mapName || 'mới'}.`;
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
  if (Number(reward.equipmentChests) > 0) parts.push(`<i class="activity-icon icon-activity-chest" aria-hidden="true"></i>Rương trang bị cấp ${formatGameNumber(reward.equipmentChestTier)} x${formatGameNumber(reward.equipmentChests)}`);
  if (Number(reward.skillChests) > 0) {
    const skillChest = shopItems.find((item) => item.id === reward.skillChestId);
    parts.push(`<i class="activity-icon icon-activity-chest" aria-hidden="true"></i>${skillChest?.name || 'Rương skill'} x${formatGameNumber(reward.skillChests)}`);
  }
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
  const milestoneFormulaReward = getMilestoneQuestFormulaReward(quest);
  if (milestoneFormulaReward) return { ...(quest?.reward || {}), ...milestoneFormulaReward };
  const reward = { ...(quest?.reward || {}) };
  if (quest?.category === 'daily' && questData.dailyRewardFormula) {
    reward.cultivation = getDailyQuestCultivationReward();
  }
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
  const visibleQuests = questData.quests
    .filter((quest) => !quest.hidden)
    .filter((quest) => (quest.category || 'side') === questCategory);
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
      : formatRealmDisplayText(progress.milestone?.label || quest.objective?.label || 'Mục tiêu');
    return `
      <article class="quest-entry${claimed ? ' claimed' : ''}${ready ? ' ready' : ''}">
        <div class="quest-entry-heading">
          <div><strong><i class="item-icon ${questIcon}" aria-hidden="true"></i>${quest.title}</strong>${objectiveLabel ? `<span>${objectiveLabel}</span>` : ''}</div>
          <em>${progress.finished ? 'Đã đủ mốc' : claimed ? 'Đã nhận' : `${progress.current}/${progress.target}`}</em>
        </div>
        <p>${description}</p>
        <div class="quest-progress-bar"><i style="width:${percent}%"></i></div>
        <small>Thưởng: ${formatQuestReward(reward)}</small>
        <button type="button" class="${ready ? 'breakthrough' : 'secondary'} compact" ${buttonDisabledAttributes(!ready, progress.finished ? 'Nhiệm vụ đã hoàn tất.' : claimed ? 'Nhiệm vụ đã nhận thưởng.' : 'Nhiệm vụ chưa hoàn thành.')} onclick="claimQuest('${quest.id}')">
          ${progress.finished ? 'Đã hoàn tất' : claimed ? 'Đã nhận' : ready ? 'Nhận thưởng' : 'Đang tiến hành'}
        </button>
      </article>
    `;
  }).join('');
  setPanelMessage('questMessage', readyCount > 0
    ? `Có ${readyCount} nhiệm vụ đã hoàn thành.`
    : 'Hoàn thành mục tiêu để mở khóa phần thưởng.');
  updateNotificationBadges();
}
