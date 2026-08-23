# OCR Araştırması ve Uygulanan Kararlar

Bu belge yalnızca projede gerçekten uygulanan veya entegrasyon planına alınan
yöntemleri içerir.

## Birincil kaynaklar

- [Tesseract — Improving the quality of the output](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)
- [Tesseract — Command Line Usage / PSM örnekleri](https://tesseract-ocr.github.io/tessdoc/Command-Line-Usage.html)
- [Tesseract — Result iterator, confidence ve bounding box](https://tesseract-ocr.github.io/tessdoc/APIExample.html)
- [OpenCV — Adaptive thresholding](https://docs.opencv.org/4.13.0/d7/dd0/tutorial_js_thresholding.html)
- [OpenCV — Connected components with statistics](https://docs.opencv.org/doc/doxygen/html/d3/dc0/group__imgproc__shape.html)
- [MDN — Canvas pixel manipulation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas)

## Kaynaklardan çıkarılan kararlar

### Ölçek ve kenar boşluğu

Tesseract küçük karakterlerde yeterli çözünürlük ve çok sıkı olmayan kırpma ister.
Bu nedenle sabit büyütme yerine karakter yüksekliğini yaklaşık 48 piksele taşıyan
bölgesel `upscale` ve makul `border` planı kullanıldı.

### Adaptif eşikleme

Global eşik, manga sayfasındaki gölgeli veya renkli panellerde her bölgeye uymaz.
OpenCV'nin anlattığı yerel eşik mantığı ve Tesseract 5'in desteklediği Sauvola
yaklaşımı saf JavaScript integral görüntü hesabıyla uygulandı. Böylece her pikselin
eşiği kendi komşuluğundan hesaplanıyor.

### Koyu ve açık metin

Siyah yazı/beyaz balon dışında beyaz yazı/koyu panel de bulunur. İki polarite ayrı
maskelenir. Açık yazı geçişinde hem piksel hem yerel ortalama matematiksel olarak
ters çevrilir; yalnızca sonucun terslenmesi gibi hatalı bir kısa yol kullanılmaz.

### Bağlı bileşenler

OCR'ın kelime üretmesini beklemeden ikili maskenin 8 bağlantılı bileşenleri
çıkarılır. Boyut, doluluk, en-boy oranı ve alan filtreleriyle olası harfler seçilir;
sonra mevcut satır/bölge gruplama sistemine aktarılır.

### Morfoloji

Tesseract belgesindeki ince ve kalın vuruş notlarına karşılık bağımsız dilation,
erosion, opening ve closing fonksiyonları eklendi. Gerçek manga örneğinin vuruş
kalınlığı ölçülmeden varsayılan OCR zincirine zorla alınmadı; adaptör gerektiğinde
seçebilecek.

### Sayfa segmentasyon modu

- PSM 11: tüm görünür sayfada seyrek metin arama.
- PSM 7: tek satır olduğu bilinen kırpma.
- PSM 6: çok satırlı tek blok/balon.

Bu değerler bölgenin satır ve kelime sayısına göre önerilir.

### Çoklu geçiş ve erken durdurma

Her görseli dört kez OCR yapmak pahalıdır. İlk sonuç yeterince güvenliyse sistem
durur. Sonuç zayıfsa sırayla kontrast germe, koyu Sauvola ve açık Sauvola geçişleri
çalışır. Aynı koordinattaki sonuçlar metin oyu ve güven puanıyla birleştirilir.

## Uygulanmayan yöntemler

- Model eğitimi: Tesseract belgesi, alışılmadık font/dil yoksa önce görüntü
  kalitesinin düzeltilmesini öneriyor. Gerçek hata veri seti olmadan eğitim yok.
- Ağır OpenCV.js paketi: İlk entegrasyonu ve MV3 CSP/bundle boyutunu zorlaştırmamak
  için gereken küçük algoritmalar bağımsız JavaScript yazıldı.
- Derin öğrenme metin dedektörü: DBNet/CRAFT gibi modeller güçlü olabilir; ancak
  model boyutu, WebGPU/WASM yükü ve gerçek performans ölçümü olmadan ana pakete
  eklenmedi. İleride opsiyonel sağlayıcı olarak değerlendirilecek.

