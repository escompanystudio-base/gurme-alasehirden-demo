'use strict';

/* Demo account system. Everything lives in this browser's localStorage;
   nothing is sent anywhere. Passwords are stored as SHA-256 hashes. */
(() => {
  const USERS = 'ga-demo-users-v1';
  const SESSION = 'ga-demo-session-v1';
  const ORDERS = 'ga-demo-orders-v1';
  // Demo: orders placed on the site move forward on their own so the status
  // animations can be seen (every 45 seconds one step).
  const SIM_STEPS = ['Sipariş alındı', 'Hazırlanıyor', 'Kargoda', 'Teslim edildi'];
  const SIM_EVERY = 45000;
  function simulate(o) {
    if (!o || !o.sim) return o;
    const start = Math.max(0, SIM_STEPS.indexOf(o.simStart || o.status));
    const step = Math.min(3, start + Math.floor((Date.now() - (o.date || Date.now())) / SIM_EVERY));
    const out = { ...o, status: SIM_STEPS[step] };
    if (step >= 2 && !out.tracking) {
      let h = 0; for (const c of String(o.no)) h = (h * 31 + c.charCodeAt(0)) % 1e10;
      const d = String(h).padStart(10, '0');
      out.tracking = `DEMO ${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
    }
    return out;
  }
  const listeners = new Set();
  const DEMO = { email: 'demo@gurmealasehirden.com', password: 'demo1234' };

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  };
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 });
  const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  async function hash(text) {
    if (crypto?.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`ga-demo:${text}`));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 0;
    for (const ch of `ga-demo:${text}`) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return `x${(h >>> 0).toString(16)}`;
  }

  const normEmail = (email) => String(email || '').trim().toLowerCase();
  const fmtPhone = (v) => { const d = String(v || '').replace(/\D/g, ''); return d.length === 11 && d.startsWith('0') ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}` : String(v || '').trim(); };
  const users = () => read(USERS, {});
  const emit = () => listeners.forEach((fn) => fn(api.current()));

  const api = {
    current() {
      const email = read(SESSION, null);
      const user = email ? users()[email] : null;
      if (!user) return null;
      const { passHash, ...safe } = user;
      return safe;
    },
    async signUp({ name, email, phone, password }) {
      const key = normEmail(email);
      const all = users();
      if (all[key]) throw new Error('Bu e-posta ile zaten bir hesap var. Giriş yapın.');
      all[key] = { name: name.trim(), email: key, phone: fmtPhone(phone), passHash: await hash(password), addresses: [], createdAt: Date.now() };
      write(USERS, all);
      write(SESSION, key);
      emit();
      return api.current();
    },
    async signIn({ email, password }) {
      const key = normEmail(email);
      const user = users()[key];
      if (!user || user.passHash !== await hash(password)) throw new Error('E-posta veya şifre hatalı.');
      write(SESSION, key);
      emit();
      return api.current();
    },
    signOut() {
      try { localStorage.removeItem(SESSION); } catch { /* storage blocked */ }
      emit();
    },
    updateProfile(fields) {
      const me = api.current();
      if (!me) return;
      const all = users();
      Object.assign(all[me.email], { name: fields.name.trim(), phone: fmtPhone(fields.phone) });
      write(USERS, all);
      emit();
    },
    saveAddress(address) {
      const me = api.current();
      if (!me) return;
      const all = users();
      const list = all[me.email].addresses || [];
      const same = list.findIndex((a) => a.line === address.line && a.city === address.city && a.district === address.district);
      if (same >= 0) list.splice(same, 1);
      list.unshift({ ...address, id: `a${Date.now()}` });
      all[me.email].addresses = list.slice(0, 5);
      write(USERS, all);
      emit();
    },
    removeAddress(id) {
      const me = api.current();
      if (!me) return;
      const all = users();
      all[me.email].addresses = (all[me.email].addresses || []).filter((a) => a.id !== id);
      write(USERS, all);
      emit();
    },
    addOrder(order) {
      const all = read(ORDERS, []);
      all.unshift(order);
      const mine = all.filter((o) => o.email === order.email).slice(50);
      write(ORDERS, all.filter((o) => !mine.includes(o)));
      emit();
    },
    orders() {
      const me = api.current();
      return me ? read(ORDERS, []).filter((o) => o.email === me.email).map(simulate) : [];
    },
    async signInDemo() {
      const key = DEMO.email;
      const all = users();
      if (!all[key]) {
        const day = 86400000;
        const now = Date.now();
        all[key] = {
          name: 'Elif Yıldız', email: key, phone: '0532 555 01 23', passHash: await hash(DEMO.password), createdAt: now - 120 * day,
          prefs: { email: true, sms: false },
          addresses: [
            { id: 'a-demo-1', title: 'Ev', fullName: 'Elif Yıldız', phone: '0532 555 01 23', city: 'İzmir', district: 'Karşıyaka', line: 'Bostanlı Mah. Cemal Gürsel Cad. No 112 D 6', isDefault: true },
            { id: 'a-demo-2', title: 'İş', fullName: 'Elif Yıldız', phone: '0532 555 01 23', city: 'İzmir', district: 'Konak', line: 'Alsancak Mah. Kıbrıs Şehitleri Cad. No 40 Kat 3' }
          ]
        };
        write(USERS, all);
        const pick = (id, count) => { const p = (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []).find((x) => x.id === id); return p ? { id: p.id, name: p.name, size: p.size, price: p.price, image: p.image, count } : null; };
        const make = (no, ago, status, items, method, extra = {}) => {
          const list = items.map(([id, c]) => pick(id, c)).filter(Boolean);
          const total = list.reduce((sum, i) => sum + i.price * i.count, 0);
          return { no, date: now - ago * day, email: key, name: 'Elif Yıldız', address: all[key].addresses[0], shipping: 'Standart kargo',
            payment: method === 'card' ? { method: 'card', label: 'Kredi veya banka kartı', last4: '4242' } : { method: 'cod', label: 'Kapıda ödeme', last4: '' },
            items: list, subtotal: total, shippingFee: 0, total, status, ...extra };
        };
        const demoOrders = [
          make('GA-DEMO03', 0.2, 'Hazırlanıyor', [['tarhana', 1], ['tek-kavrulmus-tahin', 2]], 'card'),
          make('GA-DEMO02', 3, 'Kargoda', [['salamura-uc-yaprak-3kg', 1], ['sultaniye-kuru-uzum', 2]], 'card', { tracking: 'DEMO 4471 2093 18' }),
          make('GA-DEMO01', 34, 'Teslim edildi', [['domates-salcasi', 1], ['gemlik-kirma-zeytin', 1], ['visne-receli', 1]], 'cod')
        ].filter((o) => o.items.length);
        const orders = read(ORDERS, []).filter((o) => o.email !== key);
        write(ORDERS, [...demoOrders, ...orders]);
        try {
          const favKey = 'gurme-alasehirden-favorites-v1';
          const favs = JSON.parse(localStorage.getItem(favKey)) || [];
          if (!favs.length) localStorage.setItem(favKey, JSON.stringify(['sultaniye-kuru-uzum', 'gemlik-kirma-zeytin', 'cilek-receli', 'eksi-maya-ekmek']));
        } catch { /* storage blocked */ }
      }
      write(SESSION, key);
      emit();
      return api.current();
    },
    async changePassword(current, next) {
      const me = api.current();
      if (!me) throw new Error('Önce giriş yapın.');
      const all = users();
      if (all[me.email].passHash !== await hash(current)) throw new Error('Mevcut şifreniz hatalı.');
      all[me.email].passHash = await hash(next);
      write(USERS, all);
      emit();
    },
    updatePrefs(prefs) {
      const me = api.current();
      if (!me) return;
      const all = users();
      all[me.email].prefs = { ...(all[me.email].prefs || {}), ...prefs };
      write(USERS, all);
      emit();
    },
    upsertAddress(address) {
      const me = api.current();
      if (!me) return;
      const all = users();
      let list = all[me.email].addresses || [];
      if (address.isDefault) list = list.map((a) => ({ ...a, isDefault: false }));
      const i = list.findIndex((a) => a.id === address.id);
      if (i >= 0) list[i] = { ...list[i], ...address };
      else list.unshift({ ...address, id: `a${Date.now()}` });
      if (!list.some((a) => a.isDefault) && list[0]) list[0].isDefault = true;
      all[me.email].addresses = list.slice(0, 8);
      write(USERS, all);
      emit();
    },
    deleteAccount() {
      const me = api.current();
      if (!me) return;
      const all = users();
      delete all[me.email];
      write(USERS, all);
      write(ORDERS, read(ORDERS, []).filter((o) => o.email !== me.email));
      api.signOut();
    },
    isDemo() { return api.current()?.email === DEMO.email; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    open(view) { openDialog(view); },
    money,
    esc
  };
  window.GAAccount = api;

  /* ---------- UI ---------- */
  const userIcon = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.2" r="3.8"/><path d="M4.5 20c.9-3.9 4-6 7.5-6s6.6 2.1 7.5 6"/></svg>';

  // header button (all pages)
  const actions = document.querySelector('.header-actions');
  const cartBtn = actions?.querySelector('.cart-trigger');
  if (actions && cartBtn) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-button header-account';
    btn.setAttribute('data-account', '');
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.innerHTML = `${userIcon}<span class="header-account-dot" hidden></span>`;
    actions.insertBefore(btn, cartBtn);
  }

  // header favorites link + count (all pages)
  const FAV_KEY = 'gurme-alasehirden-favorites-v1';
  let favLink = actions?.querySelector('.header-favorites');
  if (actions && cartBtn && !favLink) {
    favLink = document.createElement('a');
    favLink.className = 'icon-button header-favorites';
    favLink.href = 'favoriler.html';
    favLink.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.3 9c0 4.1-8.3 9.6-8.3 9.6S3.7 13.1 3.7 9a4.3 4.3 0 0 1 8.3-1.6 4.3 4.3 0 0 1 8.3 1.6Z"/></svg>';
    actions.insertBefore(favLink, actions.querySelector('.header-account') || cartBtn);
  }
  if (favLink) {
    if (/favoriler\.html$/.test(location.pathname)) favLink.setAttribute('aria-current', 'page');
    const favBadge = document.createElement('span');
    favBadge.className = 'fav-count';
    favBadge.setAttribute('aria-hidden', 'true');
    favLink.append(favBadge);
    let lastFav = -1;
    const syncFav = () => {
      let n = 0;
      try { const v = JSON.parse(localStorage.getItem(FAV_KEY)); n = Array.isArray(v) ? v.filter((id) => typeof PRODUCTS === 'undefined' || PRODUCTS.some((p) => p.id === id)).length : 0; } catch { /* ignore */ }
      favBadge.textContent = String(n);
      favBadge.hidden = n === 0;
      favLink.classList.toggle('has-favs', n > 0);
      favLink.setAttribute('aria-label', n ? `Favorilerim, ${n} ürün` : 'Favorilerim');
      if (lastFav >= 0 && n > lastFav && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        favLink.classList.remove('fav-bump'); void favLink.offsetWidth; favLink.classList.add('fav-bump');
      }
      lastFav = n;
    };
    syncFav();
    addEventListener('storage', (e) => { if (e.key === FAV_KEY || e.key === null) syncFav(); });
    addEventListener('pageshow', syncFav);
    window.addEventListener('ga-fav-change', syncFav);
  }

  const cartLink = document.querySelector('a.cart-trigger');
  if (cartLink && !cartLink.querySelector('.cart-count')) {
    const badge = document.createElement('span');
    badge.className = 'cart-count';
    badge.setAttribute('aria-hidden', 'true');
    cartLink.append(badge);
    const syncCart = () => {
      let n = 0;
      try { n = Object.values(JSON.parse(localStorage.getItem('gurme-alasehirden-cart-v1')) || {}).reduce((a, c) => a + (Number(c) || 0), 0); } catch { /* ignore */ }
      badge.textContent = String(n);
      cartLink.setAttribute('aria-label', `Sepet, ${n} ürün`);
    };
    syncCart();
    addEventListener('storage', (e) => { if (e.key === 'gurme-alasehirden-cart-v1' || e.key === null) syncCart(); });
    addEventListener('pageshow', syncCart);
    window.addEventListener('ga-cart-change', syncCart);
  }

  document.body.insertAdjacentHTML('beforeend', `
    <dialog class="panel account-dialog" id="account-dialog" aria-labelledby="account-title">
      <div class="dialog-inner account-inner">
        <header class="dialog-header">
          <h2 id="account-title">Hesabım</h2>
          <button type="button" class="icon-button" data-account-close aria-label="Kapat">
            <svg class="icon" aria-hidden="true"><use href="#i-close"/></svg>
          </button>
        </header>
        <div class="account-view" id="account-view"></div>
        <p class="demo-note">Demo mağaza: hesap ve sipariş bilgileri yalnızca bu tarayıcıda saklanır, gerçek ödeme alınmaz.</p>
      </div>
    </dialog>
  `);

  const dialog = document.getElementById('account-dialog');
  const view = document.getElementById('account-view');
  const title = document.getElementById('account-title');
  let mode = 'login';
  let tab = 'orders';
  let opener = null;

  const field = (id, label, type, attrs = '', value = '') => `
    <div class="field">
      <label for="${id}">${label}</label>
      <input id="${id}" name="${id.replace(/^acc-/, '')}" type="${type}" value="${esc(value)}" ${attrs}>
      <p class="field-error" id="${id}-error" hidden></p>
    </div>`;

  function render() {
    const me = api.current();
    if (me) mode = 'account';
    else if (mode !== 'register') mode = 'login';
    title.textContent = mode === 'register' ? 'Hesap oluştur' : mode === 'login' ? 'Giriş yap' : 'Hesabım';

    if (mode === 'login') {
      view.innerHTML = `
        <form class="account-form" data-form="login" novalidate>
          ${field('acc-email', 'E-posta', 'email', 'autocomplete="email" required')}
          ${field('acc-password', 'Şifre', 'password', 'autocomplete="current-password" required minlength="6"')}
          <p class="form-error" role="alert" hidden></p>
          <button class="button button-primary" type="submit">Giriş yap</button>
        </form>
        <div class="account-or" aria-hidden="true"><span>veya</span></div>
        <button type="button" class="button account-demo" data-demo-login>
          <span class="account-demo-icon" aria-hidden="true">${userIcon}</span>
          <span class="account-demo-text"><strong>Demo hesabıyla giriş yap</strong><small>Örnek siparişler ve adreslerle hazır hesap</small></span>
        </button>
        <p class="account-switch">Hesabınız yok mu? <button type="button" class="text-button" data-mode="register">Hesap oluşturun</button></p>`;
    } else if (mode === 'register') {
      view.innerHTML = `
        <form class="account-form" data-form="register" novalidate>
          ${field('acc-name', 'Ad soyad', 'text', 'autocomplete="name" required')}
          ${field('acc-email', 'E-posta', 'email', 'autocomplete="email" required')}
          ${field('acc-phone', 'Telefon', 'tel', 'autocomplete="tel" inputmode="tel" placeholder="05xx xxx xx xx" required')}
          ${field('acc-password', 'Şifre', 'password', 'autocomplete="new-password" required minlength="6" aria-describedby="acc-password-hint"')}
          <p class="field-hint" id="acc-password-hint">En az 6 karakter.</p>
          <label class="check"><input type="checkbox" name="kvkk" required> <span><a href="yasal.html#gizlilik" target="_blank">Gizlilik ve KVKK metnini</a> okudum.</span></label>
          <p class="form-error" role="alert" hidden></p>
          <button class="button button-primary" type="submit">Hesap oluştur</button>
        </form>
        <p class="account-switch">Zaten hesabınız var mı? <button type="button" class="text-button" data-mode="login">Giriş yapın</button></p>`;
    } else {
      const orders = api.orders();
      const tabs = [['orders', `Siparişlerim${orders.length ? ` (${orders.length})` : ''}`], ['addresses', 'Adreslerim'], ['profile', 'Bilgilerim']];
      let body = '';
      if (tab === 'orders') {
        body = orders.length ? `<ol class="order-list">${orders.map((o) => `
          <li class="order-card">
            <div class="order-top"><strong>${esc(o.no)}</strong><span class="order-status">${esc(o.status)}</span></div>
            <p class="order-meta">${dateFmt.format(o.date)} · ${o.items.reduce((n, i) => n + i.count, 0)} ürün · ${money.format(o.total)}</p>
            <div class="order-thumbs">${o.items.slice(0, 5).map((i) => `<img src="${esc(i.image)}" width="80" height="80" alt="${esc(i.name)}" loading="lazy">`).join('')}</div>
          </li>`).join('')}</ol>`
          : `<div class="account-empty"><p>Henüz siparişiniz yok.</p><a class="button button-secondary" href="index.html#urunler" data-account-close>Ürünlere göz atın</a></div>`;
      } else if (tab === 'addresses') {
        const list = me.addresses || [];
        body = list.length ? `<ul class="address-list">${list.map((a) => `
          <li><p><strong>${esc(a.title || 'Adres')}</strong><br>${esc(a.fullName)} · ${esc(a.phone)}<br>${esc(a.line)}<br>${esc(a.district)} / ${esc(a.city)}</p>
          <button type="button" class="text-button" data-remove-address="${esc(a.id)}">Sil</button></li>`).join('')}</ul>`
          : '<div class="account-empty"><p>Kayıtlı adresiniz yok. Sipariş verirken adresinizi kaydedebilirsiniz.</p></div>';
      } else {
        body = `<form class="account-form" data-form="profile" novalidate>
          ${field('acc-name', 'Ad soyad', 'text', 'autocomplete="name" required', me.name)}
          ${field('acc-phone', 'Telefon', 'tel', 'autocomplete="tel" required', me.phone)}
          <div class="field"><p class="field-label">E-posta</p><p class="field-static">${esc(me.email)}</p></div>
          <p class="form-ok" role="status" hidden>Bilgileriniz kaydedildi.</p>
          <button class="button button-primary" type="submit">Kaydet</button>
        </form>`;
      }
      view.innerHTML = `
        <div class="account-hello">
          <span class="account-avatar" aria-hidden="true">${esc(me.name.trim().charAt(0).toLocaleUpperCase('tr'))}</span>
          <div><p class="account-name">Merhaba, ${esc(me.name.split(' ')[0])}</p><p class="account-mail">${esc(me.email)}</p></div>
        </div>
        <div class="account-tabs">${tabs.map(([k, l]) => `<button type="button" aria-pressed="${k === tab}" data-tab="${k}">${l}</button>`).join('')}</div>
        <div class="account-panel">${body}</div>
        <button type="button" class="text-button account-logout" data-signout>Çıkış yap</button>`;
    }
    syncHeader();
  }

  function syncHeader() {
    const me = api.current();
    document.querySelectorAll('.header-account').forEach((el) => {
      el.setAttribute('aria-label', me ? `Hesabım: ${me.name}` : 'Giriş yap veya hesap oluştur');
    });
    document.querySelectorAll('[data-account]').forEach((el) => {
      el.classList.toggle('is-signed-in', Boolean(me));
      const label = el.querySelector('[data-account-label]');
      if (label) label.textContent = me ? 'Hesabım' : 'Giriş yap';
    });
    document.querySelectorAll('.header-account-dot').forEach((d) => { d.hidden = !me; });
  }

  function openDialog(next) {
    if (!api.current()) mode = next === 'register' ? 'register' : 'login';
    else if (next === 'orders') tab = 'orders';
    opener = document.activeElement;
    render();
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('input, [data-tab][aria-pressed="true"], .button')?.focus({ preventScroll: true });
  }

  function closeDialog() {
    dialog.close();
  }

  function showErrors(form, errors) {
    form.querySelectorAll('.field-error').forEach((p) => { p.hidden = true; p.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach((i) => { i.removeAttribute('aria-invalid'); i.removeAttribute('aria-errormessage'); i.setAttribute('aria-describedby', (i.getAttribute('aria-describedby') || '').split(' ').filter((x) => x && !x.endsWith('-error')).join(' ')); });
    let first = null;
    for (const [name, message] of Object.entries(errors)) {
      const input = form.querySelector(`[name="${name}"]`);
      const out = input && document.getElementById(`${input.id}-error`);
      if (input) { input.setAttribute('aria-invalid', 'true'); first ||= input; }
      if (out) {
        out.textContent = message; out.hidden = false;
        if (input) { input.setAttribute('aria-errormessage', out.id); input.setAttribute('aria-describedby', `${input.getAttribute('aria-describedby') || ''} ${out.id}`.trim()); }
      }
    }
    first?.focus();
    return !first;
  }

  const PROFILE = 'hesabim.html';
  const onProfile = () => /hesabim(\.html)?$/.test(location.pathname);
  const onCheckout = () => Boolean(document.getElementById('checkout-root'));
  function afterSignIn() {
    if (onCheckout() || onProfile()) { closeDialog(); return; }
    location.href = PROFILE;
  }

  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  const phoneOk = (v) => v.replace(/\D/g, '').length >= 10;

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-account]');
    if (!trigger) return;
    event.preventDefault();
    if (api.current() && !onCheckout()) {
      const hash = trigger.dataset.account === 'orders' ? '#siparisler' : '';
      if (onProfile()) { if (hash) location.hash = hash; return; }
      location.href = PROFILE + hash;
      return;
    }
    openDialog(trigger.dataset.account || undefined);
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-account-close]')) { closeDialog(); return; }
    const m = event.target.closest('[data-mode]');
    if (m) { mode = m.dataset.mode; render(); view.querySelector('input')?.focus(); return; }
    const t = event.target.closest('[data-tab]');
    if (t) { tab = t.dataset.tab; render(); view.querySelector(`[data-tab="${tab}"]`)?.focus(); return; }
    const rm = event.target.closest('[data-remove-address]');
    if (rm) { api.removeAddress(rm.dataset.removeAddress); render(); return; }
    const demo = event.target.closest('[data-demo-login]');
    if (demo) {
      demo.classList.add('is-loading');
      api.signInDemo().then(afterSignIn);
      return;
    }
    if (event.target.closest('[data-signout]')) { api.signOut(); mode = 'login'; render(); view.querySelector('input')?.focus(); }
  });

  dialog.addEventListener('close', () => {
    const visible = (el) => el?.isConnected && el.getClientRects().length;
    const target = visible(opener) ? opener : [document.querySelector('.header-account'), document.querySelector('.tb-menu')].find(visible);
    target?.focus({ preventScroll: true });
  });

  dialog.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const data = Object.fromEntries(new FormData(form));
    const formError = form.querySelector('.form-error');
    if (formError) formError.hidden = true;
    const errors = {};

    if (form.dataset.form === 'register' || form.dataset.form === 'profile') {
      if (!data.name?.trim() || data.name.trim().length < 3) errors.name = 'Adınızı ve soyadınızı yazın.';
      if (!phoneOk(data.phone || '')) errors.phone = 'Geçerli bir telefon numarası yazın.';
    }
    if (form.dataset.form !== 'profile') {
      if (!emailOk(data.email || '')) errors.email = 'Geçerli bir e-posta adresi yazın.';
      if ((data.password || '').length < 6) errors.password = 'Şifre en az 6 karakter olmalı.';
    }
    if (!showErrors(form, errors)) return;
    if (form.dataset.form === 'register' && !form.querySelector('[name="kvkk"]').checked) {
      formError.textContent = 'Devam etmek için gizlilik metnini onaylayın.';
      formError.hidden = false;
      return;
    }

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.classList.add('is-loading');
    try {
      if (form.dataset.form === 'login') await api.signIn(data);
      else if (form.dataset.form === 'register') await api.signUp(data);
      else {
        api.updateProfile(data);
        render();
        const ok = view.querySelector('.form-ok');
        if (ok) ok.hidden = false;
        return;
      }
      afterSignIn();
    } catch (error) {
      if (formError) { formError.textContent = error.message; formError.hidden = false; }
    } finally {
      submit.disabled = false;
      submit.classList.remove('is-loading');
    }
  });

  let lastIdentity = api.current()?.email || '';
  addEventListener('storage', (event) => {
    if (![USERS, SESSION, ORDERS, null].includes(event.key)) return;
    syncHeader();
    const identity = api.current()?.email || '';
    const typing = dialog.open && view.querySelector('form') && view.contains(document.activeElement);
    if (dialog.open && (identity !== lastIdentity || !typing)) render();
    lastIdentity = identity;
  });
  api.onChange(syncHeader);
  syncHeader();

  const landing = new URL(location.href);
  if (landing.searchParams.get('panel') === 'account') {
    landing.searchParams.delete('panel');
    history.replaceState(null, '', landing);
    requestAnimationFrame(() => openDialog(api.current() ? 'orders' : 'login'));
  }
})();
