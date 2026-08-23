# Ana Projeye Devir İçin Genişletilmiş Bağlam

Bu belge kod değildir; ana bilgisayardaki gerçek uzantıya geçerken kararların, sınırların ve eksik bilgilerin kaybolmaması için çalışma notudur.

## Doğrulanmış ihtiyaç

- Uzantı kullanıcı tarafından sağlanan DeepL API ile OCR metnini çeviriyordu.
- Ana sorunlar: metin/balon alanının otomatik seçimi, stilize/dikey/küçük metnin OCR kalitesi ve çevirinin balona taşmadan dizilmesi.
- Güncel ana uzantı kodu bu bilgisayarda yoktu. Bu yüzden burada gerçek dosyaları tahmin ederek değiştirmek yerine bağımsız, entegrasyona hazır destek paketi yazıldı.

## Ana projeye geçince ilk keşif

1. `manifest.json`: MV3 durumu, izinler, content/background/service worker dağılımı.
2. OCR girdi/çıktısı, dil seçimi, mevcut hata UI’ı ve tetikleyiciler.
3. DeepL anahtarı nerede saklanıyor; istek iptali, kota ve hata davranışı.
4. Desteklenen sitelerin görsel kaynakları: `img`, lazy-load, canvas, blob URL, CSS background ve sayfa değişimi.
5. Render overlay mi, canvas mı, doğrudan görüntü değişimi mi; orijinale geri dönme yolu.
6. En az 30 gerçek hata örneği: telifli sayfayı repoya koymadan yerel fixture veya anonim ölçüm kaydı.

## Veri sözleşmesi

```js
// Bütün koordinatlar görüntünün doğal piksel uzayındadır.
{
  id: 'region-12',
  box: { x: 120, y: 48, width: 188, height: 94 },
  balloonBox: { x: 108, y: 36, width: 212, height: 118 },
  direction: 'ltr', detectorConfidence: 0.73,
  source: ['ocr-words', 'pixel-candidates']
}

{
  regionId: 'region-12', text: '...', confidence: 0.81, quality: 0.79,
  engine: 'tesseract', pass: 'adaptive-dark',
  warnings: ['low-consensus'], alternatives: []
}

{
  regionId: 'region-12', translatedText: '...', fontSize: 22,
  lineHeight: 1.1, letterSpacing: 0, mode: 'overlay', requiresReview: false
}
```

Kurallar: CSS pikseli ile doğal piksel karıştırılmaz; dönüşüm ölçeği metadata’da saklanır. Metin, maske ve çeviri `regionId` ile bağlanır. Kullanıcı düzeltmesi makinenin önerisini ezer ama önceki öneriyi silmez.

## İş akışı

```text
unseen → queued → analyzing → needs-review / translating → ready → rendered
                  ↘ failed / cancelled
```

- Görsel ekrandan ayrılırsa queued/analyzing iş iptal edilebilir.
- Hash ile `ready` sonuç bulunursa tekrar OCR/çeviri yapılmaz.
- `needs-review`: düşük OCR kalitesi, çelişen paslar, aşırı küçük alan veya taşan dizgi.
- Varsayılan render `overlay`; piksel temizleme geri alınabilir ayrı adımdır.

## Başlangıç performans ve maliyet bütçesi

| Konu | Hedef | Koruma |
| --- | --- | --- |
| Eşzamanlı iş | 1–2 analiz, 1 çeviri | Kuyruk + görünürlük önceliği |
| Bellek | Varsayılan 2.5 MP analiz girdisi | Downscale, iş bitince buffer bırakma |
| API tekrarları | Aynı hash için sıfır | Hash+dil+sözlük sürümü anahtarlı cache |
| OCR pası | Basit ilk deneme, düşük kalitede ek pas | `runOcrEnsemble` erken çıkışı |
| UI | Okumayı engellemez | Background işlem, iptal, aşamalı overlay |

API maliyeti ölçülmeden “tüm bölümü otomatik çevir” varsayılanı açılmamalıdır.

## Çeviri bağlamı ve kullanıcı düzeltmesi

- Tek balon çevirisi bağlam kaybettirir: yakın sıralı balonlar kısa numaralı bağlamla gönderilir.
- İsimler, teknik terimler, hitaplar ve transliterasyon tercihi kullanıcı sözlüğünde kilitlenir.
- Çeviri belleği anahtarı: kaynak/hedef dil, normalize kaynak metin, sözlük sürümü, sağlayıcı/model sürümü.
- Kullanıcı düzeltmesi varsayılan yerel saklanır. Paylaşım yalnız açık onay, telif ve gizlilik tasarımıyla yapılır.

## Test ve ölçüm

- Algılama: IoU, precision, recall, F1 (`docs/TEST_MATRIX.md`).
- OCR: CER/WER; dikey yazı, furigana, ters renk, düşük çözünürlük ve SFX kategorileri.
- Render: taşma, kesilen karakter, kullanıcı font/alan düzeltme oranı.
- Ürün: tamamlanma, tekrar işleme, ilk overlay süresi, yanlış otomatik render oranı.
- [OpenMantra](https://github.com/mantra-inc/open-mantra-dataset) benzeri açık araştırma verileri, lisansları doğrulanarak test tasarımına yardımcı olabilir. Üçüncü taraf manga sayfaları izinsiz depoya konmaz.

## Hata sözlüğü

| Kod | Kullanıcı mesajı | Davranış |
| --- | --- | --- |
| `NO_TEXT` | Metin bulunamadı; alan seçerek deneyebilirsin. | Manuel seçim, API çağrısı yok. |
| `LOW_OCR_QUALITY` | Metin belirsiz; sonucu kontrol et. | Alternatif pas/kırpım göster. |
| `OCR_UNAVAILABLE` | OCR servisi hazır değil. | Sağlayıcı fallback ve tekrar deneme. |
| `TRANSLATION_AUTH` | Çeviri anahtarı geçersiz veya yetkisiz. | Anahtarı loglama; ayarlara yönlendir. |
| `RATE_LIMITED` | Çeviri kotası dolu; sonra tekrar dene. | Backoff ve kuyruk. |
| `IMAGE_UNREADABLE` | Görsel okunamadı; yeniden yüklenmesini bekle. | Lazy-load/blob/canvas tekrar saptama. |
| `RENDER_OVERFLOW` | Çeviri balona sığmadı. | Kırpma yok; düzenleme seçeneği. |

## Güvenlik sınırları

- API anahtarı log, hata ekranı, kaynak harita veya senkronize dışa aktarımda bulunmaz.
- Piksel dış sağlayıcıya gönderilmeden önce kullanıcı mod/sağlayıcıyı görür; site bazlı kapatma vardır.
- Geniş izinler yalnız gerekçeyle istenir; anonim telemetri varsayılan kapalıdır.
- DRM/protection aşma, erişim engelini atlatma ve içerik yeniden dağıtma kapsam dışıdır.

## Entegrasyon kabul kriteri

- Bir gerçek sitede overlay akışı mevcut davranışı bozmaz.
- Yatay, dikey, ters renkli ve küçük metin örneği manuel testten geçer.
- Düşük güvenli alan kesin çeviri gibi gösterilmez.
- Aynı görsel tekrar yüklendiğinde OCR/DeepL çağrısı yapılmaz.
- İptal, kimlik doğrulama, kota ve görsel yüklenememe durumları anlaşılır mesaj verir.
- API anahtarı sürüm kontrolünde veya logda değildir.

