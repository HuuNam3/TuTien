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

function getPetFeedRequirement() {
  return Math.max(1, Math.floor(Number(petData.feed?.pointsPerStar) || 100));
}

function getPetStarCost(stars) {
  const baseCost = Math.max(0, Math.floor(Number(petData.starUpgrade?.spiritStoneBaseCost) || 100));
  const step = Math.max(0, Math.floor(Number(petData.starUpgrade?.spiritStoneCostStep) || 100));
  return baseCost + Math.max(0, stars) * step;
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

function renderPets() {
  const ownedPets = getOwnedPets();
  if (selectedPetId && !ownedPetIds.includes(selectedPetId)) selectedPetId = ownedPets[0]?.id || '';
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
      const feedPercent = Math.min(100, Math.round((selectedState.feedPoints / feedRequirement) * 100));
      return `
        <div class="selected-pet">
          <div class="pet-visual" style="background-image:url('${selectedPet.image}')" role="img" aria-label="${selectedPet.name}"></div>
          <div class="selected-pet-details">
            <span class="pet-type">${selectedPet.type || 'Linh thú'} · <b class="pet-quality pet-quality-${getPetRarity(selectedPet).id}">Tư chất ${getPetRarity(selectedPet).name}</b></span>
            <span class="pet-type">${getPetRealmText(selectedState)} · Tu vi ${formatGameNumber(selectedState.cultivation)}</span>
            <h3>${selectedPet.name} <small class="pet-stars"><span class="pet-stars-first">${Array.from({ length: Math.min(5, maxStars) }, (_, index) => index < selectedState.stars ? '★' : '☆').join('')}</span><span class="pet-stars-second">${Array.from({ length: Math.max(0, maxStars - 5) }, (_, index) => index + 5 < selectedState.stars ? '★' : '☆').join('')}</span></small></h3>
            <p>${selectedPet.description || ''}</p>
            <div class="pet-stat-grid">${renderPetStats(stats)}</div>
            <strong class="pet-power">Lực chiến linh thú: ${formatGameNumber(getPetDisplayPower(stats))}</strong>
            ${renderPetSkills(selectedPet, selectedState.stars)}
          </div>
        </div>
        <div class="pet-progress-heading"><span>Thân mật</span><strong>${selectedState.feedPoints}/${feedRequirement}</strong></div>
        <div class="pet-progress"><i style="width:${feedPercent}%"></i></div>
        <div class="pet-actions">
          <button type="button" class="secondary compact" data-pet-action="feed"><i class="item-icon icon-item-health-pill" aria-hidden="true"></i>Cho ăn +10</button>
          <button type="button" class="breakthrough compact" data-pet-action="star" ${buttonDisabledAttributes(atMaxStars, 'Linh thú đã đạt tối đa 10 sao.')}><i class="unique-icon icon-unique-comprehension" aria-hidden="true"></i>${atMaxStars ? 'Đã tối đa sao' : `Tăng sao · ${formatGameNumber(starCost)} linh thạch`}</button>
        </div>
      `;
    })()
    : '<div class="pet-empty"><i class="activity-icon icon-activity-encounter" aria-hidden="true"></i><strong>Chưa chọn linh thú</strong><span>Chọn một linh thú bên dưới để bắt đầu nuôi dưỡng.</span></div>';

  $('petList').innerHTML = ownedPets.length
    ? ownedPets.map((pet) => {
    const state = getPetState(pet.id);
    const selected = pet.id === selectedPetId;
    return `
      <article class="pet-card${selected ? ' is-selected' : ''}">
        <div class="pet-card-visual" style="background-image:url('${pet.image}')" role="img" aria-label="${pet.name}"></div>
        <div class="pet-card-copy"><strong>${pet.name}</strong><span>${pet.type || 'Linh thú'} · <b class="pet-quality pet-quality-${getPetRarity(pet).id}">Tư chất ${getPetRarity(pet).name}</b> · ${state.stars} sao</span></div>
        <button type="button" class="${selected ? 'breakthrough' : 'secondary'} compact" data-pet-action="select" data-pet-id="${pet.id}">${selected ? 'Đang chọn' : 'Chọn'}</button>
      </article>
    `;
      }).join('')
    : `<div class="pet-empty"><i class="activity-icon icon-activity-chest" aria-hidden="true"></i><strong>Chưa sở hữu linh thú</strong><span>Mở Rương Linh Thú và ghép đủ ${getPetFragmentRequirement()} mảnh để nhận linh thú.</span></div>`;
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

