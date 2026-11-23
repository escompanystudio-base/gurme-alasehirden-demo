'use strict';

/* Mobile: a slim tab bar fixed to the bottom of the screen, and a compact
   menu panel that grows out of it. Shown below 791px only (see motion.css). */
{
  const onHome = Boolean(document.getElementById('urunler'));
  const onStories = /hikayeler(\.html)?$/.test(location.pathname);
  const home = onHome ? './' : 'index.html';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const headerTrigger = document.querySelector('[data-mobile-menu]');

  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
  const homeIcon = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z"/></svg>';

  const tab = (key, label, svg, attrs) => `
    <${attrs.href ? 'a' : 'button'} class="tb-item" data-tab="${key}" ${attrs.href ? `href="${attrs.href}"` : 'type="button"'} ${attrs.extra || ''}>
      <span class="tb-icon">${svg}${key === 'cart' ? '<span class="tb-count" data-tb-count hidden></span>' : ''}</span>
      <span class="tb-label">${label}</span>
    </${attrs.href ? 'a' : 'button'}>`;

  const categories = [
    { id: 'leaves', name: 'Yaprak', image: 'urunler/48458798.webp' },
    { id: 'grapes', name: 'Üzüm', image: 'urunler/48699027.webp' },
    { id: 'paste', name: 'Salça', image: 'urunler/49941101.webp' },
    { id: 'pickles', name: 'Turşu', image: 'urunler/48976314.webp' },
    { id: 'pantry', name: 'Kiler', image: 'urunler/48458883.webp' }
  ];

  document.body.insertAdjacentHTML('beforeend', `
    <div class="tb-scrim" data-tb-scrim hidden></div>

    <div class="tb-panel" id="tb-panel" role="dialog" aria-modal="true" aria-label="Menü" hidden>
      <p class="tb-panel-title">Kategoriler</p>
      <ul class="tb-cats">
        ${categories.map(({ id, name, image }) => `
          <li><a class="tb-cat" href="${home}?kategori=${id}#urunler"${onHome ? ` data-show-category="${id}"` : ''} data-tb-cat="${id}">
            <img src="assets/${image}" width="120" height="120" alt="" loading="lazy"><span>${name}</span>
          </a></li>`).join('')}
      </ul>
      <button type="button" class="tb-account" data-account>
        <span class="tb-account-icon" aria-hidden="true"><svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8.2" r="3.8"/><path d="M4.5 20c.9-3.9 4-6 7.5-6s6.6 2.1 7.5 6"/></svg></span>
        <span class="tb-account-text"><strong data-account-label>Giriş yap</strong><small>Siparişlerinizi ve adreslerinizi görün</small></span>
        <svg class="icon" aria-hidden="true"><use href="#i-chevron-right"/></svg>
      </button>
      <div class="tb-links">
        <a href="hikayeler.html"${onStories ? ' aria-current="page"' : ''}>${icon('i-leaf')}<span>Hikâyeler</span></a>
        <a href="favoriler.html" data-tb-favorites>${icon('i-heart')}<span>Favoriler</span></a>
        <a href="tel:+905442950945">${icon('i-phone')}<span>Bizi arayın</span></a>
        <a href="https://ig.me/m/gurmealasehirden" target="_blank" rel="noopener">${icon('i-instagram')}<span>Instagram</span></a>
      </div>
      <p class="tb-note">Türkiye içi kargo ücretsiz</p>
    </div>

    <nav class="tabbar" aria-label="Alt menü">
      <span class="tb-indicator" aria-hidden="true"></span>
      ${tab('home', 'Ana sayfa', homeIcon, { href: onHome ? '#main' : 'index.html' })}
      ${tab('shop', 'Ürünler', icon('i-grid'), { href: `${onHome ? '' : 'index.html'}#urunler` })}
      ${onHome
        ? tab('search', 'Ara', icon('i-search'), { extra: 'data-open="search"' })
        : tab('search', 'Ara', icon('i-search'), { href: 'index.html?panel=search' })}
      ${onHome
        ? tab('cart', 'Sepet', icon('i-bag'), { extra: 'data-open="cart"' })
        : tab('cart', 'Sepet', icon('i-bag'), { href: 'index.html?panel=cart' })}
      <button class="tb-item tb-menu" type="button" data-tab="menu" aria-expanded="false" aria-controls="tb-panel">
        <span class="tb-icon tb-burger" aria-hidden="true"><i></i><i></i></span>
        <span class="tb-label">Menü</span>
      </button>
    </nav>
  `);

  const bar = document.querySelector('.tabbar');
  const panel = document.getElementById('tb-panel');
  const scrim = document.querySelector('[data-tb-scrim]');
  const menuBtn = bar.querySelector('.tb-menu');
  const indicator = bar.querySelector('.tb-indicator');
  const items = [...bar.querySelectorAll('.tb-item')];
  const outside = () => [...document.body.children].filter((el) => el !== bar && el !== panel && el !== scrim && el.tagName !== 'SCRIPT' && el.tagName !== 'DIALOG');
  let active = '';
  let isOpen = false;
  let hideTimer;

  /* ---------- active tab + sliding indicator ---------- */
  function setActive(key) {
    if (key === active) return;
    active = key;
    items.forEach((item) => {
      const on = item.dataset.tab === key;
      item.classList.toggle('is-active', on);
      if (item.tagName === 'A') {
        if (on && item.dataset.tab !== 'menu') item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
      }
    });
    const target = items.find((item) => item.dataset.tab === key);
    if (!target) { bar.classList.remove('has-active'); return; }
    bar.style.setProperty('--tb-x', `${target.offsetLeft + target.offsetWidth / 2}px`);
    bar.classList.add('has-active');
  }

  function routeTab() {
    if (isOpen) return 'menu';
    if (!onHome) return '';
    const shop = document.getElementById('urunler');
    const r = shop.getBoundingClientRect();
    return r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.3 ? 'shop' : (scrollY < innerHeight * 0.6 ? 'home' : '');
  }

  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; setActive(routeTab()); });
  }, { passive: true });
  addEventListener('resize', () => { const k = active; active = ''; setActive(k); }, { passive: true });

  /* ---------- cart count ---------- */
  const count = bar.querySelector('[data-tb-count]');
  const badge = document.querySelector('.cart-count');
  function syncCount() {
    let n = 0;
    if (badge) n = Number(badge.textContent) || 0;
    else {
      try { n = Object.values(JSON.parse(localStorage.getItem('gurme-alasehirden-cart-v1')) || {}).reduce((a, c) => a + (Number(c) || 0), 0); } catch { /* storage blocked */ }
    }
    if (count.textContent !== String(n)) {
      count.textContent = String(n);
      count.classList.remove('is-bump');
      void count.offsetWidth;
      if (n > 0) count.classList.add('is-bump');
    }
    count.hidden = n === 0;
  }
  if (badge) new MutationObserver(syncCount).observe(badge, { childList: true, characterData: true, subtree: true });
  addEventListener('storage', (e) => { if (e.key === 'gurme-alasehirden-cart-v1' || e.key === null) syncCount(); });
  addEventListener('pageshow', syncCount);
  syncCount();

  /* ---------- menu panel ---------- */
  function syncCats() {
    let current = '';
    if (onHome && !document.querySelector('#show-favorites[aria-pressed="true"]')) {
      current = document.querySelector('#category-filters [aria-pressed="true"]')?.dataset.category || '';
    }
    panel.querySelectorAll('[data-tb-cat]').forEach((a) => {
      if (a.dataset.tbCat === current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  function open() {
    if (isOpen) return;
    clearTimeout(hideTimer);
    syncCats();
    isOpen = true;
    panel.hidden = false;
    scrim.hidden = false;
    outside().forEach((el) => { el.inert = true; });
    requestAnimationFrame(() => {
      panel.classList.add('is-open');
      scrim.classList.add('is-open');
      bar.classList.add('menu-open');
    });
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Menüyü kapat');
    setActive('menu');
    setTimeout(() => panel.querySelector('a')?.focus({ preventScroll: true }), reduced.matches ? 0 : 180);
  }

  function close({ instant = false, restoreFocus = true } = {}) {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove('is-open');
    scrim.classList.remove('is-open');
    bar.classList.remove('menu-open');
    outside().forEach((el) => { el.inert = false; });
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.removeAttribute('aria-label');
    const hide = () => { if (!isOpen) { panel.hidden = true; scrim.hidden = true; } };
    if (instant || reduced.matches) hide();
    else hideTimer = setTimeout(hide, 260);
    active = '';
    setActive(routeTab());
    if (restoreFocus) menuBtn.focus({ preventScroll: true });
  }

  menuBtn.addEventListener('click', () => (isOpen ? close() : open()));
  scrim.addEventListener('click', () => close());
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && isOpen) close(); });
  headerTrigger?.setAttribute('aria-controls', 'tb-panel');
  headerTrigger?.addEventListener('click', () => open());

  // tapping another tab while the menu is open closes it first
  bar.addEventListener('click', (event) => {
    const item = event.target.closest('.tb-item');
    if (!item || item === menuBtn) return;
    item.classList.remove('is-tapped');
    void item.offsetWidth;
    item.classList.add('is-tapped');
    if (isOpen) close({ instant: true, restoreFocus: false });
    if (item.dataset.tab === 'home' && onHome) {
      event.preventDefault();
      scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' });
    }
  });
  menuBtn.addEventListener('click', () => {
    menuBtn.classList.remove('is-tapped');
    void menuBtn.offsetWidth;
    menuBtn.classList.add('is-tapped');
  });

  panel.addEventListener('click', (event) => {
    if (event.target.closest('[data-account]')) { close({ instant: true, restoreFocus: false }); return; }
    const link = event.target.closest('a');
    if (!link || link.matches('a[href^="tel:"], a[target="_blank"]')) return;
    close({ instant: true, restoreFocus: false });
  });

  // drag the panel down to close it
  let drag;
  panel.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1) return;
    drag = { y: event.touches[0].clientY, x: event.touches[0].clientX, dy: 0, on: false };
  }, { passive: true });
  panel.addEventListener('touchmove', (event) => {
    if (!drag) return;
    const dy = event.touches[0].clientY - drag.y;
    const dx = event.touches[0].clientX - drag.x;
    if (!drag.on) {
      if (Math.abs(dy) < 6) return;
      if (dy < 0 || Math.abs(dx) > Math.abs(dy)) { drag = undefined; return; }
      drag.on = true;
      panel.classList.add('is-dragging');
    }
    drag.dy = Math.max(0, dy);
    panel.style.transform = `translateY(${drag.dy}px)`;
  }, { passive: true });
  panel.addEventListener('touchend', () => {
    if (!drag) return;
    const { dy, on } = drag;
    drag = undefined;
    panel.classList.remove('is-dragging');
    panel.style.transform = '';
    if (on && dy > 70) close();
  });

  matchMedia('(min-width: 791px)').addEventListener('change', (event) => {
    if (event.matches && isOpen) close({ instant: true, restoreFocus: false });
  });

  requestAnimationFrame(() => {
    setActive(routeTab());
    requestAnimationFrame(() => bar.classList.add('is-ready'));
  });
  document.fonts?.ready.then(() => { const k = active; active = ''; setActive(k); });
}
