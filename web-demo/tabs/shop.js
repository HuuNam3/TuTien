// Shop and resource-dungeon tab handlers. Shared state remains owned by main.js.
const SHOP_VISIBLE_FIXED_ITEM_IDS = new Set([
  'enhancementStone',
  'enhancementRefund',
  'majorAscensionPermit',
  'healthPotion',
  'manaPotion',
]);

function isShopItemVisible(item) {
  if (SHOP_VISIBLE_FIXED_ITEM_IDS.has(item?.id)) return true;
  if (item?.type === 'talentTreasureChest') {
    const requiredLevel = Math.max(1, Number(item.requiredMinorRealmLevel) || getMinorRealmLevelCap());
    return playerLevel >= requiredLevel;
  }
  return item?.type === 'minorAscension' && item.requiredMajorRealmIndex === playerMajorRealmIndex;
}

function isBreakthroughPillShopItem(item) {
  return ['ascension', 'minorAscension'].includes(item?.type);
}

function getShopItemCategory(item) {
  if (item.type === 'equipment' || item.type === 'equipmentRandom') return 'equipment';
  if (item.type === 'skillBook' || item.type === 'skillChest') return 'skill';
  if (item.type === 'cultivation' || item.type === 'foundation' || isBreakthroughPillShopItem(item)
    || item.type === 'talentTreasureChest' || item.type === 'majorAscensionTreasure'
    || item.type === 'majorAscensionTreasureChest') return 'cultivation';
  if (item.type === 'potion' || item.type === 'petChest' || item.type === 'petFood'
    || item.type === 'petCultivationPill' || item.type === 'petSoulJade'
    || item.type === 'petBreakthroughStone') return 'consumable';
  return 'material';
}

function getShopItemIconClass(item) {
  if (item.type === 'skillBook') return getSkillItemIconClass(item.skillId);
  if (item.type === 'skillChest') return 'icon-special-skill-chest';
  if (item.type === 'petChest') return 'icon-special-pet-chest';
  if (item.type === 'petFood') {
    return {
      petFood1: 'icon-pet-food-1',
      petFood2: 'icon-pet-food-2',
      petFood5: 'icon-pet-food-5',
      petFood10: 'icon-pet-food-10',
    }[item.id] || 'icon-pet-food-1';
  }
  if (item.type === 'petCultivationPill') {
    return {
      petCultivationPill10: 'icon-pet-cultivation-10',
      petCultivationPill20: 'icon-pet-cultivation-20',
      petCultivationPill50: 'icon-pet-cultivation-50',
      petCultivationPill100: 'icon-pet-cultivation-100',
    }[item.id] || 'icon-pet-cultivation-10';
  }
  if (item.type === 'petSoulJade') return 'icon-pet-soul-jade';
  if (item.type === 'petBreakthroughStone') return 'icon-pet-breakthrough-stone';
  if (item.type === 'talentTreasureChest') return 'icon-special-talent-chest';
  if (item.type === 'majorAscensionTreasureChest') return 'icon-special-major-chest';
  if (item.type === 'equipment' || item.type === 'equipmentRandom') return 'icon-unique-equipment';
  if (item.type === 'potion') {
    return item.potionType === 'mana' ? 'icon-item-mana-flame' : 'icon-item-health-pill';
  }
  if (item.type === 'enhancementRefund') return 'icon-special-enhancement-refund';
  if (item.type === 'enhancementStone') return 'icon-item-enhancement-stone';
  if (item.type === 'foundation') return 'icon-item-jade';
  if (item.type === 'cultivation') return 'icon-stat-cultivation';
  if (item.type === 'ascension') return 'icon-special-major-pill';
  if (item.type === 'minorAscension') return 'icon-special-minor-pill';
  if (item.type === 'majorAscensionTreasure') return 'icon-talent-treasure-generic';
  return 'icon-item-spirit-stone';
}

function getShopItemIconTypeClass(icon) {
  if (icon.startsWith('icon-pet-')) return 'pet-sprite-icon';
  if (icon.startsWith('icon-talent-treasure-') || icon.startsWith('icon-special-minor-pill')
    || icon.startsWith('icon-special-major-pill') || icon.startsWith('icon-special-enhancement-refund')) return 'talent-icon';
  if (icon.startsWith('icon-special-')) return 'special-icon';
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
  const lockedByOtherRealm = item.type === 'minorAscension'
    && Number.isInteger(item.requiredMajorRealmIndex)
    && playerMajorRealmIndex !== item.requiredMajorRealmIndex;
  const lockedByMap = item.requiredMapId && !isWanderMapUnlocked(wanderMaps[item.requiredMapId]);
  const dailyLimit = getDailyShopPurchaseLimit(item);
  if (item.type === 'talentTreasureChest' && !canBuyMajorAscensionTreasureChest(item)) {
    const requiredLevel = Math.max(1, Number(item.requiredMinorRealmLevel) || getMinorRealmLevelCap());
    return playerLevel < requiredLevel
      ? `Yêu cầu ${getMinorRealmName(requiredLevel)}`
      : `Đã mua rương tại ${majorRealmNames[playerMajorRealmIndex] || 'đại cảnh giới hiện tại'}`;
  }
  if (dailyLimit > 0 && getRemainingShopPurchases(item) <= 0) {
    return `Đã đạt giới hạn ${dailyLimit} lần mua ${item.name} hôm nay`;
  }
  const skillRequiredTier = item.type === 'skillBook'
    ? getShopSkillRequiredTier(item)
    : Math.max(1, Number(item.requiredTier) || 1);
  const lockedByTier = ['skillBook', 'skillChest'].includes(item.type)
    && getPlayerCultivationTier() < skillRequiredTier;
  if (lockedByMap) return `Cần mở ${wanderMaps[item.requiredMapId]?.name || 'map yêu cầu'}`;
  if (lockedByTier) return `Yêu cầu ${getTierRealmText(skillRequiredTier)}`;
  if (lockedByRealm) return `Yêu cầu ${majorRealmNames[item.requiredMajorRealmIndex]}`;
  if (lockedByOtherRealm) return 'Chỉ dùng ở đại cảnh giới hiện tại.';
  if (lockedByLevel) return `Yêu cầu ${getMinorRealmName(item.requiredLevel)}`;
  return '';
}

function getShopItemPriceDetail(item) {
  if (item.type === 'cultivation') {
    return `Giá cố định · Giới hạn ${getDailyShopPurchaseLimit(item)} viên/ngày.`;
  }
  if (item.type === 'potion') {
    return `Mỗi lần mua trong ngày tăng ${formatGameNumber(Number(item.priceStep) || 5)} linh thạch; sang ngày mới giá reset về ${formatGameNumber(Number(item.cost) || 5)}.`;
  }
  if (isBreakthroughPillShopItem(item)) {
    const priceStep = Math.max(0, Number(item.priceStep) || 0);
    const scope = item.type === 'minorAscension' ? 'trong cùng đại cảnh giới' : 'mỗi lần mua';
    return `Giá gốc ${formatGameNumber(Number(item.cost) || 1)} linh thạch; ${scope} tăng ${formatGameNumber(priceStep)} linh thạch.`;
  }
  if (item.type === 'skillBook') return 'Giá bán bằng 1/4 giá gốc, làm tròn đến linh thạch gần nhất.';
  if (item.type === 'skillChest') return 'Giá cố định; mỗi rương mở ra mảnh skill hoặc sách skill.';
  if (item.type === 'petChest') return 'Giá cố định; mỗi rương mở ra 1, 2 hoặc 5 mảnh linh thú.';
  if (item.type === 'talentTreasureChest') return 'Giá cố định; mỗi rương mở ra 1 Cục Thiên Tài Địa Bảo.';
  if (item.type === 'majorAscensionTreasureChest') return 'Rương Boss map; mỗi rương mở ra 1 Cục Thiên Tài Địa Bảo của đại cảnh giới kế tiếp.';
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
      lines.push(`Linh lực cần ${formatGameNumber(getSkillManaCost(skill, 0))}.`);
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
  if (item.type === 'petChest') {
    const rewardText = (Array.isArray(item.fragmentRewards) ? item.fragmentRewards : [])
      .map((reward) => `${formatGameNumber(reward.amount)} mảnh (${Math.round(Number(reward.chance || 0) * 100)}%)`)
      .join(', ');
    lines.push(`Mỗi lần mở: ${rewardText || '1, 2 hoặc 5 mảnh linh thú'}.`);
    lines.push(`Mảnh nhận ngẫu nhiên theo từng linh thú; đủ ${getPetFragmentRequirement()} mảnh sẽ tự ghép thành 1 linh thú.`);
    if (ownedPetIds.length) {
      lines.push('Tỉ lệ loại thưởng: 30% mảnh linh thú, 38,8% thức ăn linh thú, 30% linh đan tăng tu vi, 1% Hồn Ngọc, 0,2% Đá Tiến Giai.');
    } else {
      lines.push('Chưa sở hữu linh thú: 100% nhận mảnh linh thú.');
    }
  }
  if (item.type === 'petFood') lines.push(`Dùng cho linh thú, tăng ${formatGameNumber(item.feedPoints)} điểm thể lực.`);
  if (item.type === 'petCultivationPill') lines.push(`Dùng cho linh thú, tăng ${formatGameNumber(item.cultivation)} tu vi.`);
  if (item.type === 'petSoulJade') lines.push('Dùng cho linh thú, tăng 1 tiểu cảnh giới.');
  if (item.type === 'petBreakthroughStone') lines.push('Dùng cho linh thú, tăng 1 đại cảnh giới.');
  if (item.type === 'talentTreasureChest') {
    lines.push('Mỗi lần mở nhận 1 Cục Thiên Tài Địa Bảo.');
    lines.push('Cục này dùng khi đột phá đại cảnh giới và sẽ roll ngẫu nhiên chỉ số theo lực chiến nhận được.');
  }
  if (item.type === 'majorAscensionTreasureChest') {
    lines.push(`Mở rương nhận 1 Cục Thiên Tài Địa Bảo ${majorRealmNames[item.targetMajorRealmIndex] || 'của đại cảnh giới kế tiếp'}.`);
    lines.push('Rương này nhận chắc chắn khi đánh bại Boss map Đại viên mãn.');
  }
  if (item.type === 'majorAscensionTreasure') {
    lines.push('Chỉ dùng khi đột phá đại cảnh giới.');
  }
  if (item.type === 'minorAscension') {
    lines.push(`Dùng khi đột phá ${majorRealmNames[item.requiredMajorRealmIndex] || 'đại cảnh giới hiện tại'} từ tầng 1 đến tầng 10.`);
    lines.push('Mỗi lần đột phá tiểu cảnh giới cần 1 viên.');
  }
  const dailyLimit = getDailyShopPurchaseLimit(item);
  if (dailyLimit > 0) {
    lines.push(`Giới hạn mua: ${getDailyShopPurchaseCount(item)}/${dailyLimit} hôm nay.`);
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
        <input id="shopDetailQuantity" type="number" min="1" max="${getShopItemQuantityLimit(item)}" placeholder="1" aria-label="Số lượng, mặc định 1" ${canBuy ? '' : 'disabled'}>
      </label>
      ${lockedText ? `<em class="shop-detail-lock">${lockedText}</em>` : ''}
      <strong id="shopDetailTotal" class="shop-detail-total">Tổng: ${formatGameNumber(getShopItemCost(item))} linh thạch</strong>
      <button type="button" class="breakthrough shop-detail-buy" ${buttonDisabledAttributes(!canBuy, lockedText || 'Không đủ điều kiện để mua vật phẩm.')}>${lockedText ? 'Chưa mở' : 'Xác nhận mua'}</button>
    </div>
  `;
  shopDetailOverlay.classList.remove('is-hidden');
  const closeButton = shopDetailOverlay.querySelector('.shop-detail-close');
  const quantityInput = shopDetailOverlay.querySelector('#shopDetailQuantity');
  const totalText = shopDetailOverlay.querySelector('#shopDetailTotal');
  const updateTotal = () => {
    const rawQuantity = String(quantityInput?.value || '').trim();
    const quantity = rawQuantity === ''
      ? 1
      : clamp(Math.floor(Number(rawQuantity) || 1), 1, getShopItemQuantityLimit(item));
    if (totalText) totalText.textContent = `Tổng: ${formatGameNumber(getShopPurchaseTotal(item, quantity))} linh thạch`;
    const buyButton = shopDetailOverlay.querySelector('.shop-detail-buy');
    if (buyButton && canBuy) {
      const total = getShopPurchaseTotal(item, quantity);
      setButtonDisabledState(buyButton, total > playerSpiritStones, 'Không đủ linh thạch để mua số lượng này.');
    }
  };
  closeButton?.addEventListener('click', hideShopItemDetail);
  quantityInput?.addEventListener('input', updateTotal);
  shopDetailOverlay.querySelector('.shop-detail-buy')?.addEventListener('click', () => {
    const quantity = clamp(Math.floor(Number(quantityInput?.value) || 1), 1, getShopItemQuantityLimit(item));
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
    .filter(isShopItemVisible)
    .filter((item) => !item.hidden)
    .filter((item) => item.type !== 'skillBook' || item.schoolId === playerSchoolId)
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
    const foundationBought = item.type === 'foundation' && !canBuyFoundationPill(item);
    const treasureChestBought = item.type === 'talentTreasureChest'
      && !canBuyMajorAscensionTreasureChest(item);
    const bought = foundationBought || treasureChestBought;
    const skillBook = item.type === 'skillBook'
      ? cultivationSkills.find((skill) => skill.id === item.skillId)
      : null;
    const skillBookLearned = Boolean(skillBook && isSkillLearned(skillBook.id));
    const skillBookMaxed = Boolean(skillBook && getSkillLevel(skillBook.id) >= getSkillMaxLevel());
    const potionPurchased = item.type === 'potion' ? Math.max(0, Number(potionPurchaseCounts[item.id]) || 0) : 0;
    const dailyLimit = getDailyShopPurchaseLimit(item);
    const dailyPurchaseCount = getDailyShopPurchaseCount(item);
    const dailyLimitReached = dailyLimit > 0 && getRemainingShopPurchases(item) <= 0;
    const locked = lockedByLevel || lockedByRealm || lockedByTier || lockedByMap || dailyLimitReached;
    const canBuy = canBuyShopItem(item);
    const meta = foundationBought
      ? `Đã mua trong ${majorRealmNames[playerMajorRealmIndex]}`
      : dailyLimit > 0
      ? `${formatGameNumber(getShopItemCost(item))} linh thạch · Đã mua ${dailyPurchaseCount}/${dailyLimit} hôm nay`
      : item.type === 'foundation'
      ? `${formatGameNumber(getShopItemCost(item))} linh thạch`
      : item.type === 'potion'
      ? `${formatGameNumber(getShopItemCost(item))} linh thạch · Đã mua ${potionPurchased} viên`
      : bought
      ? item.type === 'talentTreasureChest'
        ? `Đã mua tại ${majorRealmNames[playerMajorRealmIndex] || 'đại cảnh giới hiện tại'}`
        : 'Đã mở khóa'
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
      : dailyLimitReached ? 'Hết lượt hôm nay'
      : bought ? 'Đã mua' : locked ? 'Chưa mở' : 'Mua';
    const qualityClass = item.gradeId ? `grade-${item.gradeId}` : item.rarityKey ? `quality-${item.rarityKey}` : '';
    const skillColorStyle = item.gradeId ? ` style="--skill-rarity-color: ${getSkillGradeColor(item.gradeId)};"` : '';

    const canBuyOne = canBuy && !bought;
    const detailButtonText = canBuyOne ? 'Mua nhiều' : 'Chi tiết';
    return `
      <article class="shop-item ${qualityClass}"${skillColorStyle} data-shop-detail="${item.id}" tabindex="0">
         <strong>${getShopItemIconMarkup(item)}${item.name}</strong>
        <span>${item.description}</span>
        <em>${meta}</em>
        <div class="shop-item-actions">
          <button type="button" ${buttonDisabledAttributes(!canBuyOne, buttonText)} data-shop-item="${item.id}">${canBuyOne ? 'Mua' : buttonText}</button>
          <button type="button" class="secondary" data-shop-detail="${item.id}">${detailButtonText}</button>
        </div>
      </article>
    `;
  }).join('');
}
