'use strict';

// Sepete ekleme animasyonları (tüm sayfalar):
// GACart.fly(img)        ürün görseli sepete uçar, sepet ikonu zıplar
// GACart.added(product, n) "Sepetinize eklendi" kutusu açılır
(() => {
  const CART_KEY = 'gurme-alasehirden-cart-v1';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const visible = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).visibility !== 'hidden';
  };
  const cartTarget = () => [
    document.querySelector('.site-header .cart-trigger'),
    document.querySelector('.tabbar [data-tb-count]')?.closest('.tb-icon')
  ].find(visible);

  function bump(target) {
    if (!target || reduced()) return;
    target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22) rotate(-6deg)' }, { transform: 'scale(.95)' }, { transform: 'scale(1)' }], { duration: 480, easing: 'ease-out' });
    const badge = target.querySelector('.cart-count, [data-tb-count]');
    badge?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(1)' }], { duration: 420, delay: 60, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  }

  function fly(img) {
    const target = cartTarget();
    if (reduced() || !img || !target) { bump(target); return; }
    const a = img.getBoundingClientRect();
    if (!a.width) { bump(target); return; }
    const b = target.getBoundingClientRect();
    const size = Math.min(Math.max(a.width, 70), 130);
    const ghost = new Image();
    ghost.src = img.currentSrc || img.src;
    ghost.alt = '';
    ghost.className = 'ga-ghost';
    const x0 = a.left + a.width / 2 - size / 2;
    const y0 = a.top + a.height / 2 - size / 2;
    Object.assign(ghost.style, { left: `${x0}px`, top: `${y0}px`, width: `${size}px`, height: `${size}px` });
    document.body.append(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const lift = Math.min(120, Math.abs(dy) * 0.35 + 40);
    ghost.animate([
      { transform: 'translate(0,0) scale(.9) rotate(0deg)', opacity: 0, borderRadius: '1rem' },
      { transform: 'translate(0,-8px) scale(1) rotate(-3deg)', opacity: 1, offset: 0.12 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - lift}px) scale(.6) rotate(8deg)`, opacity: 1, offset: 0.55, borderRadius: '40%' },
      { transform: `translate(${dx}px, ${dy}px) scale(.12) rotate(0deg)`, opacity: 0.35, borderRadius: '50%' }
    ], { duration: 860, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' }).finished.then(() => {
      ghost.remove();
      bump(target);
    });

    // small sparkle trail at the start point
    for (let i = 0; i < 6; i += 1) {
      const s = document.createElement('span');
      s.className = 'ga-spark';
      s.style.left = `${a.left + a.width / 2}px`;
      s.style.top = `${a.top + a.height / 2}px`;
      document.body.append(s);
      const ang = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
      const dist = 26 + Math.random() * 22;
      s.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(0)`, opacity: 0 }
      ], { duration: 560, easing: 'cubic-bezier(.2,.7,.3,1)' }).finished.then(() => s.remove());
    }
  }

  /* ---------- "added" panel ---------- */
  let panel; let hideTimer;
  function ensurePanel() {
    if (panel) return panel;
    const onHome = Boolean(document.getElementById('cart-dialog'));
    panel = document.createElement('aside');
    panel.className = 'pdp-added ga-added';
    panel.hidden = true;
    panel.setAttribute('aria-labelledby', 'ga-added-title');
    panel.innerHTML = `
      <div class="pdp-added-head">
        <p id="ga-added-title"><span class="pdp-added-check"><svg class="pdp-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></span> Sepetinize eklendi</p>
        <button type="button" class="pdp-added-close" aria-label="Kapat"><svg class="pdp-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      </div>
      <div class="pdp-added-item"><img width="96" height="96" alt=""><div><strong></strong><span></span></div></div>
      <p class="pdp-added-sum"><span class="ga-added-count"></span><strong class="ga-added-total"></strong></p>
      <div class="pdp-added-actions">
        ${onHome ? '<button type="button" class="button button-secondary" data-open="cart">Sepete git</button>' : '<a class="button button-secondary" href="index.html?panel=cart">Sepete git</a>'}
        <a class="button button-primary" href="odeme.html">Siparişi tamamla</a>
      </div>`;
    document.body.append(panel);
    panel.querySelector('.pdp-added-close').addEventListener('click', hide);
    panel.querySelector('[data-open="cart"]')?.addEventListener('click', () => hide());
    panel.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    panel.addEventListener('focusin', () => clearTimeout(hideTimer));
    panel.addEventListener('mouseleave', () => { hideTimer = setTimeout(hide, 2500); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
    return panel;
  }
  function hide() {
    clearTimeout(hideTimer);
    if (!panel || panel.hidden) return;
    panel.classList.remove('is-open');
    setTimeout(() => { if (!panel.classList.contains('is-open')) panel.hidden = true; }, reduced() ? 0 : 350);
  }
  function added(product, count = 1) {
    if (!product) return;
    const p = ensurePanel();
    let cart = {};
    try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { /* ignore */ }
    const list = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
    const n = Object.values(cart).reduce((a, c) => a + (Number(c) || 0), 0);
    const total = Object.entries(cart).reduce((a, [id, c]) => a + (list.find((x) => x.id === id)?.price || 0) * (Number(c) || 0), 0);
    p.querySelector('.pdp-added-item img').src = product.image;
    p.querySelector('.pdp-added-item strong').textContent = product.name;
    p.querySelector('.pdp-added-item span').textContent = `${count} adet eklendi · ${money.format(product.price)}`;
    p.querySelector('.ga-added-count').textContent = `Sepette ${n} ürün`;
    p.querySelector('.ga-added-total').textContent = money.format(total);
    const wasOpen = !p.hidden && p.classList.contains('is-open');
    p.hidden = false;
    if (wasOpen && !reduced()) p.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.025)' }, { transform: 'scale(1)' }], { duration: 300 });
    requestAnimationFrame(() => p.classList.add('is-open'));
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 4500);
  }

  window.GACart = { fly, added, hide, bump: () => bump(cartTarget()), esc };
  /* ---------- studio signature: draws itself once in view ---------- */
  const sign = document.querySelector('.studio-sign');
  if (sign && 'IntersectionObserver' in window) {
    const so = new IntersectionObserver(([en]) => { if (en.isIntersecting) { sign.classList.add('is-drawn'); so.disconnect(); } }, { threshold: 0.6 });
    so.observe(sign);
  } else sign?.classList.add('is-drawn');
})();
