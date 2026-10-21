/**
 * SMART GROCERY & BUDGET SAFETY TRACKER
 * Full Interactive JavaScript Logic (Works 100% directly via file:// and http://)
 * Requirements: F-01, F-02, F-03, F-04, F-05, F-06
 */

// ===================================================================
// 1. STATE & STORAGE KEYS (Safe for file:// and Private Browsing)
// ===================================================================

var STORAGE_KEYS = {
  CART: 'smart_grocery_cart_v2',
  BUDGET: 'smart_grocery_budget_v2',
  HISTORY: 'smart_grocery_history_v2',
  CATALOG: 'smart_grocery_catalog_v2'
};

// Seed Realistic Grocery Data for Indonesian College Student
var SEED_CATALOG = {
  'beras ramos 5kg': { name: 'Beras Ramos Super 5kg', category: 'sembako', unit: 'kg', lastPrice: 70000 },
  'minyak goreng 2l': { name: 'Minyak Goreng Tropical 2L', category: 'sembako', unit: 'liter', lastPrice: 38000 },
  'indomie goreng 1 dus': { name: 'Indomie Goreng Spesial 1 Dus', category: 'makanan', unit: 'pack', lastPrice: 118000 },
  'telur ayam 1kg': { name: 'Telur Ayam Negeri 1kg', category: 'segar', unit: 'kg', lastPrice: 26000 },
  'sabun cair dettol 410ml': { name: 'Sabun Mandi Cair Dettol 410ml', category: 'kebersihan', unit: 'pack', lastPrice: 32000 },
  'deterjen attack 800g': { name: 'Deterjen Attack Plus Softener 800g', category: 'kebersihan', unit: 'pack', lastPrice: 24500 }
};

var SEED_CART = [
  {
    id: 'item_seed_1',
    name: 'Beras Ramos Super 5kg',
    category: 'sembako',
    unit: 'kg',
    qty: 1,
    currentPrice: 74000,
    lastPrice: 70000,
    discountRaw: '',
    checked: true,
    addedAt: Date.now()
  },
  {
    id: 'item_seed_2',
    name: 'Minyak Goreng Tropical 2L',
    category: 'sembako',
    unit: 'liter',
    qty: 1,
    currentPrice: 34000,
    lastPrice: 38000,
    discountRaw: '4000',
    checked: true,
    addedAt: Date.now() + 100
  },
  {
    id: 'item_seed_3',
    name: 'Sabun Mandi Cair Dettol 410ml',
    category: 'kebersihan',
    unit: 'pack',
    qty: 2,
    currentPrice: 35000,
    lastPrice: 32000,
    discountRaw: '50%+20%',
    checked: false,
    addedAt: Date.now() + 200
  },
  {
    id: 'item_seed_4',
    name: 'Indomie Goreng Spesial 1 Dus',
    category: 'makanan',
    unit: 'pack',
    qty: 1,
    currentPrice: 118000,
    lastPrice: 118000,
    discountRaw: '',
    checked: false,
    addedAt: Date.now() + 300
  }
];

var state = {
  cart: [],
  budgetCap: 750000,
  history: [],
  catalog: {},
  activeCategory: 'all',
  searchQuery: ''
};

// Safe LocalStorage helpers (never throws exception in file:// mode)
function safeGetStorage(key, defaultVal) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      var item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
    }
  } catch (e) {
    console.warn('LocalStorage read error (using memory state):', e);
  }
  return defaultVal;
}

function safeSetStorage(key, val) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(val));
    }
  } catch (e) {
    console.warn('LocalStorage save error (using memory state):', e);
  }
}

// Load initial state
function initAppData() {
  state.cart = safeGetStorage(STORAGE_KEYS.CART, SEED_CART);
  state.budgetCap = Number(safeGetStorage(STORAGE_KEYS.BUDGET, 750000)) || 750000;
  state.history = safeGetStorage(STORAGE_KEYS.HISTORY, []);
  state.catalog = safeGetStorage(STORAGE_KEYS.CATALOG, SEED_CATALOG);
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
  }, 3000);
}

// ===================================================================
// 3. F-03: KALKULATOR DISKON BERTINGKAT (RUMUS MATEMATIS BENAR)
// Harga = P0 * (1 - d1) * (1 - d2)...
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

  // Case A: Diskon Bertingkat (misal: "50%+20%" atau "30%+10%")
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

  // Case B: Diskon Persentase Tunggal (misal: "25%" atau "25")
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

  // Case C: Potongan Nominal Rp (misal: "5000" atau "-5000")
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
// 4. F-04: KOMPARATOR HARGA REALTIME VS BULAN LALU
// Panah Merah Naik (↑), Panah Hijau Turun (↓), atau Setara (=)
// ===================================================================

function comparePrice(currentPrice, lastPrice) {
  var current = Number(currentPrice) || 0;
  var last = Number(lastPrice) || 0;

  if (last <= 0 || current <= 0) {
    return {
      type: 'equal',
      symbol: '=',
      text: 'Harga stabil / baru',
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
      text: '= Sama dengan bulan lalu',
      diff: 0,
      percent: 0
    };
  }
}

// ===================================================================
// 5. F-05: PENGENDALI ANGGARAN & SAFETY CAP GAUGE
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
  var topBudgetInput = document.getElementById('topBudgetInput');
  var inputBudgetCap = document.getElementById('inputBudgetCap');

  if (totalCartEl) totalCartEl.textContent = formatRupiah(totalCart);
  if (remainingEl) {
    remainingEl.textContent = formatRupiah(remaining);
    remainingEl.style.color = remaining < 0 ? '#fb7185' : 'var(--primary-light)';
  }
  if (totalSavingsEl) totalSavingsEl.textContent = formatRupiah(totalSavings);

  var headerBudgetCap = document.getElementById('headerBudgetCap');
  if (headerBudgetCap) headerBudgetCap.textContent = formatRupiah(budget);

  // Sync inputs
  if (topBudgetInput && document.activeElement !== topBudgetInput) {
    topBudgetInput.value = budget;
  }
  if (inputBudgetCap && document.activeElement !== inputBudgetCap) {
    inputBudgetCap.value = budget;
  }

  // Gauge bar fill width
  var barWidth = Math.min(100, Math.max(0, percent));
  if (gaugeFillEl) gaugeFillEl.style.width = barWidth + '%';
  if (gaugeTextEl) gaugeTextEl.textContent = percent + '% Terpakai';

  // Three safety stages:
  // Green: < 70%
  // Yellow/Amber: 70% - 84%
  // Danger/Red Pulse: >= 85%
  if (budgetCardEl) {
    budgetCardEl.classList.remove('state-safe', 'state-warning', 'state-danger');

    if (percent >= 100) {
      budgetCardEl.classList.add('state-danger');
      if (statusTextEl) {
        statusTextEl.textContent = '⚠️ OVER BUDGET!';
        statusTextEl.style.color = '#fb7185';
      }
      if (dangerBannerEl) {
        dangerBannerEl.classList.remove('hidden');
        if (dangerBannerText) {
          dangerBannerText.textContent = 'BAHAYA: Kamu melebihi uang saku sebesar ' + formatRupiah(Math.abs(remaining)) + '! Keluarkan barang non-esensial.';
        }
      }
    } else if (percent >= 85) {
      budgetCardEl.classList.add('state-danger');
      if (statusTextEl) {
        statusTextEl.textContent = '🚨 Mendekati Limit (' + percent + '%)';
        statusTextEl.style.color = '#fb7185';
      }
      if (dangerBannerEl) {
        dangerBannerEl.classList.remove('hidden');
        if (dangerBannerText) {
          dangerBannerText.textContent = 'Peringatan: Belanjaan sudah ' + percent + '% dari batas dompet! Hati-hati mengambil barang tambahan.';
        }
      }
    } else if (percent >= 70) {
      budgetCardEl.classList.add('state-warning');
      if (statusTextEl) {
        statusTextEl.textContent = '🟡 Waspada (' + percent + '%)';
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

  // Update badge count
  var navBadge = document.getElementById('navBadgeCount');
  if (navBadge) navBadge.textContent = state.cart.length;

  renderCategoryBreakdown(totalCart);
}

// ===================================================================
// MODAL ATUR SALDO UANG SAKU (POPUP RAMAH JEMPOL)
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
    showToast('Nominal saldo harus lebih besar dari 0!', 'warning');
    return;
  }

  state.budgetCap = val;
  safeSetStorage(STORAGE_KEYS.BUDGET, val);
  updateBudgetSafetyCap();
  window.closeSaldoModal();
  showToast('✓ Saldo uang saku berhasil disetel: ' + formatRupiah(val), 'success');
};

// Live Budget Input Listener
window.onBudgetChange = function(val) {
  var num = parseFloat(val);
  if (isNaN(num) || num < 0) num = 0;
  state.budgetCap = num;
  safeSetStorage(STORAGE_KEYS.BUDGET, num);
  updateBudgetSafetyCap();
};

window.applyBudgetPreset = function(val) {
  window.onBudgetChange(val);
  showToast('Batas anggaran disetel: ' + formatRupiah(val), 'success');
};

// ===================================================================
// 6. RENDER DAFTAR KERANJANG (F-01, F-02, F-03, F-04)
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

  // Filter items
  var filtered = [];
  for (var j = 0; j < state.cart.length; j++) {
    var item = state.cart[j];
    var matchCat = state.activeCategory === 'all' || item.category === state.activeCategory;
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
    html += '    <button type="button" class="btn-card-icon delete" onclick="deleteItem(\'' + it.id + '\')" title="Hapus Barang">';
    html += '      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>';
    html += '    </button>';
    html += '  </div>';
    html += '</div>';

    // Badges Row: F-03 & F-04
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
      html += '  <span class="discount-badge" title="Diskon">';
      html += '    🏷️ ' + (discount.isStacked ? 'Bertingkat: ' : '') + discount.label;
      html += '  </span>';
    }
    html += '</div>';

    // Bottom Row: F-02 Thumb Steppers (+ / -) & Subtotal
    html += '<div class="card-bottom-row">';
    html += '  <div class="item-stepper">';
    html += '    <button type="button" class="stepper-btn" onclick="changeItemQty(\'' + it.id + '\', -1)" aria-label="Kurang">';
    html += '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/></svg>';
    html += '    </button>';
    html += '    <span class="stepper-count">' + (it.qty || 1) + ' ' + (it.unit || 'pcs') + '</span>';
    html += '    <button type="button" class="stepper-btn" onclick="changeItemQty(\'' + it.id + '\', 1)" aria-label="Tambah">';
    html += '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
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
  if (cat === 'sembako') return '🌾';
  if (cat === 'kebersihan') return '🧼';
  if (cat === 'makanan') return '🍜';
  if (cat === 'segar') return '🥚';
  if (cat === 'minuman') return '🧃';
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
// 7. F-02: STEPPERS & ITEM ACTIONS
// ===================================================================

window.changeItemQty = function(id, delta) {
  for (var i = 0; i < state.cart.length; i++) {
    if (state.cart[i].id === id) {
      var newQty = (state.cart[i].qty || 1) + delta;
      if (newQty <= 0) {
        window.deleteItem(id);
        return;
      }
      state.cart[i].qty = newQty;
      break;
    }
  }
  safeSetStorage(STORAGE_KEYS.CART, state.cart);
  renderCart();
};

window.toggleItemChecked = function(id, isChecked) {
  for (var i = 0; i < state.cart.length; i++) {
    if (state.cart[i].id === id) {
      state.cart[i].checked = isChecked;
      break;
    }
  }
  safeSetStorage(STORAGE_KEYS.CART, state.cart);
  renderCart();
};

window.deleteItem = function(id) {
  var target = null;
  var targetIdx = -1;
  for (var i = 0; i < state.cart.length; i++) {
    if (state.cart[i].id === id) {
      target = state.cart[i];
      targetIdx = i;
      break;
    }
  }
  if (targetIdx !== -1) {
    if (confirm('Keluarkan "' + target.name + '" dari keranjang belanja?')) {
      state.cart.splice(targetIdx, 1);
      safeSetStorage(STORAGE_KEYS.CART, state.cart);
      renderCart();
      showToast('"' + target.name + '" dikeluarkan.', 'info');
    }
  }
};

window.clearCart = function() {
  if (state.cart.length === 0) return;
  if (confirm('Kosongkan semua barang dari keranjang belanja?')) {
    state.cart = [];
    safeSetStorage(STORAGE_KEYS.CART, state.cart);
    renderCart();
    showToast('Keranjang troli telah dikosongkan.', 'info');
  }
};

// ===================================================================
// 8. F-01 & F-03 & F-04: FORM TAMBAH BARANG LOGIC
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

window.updateFormLivePreview = function() {
  var currPriceEl = document.getElementById('inputCurrentPrice');
  var lastPriceEl = document.getElementById('inputLastPrice');
  var qtyEl = document.getElementById('inputItemQty');
  var discountEl = document.getElementById('inputDiscount');

  var currPrice = parseFloat(currPriceEl ? currPriceEl.value : 0) || 0;
  var lastPrice = parseFloat(lastPriceEl ? lastPriceEl.value : 0) || 0;
  var qty = parseInt(qtyEl ? qtyEl.value : 1) || 1;
  var discStr = discountEl ? discountEl.value.trim() : '';

  // F-03 Math calculation
  var discountResult = calculateDiscount(currPrice, discStr);
  var lineTotal = discountResult.finalPrice * qty;

  var previewUnit = document.getElementById('previewUnitFinal');
  var previewSubtotal = document.getElementById('previewSubtotalFinal');

  if (previewUnit) previewUnit.textContent = formatRupiah(discountResult.finalPrice);
  if (previewSubtotal) previewSubtotal.textContent = formatRupiah(lineTotal);

  // F-04 Comparison Live Preview
  var compIndicator = document.getElementById('comparisonIndicator');
  var compSymbol = document.getElementById('compIconSymbol');
  var compText = document.getElementById('comparisonText');

  if (compIndicator && compText) {
    var comp = comparePrice(currPrice, lastPrice);
    compIndicator.className = 'comparison-indicator ' + comp.type;
    if (compSymbol) compSymbol.textContent = comp.symbol;
    compText.textContent = lastPrice > 0 ? comp.text : 'Ketik harga sekarang & bulan lalu untuk melihat tren perbandingan';
  }
};

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
  if (catEl) catEl.value = item.category || 'sembako';
  if (unitEl) {
    unitEl.value = item.unit || 'pcs';
    var formUnitLabel = document.getElementById('formUnitLabel');
    if (formUnitLabel) formUnitLabel.textContent = item.unit || 'pcs';
  }
  if (lastPriceEl) lastPriceEl.value = item.lastPrice || '';
  if (currPriceEl && !currPriceEl.value) currPriceEl.value = item.lastPrice || '';

  if (box) box.classList.add('hidden');
  updateFormLivePreview();
  if (currPriceEl) currPriceEl.focus();
};

// Form Submission: Tambah Barang
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
  var category = catEl ? catEl.value : 'sembako';
  var unit = unitEl ? unitEl.value : 'pcs';
  var qty = parseInt(qtyEl ? qtyEl.value : 1) || 1;
  var currentPrice = parseFloat(currPriceEl ? currPriceEl.value : 0) || 0;
  var lastPrice = parseFloat(lastPriceEl ? lastPriceEl.value : 0) || 0;
  var discountRaw = discEl ? discEl.value.trim() : '';

  if (!name || currentPrice <= 0) {
    showToast('Harap masukkan nama produk dan harga satuan!', 'danger');
    return false;
  }

  var newItem = {
    id: 'item_' + Date.now(),
    name: name,
    category: category,
    unit: unit,
    qty: qty,
    currentPrice: currentPrice,
    lastPrice: lastPrice,
    discountRaw: discountRaw,
    checked: false,
    addedAt: Date.now()
  };

  state.cart.unshift(newItem);

  // Update catalog memory
  var catKey = normalizeKey(name);
  state.catalog[catKey] = {
    name: name,
    category: category,
    unit: unit,
    lastPrice: lastPrice > 0 ? lastPrice : currentPrice,
    updatedAt: Date.now()
  };

  safeSetStorage(STORAGE_KEYS.CART, state.cart);
  safeSetStorage(STORAGE_KEYS.CATALOG, state.catalog);

  renderCart();
  showToast('"' + name + '" ditambahkan ke keranjang!', 'success');

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

// ===================================================================
// 9. F-06: SELESAIKAN BELANJA (SIMPAN KE RIWAYAT)
// ===================================================================

window.finishShoppingTrip = function() {
  if (state.cart.length === 0) {
    showToast('Troli belanjaan masih kosong!', 'warning');
    return;
  }

  var total = 0;
  for (var i = 0; i < state.cart.length; i++) {
    var it = state.cart[i];
    var d = calculateDiscount(it.currentPrice, it.discountRaw);
    total += d.finalPrice * (it.qty || 1);
  }

  var msg = 'Selesaikan belanja bulanan ini?\n\nTotal Belanja: ' + formatRupiah(total) + '\n\nHarga saat ini otomatis akan dijadikan acuan "Harga Bulan Lalu" untuk sesi belanja berikutnya!';
  
  if (confirm(msg)) {
    // 1. Create Receipt Archive
    var receipt = {
      id: 'receipt_' + Date.now(),
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      total: total,
      itemCount: state.cart.length,
      items: JSON.parse(JSON.stringify(state.cart))
    };

    state.history.unshift(receipt);

    // 2. Update catalog reference prices
    for (var j = 0; j < state.cart.length; j++) {
      var cartItem = state.cart[j];
      var k = normalizeKey(cartItem.name);
      state.catalog[k] = {
        name: cartItem.name,
        category: cartItem.category,
        unit: cartItem.unit,
        lastPrice: cartItem.currentPrice, // Price becomes reference for next month
        updatedAt: Date.now()
      };
    }

    // 3. Clear Active Cart
    state.cart = [];

    safeSetStorage(STORAGE_KEYS.HISTORY, state.history);
    safeSetStorage(STORAGE_KEYS.CATALOG, state.catalog);
    safeSetStorage(STORAGE_KEYS.CART, state.cart);

    renderCart();
    renderHistory();
    renderCatalog();

    showToast('🎉 Belanjaan berhasil dicatat ke Riwayat! Acuan harga bulan lalu diperbarui.', 'success');
  }
};

function renderHistory() {
  var container = document.getElementById('historyList');
  if (!container) return;

  if (state.history.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding: 30px 10px;"><h3>Belum Ada Riwayat Belanja</h3><p>Setelah selesai berbelanja di supermarket, tekan "Selesai Belanja" untuk mengarsipkan struk.</p></div>';
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

// Category Distribution Chart in Anggaran Tab
function renderCategoryBreakdown(totalCart) {
  var container = document.getElementById('categoryBreakdownList');
  if (!container) return;

  var catMap = {
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
// 10. TAB NAVIGATION & FILTERS
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

window.factoryReset = function() {
  if (confirm('PERINGATAN: Apakah kamu yakin ingin mereset semua data belanjaan, anggaran, dan riwayat ke kondisi awal?')) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {}

    state.cart = JSON.parse(JSON.stringify(SEED_CART));
    state.catalog = JSON.parse(JSON.stringify(SEED_CATALOG));
    state.budgetCap = 750000;
    state.history = [];

    safeSetStorage(STORAGE_KEYS.CART, state.cart);
    safeSetStorage(STORAGE_KEYS.BUDGET, state.budgetCap);
    safeSetStorage(STORAGE_KEYS.CATALOG, state.catalog);
    safeSetStorage(STORAGE_KEYS.HISTORY, state.history);

    renderCart();
    updateBudgetSafetyCap();
    showToast('Aplikasi telah direset ke data bawaan.', 'info');
  }
};

// ===================================================================
// 11. INITIALIZATION ON SCRIPT LOAD & DOM READY
// ===================================================================

function startApp() {
  initAppData();
  renderCart();
  updateBudgetSafetyCap();
  updateFormLivePreview();
}

// Execute immediately if DOM already loaded or on event
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
