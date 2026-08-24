# Manga Çeviri Projesi — Konuşmadan Çıkan Kullanılabilir Bulgular

Tarih: 2026-08-24

Bu belge, Codex konuşmasında incelenen manga overlay eklentisi dosyalarından ve derlenmiş çıktılardan çıkarılan uygulanabilir teknik bulguları toplar. İncelenen dosyalar farklı paket/derlenmiş sürümlerdi; hiçbiri tek başına ana TypeScript kaynağının yerine geçmez.

## Kesin ve kullanılabilir bulgular

### 1. Overlay tipografi iyileştirmeleri

Derlenmiş geliştirilmiş content çıktısında aşağıdaki parçalar işe yarar:

- Balon kutusuna göre otomatik font boyutu.
- Satır yüksekliği ayarı.
- Letter-spacing ayarı.
- Uzun kelimeleri satıra sığdırma.
- Konum ve ölçüleri Math.round ile kararlı hale getirme.
- Kutu genişliği/yüksekliği için üst sınırlar.
- Koyu balonlar için manga-tr-dark sınıfı.
- Hover ve metin seçme desteği.

Bu iyileştirmeler doğrudan derlenmiş content.js içine bırakılmamalı; kalıcı olarak src/content/content.ts içine taşınmalı. Build akışı derlenmiş dosyanın üzerine yazar.

### 2. OCR temizleme ve gruplama

Projede zaten src/shared/ocr-cleanup.ts bulunuyor. Bu modülün temel yaklaşımı korunmalı:

- Düşük güvenli OCR satırlarını elemek.
- OCR artıklarını temizlemek.
- Satırları koordinat, dikey yakınlık ve yatay uzaklığa göre gruplamak.
- Grupları overlay için kullanılabilir bounding box'lara çevirmek.

Yeni OCR düzeltmeleri dikkatli uygulanmalı. rn -> m, vv -> w, I -> İ, 0 -> O gibi kurallar yalnızca İngilizce OCR metnine, DeepL çevirisinden önce uygulanmalı. Türkçe çeviriye sonradan uygulanırsa metni bozabilir.

### 3. Rate limiter

RateLimitedQueue yaklaşımı uygulanabilir:

- captureVisibleTab çağrılarını sıraya almak.
- DeepL isteklerini sınırlamak.
- Chrome'un MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND hatalarını azaltmak.
- DeepL 429 yanıtlarında retry/backoff eklemek.

Sınıfı eklemek tek başına yeterli değildir; gerçek background handler çağrıları kuyruğa bağlanmalıdır. Kuyruk davranışı test edilmelidir.

### 4. Geometri ve ekran yakalama

Aşağıdaki yardımcılar proje için değerlidir:

- contentRect
- mapSourceRect
- computeVisibleImageCrop
- Görselin viewport dışında kalan kısımlarını ekran görüntüsünden parça parça birleştirme.
- Scroll konumunu işlem öncesi/sonrası koruma.
- Görsel okunamıyorsa background fetch ve ardından screenshot fallback kullanma.

Bu alanlar için mevcut geometry.test.mjs ve capture-mapping.test.mjs testleri korunmalıdır.

### 5. Test ve teslim yaklaşımı

Kullanılabilir testler:

- content-package.test.mjs
- geometry.test.mjs
- capture-mapping.test.mjs
- ocr-cleanup.test.mjs

Beklenen akış:

1. npm run check
2. npm run build
3. node --test tests/*.test.mjs
4. npm run verify:delivery
5. Gerçek manga görselinde Chrome testi.
6. Firefox Android gerçek cihaz testi.

Derlenmiş bir dosyanın syntax kontrolünden geçmesi, kaynak build zincirinin doğru çalıştığını kanıtlamaz.

## Kullanılmaması veya ertelenmesi gerekenler

### Basit beyaz maske kodu inpainting değildir

bubble-inpaint.ts yalnızca canvas üzerine beyaz/yuvarlatılmış bir maske çizer. Gerçek görüntü arka planını korumaz, renkli veya dokulu balonları bozabilir ve DOM içindeki img öğesini kendiliğinden değiştirmez. Şimdilik MVP dışında tutulmalı.

### Renk analizinde sınırlamalar

Canvas üzerinden dark/light balon analizi yararlı bir deneysel özelliktir; ancak:

- Cross-origin görsel canvas'ı tainted olabilir.
- OCR pipeline'ının canvas/context verisini koruması gerekir.
- Birkaç piksel örneği her balon için güvenilir değildir.
- Yanlış dark mode için fallback ve test gerekir.

### İddia olarak kalan noktalar

Aşağıdaki iddialar gerçek cihaz veya benchmark kanıtı olmadan kesin kabul edilmemeli:

- 60 FPS akıcılık.
- Her webtoon sitesinde güvenilir çalışma.
- Firefox Android'de otomatik uyumluluk.
- Piksel-perfect font fit.
- Gerçek inpainting kalitesi.
- Mağazaya hazır olma.

## En güvenli entegrasyon sırası

1. Mevcut src/content/content.ts ve src/shared/ocr-cleanup.ts kaynaklarını temel al.
2. Tipografi motorunu kaynak TypeScript'e taşı.
3. OCR düzeltmesini translateBoxes öncesine al.
4. Rate limiter'ı Chromium ve Firefox background handler'larına bağla.
5. Letter-spacing'i ölçüm hesabına dahil et veya taşma testleri ekle.
6. Dark mode analizini opsiyonel fallback olarak ekle.
7. Unit testleri artır.
8. Build ve teslim doğrulamasını düzelt.
9. Gerçek Chrome manga testi yap.
10. Sonra Firefox Android cihaz testi yap.

## Mevcut repo bağlamı

GitHub deposu: CeyhanHans/Projem-manga

Bu repo, ana bilgisayardaki eklentinin bilinmeyen son sürümünü ezmeden geliştirilebilecek bağımsız destek çekirdeği olarak kullanılmalıdır. Repo README'sine göre modüller OCR karar, bölge gruplama, text fitting, tanılama ve Tesseract adaptörü katmanlarına ayrılmıştır. Ana eklentiye aktarım dosya dosya ve test geçişiyle yapılmalıdır.

## Başka AI'ya verilecek kısa görev tanımı

> Mevcut manga overlay eklentisinin kaynak TypeScript'ini koru. Derlenmiş content.js içindeki tipografi iyileştirmelerini doğrudan kopyalamak yerine src/content/content.ts içine taşı. OCR karakter düzeltmesini DeepL öncesinde uygula; Türkçe çeviri sonrasında uygulama. Mevcut OCR cleanup, geometri ve screenshot mapping sözleşmelerini bozma. Rate limiter'ı gerçek background çağrılarına bağla. Önce npm run check, npm run build ve testleri çalıştır; gerçek cihaz kanıtı olmadan tamamlandı deme.