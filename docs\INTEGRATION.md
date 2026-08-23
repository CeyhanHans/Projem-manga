# Ana Extension ile Entegrasyon

## Güvenli entegrasyon sırası

Ana bilgisayardaki kod geldiğinde doğrudan bütün pipeline değiştirilmemelidir.
Aşağıdaki sıra geri dönüşü kolay tutar.

### Aşama 1 — Yalnızca gözlem

1. `src/` klasörünü ana projeye `support/` adıyla kopyala.
2. Mevcut OCR tamamlandıktan sonra `analyzeTesseractResult()` çağır.
3. Mevcut davranışı değiştirmeden sonucu konsola yaz.
4. `createDebugOverlay()` ile kutuları yalnızca debug modunda göster.
5. Eski ve yeni bölge sayılarını karşılaştır.

```js
import {
  analyzeTesseractResult,
  createDebugOverlay,
} from './support/index.js';

const supportResult = analyzeTesseractResult(tesseractResult, {
  imageWidth: capturedImage.width,
  imageHeight: capturedImage.height,
  readingDirection: 'rtl',
});

console.table(supportResult.regions.map(region => ({
  id: region.id,
  text: region.text,
  confidence: region.confidence,
  upscale: region.ocrPlan.upscale,
})));
```

### Aşama 2 — Bölgesel yeniden OCR

Yalnızca `confidence < 72` olan bölgelerde `ocrPlan.crop` alanını orijinal
görüntüden kırp. `ocrPlan.upscale`, `pageSegmentationMode` ve `polarities`
değerlerini mevcut Tesseract fonksiyonuna aktar. İyileşen sonuç eski sonuçla
değiştirilsin; kötüleşirse eski sonuç korunsun.

### Aşama 3 — DeepL çevirisi

Her `region.text` DeepL'a ayrı gönderilebilir. Ancak bağlam kaybını azaltmak için
tek istekte sıralı bölge listesi gönderilip yanıt tekrar bölgelere eşlenebilir.
Önbellek anahtarı şu şekilde kurulmalıdır:

```text
sourceLanguage + targetLanguage + normalizedSourceText
```

API anahtarı hiçbir zaman repoya veya loglara yazılmamalıdır.

### Aşama 4 — Çeviriyi balona yerleştirme

DeepL yanıtları `translations` nesnesiyle ikinci `analyzePage()` çağrısına verilir.
Gerçek Canvas ölçümü için:

```js
const canvas = new OffscreenCanvas(1, 1);
const context = canvas.getContext('2d');

function measureText(text, fontSize, letterSpacing) {
  context.font = `700 ${fontSize}px Arial Narrow`;
  return context.measureText(text).width +
    Math.max(0, [...text].length - 1) * letterSpacing;
}
```

`layout.overflow === true` ise yazı zorla küçültülmemeli. Öncelik sırası:

1. Çevirinin anlamı korunarak kısaltılması.
2. `balloonBox` alanının güvenli miktarda genişletilmesi.
3. Yatay ölçeğin en fazla `0.78` değerine düşürülmesi.
4. Kullanıcıya taşma uyarısı gösterilmesi.

### Aşama 5 — Piksel tabanlı balon maskesi

Gerçek konuşma balonu sınırını bulmak için `balloonBox` başlangıç tohumu olarak
kullanılabilir. Sonraki algoritma:

1. Bölgeyi gri tona çevir.
2. Adaptif eşik veya kenar haritası çıkar.
3. Metin kutusunun merkezinden flood-fill/connected-component başlat.
4. Büyük, kapalı ve açık renkli bileşenleri aday balon olarak puanla.
5. Aday yoksa mevcut dikdörtgen `balloonBox` değerine geri dön.

Bu aşama gerçek görsel fixture'ları olmadan eklenmemiştir; yanlış maske orijinal
çizimi silebileceği için kanıt tabanlı geliştirilmelidir.

## Chrome Manifest V3 notları

- Destek modülleri ağ isteği yapmaz; yeni `host_permissions` istemez.
- ES module import kullanılamayan mevcut dosyada geçici olarak bundling veya tek
  dosya çıktısı gerekir. Ana proje görüldükten sonra yapı seçilmelidir.
- Tesseract worker ve ekran yakalama işlemleri mevcut katmanda kalmalıdır.
- Piksel koordinatları ekran görüntüsünün doğal çözünürlüğünde tutulmalı; CSS
  pikseli ve `devicePixelRatio` ile karıştırılmamalıdır.

