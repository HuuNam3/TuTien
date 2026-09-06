// Breakthrough panel and realm progression handlers. Shared state remains owned by main.js.
function getMinorBreakthroughPillId(majorRealmIndex = playerMajorRealmIndex) {
  const realm = cultivationProgression[majorRealmIndex];
  if (!realm) return '';
  return `${String(minorBreakthroughPillConfig.idPrefix || 'minorAscensionPill')}${realm.id}`;
}

function getRequiredBreakthroughPill() {
  if (playerLevel < getMinorRealmLevelCap()) {
    return shopItems.find((item) => item.id === getMinorBreakthroughPillId()) || null;
  }
  if (!hasNextMajorRealm()) return null;
  return shopItems.find((item) => item.id === ascensionPermitItemId) || null;
}

function getAvailableBreakthroughTreasures(targetMajorRealmIndex) {
  return talentTreasureInventory.filter((item) => item.targetMajorRealmIndex === targetMajorRealmIndex);
}

function getSelectedBreakthroughTreasure(targetMajorRealmIndex) {
  return getAvailableBreakthroughTreasures(targetMajorRealmIndex)
    .find((item) => item.id === selectedBreakthroughTreasureId) || null;
}

function getBreakthroughPreview() {
  const isMajorBreakthrough = playerLevel >= getMinorRealmLevelCap();
  if (!hasEnoughCultivationForBreakthrough()) return null;
  const nextMajorRealmIndex = isMajorBreakthrough ? playerMajorRealmIndex + 1 : playerMajorRealmIndex;
  const requiredPill = getRequiredBreakthroughPill();
  if (!requiredPill) return null;
  const nextLevel = isMajorBreakthrough ? 1 : playerLevel + 1;
  const currentStats = createFighter(playerName, playerLevel, true, playerMajorRealmIndex);
  const nextStats = createFighter(playerName, nextLevel, true, nextMajorRealmIndex);
  const statKeys = [
    'maxHp', 'maxMana', 'attack', 'defense', 'mastery', 'accuracy', 'dodgeRate',
    'blockRate', 'blockReduction', 'critRate', 'critDamage', 'armorPierce',
    'damageReduction', 'lifeSteal',
  ];
  const statChanges = statKeys
    .map((stat) => ({ stat, amount: (Number(nextStats[stat]) || 0) - (Number(currentStats[stat]) || 0) }))
    .filter(({ amount }) => amount > 0.000001);
  return {
    isMajorBreakthrough,
    currentRealm: getCurrentRealmText(),
    nextRealm: isMajorBreakthrough
      ? `${getNextMajorRealmName()} ${getMinorRealmName(1, nextMajorRealmIndex)}`
      : `${majorRealmNames[playerMajorRealmIndex]} ${getMinorRealmName(nextLevel)}`,
    requiredPill,
    statChanges,
    availableTreasures: isMajorBreakthrough ? getAvailableBreakthroughTreasures(nextMajorRealmIndex) : [],
    selectedTreasure: isMajorBreakthrough ? getSelectedBreakthroughTreasure(nextMajorRealmIndex) : null,
  };
}

function renderBreakthroughPanel() {
  const preview = getBreakthroughPreview();
  if (!preview) return false;
  const requiredCount = getShopInventoryCount(preview.requiredPill.id);
  breakthroughModalTitle.textContent = preview.isMajorBreakthrough
    ? `Thăng ${getNextMajorRealmName()}`
    : `Đột phá ${preview.nextRealm}`;
  const treasureSummary = preview.isMajorBreakthrough
    ? preview.selectedTreasure
      ? ` Đã chọn ${preview.selectedTreasure.name}.`
      : ' Hãy chọn một Cục Thiên Tài Địa Bảo đúng cảnh giới.'
    : '';
  breakthroughModalSummary.textContent = `${preview.currentRealm} → ${preview.nextRealm}. Đột phá sẽ tiêu hao 1 ${preview.requiredPill.name}.${treasureSummary}`;
  const previewStats = preview.isMajorBreakthrough
    ? (preview.selectedTreasure ? getTalentTreasureStatEntries(preview.selectedTreasure) : [])
    : preview.statChanges;
  const previewEmptyMessage = preview.isMajorBreakthrough
    ? 'Chưa có thiên tài địa bảo.'
    : 'Không có thông số tăng thêm.';
  breakthroughStatList.innerHTML = previewStats.length
    ? previewStats.map(({ stat, amount }) => {
      const icon = getStatIconClass(stat);
      const iconType = icon.startsWith('icon-unique-') ? 'unique-icon' : 'stat-icon';
      const value = isPercentStat(stat) ? toPercent(amount) : formatGameNumber(amount);
      return `<span class="breakthrough-stat"><i class="${iconType} ${icon}" aria-hidden="true"></i><b>${getStatLabel(stat)}</b><strong>+${value}</strong></span>`;
    }).join('')
    : `<span class="breakthrough-empty">${previewEmptyMessage}</span>`;
  breakthroughRequiredItem.innerHTML = `<i class="activity-icon icon-activity-gate" aria-hidden="true"></i><span>${preview.requiredPill.name}</span><strong>${requiredCount}/1</strong>`;
  breakthroughTreasureSection?.classList.toggle('is-hidden', !preview.isMajorBreakthrough);
  if (preview.isMajorBreakthrough) {
    breakthroughTreasureList.innerHTML = preview.availableTreasures.length
      ? preview.availableTreasures.map((treasure) => `
        <button type="button" class="breakthrough-treasure-option${treasure.id === preview.selectedTreasure?.id ? ' is-selected' : ''}" data-breakthrough-treasure="${treasure.id}" title="${treasure.name}: ${formatTalentTreasureStats(treasure)} · LC +${formatGameNumber(treasure.realizedCombatPower || treasure.combatPower)}" aria-label="${treasure.name}: ${formatTalentTreasureStats(treasure)} · LC +${formatGameNumber(treasure.realizedCombatPower || treasure.combatPower)}">
          ${getTalentTreasureIconMarkup(treasure)}
        </button>
      `).join('')
      : '<span class="breakthrough-empty">Chưa có cục phù hợp. Hãy mở Rương Thiên Tài Địa Bảo.</span>';
  } else {
    breakthroughTreasureList.innerHTML = '';
  }
  if (confirmBreakthroughButton) {
    confirmBreakthroughButton.disabled = preview.isMajorBreakthrough && !preview.selectedTreasure;
  }
  return true;
}

function openBreakthroughPanel() {
  if (busy) return;
  selectedBreakthroughTreasureId = '';
  if (!renderBreakthroughPanel()) {
    showGameToast('Chưa đủ tu vi hoặc vật phẩm để đột phá.', 'error');
    return;
  }
  breakthroughModal?.classList.remove('is-hidden');
  confirmBreakthroughButton?.focus();
}

function closeBreakthroughPanel() {
  breakthroughModal?.classList.add('is-hidden');
}

function breakthrough() {
  if (busy || !canBreakthrough()) return;

  const requiredPill = getRequiredBreakthroughPill();
  if (!requiredPill) return;
  const isMajorBreakthrough = playerLevel >= getMinorRealmLevelCap();
  const selectedTreasure = isMajorBreakthrough
    ? getSelectedBreakthroughTreasure(playerMajorRealmIndex + 1)
    : null;
  if (isMajorBreakthrough && !selectedTreasure) return;
  closeBreakthroughPanel();

  if (isMajorBreakthrough) {
    const required = getCultivationRequiredForNextLevel();
    playerCultivation -= required;
    playerMajorRealmIndex += 1;
    playerLevel = 1;
    shopInventoryCounts[requiredPill.id] = Math.max(0, getShopInventoryCount(requiredPill.id) - 1);
    selectedTreasure.statBonuses && Object.entries(selectedTreasure.statBonuses).forEach(([stat, amount]) => {
      playerTalentStatBonuses[stat] = (playerTalentStatBonuses[stat] || 0) + Math.max(0, Number(amount) || 0);
    });
    talentTreasureInventory = talentTreasureInventory.filter((item) => item.id !== selectedTreasure.id);
    selectedBreakthroughTreasureId = '';
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
  shopInventoryCounts[requiredPill.id] = Math.max(0, getShopInventoryCount(requiredPill.id) - 1);
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
  const requiredPill = getRequiredBreakthroughPill();
  if (!requiredPill || getShopInventoryCount(requiredPill.id) <= 0) return false;
  if (playerLevel >= getMinorRealmLevelCap()) {
    return Boolean(getSelectedBreakthroughTreasure(playerMajorRealmIndex + 1));
  }
  return true;
}

function canOpenBreakthroughPanel() {
  return hasEnoughCultivationForBreakthrough();
}

function hasEnoughCultivationForBreakthrough() {
  const required = getCultivationRequiredForNextLevel();
  return playerCultivation + 0.001 >= required;
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
  return `${majorRealmNames[playerMajorRealmIndex]} ${getMinorRealmName(playerLevel)}`;
}

