'use strict';

// Canlı destek: demo sohbet penceresi. Gerçek bir temsilciye bağlanmaz;
// hazır yanıtlar verir ve telefon / Instagram bağlantılarını gösterir.
(() => {
  const trigger = document.querySelector('.ann-support');
  if (!trigger) return;
  const STORE_KEY = 'ga-support-v1';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lower = (s) => String(s).toLocaleLowerCase('tr');
  const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 });

  const QUICK = [
    ['kargo', 'Kargo ne zaman gelir?'],
    ['odeme', 'Ödeme seçenekleri'],
    ['siparis', 'Siparişim nerede?'],
    ['iade', 'İade ve değişim'],
    ['toptan', 'Toptan sipariş']
  ];
  const ANSWERS = {
    kargo: { text: 'Türkiye içi kargo ücretsiz. Siparişiniz kargoya verildiğinde takip numarası Hesabım › Siparişlerim sayfasında görünür.', link: ['hesabim.html#siparisler', 'Siparişlerime git'] },
    odeme: { text: 'Kredi veya banka kartı, havale/EFT ve kapıda ödeme seçeneklerimiz var. Kart bilgileriniz sitede saklanmaz.' },
    siparis: { text: 'Siparişinizi Hesabım › Siparişlerim bölümünden adım adım takip edebilirsiniz: alındı, hazırlanıyor, kargoda, teslim edildi.', link: ['hesabim.html#siparisler', 'Siparişlerimi göster'] },
    iade: { text: 'Gıda ürünlerinde ambalaj açıldıktan sonra cayma hakkı kullanılamaz. Ürün size hasarlı ya da eksik ulaşırsa fotoğrafıyla bize yazın; yeniden gönderir ya da ücretini iade ederiz.', link: ['yasal.html#cayma', 'Cayma ve iade koşulları'] },
    toptan: { text: 'Toptan ve kurumsal siparişler için 0544 295 09 45 numarasından bizi arayabilir ya da Instagram’dan yazabilirsiniz.', link: ['tel:+905442950945', 'Hemen ara'] },
    selam: { text: 'Merhaba! Size nasıl yardımcı olabilirim? Aşağıdaki konulardan birini seçebilir ya da sorunuzu yazabilirsiniz.' },
    tesekkur: { text: 'Rica ederiz, afiyet olsun! Başka bir sorunuz olursa buradayız.' },
    fallback: { text: 'Bu bir demo sohbet, şu an yalnızca hazır yanıtlar veriyorum. Bir temsilciyle konuşmak için 0544 295 09 45 numarasını arayabilir ya da Instagram’dan yazabilirsiniz.', link: ['https://ig.me/m/gurmealasehirden', 'Instagram’dan yaz'] }
  };
  const KEYWORDS = [
    ['kargo', ['kargo', 'teslim', 'ne zaman', 'gelir', 'gönderi']],
    ['odeme', ['ödeme', 'odeme', 'kart', 'havale', 'eft', 'kapıda', 'taksit']],
    ['siparis', ['sipariş', 'siparis', 'nerede', 'takip']],
    ['iade', ['iade', 'değişim', 'degisim', 'cayma', 'hasar', 'kırık', 'eksik']],
    ['toptan', ['toptan', 'kurumsal', 'fatura', 'çok adet', 'bayi']],
    ['tesekkur', ['teşekkür', 'tesekkur', 'sağol', 'sagol', 'eyvallah']],
    ['selam', ['merhaba', 'selam', 'iyi günler', 'hey']]
  ];

  function reply(text) {
    const q = lower(text);
    const hit = (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []).filter((p) => lower(p.name).split(/\s+/).some((w) => w.length > 3 && q.includes(w))).slice(0, 3);
    if (hit.length) {
      return {
        text: hit.length === 1 ? `${hit[0].name} (${hit[0].size}) şu an ${money.format(hit[0].price)}. Kargo ücretsiz.` : 'Bu ürünler ilginizi çekebilir:',
        products: hit.map((p) => p.id)
      };
    }
    const key = KEYWORDS.find(([, words]) => words.some((w) => q.includes(w)))?.[0];
    return ANSWERS[key || 'fallback'];
  }

  /* ---------- markup ---------- */
  const panel = document.createElement('section');
  panel.className = 'sup';
  panel.id = 'support-chat';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'sup-title');
  panel.innerHTML = `
    <header class="sup-head">
      <span class="sup-avatar"><img src="assets/gurme-marka.svg" width="40" height="40" alt=""></span>
      <div class="sup-who">
        <h2 id="sup-title">Gurme Alaşehirden</h2>
        <p><span class="sup-online" aria-hidden="true"></span>Canlı destek · Demo</p>
      </div>
      <button type="button" class="sup-close" aria-label="Sohbeti kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
    </header>
    <div class="sup-log" role="log" aria-live="polite" aria-label="Sohbet mesajları"></div>
    <div class="sup-quick" aria-label="Hızlı sorular"></div>
    <form class="sup-form" autocomplete="off">
      <label class="visually-hidden" for="sup-input">Mesajınız</label>
      <input id="sup-input" type="text" maxlength="300" placeholder="Mesajınızı yazın…">
      <button type="submit" aria-label="Gönder"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button>
    </form>
    <p class="sup-foot">Demo sohbet: hazır yanıtlar verir. <a href="tel:+905442950945">0544 295 09 45</a> · <a href="https://ig.me/m/gurmealasehirden" target="_blank" rel="noopener">Instagram</a></p>`;
  const scrim = document.createElement('div');
  scrim.className = 'sup-scrim';
  scrim.hidden = true;
  document.body.append(scrim, panel);

  const log = panel.querySelector('.sup-log');
  const quick = panel.querySelector('.sup-quick');
  const form = panel.querySelector('.sup-form');
  const input = panel.querySelector('#sup-input');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', 'support-chat');
  trigger.setAttribute('aria-expanded', 'false');

  let history = [];
  try { history = JSON.parse(sessionStorage.getItem(STORE_KEY)) || []; } catch { history = []; }
  const save = () => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-40))); } catch { /* ignore */ } };
  const time = () => new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date());

  function bubble(msg, animate = true) {
    const el = document.createElement('div');
    el.className = `sup-msg sup-${msg.from}${animate ? ' is-new' : ''}`;
    const products = (msg.products || []).map((id) => (typeof PRODUCTS !== 'undefined' ? PRODUCTS.find((p) => p.id === id) : null)).filter(Boolean);
    el.innerHTML = `<p>${esc(msg.text)}</p>
      ${products.map((p) => `<a class="sup-product" href="urun.html?id=${encodeURIComponent(p.id)}"><img src="${esc(p.image)}" width="80" height="80" alt=""><span><strong>${esc(p.name)}</strong>${money.format(p.price)}</span></a>`).join('')}
      ${msg.link ? `<a class="sup-link" href="${esc(msg.link[0])}"${msg.link[0].startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(msg.link[1])}</a>` : ''}
      <time>${esc(msg.time || '')}</time>`;
    log.append(el);
    log.scrollTo({ top: log.scrollHeight, behavior: reduced() || !animate ? 'auto' : 'smooth' });
  }
  function push(msg) { msg.time = time(); history.push(msg); save(); bubble(msg); }

  let busy = false;
  function botSay(answer, delay = 650) {
    busy = true;
    const typing = document.createElement('div');
    typing.className = 'sup-msg sup-bot sup-typing is-new';
    typing.setAttribute('aria-label', 'Yazıyor');
    typing.innerHTML = '<span></span><span></span><span></span>';
    log.append(typing);
    log.scrollTo({ top: log.scrollHeight, behavior: reduced() ? 'auto' : 'smooth' });
    setTimeout(() => {
      typing.remove();
      push({ from: 'bot', text: answer.text, link: answer.link, products: answer.products });
      busy = false;
    }, reduced() ? 0 : delay + Math.min(900, answer.text.length * 6));
  }

  function ask(text) {
    const clean = text.trim().slice(0, 300);
    if (!clean || busy) return;
    push({ from: 'me', text: clean });
    botSay(reply(clean));
  }

  quick.innerHTML = QUICK.map(([key, label], i) => `<button type="button" data-q="${key}" style="--i:${i}">${esc(label)}</button>`).join('');
  quick.addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (!b || busy) return;
    push({ from: 'me', text: b.textContent });
    botSay(ANSWERS[b.dataset.q]);
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); input.value = ''; });

  /* ---------- open / close ---------- */
  let opener = null;
  const mobile = () => matchMedia('(max-width: 640px)').matches;
  function open() {
    if (!panel.hidden) return;
    opener = document.activeElement;
    panel.hidden = false;
    scrim.hidden = !mobile();
    trigger.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => { panel.classList.add('is-open'); scrim.classList.add('is-open'); });
    if (!log.childElementCount) {
      if (history.length) history.forEach((m) => bubble(m, false));
      else botSay({ text: 'Merhaba, Gurme Alaşehirden’e hoş geldiniz! Size nasıl yardımcı olabiliriz?' }, 350);
    }
    setTimeout(() => input.focus({ preventScroll: true }), reduced() ? 0 : 280);
    if (mobile()) document.documentElement.classList.add('sup-lock');
  }
  function close() {
    if (panel.hidden) return;
    panel.classList.remove('is-open');
    scrim.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('sup-lock');
    setTimeout(() => { if (!panel.classList.contains('is-open')) { panel.hidden = true; scrim.hidden = true; } }, reduced() ? 0 : 320);
    (opener && document.contains(opener) ? opener : trigger).focus({ preventScroll: true });
  }
  trigger.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (panel.hidden) open(); else close();
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-support]')) { e.preventDefault(); open(); } });
  panel.querySelector('.sup-close').addEventListener('click', close);
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });
  document.addEventListener('pointerdown', (e) => {
    if (!panel.hidden && !mobile() && !panel.contains(e.target) && !trigger.contains(e.target)) close();
  });
  window.GASupport = { open, close };
})();
