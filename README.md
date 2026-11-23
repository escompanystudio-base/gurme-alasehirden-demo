# Gurme Alaşehirden

Gurme Alaşehirden’in yöresel ürün mağazası (demo).

**Canlı demo:** https://escompanystudio-base.github.io/gurme-alasehirden-demo/ Ürünler, fiyatlar ve fotoğraflar markanın [Shopier mağazasından](https://www.shopier.com/gurmealasehirden) alınmıştır.

Site şu an **demo satın alma** modundadır: ziyaretçi hesap açar veya misafir olarak devam eder, sepetten “Siparişi tamamla” ile `odeme.html` sayfasına geçer, teslimat ve ödeme bilgilerini girer, sipariş numaralı onay alır ve siparişlerini “Hesabım” bölümünde görür. Hesaplar, adresler ve siparişler yalnızca ziyaretçinin tarayıcısında (localStorage) saklanır; hiçbir veri sunucuya gitmez, gerçek ödeme alınmaz, kart numarası kaydedilmez (yalnızca son 4 hane).

## Sayfalar

| Dosya | İçerik |
|---|---|
| `index.html` | Vitrin, 24 ürünlük katalog, arama, sepet, SSS |
| `urun.html?id=…` | Ürün sayfası: görsel, adet, sepete ekle, detaylar, benzer ürünler |
| `favoriler.html` | Favorilerim |
| `hesabim.html` | Hesabım: genel bakış, siparişler ve takip, adresler, favoriler, bilgiler, güvenlik |
| `hikayeler.html` | Alaşehir’in bağları, tarifler, fotoğraf kaynakları |
| `yasal.html` | Satıcı bilgileri, gizlilik ve KVKK, mesafeli satış, cayma ve iade |
| `odeme.html` | Demo ödeme: iletişim, adres, kargo, ödeme, sipariş onayı |
| `404.html` | Bulunamayan sayfalar için |

| Betik | Görev |
|---|---|
| `catalog.js` | Ürünler, kategoriler, `STORE.checkout` ayarı (`'demo'` veya `'shopier'`) |
| `shop.js` | Katalog, arama, sepet, “Bunları da beğenebilirsiniz” |
| `product.js` | Ürün sayfası |
| `favorites.js` | Favorilerim sayfası |
| `profile.js` | Hesabım sayfası |
| `fly.js` | Sepete ekleme animasyonları ve “Sepetinize eklendi” kutusu |
| `art.js` | Sipariş durumu ve ödeme tipine özel animasyonlu çizimler |
| `search.js` | Mobil tam ekran arama |
| `support.js` | Canlı destek (demo sohbet, hazır yanıtlar) |
| `account.js` | Demo hesap: kayıt, giriş, Hesabım (siparişler, adresler, bilgiler) |
| `checkout.js` | Demo ödeme sayfası, ödeme işleniyor ekranı ve sipariş onayı |
| `mobile-menu.js` | Mobil alt çubuk ve menü paneli |
| `motion.js` | Animasyonlar |

## Yerel önizleme

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Ardından [yerel önizlemeyi](http://127.0.0.1:4173/) açın.

## Gerçek satışa geçerken

Demo ödeme gerçek para tahsil etmez. Gerçek satış için iki yol var:

- **Shopier ile:** `catalog.js` içinde `checkout: 'shopier'` yapın. Sepet ve ürün butonları yeniden Shopier’e gider; demo hesap ve ödeme sayfası kullanılmaz.
- **Kendi ödeme altyapınızla:** iyzico, PayTR gibi bir ödeme kuruluşu ve hesap/sipariş verilerini tutacak bir sunucu gerekir. `account.js` ve `checkout.js` bu altyapının arayüzü olarak kullanılabilir.

## Yayına almadan önce

Bunlar yalnızca satıcının bilebileceği bilgiler; site bunlar olmadan yayına girmemeli.

1. **Satıcı bilgileri:** `yasal.html` içindeki sarı köşeli parantezli 10 alanı doldurun (unvan, adres, vergi bilgileri, e-posta, kargo firması, hazırlık süresi, iade adımları). Ardından sayfanın üstündeki sarı “Yayına almadan önce” kutusunu (`data-draft`) silin.
2. **Hukuki kontrol:** Gizlilik, mesafeli satış ve cayma metinlerini bir hukukçuya kontrol ettirin.
3. **Kargo bilgisi:** Sitede “Türkiye içi kargo ücretsiz” yazıyor (üst bar, ürün altı, SSS, yasal sayfa). Doğru değilse bu ifadeleri güncelleyin.
4. **Shopier:** Mağazada şu an “satışlarına geçici bir süre ara vermiştir” notu var. Satışları Shopier panelinden yeniden açın.
5. **Alan adı:** Siteyi yükledikten sonra `robots.txt` içindeki sitemap satırını alan adınızla açın ve bir `sitemap.xml` ekleyin. Paylaşım önizlemesi için `og:image` adresini tam URL yapın.
6. **Canlı destek:** “Canlı destek” butonları Instagram mesajlarını açıyor (`ig.me/m/gurmealasehirden`). WhatsApp kullanılacaksa bu bağlantıları değiştirin.

## Ürün veya fiyat değişince

Tüm ürünler `catalog.js` içindedir. Her ürünün adı, kategorisi, gramajı, fiyatı, fotoğrafı, açıklaması ve Shopier ürün bağlantısı (`shopier`) burada tutulur. Ürün fotoğrafları `assets/urunler/` klasöründedir ve dosya adı Shopier ürün numarasıdır. `index.html` içindeki yapılandırılmış veri (`application/ld+json`) de fiyatları içerir; fiyat değişince orayı da güncelleyin.

Sepette tek ürün varsa “Shopier’de devam et” o ürünün sayfasını, birden fazla ürün varsa mağaza sayfasını açar. Shopier’de çoklu ürün bağlantısı hazırlanırsa adresini `STORE.shopierMultiProduct` alanına yazın.

## Dağıtım

Statik bir sitedir; derleme gerekmez. Tüm HTML dosyalarını, `styles.css`, `catalog-design.css`, `motion.css`, tüm `.js` dosyalarını, `robots.txt` ve `assets` klasörünü herhangi bir statik barındırmaya (Netlify, Vercel, GitHub Pages, cPanel) yükleyin. CSS ve JS bağlantılarındaki `?v=` sayısı, değişiklikten sonra tarayıcı önbelleğini yenilemek içindir.

## Fotoğraflar

Ürün fotoğrafları markanın kendi Shopier fotoğraflarıdır. Vitrin ve hikâye fotoğrafları lisanslı fotoğraflardır; kaynaklar ve lisanslar `hikayeler.html#fotograf-kaynaklari` bölümündedir.

## Demo notları

- Demo hesap: giriş penceresindeki “Demo hesabıyla giriş yap” butonu hazır siparişler ve adreslerle açılır.
- Sitede verilen demo siparişler 45 saniyede bir sonraki duruma geçer (alındı → hazırlanıyor → kargoda → teslim edildi), böylece durum animasyonları izlenebilir.
- Demo yayında arama motorlarına kapalıdır (`noindex`). Gerçek yayında bu satırı kaldırın.
