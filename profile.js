'use strict';

/* Hesabım (profile) page. Hash-routed views over the demo account store
   in account.js. Everything stays in this browser. */
(() => {
  const app = document.getElementById('pf-app');
  const guest = document.getElementById('pf-guest');
  const main = document.getElementById('pf-main');
  if (!app || !window.GAAccount) return;

  const A = window.GAAccount;
  const CART = 'gurme-alasehirden-cart-v1';
  const FAVS = 'gurme-alasehirden-favorites-v1';
  const esc = A.esc;
  const money = A.money;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const byId = new Map((typeof PRODUCTS !== 'undefined' ? PRODUCTS : []).map((p) => [p.id, p]));
  const dateLong = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const dateTime = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const monthYear = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' });
  const STEPS = ['Sipariş alındı', 'Hazırlanıyor', 'Kargoda', 'Teslim edildi'];
  const stepOf = (status) => Math.max(0, STEPS.indexOf(status));
  const CITIES = 'Adana Adıyaman Afyonkarahisar Ağrı Aksaray Amasya Ankara Antalya Ardahan Artvin Aydın Balıkesir Bartın Batman Bayburt Bilecik Bingöl Bitlis Bolu Burdur Bursa Çanakkale Çankırı Çorum Denizli Diyarbakır Düzce Edirne Elazığ Erzincan Erzurum Eskişehir Gaziantep Giresun Gümüşhane Hakkari Hatay Iğdır Isparta İstanbul İzmir Kahramanmaraş Karabük Karaman Kars Kastamonu Kayseri Kilis Kırıkkale Kırklareli Kırşehir Kocaeli Konya Kütahya Malatya Manisa Mardin Mersin Muğla Muş Nevşehir Niğde Ordu Osmaniye Rize Sakarya Samsun Şanlıurfa Siirt Sinop Şırnak Sivas Tekirdağ Tokat Trabzon Tunceli Uşak Van Yalova Yozgat Zonguldak'.split(' ');

  const ico = {
    home: '<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z"/>',
    box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5m8 4.5v9"/>',
    pin: '<path d="M18.5 10c0 4.8-6.5 10-6.5 10s-6.5-5.2-6.5-10a6.5 6.5 0 1 1 13 0Z"/><circle cx="12" cy="9.8" r="2.2"/>',
    heart: '<path d="M20.3 9c0 4.1-8.3 9.6-8.3 9.6S3.7 13.1 3.7 9a4.3 4.3 0 0 1 8.3-1.6 4.3 4.3 0 0 1 8.3 1.6Z"/>',
    user: '<circle cx="12" cy="8.2" r="3.8"/><path d="M4.5 20c.9-3.9 4-6 7.5-6s6.6 2.1 7.5 6"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7"/>',
    out: '<path d="M14 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H14M10 12h10m-3.5-3.5L20 12l-3.5 3.5"/>',
    truck: '<path d="M2.5 6.5h11v10h-5m5-7h4l3 3.5v3.5h-3m-4 0h-2M2.5 16.5h2M2.5 6.5v10"/><circle cx="6.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M14.5 5.5l4 4L9 19H5v-4z"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2m-7 0 1 12h8l1-12"/>',
    repeat: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"/>',
    bag: '<path d="M5.2 8h13.6l1.3 13H3.9L5.2 8Z"/><path d="M9 10V6a3 3 0 1 1 6 0v4"/>',
    phone: '<path d="M6.7 3.5h3l1.4 4.5-2 1.7a13.8 13.8 0 0 0 5.2 5.2l1.7-2 4.5 1.4v3.1a2.1 2.1 0 0 1-2.3 2.1A16.8 16.8 0 0 1 4.5 5.8a2.1 2.1 0 0 1 2.2-2.3Z"/>',
    chevron: '<path d="m9.5 6 6 6-6 6"/>'
  };
  const svg = (name, cls = 'pf-ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ico[name]}</svg>`;

  const NAV = [
    ['ozet', 'Genel bakış', 'home', 'Özet'],
    ['siparisler', 'Siparişlerim', 'box', 'Siparişler'],
    ['adresler', 'Adreslerim', 'pin', 'Adresler'],
    ['favoriler', 'Favorilerim', 'heart', 'Favoriler'],
    ['bilgiler', 'Hesap bilgileri', 'user', 'Bilgiler'],
    ['guvenlik', 'Güvenlik', 'lock', 'Güvenlik']
  ];

  const readJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const writeJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ } };
  const favorites = () => readJSON(FAVS, []).map((id) => byId.get(id)).filter(Boolean);
  const addToCart = (items) => {
    const cart = readJSON(CART, {});
    items.forEach(({ id, count }) => { if (byId.has(id)) cart[id] = Math.min(99, (Number(cart[id]) || 0) + count); });
    writeJSON(CART, cart);
    window.dispatchEvent(new Event('ga-cart-change'));
  };

  let filter = 'all';
  let editing = null;
  let flash = '';

  /* ---------- shell ---------- */
  function renderShell() {
    const me = A.current();
    guest.hidden = Boolean(me);
    app.hidden = !me;
    if (!me) return false;
    const orders = A.orders();
    const counts = { siparisler: orders.length, adresler: (me.addresses || []).length, favoriler: favorites().length };
    document.getElementById('pf-user').innerHTML = `
      <span class="pf-avatar" aria-hidden="true">${esc(me.name.trim().charAt(0).toLocaleUpperCase('tr'))}</span>
      <div class="pf-user-text">
        <p class="pf-user-name">${esc(me.name)}</p>
        <p class="pf-user-mail" title="${esc(me.email)}">${esc(me.email)}</p>
        <p class="pf-user-since">Üyelik: ${monthYear.format(me.createdAt || Date.now())}</p>
        ${A.isDemo() ? '<p class="pf-demo-tag">Demo hesap</p>' : ''}
      </div>`;
    document.getElementById('pf-nav').innerHTML = NAV.map(([key, label, icon, short]) => `
      <a href="#${key}" data-view="${key}">${svg(icon)}<span class="pf-nav-long">${label}</span><span class="pf-nav-short" aria-hidden="true">${short}</span>${counts[key] ? `<span class="pf-count">${counts[key]}</span>` : ''}</a>`).join('');
    return true;
  }

  function setActive(view) {
    document.querySelectorAll('#pf-nav [data-view]').forEach((a) => {
      const on = a.dataset.view === view;
      a.classList.toggle('is-active', on);
      if (on) { a.setAttribute('aria-current', 'page'); a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced() ? 'auto' : 'smooth' }); }
      else a.removeAttribute('aria-current');
    });
  }

  /* ---------- pieces ---------- */
  const timeline = (order, compact = false) => {
    const step = stepOf(order.status);
    return `<ol class="pf-timeline${compact ? ' is-compact' : ''}" style="--step:${step}" aria-label="Sipariş durumu: ${esc(order.status)}">
      ${STEPS.map((label, i) => `<li class="${i < step ? 'is-done' : i === step ? 'is-current' : ''}"><span class="pf-dot">${i <= step ? svg('check', 'pf-dot-ico') : ''}</span><span class="pf-step-label">${label}</span></li>`).join('')}
    </ol>`;
  };
  const art = (status, cls) => (window.GAArt ? window.GAArt.status(status, cls) : '');
  const SEEN = 'ga-seen-status-v1';
  let seen = readJSON(SEEN, {});
  const changed = (o) => Boolean(seen[o.no]) && seen[o.no] !== o.status;
  const UPDATE_MSG = { 'Hazırlanıyor': 'hazırlanmaya başladı', 'Kargoda': 'kargoya verildi', 'Teslim edildi': 'teslim edildi' };
  const hero = (o) => {
    if (!window.GAArt) return '';
    const [t, d] = window.GAArt.statusText(o.status);
    const isNew = changed(o);
    return `<div class="pf-hero pf-hero-${window.GAArt.keyOf(o.status)}${isNew ? ' is-new' : ''}">${art(o.status, 'is-lg')}<div>${isNew ? '<span class="pf-hero-tag">Durum güncellendi</span>' : ''}<strong>${t}</strong><p>${d}</p></div></div>`;
  };
  const statusChip = (status) => `<span class="pf-status pf-status-${stepOf(status)}">${esc(status)}</span>`;
  const thumbs = (items, n = 4) => `<div class="pf-thumbs">${items.slice(0, n).map((i) => `<img src="${esc(i.image)}" width="96" height="96" alt="${esc(i.name)}" loading="lazy">`).join('')}${items.length > n ? `<span class="pf-more">+${items.length - n}</span>` : ''}</div>`;
  const empty = (title, text, href, label) => `<div class="pf-empty"><span class="pf-empty-ico">${svg('bag')}</span><h3>${title}</h3><p>${text}</p>${href ? `<a class="button button-primary" href="${href}">${label}</a>` : ''}</div>`;
  const head = (title, sub, action = '') => `<header class="pf-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${action}</header>`;

  /* ---------- views ---------- */
  const views = {
    ozet() {
      const me = A.current();
      const orders = A.orders();
      const spent = orders.reduce((s, o) => s + o.total, 0);
      const last = orders[0];
      const first = me.name.split(' ')[0];
      return `
        <div class="pf-hello"><h2>Merhaba, ${esc(first)}</h2><p>Siparişlerinizi, adreslerinizi ve favorilerinizi buradan yönetin.</p></div>
        <div class="pf-stats">
          <a class="pf-stat" href="#siparisler"><span class="pf-stat-ico">${svg('box')}</span><span class="pf-stat-num" data-count="${orders.length}">0</span><span class="pf-stat-label">Sipariş</span></a>
          <a class="pf-stat" href="#siparisler"><span class="pf-stat-ico">${svg('bag')}</span><span class="pf-stat-num" data-count="${spent}" data-money>${money.format(0)}</span><span class="pf-stat-label">Toplam alışveriş</span></a>
          <a class="pf-stat" href="#adresler"><span class="pf-stat-ico">${svg('pin')}</span><span class="pf-stat-num" data-count="${(me.addresses || []).length}">0</span><span class="pf-stat-label">Kayıtlı adres</span></a>
          <a class="pf-stat" href="#favoriler"><span class="pf-stat-ico">${svg('heart')}</span><span class="pf-stat-num" data-count="${favorites().length}">0</span><span class="pf-stat-label">Favori ürün</span></a>
        </div>
        ${last ? `<section class="pf-card pf-last">
          <div class="pf-card-head"><div><p class="pf-kicker">Son siparişiniz</p><h3>${esc(last.no)}</h3><p class="pf-muted">${dateTime.format(last.date)} · ${money.format(last.total)}</p></div>${statusChip(last.status)}</div>
          ${hero(last)}
          ${timeline(last)}
          <div class="pf-last-foot">${thumbs(last.items)}<a class="pf-link" href="#siparis/${esc(last.no)}">Siparişi görüntüle ${svg('chevron')}</a></div>
        </section>` : empty('Henüz siparişiniz yok', 'Beğendiğiniz ürünleri sepete ekleyip ilk siparişinizi verin.', 'index.html#urunler', 'Alışverişe başla')}
        <div class="pf-quick">
          <a class="pf-quick-item" href="index.html#urunler">${svg('bag')}<span><strong>Alışverişe devam et</strong><small>24 yöresel ürün</small></span></a>
          <a class="pf-quick-item" href="#adresler">${svg('pin')}<span><strong>Adres ekle</strong><small>Teslimatı hızlandırın</small></span></a>
          <a class="pf-quick-item" href="tel:+905442950945">${svg('phone')}<span><strong>Müşteri hizmetleri</strong><small>0544 295 09 45</small></span></a>
        </div>`;
    },

    siparisler() {
      const orders = A.orders();
      if (!orders.length) return head('Siparişlerim', '') + empty('Henüz siparişiniz yok', 'Verdiğiniz siparişler ve kargo durumları burada görünür.', 'index.html#urunler', 'Ürünlere göz at');
      const tabs = [['all', 'Tümü'], ...STEPS.slice(1).map((s) => [s, s])];
      const list = orders.filter((o) => filter === 'all' || o.status === filter);
      return head('Siparişlerim', `${orders.length} sipariş`) + `
        <div class="pf-filters">${tabs.map(([k, l]) => `<button type="button" data-filter="${esc(k)}" aria-pressed="${filter === k}">${l}<span>${k === 'all' ? orders.length : orders.filter((o) => o.status === k).length}</span></button>`).join('')}</div>
        <ul class="pf-orders">${list.map((o, i) => `
          <li class="pf-order" style="--i:${i}">
            <a class="pf-order-link" href="#siparis/${esc(o.no)}">
              <div class="pf-order-top">${art(o.status, changed(o) ? 'is-sm is-new' : 'is-sm')}<div><strong>${esc(o.no)}</strong><span class="pf-muted">${dateLong.format(o.date)}</span></div>${statusChip(o.status)}</div>
              <div class="pf-order-mid">${thumbs(o.items)}<div class="pf-order-sum"><span class="pf-muted">${o.items.reduce((n, x) => n + x.count, 0)} ürün</span><strong>${money.format(o.total)}</strong></div></div>
              <div class="pf-order-bar"><span style="--p:${stepOf(o.status) / 3}"></span></div>
              <span class="pf-order-cta">Detaylar ${svg('chevron')}</span>
            </a>
          </li>`).join('') || '<li class="pf-none">Bu durumda sipariş yok.</li>'}</ul>`;
    },

    siparis(no) {
      const o = A.orders().find((x) => x.no === no);
      if (!o) return head('Sipariş bulunamadı', '') + empty('Bu sipariş bulunamadı', 'Sipariş başka bir hesaba ait olabilir.', '#siparisler', 'Siparişlerime dön');
      const pay = o.payment.method === 'card' ? `${esc(o.payment.label)} · •••• ${esc(o.payment.last4)}` : esc(o.payment.label);
      return `
        <a class="pf-back" href="#siparisler">${svg('chevron')} Siparişlerim</a>
        ${head(`Sipariş ${esc(o.no)}`, `${dateTime.format(o.date)} tarihinde verildi`, statusChip(o.status))}
        <section class="pf-card">${hero(o)}${timeline(o)}
          ${o.tracking ? `<p class="pf-track">${svg('truck')} Kargo takip no: <strong>${esc(o.tracking)}</strong></p>` : ''}
          ${stepOf(o.status) === 3 ? `<p class="pf-track is-done">${svg('check')} Siparişiniz teslim edildi.</p>` : ''}
        </section>
        <div class="pf-detail-grid">
          <section class="pf-card"><h3 class="pf-card-title">Ürünler</h3>
            <ul class="pf-items">${o.items.map((i) => `<li><img src="${esc(i.image)}" width="96" height="96" alt="" loading="lazy"><span><strong>${esc(i.name)}</strong><small>${esc(i.size)} · ${i.count} adet</small></span><b>${money.format(i.price * i.count)}</b></li>`).join('')}</ul>
            <dl class="pf-totals"><div><dt>Ara toplam</dt><dd>${money.format(o.subtotal)}</dd></div><div><dt>Kargo</dt><dd>${o.shippingFee ? money.format(o.shippingFee) : 'Ücretsiz'}</dd></div><div class="is-grand"><dt>Toplam</dt><dd>${money.format(o.total)}</dd></div></dl>
          </section>
          <div class="pf-side-cards">
            <section class="pf-card"><h3 class="pf-card-title">Teslimat adresi</h3><p class="pf-address">${esc(o.address.fullName)}<br>${esc(o.address.phone || '')}<br>${esc(o.address.line)}<br>${esc(o.address.district)} / ${esc(o.address.city)}</p></section>
            <section class="pf-card"><h3 class="pf-card-title">Ödeme</h3><p class="pf-address">${pay}</p></section>
            <div class="pf-actions">
              <button type="button" class="button button-primary" data-reorder="${esc(o.no)}">${svg('repeat')} Tekrar sipariş ver</button>
              <a class="button button-secondary" href="tel:+905442950945">${svg('phone')} Yardım al</a>
            </div>
          </div>
        </div>`;
    },

    adresler() {
      const list = A.current().addresses || [];
      const form = editing !== null ? addressForm(list.find((a) => a.id === editing) || {}) : '';
      return head('Adreslerim', 'Teslimat adreslerinizi yönetin.', editing === null ? `<button type="button" class="button button-primary pf-head-btn" data-address-new>${svg('plus')} Yeni adres</button>` : '') + form + (list.length ? `
        <ul class="pf-addresses">${list.map((a, i) => `
          <li class="pf-address-card${a.isDefault ? ' is-default' : ''}" style="--i:${i}">
            <div class="pf-address-top"><strong>${svg('pin')} ${esc(a.title || 'Adres')}</strong>${a.isDefault ? '<span class="pf-default">Varsayılan</span>' : ''}</div>
            <p class="pf-address">${esc(a.fullName || '')}${a.phone ? ` · ${esc(a.phone)}` : ''}<br>${esc(a.line)}<br>${esc(a.district)} / ${esc(a.city)}</p>
            <div class="pf-address-actions">
              <button type="button" class="pf-text-btn" data-address-edit="${esc(a.id)}">${svg('edit')} Düzenle</button>
              ${a.isDefault ? '' : `<button type="button" class="pf-text-btn" data-address-default="${esc(a.id)}">${svg('check')} Varsayılan yap</button>`}
              <button type="button" class="pf-text-btn is-danger" data-address-delete="${esc(a.id)}">${svg('trash')} Sil</button>
            </div>
          </li>`).join('')}</ul>` : (editing === null ? empty('Kayıtlı adresiniz yok', 'Adres ekleyerek siparişlerinizi daha hızlı tamamlayın.') : ''));
    },

    favoriler() {
      const list = favorites();
      if (!list.length) return head('Favorilerim', '') + empty('Favori ürününüz yok', 'Ürün kartlarındaki kalbe dokunarak favorilerinizi burada toplayın.', 'index.html#urunler', 'Ürünlere göz at');
      return head('Favorilerim', `${list.length} ürün`) + `
        <ul class="pf-favs">${list.map((p, i) => `
          <li class="pf-fav" style="--i:${i}">
            <div class="pf-fav-img"><img src="${esc(p.image)}" width="300" height="300" alt="${esc(p.alt)}" loading="lazy">
              <button type="button" class="pf-fav-remove" data-fav-remove="${esc(p.id)}" aria-label="${esc(p.name)} favorilerden çıkar">${svg('heart')}</button></div>
            <p class="pf-fav-cat">${esc(p.category)}</p>
            <p class="pf-fav-name">${esc(p.name)}</p>
            <p class="pf-fav-size">${esc(p.size)}</p>
            <div class="pf-fav-foot"><strong>${money.format(p.price)}</strong><button type="button" class="pf-fav-add" data-fav-add="${esc(p.id)}" aria-label="${esc(p.name)} sepete ekle">${svg('plus')}</button></div>
          </li>`).join('')}</ul>`;
    },

    bilgiler() {
      const me = A.current();
      const prefs = me.prefs || { email: true, sms: false };
      return head('Hesap bilgileri', 'Kişisel bilgilerinizi ve bildirim tercihlerinizi güncelleyin.') + `
        <form class="pf-card pf-form" data-form="profile" novalidate>
          <div class="pf-grid2">
            <div class="field"><label for="pf-name">Ad soyad</label><input id="pf-name" name="name" autocomplete="name" value="${esc(me.name)}" required><p class="field-error" hidden></p></div>
            <div class="field"><label for="pf-phone">Telefon</label><input id="pf-phone" name="phone" type="tel" autocomplete="tel" value="${esc(me.phone)}" required><p class="field-error" hidden></p></div>
            <div class="field pf-wide"><label for="pf-email">E-posta</label><input id="pf-email" type="email" value="${esc(me.email)}" readonly></div>
          </div>
          <fieldset class="pf-prefs"><legend>Bildirim tercihleri</legend>
            <label class="pf-switch"><input type="checkbox" name="pref-email" ${prefs.email ? 'checked' : ''}><span class="pf-switch-ui" aria-hidden="true"></span><span><strong>E-posta</strong><small>Kampanya ve yeni ürün duyuruları</small></span></label>
            <label class="pf-switch"><input type="checkbox" name="pref-sms" ${prefs.sms ? 'checked' : ''}><span class="pf-switch-ui" aria-hidden="true"></span><span><strong>SMS</strong><small>Sipariş ve kargo bildirimleri</small></span></label>
          </fieldset>
          <div class="pf-form-foot"><button class="button button-primary" type="submit">Değişiklikleri kaydet</button></div>
        </form>`;
    },

    guvenlik() {
      return head('Güvenlik', 'Şifrenizi değiştirin veya hesabınızı yönetin.') + `
        <form class="pf-card pf-form" data-form="password" novalidate>
          <h3 class="pf-card-title">Şifre değiştir</h3>
          <div class="pf-grid2">
            <div class="field pf-wide"><label for="pf-pass-now">Mevcut şifre</label><input id="pf-pass-now" name="current" type="password" autocomplete="current-password" required><p class="field-error" hidden></p></div>
            <div class="field"><label for="pf-pass-new">Yeni şifre</label><input id="pf-pass-new" name="next" type="password" autocomplete="new-password" required><p class="field-error" hidden></p></div>
            <div class="field"><label for="pf-pass-again">Yeni şifre (tekrar)</label><input id="pf-pass-again" name="again" type="password" autocomplete="new-password" required><p class="field-error" hidden></p></div>
          </div>
          ${A.isDemo() ? '<p class="field-hint">Demo hesapta şifre değişikliği yalnızca bu tarayıcıda geçerlidir. Demo girişi butonu her zaman çalışır.</p>' : ''}
          <p class="form-error" role="alert" hidden></p>
          <div class="pf-form-foot"><button class="button button-primary" type="submit">Şifreyi güncelle</button></div>
        </form>
        <section class="pf-card pf-danger">
          <div><h3 class="pf-card-title">Hesabı sil</h3><p class="pf-muted">Hesabınız, adresleriniz ve sipariş geçmişiniz bu tarayıcıdan kalıcı olarak silinir.</p></div>
          <button type="button" class="button pf-danger-btn" data-delete-account>Hesabı sil</button>
        </section>`;
    }
  };

  function addressForm(a) {
    return `<form class="pf-card pf-form pf-address-form" data-form="address" novalidate>
      <h3 class="pf-card-title">${a.id ? 'Adresi düzenle' : 'Yeni adres'}</h3>
      <input type="hidden" name="id" value="${esc(a.id || '')}">
      <div class="pf-grid2">
        <div class="field"><label for="pf-a-title">Adres başlığı</label><input id="pf-a-title" name="title" placeholder="Ev, iş…" value="${esc(a.title || '')}" required><p class="field-error" hidden></p></div>
        <div class="field"><label for="pf-a-name">Ad soyad</label><input id="pf-a-name" name="fullName" autocomplete="name" value="${esc(a.fullName || A.current().name)}" required><p class="field-error" hidden></p></div>
        <div class="field"><label for="pf-a-phone">Telefon</label><input id="pf-a-phone" name="phone" type="tel" autocomplete="tel" value="${esc(a.phone || A.current().phone)}" required><p class="field-error" hidden></p></div>
        <div class="field"><label for="pf-a-city">İl</label><select id="pf-a-city" name="city" required><option value="">Seçin</option>${CITIES.map((c) => `<option ${c === a.city ? 'selected' : ''}>${c}</option>`).join('')}</select><p class="field-error" hidden></p></div>
        <div class="field"><label for="pf-a-district">İlçe</label><input id="pf-a-district" name="district" value="${esc(a.district || '')}" required><p class="field-error" hidden></p></div>
        <div class="field pf-wide"><label for="pf-a-line">Açık adres</label><textarea id="pf-a-line" name="line" rows="3" required>${esc(a.line || '')}</textarea><p class="field-error" hidden></p></div>
      </div>
      <label class="check"><input type="checkbox" name="isDefault" ${a.isDefault ? 'checked' : ''}> <span>Varsayılan adresim olsun</span></label>
      <div class="pf-form-foot"><button type="button" class="button button-secondary" data-address-cancel>Vazgeç</button><button class="button button-primary" type="submit">Adresi kaydet</button></div>
    </form>`;
  }

  /* ---------- render + motion ---------- */
  function route() {
    const raw = decodeURIComponent(location.hash.slice(1)) || 'ozet';
    const [view, arg] = raw.split('/');
    return views[view] ? { view, arg } : { view: 'ozet' };
  }

  function render(focus = false) {
    if (!renderShell()) return;
    const { view, arg } = route();
    setActive(view === 'siparis' ? 'siparisler' : view);
    main.classList.remove('is-in');
    main.innerHTML = (flash ? `<p class="pf-flash" role="status">${svg('check')} ${esc(flash)}</p>` : '') + views[view](arg);
    flash = '';
    void main.offsetWidth;
    main.classList.add('is-in');
    countUp();
    const list = A.orders();
    list.forEach((o) => { seen[o.no] = o.status; });
    writeJSON(SEEN, seen);
    lastSig = list.map((o) => o.status).join('|');
    document.title = `${(NAV.find(([k]) => k === (view === 'siparis' ? 'siparisler' : view)) || [0, 'Hesabım'])[1]} | Gurme Alaşehirden`;
    if (focus) {
      const h = main.querySelector('h2');
      h?.setAttribute('tabindex', '-1');
      h?.focus({ preventScroll: true });
      if (innerWidth < 900) app.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
    }
  }

  function countUp() {
    main.querySelectorAll('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count) || 0;
      const fmt = (v) => (el.hasAttribute('data-money') ? money.format(v) : String(Math.round(v)));
      if (reduced() || !target) { el.textContent = fmt(target); return; }
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / 900);
        el.textContent = fmt(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- forms ---------- */
  function setErrors(form, errors) {
    form.querySelectorAll('.field-error').forEach((p) => { p.hidden = true; });
    form.querySelectorAll('[aria-invalid]').forEach((i) => { i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); });
    let first = null;
    for (const [name, msg] of Object.entries(errors)) {
      const input = form.elements[name];
      const out = input?.closest('.field')?.querySelector('.field-error');
      if (!input || !out) continue;
      out.id ||= `${input.id}-error`;
      out.textContent = msg; out.hidden = false;
      input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', out.id);
      first ||= input;
    }
    first?.focus();
    return !first;
  }
  const phoneOk = (v) => String(v).replace(/\D/g, '').length >= 10;

  main.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const d = Object.fromEntries(new FormData(form));
    if (form.dataset.form === 'profile') {
      if (!setErrors(form, { ...(d.name.trim().length < 3 && { name: 'Adınızı ve soyadınızı yazın.' }), ...(!phoneOk(d.phone) && { phone: 'Geçerli bir telefon yazın.' }) })) return;
      A.updateProfile(d);
      A.updatePrefs({ email: Boolean(d['pref-email']), sms: Boolean(d['pref-sms']) });
      flash = 'Bilgileriniz kaydedildi.';
      render();
    } else if (form.dataset.form === 'address') {
      const errs = {};
      if (!d.title.trim()) errs.title = 'Bir başlık yazın.';
      if (d.fullName.trim().length < 3) errs.fullName = 'Ad soyad yazın.';
      if (!phoneOk(d.phone)) errs.phone = 'Geçerli bir telefon yazın.';
      if (!d.city) errs.city = 'İl seçin.';
      if (d.district.trim().length < 2) errs.district = 'İlçeyi yazın.';
      if (d.line.trim().length < 10) errs.line = 'Açık adresi yazın.';
      if (!setErrors(form, errs)) return;
      A.upsertAddress({ id: d.id || undefined, title: d.title.trim(), fullName: d.fullName.trim(), phone: d.phone.trim(), city: d.city, district: d.district.trim(), line: d.line.trim(), isDefault: Boolean(d.isDefault) });
      editing = null;
      flash = 'Adres kaydedildi.';
      render();
    } else if (form.dataset.form === 'password') {
      const errs = {};
      if (!d.current) errs.current = 'Mevcut şifrenizi yazın.';
      if (d.next.length < 6) errs.next = 'Yeni şifre en az 6 karakter olmalı.';
      if (d.again !== d.next) errs.again = 'Şifreler eşleşmiyor.';
      if (!setErrors(form, errs)) return;
      const err = form.querySelector('.form-error');
      try {
        await A.changePassword(d.current, d.next);
        flash = 'Şifreniz güncellendi.';
        render();
      } catch (e) { err.textContent = e.message; err.hidden = false; }
    }
  });

  main.addEventListener('click', (event) => {
    const t = event.target;
    const f = t.closest('[data-filter]');
    if (f) { filter = f.dataset.filter; render(); main.querySelector(`[data-filter="${CSS.escape(filter)}"]`)?.focus(); return; }
    if (t.closest('[data-address-new]')) { editing = ''; render(); main.querySelector('.pf-address-form input:not([type=hidden])')?.focus(); return; }
    const ed = t.closest('[data-address-edit]');
    if (ed) { editing = ed.dataset.addressEdit; render(); main.querySelector('.pf-address-form input:not([type=hidden])')?.focus(); return; }
    if (t.closest('[data-address-cancel]')) { editing = null; render(); return; }
    const df = t.closest('[data-address-default]');
    if (df) { A.upsertAddress({ id: df.dataset.addressDefault, isDefault: true }); flash = 'Varsayılan adres güncellendi.'; render(); return; }
    const del = t.closest('[data-address-delete]');
    if (del) {
      if (del.dataset.confirm) { A.removeAddress(del.dataset.addressDelete); flash = 'Adres silindi.'; render(); }
      else { del.dataset.confirm = '1'; del.lastChild.textContent = ' Emin misiniz?'; del.classList.add('is-confirm'); }
      return;
    }
    const rm = t.closest('[data-fav-remove]');
    if (rm) {
      const card = rm.closest('.pf-fav');
      card.classList.add('is-leaving');
      setTimeout(() => { writeJSON(FAVS, readJSON(FAVS, []).filter((id) => id !== rm.dataset.favRemove)); window.dispatchEvent(new Event('ga-fav-change')); render(); }, reduced() ? 0 : 280);
      return;
    }
    const fa = t.closest('[data-fav-add]');
    if (fa) {
      addToCart([{ id: fa.dataset.favAdd, count: 1 }]);
      fa.classList.add('is-added');
      fa.innerHTML = svg('check');
      announce(`${byId.get(fa.dataset.favAdd)?.name} sepete eklendi.`);
      setTimeout(() => { fa.classList.remove('is-added'); fa.innerHTML = svg('plus'); }, 1400);
      return;
    }
    const ro = t.closest('[data-reorder]');
    if (ro) {
      const o = A.orders().find((x) => x.no === ro.dataset.reorder);
      if (o) { addToCart(o.items.map((i) => ({ id: i.id, count: i.count }))); location.href = 'odeme.html'; }
      return;
    }
    const da = t.closest('[data-delete-account]');
    if (da) {
      if (da.dataset.confirm) { A.deleteAccount(); location.href = 'index.html'; }
      else { da.dataset.confirm = '1'; da.textContent = 'Emin misiniz? Evet, sil'; da.classList.add('is-confirm'); }
    }
  });

  function announce(text) {
    const live = document.getElementById('pf-live');
    if (live) { live.textContent = ''; setTimeout(() => { live.textContent = text; }, 30); }
  }

  /* ---------- guest + boot ---------- */
  guest.addEventListener('click', (event) => {
    const demo = event.target.closest('[data-demo-login]');
    if (!demo) return;
    demo.classList.add('is-loading');
    A.signInDemo().then(() => { location.hash = '#ozet'; render(true); });
  });
  document.getElementById('pf-signout')?.addEventListener('click', () => { A.signOut(); location.href = 'index.html'; });

  addEventListener('hashchange', () => { editing = null; render(true); });
  // demo orders move on by themselves; refresh the order views when a status changes
  let lastSig = '';
  setInterval(() => {
    if (document.hidden || !A.current()) return;
    const { view } = route();
    if (!['ozet', 'siparisler', 'siparis'].includes(view)) return;
    if (main.contains(document.activeElement) && document.activeElement.matches('input, textarea, select')) return;
    const list = A.orders();
    if (list.map((o) => o.status).join('|') === lastSig) return;
    const moved = list.find((o) => seen[o.no] && seen[o.no] !== o.status);
    if (moved) flash = `${moved.no} ${UPDATE_MSG[moved.status] || 'güncellendi'}.`;
    render();
  }, 4000);
  A.onChange(() => render());
  addEventListener('storage', (e) => { if (e.key === FAVS) render(); });
  render();
})();
