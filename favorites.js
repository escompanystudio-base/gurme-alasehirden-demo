'use strict';

// Favorilerim sayfası (favoriler.html)
(() => {
  const FAV_KEY = 'gurme-alasehirden-favorites-v1';
  const CART_KEY = 'gurme-alasehirden-cart-v1';
  const MAX_QTY = 99;
  const root = document.getElementById('fv-root');
  const live = document.getElementById('fv-live');
  if (!root) return;

  const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const url = (p) => `urun.html?id=${encodeURIComponent(p.id)}`;
  const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
  const P = {
    heart: 'M20.3 9c0 4.1-8.3 9.6-8.3 9.6S3.7 13.1 3.7 9a4.3 4.3 0 0 1 8.3-1.6 4.3 4.3 0 0 1 8.3 1.6Z',
    bag: 'M5.2 8h13.6l1.3 13H3.9L5.2 8Z M9 10V6a3 3 0 1 1 6 0v4',
    check: 'm5 12 4 4L19 6',
    plus: 'M12 5v14M5 12h14',
    arrow: 'M5 12h14m-5-5 5 5-5 5'
  };
  const ico = (n, cls = '') => `<svg class="pdp-ico ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;

  const readJSON = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
  const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };
  const readFavs = () => { const v = readJSON(FAV_KEY, []); return (Array.isArray(v) ? v : []).filter((id) => byId.has(id)); };
  const saveFavs = (ids) => { writeJSON(FAV_KEY, ids); window.dispatchEvent(new Event('ga-fav-change')); };
  const readCart = () => { const v = readJSON(CART_KEY, {}); return v && typeof v === 'object' ? v : {}; };
  const addToCart = (ids) => {
    const cart = readCart();
    let n = 0;
    ids.forEach((id) => { const cur = Math.max(0, Math.floor(Number(cart[id]) || 0)); if (cur < MAX_QTY) { cart[id] = cur + 1; n += 1; } });
    writeJSON(CART_KEY, cart);
    window.dispatchEvent(new Event('ga-cart-change'));
    return n;
  };

  const card = (p, i) => `
    <article class="pdp-card fv-card" data-id="${esc(p.id)}" style="--i:${i}; view-transition-name: fv-${esc(p.id.replace(/[^a-z0-9-]/gi, ''))}">
      <a class="pdp-card-photo" href="${url(p)}" tabindex="-1" aria-hidden="true"><img src="${esc(p.image)}" width="400" height="400" alt="" loading="lazy"></a>
      <button type="button" class="fv-remove" data-remove="${esc(p.id)}" aria-label="${esc(p.name)} favorilerden çıkar">${ico('heart')}</button>
      <div class="pdp-card-body">
        <p class="pdp-card-cat">${esc(p.category)}</p>
        <h2 class="pdp-card-name"><a href="${url(p)}">${esc(p.name)}</a></h2>
        <p class="pdp-card-size">${esc(p.size)}</p>
        <p class="fv-price">${money.format(p.price)}</p>
        <button type="button" class="button button-primary fv-add" data-add="${esc(p.id)}">
          <span class="fv-add-label">${ico('bag')} Sepete ekle</span>
          <span class="fv-add-done" aria-hidden="true">${ico('check')} Eklendi</span>
        </button>
      </div>
    </article>`;

  const suggestion = (p, i) => `
    <article class="pdp-card fv-sug" style="--i:${i}">
      <a class="pdp-card-photo" href="${url(p)}" tabindex="-1" aria-hidden="true"><img src="${esc(p.image)}" width="400" height="400" alt="" loading="lazy"></a>
      <button type="button" class="fv-remove fv-like" data-like="${esc(p.id)}" aria-pressed="false" aria-label="${esc(p.name)} favorilere ekle">${ico('heart')}</button>
      <div class="pdp-card-body">
        <p class="pdp-card-cat">${esc(p.category)}</p>
        <h3 class="pdp-card-name"><a href="${url(p)}">${esc(p.name)}</a></h3>
        <p class="pdp-card-size">${esc(p.size)}</p>
        <div class="pdp-card-foot"><strong>${money.format(p.price)}</strong></div>
      </div>
    </article>`;

  let lastRemoved = null;

  function render() {
    const ids = readFavs();
    const list = ids.map((id) => byId.get(id));
    if (!list.length) {
      const picks = PRODUCTS.filter((_, i) => [1, 2, 4, 7, 10, 13].includes(i)).slice(0, 4);
      root.innerHTML = `
        <section class="fv-empty">
          <svg class="fv-empty-heart" viewBox="0 0 24 24" aria-hidden="true"><path d="${P.heart}"/></svg>
          <h1>Favori listeniz boş</h1>
          <p>Beğendiğiniz ürünlerdeki kalbe dokunun, burada toplansın. Daha sonra tek dokunuşla sepete ekleyebilirsiniz.</p>
          <a class="button button-primary" href="index.html#urunler">Ürünlere göz at ${ico('arrow')}</a>
        </section>
        <section class="pdp-rail" aria-labelledby="fv-sug-title">
          <div class="pdp-rail-head is-in"><h2 id="fv-sug-title">Beğenebileceğiniz ürünler</h2></div>
          <div class="pdp-grid">${picks.map(suggestion).join('')}</div>
        </section>`;
      reveal();
      return;
    }
    const total = list.reduce((a, p) => a + p.price, 0);
    root.innerHTML = `
      <header class="fv-head">
        <div>
          <h1>Favorilerim</h1>
          <p><strong>${list.length} ürün</strong> <span aria-hidden="true">·</span> toplam ${money.format(total)}</p>
        </div>
        <button type="button" class="button button-primary fv-all" id="fv-all">${ico('bag')} Tümünü sepete ekle</button>
      </header>
      <div class="pdp-grid fv-grid">${list.map(card).join('')}</div>
      <p class="fv-note">Favorileriniz bu cihazda saklanır.</p>`;
    reveal();
  }

  function reveal() {
    const els = root.querySelectorAll('.pdp-card');
    if (reduced() || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -5% 0px' });
    els.forEach((el) => io.observe(el));
  }

  const transition = (fn) => {
    if (!document.startViewTransition || reduced()) { fn(); return; }
    const t = document.startViewTransition(fn);
    [t.ready, t.finished, t.updateCallbackDone].forEach((pr) => pr.catch(() => {}));
  };

  /* ---------- undo toast ---------- */
  const toast = document.createElement('div');
  toast.className = 'fv-toast';
  toast.hidden = true;
  toast.innerHTML = '<span class="fv-toast-text"></span><button type="button" class="fv-undo">Geri al</button>';
  document.body.append(toast);
  let toastTimer;
  function showToast(text) {
    toast.querySelector('.fv-toast-text').textContent = text;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add('is-open'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 5000);
  }
  function hideToast() {
    toast.classList.remove('is-open');
    setTimeout(() => { if (!toast.classList.contains('is-open')) toast.hidden = true; }, 300);
  }
  toast.querySelector('.fv-undo').addEventListener('click', () => {
    if (!lastRemoved) return;
    const ids = readFavs();
    ids.splice(Math.min(lastRemoved.index, ids.length), 0, lastRemoved.id);
    saveFavs(ids);
    live.textContent = `${byId.get(lastRemoved.id).name} favorilere geri eklendi.`;
    lastRemoved = null;
    hideToast();
    transition(render);
  });

  /* ---------- actions ---------- */
  root.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-remove]');
    const add = e.target.closest('[data-add]');
    const like = e.target.closest('[data-like]');
    const all = e.target.closest('#fv-all');

    if (rm) {
      const id = rm.dataset.remove;
      const ids = readFavs();
      const index = ids.indexOf(id);
      if (index < 0) return;
      const cardEl = rm.closest('.fv-card');
      cardEl.classList.add('is-leaving');
      const p = byId.get(id);
      setTimeout(() => {
        ids.splice(index, 1);
        saveFavs(ids);
        lastRemoved = { id, index };
        live.textContent = `${p.name} favorilerden çıkarıldı.`;
        transition(() => {
          render();
          const next = root.querySelectorAll('[data-remove]')[Math.min(index, root.querySelectorAll('[data-remove]').length - 1)];
          (next || root.querySelector('.fv-empty a'))?.focus({ preventScroll: true });
        });
        showToast(`${p.name} favorilerden çıkarıldı.`);
      }, reduced() ? 0 : 260);
    } else if (add) {
      const p = byId.get(add.dataset.add);
      if (!addToCart([p.id])) { live.textContent = `Bu üründen en fazla ${MAX_QTY} adet ekleyebilirsiniz.`; return; }
      add.classList.add('is-done');
      setTimeout(() => add.classList.remove('is-done'), 1600);
      window.GACart?.fly(add.closest('.fv-card')?.querySelector('img'));
      window.GACart?.added(p, 1);
      live.textContent = `${p.name} sepete eklendi.`;
    } else if (like) {
      const ids = readFavs();
      if (!ids.includes(like.dataset.like)) ids.push(like.dataset.like);
      saveFavs(ids);
      like.setAttribute('aria-pressed', 'true');
      like.classList.add('pop');
      live.textContent = `${byId.get(like.dataset.like).name} favorilerinize eklendi.`;
      setTimeout(() => transition(render), reduced() ? 0 : 450);
    } else if (all) {
      const ids = readFavs();
      const n = addToCart(ids);
      all.classList.add('is-done');
      all.innerHTML = `${ico('check')} ${n} ürün sepete eklendi`;
      live.textContent = `${n} ürün sepete eklendi.`;
      if (window.GACart) root.querySelectorAll('.fv-card img').forEach((im, i) => setTimeout(() => window.GACart.fly(im), reduced() ? 0 : i * 110));
      setTimeout(() => { all.classList.remove('is-done'); all.innerHTML = `${ico('bag')} Tümünü sepete ekle`; }, 2000);
      root.querySelectorAll('.fv-add').forEach((b, i) => setTimeout(() => { b.classList.add('is-done'); setTimeout(() => b.classList.remove('is-done'), 1400); }, reduced() ? 0 : i * 70));
    }
  });

  addEventListener('storage', (e) => { if (e.key === FAV_KEY || e.key === null) render(); });
  addEventListener('pageshow', (e) => { if (e.persisted) render(); });
  render();
})();
