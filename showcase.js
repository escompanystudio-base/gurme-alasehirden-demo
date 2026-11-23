'use strict';

{
  const carousel = document.getElementById('showcase');
  const stage = carousel.querySelector('.carousel-window') || carousel;
  const slides = [...stage.querySelectorAll('.showcase-slide')];
  const controls = document.getElementById('carousel-controls');
  const nextControl = controls.querySelector('.carousel-next');
  const toggle = document.getElementById('carousel-toggle');
  const toggleIcon = toggle.querySelector('use');
  const status = document.getElementById('carousel-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rotationDuration = 6500;
  const transitionDuration = 550;

  let active = 0;
  let requested = 0;
  let requestId = 0;
  let playing = !reducedMotion.matches;
  let playWithFocus = false;
  let visible = !('IntersectionObserver' in window);
  let hovering = false;
  let touchStart;
  let leaving;
  let transitionTimer;
  let rotationTimer;
  let startedAt;
  let elapsed = 0;

  function canRotate() {
    const focus = document.activeElement;
    return playing && visible && !document.hidden && !hovering && !touchStart
      && requested === active && (!carousel.contains(focus) || (playWithFocus && focus === toggle));
  }

  function syncMeta() {
    carousel.dataset.active = String(active);
    carousel.classList.toggle('is-running', rotationTimer !== undefined);
  }

  function schedule() {
    queueMicrotask(syncMeta);
    if (!canRotate()) {
      if (rotationTimer !== undefined) {
        clearTimeout(rotationTimer);
        rotationTimer = undefined;
        elapsed += performance.now() - startedAt;
      }
      return;
    }

    if (rotationTimer !== undefined) return;
    startedAt = performance.now();
    rotationTimer = setTimeout(() => {
      rotationTimer = undefined;
      elapsed = rotationDuration;
      showSlide(active + 1, 'next');
    }, Math.max(0, rotationDuration - elapsed));
  }

  function setPlaying(next, explicitlyRequested = false) {
    playing = next;
    playWithFocus = next && explicitlyRequested;
    toggle.setAttribute('aria-label', playing ? 'Slayt gösterisini duraklat' : 'Slayt gösterisini oynat');
    toggleIcon.setAttribute('href', playing ? '#i-pause' : '#i-play');
    schedule();
  }

  function finishTransition() {
    clearTimeout(transitionTimer);
    if (!leaving) return;

    leaving.hidden = true;
    leaving.classList.remove('is-leaving');
    slides[active].classList.remove('is-entering');
    leaving = undefined;
  }

  async function showSlide(index, direction, userInitiated = false) {
    const next = (index + slides.length) % slides.length;
    const request = ++requestId;
    requested = next;

    schedule();
    if (next === active) return;

    const incoming = slides[next];
    const photo = incoming.querySelector('img');
    if (photo && !photo.complete) await photo.decode().catch(() => {});
    if (request !== requestId) return;

    finishTransition();

    const outgoing = slides[active];
    if (outgoing.contains(document.activeElement)) nextControl.focus({ preventScroll: true });
    outgoing.inert = true;
    outgoing.setAttribute('aria-hidden', 'true');
    incoming.inert = false;
    incoming.removeAttribute('aria-hidden');
    incoming.hidden = false;

    active = next;
    elapsed = 0;
    carousel.dataset.direction = direction;

    if (reducedMotion.matches) {
      outgoing.hidden = true;
    } else {
      leaving = outgoing;
      leaving.classList.add('is-leaving');
      incoming.classList.add('is-entering');
      transitionTimer = setTimeout(finishTransition, transitionDuration);
    }

    if (userInitiated) {
      status.textContent = incoming.getAttribute('aria-label');
    }
    schedule();
  }

  function step(amount) {
    const next = (requested + amount + slides.length) % slides.length;
    showSlide(next, amount > 0 ? 'next' : 'previous', true);
  }

  slides.slice(1).forEach((slide) => {
    slide.inert = true;
    slide.setAttribute('aria-hidden', 'true');
  });

  controls.hidden = false;
  setPlaying(playing);

  carousel.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button === toggle) {
      setPlaying(!playing, true);
    } else if (button?.hasAttribute('data-slide-step')) {
      step(Number(button.dataset.slideStep));
      if (event.detail && document.activeElement === button) button.blur();
    }
  });

  controls.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    step(event.key === 'ArrowRight' ? 1 : -1);
  });

  carousel.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch') return;
    hovering = true;
    schedule();
  });
  carousel.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'touch') return;
    hovering = false;
    schedule();
  });
  carousel.addEventListener('focusin', schedule);
  carousel.addEventListener('focusout', () => queueMicrotask(schedule));
  document.addEventListener('visibilitychange', schedule);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.intersectionRatio >= 0.25;
      schedule();
    }, { threshold: 0.25 });
    observer.observe(stage);
  }

  reducedMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    finishTransition();
    setPlaying(false);
  });

  stage.addEventListener('touchstart', (event) => {
    touchStart = event.touches.length === 1 ? event.touches[0] : undefined;
    schedule();
  }, { passive: true });

  stage.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const horizontal = touch.clientX - touchStart.clientX;
    const vertical = touch.clientY - touchStart.clientY;
    touchStart = undefined;
    if (Math.abs(horizontal) > 45 && Math.abs(horizontal) > Math.abs(vertical) * 1.25) {
      if (event.cancelable) event.preventDefault();
      step(horizontal < 0 ? 1 : -1);
    } else {
      schedule();
    }
  }, { passive: false });

  stage.addEventListener('touchcancel', () => {
    touchStart = undefined;
    schedule();
  }, { passive: true });
}
