// Inventory, equipment, profile, and pet tab handlers. Shared state remains owned by main.js.
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
    ['Tinh thông', 'icon-stat-mastery', formatGameNumber(profileFighter.mastery)],
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
      <div class="profile-skill-row ${active ? 'active' : ''}" style="--skill-rarity-color: ${getSkillGradeColor(skill.gradeId)};">
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
    const levelClass = item ? getEquipmentLevelClass(item) : '';
    const levelColor = item ? getEquipmentLevelColor(item) : '';
    const rarityColor = item ? getEquipmentRarityColor(item) : '';
    return `
      <div class="profile-equipment-slot ${rarityClass} ${levelClass}" style="${item ? `--equipment-level-color: ${levelColor}; --rarity-color: ${rarityColor};` : ''}" title="${item ? `${getRarityName(item)} ${item.name}` : `${slot.name}: Trống`}">
        ${item ? getEquipmentIconMarkup(item) : '<i class="item-icon icon-item-robe" aria-hidden="true"></i>'}
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
  $('equipmentPowerText').textContent = `Trang bị  LC +${formatGameNumber(getEquipmentPower())}`;
  if ($('equipmentInventorySummary')) $('equipmentInventorySummary').textContent = `${inventory.length} vật phẩm`;
  $('equipmentStatsSummary').innerHTML = renderEquipmentContributionSummary();
  if (equipmentBulkSellRarity && equipmentBulkSellRarity.options.length <= 1) {
    equipmentBulkSellRarity.innerHTML = [
      '<option value="all">Tất cả phẩm cấp</option>',
      ...equipmentQualityOrder.map((rarityKey) => `<option value="${rarityKey}">${rarityData[rarityKey]?.name || rarityKey}</option>`),
    ].join('');
  }
  const quickEquipAvailable = hasQuickEquipCandidate();
  setButtonDisabledState(quickEquipButton, busy || !quickEquipAvailable, busy ? 'Đang xử lý, vui lòng chờ.' : 'Không có trang bị phù hợp để mặc nhanh.');
  setNotificationBadge(equipmentBadge, Number(quickEquipAvailable));
  $('equipmentSlots').innerHTML = equipmentSlots.map((slot) => {
    const item = equippedItems[slot.id];
    const levelClass = item ? getEquipmentLevelClass(item) : '';
    const levelColor = item ? getEquipmentLevelColor(item) : '';
    const rarityColor = item ? getEquipmentRarityColor(item) : '';
    return `
      <div class="equipment-slot ${item ? `${rarityData[item.rarityKey].className} ${levelClass}` : ''}" style="${item ? `--equipment-level-color: ${levelColor}; --rarity-color: ${rarityColor};` : ''}">
        ${item ? renderEquippedEquipmentSummary(item, slot.name) : `<span>${slot.name}</span><strong>Trống</strong><em>Chưa mặc trang bị</em>`}
        ${item ? `
          <div class="equipment-slot-actions">
            <button type="button" onclick="unequipItem('${slot.id}')">Tháo</button>
            <button type="button" class="secondary" data-enhance-equipped="${item.id}">Cường hóa</button>
          </div>
        ` : ''}
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
      const equipped = isEquipmentEquipped(item);
      const levelClass = getEquipmentLevelClass(item);
      const levelColor = getEquipmentLevelColor(item);
      const rarityColor = getEquipmentRarityColor(item);
      return `
        <div class="inventory-item ${rarityData[item.rarityKey].className} ${levelClass}" style="--equipment-level-color: ${levelColor}; --rarity-color: ${rarityColor};">
          ${renderEquippedEquipmentSummary(item, getSlotName(item.slotId))}
           <div class="inventory-equipment-actions">
             <button type="button" onclick="equipItem(${item.id})">Mặc</button>
             <button type="button" class="secondary" ${buttonDisabledAttributes(equipped, 'Không thể bán trang bị đang mặc.')} onclick="sellItem(${item.id})">
               ${equipped ? 'Đang mặc' : `Bán ${formatGameNumber(getEquipmentSellPrice(item))}`}
             </button>
           </div>
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
    .filter((shopItem) => !shopItem.hidden || getShopInventoryCount(shopItem.id) > 0 || shopItem.type === 'majorAscensionTreasureChest')
    .filter((shopItem) => ['cultivation', 'foundation', 'ascension', 'minorAscension', 'skillChest', 'talentTreasureChest', 'majorAscensionTreasureChest', 'enhancementRefund'].includes(shopItem.type))
    .forEach((shopItem) => {
      const count = getShopInventoryCount(shopItem.id);
      if (count <= 0) return;
      const category = shopItem.type === 'skillChest'
        ? 'Rương skill'
        : ['talentTreasureChest', 'majorAscensionTreasureChest'].includes(shopItem.type)
        ? 'Đột phá'
        : shopItem.type === 'majorAscensionTreasure'
        ? 'Đột phá'
        : isBreakthroughPillShopItem(shopItem)
        ? 'Đột phá'
        : shopItem.type === 'foundation'
        ? 'Tu luyện'
        : shopItem.type === 'enhancementRefund'
        ? 'Nguyên liệu'
        : 'Tu vi';
      items.push({
        id: `shop-item-${shopItem.id}`,
        shopItemId: shopItem.id,
        name: shopItem.name,
        category,
        count,
        iconClass: getShopItemBagIconClass(shopItem),
        rarityClass: shopItem.type === 'skillChest'
          ? `${rarityData[getSkillGradeRarityKey(shopItem.gradeId)]?.className || 'common'} skill-rarity-item`
          : '',
        rarityColor: shopItem.type === 'skillChest' ? getSkillGradeColor(shopItem.gradeId) : '',
        description: shopItem.description || getShopItemDetailLines(shopItem).join(' '),
        usable: !isBreakthroughPillShopItem(shopItem) && shopItem.type !== 'enhancementRefund' && shopItem.type !== 'majorAscensionTreasure',
        useLabel: ['skillChest', 'talentTreasureChest', 'majorAscensionTreasureChest'].includes(shopItem.type)
          ? 'Mở'
          : isBreakthroughPillShopItem(shopItem) || shopItem.type === 'enhancementRefund' || shopItem.type === 'majorAscensionTreasure'
          ? ''
          : 'Dùng',
      });
    });

  talentTreasureInventory.forEach((item) => {
    const definition = shopItems.find((shopItem) => shopItem.id === item.shopItemId);
    if (!definition) return;
    items.push({
      id: item.id,
      shopItemId: item.shopItemId,
      name: item.name || definition.name,
      category: 'Đột phá',
      count: 1,
      iconClass: 'activity-icon icon-activity-gate',
      description: `Dành cho đột phá lên ${majorRealmNames[item.targetMajorRealmIndex] || 'đại cảnh giới kế tiếp'}. LC cục: ${formatGameNumber(item.realizedCombatPower || item.combatPower)}.`,
      talentTreasure: true,
      targetMajorRealmIndex: item.targetMajorRealmIndex,
      allocation: item.allocation,
      statBonuses: item.statBonuses,
      usable: false,
      useLabel: '',
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
      iconClass: getSkillItemIconMarkupClass(skillId),
      rarityClass: `${rarityData[getSkillGradeRarityKey(skill.gradeId)]?.className || 'common'} skill-rarity-item`,
      rarityColor: getSkillGradeColor(skill.gradeId),
      description: `Dùng để nâng cấp ${skill.name}.`,
      usable: !isSkillLearned(skill.id) && getPlayerCultivationTier() >= getSkillRequiredTier(skill),
      useLabel: 'Học skill',
      sellable: true,
      sellPrice: getSkillMaterialSellPrice(skill, 'book'),
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
      iconClass: getSkillItemIconMarkupClass(skillId),
      rarityClass: `${rarityData[getSkillGradeRarityKey(skill.gradeId)]?.className || 'common'} skill-rarity-item`,
      rarityColor: getSkillGradeColor(skill.gradeId),
      description: `Mảnh dùng để ghép sách skill ${skill.name}.`,
      usable: false,
      sellable: true,
      sellPrice: getSkillMaterialSellPrice(skill, 'fragment'),
    });
  });

  Object.entries(petFragments).forEach(([petId, count]) => {
    const pet = getPetById(petId);
    const safeCount = getPetFragmentCount(petId);
    if (!pet || safeCount <= 0) return;
    items.push({
      id: `pet-fragment-${petId}`,
      name: `Mảnh linh thú: ${pet.name}`,
      category: 'Mảnh linh thú',
      petName: pet.name,
      count: safeCount,
      iconClass: 'activity-icon icon-activity-encounter',
      rarityClass: `pet-quality-${getPetRarity(pet).id}`,
      description: `Mảnh dùng để ghép linh thú ${pet.name}.`,
      usable: false,
      sellable: false,
    });
  });

  equipmentChestInventory.forEach((chest) => {
    const chestRarityKey = getEquipmentChestDisplayRarityKey(chest);
    items.push({
      id: chest.id,
      type: 'equipmentChest',
      name: chest.name,
      category: 'Rương',
      count: chest.count,
      chestTier: chest.tier,
      iconClass: 'activity-icon icon-activity-chest',
      rarityClass: chestRarityKey,
      rarityColor: rarityData[chestRarityKey]?.color || '#526176',
      description: `Rương cấp ${getEquipmentChestTier(chest)} mở trang bị cấp ${getChestLevelRange(chest).join('-')}.`,
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
  if (item.talentTreasure) {
    details.push(`Dành cho đột phá lên ${majorRealmNames[item.targetMajorRealmIndex] || 'đại cảnh giới kế tiếp'}.`);
    details.push(`Phân bổ roll: ${Object.entries(item.allocation || {}).map(([stat, percent]) => `${getStatLabel(stat)} ${formatGameNumber(percent)}%`).join(' · ')}.`);
    details.push(`Thông số cộng: ${formatTalentTreasureStats(item)}.`);
  }
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
  if (item.category === 'Mảnh linh thú') {
    details.push(`Đủ ${getPetFragmentRequirement()} mảnh sẽ tự ghép thành 1 linh thú ${item.petName}.`);
  }
  if (item.sellable) details.push(`Bán 1 cái nhận ${formatGameNumber(item.sellPrice)} linh thạch.`);
  if (item.shopItemId) {
    const shopItem = shopItems.find((entry) => entry.id === item.shopItemId);
    if (shopItem?.type === 'cultivation') details.push(`Nhận ${formatGameNumber(shopItem.cultivation)} tu vi khi dùng.`);
    if (shopItem?.type === 'foundation') details.push(`Nhận ${formatGameNumber(getFoundationPillAmount(shopItem))} căn cơ khi dùng.`);
    if (shopItem?.type === 'ascension') details.push('Chỉ dùng tại nút thăng đại cảnh giới tiếp theo.');
    if (shopItem?.type === 'minorAscension') details.push('Chỉ dùng tại nút đột phá tiểu cảnh giới hiện tại.');
    if (shopItem?.type === 'skillChest') details.push('Mở rương để nhận 1 mảnh skill hoặc 1 sách skill theo tỉ lệ của rương.');
    if (shopItem?.type === 'petChest') details.push(`Mở rương nhận 1, 2 hoặc 5 mảnh linh thú; đủ ${getPetFragmentRequirement()} mảnh sẽ tự ghép thành 1 linh thú.`);
    if (shopItem?.type === 'talentTreasureChest') details.push('Mở rương nhận 1 Cục Thiên Tài Địa Bảo.');
    if (shopItem?.type === 'majorAscensionTreasureChest') details.push(`Mở rương nhận 1 Cục Thiên Tài Địa Bảo ${majorRealmNames[shopItem.targetMajorRealmIndex] || 'của đại cảnh giới kế tiếp'}.`);
    if (shopItem?.type === 'majorAscensionTreasure') details.push('Dùng khi đột phá đại cảnh giới để roll ngẫu nhiên chỉ số theo lực chiến nhận được.');
    if (shopItem?.type === 'enhancementRefund') details.push('Không dùng trực tiếp; chỉ dùng trong panel cường hóa trang bị. Mỗi lần hoàn tiêu hao 1 cục.');
  }
  if (item.category === 'Rương') {
    const profile = getEquipmentRarityProfile(item);
    const rates = equipmentQualityOrder
      .map((rarityKey, index) => `<span class="rarity-rate rarity-${rarityKey}">${rarityData[rarityKey]?.name || rarityKey} ${formatGameNumber(profile.weights[index] || 0)}%</span>`)
      .join(' · ');
    details.push(`Tỉ lệ phẩm chất: ${rates}`);
    details.push(`Có thể mở nhiều rương cùng lúc; mỗi lần mở tạo một trang bị.`);
  }
  if (item.category === 'Rương skill') details.push(`Có thể mở nhiều rương cùng lúc; đủ 5 mảnh của cùng skill sẽ tự ghép thành 1 sách.`);
  return details;
}

function sellInventoryItem(itemId, amount = 1) {
  if (busy) return false;
  const item = getInventoryItem(itemId);
  if (!item?.sellable) return false;
  const requested = clamp(Math.floor(Number(amount) || 1), 1, Math.max(1, Number(item.count) || 1));
  const skillId = String(item.id).replace(/^skill-(?:book|fragment)-/, '');
  const isFragment = item.category === 'Mảnh skill';
  const counts = isFragment ? skillFragments : skillBooks;
  const available = isFragment ? getSkillFragmentCount(skillId) : getSkillBookCount(skillId);
  const sold = Math.min(requested, available);
  if (sold <= 0) return false;
  const materialLabel = isFragment ? 'mảnh skill' : 'sách skill';
  const totalPrice = sold * item.sellPrice;
  if (!window.confirm(`Bán ${materialLabel} ${item.name.replace(/^Sách skill: |^Mảnh skill: /, '')} x${sold} để nhận ${formatGameNumber(totalPrice)} linh thạch?`)) return false;
  counts[skillId] = available - sold;
  playerSpiritStones += totalPrice;
  showGameToast(`Đã bán ${materialLabel} ${item.name.replace(/^Sách skill: |^Mảnh skill: /, '')} x${sold}, nhận ${formatGameNumber(totalPrice)} linh thạch.`, 'success');
  renderCultivation();
  renderInventory();
  renderShop();
  renderProfile();
  saveGame();
  return true;
}

function usePurchasedShopItem(item, amount = 1) {
  const shopItem = shopItems.find((entry) => entry.id === item.shopItemId);
  if (!shopItem) return 0;
  const requested = Math.max(1, Math.floor(Number(amount) || 1));
  let used = 0;
  const skillChestRewards = [];
  const petChestRewards = [];
  const talentTreasureRewards = [];

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
    } else if (shopItem.type === 'petChest') {
      const reward = openPetChest(shopItem);
      canUse = Boolean(reward);
      if (reward) petChestRewards.push(reward);
    } else if (['talentTreasureChest', 'majorAscensionTreasureChest'].includes(shopItem.type)) {
      const reward = openTalentTreasureChest(shopItem);
      canUse = Boolean(reward);
      if (reward) talentTreasureRewards.push(reward);
    }
    if (!canUse) break;
    shopInventoryCounts[shopItem.id] = getShopInventoryCount(shopItem.id) - 1;
    used += 1;
  }

  if (!used) return 0;
  if (shopItem.type === 'skillChest') {
    const rewardNameCounts = new Map();
    skillChestRewards.forEach((reward) => {
      const kindLabel = reward.kind === 'book' ? 'Sách skill' : 'Mảnh skill';
      const key = `${reward.kind}:${reward.skill.id}`;
      const current = rewardNameCounts.get(key) || { kindLabel, name: reward.skill.name, count: 0 };
      current.count += 1;
      rewardNameCounts.set(key, current);
    });
    const completedBooks = skillChestRewards.reduce((total, reward) => total + reward.completedBooks, 0);
    const rewardParts = Array.from(rewardNameCounts.values())
      .map((reward) => `${reward.kindLabel} ${reward.name} x${reward.count}`);
    if (completedBooks) rewardParts.push(`ghép ${completedBooks} sách skill`);
    showGameToast(`Đã mở ${shopItem.name}${used > 1 ? ` x${used}` : ''}: ${rewardParts.join(', ')}.`, 'success');
  } else if (shopItem.type === 'petChest') {
    const rewardCounts = new Map();
    petChestRewards.forEach((reward) => {
      const current = rewardCounts.get(reward.pet.id) || { name: reward.pet.name, count: 0 };
      current.count += reward.fragments;
      rewardCounts.set(reward.pet.id, current);
    });
    const rewardParts = Array.from(rewardCounts.values())
      .map((reward) => `Mảnh ${reward.name} x${reward.count}`);
    const createdPets = [...new Set(petChestRewards
      .filter((reward) => reward.createdPets > 0)
      .map((reward) => reward.pet.name))];
    if (createdPets.length) rewardParts.push(`ghép ${createdPets.join(', ')}`);
    showGameToast(`Đã mở ${shopItem.name}${used > 1 ? ` x${used}` : ''}: ${rewardParts.join(', ')}.`, 'success');
  } else if (['talentTreasureChest', 'majorAscensionTreasureChest'].includes(shopItem.type)) {
    const rewardName = talentTreasureRewards[0]?.name || 'Cục Thiên Tài Địa Bảo';
    showGameToast(`Đã mở ${shopItem.name}${used > 1 ? ` x${used}` : ''}: nhận ${rewardName}${used > 1 ? ` x${used}` : ''}.`, 'success');
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

function renderPotionExchangePanel(exchange) {
  const maxExchanges = Math.max(0, Math.floor(Number(exchange.maxExchanges) || 0));
  const inputDisabled = maxExchanges > 0 ? '' : ' disabled';
  const unavailable = maxExchanges > 0 ? '' : ' is-unavailable';
  const sourceIcon = '<i class="' + exchange.sourceIconClass + '" aria-hidden="true"></i>';
  const targetIcon = '<i class="' + exchange.targetIconClass + '" aria-hidden="true"></i>';
  return [
    '      <div class="inventory-detail-exchange">',
    '        <strong>Đổi đan</strong>',
    '        <div class="potion-exchange-recipe">',
    '          <div class="potion-exchange-side">',
    '            <div class="potion-exchange-icons" aria-hidden="true">' + sourceIcon + '</div>',
    '            <span>x' + exchange.sourceAmount + ' ' + exchange.sourceName + '</span>',
    '          </div>',
    '          <b class="potion-exchange-arrow" aria-hidden="true">→</b>',
    '          <div class="potion-exchange-side">',
    '            <div class="potion-exchange-icons" aria-hidden="true">' + targetIcon + '</div>',
    '            <span>' + exchange.targetAmount + ' ' + exchange.targetName + '</span>',
    '          </div>',
    '        </div>',
    '        <label class="shop-detail-quantity">Số lần đổi (mỗi lần ' + exchange.sourceAmount + ' viên)',
    '          <input id="inventoryExchangeQuantity" type="number" min="1" max="' + maxExchanges + '" value="' + (maxExchanges > 0 ? 1 : 0) + '"' + inputDisabled + '>',
    '        </label>',
    '        <small class="inventory-exchange-available">Có thể đổi tối đa ' + maxExchanges + ' lần.</small>',
    '        <button type="button" class="breakthrough inventory-detail-exchange-button' + unavailable + '" data-exchange-direction="' + exchange.direction + '" aria-disabled="' + String(maxExchanges < 1) + '" title="' + (maxExchanges > 0 ? 'Đổi đan' : 'Cần ' + exchange.sourceAmount + ' ' + exchange.sourceName + ' để đổi') + '">',
    '          Đổi',
    '        </button>',
    '      </div>',
  ].join('');
}

function openInventoryItemDetail(itemId) {
  if (busy) return;
  const item = getInventoryItem(itemId);
  if (!item) return;
  const canUse = Boolean(item.usable);
  const potionExchange = item.id === 'health-potion'
    ? {
      direction: 'healthToMana',
      sourceIconClass: 'item-icon icon-item-health-pill',
      sourceName: 'Sinh Huyết Đan',
      targetIconClass: 'item-icon icon-item-mana-flame',
      targetName: 'Tụ Linh Đan',
      sourceAmount: 6,
      targetAmount: 1,
      maxExchanges: Math.floor(healthPotionCount / 6),
    }
    : item.id === 'mana-potion'
    ? {
      direction: 'manaToHealth',
      sourceIconClass: 'item-icon icon-item-mana-flame',
      sourceName: 'Tụ Linh Đan',
      targetIconClass: 'item-icon icon-item-health-pill',
      targetName: 'Sinh Huyết Đan',
      sourceAmount: 6,
      targetAmount: 1,
      maxExchanges: Math.floor(manaPotionCount / 6),
    }
    : null;
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
      ${potionExchange ? renderPotionExchangePanel(potionExchange) : ''}
      ${canUse ? `<label class="shop-detail-quantity">Số lượng
        <input id="inventoryDetailQuantity" type="number" min="1" max="${maxQuantity}" value="1">
      </label>
      <button type="button" class="breakthrough inventory-detail-use">${item.useLabel || 'Dùng'}</button>` : potionExchange ? '' : '<em class="shop-detail-lock">Vật phẩm này chưa có thao tác sử dụng trực tiếp.</em>'}
    </div>
  `;
  inventoryDetailOverlay.classList.remove('is-hidden');
  inventoryDetailOverlay.querySelector('.inventory-detail-close')?.addEventListener('click', hideInventoryItemDetail);
  inventoryDetailOverlay.querySelector('.inventory-detail-use')?.addEventListener('click', () => {
    const quantity = clamp(Math.floor(Number(inventoryDetailOverlay.querySelector('#inventoryDetailQuantity')?.value) || 1), 1, maxQuantity);
    if (useInventoryItem(item.id, quantity)) hideInventoryItemDetail();
  });
  inventoryDetailOverlay.querySelector('.inventory-detail-exchange-button')?.addEventListener('click', (event) => {
    if (!potionExchange) return;
    if (potionExchange.maxExchanges < 1) {
      showGameToast('Cần ' + potionExchange.sourceAmount + ' ' + potionExchange.sourceName + ' để đổi.', 'error');
      return;
    }
    const quantityInput = inventoryDetailOverlay.querySelector('#inventoryExchangeQuantity');
    const quantity = clamp(Math.floor(Number(quantityInput?.value) || 1), 1, potionExchange.maxExchanges);
    const sourceTotal = quantity * potionExchange.sourceAmount;
    const targetTotal = quantity * potionExchange.targetAmount;
    const confirmed = window.confirm('Đổi ' + sourceTotal + ' ' + potionExchange.sourceName + ' lấy ' + targetTotal + ' ' + potionExchange.targetName + '?');
    if (confirmed && exchangePotions(event.currentTarget.dataset.exchangeDirection, quantity)) hideInventoryItemDetail();
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
      <div class="inventory-item bag-item ${item.rarityClass || ''} ${item.type === 'equipmentChest' ? 'equipment-chest-item' : ''}"${item.rarityColor ? ` style="--rarity-color:${item.rarityColor}"` : ''}>
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
           ${item.sellable ? `<button type="button" class="secondary" data-inventory-sell="${item.id}">Bán ${formatGameNumber(item.sellPrice)}</button>` : ''}
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

function getEquipmentSellPrice(item) {
  const level = Math.max(1, Math.floor(Number(item?.level) || 1));
  const chestTier = Math.max(
    1,
    Math.floor(Number(item?.sourceChestTier) || Math.ceil(level / equipmentLevelsPerChestTier)),
  );
  const rarityIndex = Math.max(0, equipmentQualityOrder.indexOf(item?.rarityKey));
  const basePricePerChestTier = Math.max(
    0,
    Number(progressionFeatures.enhancement?.sellBasePricePerChestTier) || 15,
  );
  const pricePerRarityTier = Math.max(
    0,
    Number(progressionFeatures.enhancement?.sellPricePerRarityTier) || 5,
  );
  const pricePerEnhancementLevel = Math.max(
    0,
    Number(progressionFeatures.enhancement?.sellPricePerEnhancementLevel) || 50,
  );
  const enhancementLevel = Math.max(0, Math.floor(Number(item?.enhancementLevel) || 0));
  return Math.max(1, Math.floor(
    (basePricePerChestTier * chestTier)
    + (pricePerRarityTier * rarityIndex)
    + (pricePerEnhancementLevel * enhancementLevel),
  ));
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
  setPanelMessage('equipmentMessage', `Đã bán ${getRarityName(item)} ${item.name}, nhận ${formatGameNumber(price)} linh thạch.`);
  showGameToast(`Đã bán ${getRarityName(item)} ${item.name}, nhận ${formatGameNumber(price)} linh thạch.`, 'success');
  renderEquipment();
  renderCultivation();
  renderShop();
  saveGame();
}

function sellEquipmentByRarity(rarityKey = 'all') {
  if (busy) return;
  const selectedRarityIndex = equipmentQualityOrder.indexOf(rarityKey);
  const sellable = inventory.filter((item) => (
    (rarityKey === 'all'
      || (selectedRarityIndex >= 0 && equipmentQualityOrder.indexOf(item.rarityKey) <= selectedRarityIndex))
    && !isEquipmentEquipped(item)
  ));
  if (!sellable.length) {
    const rarityName = rarityKey === 'all' ? 'nào' : (rarityData[rarityKey]?.name || 'phẩm cấp này');
    showGameToast(`Không có trang bị ${rarityName} để bán.`, 'error');
    return;
  }

  const rarityName = rarityKey === 'all'
    ? 'tất cả phẩm cấp'
    : `${rarityData[rarityKey]?.name || rarityKey} trở xuống`;
  if (!window.confirm(`Bán ${sellable.length} trang bị ${rarityName}? Trang bị đang mặc sẽ được giữ lại.`)) return;

  const sellableIds = new Set(sellable.map((item) => String(item.id)));
  const totalPrice = sellable.reduce((sum, item) => sum + getEquipmentSellPrice(item), 0);
  inventory = inventory.filter((item) => !sellableIds.has(String(item.id)) || isEquipmentEquipped(item));
  playerSpiritStones += totalPrice;
  const message = `Đã bán ${sellable.length} trang bị ${rarityName}, nhận ${formatGameNumber(totalPrice)} linh thạch.`;
  setPanelMessage('equipmentMessage', message);
  showGameToast(message, 'success');
  renderEquipment();
  renderProfile();
  renderCultivation();
  renderShop();
  saveGame();
}

function renderEquipmentSummary(item, options = {}) {
  return `
        ${options.showSlotName === false ? '' : `<strong>${getSlotName(item.slotId)}</strong>`}
        <strong>${getEquipmentIconMarkup(item)}${getRarityName(item)} ${item.name}</strong>
    ${item.setName ? `<small class="equipment-set-name">${item.setName}</small>` : ''}
    <em>Lực chiến +${formatGameNumber(getItemPower(item))}</em>
    ${formatItemStats(item.stats) ? `<small class="item-stat-list">${formatItemStats(item.stats)}</small>` : ''}
    ${renderEquipmentSpecials(item.specialLines)}
  `;
}

function getEquipmentLevelClass(item) {
  const level = Math.max(1, Math.min(50, Math.floor(Number(item?.level) || 1)));
  return `equipment-level-${level}`;
}

function getEquipmentLevelColor(item) {
  const level = Math.max(1, Math.floor(Number(item?.level) || 1));
  const group = equipmentLevelColorGroups.find((entry) => (
    level >= Math.max(1, Number(entry?.minLevel) || 1)
    && level <= Math.max(1, Number(entry?.maxLevel) || 1)
  ));
  return group?.color || '#f5f7fa';
}

function getEquipmentRarityColor(item) {
  return rarityData[item?.rarityKey]?.color || '#f5f7fa';
}

function getEnhancementLevelColor(level) {
  const normalizedLevel = Math.max(0, Math.floor(Number(level) || 0));
  const paletteIndex = normalizedLevel <= 5 ? 0 : Math.floor((normalizedLevel - 1) / 5);
  const rarityKey = equipmentQualityOrder[paletteIndex]
    || equipmentQualityOrder[equipmentQualityOrder.length - 1]
    || 'common';
  return rarityData[rarityKey]?.color || '#f5f7fa';
}

function renderEquippedEquipmentSummary(item, slotName, options = {}) {
  const specialMarkup = renderEquipmentSpecials(item.specialLines || []);
  return `
    <div class="equipped-equipment-summary">
      <div class="equipped-equipment-heading"><span>${slotName}</span><b>LC +${formatGameNumber(getItemPower(item))}</b></div>
      <div class="equipped-equipment-name">
        <span class="equipped-equipment-visual">${getEquipmentIconMarkup(item)}</span>
        <span class="equipped-equipment-name-copy"><strong>${item.name}</strong></span>
      </div>
      ${item.setName ? `<small class="equipment-set-name">${item.setName}</small>` : ''}
      ${options.showStats !== false && formatItemStats(item.stats) ? `<div class="equipped-equipment-stats">${formatItemStats(item.stats)}</div>` : ''}
      ${options.showSpecials !== false ? (specialMarkup || '<div class="equipped-equipment-specials equipped-equipment-specials-placeholder" aria-hidden="true"></div>') : ''}
    </div>
  `;
}

function getEquipmentIconMarkup(item) {
  const slotId = item?.slotId;
  const names = equipmentTemplates[slotId]?.names || [];
  const itemIndex = names.indexOf(item?.name);
  const assignment = equipmentIconFramesBySlot[slotId]?.[itemIndex];
  const sheetPath = assignment ? equipmentIconSheets[assignment[0]] : '';
  const frame = Number(assignment?.[1]);
  const enhancementLevel = Math.max(0, Math.floor(Number(item?.enhancementLevel) || 0));
  const equipmentLevel = Math.max(1, Math.floor(Number(item?.level) || 1));
  const enhancementColor = getEnhancementLevelColor(enhancementLevel);
  const iconStyle = `--enhancement-level-color:${enhancementColor};`;
  const levelMarkup = `<small class="equipment-level-badge">LV.${formatGameNumber(equipmentLevel)}</small>`;
  const enhancementMarkup = enhancementLevel > 0
    ? `<b class="equipment-enhancement-badge">+${formatGameNumber(enhancementLevel)}</b>`
    : '';
  const badgeMarkup = `${enhancementMarkup}${levelMarkup}`;
  if (sheetPath && Number.isInteger(frame) && frame >= 0 && frame < 16) {
    const column = frame % 4;
    const row = Math.floor(frame / 4);
    const position = `${(column * 100) / 3}% ${(row * 100) / 3}%`;
    return `<i class="item-icon equipment-item-icon" style="${iconStyle}background-image:url('${sheetPath}');background-position:${position}" aria-hidden="true">${badgeMarkup}</i>`;
  }
  return `<i class="item-icon ${getEquipmentIconClass(slotId)}" style="${iconStyle}" aria-hidden="true">${badgeMarkup}</i>`;
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
    const currentItem = equippedItems[item.slotId];
    return !currentItem || getItemPower(item) > getItemPower(currentItem);
  });
}
