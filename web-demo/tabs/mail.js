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

function setMailFormMessage(message = '', variant = '') {
  if (!mailFormMessage) return;
  mailFormMessage.textContent = message;
  mailFormMessage.className = `mail-form-message${variant ? ` mail-form-message-${variant}` : ''}`;
}

function renderMailAdminControls() {
  mailInboxPanel?.classList.toggle('is-hidden', mailIsAdmin);
  mailComposerPanel?.classList.toggle('is-hidden', !mailIsAdmin);
  codeRedeemPanel?.classList.toggle('is-hidden', mailIsAdmin);
  mailUnreadSummary?.classList.toggle('is-hidden', mailIsAdmin);
  if (mailSummary) mailSummary.textContent = mailIsAdmin ? 'Gửi thư hệ thống' : 'Hộp thư hệ thống';
}

function renderMailHeader() {
  if (mailUnreadSummary) mailUnreadSummary.textContent = `${mailUnreadCount} thư chưa đọc`;
  if (mailSummary && (!mailSummary.textContent || mailSummary.textContent === 'Đang tải thư...')) {
    mailSummary.textContent = 'Hộp thư hệ thống';
  }
  setNotificationBadge(mailBadge, mailUnreadCount);
}

function renderMailAttachmentRows() {
  if (!mailAttachmentRowsContainer) return;
  const options = mailCatalog.length
    ? `<option value="">Chọn vật phẩm</option>${mailCatalog.map((item) => `<option value="${escapeMailHtml(item.itemId)}">${escapeMailHtml(item.name)}</option>`).join('')}`
    : '<option value="">Đang tải danh sách vật phẩm...</option>';
  mailAttachmentRowsContainer.innerHTML = mailAttachmentRows.map((row, index) => `
    <div class="mail-attachment-row">
      <label class="sr-only" for="mailAttachmentItem${index}">Vật phẩm đính kèm ${index + 1}</label>
      <select id="mailAttachmentItem${index}" data-mail-attachment-item data-mail-attachment-index="${index}">${options}</select>
      <label class="sr-only" for="mailAttachmentQuantity${index}">Số lượng</label>
      <input id="mailAttachmentQuantity${index}" data-mail-attachment-quantity data-mail-attachment-index="${index}" type="number" min="1" max="1000000" step="1" value="${Math.max(1, Number(row.quantity) || 1)}" aria-label="Số lượng vật phẩm">
      <button type="button" class="secondary compact" data-mail-remove-attachment="${index}" aria-label="Xóa vật phẩm đính kèm">Xóa</button>
    </div>
  `).join('');
  mailAttachmentRows.forEach((row, index) => {
    const select = document.querySelector(`#mailAttachmentItem${index}`);
    if (select) select.value = row.itemId || '';
  });
}

function getMailAttachmentLabel(attachment) {
  if (attachment?.type === 'currency') return `Linh thạch x${formatGameNumber(attachment.amount)}`;
  return `${attachment?.name || attachment?.itemId || 'Vật phẩm'} x${formatGameNumber(attachment?.quantity)}`;
}

function renderMailList() {
  if (!mailList) return;
  if (mailIsAdmin) {
    mailLoadMoreButton?.classList.add('is-hidden');
    return;
  }
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

async function loadMailCatalog() {
  if (!mailIsAdmin || mailCatalog.length) return;
  try {
    const response = await fetch(`${mailEndpoint}?mode=catalog`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (handleCloudResponseFailure(response, payload) || !response.ok) return;
    mailCatalog = Array.isArray(payload.items) ? payload.items : [];
    renderMailAttachmentRows();
  } catch (error) {
    setMailFormMessage('Không thể tải danh sách vật phẩm.', 'error');
  }
}

async function checkMailAccess() {
  if (!cloudUser || cloudSyncUnavailable) return false;
  if (mailAccessChecked) return true;
  if (mailAccessCheckPromise) return mailAccessCheckPromise;
  mailAccessCheckPromise = (async () => {
    try {
      const response = await fetch(`${mailEndpoint}?mode=access`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (handleCloudResponseFailure(response, payload) || !response.ok) return false;
      mailIsAdmin = Boolean(payload.isAdmin);
      mailAccessChecked = true;
      renderMailAdminControls();
      renderMailHeader();
      return true;
    } catch (error) {
      return false;
    } finally {
      mailAccessCheckPromise = null;
    }
  })();
  return mailAccessCheckPromise;
}

async function loadMailView() {
  if (!await checkMailAccess()) {
    if (mailSummary) mailSummary.textContent = 'Dịch vụ thư tạm thời không khả dụng.';
    return;
  }
  renderMail();
  if (mailIsAdmin) {
    await loadMailCatalog();
    renderMailAttachmentRows();
    mailTitleInput?.focus();
    return;
  }
  await loadMailList(true);
}

function scheduleMailRecipientSearch() {
  window.clearTimeout(mailRecipientSearchTimer);
  mailRecipientSearchTimer = window.setTimeout(searchMailRecipients, 250);
}

async function searchMailRecipients() {
  if (!mailIsAdmin) return;
  const query = String(mailRecipientInput?.value || '').trim();
  if (query.length < 2) {
    if (mailRecipientOptions) mailRecipientOptions.replaceChildren();
    if (mailRecipientHint) mailRecipientHint.textContent = 'Có thể nhập username hoặc ID tài khoản.';
    return;
  }
  try {
    const response = await fetch(`${mailEndpoint}?mode=accounts&q=${encodeURIComponent(query)}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (handleCloudResponseFailure(response, payload) || !response.ok) return;
    mailRecipientOptions?.replaceChildren(...(payload.accounts || []).map((account) => {
      const option = document.createElement('option');
      option.value = account.username;
      option.label = `${account.username} (${account.id})`;
      return option;
    }));
    if (mailRecipientHint) mailRecipientHint.textContent = `${payload.accounts?.length || 0} tài khoản phù hợp.`;
  } catch (error) {
    if (mailRecipientHint) mailRecipientHint.textContent = 'Không thể tìm tài khoản lúc này.';
  }
}

async function sendMailFromAdmin(event) {
  event.preventDefault();
  if (!mailIsAdmin || authSubmitting) return;
  await loadMailCatalog();
  const attachments = mailAttachmentRows
    .filter((row) => row.itemId)
    .map((row) => ({ type: 'item', itemId: row.itemId, quantity: Math.max(1, Math.floor(Number(row.quantity) || 1)) }));
  const currency = Math.max(0, Math.floor(Number(mailCurrencyInput?.value) || 0));
  if (currency > 0) attachments.push({ type: 'currency', currency: 'spiritStones', amount: currency });
  setMailFormMessage('Đang gửi thư...');
  setButtonDisabledState(mailSendButton, true, 'Đang gửi thư...');
  try {
    const response = await fetch(mailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        recipient: mailRecipientInput?.value || '',
        title: mailTitleInput?.value || '',
        content: mailContentInput?.value || '',
        attachments,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (handleCloudResponseFailure(response, payload)) return;
    if (!response.ok) {
      setMailFormMessage(payload.error || 'Không thể gửi thư.', 'error');
      return;
    }
    mailForm?.reset();
    mailCurrencyInput.value = '0';
    mailAttachmentRows = [{ itemId: '', quantity: 1 }];
    renderMailAttachmentRows();
    showGameToast('Đã gửi thư thành công.', 'success');
  } catch (error) {
    setMailFormMessage('Dịch vụ thư tạm thời không khả dụng.', 'error');
  } finally {
    setButtonDisabledState(mailSendButton, false);
  }
}

async function loadMailList(reset = true) {
  if (!cloudUser || mailIsAdmin) return;
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
    mailIsAdmin = Boolean(payload.isAdmin);
    mailUnreadCount = Math.max(0, Number(payload.unreadCount) || 0);
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    mailMessages = reset ? messages : [...mailMessages, ...messages];
    mailNextBefore = payload.nextBefore || null;
    const latest = Date.parse(payload.latestCreatedAt || '');
    if (Number.isFinite(latest)) mailLastCheckedAt = Math.max(mailLastCheckedAt, latest);
    renderMailAdminControls();
    renderMailList();
  } catch (error) {
    if (mailSummary) mailSummary.textContent = 'Dịch vụ thư tạm thời không khả dụng.';
  }
}

async function loadOlderMail() {
  await loadMailList(false);
}

async function pollMail() {
  if (!cloudUser || cloudSyncUnavailable || mailPollingInFlight || mailIsAdmin) return;
  mailPollingInFlight = true;
  try {
    const response = await fetch(`${mailEndpoint}?mode=poll&since=${encodeURIComponent(mailLastCheckedAt || 0)}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (handleCloudResponseFailure(response, payload) || !response.ok) return;
    mailIsAdmin = Boolean(payload.isAdmin);
    if (mailIsAdmin) {
      window.clearInterval(mailPollingTimer);
      mailPollingTimer = 0;
      mailAccessChecked = true;
    }
    mailUnreadCount = Math.max(0, Number(payload.unreadCount) || 0);
    mailNewCount = Math.max(0, Number(payload.newCount) || 0);
    const latest = Date.parse(payload.latestCreatedAt || '');
    if (Number.isFinite(latest)) mailLastCheckedAt = Math.max(mailLastCheckedAt, latest);
    renderMailAdminControls();
    renderMailHeader();
    if (!mailIsAdmin && mailNewCount > 0 && !mailPanel?.classList.contains('is-hidden')) await loadMailList(true);
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
  checkMailAccess().then(() => {
    if (!cloudUser || cloudSyncUnavailable || !gameStarted || mailIsAdmin) return;
    pollMail();
    mailPollingTimer = window.setInterval(pollMail, 5000);
  });
}

function renderMail() {
  renderMailAdminControls();
  renderMailHeader();
  renderMailList();
  if (mailIsAdmin) renderMailAttachmentRows();
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
  if (code === 'devgame') {
    const items = [
      { iconClass: 'item-icon icon-item-spirit-stone', label: `Linh thạch +${formatGameNumber(grant.spiritStones)}` },
      { iconClass: 'stat-icon icon-stat-gem', label: `Căn cơ +${formatGameNumber(grant.foundation)}` },
      { iconClass: 'unique-icon icon-unique-comprehension', label: `Ngộ tính +${formatGameNumber(grant.comprehension)}` },
      { iconClass: 'activity-icon icon-activity-gate', label: `Phá Cảnh Đan x${formatGameNumber(grant.ascensionPermits)}` },
    ];
    Object.entries(grant).forEach(([key, amount]) => {
      const equipmentMatch = key.match(/^equipmentChestTier(\d+)$/);
      if (equipmentMatch) {
        items.push({
          iconClass: 'activity-icon icon-activity-chest',
          label: `Rương trang bị cấp ${equipmentMatch[1]} x${formatGameNumber(amount)}`,
        });
        return;
      }
      const shopChest = shopItems.find((item) => item.id === key && [
        'skillChest', 'petChest', 'talentTreasureChest', 'majorAscensionTreasureChest',
      ].includes(item.type));
      if (shopChest && Number(amount) > 0) {
        items.push({
          iconClass: 'activity-icon icon-activity-chest',
          label: `${shopChest.name} x${formatGameNumber(amount)}`,
        });
      }
    });
    items.push(
      { iconClass: 'item-icon icon-item-enhancement-stone', label: `Đá cường hóa x${formatGameNumber(grant.enhancementStones)}` },
      { iconClass: 'item-icon icon-item-health-pill', label: `Sinh Huyết Đan x${formatGameNumber(grant.healthPotions)}` },
      { iconClass: 'item-icon icon-item-mana-flame', label: `Tụ Linh Đan x${formatGameNumber(grant.manaPotions)}` },
      { iconClass: 'activity-icon icon-activity-path', label: 'Đã mở tất cả map Ngao du' },
    );
    return items;
  }
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

  if (code === 'devgame') devMode = true;
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
    code === 'devgame' ? 'Đã nhận quà Dev:' : code === 'newbie' ? 'Đã nhận quà tân thủ:' : 'Đã nhận quà từ mã redeem:',
    'success',
    getRedeemRewardToastItems(code, grant),
  );
}
