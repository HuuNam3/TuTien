// Pet tab handlers. Shared state remains owned by main.js.
function getPetById(petId) {
  return petData.pets.find((pet) => pet.id === petId) || null;
}

function getPetState(petId) {
  if (!petStates[petId]) petStates[petId] = {
    stars: 0,
    feedPoints: 0,
    cultivation: 0,
    realmIndex: 0,
    level: 1,
  };
  return petStates[petId];
}

function getPetRealmText(state = {}) {
  const realmIndex = clamp(
    Math.floor(Number(state.realmIndex) || 0),
    0,
    Math.max(0, petRealmData.realms.length - 1),
  );
  const realm = petRealmData.realms[realmIndex];
  const levelIndex = clamp(
    Math.floor(Number(state.level) || 1) - 1,
    0,
    Math.max(0, (realm?.minorRealms?.length || 1) - 1),
  );
  return `${realm?.name || 'Ấu Linh'} ${realm?.minorRealms?.[levelIndex] || 'Sơ giai'}`;
}

function getPetRealmProgress(state = {}) {
  const maxRealmIndex = Math.max(0, petRealmData.realms.length - 1);
  const realmIndex = clamp(Math.floor(Number(state.realmIndex) || 0), 0, maxRealmIndex);
  const minorRealmCount = Math.max(1, petRealmData.realms[realmIndex]?.minorRealms?.length || 9);
  const level = clamp(Math.floor(Number(state.level) || 1), 1, minorRealmCount);
  return { realmIndex, level, minorRealmCount, maxRealmIndex };
}

function getPetFeedRequirement() {
  return Math.max(1, Math.floor(Number(petData.feed?.pointsPerStar) || 100));
}

function getPetStarCost(stars) {
  const baseCost = Math.max(0, Math.floor(Number(petData.starUpgrade?.spiritStoneBaseCost) || 100));
  const step = Math.max(0, Math.floor(Number(petData.starUpgrade?.spiritStoneCostStep) || 100));
  return baseCost + Math.max(0, stars) * step;
}

function usePetRewardItem(shopItem) {
  if (busy) return null;
  if (!selectedPetId) selectedPetId = getOwnedPets()[0]?.id || '';
  if (!selectedPetId) return null;
  const pet = getPetById(selectedPetId);
  if (!pet || !ownedPetIds.includes(pet.id)) return null;
  const state = getPetState(pet.id);
  if (shopItem?.type === 'petFood') {
    const amount = Math.max(1, Math.floor(Number(shopItem.feedPoints) || 1));
    const before = state.feedPoints;
    if (before >= getPetFeedRequirement()) return null;
    state.feedPoints = Math.min(getPetFeedRequirement(), before + amount);
    const applied = state.feedPoints - before;
    return applied > 0 ? { pet, type: shopItem.type, amount: applied } : null;
  }
  if (shopItem?.type === 'petCultivationPill') {
    const amount = Math.max(1, Math.floor(Number(shopItem.cultivation) || 1));
    state.cultivation = Math.max(0, Number(state.cultivation) || 0) + amount;
    return { pet, type: shopItem.type, amount };
  }
  if (shopItem?.type === 'petSoulJade') {
    const progress = getPetRealmProgress(state);
    if (progress.realmIndex >= progress.maxRealmIndex && progress.level >= progress.minorRealmCount) return null;
    if (progress.level < progress.minorRealmCount) state.level = progress.level + 1;
    else {
      state.realmIndex = progress.realmIndex + 1;
      state.level = 1;
    }
    return { pet, type: shopItem.type, amount: 1 };
  }
  if (shopItem?.type === 'petBreakthroughStone') {
    const progress = getPetRealmProgress(state);
    if (progress.realmIndex >= progress.maxRealmIndex || progress.level < progress.minorRealmCount) return null;
    state.realmIndex = progress.realmIndex + 1;
    state.level = 1;
    return { pet, type: shopItem.type, amount: 1 };
  }
  return null;
}

function getPetConsumableItems() {
  return shopItems
    .filter((item) => ['petFood', 'petCultivationPill'].includes(item.type))
    .map((item) => ({ item, count: getShopInventoryCount(item.id) }))
    .filter(({ count }) => count > 0);
}

function renderPetConsumablePanel() {
  const items = getPetConsumableItems();
  const pet = getPetById(selectedPetId);
  const state = pet ? getPetState(pet.id) : null;
  const requirement = getPetFeedRequirement();
  const vitality = Math.max(0, Math.min(requirement, Number(state?.feedPoints) || 0));
  const vitalityPercent = Math.min(100, Math.round((vitality / requirement) * 100));
  const cultivation = Math.max(0, Number(state?.cultivation) || 0);
  const cultivationPercent = Math.min(100, Math.round(cultivation));
  return `
    <div class="pet-item-panel is-hidden" id="petItemPanel" role="dialog" aria-modal="true" aria-label="Vật phẩm linh thú">
      <div class="pet-item-dialog">
        <div class="pet-item-panel-header">
          <div class="pet-item-panel-title">Vật phẩm linh thú</div>
          <button type="button" class="icon-button" data-pet-action="close-items" aria-label="Đóng" title="Đóng">×</button>
        </div>
        <div class="pet-item-status">
          <div class="pet-progress-heading"><span>Thể lực</span><strong>${vitality}/${requirement}</strong></div>
          <div class="pet-progress pet-progress-vitality"><i style="width:${vitalityPercent}%"></i></div>
          <div class="pet-progress-heading"><span>Tu vi</span><strong>${formatGameNumber(cultivation)}</strong></div>
          <div class="pet-progress pet-progress-cultivation"><i style="width:${cultivationPercent}%"></i></div>
        </div>
        ${items.length
          ? `<div class="pet-item-list">${items.map(({ item, count }) => `
            <div class="pet-item-row">
              <i class="${getShopItemBagIconClass(item)}" aria-hidden="true"></i>
              <div class="pet-item-copy"><strong>${item.name}</strong><span>${item.type === 'petFood' ? `+${formatGameNumber(item.feedPoints)} thể lực` : `+${formatGameNumber(item.cultivation)} tu vi`}</span></div>
              <small>${formatInventoryCount(count)}</small>
              <label class="pet-item-quantity">SL<input type="number" min="1" max="${count}" value="1" aria-label="Số lượng ${item.name}"></label>
              <button type="button" class="breakthrough compact" data-pet-action="use-item" data-item-id="${item.id}">Dùng</button>
            </div>
          `).join('')}</div>`
          : '<span class="pet-item-empty">Bạn chưa có thức ăn hoặc linh đan cho linh thú.</span>'}
      </div>
    </div>
  `;
}

function openPetConsumablePanel() {
  const panel = $('petItemPanel');
  if (!panel) return;
  panel.classList.toggle('is-hidden');
}

function closePetConsumablePanel() {
  $('petItemPanel')?.classList.add('is-hidden');
}

function usePetConsumableItem(itemId, amount = 1) {
  if (busy) return;
  const shopItem = shopItems.find((item) => item.id === itemId);
  if (!shopItem || !['petFood', 'petCultivationPill'].includes(shopItem.type)) return;
  if (getShopInventoryCount(shopItem.id) <= 0) return;
  const requested = clamp(Math.floor(Number(amount) || 1), 1, getShopInventoryCount(shopItem.id));
  const rewards = [];
  for (let index = 0; index < requested; index += 1) {
    const reward = usePetRewardItem(shopItem);
    if (!reward) break;
    rewards.push(reward);
  }
  if (!rewards.length) {
    const pet = selectedPetId ? getPetById(selectedPetId) : null;
    const state = pet ? getPetState(pet.id) : null;
    const message = !pet
      ? 'Bạn chưa có linh thú để sử dụng vật phẩm.'
      : shopItem.type === 'petFood' && Number(state.feedPoints) >= getPetFeedRequirement()
      ? `${pet.name} đã đầy thể lực.`
      : 'Không thể dùng vật phẩm linh thú lúc này.';
    showGameToast(message, 'error');
    return;
  }
  shopInventoryCounts[shopItem.id] = getShopInventoryCount(shopItem.id) - rewards.length;
  showGameToast(`Đã dùng ${shopItem.name} x${rewards.length} cho ${rewards[0].pet.name}.`, 'success');
  renderPets();
  renderInventory();
  renderShop();
  saveGame();
  openPetConsumablePanel();
}

function getPetRarity(pet) {
  return petData.rarities.find((rarity) => rarity.id === pet?.rarity)
    || petData.rarities[0]
    || { id: 'mortal', name: 'Phàm', statMultiplier: 1 };
}

function getPetDisplayStats(pet, state) {
  const rarityMultiplier = Math.max(0, Number(getPetRarity(pet).statMultiplier) || 1);
  const multiplier = rarityMultiplier * (1 + state.stars * 0.1);
  return Object.fromEntries(Object.entries(pet.baseStats || {}).map(([stat, value]) => [
    stat,
    Math.max(0, Math.round(Number(value) * multiplier)),
  ]));
}

function getPetDisplayPower(stats) {
  return Math.round(
    (Number(stats.maxHp) || 0) * 0.25
      + (Number(stats.attack) || 0) * 5
      + (Number(stats.defense) || 0) * 3
      + (Number(stats.mastery) || 0) * 4,
  );
}

function renderPetStats(stats) {
  return Object.entries(stats).map(([stat, value]) => (
    `<span class="pet-stat"><i class="${getStatIconClass(stat).startsWith('icon-unique-') ? 'unique-icon' : 'stat-icon'} ${getStatIconClass(stat)}" aria-hidden="true"></i><b>${getStatLabel(stat)}</b><strong>+${formatGameNumber(value)}</strong></span>`
  )).join('');
}

function renderPetSkills(pet, stars) {
  const skills = Array.isArray(pet.skills) ? pet.skills : [];
  if (!skills.length) return '';
  return `
    <div class="pet-skill-section">
      <h4><i class="activity-icon icon-activity-skill" aria-hidden="true"></i>Skill linh thú</h4>
      <div class="pet-skill-list">
        ${skills.map((skill) => {
          const unlockStar = Math.max(0, Math.floor(Number(skill.unlockStar) || 0));
          const unlocked = stars >= unlockStar;
          return `
            <div class="pet-skill${unlocked ? '' : ' is-locked'}">
              <strong><i class="item-icon icon-item-skill-book" aria-hidden="true"></i>${skill.name}</strong>
              <span>${skill.type || 'Kỹ năng'}${unlocked ? '' : ` · Mở ở ${unlockStar} sao`}</span>
              <p>${skill.description || 'Chưa có mô tả.'}</p>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function getPetEvolutionFrame(pet, stars = 0) {
  const frames = Array.isArray(pet?.evolutionImages) ? pet.evolutionImages : [];
  const normalizedStars = Math.max(1, Math.floor(Number(stars) || 0));
  return frames.find((frame) => normalizedStars >= Number(frame.minStars) && normalizedStars <= Number(frame.maxStars))
    || frames[0]
    || { image: pet?.image || '', backgroundPosition: 'center' };
}

function getPetVisualStyle(pet, stars = 0) {
  const frame = getPetEvolutionFrame(pet, stars);
  const isSpriteSheet = Array.isArray(pet?.evolutionImages) && pet.evolutionImages.length > 1;
  return `background-image:url('${frame.image}');background-position:${frame.backgroundPosition || 'center'};${isSpriteSheet ? 'background-size:200% 200%;' : 'background-size:contain;'}`;
}

function getPetIconClass(pet) {
  if (pet?.id === 'mist_ghost_pet') return 'icon-pet-1';
  if (pet?.id === 'jade_spider_pet') return 'icon-pet-2';
  return 'icon-pet-1';
}

function renderPetStars(stars, maxStars) {
  return `<span class="pet-stars-first">${Array.from({ length: Math.min(5, maxStars) }, (_, index) => index < stars ? '★' : '☆').join('')}</span><span class="pet-stars-second">${Array.from({ length: Math.max(0, maxStars - 5) }, (_, index) => index + 5 < stars ? '★' : '☆').join('')}</span>`;
}

function renderPets() {
  const ownedPets = getOwnedPets();
  if (selectedPetId && !ownedPetIds.includes(selectedPetId)) selectedPetId = ownedPets[0]?.id || '';
  if (deployedPetId && !ownedPetIds.includes(deployedPetId)) deployedPetId = '';
  $('petList')?.closest('.profile-card')?.classList.toggle('is-hidden', !ownedPets.length);
  const selectedPet = getPetById(selectedPetId);
  const selectedState = selectedPet ? getPetState(selectedPet.id) : null;
  const feedRequirement = getPetFeedRequirement();
  const maxStars = Math.max(0, Math.floor(Number(petData.maxStars) || 5));
  $('selectedPetView').innerHTML = selectedPet
    ? (() => {
      const stats = getPetDisplayStats(selectedPet, selectedState);
      const starCost = getPetStarCost(selectedState.stars);
      const atMaxStars = selectedState.stars >= maxStars;
      const vitality = Math.max(0, Math.min(feedRequirement, Number(selectedState.feedPoints) || 0));
      const vitalityPercent = Math.min(100, Math.round((vitality / feedRequirement) * 100));
      const cultivation = Math.max(0, Number(selectedState.cultivation) || 0);
      const cultivationPercent = Math.min(100, Math.round(cultivation));
      const deployed = deployedPetId === selectedPet.id;
      const canDeploy = vitality > 0;
      return `
        <div class="pet-info-label">Thông tin linh thú</div>
        <div class="pet-info-row">
          <h3>${selectedPet.name}</h3>
          <span>+LC ${formatGameNumber(getPetDisplayPower(stats))}</span>
          <strong>${selectedState.stars}/${maxStars} sao</strong>
        </div>
        <p class="pet-description">${selectedPet.description || ''}</p>
        <div class="pet-info-label">Thuộc tính</div>
        <div class="pet-stat-grid">${renderPetStats(stats)}</div>
        ${renderPetSkills(selectedPet, selectedState.stars)}
        <div class="pet-visual" style="${getPetVisualStyle(selectedPet, selectedState.stars)}" role="img" aria-label="${selectedPet.name}"></div>
        <div class="pet-progress-heading"><span>Thể lực</span><strong>${vitality}/${feedRequirement}</strong></div>
        <div class="pet-progress pet-progress-vitality"><i style="width:${vitalityPercent}%"></i></div>
        <div class="pet-progress-heading"><span>Tu vi</span><strong>${formatGameNumber(cultivation)}</strong></div>
        <div class="pet-progress pet-progress-cultivation"><i style="width:${cultivationPercent}%"></i></div>
        <div class="pet-actions">
          <button type="button" class="secondary compact" data-pet-action="feed"><i class="pet-sprite-icon icon-pet-feed" aria-hidden="true"></i>Cho ăn</button>
          <button type="button" class="breakthrough compact" data-pet-action="star" ${buttonDisabledAttributes(atMaxStars, 'Linh thú đã đạt tối đa 10 sao.')}><i class="pet-sprite-icon icon-pet-star-up" aria-hidden="true"></i>Tăng sao</button>
          <button type="button" class="deploy-pet compact" data-pet-action="deploy" ${buttonDisabledAttributes(!canDeploy || deployed, !canDeploy ? 'Cần có thể lực để xuất trận.' : '')}>${deployed ? 'Đang xuất trận' : 'Xuất trận'}</button>
        </div>
        ${renderPetConsumablePanel()}
      `;
    })()
    : '<div class="pet-empty"><i class="activity-icon icon-activity-encounter" aria-hidden="true"></i><strong>Bạn chưa có linh thú</strong><span>Hãy tìm kiếm thêm để nhận linh thú.</span></div>';

  $('petList').innerHTML = ownedPets.length
    ? ownedPets.map((pet) => {
      const state = getPetState(pet.id);
      const selected = pet.id === selectedPetId;
      const deployed = pet.id === deployedPetId;
      return `
        <button type="button" class="pet-card${selected ? ' is-selected' : ''}" data-pet-action="select" data-pet-id="${pet.id}" aria-label="Chọn ${pet.name}" aria-pressed="${selected}" title="${pet.name}">
          ${deployed ? '<span class="pet-card-deployed">Xuất trận</span>' : ''}
          <span class="pet-card-stars" aria-hidden="true">${state.stars}★</span>
          <span class="pet-card-icon pet-sprite-icon ${getPetIconClass(pet)}" aria-hidden="true"></span>
          <strong class="pet-card-name">${pet.name}</strong>
        </button>
      `;
    }).join('')
    : `<div class="pet-empty"><i class="activity-icon icon-activity-chest" aria-hidden="true"></i><strong>Bạn chưa có linh thú</strong><span>Hãy tìm kiếm thêm để nhận linh thú.</span></div>`;
}

function deploySelectedPet() {
  if (busy || !selectedPetId) return;
  const pet = getPetById(selectedPetId);
  if (!pet || !ownedPetIds.includes(pet.id)) return;
  const state = getPetState(pet.id);
  if ((Number(state.feedPoints) || 0) <= 0) {
    showGameToast('Linh thú cần có thể lực trên 0 để xuất trận.', 'error');
    return;
  }
  deployedPetId = deployedPetId === pet.id ? '' : pet.id;
  renderPets();
  showGameToast(deployedPetId ? `${pet.name} đã xuất trận.` : `${pet.name} đã trở về.`, 'success');
  saveGame();
}

function selectPet(petId) {
  if (busy || !getPetById(petId) || !ownedPetIds.includes(petId)) return;
  selectedPetId = petId;
  const pet = getPetById(petId);
  renderPets();
  showGameToast(`Đã chọn linh thú ${pet.name}.`, 'success');
  saveGame();
}

function feedSelectedPet() {
  if (busy || !selectedPetId) return;
  const pet = getPetById(selectedPetId);
  if (!pet) return;
  const state = getPetState(pet.id);
  const maxStars = Math.max(0, Math.floor(Number(petData.maxStars) || 5));
  if (state.stars >= maxStars) {
    showGameToast(`${pet.name} đã đạt tối đa sao.`, 'info');
    return;
  }
  state.feedPoints = Math.min(getPetFeedRequirement(), state.feedPoints + Math.max(1, Number(petData.feed?.pointsPerMeal) || 10));
  renderPets();
  showGameToast(`Đã cho ${pet.name} ăn, thân mật +${Math.max(1, Number(petData.feed?.pointsPerMeal) || 10)}.`, 'success');
  saveGame();
}

function upgradeSelectedPetStar() {
  if (busy || !selectedPetId) return;
  const pet = getPetById(selectedPetId);
  if (!pet) return;
  const state = getPetState(pet.id);
  const maxStars = Math.max(0, Math.floor(Number(petData.maxStars) || 5));
  const requirement = getPetFeedRequirement();
  if (state.stars >= maxStars) {
    showGameToast(`${pet.name} đã đạt tối đa sao.`, 'info');
    return;
  }
  if (state.feedPoints < requirement) {
    showGameToast(`Cần đủ ${requirement} điểm thân mật để tăng sao.`, 'error');
    return;
  }
  const cost = getPetStarCost(state.stars);
  if (playerSpiritStones < cost) {
    showGameToast(`Không đủ linh thạch. Cần ${formatGameNumber(cost)} linh thạch.`, 'error');
    return;
  }
  playerSpiritStones -= cost;
  state.stars += 1;
  state.feedPoints = 0;
  renderPets();
  renderCultivation();
  showGameToast(`${pet.name} đã tăng lên ${state.stars} sao.`, 'success');
  saveGame();
}
