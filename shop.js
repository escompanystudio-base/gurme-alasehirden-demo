'use strict';

const $ = (id) => document.getElementById(id);
const productsById = new Map(PRODUCTS.map((product) => [product.id, product]));
const money = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2
});
const storageKey = 'gurme-alasehirden-cart-v1';
const favoritesKey = 'gurme-alasehirden-favorites-v1';
const landingUrl = new URL(location.href);
const requestedPanel = landingUrl.searchParams.get('panel');
const sortOptions = {
  'price-asc': (first, second) => first.price - second.price,
  'price-desc': (first, second) => second.price - first.price,
  name: (first, second) => first.name.localeCompare(second.name, 'tr')
};
const quantityLimit = 99;
const panels = {
  cart: $('cart-dialog'),
  search: $('search-dialog'),
  product: $('product-dialog')
};
const state = {
  cart: readCart(),
  favorites: readFavorites(),
  ...readCatalogLocation(landingUrl),
  product: null,
  activePanel: null,
  opener: null
};
let toastTimer;

function readCatalogLocation(url) {
  const { searchParams } = url;
  const category = searchParams.get('kategori');
  const sort = searchParams.get('sira');
  const favoritesOnly = searchParams.get('panel') === 'favorites';

  return {
    favoritesOnly,
    category: !favoritesOnly && CATEGORIES.some(({ id }) => id === category) ? category : 'all',
    sort: Object.hasOwn(sortOptions, sort) ? sort : 'featured',
    search: favoritesOnly ? '' : (searchParams.get('arama') || '').trim().slice(0, 100)
  };
}

function updateCatalogLocation(hash) {
  const url = new URL(location.href);
  const params = {
    kategori: state.category === 'all' ? '' : state.category,
    sira: state.sort === 'featured' ? '' : state.sort,
    arama: state.search,
    panel: state.favoritesOnly ? 'favorites' : ''
  };

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  if (hash) url.hash = hash;
  if (url.href !== location.href) history.pushState(null, '', url);
}

function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  return value.replace(/[&<>"]/g, (character) => entities[character]);
}

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    return new Map(PRODUCTS.flatMap(({ id }) => {
      const count = stored?.[id];
      return Number.isInteger(count) && count > 0 ? [[id, Math.min(count, quantityLimit)]] : [];
    }));
  } catch {
    return new Map();
  }
}

function readFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(favoritesKey));
    return new Set(Array.isArray(stored) ? stored.filter((id) => productsById.has(id)) : []);
  } catch {
    return new Set();
  }
}

function updateFavoriteButton(button, product) {
  const saved = state.favorites.has(product.id);
  button.setAttribute('aria-pressed', String(saved));
  button.setAttribute('aria-label', `${product.name} ${saved ? 'favorilerden çıkar' : 'favorilere ekle'}`);
}

function toggleFavorite(button) {
  const product = productsById.get(button.dataset.favorite);
  if (state.favorites.has(product.id)) state.favorites.delete(product.id);
  else state.favorites.add(product.id);

  try {
    localStorage.setItem(favoritesKey, JSON.stringify([...state.favorites]));
  } catch {
    // Favorites are still usable for this visit.
  }
  window.dispatchEvent(new Event('ga-fav-change'));

  if (state.favoritesOnly) {
    renderCatalog();
    ($('product-grid').querySelector('[data-favorite]') || $('reset-filters')).focus({ preventScroll: true });
  } else {
    updateFavoriteButton(button, product);
  }
  announce(state.favorites.has(product.id) ? `${product.name} favorilerinize eklendi.` : `${product.name} favorilerden çıkarıldı.`);
}

function saveCart() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(state.cart)));
    window.dispatchEvent(new Event('ga-cart-change'));
  } catch {
    // The cart remains available on this page when browser storage is blocked.
  }
}

function normalize(value) {
  return value.toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ı/g, 'i')
    .trim();
}

function matchingProducts(query) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return PRODUCTS.filter((product) => {
    const searchText = normalize(`${product.name} ${product.category} ${product.description}`);
    return terms.every((term) => searchText.includes(term));
  });
}

function shopierLink(value) {
  if (STORE.demo || !value) return '';

  try {
    const url = new URL(value);
    const shopierHost = url.hostname === 'shopier.com' || url.hostname.endsWith('.shopier.com');
    return url.protocol === 'https:' && shopierHost ? url.href : '';
  } catch {
    return '';
  }
}

function renderCatalog() {
  const products = matchingProducts(state.search).filter((product) =>
    (state.category === 'all' || product.filters.includes(state.category)) &&
    (!state.favoritesOnly || state.favorites.has(product.id))
  );
  if (Object.hasOwn(sortOptions, state.sort)) products.sort(sortOptions[state.sort]);
  $('catalog-sort').value = state.sort;

  const rail = $('category-filters');
  let activeFilter;
  $('show-favorites')?.setAttribute('aria-pressed', String(state.favoritesOnly));
  rail.querySelectorAll('[data-category]').forEach((button) => {
    const active = !state.favoritesOnly && button.dataset.category === state.category;
    button.setAttribute('aria-pressed', String(active));
    if (active) activeFilter = button;
  });
  if (activeFilter && rail.scrollWidth > rail.clientWidth) {
    const current = activeFilter.getBoundingClientRect();
    const bounds = rail.getBoundingClientRect();
    if (current.left < bounds.left) rail.scrollLeft += current.left - bounds.left;
    if (current.right > bounds.right - 14) rail.scrollLeft += current.right - bounds.right + 14;
  }

  $('product-grid').innerHTML = products.map((product, index) => `
    <article class="product-card" style="--card-index:${index}">
      <a class="product-photo" href="urun.html?id=${encodeURIComponent(product.id)}" tabindex="-1" aria-hidden="true">
        <img src="${escapeHtml(product.image)}" alt="" width="627" height="627" loading="lazy">
      </a>
      <button class="product-favorite" type="button" data-favorite="${escapeHtml(product.id)}">
        ${icon('heart')}
      </button>
      <div class="product-body">
        <span class="product-category">${escapeHtml(product.category)}</span>
        <p class="product-size">${escapeHtml(product.size)}</p>
        <h3 class="product-name"><a href="urun.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a></h3>
        <div class="product-bottom">
          <p class="product-price">${money.format(product.price)}</p>
          <button class="product-add" type="button" data-add="${escapeHtml(product.id)}" aria-label="${escapeHtml(product.name)} sepete ekle">
            ${icon('plus')}<span>Sepete ekle</span>
            <span class="pa-done" aria-hidden="true">${icon('check')}<span>Eklendi</span></span>
          </button>
        </div>
      </div>
    </article>`).join('');

  $('product-grid').querySelectorAll('[data-favorite]').forEach((button) => {
    updateFavoriteButton(button, productsById.get(button.dataset.favorite));
  });
  $('empty-results').hidden = products.length > 0;
  $('empty-results-title').textContent = state.favoritesOnly ? 'Henüz favori ürününüz yok.' : 'Aradığınız ürünü bulamadık.';
  $('active-search').hidden = !state.search && !state.favoritesOnly;
  $('active-search-text').textContent = state.favoritesOnly
    ? `Favorilerim · ${products.length} ürün`
    : `“${state.search}” araması · ${products.length} ürün`;
  $('clear-search').textContent = state.favoritesOnly ? 'Tüm ürünlere dön' : 'Aramayı temizle';
  return products.length;
}

function showProduct(product, trigger) {
  const link = shopierLink(product.shopier);
  state.product = product;

  $('detail-title').textContent = product.name;
  $('detail-category').textContent = product.category;
  $('detail-image').src = product.image;
  $('detail-image').alt = product.alt;
  $('detail-description').textContent = product.description;
  $('detail-size').textContent = product.size;
  $('detail-price').textContent = money.format(product.price);
  $('detail-note').hidden = !STORE.demo;
  const handoff = $('detail-handoff');
  if (STORE.checkout === 'demo') {
    handoff.hidden = false;
    handoff.href = 'odeme.html';
    handoff.removeAttribute('target');
    handoff.textContent = 'Hemen satın al';
    handoff.dataset.buyNow = product.id;
  } else {
    handoff.hidden = !link;
    delete handoff.dataset.buyNow;
    if (link) handoff.href = link;
  }

  openPanel(panels.product, trigger);
}

function cartEntries() {
  return [...state.cart].map(([id, count]) => ({ product: productsById.get(id), count }));
}

function renderCart() {
  const entries = cartEntries();
  const count = entries.reduce((total, entry) => total + entry.count, 0);
  const subtotal = entries.reduce((total, { product, count }) => total + product.price * count, 0);
  $('mobile-cart-summary').hidden = count === 0;
  $('mobile-cart-count').textContent = `${count} ürün`;
  $('mobile-cart-total').textContent = money.format(subtotal);
  const cartCount = document.querySelector('.cart-count');
  cartCount.textContent = count;
  cartCount.closest('button').setAttribute('aria-label', `Sepet, ${count} ürün`);
  $('cart-empty').hidden = count > 0;
  $('cart-summary').hidden = count === 0;
  $('cart-items').hidden = count === 0;
  $('subtotal').textContent = money.format(subtotal);
  $('subtotal-label').textContent = STORE.demo ? 'Örnek ara toplam' : 'Ara toplam';
  $('copy-fallback').hidden = true;
  $('copy-feedback').hidden = true;

  $('cart-items').innerHTML = entries.map(({ product, count }) => `
    <article class="cart-item">
      <img src="${escapeHtml(product.image)}" width="627" height="627" alt="">
      <div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.size)}</p>
        <div class="cart-controls">
          <div class="quantity">
            <button type="button" data-adjust="-1" data-id="${escapeHtml(product.id)}"
              aria-label="${escapeHtml(product.name)} adedini azalt" ${count === 1 ? 'disabled' : ''}>${icon('minus')}</button>
            <span>${count}<span class="visually-hidden"> adet</span></span>
            <button type="button" data-adjust="1" data-id="${escapeHtml(product.id)}"
              aria-label="${escapeHtml(product.name)} adedini artır" ${count === quantityLimit ? 'disabled' : ''}>${icon('plus')}</button>
          </div>
          <button class="text-button cart-remove" type="button" data-remove data-id="${escapeHtml(product.id)}"
            aria-label="${escapeHtml(product.name)} ürünü sepetten çıkar">Kaldır</button>
        </div>
      </div>
      <strong>${money.format(product.price * count)}</strong>
    </article>`).join('');

  renderRecommendations(entries);
  if (STORE.checkout === 'demo') {
    const handoff = $('cart-handoff');
    handoff.href = 'odeme.html';
    handoff.removeAttribute('target');
    handoff.textContent = 'Siparişi tamamla';
    $('cart-instructions').textContent = 'Teslimat ve ödeme bilgilerini bir sonraki adımda gireceksiniz. Demo mağaza: gerçek ödeme alınmaz.';
    $('copy-cart').hidden = true;
    return;
  }

  const singleLink = entries.length === 1 ? shopierLink(entries[0].product.shopier) : '';
  const collectionLink = shopierLink(STORE.shopierMultiProduct) || shopierLink(STORE.shopier);
  const checkout = singleLink || collectionLink;
  const handoff = $('cart-handoff');
  $('cart-status').textContent = '';

  handoff.href = checkout || STORE.instagram;
  handoff.textContent = checkout ? 'Shopier’de devam et' : 'Instagram’dan ürünleri sorun';
  $('cart-instructions').textContent = checkout
    ? 'Ürün ve adet seçiminizi Shopier’de tamamlayabilirsiniz.'
    : 'Listenizi kopyalayıp Instagram’dan güncel fiyatı ve sipariş bağlantısını sorabilirsiniz.';
}

function renderRecommendations(entries) {
  const box = $('cart-recs');
  if (!box) return;
  const inCart = new Set(entries.map(({ product }) => product.id));
  const cats = new Set(entries.flatMap(({ product }) => product.filters));
  const pool = PRODUCTS.filter((p) => !inCart.has(p.id));
  const picks = [
    ...pool.filter((p) => p.filters.some((f) => cats.has(f))),
    ...pool.filter((p) => !p.filters.some((f) => cats.has(f)))
  ].slice(0, 8);
  box.hidden = picks.length === 0;
  box.querySelector('.cart-recs-title').textContent = entries.length ? 'Bunları da beğenebilirsiniz' : 'Çok tercih edilenler';
  box.querySelector('.cart-recs-track').innerHTML = picks.map((p, i) => `
    <li class="rec-card" style="--rec-i:${i}">
      <a class="rec-photo" href="urun.html?id=${encodeURIComponent(p.id)}" aria-label="${escapeHtml(p.name)} ürün sayfası">
        <img src="${escapeHtml(p.image)}" width="240" height="240" alt="" loading="lazy">
      </a>
      <p class="rec-name">${escapeHtml(p.name)}</p>
      <p class="rec-meta"><span>${money.format(p.price)}</span>
        <button class="rec-add" type="button" data-add="${escapeHtml(p.id)}" aria-label="${escapeHtml(p.name)} sepete ekle">${icon('plus')}</button>
      </p>
    </li>`).join('');
}

function setQuantity(id, count, trigger) {
  const product = productsById.get(id);
  if (!product) return;

  const nextCount = Math.min(quantityLimit, Math.max(0, count));
  if (nextCount === 0) state.cart.delete(id);
  else state.cart.set(id, nextCount);

  const itemIndex = trigger?.closest('.cart-item')
    ? [...$('cart-items').children].indexOf(trigger.closest('.cart-item'))
    : -1;
  const adjust = trigger?.dataset.adjust;
  saveCart();
  renderCart();

  if (itemIndex >= 0) {
    const items = $('cart-items').children;
    const item = items[itemIndex] || items[itemIndex - 1];
    const nextButton = adjust && item?.querySelector(`[data-adjust="${adjust}"]:enabled`);
    const nextFocus = nextButton || item?.querySelector('[data-remove]') || $('cart-empty').querySelector('a');
    nextFocus.focus({ preventScroll: true });
    $('cart-status').textContent = nextCount > 0
      ? `${product.name}, ${nextCount} adet.`
      : `${product.name} sepetten kaldırıldı.`;
  }
  return nextCount;
}

function announce(message) {
  $('live-status').textContent = message;
}

function notify(message) {
  const toast = $('toast');
  clearTimeout(toastTimer);
  $('toast-text').textContent = message;
  toast.hidden = false;
  announce(message);
  toastTimer = setTimeout(() => {
    if (!toast.contains(document.activeElement)) toast.hidden = true;
  }, 4500);
}

function addToCart(product, button) {
  const count = state.cart.get(product.id) || 0;
  if (count === quantityLimit) {
    if (state.activePanel === panels.product) closePanel();
    notify(`Bu üründen en fazla ${quantityLimit} adet ekleyebilirsiniz.`);
    return;
  }

  setQuantity(product.id, count + 1);
  if (state.activePanel === panels.product) closePanel();
  const badge = document.querySelector('.cart-count');
  badge.classList.remove('bump');
  requestAnimationFrame(() => badge.classList.add('bump'));
  if (button?.classList.contains('product-add')) {
    clearTimeout(button._doneTimer);
    button.classList.remove('is-done');
    void button.offsetWidth;
    button.classList.add('is-added', 'is-done');
    button._doneTimer = setTimeout(() => button.classList.remove('is-added', 'is-done'), 1600);
    button.closest('.product-card')?.classList.add('just-added');
    setTimeout(() => button.closest('.product-card')?.classList.remove('just-added'), 900);
  }
  if (window.GACart) {
    window.GACart.fly(button?.closest('.product-card')?.querySelector('.product-photo img'));
    window.GACart.added(product, 1);
    announce(`${product.name} sepete eklendi.`);
  } else {
    notify(`${product.name} sepete eklendi.`);
  }
}

function openPanel(panel, trigger) {
  const opener = state.activePanel ? state.opener : trigger;
  if (state.activePanel) closePanel(false);

  state.activePanel = panel;
  state.opener = $('toast').contains(opener) ? document.querySelector('.cart-trigger') : opener;
  $('toast').hidden = true;

  if (panel === panels.search) {
    $('search-input').value = state.search;
    renderSearchPreview();
  }
  panel.showModal();
}

function closePanel(restoreFocus = true) {
  if (!state.activePanel) return;
  const target = state.activePanel === panels.search ? $('header-search-input') : document.querySelector('.cart-trigger');
  const opener = state.opener?.getClientRects().length ? state.opener : target;
  state.activePanel.close();
  state.activePanel = null;
  state.opener = null;

  if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
}

function goToSection(id) {
  const section = $(id);
  section.setAttribute('tabindex', '-1');
  section.focus({ preventScroll: true });
  section.scrollIntoView();
}

function renderSearchPreview() {
  const query = $('search-input').value;
  const results = query.trim() ? matchingProducts(query) : [];
  $('search-preview').innerHTML = results.map((product) => `
    <a class="search-result" href="urun.html?id=${encodeURIComponent(product.id)}">
      <img src="${escapeHtml(product.image)}" width="96" height="96" alt="" loading="lazy">
      <span>${escapeHtml(product.name)}<small>${escapeHtml(product.category)} · ${escapeHtml(product.size)}</small></span>
      <strong>${money.format(product.price)}</strong>
    </a>`).join('');

  if (query.trim() && !results.length) {
    const message = document.createElement('p');
    message.textContent = 'Bu aramaya uyan ürün yok.';
    $('search-preview').append(message);
  }

  $('search-status').textContent = query.trim() ? `${results.length} ürün bulundu.` : '';
}

async function copyCart() {
  const items = cartEntries().map(({ product, count }) => `• ${product.name} (${product.size}), ${count} adet`);
  const heading = STORE.demo
    ? 'Merhaba, bu ürünlerin güncel fiyatını ve stok durumunu öğrenebilir miyim?'
    : 'Merhaba, bu ürünler hakkında bilgi almak istiyorum.';
  const message = [heading, '', ...items].join('\n');
  const status = $('copy-feedback');
  status.hidden = false;

  try {
    await navigator.clipboard.writeText(message);
    status.textContent = 'Liste kopyalandı.';
  } catch {
    const field = $('copy-fallback');
    field.value = message;
    field.hidden = false;
    field.select();
    status.textContent = 'Seçili listeyi kopyalayıp Instagram mesajınıza yapıştırabilirsiniz.';
  }
}

function resetCatalog() {
  state.favoritesOnly = false;
  state.search = '';
  state.category = 'all';
  $('header-search-input').value = '';
  updateCatalogLocation();
  const count = renderCatalog();
  document.querySelector('[data-category="all"]').focus();
  announce(`${count} ürün gösteriliyor.`);
}

$('category-filters').innerHTML = CATEGORIES.map(({ id, label, icon: glyph }) =>
  `<button class="filter" type="button" data-category="${id}" aria-pressed="false">${icon(glyph)}<span>${label}</span></button>`
).join('');

if (STORE.checkout === 'demo') {
  $('faq-order').textContent = 'Ürünleri sepete ekleyin, ardından “Siparişi tamamla” ile teslimat ve ödeme bilgilerinizi girin. Hesap açarak siparişlerinizi takip edebilirsiniz. Bu bir demo mağazadır; gerçek ödeme alınmaz.';
} else if (!STORE.demo) {
  const storeLink = shopierLink(STORE.shopier);
  if (storeLink) {
    const link = document.createElement('a');
    link.className = 'text-link';
    link.href = storeLink;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Shopier mağazasını açın';
    $('faq-order').replaceChildren('Ürünlerinizi seçtikten sonra siparişinizi Shopier’de tamamlayabilirsiniz. ', link);
  }
}

$('catalog-note').hidden = !STORE.demo;
$('header-search-input').value = state.search;
renderCatalog();
renderCart();

document.addEventListener('click', (event) => {
  const buyNow = event.target.closest('[data-buy-now]');
  if (buyNow) {
    const product = productsById.get(buyNow.dataset.buyNow);
    if (product && !state.cart.has(product.id)) setQuantity(product.id, 1);
    return;
  }
  const open = event.target.closest('[data-open]');
  const close = event.target.closest('[data-close]');
  const detail = event.target.closest('[data-product]');
  const add = event.target.closest('[data-add]');
  const filter = event.target.closest('[data-category]');
  const showcaseLink = event.target.closest('[data-show-category]');
  const favorite = event.target.closest('[data-favorite]');
  const favorites = event.target.closest('#show-favorites');
  const adjust = event.target.closest('[data-adjust]');
  const remove = event.target.closest('[data-remove]');

  if (open) {
    openPanel(panels[open.dataset.open], open);
  } else if (close) {
    if (close instanceof HTMLAnchorElement) {
      event.preventDefault();
      closePanel(false);
      history.pushState(null, '', close.hash);
      goToSection(close.hash.slice(1));
    } else {
      closePanel();
    }
  } else if (detail) {
    showProduct(productsById.get(detail.dataset.product), detail);
  } else if (add && add.closest('#cart-dialog')) {
    const product = productsById.get(add.dataset.add);
    setQuantity(product.id, (state.cart.get(product.id) || 0) + 1);
    $('cart-status').textContent = `${product.name} sepete eklendi.`;
    add.classList.add('is-done');
    const items = $('cart-items').querySelectorAll('.cart-item');
    const next = $('cart-recs').querySelector('.rec-add') || items[items.length - 1]?.querySelector('button');
    next?.focus({ preventScroll: true });
    items[items.length - 1]?.classList.add('is-new');
  } else if (add) {
    addToCart(productsById.get(add.dataset.add), add);
  } else if (favorite) {
    toggleFavorite(favorite);
  } else if (favorites) {
    state.favoritesOnly = !state.favoritesOnly;
    state.search = '';
    state.category = 'all';
    $('header-search-input').value = '';
    updateCatalogLocation('#urunler');
    announce(`${renderCatalog()} ürün gösteriliyor.`);
    goToSection('urunler');
  } else if (showcaseLink) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    state.favoritesOnly = false;
    state.search = '';
    state.category = showcaseLink.dataset.showCategory;
    $('header-search-input').value = '';
    updateCatalogLocation('#urunler');
    announce(`${renderCatalog()} ürün gösteriliyor.`);
    goToSection('urunler');
  } else if (filter) {
    state.favoritesOnly = false;
    state.category = filter.dataset.category;
    updateCatalogLocation();
    announce(`${renderCatalog()} ürün gösteriliyor.`);
  } else if (adjust) {
    setQuantity(adjust.dataset.id, state.cart.get(adjust.dataset.id) + Number(adjust.dataset.adjust), adjust);
  } else if (remove) {
    setQuantity(remove.dataset.id, 0, remove);
  }
});

Object.values(panels).forEach((panel) => {
  panel.addEventListener('cancel', (event) => {
    event.preventDefault();
    closePanel();
  });
  panel.addEventListener('click', (event) => {
    if (event.target !== panel) return;
    const { left, right, top, bottom } = panel.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
      closePanel();
    }
  });
});

$('search-input').addEventListener('input', renderSearchPreview);
function searchCatalog(query) {
  state.search = query.trim().slice(0, 100);
  state.category = 'all';
  state.favoritesOnly = false;
  $('header-search-input').value = state.search;
  updateCatalogLocation('#urunler');
  const count = renderCatalog();
  goToSection('urunler');
  announce(`${count} ürün bulundu.`);
}

$('search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  closePanel(false);
  searchCatalog($('search-input').value);
});

$('header-search').addEventListener('submit', (event) => {
  event.preventDefault();
  searchCatalog($('header-search-input').value);
});

$('catalog-sort').addEventListener('change', (event) => {
  state.sort = event.target.value;
  updateCatalogLocation();
  renderCatalog();
});

$('clear-search').addEventListener('click', resetCatalog);
$('reset-filters').addEventListener('click', resetCatalog);
$('copy-cart').addEventListener('click', copyCart);
$('detail-add').addEventListener('click', (event) => addToCart(state.product, event.currentTarget));

if (requestedPanel === 'cart' || requestedPanel === 'search') {
  landingUrl.searchParams.delete('panel');
  history.replaceState(null, '', landingUrl);
  openPanel(panels[requestedPanel], document.querySelector(`[data-open="${requestedPanel}"]`));
}

window.addEventListener('popstate', () => {
  Object.assign(state, readCatalogLocation(new URL(location.href)));
  $('header-search-input').value = state.search;
  renderCatalog();
});

window.addEventListener('storage', (event) => {
  if (event.key === storageKey || event.key === null) {
    state.cart = readCart();
    renderCart();
  }
  if (event.key === favoritesKey || event.key === null) {
    state.favorites = readFavorites();
    renderCatalog();
  }
});

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      entry.target.classList.add('in-view');
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  state.cart = readCart();
  state.favorites = readFavorites();
  renderCart();
  renderCatalog();
});
