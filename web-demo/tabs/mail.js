// Mail and redeem-code tab handlers. Shared state remains owned by main.js.
function escapeMailHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function formatMailDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Thời gian không xác định' : date.toLocaleString('vi-VN');
}

function renderMailHeader() {
  if (mailUnreadSummary) mailUnreadSummary.textContent = `${mailUnreadCount} thư chưa đọc`;
  if (mailSummary && (!mailSummary.textContent || mailSummary.textContent === 'Đang tải thư...')) {
    mailSummary.textContent = 'Hộp thư hệ thống';
  }
  setNotificationBadge(mailBadge, mailUnreadCount);
}

function getMailAttachmentLabel(attachment) {
  if (attachment?.type === 'currency') return `Linh thạch x${formatGameNumber(attachment.amount)}`;
  return `${attachment?.name || attachment?.itemId || 'Vật phẩm'} x${formatGameNumber(attachment?.quantity)}`;
}

function renderMailList() {
  if (!mailList) return;
  if (!mailMessages.length) {
    mailList.innerHTML = `
      <div class="mail-empty">
        <i class="game-icon icon-scroll" aria-hidden="true"></i>
        <strong>Hộp thư đang trống</strong>
        <span>Thư hệ thống và phần thưởng gửi cho đạo hữu sẽ xuất hiện tại đây.</span>
      </div>
    `;
  } else {
    mailList.innerHTML = mailMessages.map((mail) => {
      const expanded = mailExpandedId === mail.id;
      const attachments = Array.isArray(mail.attachments) ? mail.attachments : [];
      const attachmentText = attachments.map(getMailAttachmentLabel).join(' · ');
      const canClaim = attachments.length > 0 && !mail.claimedAt;
      return `
        <article class="mail-item${mail.readAt ? '' : ' is-unread'}${expanded ? ' is-expanded' : ''}">
          <button type="button" class="mail-item-toggle" data-mail-open="${escapeMailHtml(mail.id)}" aria-expanded="${expanded}">
            <span><strong>${escapeMailHtml(mail.title)}</strong><small>${escapeMailHtml(formatMailDate(mail.createdAt))}</small></span>
            <b>${mail.readAt ? '' : 'Mới'}</b>
          </button>
          ${expanded ? `
            <div class="mail-item-body">
              <p>${escapeMailHtml(mail.content).replace(/\n/g, '<br>')}</p>
              ${attachmentText ? `<div class="mail-attachments"><strong>Đính kèm</strong><span>${escapeMailHtml(attachmentText)}</span></div>` : ''}
              <div class="mail-item-actions">
                ${canClaim ? `<button type="button" class="breakthrough compact" data-mail-claim="${escapeMailHtml(mail.id)}"><i class="game-icon icon-gift" aria-hidden="true"></i>Nhận</button>` : ''}
                ${attachments.length && mail.claimedAt ? '<span class="mail-claimed">Đã nhận phần thưởng</span>' : ''}
              </div>
            </div>
          ` : ''}
        </article>
      `;
    }).join('');
  }
  mailLoadMoreButton?.classList.toggle('is-hidden', !mailNextBefore);
  renderMailHeader();
}

async function markMailRead(mailId) {
  const mail = mailMessages.find((entry) => entry.id === mailId);
  if (!mail || mail.readAt) return;
  try {
    const response = await fetch(mailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read', mailId }),
    });
    const payload = await response.json().catch(() => ({}));
    if (handleCloudResponseFailure(response, payload) || !response.ok) return;
    mail.readAt = new Date().toISOString();
    mailUnreadCount = Math.max(0, mailUnreadCount - 1);
    renderMailList();
  } catch (error) {
    console.warn('Cannot mark mail as read.', error);
  }
}

async function claimMailReward(mailId) {
  if (mailClaimInFlight.has(mailId)) return;
  mailClaimInFlight.add(mailId);
  const pendingClaim = mailMessages.find((entry) => entry.id === mailId);
  try {
    window.clearTimeout(cloudSaveTimer);
    cloudSaveTimer = 0;
    cloudPendingData = null;
    const deadline = Date.now() + 2500;
    while (cloudPeriodicSyncInFlight && Date.now() < deadline) {
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
    const response = await fetch(mailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claim', mailId }),
    });
    const payload = await response.json().catch(() => ({}));
    if (handleCloudResponseFailure(response, payload)) return;
    if (!response.ok) {
      showGameToast(payload.error || 'Không thể nhận phần thưởng thư.', 'error');
      return;
    }
    await refreshGameStateAfterMailClaim();
    if (pendingClaim) {
      pendingClaim.claimedAt = payload.mail?.claimedAt || new Date().toISOString();
      pendingClaim.readAt = pendingClaim.readAt || pendingClaim.claimedAt;
    }
    mailUnreadCount = mailMessages.filter((mail) => !mail.readAt).length;
    renderMailList();
    showGameToast('Đã nhận phần thưởng từ thư.', 'success');
  } catch (error) {
    showGameToast('Dịch vụ thư tạm thời không khả dụng.', 'error');
  } finally {
    mailClaimInFlight.delete(mailId);
  }
}

async function refreshGameStateAfterMailClaim() {
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = 0;
  cloudPendingData = null;
  const deadline = Date.now() + 2500;
  while (cloudPeriodicSyncInFlight && Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  if (!await loadCloudSave()) return false;
  if (!loadSavedGame()) return false;
  renderCultivation();
  renderInventory();
  renderShop();
  renderEquipment();
  renderProfile();
  return true;
}

async function loadMailView() {
  renderMail();
  await loadMailList(true);
}

async function loadMailList(reset = true) {
  if (!cloudUser) return;
  const query = reset ? '?mode=list&limit=30' : `?mode=list&limit=30&before=${encodeURIComponent(mailNextBefore || '')}`;
  if (!reset && !mailNextBefore) return;
  if (mailSummary) mailSummary.textContent = 'Đang tải thư...';
  try {
    const response = await fetch(`${mailEndpoint}${query}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (handleCloudResponseFailure(response, payload)) return;
    if (!response.ok) {
      if (mailSummary) mailSummary.textContent = payload.error || 'Không thể tải hộp thư.';
      return;
    }
    mailUnreadCount = Math.max(0, Number(payload.unreadCount) || 0);
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    mailMessages = reset ? messages : [...mailMessages, ...messages];
    mailNextBefore = payload.nextBefore || null;
    const latest = Date.parse(payload.latestCreatedAt || '');
    if (Number.isFinite(latest)) mailLastCheckedAt = Math.max(mailLastCheckedAt, latest);
    renderMailList();
  } catch (error) {
    if (mailSummary) mailSummary.textContent = 'Dịch vụ thư tạm thời không khả dụng.';
  }
}

async function loadOlderMail() {
  await loadMailList(false);
}

async function pollMail() {
  if (!cloudUser || cloudSyncUnavailable || mailPollingInFlight) return;
  mailPollingInFlight = true;
  try {
    const response = await fetch(`${mailEndpoint}?mode=poll&since=${encodeURIComponent(mailLastCheckedAt || 0)}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (handleCloudResponseFailure(response, payload) || !response.ok) return;
    mailUnreadCount = Math.max(0, Number(payload.unreadCount) || 0);
    mailNewCount = Math.max(0, Number(payload.newCount) || 0);
    const latest = Date.parse(payload.latestCreatedAt || '');
    if (Number.isFinite(latest)) mailLastCheckedAt = Math.max(mailLastCheckedAt, latest);
    renderMailHeader();
    if (mailNewCount > 0 && !mailPanel?.classList.contains('is-hidden')) await loadMailList(true);
  } catch (error) {
    console.warn('Cannot poll system mail.', error);
  } finally {
    mailPollingInFlight = false;
  }
}

function startMailPolling() {
  window.clearInterval(mailPollingTimer);
  mailPollingTimer = 0;
  if (!cloudUser || cloudSyncUnavailable || !gameStarted) return;
  pollMail();
  mailPollingTimer = window.setInterval(pollMail, 5000);
}

function renderMail() {
  renderMailHeader();
  renderMailList();
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
  if (code === 'newbie') {
    const minorPill = shopItems.find((item) => item.id === 'minorAscensionPill1');
    return [
      { iconClass: 'item-icon icon-item-spirit-stone', label: `Linh thạch +${formatGameNumber(grant.spiritStones)}` },
      { iconClass: 'activity-icon icon-activity-chest', label: `Rương cấp 1 x${formatGameNumber(grant.equipmentChestTier1)}` },
      { iconClass: 'item-icon icon-item-enhancement-stone', label: `Đá cường hóa x${formatGameNumber(grant.enhancementStones)}` },
      { iconClass: 'activity-icon icon-activity-gate', label: `${minorPill?.name || 'Thối Thể Đan'} x${formatGameNumber(grant.minorAscensionPill1)}` },
      { iconClass: 'item-icon icon-item-health-pill', label: `Sinh Huyết Đan x${formatGameNumber(grant.healthPotions)}` },
      { iconClass: 'item-icon icon-item-mana-flame', label: `Tụ Linh Đan x${formatGameNumber(grant.manaPotions)}` },
    ];
  }
  const chestRewards = Object.entries(grant)
    .map(([key, amount]) => {
      const match = key.match(/^equipmentChestTier(\d+)$/);
      return match ? { tier: Number(match[1]), amount: Number(amount) || 0 } : null;
    })
    .filter((reward) => reward && reward.amount > 0);
  const rewardItems = chestRewards.map((reward) => ({
      iconClass: 'activity-icon icon-activity-chest',
      label: `Rương cấp ${reward.tier} x${formatGameNumber(reward.amount)}`,
  }));
  if (grant.enhancementStones) {
    rewardItems.push({
      iconClass: 'item-icon icon-item-enhancement-stone',
      label: `Đá cường hóa x${formatGameNumber(grant.enhancementStones)}`,
    });
  }
  if (grant.ascensionPermits) {
    rewardItems.push({
      iconClass: 'activity-icon icon-activity-gate',
      label: `Phá Cảnh Đan x${formatGameNumber(grant.ascensionPermits)}`,
    });
  }
  return rewardItems;
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
  Object.entries(grant).forEach(([key, amount]) => {
    const shopItem = shopItems.find((item) => item.id === key);
    if (shopItem?.type === 'minorAscension') addShopInventoryItem(key, amount);
  });
  Object.entries(grant).forEach(([key, amount]) => {
    const match = key.match(/^equipmentChestTier(\d+)$/);
    if (!match) return;
    const chestTier = Math.max(1, Number(match[1]) || 1);
    for (let index = 0; index < Math.max(0, Number(amount) || 0); index += 1) {
      addEquipmentChest({ majorRealmIndex: playerMajorRealmIndex }, { chestTier });
    }
  });
  Object.entries(grant).forEach(([key, amount]) => {
    const shopItem = shopItems.find((item) => item.id === key);
    if (shopItem && [
      'skillChest', 'petChest', 'talentTreasureChest', 'majorAscensionTreasureChest',
    ].includes(shopItem.type)) {
      addShopInventoryItem(shopItem.id, amount);
    }
  });
  if (grant.unlockAllWanderMaps) {
    wanderMapList.forEach((map) => {
      wanderBossDefeatedByMap[map.id] = true;
    });
  }

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
    code === 'newbie' ? 'Đã nhận quà tân thủ:' : 'Đã nhận quà từ mã redeem:',
    'success',
    getRedeemRewardToastItems(code, grant),
  );
}
