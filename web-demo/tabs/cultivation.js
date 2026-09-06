// Cultivation and skill tab handlers. Shared state remains owned by main.js.
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
  $('playerCultivationRealm').innerHTML = `<i class="activity-icon icon-activity-lotus" aria-hidden="true"></i>${player.realm} ${player.minorRealm}`;
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
  setButtonDisabledState(useHealthPotionButton, busy || healthPotionCount <= 0 || resourceView.hp >= playerSnapshot.maxHp, busy ? 'Trận đấu đang diễn ra.' : healthPotionCount <= 0 ? 'Đã hết Sinh Huyết Đan.' : 'Sinh lực đã đầy.');
  setButtonDisabledState(useManaPotionButton, busy || manaPotionCount <= 0 || resourceView.mana >= playerSnapshot.maxMana, busy ? 'Trận đấu đang diễn ra.' : manaPotionCount <= 0 ? 'Đã hết Tụ Linh Đan.' : 'Linh lực đã đầy.');
  $('rewardPreview').textContent = canEnterDungeon()
    ? `${dungeonConfig.name}: thắng ${currentStage.title} nhận ${formatGameNumber(winReward)} tu vi, rớt ${formatGameNumber(stoneDrop.min)}-${formatGameNumber(stoneDrop.max)} linh thạch; thua không nhận tu vi.${attemptSuffix}`
    : 'Sinh lực dưới 15%, không thể ngao du. Dùng Sinh Huyết Đan hoặc chờ hồi phục.';
  setButtonDisabledState(breakthroughButton, busy || !canOpenBreakthroughPanel(), busy ? 'Trận đấu đang diễn ra.' : 'Chưa đủ tu vi hoặc đan đột phá.');
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
  if (playerLevel < getMinorRealmLevelCap()) {
    const pill = getRequiredBreakthroughPill();
    return pill && getShopInventoryCount(pill.id) > 0 ? 'Đột phá' : `Cần ${pill?.name || 'Phá Cảnh Đan'}`;
  }
  if (!hasNextMajorRealm()) return 'Chưa mở';
  return getShopInventoryCount(ascensionPermitItemId) > 0
    ? `Thăng ${getNextMajorRealmName()}`
    : 'Dùng Phá Cảnh Đan';
}

function updateBattleActionAvailability() {
  if (!battleOver) return;
  if (startButton.textContent === 'Tiếp tục' || startButton.textContent === 'Về tu luyện') {
    setButtonDisabledState(startButton, false);
    return;
  }
  setButtonDisabledState(startButton, !canEnterDungeon(), 'Sinh lực chưa đủ để tiếp tục khiêu chiến.');
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
      const secondCastDamageMultiplier = Number(effect.secondCastDamageMultiplier);
      const reductionText = Number.isFinite(secondCastDamageMultiplier) && secondCastDamageMultiplier < 1
        ? `, lần 2 giảm ${toPercent(1 - secondCastDamageMultiplier)} sát thương`
        : '';
      return `${toPercent(chance)} cơ hội thi triển kỹ năng lần 2${reductionText}, không tiêu hao thêm linh lực và không lặp trong cùng lượt`;
    }
    if (effect.type === 'manaRefund') {
      return `${toPercent(chance)} cơ hội hoàn lại linh lực vừa sử dụng`;
    }
    if (effect.type === 'healReduction') {
      return `giảm hồi phục của kẻ địch ${toPercent(effect.value)} trong ${effect.duration || 1} lượt`;
    }
    if (effect.type === 'conditionalDamage') {
      const intentText = effect.consumesIntent
        ? `; tiêu hao toàn bộ Kiếm Ý, mỗi tầng tăng thêm ${toPercent(effect.damageMultiplierPerIntentStack)} sát thương điều kiện`
        : '';
      return `khi HP kẻ địch dưới ${toPercent(effect.targetHpThreshold)}, sát thương tăng thêm ${toPercent(effect.damageMultiplier)}${intentText}`;
    }
    if (effect.type === 'swordIntent') {
      const maxStacks = Math.max(1, Number(effect.maxStacks) || 5);
      if (effect.action === 'consumeCriticalBuff') {
        return `tiêu hao toàn bộ Kiếm Ý; tăng Chí mạng ${toPercent(effect.critRate)}, Sát thương chí mạng ${toPercent(effect.critDamage)} trong ${effect.duration || 1} lượt; mỗi tầng đã tiêu hao tăng thêm ${toPercent(effect.critRatePerIntentStack)} Chí mạng và ${toPercent(effect.critDamagePerIntentStack)} Sát thương chí mạng`;
      }
      return `${chanceText}nhận 1 tầng Kiếm Ý khi skill đánh trúng; mỗi tầng tăng ${toPercent(effect.skillDamagePerStack)} sát thương skill, tối đa ${maxStacks} tầng, không tiêu hao trong trận`;
    }
    if (effect.type === 'bladeIntent') {
      const maxStacks = Math.max(1, Number(effect.maxStacks) || 5);
      const perStack = toPercent(effect.normalAttackDamagePerStack);
      if (effect.action === 'gain') {
        return `${chanceText}nhận 1 tầng Đao Ý, mỗi tầng tăng ${perStack} sát thương đánh thường, tối đa ${maxStacks} tầng, tồn tại đến khi bị tiêu hao`;
      }
    }
    if (effect.type === 'bladeBleed') {
      const maxMultiplier = Number(effect.maxDamageAttackMultiplier) || 0;
      return `gây Xuất Huyết, mất ${toPercent(effect.hpPercentPerTurn)} HP mỗi lượt trong ${effect.duration || 1} lượt, tối đa ${toPercent(maxMultiplier)} Công`;
    }
    if (effect.type === 'normalAttackBuff') {
      return `tăng sát thương đánh thường ${toPercent(effect.value)} trong ${effect.duration || 1} lượt`;
    }
    if (effect.type === 'percentDebuff') {
      return `giảm ${getStatLabel(effect.stat)} ${toPercent(effect.value)} trong ${effect.duration || 1} lượt`;
    }
    if (effect.type === 'hpSacrifice') {
      return `tiêu hao ${toPercent(effect.value)} HP hiện tại, cường hóa đòn đánh thường kế tiếp tăng ${toPercent(effect.nextNormalAttackDamageBonus)} sát thương`;
    }
    if (effect.type === 'bladeRendBurst') {
      const maxExtra = Number(effect.noBleedExtraDamageMaxAttackMultiplier) || 0;
      return `mục tiêu Xuất Huyết: sát thương thêm ${toPercent(effect.bleedDamageBonus)}; nếu không có Xuất Huyết: ${toPercent(effect.noBleedGainIntentChance)} nhận 1 Đao Ý và gây thêm ${toPercent(effect.noBleedExtraHpPercent)} HP tối đa, giới hạn ${toPercent(maxExtra)} Công`;
    }
    if (effect.type === 'bladeCriticalIntent') {
      const maxStacks = Math.max(1, Number(effect.maxStacks) || 5);
      return `đòn chí mạng tiếp theo tăng ${toPercent(effect.baseCritDamageBonus)} sát thương chí mạng, mỗi Đao Ý tiêu hao thêm ${toPercent(effect.critDamagePerIntentStack)}, tối đa ${maxStacks} tầng`;
    }
    if (effect.type === 'bladeIntentSkillBurst') {
      return `tiêu hao toàn bộ Đao Ý, mỗi tầng tăng ${toPercent(effect.perIntentDamageBonus)} sát thương skill`;
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
  const swordIntentEffect = getSkillEffects(skill, level).find((effect) => effect.type === 'swordIntent' && effect.action === 'gain');
  const swordIntent = skill?.schoolId === 'sword_cultivator' ? swordIntentEffect : null;
  const swordIntentText = swordIntent
    ? `${toPercent(swordIntent.chance)} tỷ lệ nhận 1 tầng Kiếm Ý khi skill đánh trúng; mỗi tầng tăng ${toPercent(swordIntent.skillDamagePerStack)} sát thương skill, tối đa ${swordIntent.maxStacks || 5} tầng, không tiêu hao trong trận.`
    : '';
  if (skill?.id === 'sword_domain') {
    const effects = getSkillEffects(skill, level);
    const attackBuff = effects.find((effect) => effect.stat === 'attack');
    const critBuff = effects.find((effect) => effect.stat === 'critRate');
    const duration = Math.max(1, Number(attackBuff?.duration || critBuff?.duration) || 3);
    return `Gây ${Math.round(getSkillMultiplier(skill, level) * 100)}% sát thương Công lên kẻ địch và tăng Công +${toPercent(attackBuff?.value)} cộng thêm, tăng Chí mạng +${toPercent(critBuff?.value)} cộng thêm trong ${duration} lượt, không cộng dồn.${swordIntentText ? ` ${swordIntentText}` : ''}`;
  }
  const parts = [`Gây ${Math.round(getSkillMultiplier(skill, level) * 100)}% Công lên kẻ địch`];
  const effectText = formatSkillEffects(skill, level);
  if (effectText !== 'Không có hiệu ứng thêm') parts.push(effectText);
  return `${parts.join(' và ')}.`;
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
    const active = skill.id === skillTrainingId && !practiceReady && level < maxLevel;
    const duplicateGradeSkill = equipped
      ? null
      : getEquippedSkillWithGrade(skill.gradeId, skill.id);
    const equipText = equipped
      ? 'Tháo skill'
      : equippedSkillIds.length >= maxEquipped
      ? 'Đầy ô skill'
      : getPlayerCultivationTier() < getSkillRequiredTier(skill)
      ? `Yêu cầu ${getTierRealmText(getSkillRequiredTier(skill))}`
      : duplicateGradeSkill
      ? 'Trùng phẩm chất'
      : 'Trang bị';
    const trainingText = level >= maxLevel
      ? 'Đã đạt cấp tối đa'
      : practiceReady
      ? 'Chờ nâng cấp'
      : active
      ? 'Đang tu luyện'
      : 'Tu luyện';
    const progressAction = practiceReady ? 'upgrade' : 'select';
    const progressText = practiceReady
      ? bookRequired
        ? `Nâng cấp cần ${bookRequired} sách`
        : 'Nâng cấp'
      : trainingText;
    const progressButton = level < maxLevel
      ? `<button type="button" class="${practiceReady && canUpgrade ? 'breakthrough skill-upgrade-ready' : active ? 'breakthrough' : 'secondary'} compact" ${buttonDisabledAttributes(practiceReady ? !canUpgrade : false, practiceReady ? 'Chưa có đủ sách skill.' : 'Skill đã đủ tiến độ, hãy nâng cấp trước.')} data-skill-action="${progressAction}" data-skill-id="${skill.id}">${progressText}</button>`
      : '';
    const detailsOpen = expandedSkillDetailsId === skill.id;
    const skillDescription = skill.description || 'Gây sát thương lên kẻ địch.';
    const skillIconClass = getSkillItemIconMarkupClass(skill.id);
    return `
      <div class="feature-item grade-${skill.gradeId || 'mortal'} ${active ? 'active' : ''}" style="--skill-rarity-color: ${getSkillGradeColor(skill.gradeId)};">
        <strong class="skill-title"><i class="${skillIconClass}" aria-hidden="true"><b class="skill-level-badge">+${level}</b></i><span class="skill-name">${skill.name}</span><span class="skill-power">LC +${formatGameNumber(skillPower)}</span></strong>
        <small class="skill-mana-cost"><i class="stat-icon icon-stat-mana" aria-hidden="true"></i>Linh lực cần ${formatGameNumber(getSkillManaCost(skill, level))} · Hồi chiêu ${formatGameNumber(Math.max(1, Number(skill.cooldown) || 1))} lượt</small>
        <button type="button" class="skill-description-toggle" data-skill-action="details" data-skill-id="${skill.id}" aria-expanded="${detailsOpen}"><span>${skillDescription}</span><small>${detailsOpen ? 'Ẩn chi tiết' : 'Xem chi tiết'}</small></button>
        ${detailsOpen ? `<div class="skill-description-detail">${formatSkillDisplayNote(skill, level)}</div>` : ''}
        <div class="skill-practice-label"><span>Tu luyện ${practice}/${level >= maxLevel ? 'Tối đa' : practiceRequired}</span><strong>${level >= maxLevel ? 'Đã viên mãn' : `${practicePercent}%`}</strong></div>
        <div class="skill-practice-bar"><i style="width: ${practicePercent}%"></i></div>
        <div class="skill-actions">
          ${progressButton}
          <button type="button" class="secondary compact" ${buttonDisabledAttributes(!equipped && (equippedSkillIds.length >= maxEquipped || getPlayerCultivationTier() < getSkillRequiredTier(skill) || Boolean(duplicateGradeSkill)), duplicateGradeSkill ? `Đã có ${duplicateGradeSkill.name} cùng phẩm chất.` : equippedSkillIds.length >= maxEquipped ? 'Đã đầy ô skill.' : `Cần ${getTierRealmText(getSkillRequiredTier(skill))} để trang bị skill.`)} data-skill-action="equip" data-skill-id="${skill.id}">${equipText}</button>
        </div>
      </div>
    `;
  }).join('') : '<div class="inventory-empty"><i class="stat-icon icon-stat-skill" aria-hidden="true"></i><span>Chưa học skill nào.</span></div>';
}

function toggleSkillDetails(skillId) {
  expandedSkillDetailsId = expandedSkillDetailsId === skillId ? '' : skillId;
  renderSkills();
}

function selectSkillTraining(skillId) {
  if (busy) return;
  const skill = getPlayerSkills().find((entry) => entry.id === skillId);
  if (!skill || !isSkillLearned(skill.id)) return;
  const level = getSkillLevel(skill.id);
  const practiceRequired = getSkillPracticeRequired(skill, level + 1);
  if (level >= getSkillMaxLevel() || getSkillPractice(skill.id) >= practiceRequired) {
    skillTrainingId = '';
    setPanelMessage('skillsMessage', `${skill.name} đã đạt 100%, hãy nâng cấp trước khi tu luyện tiếp.`);
    showGameToast(`${skill.name} đã đạt 100%, hãy nâng cấp trước khi tu luyện tiếp.`, 'info');
    renderSkills();
    saveGame();
    return;
  }
  skillTrainingId = skill.id;
  setPanelMessage('skillsMessage', `Đang tu luyện ${skill.name}.`);
  showGameToast(`Đã chọn ${skill.name} để tu luyện.`, 'info');
  renderSkills();
  saveGame();
}

function learnSkill(skillId) {
  if (busy) return;
  const skill = getPlayerSkills().find((entry) => entry.id === skillId);
  if (!skill || isSkillLearned(skill.id)) return;
  if (getPlayerCultivationTier() < getSkillRequiredTier(skill)) {
    setPanelMessage('skillsMessage', `Chưa đủ tu vi để học ${skill.name}.`);
    showGameToast(`Chưa đủ tu vi để học ${skill.name}.`, 'error');
    return;
  }
  learnedSkillIds.push(skill.id);
  grantSkillLearningComprehension();
  skillLevels[skill.id] = 0;
  skillPractice[skill.id] = 0;
  skillTrainingId = '';
  activeSkillId = skill.id;
  setPanelMessage('skillsMessage', `Đã học ${skill.name}. Hãy bấm Tu luyện để bắt đầu.`);
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
    setPanelMessage('skillsMessage', `Cần tu luyện ${skill.name} đạt ${practiceRequired} trước.`);
    showGameToast(`Chưa đủ tiến độ để nâng ${skill.name}.`, 'error');
    return;
  }
  if (getSkillBookCount(skill.id) < bookRequired) {
    setPanelMessage('skillsMessage', `Cần ${bookRequired} sách ${skill.name} để nâng lên cấp ${targetLevel}.`);
    showGameToast(`Chưa đủ sách skill để nâng ${skill.name}.`, 'error');
    return;
  }
  if (bookRequired) skillBooks[skill.id] = getSkillBookCount(skill.id) - bookRequired;
  skillLevels[skill.id] = targetLevel;
  skillPractice[skill.id] = 0;
  if (skillTrainingId === skill.id) skillTrainingId = '';
  setPanelMessage('skillsMessage', `${skill.name} đã tăng lên cấp ${targetLevel}. Hãy bấm Chọn tu luyện để luyện tiếp.`);
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
    setPanelMessage('skillsMessage', `Đã tháo ${skill.name}.`);
    showGameToast(`Đã tháo ${skill.name}.`, 'success');
  } else {
    if (getPlayerCultivationTier() < getSkillRequiredTier(skill)) {
      showGameToast(`Chưa đủ tu vi để trang bị ${skill.name}.`, 'error');
      return;
    }
    const duplicateGradeSkill = getEquippedSkillWithGrade(skill.gradeId, skill.id);
    if (duplicateGradeSkill) {
      showGameToast(`Không thể trang bị ${skill.name}: đã có ${duplicateGradeSkill.name} cùng phẩm chất.`, 'error');
      return;
    }
    if (equippedSkillIds.length >= getMaxEquippedSkills()) {
      setPanelMessage('skillsMessage', `Cần tu vi để mở ô skill tiếp theo hoặc hãy tháo một skill.`);
      showGameToast('Chưa thể trang bị thêm skill.', 'error');
      return;
    }
    equippedSkillIds.push(skill.id);
    if (!activeSkillId) activeSkillId = skill.id;
    setPanelMessage('skillsMessage', `Đã trang bị ${skill.name}.`);
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
  setPanelMessage('skillsMessage', `Đã chọn ${skill.name}.`);
  showGameToast(`Đã chọn ${skill.name} làm skill chủ động.`, 'info');
  renderSkills();
  renderCultivation();
  renderProfile();
  saveGame();
}
