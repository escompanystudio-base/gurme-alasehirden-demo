'use strict';

// Mobil arama ekranı: alt bardaki "Ara" sekmesi tam ekran bir arama açar.
(() => {
  if (typeof PRODUCTS === 'undefined') return;
  const MOBILE = '(max-width: 790px)';
  const RECENT_KEY = 'ga-search-recent-v1';
  const POPULAR = ['Tarhana', 'Salça', 'Asma yaprağı', 'Zeytin', 'Kuru üzüm', 'Turşu'];
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 });
  const fold = (s) => String(s).toLocaleLowerCase('tr').replace(/[çğıöşüâî]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i' }[c]));
  const url = (p) => `urun.html?id=${encodeURIComponent(p.id)}`;
  const ico = (d, cls = '') => `<svg class="ms-ico ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const I = {
    search: 'M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z m-1 5.5 4.5 4.5',
    close: 'm6 6 12 12M18 6 6 18',
    clock: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z M12 7.5V12l3 2',
    trend: 'm3.5 16 5.5-5.5 4 4 7-7.5 M15 7h5v5',
    arrow: 'M5 12h14m-5-5 5 5-5 5',
    up: 'M7 17 17 7M9 7h8v8'
  };

  const readRecent = () => { try { const v = JSON.parse(localStorage.getItem(RECENT_KEY)); return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 6) : []; } catch { return []; } };
  const saveRecent = (q) => {
    const clean = q.trim().slice(0, 60);
    if (!clean) return;
    const list = [clean, ...readRecent().filter((x) => fold(x) !== fold(clean))].slice(0, 6);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  };

  const index = PRODUCTS.map((p) => ({ p, hay: fold(`${p.name} ${p.category} ${p.size} ${p.description}`), name: fold(p.name) }));
  function search(q) {
    const words = fold(q).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return index
      .filter((x) => words.every((w) => x.hay.includes(w)))
      .map((x) => ({ ...x, score: words.reduce((a, w) => a + (x.name.startsWith(w) ? 3 : x.name.includes(w) ? 2 : 1), 0) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p);
  }
  function highlight(text, q) {
    const words = fold(q).trim().split(/\s+/).filter((w) => w.length > 0);
    if (!words.length) return esc(text);
    const f = fold(text);
    const marks = new Array(text.length).fill(false);
    words.forEach((w) => { let i = f.indexOf(w); while (i >= 0) { for (let k = i; k < i + w.length; k += 1) marks[k] = true; i = f.indexOf(w, i + w.length); } });
    let out = ''; let open = false;
    [...text].forEach((ch, i) => {
      if (marks[i] && !open) { out += '<mark>'; open = true; }
      if (!marks[i] && open) { out += '</mark>'; open = false; }
      out += esc(ch);
    });
    return open ? `${out}</mark>` : out;
  }

  const cats = CATEGORIES.filter((c) => c.id !== 'all').map((c) => {
    const items = PRODUCTS.filter((p) => p.filters.includes(c.id));
    return { ...c, count: items.length, image: items[0]?.image };
  }).filter((c) => c.count);

  /* ---------- markup ---------- */
  const dlg = document.createElement('dialog');
  dlg.className = 'msearch';
  dlg.setAttribute('aria-label', 'Ürün ara');
  dlg.innerHTML = `
    <form class="ms-bar" role="search" action="index.html" method="get">
      <label class="ms-field">
        ${ico(I.search, 'ms-lens')}
        <span class="visually-hidden">Ürün ara</span>
        <input type="search" name="arama" enterkeyhint="search" autocomplete="off" maxlength="80" placeholder="Ne arıyorsunuz?">
        <button type="button" class="ms-clear" aria-label="Aramayı temizle" hidden>${ico(I.close)}</button>
      </label>
      <button type="button" class="ms-cancel">Vazgeç</button>
    </form>
    <div class="ms-body"></div>
    <p class="visually-hidden ms-status" role="status" aria-live="polite"></p>`;
  document.body.append(dlg);
  const form = dlg.querySelector('form');
  const input = dlg.querySelector('input');
  const clear = dlg.querySelector('.ms-clear');
  const body = dlg.querySelector('.ms-body');
  const status = dlg.querySelector('.ms-status');

  function renderIdle() {
    const recent = readRecent();
    body.innerHTML = `
      ${recent.length ? `<section class="ms-sec" style="--i:0">
        <div class="ms-sec-head"><h2>Son aramalar</h2><button type="button" class="ms-link" data-clear-recent>Temizle</button></div>
        <ul class="ms-recent">${recent.map((r) => `<li><button type="button" data-q="${esc(r)}">${ico(I.clock)}<span>${esc(r)}</span>${ico(I.up, 'ms-fill')}</button></li>`).join('')}</ul>
      </section>` : ''}
      <section class="ms-sec" style="--i:1">
        <div class="ms-sec-head"><h2>Popüler aramalar</h2></div>
        <div class="ms-chips">${POPULAR.map((q, i) => `<button type="button" data-q="${esc(q)}" style="--c:${i}">${ico(I.trend)}${esc(q)}</button>`).join('')}</div>
      </section>
      <section class="ms-sec" style="--i:2">
        <div class="ms-sec-head"><h2>Kategoriler</h2></div>
        <div class="ms-cats">${cats.map((c, i) => `<a href="index.html?kategori=${c.id}#urunler" style="--c:${i}">
          <img src="${esc(c.image)}" width="160" height="160" alt="" loading="lazy">
          <span><strong>${esc(c.label)}</strong>${c.count} ürün</span></a>`).join('')}</div>
      </section>`;
    status.textContent = '';
  }

  function renderResults(q) {
    const list = search(q);
    status.textContent = `${list.length} ürün bulundu.`;
    if (!list.length) {
      body.innerHTML = `<section class="ms-none">
        <span class="ms-none-ico">${ico(I.search)}</span>
        <h2>Sonuç bulunamadı</h2>
        <p>“${esc(q.trim())}” ile eşleşen ürün yok. Yazımı kontrol edin ya da şunlardan birini deneyin:</p>
        <div class="ms-chips">${POPULAR.map((x, i) => `<button type="button" data-q="${esc(x)}" style="--c:${i}">${ico(I.trend)}${esc(x)}</button>`).join('')}</div>
      </section>`;
      return;
    }
    body.innerHTML = `
      <p class="ms-count"><strong>${list.length}</strong> ürün bulundu</p>
      <ul class="ms-results">${list.slice(0, 12).map((p, i) => `<li style="--c:${i}"><a href="${url(p)}" data-result>
        <img src="${esc(p.image)}" width="112" height="112" alt="" loading="lazy">
        <span class="ms-r-text"><strong>${highlight(p.name, q)}</strong><small>${esc(p.category)} · ${esc(p.size)}</small></span>
        <span class="ms-r-price">${money.format(p.price)}</span></a></li>`).join('')}</ul>
      <a class="ms-all" href="index.html?arama=${encodeURIComponent(q.trim())}#urunler" data-result>Tüm sonuçları ürünlerde gör ${ico(I.arrow)}</a>`;
  }

  let timer;
  function update() {
    const q = input.value;
    clear.hidden = !q;
    clearTimeout(timer);
    timer = setTimeout(() => (q.trim() ? renderResults(q) : renderIdle()), 90);
  }
  input.addEventListener('input', update);
  clear.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
  form.addEventListener('submit', (e) => {
    const q = input.value.trim();
    if (!q) { e.preventDefault(); return; }
    saveRecent(q);
    e.preventDefault();
    location.href = `index.html?arama=${encodeURIComponent(q)}#urunler`;
  });
  body.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-q]');
    if (chip) { input.value = chip.dataset.q; update(); clearTimeout(timer); renderResults(input.value); input.focus({ preventScroll: true }); return; }
    if (e.target.closest('[data-clear-recent]')) { try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ } renderIdle(); input.focus({ preventScroll: true }); return; }
    if (e.target.closest('[data-result]')) saveRecent(input.value);
  });

  /* ---------- open / close ---------- */
  let origin = '50% 100%';
  function open(from) {
    if (dlg.open) return;
    const r = from?.getBoundingClientRect();
    origin = r ? `${Math.round(r.left + r.width / 2)}px ${Math.round(r.top + r.height / 2)}px` : '50% 100%';
    dlg.style.setProperty('--ms-origin', origin);
    input.value = '';
    clear.hidden = true;
    renderIdle();
    dlg.showModal();
    document.documentElement.classList.add('ms-lock');
    requestAnimationFrame(() => dlg.classList.add('is-open'));
    input.focus({ preventScroll: true });
  }
  function close() {
    if (!dlg.open || dlg.classList.contains('is-closing')) return;
    dlg.classList.remove('is-open');
    dlg.classList.add('is-closing');
    document.documentElement.classList.remove('ms-lock');
    setTimeout(() => { dlg.classList.remove('is-closing'); dlg.close(); }, reduced() ? 0 : 380);
  }
  dlg.querySelector('.ms-cancel').addEventListener('click', close);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab="search"], .header-search-trigger, .header-actions a[href*="panel=search"]');
    if (!t || !matchMedia(MOBILE).matches) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    open(t);
  }, true);

  // index.html?panel=search on phones opens this screen instead of the small dialog
  if (matchMedia(MOBILE).matches && new URLSearchParams(location.search).get('panel') === 'search') {
    addEventListener('load', () => {
      document.getElementById('search-dialog')?.close?.();
      const u = new URL(location.href); u.searchParams.delete('panel'); history.replaceState(null, '', u);
      open(document.querySelector('[data-tab="search"]'));
    });
  }
  addEventListener('pageshow', (e) => { if (e.persisted && dlg.open) { dlg.classList.remove('is-open', 'is-closing'); dlg.close(); document.documentElement.classList.remove('ms-lock'); } });
  window.GASearch = { open, close };
})();
