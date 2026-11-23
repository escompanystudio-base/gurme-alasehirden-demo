'use strict';

// Ürün sayfası: urun.html?id=<ürün-id>
(() => {
  const CART_KEY = 'gurme-alasehirden-cart-v1';
  const FAV_KEY = 'gurme-alasehirden-favorites-v1';
  const RECENT_KEY = 'ga-recent-v1';
  const MAX_QTY = 99;
  const root = document.getElementById('pdp-root');
  const crumbs = document.getElementById('pdp-crumbs');
  const live = document.getElementById('pdp-live');
  if (!root) return;

  const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const url = (p) => `urun.html?id=${encodeURIComponent(p.id)}`;
  const PATHS = {
    bag: 'M5.2 8h13.6l1.3 13H3.9L5.2 8Z M9 10V6a3 3 0 1 1 6 0v4',
    heart: 'M20.3 9c0 4.1-8.3 9.6-8.3 9.6S3.7 13.1 3.7 9a4.3 4.3 0 0 1 8.3-1.6 4.3 4.3 0 0 1 8.3 1.6Z',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    check: 'm5 12 4 4L19 6',
    truck: 'M2.5 5.5h12v12h-6m6-8h4l3 3.5v4.5h-3m-4 0h-2M2.5 17.5h2M2.5 5.5v12 M8.5 17.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z M18.5 17.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
    shield: 'M12 3.2 19 6v5.4c0 4.4-3 7.9-7 9.4-4-1.5-7-5-7-9.4V6l7-2.8Z m-3.2 8.9 2.2 2.2 4.2-4.4',
    pin: 'M18.5 10c0 4.8-6.5 10-6.5 10s-6.5-5.2-6.5-10a6.5 6.5 0 1 1 13 0Z M14.2 9.8a2.2 2.2 0 1 1-4.4 0 2.2 2.2 0 0 1 4.4 0Z',
    phone: 'M6.7 3.5h3l1.4 4.5-2 1.7a13.8 13.8 0 0 0 5.2 5.2l1.7-2 4.5 1.4v3.1a2.1 2.1 0 0 1-2.3 2.1A16.8 16.8 0 0 1 4.5 5.8a2.1 2.1 0 0 1 2.2-2.3Z',
    share: 'M8.6 10.6 15.4 7M8.6 13.4l6.8 3.6 M9 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z M20 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z M20 18.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
    chevron: 'm6 9 6 6 6-6',
    close: 'm6 6 12 12M18 6 6 18',
    arrow: 'M5 12h14m-5-5 5 5-5 5'
  };
  const ico = (name, cls = '') => `<svg class="pdp-ico ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${PATHS[name]}"/></svg>`;

  /* ---------- storage ---------- */
  const readJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const writeJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const readCart = () => {
    const raw = readJSON(CART_KEY, {});
    const out = {};
    Object.entries(raw && typeof raw === 'object' ? raw : {}).forEach(([id, n]) => {
      const count = Math.min(MAX_QTY, Math.max(0, Math.floor(Number(n) || 0)));
      if (count && PRODUCTS.some((p) => p.id === id)) out[id] = count;
    });
    return out;
  };
  const cartCount = (cart) => Object.values(cart).reduce((a, n) => a + n, 0);
  const cartTotal = (cart) => Object.entries(cart).reduce((a, [id, n]) => a + (PRODUCTS.find((p) => p.id === id)?.price || 0) * n, 0);
  const saveCart = (cart) => { writeJSON(CART_KEY, cart); window.dispatchEvent(new Event('ga-cart-change')); };
  const favs = () => new Set(Array.isArray(readJSON(FAV_KEY, [])) ? readJSON(FAV_KEY, []) : []);

  /* ---------- product ---------- */
  const id = new URLSearchParams(location.search).get('id');
  const product = PRODUCTS.find((p) => p.id === id);
  const catOf = (p) => CATEGORIES.find((c) => p.filters.includes(c.id)) || CATEGORIES[0];

  if (!product) {
    document.title = 'Ürün bulunamadı | Gurme Alaşehirden';
    crumbs.innerHTML = '<li><a href="index.html">Ana sayfa</a></li><li aria-current="page">Ürün bulunamadı</li>';
    root.innerHTML = `<section class="pdp-missing">
      <h1>Bu ürünü bulamadık</h1>
      <p>Ürün kaldırılmış ya da bağlantı hatalı olabilir. Tüm ürünlere göz atabilirsiniz.</p>
      <a class="button button-primary" href="index.html#urunler">Tüm ürünler</a>
    </section>`;
    return;
  }

  const cat = catOf(product);
  const code = (product.image.match(/(\d+)\.webp$/) || [])[1] || '';
  const RECIPES = { leaves: ['hikayeler.html#tarif-yaprak', 'Yaprak sarması nasıl yapılır?'], grapes: ['hikayeler.html#tarif-uzum', 'Kuru üzüm sofrada nasıl kullanılır?'] };
  const recipe = RECIPES[cat.id] || (/tarhana/i.test(product.name) ? ['hikayeler.html#tarif-tarhana', 'Tarhana çorbası nasıl yapılır?'] : null);

  document.title = `${product.name} | Gurme Alaşehirden`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${product.name}, ${product.size}. ${product.description}`.slice(0, 160));

  // structured data
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify([{
    '@context': 'https://schema.org', '@type': 'Product', name: product.name, image: new URL(product.image, location.href).href,
    description: product.description, category: product.category, brand: { '@type': 'Brand', name: 'Gurme Alaşehirden' },
    offers: { '@type': 'Offer', priceCurrency: 'TRY', price: product.price.toFixed(2), url: location.href }
  }, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana sayfa', item: new URL('index.html', location.href).href },
      { '@type': 'ListItem', position: 2, name: product.category, item: new URL(`index.html?kategori=${cat.id}#urunler`, location.href).href },
      { '@type': 'ListItem', position: 3, name: product.name }
    ]
  }]);
  document.head.append(ld);

  // recently viewed
  const recentIds = (Array.isArray(readJSON(RECENT_KEY, [])) ? readJSON(RECENT_KEY, []) : []).filter((x) => x !== product.id && PRODUCTS.some((p) => p.id === x));
  writeJSON(RECENT_KEY, [product.id, ...recentIds].slice(0, 9));

  const related = [
    ...PRODUCTS.filter((p) => p.id !== product.id && p.filters.some((f) => product.filters.includes(f))),
    ...PRODUCTS.filter((p) => p.id !== product.id && !p.filters.some((f) => product.filters.includes(f)))
  ].slice(0, 4);
  const recent = recentIds.slice(0, 4).map((x) => PRODUCTS.find((p) => p.id === x));

  const card = (p, i) => `
    <article class="pdp-card" style="--i:${i}">
      <a class="pdp-card-photo" href="${url(p)}" tabindex="-1" aria-hidden="true"><img src="${esc(p.image)}" width="400" height="400" alt="" loading="lazy"></a>
      <div class="pdp-card-body">
        <p class="pdp-card-cat">${esc(p.category)}</p>
        <h3 class="pdp-card-name"><a href="${url(p)}">${esc(p.name)}</a></h3>
        <p class="pdp-card-size">${esc(p.size)}</p>
        <div class="pdp-card-foot">
          <strong>${money.format(p.price)}</strong>
          <button type="button" class="pdp-card-add" data-quick-add="${esc(p.id)}" aria-label="${esc(p.name)} sepete ekle">${ico('plus')}</button>
        </div>
      </div>
    </article>`;

  crumbs.innerHTML = `
    <li><a href="index.html">Ana sayfa</a></li>
    <li><a href="index.html?kategori=${cat.id}#urunler">${esc(product.category)}</a></li>
    <li aria-current="page">${esc(product.name)}</li>`;

  root.innerHTML = `
    <article class="pdp-top">
      <div class="pdp-gallery">
        <figure class="pdp-media" id="pdp-media">
          <img id="pdp-img" src="${esc(product.image)}" width="900" height="900" alt="${esc(product.alt)}" fetchpriority="high">
        </figure>
      </div>

      <div class="pdp-info">
        <p class="pdp-cat" style="--i:0"><a href="index.html?kategori=${cat.id}#urunler">${esc(product.category)}</a></p>
        <h1 class="pdp-title" style="--i:1">${esc(product.name)}</h1>
        <p class="pdp-size" style="--i:2">${esc(product.size)}${code ? ` <span aria-hidden="true">·</span> Ürün kodu ${esc(code)}` : ''}</p>

        <div class="pdp-price-row" style="--i:3">
          <p class="pdp-price">${money.format(product.price)}</p>
          <p class="pdp-ship">${ico('truck')} Kargo bedava</p>
        </div>

        <p class="pdp-desc" style="--i:4">${esc(product.description)}</p>

        <div class="pdp-buy" id="pdp-buy" style="--i:5">
          <div class="pdp-qty" role="group" aria-label="Adet">
            <button type="button" data-step="-1" aria-label="Adedi azalt">${ico('minus')}</button>
            <input id="pdp-qty" type="number" inputmode="numeric" min="1" max="${MAX_QTY}" value="1" aria-label="Adet">
            <button type="button" data-step="1" aria-label="Adedi artır">${ico('plus')}</button>
          </div>
          <button type="button" class="button button-primary pdp-add" id="pdp-add">
            <span class="pdp-add-label">${ico('bag')} Sepete ekle</span>
            <span class="pdp-add-done" aria-hidden="true">${ico('check', 'pdp-tick')} Sepete eklendi</span>
          </button>
          <button type="button" class="pdp-fav" id="pdp-fav" aria-pressed="false">${ico('heart')}<span class="visually-hidden">Favorilere ekle</span></button>
        </div>
        <a class="button pdp-now" id="pdp-now" href="odeme.html" style="--i:6">Hemen satın al ${ico('arrow')}</a>
        <p class="pdp-incart" id="pdp-incart" hidden></p>

        <ul class="pdp-trust" id="pdp-trust" style="--i:7">
          <li><span class="pdp-tico" aria-hidden="true"><svg class="pdp-truck" viewBox="0 0 40 24" fill="none">
            <g class="truck-speed"><path d="M1 9h5M3 13h4M0 17h4"/></g>
            <g class="truck-body"><path d="M9 4.5h15.5v12H9z"/><path d="M24.5 8.5h5.6l4.4 4.6v3.4h-10z"/><path d="M27 9.8h2.6l2.4 2.6H27z" class="truck-window"/></g>
            <g class="truck-wheel"><circle cx="14" cy="18" r="2.6"/><path d="M14 15.4v5.2M11.4 18h5.2"/></g>
            <g class="truck-wheel"><circle cx="30" cy="18" r="2.6"/><path d="M30 15.4v5.2M27.4 18h5.2"/></g>
            <path class="truck-road" d="M6 22.5h34"/></svg></span><span><strong>Ücretsiz kargo</strong>Türkiye’nin her yerine</span></li>
          <li><span class="pdp-tico" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none">
            <path class="p-shield" d="M24 7c4.2 3.2 9 5.2 14 6v10.4c0 8.6-4.6 14.2-14 19.6-9.4-5.4-14-11-14-19.6V13c5-.8 9.8-2.8 14-6Z"/>
            <path class="p-check" pathLength="1" d="m17.5 24.5 4.5 4.5 9-9.5"/></svg></span><span><strong>Güvenli ödeme</strong>Kart bilgileriniz saklanmaz</span></li>
          <li><span class="pdp-tico" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none">
            <ellipse class="p-ripple" cx="24" cy="39" rx="9" ry="2.6"/><ellipse class="p-ripple p-ripple-2" cx="24" cy="39" rx="9" ry="2.6"/>
            <g class="p-pin"><path d="M35 20c0 9-11 18-11 18S13 29 13 20a11 11 0 1 1 22 0Z"/><circle cx="24" cy="19.6" r="3.8"/></g></svg></span><span><strong>Alaşehir’den</strong>Manisa, Alaşehir</span></li>
          <li><span class="pdp-tico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none">
            <path class="ring-wave ring-wave-1" d="M15 3.6a5.6 5.6 0 0 1 5.4 5.4"/><path class="ring-wave ring-wave-2" d="M15 0.8a8.4 8.4 0 0 1 8.2 8.2"/>
            <path class="ring-handset" d="M6.7 3.5h3l1.4 4.5-2 1.7a13.8 13.8 0 0 0 5.2 5.2l1.7-2 4.5 1.4v3.1a2.1 2.1 0 0 1-2.3 2.1A16.8 16.8 0 0 1 4.5 5.8a2.1 2.1 0 0 1 2.2-2.3Z"/></svg></span><span><strong>Sipariş desteği</strong><a href="tel:+905442950945">0544 295 09 45</a></span></li>
        </ul>

        <button type="button" class="pdp-share" id="pdp-share" style="--i:8">${ico('share')} Ürünü paylaş</button>
      </div>
    </article>

    <section class="pdp-details" aria-label="Ürün detayları">
      <details class="pdp-acc" name="pdp-acc" open>
        <summary><span>Ürün açıklaması</span>${ico('chevron', 'pdp-acc-ico')}</summary>
        <div class="pdp-acc-body">
          <p>${esc(product.description)}</p>
          ${recipe ? `<p><a class="pdp-link" href="${recipe[0]}">${esc(recipe[1])} ${ico('arrow')}</a></p>` : ''}
        </div>
      </details>
      <details class="pdp-acc" name="pdp-acc">
        <summary><span>Ürün bilgileri</span>${ico('chevron', 'pdp-acc-ico')}</summary>
        <div class="pdp-acc-body">
          <dl class="pdp-specs">
            <div><dt>Ürün</dt><dd>${esc(product.name)}</dd></div>
            <div><dt>Kategori</dt><dd>${esc(product.category)}</dd></div>
            <div><dt>Ambalaj</dt><dd>${esc(product.size)}</dd></div>
            <div><dt>Menşe</dt><dd>Alaşehir, Manisa</dd></div>
            ${code ? `<div><dt>Ürün kodu</dt><dd>${esc(code)}</dd></div>` : ''}
          </dl>
        </div>
      </details>
      <details class="pdp-acc" name="pdp-acc">
        <summary><span>Kargo ve iade</span>${ico('chevron', 'pdp-acc-ico')}</summary>
        <div class="pdp-acc-body">
          <p>Türkiye içi kargo ücretsizdir. Siparişiniz kargoya verildiğinde takip bilgisi hesabınızdaki sipariş sayfasında görünür.</p>
          <p>Gıda ürünlerinde ambalaj açıldıktan sonra cayma hakkı kullanılamaz. Ürün size hasarlı, eksik veya hatalı ulaşırsa fotoğrafıyla bize bildirin; yeniden gönderir ya da ücretini iade ederiz.</p>
          <p><a class="pdp-link" href="yasal.html#cayma">Cayma ve iade koşulları ${ico('arrow')}</a></p>
        </div>
      </details>
    </section>

    <section class="pdp-rail" aria-labelledby="pdp-related-title">
      <div class="pdp-rail-head">
        <h2 id="pdp-related-title">Bunlar da hoşunuza gidebilir</h2>
        <a class="pdp-link" href="index.html#urunler">Tüm ürünler ${ico('arrow')}</a>
      </div>
      <div class="pdp-grid">${related.map(card).join('')}</div>
    </section>

    ${recent.length ? `<section class="pdp-rail" aria-labelledby="pdp-recent-title">
      <div class="pdp-rail-head"><h2 id="pdp-recent-title">Son baktıklarınız</h2></div>
      <div class="pdp-grid">${recent.map(card).join('')}</div>
    </section>` : ''}

    <div class="pdp-bar" id="pdp-bar" aria-hidden="true">
      <img src="${esc(product.image)}" width="80" height="80" alt="">
      <div class="pdp-bar-text"><strong>${esc(product.name)}</strong><span>${money.format(product.price)}</span></div>
      <button type="button" class="button button-primary" id="pdp-bar-add" tabindex="-1">${ico('bag')} Sepete ekle</button>
    </div>

    <aside class="pdp-added" id="pdp-added" aria-labelledby="pdp-added-title" hidden>
      <div class="pdp-added-head">
        <p id="pdp-added-title"><span class="pdp-added-check">${ico('check')}</span> Sepetinize eklendi</p>
        <button type="button" class="pdp-added-close" id="pdp-added-close" aria-label="Kapat">${ico('close')}</button>
      </div>
      <div class="pdp-added-item">
        <img src="${esc(product.image)}" width="96" height="96" alt="">
        <div><strong>${esc(product.name)}</strong><span id="pdp-added-qty"></span></div>
      </div>
      <p class="pdp-added-sum"><span id="pdp-added-count"></span><strong id="pdp-added-total"></strong></p>
      <div class="pdp-added-actions">
        <a class="button button-secondary" href="index.html?panel=cart">Sepete git</a>
        <a class="button button-primary" href="odeme.html">Siparişi tamamla</a>
      </div>
    </aside>`;

  const $ = (sel) => root.querySelector(sel);
  const qty = $('#pdp-qty');
  const addBtn = $('#pdp-add');
  const favBtn = $('#pdp-fav');
  const bar = $('#pdp-bar');
  const added = $('#pdp-added');

  /* ---------- quantity ---------- */
  const clampQty = (n) => Math.min(MAX_QTY, Math.max(1, Math.floor(Number(n) || 1)));
  root.addEventListener('click', (e) => {
    const step = e.target.closest('[data-step]');
    if (step) qty.value = clampQty(Number(qty.value) + Number(step.dataset.step));
  });
  qty.addEventListener('change', () => { qty.value = clampQty(qty.value); });

  /* ---------- in-cart note ---------- */
  const syncInCart = () => {
    const n = readCart()[product.id] || 0;
    const note = $('#pdp-incart');
    note.hidden = !n;
    note.textContent = n ? `Sepetinizde bu üründen ${n} adet var.` : '';
  };
  syncInCart();
  addEventListener('storage', (e) => { if (e.key === CART_KEY || e.key === null) syncInCart(); if (e.key === FAV_KEY || e.key === null) syncFav(); });
  addEventListener('pageshow', (e) => { if (e.persisted) { syncInCart(); syncFav(); } });

  /* ---------- fly to cart ---------- */
  const visible = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).visibility !== 'hidden'; };
  function flyToCart(fromImg) {
    if (window.GACart) { window.GACart.fly(fromImg); return; }
    if (reduced() || !fromImg) return;
    const targets = [document.querySelector('.tabbar:not(.is-hidden) .tb-icon [data-tb-count]')?.closest('.tb-icon'), document.querySelector('.site-header .cart-trigger')];
    const target = targets.find(visible);
    if (!target) return;
    const a = fromImg.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const size = Math.min(a.width, 140);
    const ghost = fromImg.cloneNode();
    ghost.removeAttribute('id');
    ghost.className = 'pdp-ghost';
    Object.assign(ghost.style, { left: `${a.left + a.width / 2 - size / 2}px`, top: `${a.top + a.height / 2 - size / 2}px`, width: `${size}px`, height: `${size}px` });
    document.body.append(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    ghost.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(.55)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: 0.2 }
    ], { duration: 820, easing: 'cubic-bezier(.45,0,.25,1)' }).finished.then(() => {
      ghost.remove();
      target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
    });
  }

  /* ---------- add to cart ---------- */
  let hideTimer;
  function showAdded(count) {
    const cart = readCart();
    $('#pdp-added-qty').textContent = `${count} adet eklendi`;
    $('#pdp-added-count').textContent = `Sepette ${cartCount(cart)} ürün`;
    $('#pdp-added-total').textContent = money.format(cartTotal(cart));
    added.hidden = false;
    requestAnimationFrame(() => added.classList.add('is-open'));
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideAdded, 6000);
  }
  function hideAdded() {
    clearTimeout(hideTimer);
    if (added.hidden) return;
    added.classList.remove('is-open');
    setTimeout(() => { if (!added.classList.contains('is-open')) added.hidden = true; }, reduced() ? 0 : 350);
  }
  added.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  added.addEventListener('focusin', () => clearTimeout(hideTimer));
  added.addEventListener('mouseleave', () => { hideTimer = setTimeout(hideAdded, 3000); });
  $('#pdp-added-close').addEventListener('click', hideAdded);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') hideAdded(); });

  function add(target, count, source) {
    const cart = readCart();
    const before = cart[target.id] || 0;
    const next = Math.min(MAX_QTY, before + count);
    const actual = next - before;
    if (!actual) { live.textContent = `Bu üründen en fazla ${MAX_QTY} adet ekleyebilirsiniz.`; return 0; }
    cart[target.id] = next;
    saveCart(cart);
    live.textContent = `${target.name}, ${actual} adet sepete eklendi.`;
    flyToCart(source);
    syncInCart();
    return actual;
  }

  let doneTimer;
  addBtn.addEventListener('click', () => {
    const n = add(product, clampQty(qty.value), $('#pdp-img'));
    if (!n) return;
    addBtn.classList.add('is-done');
    clearTimeout(doneTimer);
    doneTimer = setTimeout(() => addBtn.classList.remove('is-done'), 1800);
    showAdded(n);
  });
  $('#pdp-bar-add').addEventListener('click', () => {
    const n = add(product, clampQty(qty.value), bar.querySelector('img'));
    if (n) showAdded(n);
  });
  $('#pdp-now').addEventListener('click', () => {
    const cart = readCart();
    if (!cart[product.id]) { cart[product.id] = clampQty(qty.value); saveCart(cart); }
  });
  root.addEventListener('click', (e) => {
    const quick = e.target.closest('[data-quick-add]');
    if (!quick) return;
    const p = PRODUCTS.find((x) => x.id === quick.dataset.quickAdd);
    if (!p || !add(p, 1, quick.closest('.pdp-card')?.querySelector('img'))) return;
    quick.classList.add('is-done');
    quick.innerHTML = ico('check');
    setTimeout(() => { quick.classList.remove('is-done'); quick.innerHTML = ico('plus'); }, 1500);
  });

  /* ---------- favorite ---------- */
  function syncFav() {
    const on = favs().has(product.id);
    favBtn.setAttribute('aria-pressed', String(on));
    favBtn.querySelector('.visually-hidden').textContent = on ? 'Favorilerden çıkar' : 'Favorilere ekle';
  }
  syncFav();
  favBtn.addEventListener('click', () => {
    const set = favs();
    const on = !set.has(product.id);
    if (on) set.add(product.id); else set.delete(product.id);
    writeJSON(FAV_KEY, [...set]);
    window.dispatchEvent(new Event('ga-fav-change'));
    syncFav();
    favBtn.classList.remove('pop');
    void favBtn.offsetWidth;
    if (on) favBtn.classList.add('pop');
    live.textContent = on ? `${product.name} favorilerinize eklendi.` : `${product.name} favorilerden çıkarıldı.`;
  });

  /* ---------- share ---------- */
  $('#pdp-share').addEventListener('click', async () => {
    const data = { title: product.name, text: `${product.name} · Gurme Alaşehirden`, url: location.href };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(location.href);
      live.textContent = 'Ürün bağlantısı kopyalandı.';
      const btn = $('#pdp-share');
      btn.classList.add('is-copied');
      btn.lastChild.textContent = ' Bağlantı kopyalandı';
      setTimeout(() => { btn.classList.remove('is-copied'); btn.lastChild.textContent = ' Ürünü paylaş'; }, 1800);
    } catch { /* cancelled */ }
  });

  /* ---------- image zoom (fine pointers) ---------- */
  const media = $('#pdp-media');
  const img = $('#pdp-img');
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    media.addEventListener('pointermove', (e) => {
      const r = media.getBoundingClientRect();
      img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    });
    media.addEventListener('pointerenter', () => media.classList.add('is-zoom'));
    media.addEventListener('pointerleave', () => media.classList.remove('is-zoom'));
  }

  /* ---------- sticky mobile bar ---------- */
  const buy = $('#pdp-buy');
  const footer = document.querySelector('.site-footer');
  let pastBuy = false;
  let atFooter = false;
  const syncBar = () => {
    const on = pastBuy && !atFooter;
    bar.classList.toggle('is-on', on);
    bar.setAttribute('aria-hidden', String(!on));
    $('#pdp-bar-add').tabIndex = on ? 0 : -1;
    document.body.classList.toggle('pdp-bar-on', on);
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { pastBuy = !en.isIntersecting && en.boundingClientRect.top < 0; syncBar(); }).observe(buy);
    if (footer) new IntersectionObserver(([en]) => { atFooter = en.isIntersecting; syncBar(); }).observe(footer);

    // reveal cards on scroll
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    root.querySelectorAll('.pdp-card, .pdp-details, .pdp-rail-head').forEach((el) => io.observe(el));
    const trust = $('#pdp-trust');
    new IntersectionObserver(([en]) => trust.classList.toggle('in-view', en.isIntersecting)).observe(trust);
  } else {
    $('#pdp-trust').classList.add('in-view');
    root.querySelectorAll('.pdp-card, .pdp-details, .pdp-rail-head').forEach((el) => el.classList.add('is-in'));
  }

  document.documentElement.classList.add('pdp-ready');
})();
