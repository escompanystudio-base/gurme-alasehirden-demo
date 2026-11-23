'use strict';

// Sipariş durumu ve ödeme tipine özel animasyonlu çizimler.
// GAArt.status(durum)       → durum çizimi (alındı / hazırlanıyor / kargoda / teslim edildi)
// GAArt.statusText(durum)   → kısa açıklama
// GAArt.pay(yöntem)         → ödeme işlenirken gösterilen küçük çizim
(() => {
  const KEYS = { 'Sipariş alındı': 'received', 'Hazırlanıyor': 'preparing', 'Kargoda': 'shipping', 'Teslim edildi': 'delivered' };
  const TEXT = {
    received: ['Siparişiniz alındı', 'Ödemeniz onaylanınca hazırlamaya başlıyoruz.'],
    preparing: ['Siparişiniz hazırlanıyor', 'Ürünleriniz özenle paketleniyor.'],
    shipping: ['Siparişiniz yolda', 'Kargo firması siparişinizi size getiriyor.'],
    delivered: ['Teslim edildi', 'Siparişiniz size ulaştı. Afiyet olsun!']
  };
  const keyOf = (status) => KEYS[status] || 'preparing';

  const SVG = {
    received: `<svg viewBox="0 0 48 48" fill="none">
        <path class="st-paper" d="M13 6h22v34l-3.7-2.6-3.6 2.6-3.7-2.6-3.7 2.6-3.6-2.6L13 40Z"/>
        <path class="st-line st-line-1" pathLength="1" d="M18 14h12"/>
        <path class="st-line st-line-2" pathLength="1" d="M18 20h12"/>
        <path class="st-line st-line-3" pathLength="1" d="M18 26h7"/>
        <g class="st-stamp"><circle cx="33" cy="32" r="7"/><path pathLength="1" d="m29.8 32 2.2 2.2 4-4.4"/></g>
      </svg>`,
    preparing: `<svg viewBox="0 0 48 48" fill="none">
        <g class="p-box">
          <path class="p-box-face" d="M10 18 24 11l14 7v16l-14 7-14-7Z"/>
          <path d="M10 18l14 7 14-7M24 25v16"/>
          <path class="p-tape" pathLength="1" d="M16.5 14.6 31 21.8v5.4"/>
        </g>
        <path class="p-spark p-spark-1" d="M39 6.5v5M36.5 9h5"/>
        <path class="p-spark p-spark-2" d="M8 7v3.4M6.3 8.7h3.4"/>
      </svg>`,
    shipping: `<svg viewBox="0 0 48 30" fill="none" class="st-truck-svg">
        <g class="truck-speed"><path d="M1 11h6M3 15h5M0 19h5"/></g>
        <g class="truck-body"><path d="M11 6.5h17v13H11z"/><path d="M28 10.5h6.2l4.8 5v4H28z"/><path d="M30.6 12h2.9l2.6 2.8h-5.5z" class="truck-window"/></g>
        <g class="truck-wheel"><circle cx="16.5" cy="21.5" r="2.8"/><path d="M16.5 18.7v5.6M13.7 21.5h5.6"/></g>
        <g class="truck-wheel"><circle cx="33.5" cy="21.5" r="2.8"/><path d="M33.5 18.7v5.6M30.7 21.5h5.6"/></g>
        <path class="st-road" d="M2 27h44"/>
      </svg>`,
    delivered: `<svg viewBox="0 0 48 48" fill="none">
        <path class="st-house" pathLength="1" d="M8 22 24 9l16 13v17H8Z"/>
        <path class="st-door" d="M20 39V29h8v10"/>
        <g class="st-parcel"><path d="M29.5 33h7v6h-7z"/><path d="M33 33v6"/></g>
        <g class="st-badge"><circle cx="36" cy="13" r="7"/><path pathLength="1" d="m32.8 13 2.2 2.2 4-4.4"/></g>
      </svg>`
  };

  const PAY = {
    card: `<svg class="pay-art pay-card" viewBox="0 0 48 48" fill="none">
        <path class="pay-wave pay-wave-1" d="M33 9.5a8 8 0 0 1 0 9"/><path class="pay-wave pay-wave-2" d="M37 6.5a13 13 0 0 1 0 15"/>
        <g class="pay-card-body"><rect x="6" y="17" width="28" height="19" rx="3.5"/><path d="M6 23h28"/><rect class="pay-chip" x="10" y="27" width="6" height="4.5" rx="1"/><path d="M24 31h6"/></g>
      </svg>`,
    transfer: `<svg class="pay-art pay-bank" viewBox="0 0 48 48" fill="none">
        <path d="M8 18 24 9l16 9Z"/>
        <path class="pay-col pay-col-1" d="M12 21v13"/><path class="pay-col pay-col-2" d="M20 21v13"/><path class="pay-col pay-col-3" d="M28 21v13"/><path class="pay-col pay-col-4" d="M36 21v13"/>
        <path d="M8 38h32"/>
        <circle class="pay-coin" cx="24" cy="14.5" r="2"/>
      </svg>`,
    cod: `<svg class="pay-art pay-wallet" viewBox="0 0 48 48" fill="none">
        <g class="pay-coin-drop"><circle cx="27" cy="9" r="4.5"/><path d="M27 7v4"/></g>
        <path class="pay-wallet-body" d="M8 18h28a4 4 0 0 1 4 4v13a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4Z"/>
        <path d="M8 18l20-6 3 6"/>
        <path d="M40 25h-7a3 3 0 0 0 0 6h7"/><circle cx="33.5" cy="28" r=".9"/>
      </svg>`
  };

  window.GAArt = {
    keyOf,
    status: (status, cls = '') => `<span class="st-art st-${keyOf(status)} ${cls}" aria-hidden="true">${SVG[keyOf(status)]}</span>`,
    statusText: (status) => TEXT[keyOf(status)],
    pay: (method) => PAY[method] || PAY.card
  };
})();
