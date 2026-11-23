'use strict';

// Ürün, fiyat ve bağlantılar markanın Shopier mağazasından alındı
// (https://www.shopier.com/gurmealasehirden). Fiyat veya ürün değişince
// burayı güncelleyin; her ürünün shopier alanı ürün sayfasını açar.
const STORE = {
  demo: false,
  // 'demo': sepet sitedeki ödeme sayfasına gider (gerçek ödeme alınmaz).
  // 'shopier': sepet ve ürün butonları Shopier'e gider.
  checkout: 'demo',
  instagram: 'https://www.instagram.com/gurmealasehirden/',
  shopier: 'https://www.shopier.com/gurmealasehirden',
  shopierMultiProduct: ''
};

const CATEGORIES = [
  { id: 'all', label: 'Tümü', icon: 'grid' },
  { id: 'leaves', label: 'Yaprak ve salamura', icon: 'leaf' },
  { id: 'grapes', label: 'Üzüm', icon: 'grapes' },
  { id: 'paste', label: 'Salça', icon: 'drop' },
  { id: 'pickles', label: 'Turşu ve zeytin', icon: 'jar' },
  { id: 'pantry', label: 'Kiler', icon: 'pantry' }
];

const PRODUCTS = [
  {
    id: 'salamura-uc-yaprak-3kg',
    name: 'Salamura uç yaprak',
    category: 'Yaprak ve salamura',
    filters: ['leaves'],
    size: '3 kg PET · 2026 sezonu',
    price: 800,
    image: 'assets/urunler/48458798.webp',
    alt: 'Salamura uç yaprak ürün fotoğrafı',
    description: '2026 sezonu salamura uç yaprak, 3 kg PET kapta. Sarmadan önce tuzunu tadın; gerekirse bir süre suda bekletin.',
    shopier: 'https://www.shopier.com/gurmealasehirden/48458798'
  },
  {
    id: 'sultaniye-kuru-uzum',
    name: 'Alaşehir Sultaniye kuru üzüm',
    category: 'Üzüm',
    filters: ['grapes'],
    size: '1 kg',
    price: 350,
    image: 'assets/urunler/48699027.webp',
    alt: 'Alaşehir Sultaniye kuru üzüm ürün fotoğrafı',
    description: 'Alaşehir Sultaniye üzümünden çekirdeksiz kuru üzüm, 1 kg. Kahvaltıda, kek hamurunda ya da yulafla.',
    shopier: 'https://www.shopier.com/gurmealasehirden/48699027'
  },
  {
    id: 'tarhana',
    name: 'Tarhana',
    category: 'Kiler',
    filters: ['pantry'],
    size: '1 kg',
    price: 650,
    image: 'assets/urunler/48458883.webp',
    alt: 'Tarhana ürün fotoğrafı',
    description: '1 kg tarhana. Bir kâse soğuk suyla açıp kaynatarak çorba yapabilirsiniz.',
    shopier: 'https://www.shopier.com/gurmealasehirden/48458883'
  },
  {
    id: 'domates-salcasi',
    name: 'Domates salçası',
    category: 'Salça',
    filters: ['paste'],
    size: '5 kg',
    price: 1750,
    image: 'assets/urunler/49941101.webp',
    alt: 'Domates salçası ürün fotoğrafı',
    description: '5 kg domates salçası. Yemeklere, çorbalara ve kahvaltılık soslara.',
    shopier: 'https://www.shopier.com/gurmealasehirden/49941101'
  },
  {
    id: 'gemlik-kirma-zeytin',
    name: 'Gemlik çıtır kırma zeytin',
    category: 'Turşu ve zeytin',
    filters: ['pickles'],
    size: 'Sofralık',
    price: 360,
    image: 'assets/urunler/48976314.webp',
    alt: 'Gemlik çıtır kırma zeytin ürün fotoğrafı',
    description: 'Gemlik sofralık çıtır kırma zeytin, kahvaltı sofraları için.',
    shopier: 'https://www.shopier.com/gurmealasehirden/48976314'
  },
  {
    id: 'tek-kavrulmus-tahin',
    name: 'Tek kavrulmuş tahin',
    category: 'Kiler',
    filters: ['pantry'],
    size: '500 g · %100 doğal',
    price: 220,
    image: 'assets/urunler/48458856.webp',
    alt: 'Tek kavrulmuş tahin ürün fotoğrafı',
    description: '500 g tek kavrulmuş tahin. Kahvaltıda reçelle ya da tatlılarda kullanabilirsiniz.',
    shopier: 'https://www.shopier.com/gurmealasehirden/48458856'
  },
  {
    id: 'salamura-uc-yaprak-5li',
    name: 'Salamura uç yaprak, 5’li',
    category: 'Yaprak ve salamura',
    filters: ['leaves'],
    size: '5 × 5 kg PET',
    price: 4850,
    image: 'assets/urunler/48458950.webp',
    alt: 'Salamura uç yaprak, 5’li ürün fotoğrafı',
    description: 'Beş adet 5 kg PET kapta salamura uç yaprak. Kalabalık sofralar ve uzun süreli kullanım için.',
    shopier: 'https://www.shopier.com/gurmealasehirden/48458950'
  },
  {
    id: 'salamura-yaprak-2kg',
    name: 'Salamura yaprak',
    category: 'Yaprak ve salamura',
    filters: ['leaves'],
    size: '2 kg PET',
    price: 500,
    image: 'assets/urunler/48593356.webp',
    alt: 'Salamura yaprak ürün fotoğrafı',
    description: '2 kg PET kapta salamura asma yaprağı. Zeytinyağlı sarma ve dolma için.',
    shopier: 'https://www.shopier.com/gurmealasehirden/48593356'
  },
  {
    id: 'sultaniye-uzum-kasa',
    name: 'Sultaniye üzüm',
    category: 'Üzüm',
    filters: ['grapes'],
    size: '1 kasa · 5 kg',
    price: 500,
    image: 'assets/urunler/50586512.webp',
    alt: 'Sultaniye üzüm ürün fotoğrafı',
    description: 'Bir kasa (5 kg) Sultaniye üzüm.',
    shopier: 'https://www.shopier.com/gurmealasehirden/50586512'
  },
  {
    id: 'superyol-yas-uzum',
    name: 'Superyol yaş üzüm',
    category: 'Üzüm',
    filters: ['grapes'],
    size: '1 kasa · net 5 kg · çekirdeksiz',
    price: 600,
    image: 'assets/urunler/49343142.webp',
    alt: 'Superyol yaş üzüm ürün fotoğrafı',
    description: 'Bir kasa, net 5 kg çekirdeksiz Superyol cinsi yaş üzüm.',
    shopier: 'https://www.shopier.com/gurmealasehirden/49343142'
  },
  {
    id: 'biber-salcasi',
    name: 'Biber salçası',
    category: 'Salça',
    filters: ['paste'],
    size: '5 kg · acı-tatlı',
    price: 2250,
    image: 'assets/urunler/50516169.webp',
    alt: 'Biber salçası ürün fotoğrafı',
    description: '5 kg biber salçası, acı ve tatlı karışık.',
    shopier: 'https://www.shopier.com/gurmealasehirden/50516169'
  },
  {
    id: 'aci-biber-salcasi',
    name: 'Acı biber salçası',
    category: 'Salça',
    filters: ['paste'],
    size: '5 kg',
    price: 2500,
    image: 'assets/urunler/50586427.webp',
    alt: 'Acı biber salçası ürün fotoğrafı',
    description: '5 kg acı biber salçası.',
    shopier: 'https://www.shopier.com/gurmealasehirden/50586427'
  },
  {
    id: 'domates-biber-salcasi',
    name: 'Domates ve biber salçası',
    category: 'Salça',
    filters: ['paste'],
    size: '5 kg · karışık',
    price: 2000,
    image: 'assets/urunler/50586412.webp',
    alt: 'Domates ve biber salçası ürün fotoğrafı',
    description: 'Domates ve biber karışık salça, 5 kg.',
    shopier: 'https://www.shopier.com/gurmealasehirden/50586412'
  },
  {
    id: 'domates-sisesi',
    name: 'Domates şişesi',
    category: 'Salça',
    filters: ['paste'],
    size: '5 adet · 420 cc cam kavanoz',
    price: 600,
    image: 'assets/urunler/49941323.webp',
    alt: 'Domates şişesi ürün fotoğrafı',
    description: '420 cc cam kavanozlarda domates, 5 adet.',
    shopier: 'https://www.shopier.com/gurmealasehirden/49941323'
  },
  {
    id: 'menemenlik',
    name: 'Menemenlik',
    category: 'Salça',
    filters: ['paste'],
    size: 'Yarım kg · 660 cc kavanoz',
    price: 200,
    image: 'assets/urunler/50586495.webp',
    alt: 'Menemenlik ürün fotoğrafı',
    description: 'Menemen için hazırlanmış karışım; 660 cc kavanozda yarım kg.',
    shopier: 'https://www.shopier.com/gurmealasehirden/50586495'
  },
  {
    id: 'siyah-zeytin',
    name: 'Yağlı salamura siyah zeytin',
    category: 'Turşu ve zeytin',
    filters: ['pickles'],
    size: '1 kg · etli',
    price: 390,
    image: 'assets/urunler/48701780.webp',
    alt: 'Yağlı salamura siyah zeytin ürün fotoğrafı',
    description: '1 kg yağlı salamura siyah etli zeytin.',
    shopier: 'https://www.shopier.com/gurmealasehirden/48701780'
  },
  {
    id: 'emcelli-biber-tursusu-tatli',
    name: 'Emcelli biber turşusu, tatlı',
    category: 'Turşu ve zeytin',
    filters: ['pickles'],
    size: '5 kg',
    price: 850,
    image: 'assets/urunler/49343203.webp',
    alt: 'Emcelli biber turşusu, tatlı ürün fotoğrafı',
    description: '5 kg tatlı emcelli biber turşusu.',
    shopier: 'https://www.shopier.com/gurmealasehirden/49343203'
  },
  {
    id: 'emcelli-biber-tursusu-aci',
    name: 'Emcelli biber turşusu, acı',
    category: 'Turşu ve zeytin',
    filters: ['pickles'],
    size: '5 kg',
    price: 850,
    image: 'assets/urunler/49343221.webp',
    alt: 'Emcelli biber turşusu, acı ürün fotoğrafı',
    description: '5 kg acı emcelli biber turşusu.',
    shopier: 'https://www.shopier.com/gurmealasehirden/49343221'
  },
  {
    id: 'acur-tursusu',
    name: 'Acur turşusu',
    category: 'Turşu ve zeytin',
    filters: ['pickles'],
    size: '5 kg',
    price: 800,
    image: 'assets/urunler/49691721.webp',
    alt: 'Acur turşusu ürün fotoğrafı',
    description: '5 kg acur turşusu.',
    shopier: 'https://www.shopier.com/gurmealasehirden/49691721'
  },
  {
    id: 'sebzeli-eriste',
    name: 'Sebzeli erişte',
    category: 'Kiler',
    filters: ['pantry'],
    size: '1 kg',
    price: 350,
    image: 'assets/urunler/48458974.webp',
    alt: 'Sebzeli erişte ürün fotoğrafı',
    description: '1 kg sebzeli erişte.',
    shopier: 'https://www.shopier.com/gurmealasehirden/48458974'
  },
  {
    id: 'visne-receli',
    name: 'Vişne reçeli',
    category: 'Kiler',
    filters: ['pantry'],
    size: 'Yarım kg · 660 cc',
    price: 450,
    image: 'assets/urunler/49691678.webp',
    alt: 'Vişne reçeli ürün fotoğrafı',
    description: '660 cc kavanozda yarım kg vişne reçeli.',
    shopier: 'https://www.shopier.com/gurmealasehirden/49691678'
  },
  {
    id: 'cilek-receli',
    name: 'Çilek reçeli',
    category: 'Kiler',
    filters: ['pantry'],
    size: 'Yarım kg',
    price: 350,
    image: 'assets/urunler/49343748.webp',
    alt: 'Çilek reçeli ürün fotoğrafı',
    description: 'Yarım kg çilek reçeli.',
    shopier: 'https://www.shopier.com/gurmealasehirden/49343748'
  },
  {
    id: 'eksi-maya-ekmek',
    name: 'Ekşi maya taş fırın ekmeği',
    category: 'Kiler',
    filters: ['pantry'],
    size: 'Taş fırın',
    price: 275,
    image: 'assets/urunler/49152911.webp',
    alt: 'Ekşi maya taş fırın ekmeği ürün fotoğrafı',
    description: 'Taş fırında pişmiş ekşi mayalı ekmek.',
    shopier: 'https://www.shopier.com/gurmealasehirden/49152911'
  },
  {
    id: 'gul-suyu',
    name: 'Isparta gül suyu',
    category: 'Kiler',
    filters: ['pantry'],
    size: 'Isparta gülünden',
    price: 750,
    image: 'assets/urunler/48693764.webp',
    alt: 'Isparta gül suyu ürün fotoğrafı',
    description: 'Isparta güllerinden gül suyu.',
    shopier: 'https://www.shopier.com/gurmealasehirden/48693764'
  }
];
