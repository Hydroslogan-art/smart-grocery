/**
 * SMART GROCERY & BUDGET SAFETY TRACKER
 * Full Interactive JavaScript Logic - Daily Test 2 (DT2) Certified
 * SRS Requirements: F-01, F-02, F-03, F-04, F-05, F-06A (LocalStorage), F-06B (onSnapshot Realtime)
 */

// ===================================================================
// 1. STATE & STORAGE KEYS
// ===================================================================

var STORAGE_KEYS = {
  CART: 'smart_grocery_cart_v3',
  BUDGET: 'smart_grocery_budget_v3',
  HISTORY: 'smart_grocery_history_v3',
  CATALOG: 'smart_grocery_catalog_v3',
  STORE: 'smart_grocery_store_v3',
  DATE: 'smart_grocery_date_v3',
  SESSION: 'smart_grocery_session_v3'
};

// Seed Realistic Grocery Data for Indonesian College Student (Rian - Lotte Mart Puri Indah)
var SEED_CATALOG = {
  'beras rojolele': { name: 'Beras Rojolele', category: 'Bahan Pokok', unit: 'karung/5kg', lastPrice: 68000, currentPrice: 74000 },
  'beras 5kg': { name: 'Beras 5kg', category: 'Bahan Pokok', unit: 'karung/5kg', lastPrice: 68000, currentPrice: 74000 },
  'minyak goreng 2l': { name: 'Minyak Goreng 2L', category: 'Bahan Pokok', unit: 'liter', lastPrice: 43000, currentPrice: 43000 },
  'telur 1kg': { name: 'Telur 1kg', category: 'segar', unit: 'kg', lastPrice: 32000, currentPrice: 28000 },
  'garam 500g': { name: 'Garam 500g', category: 'Bahan Pokok', unit: 'pack', lastPrice: 5000, currentPrice: 5000 },
  'sabun cuci': { name: 'Sabun Cuci', category: 'kebersihan', unit: 'pcs', lastPrice: 20000, currentPrice: 20000 },
  'wajan': { name: 'Wajan', category: 'lainnya', unit: 'pcs', lastPrice: 100000, currentPrice: 100000 },
  'sabun mandi': { name: 'Sabun Mandi', category: 'kebersihan', unit: 'pcs', lastPrice: 15000, currentPrice: 15000 },
  'indomie goreng 1 dus': { name: 'Indomie Goreng Spesial 1 Dus', category: 'makanan', unit: 'pack', lastPrice: 118000, currentPrice: 118000 }
};

var SEED_CART = [
  {
    id: 'item_minyak_seed',
    name: 'Minyak Goreng 2L',
    category: 'Bahan Pokok',
    unit: 'liter',
    qty: 1,
    currentPrice: 43000,
    lastPrice: 43000,
    discountRaw: '',
    checked: true,
    addedAt: Date.now()
  }
];

var state = {
  cart: [],
  budgetCap: 350000,
  storeLocation: 'Lotte Mart Grocery - Puri Indah',
  shoppingDate: new Date().toISOString().split('T')[0],
  sessionCode: 'rian-puri-indah',
  history: [],
  catalog: {},
  activeCategory: 'all',
  searchQuery: ''
};

// Safe LocalStorage helpers
function safeGetStorage(key, defaultVal) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      var item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
    }
  } catch (e) {
    console.warn('LocalStorage read warning:', e);
  }
  return defaultVal;
}

function safeSetStorage(key, val) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(val));
    }
  } catch (e) {
    console.warn('LocalStorage save warning:', e);
  }
}

function persistState() {
  safeSetStorage(STORAGE_KEYS.CART, state.cart);
  safeSetStorage(STORAGE_KEYS.BUDGET, state.budgetCap);
  safeSetStorage(STORAGE_KEYS.STORE, state.storeLocation);
  safeSetStorage(STORAGE_KEYS.DATE, state.shoppingDate);
  safeSetStorage(STORAGE_KEYS.SESSION, state.sessionCode);
  safeSetStorage(STORAGE_KEYS.CATALOG, state.catalog);
  safeSetStorage(STORAGE_KEYS.HISTORY, state.history);
}

// Load initial state (F-06A: Tahan F5 Reload)
function initAppData() {
  state.cart = safeGetStorage(STORAGE_KEYS.CART, SEED_CART);
  state.budgetCap = Number(safeGetStorage(STORAGE_KEYS.BUDGET, 350000)) || 350000;
  state.storeLocation = safeGetStorage(STORAGE_KEYS.STORE, 'Lotte Mart Grocery - Puri Indah');
  
  var todayStr = new Date().toISOString().split('T')[0];
  var rawDate = safeGetStorage(STORAGE_KEYS.DATE, todayStr);
  if (!rawDate || rawDate < '2026-01-01' || rawDate.indexOf('1974') !== -1) {
    rawDate = todayStr;
  }
  state.shoppingDate = rawDate;

  state.sessionCode = safeGetStorage(STORAGE_KEYS.SESSION, 'rian-puri-indah');
  state.history = safeGetStorage(STORAGE_KEYS.HISTORY, []);
  
  var loadedCatalog = safeGetStorage(STORAGE_KEYS.CATALOG, {});
  state.catalog = Object.assign({}, SEED_CATALOG, loadedCatalog);

  // Sync store name in header button
  var selectedStoreText = document.getElementById('selectedStoreText');
  if (selectedStoreText && state.storeLocation) {
    selectedStoreText.textContent = state.storeLocation;
  }

  // Sync store modal active card
  syncStoreModalSelection(state.storeLocation);

  var storeEl = document.getElementById('selectStoreLocation');
  if (storeEl && state.storeLocation) storeEl.value = state.storeLocation;

  var dateEl = document.getElementById('inputShoppingDate');
  if (dateEl && state.shoppingDate) dateEl.value = state.shoppingDate;

  var sessionDisp = document.getElementById('currentSessionDisplay');
  if (sessionDisp) sessionDisp.textContent = state.sessionCode;
}

// ===================================================================
// STORE MODAL BOTTOM-SHEET LOGIC (100% Bebas Popup Putih OS)
// ===================================================================

function openStoreModal() {
  var overlay = document.getElementById('storeModalOverlay');
  if (overlay) {
    syncStoreModalSelection(state.storeLocation);
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeStoreModal() {
  var overlay = document.getElementById('storeModalOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function handleStoreModalOverlayClick(event) {
  if (event && event.target && event.target.id === 'storeModalOverlay') {
    closeStoreModal();
  }
}

function syncStoreModalSelection(selectedStore) {
  var cards = document.querySelectorAll('#storeModalList .store-select-card');
  if (cards && cards.length > 0) {
    cards.forEach(function(card) {
      var val = card.getAttribute('data-value');
      var check = card.querySelector('.store-card-check');
      if (val === selectedStore) {
        card.classList.add('selected');
        if (check) check.classList.remove('hidden');
      } else {
        card.classList.remove('selected');
        if (check) check.classList.add('hidden');
      }
    });
  }
}

function chooseStoreFromModal(storeName) {
  state.storeLocation = storeName;
  var selectedStoreText = document.getElementById('selectedStoreText');
  if (selectedStoreText) selectedStoreText.textContent = storeName;
  var selectStore = document.getElementById('selectStoreLocation');
  if (selectStore) selectStore.value = storeName;

  syncStoreModalSelection(storeName);
  closeStoreModal();

  persistState();
  if (typeof syncToCloud === 'function') syncToCloud();
  showToast('Lokasi belanja: ' + storeName, 'info');
}

function onStoreLocationChange(val) {
  chooseStoreFromModal(val);
}

function onShoppingDateChange(val) {
  state.shoppingDate = val;
  persistState();
  if (typeof syncToCloud === 'function') syncToCloud();
  showToast('Tanggal belanja diperbarui', 'info');
}

// Expose functions globally for HTML onclick handlers
if (typeof window !== 'undefined') {
  window.openStoreModal = openStoreModal;
  window.closeStoreModal = closeStoreModal;
  window.handleStoreModalOverlayClick = handleStoreModalOverlayClick;
  window.chooseStoreFromModal = chooseStoreFromModal;
  window.chooseStoreOption = chooseStoreFromModal;
  window.toggleStoreDropdown = openStoreModal;
  window.onStoreLocationChange = onStoreLocationChange;
  window.onShoppingDateChange = onShoppingDateChange;
}

// ===================================================================
// 2. HELPER UTILITIES
// ===================================================================

function formatRupiah(num) {
  var rounded = Math.round(Number(num) || 0);
  return 'Rp ' + rounded.toLocaleString('id-ID');
}

function normalizeKey(str) {
  return (str || '').trim().toLowerCase();
}

function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toastContainer');
  if (!container) return;

  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;

  var iconSymbol = 'ℹ️';
  if (type === 'danger') iconSymbol = '🚨';
  if (type === 'warning') iconSymbol = '⚠️';
  if (type === 'success') iconSymbol = '✅';

  toast.innerHTML = '<span style="font-size:16px;">' + iconSymbol + '</span><span>' + message + '</span>';
  container.appendChild(toast);

  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  }, 2800);
}

// ===================================================================
// 3. SRS F-03: KALKULATOR DISKON BERTINGKAT KOMPOUND (PRESISI)
// Rumus matematis: P_akhir = P0 * (1 - d1) * (1 - d2)...
// ===================================================================

function calculateDiscount(basePrice, discountRaw) {
  var price = Number(basePrice) || 0;
  if (!discountRaw || price <= 0) {
    return {
      finalPrice: price,
      savingsPerUnit: 0,
      label: null,
      isStacked: false
    };
  }

  var clean = discountRaw.toString().trim().replace(/rp|\.|\s/gi, '');

  // Case A: Diskon Bertingkat Kompound (misal "50%+20%" atau "50+20")
  if (clean.indexOf('+') !== -1) {
    var parts = clean.split('+');
    var current = price;
    var percentages = [];

    for (var i = 0; i < parts.length; i++) {
      var pNum = parseFloat(parts[i].replace('%', ''));
      if (!isNaN(pNum) && pNum > 0) {
        percentages.push(pNum);
        current = current * (1 - (pNum / 100));
      }
    }

    var finalPrice = Math.max(0, Math.round(current));
    var savings = price - finalPrice;

    return {
      finalPrice: finalPrice,
      savingsPerUnit: savings,
      label: percentages.join('%+') + '%',
      isStacked: true
    };
  }

  // Case B: Diskon Persentase Tunggal (misal "25%" atau "25")
  if (clean.indexOf('%') !== -1 || (!isNaN(clean) && Number(clean) <= 100 && clean.length <= 2)) {
    var pNumSingle = parseFloat(clean.replace('%', ''));
    if (!isNaN(pNumSingle) && pNumSingle > 0) {
      var finalP = Math.max(0, Math.round(price * (1 - (pNumSingle / 100))));
      return {
        finalPrice: finalP,
        savingsPerUnit: price - finalP,
        label: pNumSingle + '%',
        isStacked: false
      };
    }
  }

  // Case C: Potongan Nominal Rp (misal "5000")
  var nominal = parseFloat(clean);
  if (!isNaN(nominal) && nominal > 0) {
    var finalNom = Math.max(0, price - nominal);
    return {
      finalPrice: finalNom,
      savingsPerUnit: price - finalNom,
      label: '-Rp ' + nominal.toLocaleString('id-ID'),
      isStacked: false
    };
  }

  return {
    finalPrice: price,
    savingsPerUnit: 0,
    label: null,
    isStacked: false
  };
}

// ===================================================================
// 4. SRS F-04: INDIKATOR KOMPARASI FLUKTUASI HARGA REALTIME
// Panah Merah Naik (↑), Panah Hijau Turun (↓), atau Tanda Setara (=)
// ===================================================================

function comparePrice(currentPrice, lastPrice) {
  var current = Number(currentPrice) || 0;
  var last = Number(lastPrice) || 0;

  if (last <= 0 || current <= 0) {
    return {
      type: 'equal',
      symbol: '=',
      text: '= Harga tetap stabil',
      diff: 0,
      percent: 0
    };
  }

  var diff = current - last;
  var percent = Math.round((Math.abs(diff) / last) * 100);

  if (diff > 0) {
    return {
      type: 'up',
      symbol: '↑',
      text: '↑ +' + formatRupiah(diff) + ' (+' + percent + '%)',
      diff: diff,
      percent: percent
    };
  } else if (diff < 0) {
    return {
      type: 'down',
      symbol: '↓',
      text: '↓ -' + formatRupiah(Math.abs(diff)) + ' (-' + percent + '%)',
      diff: diff,
      percent: percent
    };
  } else {
    return {
      type: 'equal',
      symbol: '=',
      text: '= Harga tetap stabil',
      diff: 0,
      percent: 0
    };
  }
}

// ===================================================================
// 5. SRS F-05: PENGENDALI ANGGARAN (BUDGET SAFETY CAP)
// Total >= 90%: Kuning (Peringatan Waspada)
// Total > 100%: Banner Merah Tegas
// ===================================================================

function updateBudgetSafetyCap() {
  var totalCart = 0;
  var totalSavings = 0;

  for (var i = 0; i < state.cart.length; i++) {
    var it = state.cart[i];
    var disc = calculateDiscount(it.currentPrice, it.discountRaw);
    var lineTotal = disc.finalPrice * (it.qty || 1);
    var lineSavings = disc.savingsPerUnit * (it.qty || 1);

    totalCart += lineTotal;
    totalSavings += lineSavings;
  }

  var budget = state.budgetCap;
  var remaining = budget - totalCart;
  var percent = budget > 0 ? Math.round((totalCart / budget) * 100) : 0;

  // Update DOM displays
  var totalCartEl = document.getElementById('totalCartDisplay');
  var remainingEl = document.getElementById('remainingBudgetDisplay');
  var gaugeFillEl = document.getElementById('budgetGaugeFill');
  var gaugeTextEl = document.getElementById('gaugePercentText');
  var budgetCardEl = document.getElementById('budgetCard');
  var statusTextEl = document.getElementById('budgetStatusText');
  var dangerBannerEl = document.getElementById('dangerBanner');
  var dangerBannerText = document.getElementById('dangerBannerText');
  var totalSavingsEl = document.getElementById('totalSavingsText');
  var headerBudgetCap = document.getElementById('headerBudgetCap');
  var inputBudgetCap = document.getElementById('inputBudgetCap');

  if (totalCartEl) totalCartEl.textContent = formatRupiah(totalCart);
  if (remainingEl) {
    remainingEl.textContent = formatRupiah(remaining);
    remainingEl.style.color = remaining < 0 ? '#fb7185' : 'var(--primary-light)';
  }
  if (totalSavingsEl) totalSavingsEl.textContent = formatRupiah(totalSavings);
  if (headerBudgetCap) headerBudgetCap.textContent = formatRupiah(budget);

  if (inputBudgetCap && document.activeElement !== inputBudgetCap) {
    inputBudgetCap.value = budget;
  }

  // Gauge bar fill width
  var barWidth = Math.min(100, Math.max(0, percent));
  if (gaugeFillEl) gaugeFillEl.style.width = barWidth + '%';
  if (gaugeTextEl) gaugeTextEl.textContent = percent + '% Terpakai';

  // SESUAI RUBRIK DT2 RESMI:
  // 1. > 100% Saldo Dompet: Merah Tegas dengan notifikasi peringatan wajib
  // 2. >= 90% Saldo Dompet: Kuning (Peringatan Waspada)
  // 3. < 90% Saldo Dompet: Hijau (Anggaran Aman)
  if (budgetCardEl) {
    budgetCardEl.classList.remove('state-safe', 'state-warning', 'state-danger');

    if (percent > 100) {
      budgetCardEl.classList.add('state-danger');
      if (statusTextEl) {
        statusTextEl.textContent = '🚨 OVER BUDGET (' + percent + '%)';
        statusTextEl.style.color = '#fb7185';
      }
      if (dangerBannerEl) {
        dangerBannerEl.classList.remove('hidden');
        if (dangerBannerText) {
          dangerBannerText.textContent = 'Total belanja melebihi batas saldo dompet! Kurangi kuantitas atau batalkan barang sekunder.';
        }
      }
    } else if (percent >= 90) {
      budgetCardEl.classList.add('state-warning');
      if (statusTextEl) {
        statusTextEl.textContent = '🟡 Peringatan Waspada (' + percent + '%)';
        statusTextEl.style.color = '#fbbf24';
      }
      if (dangerBannerEl) dangerBannerEl.classList.add('hidden');
    } else {
      budgetCardEl.classList.add('state-safe');
      if (statusTextEl) {
        statusTextEl.textContent = '🟢 Anggaran Aman';
        statusTextEl.style.color = 'var(--primary-light)';
      }
      if (dangerBannerEl) dangerBannerEl.classList.add('hidden');
    }
  }

  var navBadge = document.getElementById('navBadgeCount');
  if (navBadge) navBadge.textContent = state.cart.length;

  renderCategoryBreakdown(totalCart);
}

// ===================================================================
// MODAL SALDO UANG SAKU
// ===================================================================

window.openSaldoModal = function() {
  var modal = document.getElementById('saldoModalOverlay');
  var input = document.getElementById('modalSaldoInput');
  if (!modal) return;

  if (input) input.value = state.budgetCap;
  window.updateModalSaldoLive(state.budgetCap);
  modal.classList.remove('hidden');

  if (input) {
    setTimeout(function() {
      input.focus();
      input.select();
    }, 100);
  }
};

window.closeSaldoModal = function() {
  var modal = document.getElementById('saldoModalOverlay');
  if (modal) modal.classList.add('hidden');
};

window.handleSaldoModalOverlayClick = function(e) {
  if (e && e.target && e.target.id === 'saldoModalOverlay') {
    window.closeSaldoModal();
  }
};

window.setModalSaldoPreset = function(val) {
  var input = document.getElementById('modalSaldoInput');
  if (input) {
    input.value = val;
    window.updateModalSaldoLive(val);
  }
};

window.onModalSaldoInputChange = function(val) {
  window.updateModalSaldoLive(val);
};

window.updateModalSaldoLive = function(customBudget) {
  var bNum = parseFloat(customBudget);
  if (isNaN(bNum) || bNum < 0) bNum = 0;

  var totalBelanja = 0;
  for (var i = 0; i < state.cart.length; i++) {
    var it = state.cart[i];
    var disc = calculateDiscount(it.currentPrice, it.discountRaw);
    totalBelanja += disc.finalPrice * (it.qty || 1);
  }

  var sisa = bNum - totalBelanja;

  var previewBawa = document.getElementById('previewSaldoBawa');
  var previewBelanja = document.getElementById('previewSaldoBelanja');
  var previewSisa = document.getElementById('previewSaldoSisa');

  if (previewBawa) previewBawa.textContent = formatRupiah(bNum);
  if (previewBelanja) previewBelanja.textContent = formatRupiah(totalBelanja);
  if (previewSisa) {
    previewSisa.textContent = formatRupiah(sisa);
    previewSisa.style.color = sisa < 0 ? '#fb7185' : 'var(--primary-light)';
  }
};

window.saveSaldoFromModal = function() {
  var input = document.getElementById('modalSaldoInput');
  var val = parseFloat(input ? input.value : 0);
  if (isNaN(val) || val <= 0) {
    showToast('Nominal saldo harus lebih besar dari Rp 0!', 'warning');
    return;
  }

  state.budgetCap = val;
  persistState();
  updateBudgetSafetyCap();
  syncToCloud();
  window.closeSaldoModal();
  showToast('✓ Saldo dompet berhasil disetel: ' + formatRupiah(val), 'success');
};

window.onBudgetChange = function(val) {
  var num = parseFloat(val);
  if (isNaN(num) || num < 0) num = 0;
  state.budgetCap = num;
  persistState();
  updateBudgetSafetyCap();
  syncToCloud();
};

window.applyBudgetPreset = function(val) {
  window.onBudgetChange(val);
  showToast('Batas anggaran disetel: ' + formatRupiah(val), 'success');
};

// ===================================================================
// 6. RENDER DAFTAR KERANJANG (SRS F-01, F-02, F-03, F-04)
// Termasuk Tombol Stepper + Input Angka Langsung di Kartu Item
// ===================================================================

function renderCart() {
  var container = document.getElementById('cartItemsList');
  var emptyState = document.getElementById('emptyCartState');
  var cartCountBadge = document.getElementById('cartCountBadge');
  var checkedCountText = document.getElementById('checkedCount');

  if (!container) return;

  var totalItems = state.cart.length;
  var checkedItems = 0;
  for (var i = 0; i < state.cart.length; i++) {
    if (state.cart[i].checked) checkedItems++;
  }

  if (cartCountBadge) cartCountBadge.textContent = totalItems + ' Item';
  if (checkedCountText) checkedCountText.textContent = '· ' + checkedItems + ' di troli';

  if (totalItems === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    updateBudgetSafetyCap();
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  var filtered = [];
  for (var j = 0; j < state.cart.length; j++) {
    var item = state.cart[j];
    var matchCat = state.activeCategory === 'all' || 
                   item.category === state.activeCategory ||
                   (state.activeCategory === 'Bahan Pokok' && item.category === 'sembako');
    var matchSearch = !state.searchQuery || item.name.toLowerCase().indexOf(state.searchQuery.toLowerCase()) !== -1;
    if (matchCat && matchSearch) {
      filtered.push(item);
    }
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding: 20px;"><p class="text-muted">Tidak ada barang yang cocok dengan filter ini.</p></div>';
    updateBudgetSafetyCap();
    return;
  }

  var html = '';
  for (var k = 0; k < filtered.length; k++) {
    var it = filtered[k];
    var discount = calculateDiscount(it.currentPrice, it.discountRaw);
    var comp = comparePrice(it.currentPrice, it.lastPrice);
    var subtotal = discount.finalPrice * (it.qty || 1);
    var isCheckedClass = it.checked ? 'checked-in-trolley' : '';

    html += '<div class="item-card ' + isCheckedClass + '" data-id="' + it.id + '">';
    
    // Top Row: Checkbox, Name, Category, Action
    html += '<div class="card-top-row">';
    html += '  <div class="item-trolley-check">';
    html += '    <input type="checkbox" class="trolley-checkbox" ' + (it.checked ? 'checked' : '') + ' onchange="toggleItemChecked(\'' + it.id + '\', this.checked)">';
    html += '    <div class="item-meta">';
    html += '      <div class="item-category-tag">' + getCategoryEmoji(it.category) + ' ' + it.category + '</div>';
    html += '      <h3 class="item-title">' + escapeHtml(it.name) + '</h3>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="item-card-actions">';
    html += '    <button type="button" class="btn-card-icon delete" onclick="askDeleteItem(\'' + it.id + '\')" title="Hapus Barang" aria-label="Hapus">';
    html += '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>';
    html += '    </button>';
    html += '  </div>';
    html += '</div>';

    // Badges Row: SRS F-03 & F-04
    html += '<div class="card-price-indicators">';
    html += '  <span class="price-tag-current">' + formatRupiah(discount.finalPrice) + '/' + (it.unit || 'pcs') + '</span>';
    if (discount.savingsPerUnit > 0) {
      html += '  <span class="price-tag-original">' + formatRupiah(it.currentPrice) + '</span>';
    }
    // F-04 Badge
    html += '  <span class="comp-badge ' + comp.type + '" title="Bulan lalu: ' + formatRupiah(it.lastPrice) + '">';
    html += '    <strong>' + comp.symbol + '</strong> ' + comp.text;
    html += '  </span>';
    // F-03 Badge
    if (discount.label) {
      html += '  <span class="discount-badge" title="Diskon Promo">';
      html += '    🏷️ ' + (discount.isStacked ? 'Bertingkat: ' : '') + discount.label;
      html += '  </span>';
    }
    html += '</div>';

    // Bottom Row: SRS F-02 Thumb Steppers (+ / -) & Direct Typing Numeric Input
    html += '<div class="card-bottom-row">';
    html += '  <div class="item-stepper">';
    html += '    <button type="button" class="stepper-btn" onclick="changeItemQty(\'' + it.id + '\', -1)" aria-label="Kurang">';
    html += '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/></svg>';
    html += '    </button>';
    html += '    <input type="number" inputmode="numeric" class="stepper-count-input" value="' + (it.qty || 1) + '" min="1" max="999" oninput="changeItemQtyDirect(\'' + it.id + '\', this.value)" aria-label="Kuantitas">';
    html += '    <span class="stepper-count-unit">' + (it.unit || 'pcs') + '</span>';
    html += '    <button type="button" class="stepper-btn" onclick="changeItemQty(\'' + it.id + '\', 1)" aria-label="Tambah">';
    html += '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
    html += '    </button>';
    html += '  </div>';
    html += '  <div class="item-subtotal-box">';
    html += '    <div class="subtotal-label">Subtotal</div>';
    html += '    <div class="subtotal-amount">' + formatRupiah(subtotal) + '</div>';
    html += '  </div>';
    html += '</div>';

    html += '</div>';
  }

  container.innerHTML = html;
  updateBudgetSafetyCap();
}

function getCategoryEmoji(cat) {
  var c = (cat || '').toLowerCase();
  if (c.indexOf('pokok') !== -1 || c.indexOf('sembako') !== -1) return '🌾';
  if (c.indexOf('kebersihan') !== -1 || c.indexOf('sabun') !== -1) return '🧼';
  if (c.indexOf('makan') !== -1) return '🍜';
  if (c.indexOf('segar') !== -1 || c.indexOf('telur') !== -1) return '🥚';
  if (c.indexOf('minum') !== -1) return '🧃';
  return '📦';
}

function escapeHtml(text) {
  return (text || '').replace(/[&<>"']/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    return '&#039;';
  });
}

// ===================================================================
// 7. SRS F-02: REAKTIVITAS STEPPERS & ITEM ACTIONS TANPA DELAY
// ===================================================================

window.changeItemQty = function(id, delta) {
  for (var i = 0; i < state.cart.length; i++) {
    if (state.cart[i].id === id) {
      var newQty = (state.cart[i].qty || 1) + delta;
      if (newQty <= 0) {
        window.askDeleteItem(id);
        return;
      }
      state.cart[i].qty = newQty;
      break;
    }
  }
  persistState();
  renderCart();
  syncToCloud();
};

window.changeItemQtyDirect = function(id, valStr) {
  var val = parseInt(valStr);
  if (isNaN(val) || val <= 0) val = 1;
  for (var i = 0; i < state.cart.length; i++) {
    if (state.cart[i].id === id) {
      state.cart[i].qty = val;
      break;
    }
  }
  persistState();
  renderCart();
  syncToCloud();
};

window.toggleItemChecked = function(id, isChecked) {
  for (var i = 0; i < state.cart.length; i++) {
    if (state.cart[i].id === id) {
      state.cart[i].checked = isChecked;
      break;
    }
  }
  persistState();
  renderCart();
  syncToCloud();
};

// ===================================================================
// SAFE DELETE & CLEAR CART (SRS UX: Non-blocking in-app modal)
// ===================================================================

var pendingDeleteId = null;

window.askDeleteItem = function(id) {
  var target = null;
  for (var i = 0; i < state.cart.length; i++) {
    if (state.cart[i].id === id) {
      target = state.cart[i];
      break;
    }
  }
  if (!target) return;

  pendingDeleteId = id;
  var modal = document.getElementById('confirmModalOverlay');
  var title = document.getElementById('confirmTitle');
  var msg = document.getElementById('confirmMessage');
  var btn = document.getElementById('btnConfirmAction');

  if (title) title.textContent = 'Hapus Barang';
  if (msg) msg.textContent = 'Keluarkan "' + target.name + '" dari keranjang belanja?';
  if (btn) {
    btn.onclick = function() {
      executeDeleteItem();
    };
  }
  if (modal) modal.classList.remove('hidden');
};

function executeDeleteItem() {
  if (!pendingDeleteId) return;
  var targetName = '';
  for (var i = 0; i < state.cart.length; i++) {
    if (state.cart[i].id === pendingDeleteId) {
      targetName = state.cart[i].name;
      state.cart.splice(i, 1);
      break;
    }
  }
  pendingDeleteId = null;
  closeConfirmModal();
  persistState();
  renderCart();
  syncToCloud();
  showToast('"' + targetName + '" telah dikeluarkan dari troli.', 'info');
}

window.askClearCart = function() {
  if (state.cart.length === 0) return;
  var modal = document.getElementById('confirmModalOverlay');
  var title = document.getElementById('confirmTitle');
  var msg = document.getElementById('confirmMessage');
  var btn = document.getElementById('btnConfirmAction');

  if (title) title.textContent = 'Kosongkan Troli';
  if (msg) msg.textContent = 'Kosongkan semua barang belanjaan dari keranjang troli?';
  if (btn) {
    btn.onclick = function() {
      state.cart = [];
      closeConfirmModal();
      persistState();
      renderCart();
      syncToCloud();
      showToast('Keranjang troli telah dikosongkan.', 'info');
    };
  }
  if (modal) modal.classList.remove('hidden');
};

window.closeConfirmModal = function() {
  var modal = document.getElementById('confirmModalOverlay');
  if (modal) modal.classList.add('hidden');
  pendingDeleteId = null;
};

// ===================================================================
// 8. SRS F-01 & F-03 & F-04: FORM TAMBAH BARANG LOGIC & VALIDASI
// ===================================================================

window.changeFormQty = function(delta) {
  var input = document.getElementById('inputItemQty');
  if (!input) return;
  var val = parseInt(input.value) || 1;
  val = Math.max(1, val + delta);
  input.value = val;
  updateFormLivePreview();
};

window.applyDiscountPreset = function(presetStr) {
  var input = document.getElementById('inputDiscount');
  if (input) {
    input.value = presetStr;
    updateFormLivePreview();
  }
};

function updateFormLivePreview() {
  var currPriceEl = document.getElementById('inputCurrentPrice');
  var lastPriceEl = document.getElementById('inputLastPrice');
  var qtyEl = document.getElementById('inputItemQty');
  var discountEl = document.getElementById('inputDiscount');

  var currPrice = parseFloat(currPriceEl ? currPriceEl.value : 0) || 0;
  var lastPrice = parseFloat(lastPriceEl ? lastPriceEl.value : 0) || 0;
  var qty = parseInt(qtyEl ? qtyEl.value : 1) || 1;
  var discStr = discountEl ? discountEl.value.trim() : '';

  // SRS F-03 Diskon Bertingkat Preview
  var discountResult = calculateDiscount(currPrice, discStr);
  var lineTotal = discountResult.finalPrice * qty;

  var previewUnit = document.getElementById('previewUnitFinal');
  var previewSubtotal = document.getElementById('previewSubtotalFinal');

  if (previewUnit) previewUnit.textContent = formatRupiah(discountResult.finalPrice);
  if (previewSubtotal) previewSubtotal.textContent = formatRupiah(lineTotal);

  // SRS F-04 Komparasi Harga Realtime Live Preview
  var compIndicator = document.getElementById('comparisonIndicator');
  var compSymbol = document.getElementById('compIconSymbol');
  var compText = document.getElementById('comparisonText');

  if (compIndicator && compText) {
    var comp = comparePrice(currPrice, lastPrice);
    compIndicator.className = 'comparison-indicator ' + comp.type;
    if (compSymbol) compSymbol.textContent = comp.symbol;
    compText.textContent = lastPrice > 0 ? comp.text : '= Harga tetap stabil';
  }
}
window.updateFormLivePreview = updateFormLivePreview;


// Autocomplete suggestions based on historical catalog
window.handleNameAutocomplete = function(val) {
  var box = document.getElementById('suggestionsBox');
  if (!box) return;

  var q = (val || '').toLowerCase().trim();
  if (q.length < 2) {
    box.classList.add('hidden');
    return;
  }

  var entries = Object.entries(state.catalog);
  var matches = [];
  for (var i = 0; i < entries.length; i++) {
    var k = entries[i][0];
    var it = entries[i][1];
    if (k.indexOf(q) !== -1 || it.name.toLowerCase().indexOf(q) !== -1) {
      matches.push({ key: k, item: it });
      if (matches.length >= 4) break;
    }
  }

  if (matches.length === 0) {
    box.classList.add('hidden');
    return;
  }

  var html = '';
  for (var m = 0; m < matches.length; m++) {
    var match = matches[m];
    html += '<div class="suggestion-item" onclick="selectSuggestion(\'' + match.key + '\')">';
    html += '  <div><div class="sugg-name">' + escapeHtml(match.item.name) + '</div><div style="font-size:10px;color:var(--text-muted);">' + match.item.category + ' · ' + match.item.unit + '</div></div>';
    html += '  <div class="sugg-price">Bln lalu: ' + formatRupiah(match.item.lastPrice) + '</div>';
    html += '</div>';
  }

  box.innerHTML = html;
  box.classList.remove('hidden');
};

window.selectSuggestion = function(key) {
  var item = state.catalog[key];
  if (!item) return;

  var nameEl = document.getElementById('inputItemName');
  var catEl = document.getElementById('selectItemCategory');
  var unitEl = document.getElementById('selectItemUnit');
  var lastPriceEl = document.getElementById('inputLastPrice');
  var currPriceEl = document.getElementById('inputCurrentPrice');
  var box = document.getElementById('suggestionsBox');

  if (nameEl) nameEl.value = item.name;
  if (catEl) catEl.value = item.category || 'Bahan Pokok';
  if (unitEl) {
    unitEl.value = item.unit || 'pcs';
    var formUnitLabel = document.getElementById('formUnitLabel');
    if (formUnitLabel) formUnitLabel.textContent = item.unit || 'pcs';
  }
  if (lastPriceEl) lastPriceEl.value = item.lastPrice || '';
  if (currPriceEl && !currPriceEl.value) currPriceEl.value = item.currentPrice || item.lastPrice || '';

  if (box) box.classList.add('hidden');
  updateFormLivePreview();
  if (currPriceEl) currPriceEl.focus();
};

// Form Submission: SRS F-01 Validasi Ketat (Tolak Kosong & Harga Negatif)
window.handleFormSubmit = function(event) {
  if (event) event.preventDefault();

  var nameEl = document.getElementById('inputItemName');
  var catEl = document.getElementById('selectItemCategory');
  var unitEl = document.getElementById('selectItemUnit');
  var qtyEl = document.getElementById('inputItemQty');
  var currPriceEl = document.getElementById('inputCurrentPrice');
  var lastPriceEl = document.getElementById('inputLastPrice');
  var discEl = document.getElementById('inputDiscount');

  var name = nameEl ? nameEl.value.trim() : '';
  var category = catEl ? catEl.value : 'Bahan Pokok';
  var unit = unitEl ? unitEl.value : 'karung/5kg';
  var qty = parseInt(qtyEl ? qtyEl.value : 1);
  var currentPrice = parseFloat(currPriceEl ? currPriceEl.value : 0);
  var lastPrice = parseFloat(lastPriceEl ? lastPriceEl.value : 0) || 0;
  var discountRaw = discEl ? discEl.value.trim() : '';

  // VALIDASI FORM WAJIB SRS F-01:
  // Tolak input nama kosong atau harga minus (-Rp 15.000) atau 0
  if (!name) {
    showToast('Harap masukkan nama produk/barang!', 'danger');
    if (nameEl) nameEl.focus();
    return false;
  }
  if (isNaN(currentPrice) || currentPrice <= 0) {
    showToast('Harga satuan tidak boleh negatif atau Rp 0!', 'danger');
    if (currPriceEl) currPriceEl.focus();
    return false;
  }
  if (isNaN(qty) || qty <= 0) {
    showToast('Kuantitas belanja harus minimal 1!', 'danger');
    if (qtyEl) qtyEl.focus();
    return false;
  }

  var newItem = {
    id: 'item_' + Date.now(),
    name: name,
    category: category,
    unit: unit,
    qty: qty,
    currentPrice: currentPrice,
    lastPrice: lastPrice > 0 ? lastPrice : currentPrice,
    discountRaw: discountRaw,
    checked: true,
    addedAt: Date.now()
  };

  state.cart.unshift(newItem);

  // Update catalog acuan
  var catKey = normalizeKey(name);
  state.catalog[catKey] = {
    name: name,
    category: category,
    unit: unit,
    lastPrice: lastPrice > 0 ? lastPrice : currentPrice,
    currentPrice: currentPrice,
    updatedAt: Date.now()
  };

  persistState();
  renderCart();
  syncToCloud();
  showToast('✓ "' + name + '" ditambahkan ke keranjang!', 'success');

  // Reset form fields
  if (nameEl) nameEl.value = '';
  if (currPriceEl) currPriceEl.value = '';
  if (lastPriceEl) lastPriceEl.value = '';
  if (discEl) discEl.value = '';
  if (qtyEl) qtyEl.value = '1';
  updateFormLivePreview();

  var box = document.getElementById('suggestionsBox');
  if (box) box.classList.add('hidden');

  return false;
};

// Toggle in-page Add Item form card
window.toggleFormCard = function() {
  var card = document.getElementById('cardAddItem');
  if (card) {
    card.classList.toggle('collapsed');
  }
};

window.focusAddItemForm = function() {
  var card = document.getElementById('cardAddItem');
  if (card && card.classList.contains('collapsed')) {
    card.classList.remove('collapsed');
  }
  var nameEl = document.getElementById('inputItemName');
  if (nameEl) {
    nameEl.focus();
    nameEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

// Sesi Belanja: Ganti Toko & Tanggal (SRS F-01 & F-06A)
window.onStoreLocationChange = function(val) {
  state.storeLocation = val || 'Lotte Mart Grocery - Puri Indah';
  persistState();
  syncToCloud();
  showToast('Lokasi belanja: ' + state.storeLocation, 'info');
};

window.onShoppingDateChange = function(val) {
  state.shoppingDate = val || new Date().toISOString().split('T')[0];
  persistState();
  syncToCloud();
  showToast('Tanggal transaksi: ' + state.shoppingDate, 'info');
};

// ===================================================================
// 9. SRS F-06B: SINKRONISASI REALTIME CLOUD MULTI-DEVICE (onSnapshot)
// ===================================================================

var firestoreDb = null;
var unsubscribeSnapshot = null;
var syncChannel = null;
var isIncomingSync = false;
var MY_DEVICE_ID = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

function initCloudRealtimeSync() {
  // 1. BroadcastChannel & Storage Event (Jaminan realtime instan multi-tab/window)
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      syncChannel = new BroadcastChannel('smart_grocery_realtime_sync');
      syncChannel.onmessage = function(ev) {
        if (ev && ev.data && ev.data.type === 'SYNC_UPDATE') {
          handleIncomingSyncData(ev.data.payload);
        }
      };
    }
  } catch (err) {}

  // 2. Firebase Cloud Firestore onSnapshot Multi-Device
  try {
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
      var firebaseConfig = {
        apiKey: "AIzaSyCMB3bZynfMU6ymmYkK7tA_lgCp80psjeg",
        authDomain: "smartgrocery-app-c993b.firebaseapp.com",
        projectId: "smartgrocery-app-c993b",
        storageBucket: "smartgrocery-app-c993b.firebasestorage.app",
        messagingSenderId: "693531504296",
        appId: "1:693531504296:web:095356601944c3bc121c9d"
      };

      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      firestoreDb = firebase.firestore();

      // Enable offline persistence agar data tetap aman saat sinyal hilang
      try {
        firestoreDb.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
          if (err.code === 'failed-precondition') {
            console.log('Firestore persistence enabled in active tab');
          } else if (err.code === 'unimplemented') {
            console.log('Browser does not support Firestore offline persistence');
          }
        });
      } catch (pe) {}

      subscribeToSessionSnapshot();
      updateSyncStatusUI(true);
    } else {
      updateSyncStatusUI(false);
    }
  } catch (e) {
    console.warn('Firebase init status:', e);
    updateSyncStatusUI(false);
  }
}

function subscribeToSessionSnapshot() {
  if (!firestoreDb) return;
  if (unsubscribeSnapshot) {
    try {
      unsubscribeSnapshot();
    } catch (e) {}
    unsubscribeSnapshot = null;
  }

  var sessionDocId = state.sessionCode || 'rian-puri-indah';
  var docRef = firestoreDb.collection('smart_grocery_sessions').doc(sessionDocId);

  // SRS F-06B: Listener realtime onSnapshot() pada dokumen sesi belanja aktif
  unsubscribeSnapshot = docRef.onSnapshot(function(docSnap) {
    if (docSnap && docSnap.exists) {
      var remoteData = docSnap.data();
      handleIncomingSyncData(remoteData);
      updateSyncStatusUI(true);
    } else if (docSnap && !docSnap.exists) {
      // Inisialisasi awal sesi belanja di Cloud
      syncToCloud();
    }
  }, function(err) {
    console.warn('Snapshot listener note:', err);
    updateSyncStatusUI(false);
  });
}

function handleIncomingSyncData(remoteData) {
  if (!remoteData || isIncomingSync) return;
  // Abaikan pembaruan yang dikirim oleh perangkat ini sendiri (mencegah loop)
  if (remoteData.senderDeviceId && remoteData.senderDeviceId === MY_DEVICE_ID) return;

  isIncomingSync = true;
  try {
    if (Array.isArray(remoteData.cart)) {
      state.cart = remoteData.cart;
    }
    if (remoteData.budgetCap && Number(remoteData.budgetCap) > 0) {
      state.budgetCap = Number(remoteData.budgetCap);
      var inputBudgetCap = document.getElementById('inputBudgetCap');
      if (inputBudgetCap) inputBudgetCap.value = state.budgetCap;
      var headerBudgetCap = document.getElementById('headerBudgetCap');
      if (headerBudgetCap) headerBudgetCap.textContent = formatRupiah(state.budgetCap);
      var modalSaldoInput = document.getElementById('modalSaldoInput');
      if (modalSaldoInput) modalSaldoInput.value = state.budgetCap;
    }
    if (remoteData.storeLocation) {
      state.storeLocation = remoteData.storeLocation;
      var selectedStoreText = document.getElementById('selectedStoreText');
      if (selectedStoreText) selectedStoreText.textContent = state.storeLocation;
      var storeEl = document.getElementById('selectStoreLocation');
      if (storeEl) storeEl.value = state.storeLocation;
      if (typeof syncStoreModalSelection === 'function') {
        syncStoreModalSelection(state.storeLocation);
      }
    }
    if (remoteData.shoppingDate) {
      state.shoppingDate = remoteData.shoppingDate;
      var dateEl = document.getElementById('inputShoppingDate');
      if (dateEl) dateEl.value = state.shoppingDate;
    }
    if (Array.isArray(remoteData.history)) {
      state.history = remoteData.history;
      if (typeof renderHistoryReceipts === 'function') renderHistoryReceipts();
    }
    if (remoteData.catalog && typeof remoteData.catalog === 'object') {
      state.catalog = Object.assign({}, SEED_CATALOG, remoteData.catalog);
      if (typeof renderCatalog === 'function') renderCatalog();
    }

    persistState();
    renderCart();
    updateBudgetSafetyCap();
    if (typeof updateFormLivePreview === 'function') updateFormLivePreview();
  } finally {
    setTimeout(function() { isIncomingSync = false; }, 80);
  }
}

function syncToCloud() {
  if (isIncomingSync) return;

  var payload = {
    cart: state.cart,
    budgetCap: state.budgetCap,
    storeLocation: state.storeLocation,
    shoppingDate: state.shoppingDate,
    history: state.history,
    catalog: state.catalog,
    updatedAt: Date.now(),
    senderDeviceId: MY_DEVICE_ID
  };

  // Kirim broadcast lokal instan multi-tab
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'SYNC_UPDATE', payload: payload });
    } catch (e) {}
  }

  // Kirim ke Firestore (memicu event onSnapshot di perangkat lain detik itu juga)
  if (firestoreDb) {
    var sessionDocId = state.sessionCode || 'rian-puri-indah';
    firestoreDb.collection('smart_grocery_sessions').doc(sessionDocId).set(payload, { merge: true }).then(function() {
      updateSyncStatusUI(true);
    }).catch(function(e) {
      console.warn('Firestore sync note:', e);
      // Offline fallback: data tetap aman dan tersimpan di LocalStorage
    });
  }
}

function updateSyncStatusUI(isOnline) {
  var dot = document.getElementById('syncStatusDot');
  var txt = document.getElementById('syncStatusText');
  var setTxt = document.getElementById('cloudSettingStatus');

  if (isOnline) {
    if (dot) dot.className = 'sync-dot';
    if (txt) txt.textContent = 'Realtime Cloud: ON';
    if (setTxt) {
      setTxt.textContent = '🟢 onSnapshot Aktif';
      setTxt.style.color = 'var(--primary-light)';
    }
  } else {
    if (dot) dot.className = 'sync-dot';
    if (txt) txt.textContent = 'Realtime Sync: Aktif';
    if (setTxt) {
      setTxt.textContent = '🟢 Sync Lokal / onSnapshot Siap';
      setTxt.style.color = 'var(--primary-light)';
    }
  }
}

window.openCloudModal = function() {
  var modal = document.getElementById('cloudModalOverlay');
  var input = document.getElementById('inputSessionCode');
  if (input) input.value = state.sessionCode;
  if (modal) modal.classList.remove('hidden');
};

window.closeCloudModal = function() {
  var modal = document.getElementById('cloudModalOverlay');
  if (modal) modal.classList.add('hidden');
};

window.handleCloudModalOverlayClick = function(e) {
  if (e && e.target && e.target.id === 'cloudModalOverlay') {
    window.closeCloudModal();
  }
};

window.saveSessionCode = function() {
  var input = document.getElementById('inputSessionCode');
  var code = (input ? input.value : '').trim();
  if (!code) {
    showToast('Kode sesi tidak boleh kosong!', 'warning');
    return;
  }
  state.sessionCode = code;
  persistState();
  var disp = document.getElementById('currentSessionDisplay');
  if (disp) disp.textContent = code;
  subscribeToSessionSnapshot();
  syncToCloud();
  window.closeCloudModal();
  showToast('✓ Terhubung ke sesi: ' + code, 'success');
};

// ===================================================================
// 10. SELESAIKAN BELANJA (ARSIP KE RIWAYAT)
// ===================================================================

window.finishShoppingTrip = function() {
  if (state.cart.length === 0) {
    showToast('Keranjang troli masih kosong!', 'warning');
    return;
  }

  var total = 0;
  for (var i = 0; i < state.cart.length; i++) {
    var it = state.cart[i];
    var d = calculateDiscount(it.currentPrice, it.discountRaw);
    total += d.finalPrice * (it.qty || 1);
  }

  var modal = document.getElementById('confirmModalOverlay');
  var title = document.getElementById('confirmTitle');
  var msg = document.getElementById('confirmMessage');
  var btn = document.getElementById('btnConfirmAction');

  if (title) title.textContent = 'Selesaikan Belanja';
  if (msg) msg.textContent = 'Selesaikan belanja di ' + state.storeLocation + '? Total tagihan: ' + formatRupiah(total) + '. Harga ini otomatis jadi acuan bulan depan.';
  if (btn) {
    btn.style.background = 'var(--primary)';
    btn.textContent = 'Selesai Belanja';
    btn.onclick = function() {
      executeFinishShoppingTrip(total);
    };
  }
  if (modal) modal.classList.remove('hidden');
};

function executeFinishShoppingTrip(total) {
  closeConfirmModal();

  var receipt = {
    id: 'receipt_' + Date.now(),
    date: state.shoppingDate + ' (' + state.storeLocation + ')',
    total: total,
    itemCount: state.cart.length,
    items: JSON.parse(JSON.stringify(state.cart))
  };

  state.history.unshift(receipt);

  for (var j = 0; j < state.cart.length; j++) {
    var cartItem = state.cart[j];
    var k = normalizeKey(cartItem.name);
    state.catalog[k] = {
      name: cartItem.name,
      category: cartItem.category,
      unit: cartItem.unit,
      lastPrice: cartItem.currentPrice,
      currentPrice: cartItem.currentPrice,
      updatedAt: Date.now()
    };
  }

  state.cart = [];
  persistState();
  renderCart();
  renderHistory();
  renderCatalog();
  syncToCloud();

  showToast('🎉 Belanjaan berhasil dicatat ke Riwayat!', 'success');
}

function renderHistory() {
  var container = document.getElementById('historyList');
  if (!container) return;

  if (state.history.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding: 24px 10px;"><h3>Belum Ada Riwayat Belanja</h3><p>Setelah selesai belanja di supermarket, tekan "Selesai Belanja" untuk mengarsipkan struk.</p></div>';
    return;
  }

  var html = '';
  for (var i = 0; i < state.history.length; i++) {
    var rec = state.history[i];
    var preview = [];
    for (var j = 0; j < Math.min(3, rec.items.length); j++) {
      preview.push(rec.items[j].name + ' (' + rec.items[j].qty + ' ' + rec.items[j].unit + ')');
    }
    var previewStr = preview.join(', ');
    if (rec.items.length > 3) previewStr += ' dan ' + (rec.items.length - 3) + ' barang lainnya';

    html += '<div class="receipt-card">';
    html += '  <div class="receipt-header">';
    html += '    <span class="receipt-date">📅 ' + rec.date + '</span>';
    html += '    <span class="receipt-total">' + formatRupiah(rec.total) + '</span>';
    html += '  </div>';
    html += '  <div class="receipt-items-preview">' + escapeHtml(previewStr) + '</div>';
    html += '  <div class="receipt-footer">';
    html += '    <span>' + rec.itemCount + ' Barang Terbeli</span>';
    html += '    <span style="color:var(--primary-light);">✓ Tersimpan di database</span>';
    html += '  </div>';
    html += '</div>';
  }

  container.innerHTML = html;
}

function renderCatalog() {
  var container = document.getElementById('catalogList');
  var searchInput = document.getElementById('searchCatalogInput');
  if (!container) return;

  var query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  var entries = Object.entries(state.catalog);

  var filtered = [];
  for (var i = 0; i < entries.length; i++) {
    var k = entries[i][0];
    var it = entries[i][1];
    if (!query || it.name.toLowerCase().indexOf(query) !== -1 || it.category.toLowerCase().indexOf(query) !== -1) {
      filtered.push(it);
    }
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-muted" style="padding:20px 0;text-align:center;">Tidak ada barang acuan ditemukan.</p>';
    return;
  }

  var html = '';
  for (var j = 0; j < filtered.length; j++) {
    var item = filtered[j];
    html += '<div class="catalog-card">';
    html += '  <div>';
    html += '    <div class="catalog-cat">' + getCategoryEmoji(item.category) + ' ' + item.category + '</div>';
    html += '    <div class="catalog-name">' + escapeHtml(item.name) + '</div>';
    html += '    <div class="catalog-date">Satuan: ' + (item.unit || 'pcs') + '</div>';
    html += '  </div>';
    html += '  <div>';
    html += '    <div class="catalog-price">' + formatRupiah(item.lastPrice) + '</div>';
    html += '    <div class="catalog-date" style="text-align:right;">Acuan Bulan Lalu</div>';
    html += '  </div>';
    html += '</div>';
  }

  container.innerHTML = html;
}

function renderCategoryBreakdown(totalCart) {
  var container = document.getElementById('categoryBreakdownList');
  if (!container) return;

  var catMap = {
    'Bahan Pokok': { label: '🌾 Bahan Pokok', color: '#10b981', total: 0 },
    sembako: { label: '🌾 Sembako', color: '#10b981', total: 0 },
    kebersihan: { label: '🧼 Sabun & Kebersihan', color: '#38bdf8', total: 0 },
    makanan: { label: '🍜 Makanan Instan', color: '#f59e0b', total: 0 },
    segar: { label: '🥚 Sayur & Segar', color: '#84cc16', total: 0 },
    minuman: { label: '🧃 Minuman & Kopi', color: '#a855f7', total: 0 },
    lainnya: { label: '📦 Kebutuhan Lain', color: '#64748b', total: 0 }
  };

  for (var i = 0; i < state.cart.length; i++) {
    var it = state.cart[i];
    var disc = calculateDiscount(it.currentPrice, it.discountRaw);
    var c = it.category || 'lainnya';
    if (catMap[c]) {
      catMap[c].total += disc.finalPrice * (it.qty || 1);
    } else {
      catMap.lainnya.total += disc.finalPrice * (it.qty || 1);
    }
  }

  var list = Object.values(catMap).filter(function(x) { return x.total > 0; });

  if (list.length === 0) {
    container.innerHTML = '<p class="text-small text-muted" style="padding:10px 0;">Belum ada barang di troli untuk dianalisis.</p>';
    return;
  }

  var html = '';
  for (var k = 0; k < list.length; k++) {
    var row = list[k];
    var pct = totalCart > 0 ? Math.round((row.total / totalCart) * 100) : 0;
    html += '<div class="breakdown-row">';
    html += '  <div class="breakdown-info"><span>' + row.label + ' (' + pct + '%)</span><span style="font-family:var(--font-mono);font-weight:700;">' + formatRupiah(row.total) + '</span></div>';
    html += '  <div class="breakdown-track"><div class="breakdown-bar" style="width:' + pct + '%;background-color:' + row.color + ';"></div></div>';
    html += '</div>';
  }

  container.innerHTML = html;
}

// ===================================================================
// 11. TAB NAVIGATION & FILTERS
// ===================================================================

window.switchMainTab = function(targetPaneId, clickedTabEl) {
  var tabs = document.querySelectorAll('.nav-tab');
  var panes = document.querySelectorAll('.tab-pane');
  var categoryFilterBar = document.getElementById('categoryFilterBar');
  var fabAdd = document.getElementById('fabAdd');

  for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
  for (var j = 0; j < panes.length; j++) panes[j].classList.remove('active');

  if (clickedTabEl) clickedTabEl.classList.add('active');
  var pane = document.getElementById(targetPaneId);
  if (pane) pane.classList.add('active');

  if (targetPaneId === 'pane-belanja') {
    if (categoryFilterBar) categoryFilterBar.classList.remove('hidden');
    if (fabAdd) fabAdd.classList.remove('hidden');
  } else {
    if (categoryFilterBar) categoryFilterBar.classList.add('hidden');
    if (fabAdd) fabAdd.classList.add('hidden');

    if (targetPaneId === 'pane-riwayat') {
      renderHistory();
      renderCatalog();
    }
  }
};

window.switchRiwayatSubtab = function(type) {
  var btnReceipts = document.getElementById('subtabReceipts');
  var btnCatalog = document.getElementById('subtabCatalog');
  var paneReceipts = document.getElementById('receiptsSubpane');
  var paneCatalog = document.getElementById('catalogSubpane');

  if (type === 'receipts') {
    if (btnReceipts) btnReceipts.classList.add('active');
    if (btnCatalog) btnCatalog.classList.remove('active');
    if (paneReceipts) paneReceipts.classList.add('active');
    if (paneCatalog) paneCatalog.classList.remove('active');
    renderHistory();
  } else {
    if (btnReceipts) btnReceipts.classList.remove('active');
    if (btnCatalog) btnCatalog.classList.add('active');
    if (paneReceipts) paneReceipts.classList.remove('active');
    if (paneCatalog) paneCatalog.classList.add('active');
    renderCatalog();
  }
};

window.setCategoryFilter = function(cat, chipEl) {
  var chips = document.querySelectorAll('.category-scroll-bar .chip');
  for (var i = 0; i < chips.length; i++) chips[i].classList.remove('active');
  if (chipEl) chipEl.classList.add('active');

  state.activeCategory = cat;
  renderCart();
};

window.handleSearchCart = function(val) {
  state.searchQuery = (val || '').trim();
  var btnClear = document.getElementById('btnClearSearch');
  if (btnClear) {
    if (state.searchQuery) {
      btnClear.classList.remove('hidden');
    } else {
      btnClear.classList.add('hidden');
    }
  }
  renderCart();
};

window.clearSearchCart = function() {
  var input = document.getElementById('searchCartInput');
  var btnClear = document.getElementById('btnClearSearch');
  if (input) input.value = '';
  if (btnClear) btnClear.classList.add('hidden');
  state.searchQuery = '';
  renderCart();
};

window.exportDataJson = function() {
  var payload = {
    cart: state.cart,
    budgetCap: state.budgetCap,
    storeLocation: state.storeLocation,
    shoppingDate: state.shoppingDate,
    history: state.history,
    catalog: state.catalog,
    exportedAt: new Date().toISOString()
  };

  var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  var a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', 'smart_grocery_backup_' + new Date().toISOString().slice(0, 10) + '.json');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Cadangan data berhasil diunduh!', 'success');
};

window.askFactoryReset = function() {
  var modal = document.getElementById('confirmModalOverlay');
  var title = document.getElementById('confirmTitle');
  var msg = document.getElementById('confirmMessage');
  var btn = document.getElementById('btnConfirmAction');

  if (title) title.textContent = 'Reset Data Aplikasi';
  if (msg) msg.textContent = 'Kembalikan seluruh data keranjang, anggaran, dan riwayat ke kondisi awal?';
  if (btn) {
    btn.style.background = '#f43f5e';
    btn.textContent = 'Reset Total';
    btn.onclick = function() {
      executeFactoryReset();
    };
  }
  if (modal) modal.classList.remove('hidden');
};

function executeFactoryReset() {
  closeConfirmModal();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  } catch (e) {}

  state.cart = JSON.parse(JSON.stringify(SEED_CART));
  state.catalog = JSON.parse(JSON.stringify(SEED_CATALOG));
  state.budgetCap = 350000;
  state.storeLocation = 'Lotte Mart Grocery - Puri Indah';
  state.shoppingDate = new Date().toISOString().split('T')[0];
  state.history = [];

  persistState();
  renderCart();
  updateBudgetSafetyCap();
  syncToCloud();
  showToast('Aplikasi telah direset ke data bawaan.', 'info');
}

// ===================================================================
// 12. INITIALIZATION ON LOAD
// ===================================================================

function startApp() {
  initAppData();
  initCloudRealtimeSync();
  renderCart();
  updateBudgetSafetyCap();
  updateFormLivePreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
