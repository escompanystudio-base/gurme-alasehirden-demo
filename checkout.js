'use strict';

/* Demo checkout: reads the cart from localStorage, validates the form,
   "places" the order locally and shows a confirmation. No network calls,
   card numbers are never stored (only the last four digits). */
(() => {
  const CART = 'gurme-alasehirden-cart-v1';
  const $ = (id) => document.getElementById(id);
  const root = $('checkout-root');
  if (!root) return;

  const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
  const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 });
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const form = $('checkout-form');
  const acct = () => window.GAAccount;
  const smooth = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  let placed = false;

  function readCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART)) || {};
      return Object.entries(raw)
        .map(([id, count]) => ({ product: byId.get(id), count: Number(count) }))
        .filter((e) => e.product && typeof raw[e.product.id] === 'number' && Number.isInteger(e.count) && e.count > 0)
        .map((e) => ({ ...e, count: Math.min(e.count, 99) }));
    } catch { return []; }
  }

  let cart = readCart();
  const subtotal = () => cart.reduce((sum, e) => sum + e.product.price * e.count, 0);

  function renderSummary() {
    $('co-items').innerHTML = cart.map(({ product, count }) => `
      <li class="co-item">
        <span class="co-item-img"><img src="${esc(product.image)}" width="96" height="96" alt="" loading="lazy"><span class="co-item-qty">${count}</span></span>
        <span class="co-item-text"><strong>${esc(product.name)}</strong><small>${esc(product.size)}</small></span>
        <span class="co-item-price">${money.format(product.price * count)}</span>
      </li>`).join('');
    const total = money.format(subtotal());
    $('co-subtotal').textContent = total;
    $('co-total').textContent = total;
    $('co-submit-total').textContent = total;
  }

  /* ---------- prefill from the signed-in account ---------- */
  function applyAccount() {
    const me = acct()?.current();
    document.querySelectorAll('[data-guest-only]').forEach((el) => { el.hidden = Boolean(me); });
    document.querySelectorAll('[data-member-only]').forEach((el) => { el.hidden = !me; });
    if (!me) { $('co-saved').hidden = true; form.elements.email.readOnly = false; return; }
    for (const [name, value] of [['name', me.name], ['phone', me.phone]]) {
      const input = form.elements[name];
      if (input && !input.value) input.value = value;
    }
    form.elements.email.value = me.email;
    form.elements.email.readOnly = true;
    const list = me.addresses || [];
    const saved = $('co-saved');
    saved.hidden = !list.length;
    saved.innerHTML = list.length ? `<p class="co-saved-title">Kayıtlı adresleriniz</p><div class="co-saved-list">${list.map((a, i) => `
      <button type="button" class="co-saved-item" data-address="${i}">
        <strong>${esc(a.title || 'Adres')}</strong><span>${esc(a.line)}, ${esc(a.district)} / ${esc(a.city)}</span>
      </button>`).join('')}</div>` : '';
    if (list.length && !form.elements.line.value) fillAddress(list[0], 0);
  }

  function fillAddress(a, index) {
    form.elements.city.value = a.city;
    form.elements.district.value = a.district;
    form.elements.line.value = a.line;
    form.elements.title.value = a.title || '';
    document.querySelectorAll('.co-saved-item').forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
  }

  $('co-saved').addEventListener('click', (event) => {
    const b = event.target.closest('[data-address]');
    if (!b) return;
    const a = acct()?.current()?.addresses?.[Number(b.dataset.address)];
    if (a) fillAddress(a, Number(b.dataset.address));
  });

  /* ---------- payment method + card formatting ---------- */
  const card = $('co-card');
  const syncPayment = () => {
    const method = form.elements.payment.value;
    card.hidden = method !== 'card';
    card.querySelectorAll('input').forEach((i) => { i.required = method === 'card'; });
  };
  ['change', 'input', 'click'].forEach((type) => form.addEventListener(type, (event) => { if (event.target.name === 'payment') syncPayment(); }));

  form.elements.ccNumber.addEventListener('input', (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  });
  form.elements.ccExp.addEventListener('input', (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 4);
    e.target.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  });
  form.elements.ccCvc.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); });
  form.elements.phone.addEventListener('blur', (e) => {
    const d = e.target.value.replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('0')) e.target.value = `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
  });

  const luhn = (num) => {
    let sum = 0;
    [...num].reverse().forEach((ch, i) => {
      let n = Number(ch);
      if (i % 2) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
    });
    return sum % 10 === 0;
  };

  /* ---------- validation ---------- */
  function setError(input, message) {
    const box = input.closest('.field');
    const out = box?.querySelector('.field-error');
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      if (out) { out.textContent = message; out.hidden = false; out.id ||= `${input.id}-error`; input.setAttribute('aria-errormessage', out.id); input.setAttribute('aria-describedby', out.id); }
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-errormessage');
      input.removeAttribute('aria-describedby');
      if (out) { out.textContent = ''; out.hidden = true; }
    }
  }
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid')) setError(e.target, ''); });

  function validate() {
    const f = form.elements;
    const checks = [
      [f.name, f.name.value.trim().length >= 3, 'Adınızı ve soyadınızı yazın.'],
      [f.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim()), 'Geçerli bir e-posta adresi yazın.'],
      [f.phone, f.phone.value.replace(/\D/g, '').length >= 10, 'Geçerli bir telefon numarası yazın.'],
      [f.city, Boolean(f.city.value), 'İl seçin.'],
      [f.district, f.district.value.trim().length >= 2, 'İlçeyi yazın.'],
      [f.line, f.line.value.trim().length >= 10, 'Açık adresinizi yazın.']
    ];
    if (f.payment.value === 'card') {
      const num = f.ccNumber.value.replace(/\D/g, '');
      const [mm, yy] = f.ccExp.value.split('/').map(Number);
      const now = new Date();
      const expOk = mm >= 1 && mm <= 12 && yy >= 0 && new Date(2000 + yy, mm, 1) > now;
      checks.push(
        [f.ccName, f.ccName.value.trim().length >= 3, 'Kart üzerindeki ismi yazın.'],
        [f.ccNumber, num.length >= 15 && luhn(num), 'Kart numarası geçersiz. Demo için 4242 4242 4242 4242 kullanın.'],
        [f.ccExp, expOk, 'Geçerli bir son kullanma tarihi yazın (AA/YY).'],
        [f.ccCvc, /^\d{3,4}$/.test(f.ccCvc.value), 'CVC 3 veya 4 haneli olmalı.']
      );
    }
    let first = null;
    for (const [input, ok, msg] of checks) {
      setError(input, ok ? '' : msg);
      if (!ok && !first) first = input;
    }
    const err = $('co-form-error');
    if (!f.terms.checked) {
      err.textContent = 'Devam etmek için satış ve cayma koşullarını onaylayın.';
      err.hidden = false;
      f.terms.setAttribute('aria-invalid', 'true');
      f.terms.setAttribute('aria-describedby', 'co-form-error');
      if (!first) first = f.terms;
    } else {
      err.hidden = true;
      f.terms.removeAttribute('aria-invalid');
      f.terms.removeAttribute('aria-describedby');
    }
    if (first) { first.focus({ preventScroll: true }); first.scrollIntoView({ block: 'center', behavior: smooth() }); }
    return !first;
  }

  /* ---------- place order ---------- */
  const methodLabel = { card: 'Kredi veya banka kartı', transfer: 'Havale / EFT', cod: 'Kapıda ödeme' };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!cart.length || !validate()) return;
    const f = form.elements;
    const btn = form.querySelector('.co-submit');
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.querySelector('.co-submit-label').textContent = 'Ödeme işleniyor';
    form.setAttribute('aria-busy', 'true');
    $('co-status').textContent = 'Ödemeniz işleniyor, lütfen bekleyin.';

    const me = acct()?.current();
    const address = { title: f.title.value.trim(), fullName: f.name.value.trim(), phone: f.phone.value.trim(), city: f.city.value, district: f.district.value.trim(), line: f.line.value.trim() };
    const order = {
      no: `GA-${Date.now().toString(36).slice(-4).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`,
      date: Date.now(),
      email: (me?.email || f.email.value).trim().toLowerCase(),
      name: address.fullName,
      address,
      shipping: 'Standart kargo',
      payment: { method: f.payment.value, label: methodLabel[f.payment.value], last4: f.payment.value === 'card' ? f.ccNumber.value.replace(/\D/g, '').slice(-4) : '' },
      note: f.note.value.trim(),
      items: cart.map(({ product, count }) => ({ id: product.id, name: product.name, size: product.size, price: product.price, image: product.image, count })),
      subtotal: subtotal(),
      shippingFee: 0,
      total: subtotal(),
      status: f.payment.value === 'transfer' ? 'Sipariş alındı' : 'Hazırlanıyor',
      sim: true
    };

    // clear card fields right away; they are never stored
    ['ccNumber', 'ccExp', 'ccCvc', 'ccName'].forEach((n) => { f[n].value = ''; });

    runProcessing(order.payment.method).then(() => {
      placed = true;
      acct()?.addOrder(order);
      if (me && f.saveAddress?.checked) acct().saveAddress(address);
      try { localStorage.removeItem(CART); } catch { /* storage blocked */ }
      window.dispatchEvent(new Event('ga-cart-change'));
      showDone(order, Boolean(me));
    });
  });

  /* ---------- processing screen ---------- */
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>';
  const PROC = {
    card: ['Kartınız doğrulanıyor', 'Ödeme başarılı', 'Siparişiniz hazırlanıyor.'],
    transfer: ['Havale bilgileri hazırlanıyor', 'Siparişiniz ayrıldı', 'Ödemeniz gelince hazırlamaya başlıyoruz.'],
    cod: ['Siparişiniz onaylanıyor', 'Sipariş onaylandı', 'Ödemeyi teslimatta yapacaksınız.']
  };
  function runProcessing(method) {
    const steps = [
      'Güvenli bağlantı kuruldu',
      method === 'card' ? 'Ödeme onaylandı' : method === 'transfer' ? 'Havale bilgileri hazırlandı' : 'Kapıda ödeme seçildi',
      'Siparişiniz oluşturuldu'
    ];
    const ov = document.createElement('div');
    ov.className = `co-proc co-proc-${method}`;
    ov.setAttribute('role', 'alertdialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-labelledby', 'co-proc-title');
    ov.innerHTML = `
      <div class="co-proc-card">
        <div class="co-proc-ring" aria-hidden="true">
          <svg class="co-proc-spin" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36"/></svg>
          <span class="co-proc-lock co-proc-pay">${window.GAArt ? window.GAArt.pay(method) : ''}</span>
          <svg class="co-proc-ok" viewBox="0 0 24 24">${tick.replace(/<\/?svg[^>]*>/g, '')}</svg>
        </div>
        <h2 id="co-proc-title">${PROC[method][0]}</h2>
        <p class="co-proc-sub">Lütfen sayfayı kapatmayın.</p>
        <ol class="co-proc-steps">${steps.map((t) => `<li><span class="co-proc-dot" aria-hidden="true">${tick}</span><span>${t}</span></li>`).join('')}</ol>
        <div class="co-proc-bar" aria-hidden="true"><span></span></div>
      </div>`;
    document.body.append(ov);
    document.documentElement.classList.add('co-lock');
    const main = document.getElementById('main');
    if (main) main.inert = true;
    requestAnimationFrame(() => ov.classList.add('is-on'));
    const fast = reducedMotion();
    const wait = (ms) => new Promise((r) => setTimeout(r, fast ? 0 : ms));
    const items = [...ov.querySelectorAll('.co-proc-steps li')];
    return (async () => {
      await wait(350);
      for (let i = 0; i < items.length; i += 1) {
        items[i].classList.add('is-active');
        ov.style.setProperty('--p', String((i + 0.5) / items.length));
        await wait(620);
        items[i].classList.remove('is-active');
        items[i].classList.add('is-done');
        ov.style.setProperty('--p', String((i + 1) / items.length));
        $('co-status').textContent = items[i].textContent;
      }
      ov.classList.add('is-success');
      ov.querySelector('h2').textContent = PROC[method][1];
      ov.querySelector('.co-proc-sub').textContent = PROC[method][2];
      await wait(900);
      ov.classList.add('is-out');
      if (main) main.inert = false;
      document.documentElement.classList.remove('co-lock');
      setTimeout(() => ov.remove(), fast ? 0 : 500);
    })();
  }


  const doneAccountButton = (member) => (member
    ? '<button type="button" class="button button-primary" data-account="orders">Siparişlerim</button>'
    : '<button type="button" class="button button-primary" data-account="register">Hesap oluşturun, siparişlerinizi görün</button>');

  const DONE_KIND = {
    card: 'Ödemeniz kartınızdan alındı, siparişiniz hazırlanıyor.',
    transfer: 'Siparişiniz ayrıldı. Havale veya EFT ödemeniz ulaşınca hazırlamaya başlıyoruz.',
    cod: 'Siparişiniz onaylandı. Ödemeyi ürün kapınıza geldiğinde yapacaksınız.'
  };
  const tickSvg = '<svg class="pf-dot-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>';
  function doneTrack(method) {
    const labels = method === 'transfer' ? ['Sipariş alındı', 'Ödeme bekleniyor', 'Hazırlanıyor', 'Kargoda'] : ['Sipariş alındı', 'Hazırlanıyor', 'Kargoda', 'Teslim edildi'];
    return `<ol class="pf-timeline done-track" style="--step:1" aria-label="Sipariş durumu: ${labels[1]}">
      ${labels.map((l, i) => `<li class="${i < 1 ? 'is-done' : i === 1 ? 'is-current' : ''}"><span class="pf-dot">${i < 1 ? tickSvg : i === 1 ? (method === 'transfer' ? '<svg class="pf-dot-ico done-clock" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5"/><path class="done-clock-hand" d="M12 12V7.6"/></svg>' : tickSvg) : ''}</span><span class="pf-step-label">${l}</span></li>`).join('')}
    </ol>`;
  }
  function doneScene(order) {
    const m = order.payment.method;
    if (m === 'card') {
      return `<div class="done-scene scene-card" aria-hidden="true">
        <div class="mini-card"><span class="mini-chip"></span><span class="mini-no">•••• ${esc(order.payment.last4)}</span><span class="mini-name">${esc(order.name.toLocaleUpperCase('tr'))}</span></div>
        <span class="mini-stamp">Ödendi</span>
        <p class="scene-text"><strong>${money.format(order.total)}</strong> kartınızdan çekildi (demo).</p>
      </div>`;
    }
    if (m === 'transfer') {
      return `<div class="done-scene scene-transfer">
        <div class="scene-bank" aria-hidden="true">${window.GAArt ? window.GAArt.pay('transfer') : ''}<svg class="scene-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path class="scene-clock-m" d="M12 12V6.5"/><path class="scene-clock-h" d="M12 12h3.6"/></svg></div>
        <div class="scene-iban">
          <p class="scene-label">Örnek IBAN (demo)</p>
          <p class="scene-iban-no">TR00 0000 0000 0000 0000 0000 00</p>
          <p class="scene-label">Açıklamaya sipariş numaranızı yazın: <strong>${esc(order.no)}</strong></p>
          <button type="button" class="scene-copy" data-copy="${esc(order.no)}">Sipariş numarasını kopyala</button>
        </div>
      </div>`;
    }
    return `<div class="done-scene scene-cod" aria-hidden="true">
      <div class="cod-street">
        <svg class="cod-truck" viewBox="0 0 40 24" fill="none">
          <g class="truck-body"><path d="M9 4.5h15.5v12H9z"/><path d="M24.5 8.5h5.6l4.4 4.6v3.4h-10z"/><path d="M27 9.8h2.6l2.4 2.6H27z" class="truck-window"/></g>
          <g class="truck-wheel"><circle cx="14" cy="18" r="2.6"/><path d="M14 15.4v5.2M11.4 18h5.2"/></g>
          <g class="truck-wheel"><circle cx="30" cy="18" r="2.6"/><path d="M30 15.4v5.2M27.4 18h5.2"/></g>
        </svg>
        <svg class="cod-house" viewBox="0 0 48 48" fill="none"><path d="M8 22 24 9l16 13v17H8Z"/><path d="M20 39V29h8v10"/></svg>
        <span class="cod-coin">₺</span>
      </div>
      <p class="scene-text">Kapıda <strong>${money.format(order.total)}</strong> ödeyeceksiniz · nakit veya kart</p>
    </div>`;
  }

  function showDone(order, member) {
    root.hidden = true;
    document.querySelector('.checkout-back').hidden = true;
    document.querySelector('.checkout-head h1').textContent = 'Siparişiniz alındı';
    document.title = `Siparişiniz alındı · ${order.no} | Gurme Alaşehirden`;
    form.removeAttribute('aria-busy');
    $('co-status').textContent = '';
    const done = $('checkout-done');
    const pay = order.payment.method === 'card'
      ? `${order.payment.label} · •••• ${esc(order.payment.last4)}`
      : order.payment.method === 'transfer'
        ? 'Havale / EFT · Hesap bilgileri e-postanıza gönderilir (demo)'
        : 'Kapıda ödeme';
    done.innerHTML = `
      <div class="done-card">
        <div class="done-badge${order.payment.method === 'transfer' ? ' is-pending' : ''}" aria-hidden="true"><span class="done-burst"></span><svg class="done-check" viewBox="0 0 52 52"><circle class="done-fill" cx="26" cy="26" r="24"/><circle cx="26" cy="26" r="24"/><path d="m15 27 7 7 15-16"/></svg></div>
        <p class="done-lead">Teşekkürler, ${esc(order.name.split(' ')[0])}.</p>
        <p class="done-kind done-kind-${order.payment.method}">${DONE_KIND[order.payment.method]}</p>
        <p class="done-no">Sipariş numaranız <strong>${esc(order.no)}</strong></p>
        <p class="done-text">Siparişinizi aldık. Bu bir demo sipariştir; ürün gönderilmez ve ödeme alınmaz.</p>
        ${doneTrack(order.payment.method)}
        ${doneScene(order)}
        <dl class="done-facts">
          <div><dt>Teslimat</dt><dd>${esc(order.address.fullName)}<br>${esc(order.address.line)}<br>${esc(order.address.district)} / ${esc(order.address.city)}</dd></div>
          <div><dt>Ödeme</dt><dd>${pay}</dd></div>
          <div><dt>Toplam</dt><dd>${money.format(order.total)}</dd></div>
        </dl>
        <ul class="done-items">${order.items.map((i, k) => `<li style="--k:${k}"><img src="${esc(i.image)}" width="80" height="80" alt=""><span>${esc(i.name)} <small>× ${i.count}</small></span></li>`).join('')}</ul>
        <div class="done-actions">
          <span class="done-account">${doneAccountButton(member)}</span>
          <a class="button button-secondary" href="index.html#urunler">Alışverişe dön</a>
        </div>
      </div>`;
    done.hidden = false;
    scrollTo({ top: 0, behavior: smooth() });
    done.querySelector('.scene-copy')?.addEventListener('click', async (e) => {
      const b = e.currentTarget;
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Kopyalandı'; b.classList.add('is-copied'); } catch { b.textContent = b.dataset.copy; }
      setTimeout(() => { b.textContent = 'Sipariş numarasını kopyala'; b.classList.remove('is-copied'); }, 1800);
    });
    done.querySelector('.done-lead').setAttribute('tabindex', '-1');
    done.querySelector('.done-lead').focus({ preventScroll: true });
  }

  /* ---------- boot ---------- */
  function boot() {
    cart = readCart();
    if (!cart.length) { $('checkout-empty').hidden = false; root.hidden = true; return; }
    root.hidden = false;
    renderSummary();
    syncPayment();
    applyAccount();
  }
  boot();
  acct()?.onChange(() => {
    if (!placed) { applyAccount(); return; }
    const slot = document.querySelector('.done-account');
    if (slot) slot.innerHTML = doneAccountButton(Boolean(acct().current()));
  });
  // keep the cart in step with other tabs and back/forward navigation
  addEventListener('storage', (e) => { if (!placed && (e.key === CART || e.key === null)) boot(); });
  addEventListener('pageshow', (e) => { if (e.persisted && !placed) boot(); });
})();
