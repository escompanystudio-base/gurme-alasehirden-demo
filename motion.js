'use strict';

(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('motion-on');

  /* ---------- text splitting ---------- */
  function readableText(element) {
    let text = '';
    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
      else if (node.nodeName === 'BR') text += ' ';
      else text += readableText(node);
    });
    return text.replace(/\s+/g, ' ').trim();
  }

  function split(element, mode) {
    if (element.dataset.splitDone) return;
    element.dataset.splitDone = 'true';
    const label = readableText(element);
    let index = 0;

    const walk = (parent) => {
      [...parent.childNodes].forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.nodeName !== 'BR') walk(node);
          return;
        }
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
        const fragment = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { fragment.append(' '); return; }
          const word = document.createElement('span');
          word.className = 'split-w';
          word.setAttribute('aria-hidden', 'true');
          if (mode === 'chars') {
            [...part].forEach((char) => {
              const c = document.createElement('span');
              c.className = 'split-c';
              c.style.setProperty('--i', index++);
              c.textContent = char;
              word.append(c);
            });
          } else {
            const inner = document.createElement('span');
            inner.className = 'split-wi';
            inner.style.setProperty('--i', index++);
            inner.textContent = part;
            word.append(inner);
          }
          fragment.append(word);
        });
        node.replaceWith(fragment);
      });
    };
    walk(element);
    const sr = document.createElement('span');
    sr.className = 'visually-hidden';
    sr.textContent = label;
    element.append(sr);
  }

  document.querySelectorAll('.showcase-slide h2').forEach((h) => split(h, 'chars'));
  document.querySelectorAll('[data-split]').forEach((h) => split(h, 'words'));

  // manifesto word fill
  const fill = document.querySelector('[data-fill]');
  const fillWords = [];
  if (fill) {
    const walk = (parent) => {
      [...parent.childNodes].forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) { walk(node); return; }
        if (node.nodeType !== Node.TEXT_NODE) return;
        const fragment = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { fragment.append(part); return; }
          const w = document.createElement('span');
          w.className = 'fill-w';
          w.textContent = part;
          fillWords.push(w);
          fragment.append(w);
        });
        node.replaceWith(fragment);
      });
    };
    walk(fill);
  }

  // stagger indexes
  document.querySelectorAll('[data-stagger]').forEach((group) => {
    [...group.children].forEach((child, i) => child.style.setProperty('--si', i));
  });

  /* ---------- reveal observer ---------- */
  const revealTargets = '[data-reveal], [data-split], [data-stagger], [data-fan], .product-grid, .help.reveal, .footer-top';
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll(revealTargets).forEach((el) => {
      if (el.closest('.showcase')) return;
      io.observe(el);
    });
  } else {
    document.querySelectorAll(revealTargets).forEach((el) => el.classList.add('in-view'));
    fillWords.forEach((w) => w.classList.add('is-lit'));
  }

  /* ---------- carousel counter ---------- */
  const carousel = document.getElementById('showcase');
  if (carousel) {
    const counter = carousel.querySelector('.carousel-index');
    new MutationObserver(() => {
      const next = String(Number(carousel.dataset.active || 0) + 1).padStart(2, '0');
      if (counter && counter.textContent !== next) {
        counter.textContent = next;
        counter.classList.remove('is-ticking');
        void counter.offsetWidth;
        counter.classList.add('is-ticking');
      }
    }).observe(carousel, { attributes: true, attributeFilter: ['data-active'] });
  }

  /* ---------- intro curtain ---------- */
  function ready() {
    const first = document.querySelector('.showcase-slide');
    first?.classList.add('is-intro');
    root.classList.add('is-ready');
    setTimeout(() => first?.classList.remove('is-intro'), 2600);
  }

  let seen = false;
  try { seen = sessionStorage.getItem('ga-intro') === '1'; } catch { seen = true; }
  const hasHero = Boolean(carousel);

  if (!reduced && hasHero && !seen) {
    try { sessionStorage.setItem('ga-intro', '1'); } catch { /* storage blocked */ }
    const intro = document.createElement('div');
    intro.className = 'intro intro-secure';
    intro.setAttribute('role', 'status');
    intro.setAttribute('aria-label', 'Güvenli alışveriş sayfası açılıyor');
    // only claim what is true for this visit: the encrypted-connection line
    // appears only when the page really is served over HTTPS
    const lines = [
      ...(location.protocol === 'https:' ? ['SSL ile şifreli bağlantı'] : []),
      'Kart bilgileriniz saklanmaz',
      'Kişisel verileriniz KVKK kapsamında korunur',
      'Ödeme adımı bilgilerinizi korur'
    ];
    intro.innerHTML = `<div class="intro-inner">
      <svg class="intro-shield" viewBox="0 0 64 64" aria-hidden="true">
        <path class="intro-shield-body" pathLength="1" d="M32 6c5.8 4.4 12.4 7.2 19.5 8.3v14.3C51.5 41 45.2 48.8 32 56.3 18.8 48.8 12.5 41 12.5 28.6V14.3C19.6 13.2 26.2 10.4 32 6Z"/>
        <path class="intro-shield-check" pathLength="1" d="m22.5 31.5 6.5 6.5 13-14"/>
      </svg>
      <img src="assets/gurme-alasehirden-logo-acik.svg" width="229" height="64" alt="Gurme Alaşehirden">
      <ul class="intro-checks">${lines.map((t, i) => `<li style="--d:${0.55 + i * 0.32}s"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path pathLength="1" d="m7.5 12.3 3 3 6-6.3"/></svg><span>${t}</span></li>`).join('')}</ul>
      <p class="intro-welcome" style="--d:${0.6 + lines.length * 0.32}s">Güvenli alışverişe hoş geldiniz</p>
    </div>`;
    document.body.append(intro);
    const total = 900 + lines.length * 320 + 900;
    setTimeout(() => {
      intro.classList.add('is-done');
      setTimeout(ready, 250);
      setTimeout(() => intro.remove(), 1200);
    }, total);
  } else {
    requestAnimationFrame(() => requestAnimationFrame(ready));
  }

  /* ---------- header: gliding underline, search ---------- */
  const nav = document.querySelector('.primary-nav');
  if (nav) {
    const glide = document.createElement('span');
    glide.className = 'nav-glide';
    glide.setAttribute('aria-hidden', 'true');
    nav.append(glide);
    const current = nav.querySelector('[aria-current="page"]');
    const moveTo = (link) => {
      if (!link) { nav.classList.remove('has-glide'); return; }
      nav.style.setProperty('--glide-x', `${link.offsetLeft}px`);
      nav.style.setProperty('--glide-w', `${link.offsetWidth}px`);
      nav.classList.add('has-glide');
    };
    nav.addEventListener('pointerover', (e) => {
      const link = e.target instanceof Element ? e.target.closest('a') : null;
      if (link) moveTo(link);
    });
    nav.addEventListener('focusin', (e) => moveTo(e.target.closest('a')));
    nav.addEventListener('pointerleave', () => moveTo(current));
    nav.addEventListener('focusout', () => moveTo(current));
    requestAnimationFrame(() => moveTo(current));
    document.fonts?.ready.then(() => moveTo(current));
    addEventListener('resize', () => moveTo(current), { passive: true });
  }

  const searchInput = document.getElementById('header-search-input');
  if (searchInput) {


    if (!reduced) {
      const words = ['Tarhana', 'Salça', 'Asma yaprağı', 'Zeytin', 'Kuru üzüm'];
      let w = 0;
      let c = 0;
      let deleting = false;
      const type = () => {
        if (document.activeElement === searchInput || searchInput.value || document.hidden || !searchInput.offsetParent) {
          searchInput.placeholder = 'Ürün ara';
          setTimeout(type, 1200);
          return;
        }
        const word = words[w];
        c += deleting ? -1 : 1;
        searchInput.placeholder = `Ara: ${word.slice(0, c)}`;
        let delay = deleting ? 45 : 95;
        if (!deleting && c === word.length) { deleting = true; delay = 1800; }
        else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
        setTimeout(type, delay);
      };
      searchInput.addEventListener('focus', () => { searchInput.placeholder = 'Ürün ara'; });
      setTimeout(type, 2600);
    }
  }

  /* ---------- catalog: live count + gliding filter indicator ---------- */
  const productGrid = document.getElementById('product-grid');
  const countEl = document.getElementById('catalog-count');
  if (productGrid && countEl) {
    const updateCount = () => {
      const next = String(productGrid.querySelectorAll('.product-card').length).padStart(2, '0');
      if (countEl.textContent === next) return;
      countEl.textContent = next;
      countEl.classList.remove('is-ticking');
      void countEl.offsetWidth;
      countEl.classList.add('is-ticking');
    };
    new MutationObserver(updateCount).observe(productGrid, { childList: true });
    updateCount();
  }

  const filterRail = document.getElementById('category-filters');
  if (filterRail) {
    const glide = document.createElement('span');
    glide.className = 'filter-glide';
    glide.setAttribute('aria-hidden', 'true');
    filterRail.prepend(glide);
    const place = () => {
      const active = filterRail.querySelector('.filter[aria-pressed="true"]');
      if (!active) { filterRail.classList.remove('has-active'); return; }
      filterRail.style.setProperty('--fx', `${active.offsetLeft}px`);
      filterRail.style.setProperty('--fw', `${active.offsetWidth}px`);
      filterRail.classList.add('has-active');
    };
    new MutationObserver(place).observe(filterRail, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
    addEventListener('resize', place, { passive: true });
    document.fonts?.ready.then(place);
    place();
    requestAnimationFrame(() => filterRail.classList.add('glide-ready'));
  }

  if (reduced) return;

  /* ---------- scroll-linked effects ---------- */
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);

  const header = document.querySelector('.site-header');
  const annBar = document.querySelector('.announcement');
  const setAnnH = () => document.documentElement.style.setProperty('--ann-h', `${annBar ? annBar.offsetHeight : 0}px`);
  setAnnH();
  addEventListener('resize', setAnnH);
  header?.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  const heroWindow = document.querySelector('.carousel-window');
  const originImg = document.querySelector('.origin-visual img');
  let lastY = scrollY;
  let ticking = false;

  function onScroll() {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);

    if (header) {
      header.classList.toggle('is-scrolled', y > 40);
    }

    if (heroWindow) {
      const rect = heroWindow.getBoundingClientRect();
      if (rect.bottom > 0) {
        const p = Math.min(1, Math.max(0, -rect.top / rect.height));
        heroWindow.style.setProperty('--hero-shift', `${(p * rect.height * 0.25).toFixed(1)}px`);
        heroWindow.style.setProperty('--copy-shift', `${(p * -60).toFixed(1)}px`);
        heroWindow.style.setProperty('--copy-fade', (1 - p * 1.4).toFixed(3));
      }
    }

    if (fillWords.length) {
      const rect = fill.getBoundingClientRect();
      const start = innerHeight * 0.85;
      const end = innerHeight * 0.35;
      const p = Math.min(1, Math.max(0, (start - rect.top) / (start - end + rect.height * 0.6)));
      const lit = Math.round(p * fillWords.length);
      for (let i = 0; i < lit; i++) fillWords[i].classList.add('is-lit');
    }

    if (originImg) {
      const rect = originImg.parentElement.getBoundingClientRect();
      const p = (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight;
      originImg.style.setProperty('--par', `${(p * -60).toFixed(1)}px`);
    }

    lastY = y;
    ticking = false;
  }

  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (!finePointer) return;

  /* ---------- magnetic ---------- */
  let magnet = null;
  document.addEventListener('pointermove', (e) => {
    const el = e.target instanceof Element ? e.target.closest('[data-magnetic]') : null;
    if (magnet && magnet !== el) { magnet.style.translate = ''; magnet = null; }
    if (!el) return;
    magnet = el;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.translate = `${(dx * 0.25).toFixed(1)}px ${(dy * 0.35).toFixed(1)}px`;
  }, { passive: true });

  /* ---------- product card tilt + spotlight (delegated; grid re-renders) ---------- */
  const grid = document.getElementById('product-grid');
  if (grid) {
    let activeCard;
    grid.addEventListener('pointermove', (e) => {
      const card = e.target instanceof Element ? e.target.closest('.product-card') : null;
      if (activeCard && activeCard !== card) activeCard.style.transform = '';
      activeCard = card;
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      card.style.transform = `rotateX(${((0.5 - py) * 7).toFixed(2)}deg) rotateY(${((px - 0.5) * 9).toFixed(2)}deg) translateZ(0) translateY(-6px)`;
    });
    grid.addEventListener('pointerleave', () => {
      if (activeCard) activeCard.style.transform = '';
      activeCard = undefined;
    });
  }
})();
