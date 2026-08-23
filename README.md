# Projem Manga — Destek Kiti

Bu depo, ana bilgisayardaki manga çeviri eklentisinin bilinmeyen son sürümünü
ezmeden geliştirilebilecek **bağımsız ve tarayıcı uyumlu bir destek çekirdeğidir**.

Ana amaçlar:

1. OCR'ın döndürdüğü kelimeleri koordinatlarına göre doğru konuşma bölgelerine ayırmak.
2. Yan yana duran balonların yanlışlıkla birleşmesini azaltmak.
3. Küçük veya düşük güvenli bölgeler için otomatik kırpma, büyütme ve yeniden-OCR
   planı çıkarmak.
4. Türkçe çeviriyi balon ölçüsüne göre otomatik satırlara bölmek; font boyutu,
   satır yüksekliği ve harf aralığı üretmek.
5. Hataları görünür kılan SVG tanılama katmanı sağlamak.
6. Mevcut Tesseract.js çıktısını eski extension'ın `{en, fr, confidence, bbox}`
   biçimine çevirmek.
7. OCR hiçbir kelime üretmese bile piksellerden muhtemel metin bölgelerini bulmak.
8. Kontrast ve iki polaritedeki OCR sonuçlarını birleştirip hatalı okumalar arasında
   konsensüs oluşturmak.

## Neden ayrı bir destek kiti?

Ana eklentinin en güncel kodu şu anda bu bilgisayarda yok. Bu nedenle tahmin
ederek ana dosyaları yeniden yazmak veri kaybı ve entegrasyon çakışması yaratırdı.
Buradaki modüller saf JavaScript ES modülleridir; ağ isteği yapmaz, API anahtarı
tutmaz ve görüntüyü değiştirmez. Ana proje geldiğinde dosya dosya taşınabilir.

## Hızlı kullanım

```js
import { analyzeTesseractResult } from './src/index.js';

const analysis = analyzeTesseractResult(tesseractResult, {
  imageWidth: screenshot.width,
  imageHeight: screenshot.height,
  readingDirection: 'rtl',
  translations: {
    'region-1': 'NEREYE GİDİYORSUN?',
  },
});

for (const region of analysis.regions) {
  console.log(region.balloonBox); // tekrar OCR / overlay için güvenli kırpma alanı
  console.log(region.ocrPlan);    // büyütme, PSM ve polarite önerisi
  console.log(region.layout);     // fontSize, lines, lineHeight, letterSpacing
}
```

## Modüller

| Modül | Görev |
|---|---|
| `src/image/text-candidate-detector.js` | OCR öncesi piksel tabanlı metin alanı bulma |
| `src/image/adaptive-threshold.js` | Koyu/açık yazı için Sauvola adaptif eşikleme |
| `src/image/connected-components.js` | Harf adayları için 4/8 bağlı bileşen analizi |
| `src/image/morphology.js` | İnce/kalın/kopuk karakterler için dilation, erosion, open, close |
| `src/ocr/region-detector.js` | Kelime → satır → konuşma bölgesi gruplama |
| `src/ocr/preprocess-plan.js` | Bölgeye özel adaptif OCR planı |
| `src/ocr/ensemble.js` | Kaliteye göre duran/devam eden çoklu OCR orkestrasyonu |
| `src/ocr/multi-pass-merge.js` | Farklı OCR okumalarını koordinat ve metin oyuyla birleştirme |
| `src/ocr/quality.js` | Güven, gürültü ve içerik tabanlı OCR kalite puanı |
| `src/layout/text-fit.js` | Çeviriyi balona sığdırma |
| `src/layout/font-profile.js` | Diyaloğa göre font ağırlığı/renk/stroke önerisi |
| `src/pipeline/analyze-page.js` | Tüm çıktıları tek veri sözleşmesinde birleştirme |
| `src/diagnostics/debug-overlay.js` | Algılanan alanları SVG ile görünür yapma |
| `src/diagnostics/evaluate-detection.js` | Etiketli örneklerde precision/recall/F1 ölçme |
| `src/integration/tesseract-adapter.js` | Tesseract v5 ve eski extension adaptörü |

## Test

Harici paket gerekmez:

```powershell
npm test
```

Mevcut otomatik test sonucu: **24/24 başarılı**.

## Sınırlar

- Bu sürüm konuşma balonunun dış çizgisini piksel seviyesinde segmentlemez;
  OCR kelime kutularından veya piksel metin adaylarından güvenli bir `balloonBox`
  tahmin eder.
- Gerçek font ölçümü için extension entegrasyonunda Canvas `measureText` fonksiyonu
  `fitTextToBox` içine verilmelidir. Paketteki ölçüm tarayıcı olmadan test edilebilen
  yaklaşık ölçümdür.
- OCR motoru değildir; Tesseract/DeepL/vision API katmanlarının arasına giren karar
  ve yerleşim katmanıdır.

Daha ayrıntılı bilgi için [docs/CONTEXT.md](docs/CONTEXT.md),
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ve
[docs/INTEGRATION.md](docs/INTEGRATION.md) dosyalarına bakın.

OCR araştırma kararları [docs/OCR_RESEARCH.md](docs/OCR_RESEARCH.md), kod incelemesi
ise [docs/CODE_REVIEW.md](docs/CODE_REVIEW.md) dosyasındadır.

API anahtarlarıyla ilgili kurallar [SECURITY.md](SECURITY.md) dosyasındadır. Her
push ve pull request'te `.github/workflows/tests.yml` ile testler otomatik çalışır.

