# Manga Çeviri Ekosistemi ve Özellik Fırsatları

**Tarih:** 23 Ağustos 2026. Bu, dünyadaki her ürünü kapsadığı iddiasında olmayan; proje için doğrudan uygulanabilir, doğrulanmış kaynaklardan derlenmiş kapsamlı bir listedir. Açık kaynak projeler ilk sıradadır.

## Sonuç: neyi hedefliyoruz?

Doğru yön “tek OCR çağrısı + tek çeviri” değildir: **algıla → güveni ölç → gerekirse çoklu OCR → alanı temizle → taşmayacak biçimde diz → kullanıcıya düzeltme ver**. Mevcut destek paketi bunun algılama, OCR planı, kalite ve metin-sığdırma kısmını hazırlar.

Öncelik sırası: (P0) seçilebilir bölge/maske düzenleme, OCR önizlemesi ve kalite uyarısı; (P0) görünür alan kuyruğu, iptal ve hash önbelleği; (P1) inpainting/temizleme adaptörü ve orijinal–çeviri geçişi; (P1) sözlük, bölüm bağlamı, çeviri belleği; (P2) okuma geçmişi, sözlük/öğrenme ve sesli okuma.

## Açık kaynak projeler (öncelikli)

| Proje | Yapı | Alınabilecek özellik / ders |
| --- | --- | --- |
| [MangoTL](https://github.com/gpdir16/MangoTL) | Uzantı + self-hosted yerel sunucu | Seçili görsel baytını yerel sunucuya verme, PaddleOCR/manga-ocr, OpenAI-uyumlu çeviri, çevrilmiş resim dönüşü. Uzantı–yerel servis sözleşmesi için yakın örnek. |
| [ComicTL](https://github.com/kiuyha/ComicTL) | Tarayıcı tabanlı yerel/hibrit | Yerelde balon algılama + WebGPU, bulut VLM alternatifi, boyanmış çeviri, orijinal aç/kapat. Gizlilik modunu sağlayıcıdan ayırma fikri. |
| [PanoraTL extension](https://github.com/PanoraTL/extension) | MV3/Plasmo uzantısı | Görsel algılayıcı, canvas/fetch kaynakları, sınırlı eşzamanlı istek kuyruğu, canlı overlay. MV3’te iptal/back-pressure referansı. |
| [Manga Translator Extension](https://github.com/lehuyqq/Manga-Translator-Extension) | Chrome + FastAPI | Manuel/otomatik tarama, otomatik kaydırma, metin-dışı filtre, yerel backend/LLM ayarları. |
| [local-manga-translator](https://github.com/mrdhnto/local-manga-translator) | Yerel LLM uzantısı | Çevrilmiş bölge üzerine gelince orijinali gösterme. “Silmeden önce overlay” için iyi varsayılan. |
| [ImageTrans Chrome extension](https://github.com/xulihang/ImageTrans_chrome_extension) | Açık kaynak uzantı | Sağ tık/işaretçi yanında çeviri, sessiz çeviri, batch, bölgesel ekran OCR, panoya alma. Otomatik algılama başarısızsa manuel alan geri dönüşü. |
| [Copyfish](https://github.com/A9T9/Copyfish) | OCR/çeviri uzantısı | Ekran, video ve PDF’den alan seçimi; klavye odaklı hızlı akış. |
| [manga-image-translator](https://github.com/zyddnys/manga-image-translator) | Uçtan uca motor | Algılama/OCR/çeviri/inpainting/dizgi, maske genişletme, çeviri zinciri, sözlük, sayfa bağlamı. En güçlü teknik referans. |
| [comic-translate](https://github.com/ogkalu2/comic-translate) | Masaüstü/servis motoru | Balon algılama, çoklu OCR, LaMa/AOT-GAN temizleme, PDF/EPUB/CBR/CBZ. |
| [BallonsTranslator](https://github.com/dmMaze/BallonsTranslator) | Bilgisayar destekli çeviri | Elle maske düzenleme, inpainting, görüntü/metin düzenleme: tam otomasyonun yanında insan kontrolü. |
| [Xianscan](https://github.com/ArbenApura/xianscan) | Self-hosted web app | Detector → OCR → sözlük destekli çeviri → LaMa → font dizgisi; değiştirilebilir pipeline örneği. |
| [FrankYomik](https://github.com/akitaonrails/FrankYomik) | Yerel webtoon/manga hattı | Balon algıla → OCR → yerel LLM → render; webtoon akışı. |
| [manga-ocr](https://github.com/kha-white/manga-ocr) | Uzman Japonca OCR | Dikey/yatay yazı, furigana, stilize font, çok satırlı balon. Her zaman metin döndürebildiği için kalite/boşluk kontrolü şarttır. |
| [Yomikomi](https://github.com/sieugene/yomikomi) | Manga/Japonca okuyucu | Tarayıcı OCR, sözlük ve öğrenme yardımı; çevirinin yanında okuma deneyimi fikri. |

### Açık kaynaklardan alınacak mimari kalıplar

- OCR, çeviri ve inpainting tek sağlayıcıya bağlanmaz; her biri adaptördür.
- Kullanıcı “yalnız cihaz”, “yerel servis”, “kendi API anahtarım ile bulut” modunu açıkça seçer.
- Önce görünür görseller, sonra yakın kaydırma alanı işlenir; ekrandan çıkan iş iptal edilir.
- Her bölge, kaynak metni, OCR motor/pası ve kalite puanıyla saklanır; kullanıcı düzeltmesi makine önerisini ezer.
- Algılanan kutu öneridir: maske/kutu editörü zorunlu kaçış kapısıdır.
- İlk sürüm render’ı geri alınabilir overlay olmalıdır; piksel temizleme ayrı katmandır.

## Ticari veya kaynağı açık olmayan ürünler

Bu ürünlerden özellik fikri alınabilir; kod, model ağırlığı, veri seti veya marka öğesi kopyalanmaz. Açık repo bulunmadıkça bu grupta değerlendirilir.

| Ürün | Öne çıkan işlev | Alınabilecek fikir |
| --- | --- | --- |
| [MangaLens](https://usemangalens.com/) | Sayfa içi balonlar, ön tarama, önbellek, sözlük, manuel düzeltme, geçmiş, bildirim, sesli okuma | Görünür alan önceliği, SFX/bağırış politikası, sözlük ve düzeltme akışı. |
| [Torii](https://toriitranslate.com/pages/extension/extension.html) | Chromium/Firefox/Android, bulk görsel, oyun OCR, çeviri geçmişi, OCR alan modu | Geçmiş/önbellek, alan seçerek tekrar OCR, kısayollar. |
| [Ichigo Translator](https://ichigo.gumroad.com/l/ichigo-reader) | Birden çok ücretli OCR/çeviri sağlayıcısı, batch | Sağlayıcı fallback, maliyet/kredi görünürlüğü. |
| [ImageTrans](https://imagetrans.readthedocs.io/en/latest/textarea_detection_and_text_reinjection.html) | Çoklu alan algılama, maske editörü, temizleme, renk/döndürme/font ayarı, TTS | Algılayıcı çeşitliliği, min/max font, text-free orijinal saklama. Chrome uzantı parçası açıktır; masaüstü ürün mixed kabul edilir. |
| [ImageTranslate](https://www.imagetranslate.com/translators) | OCR alan seçimi, çeviri sonrası edit, tasarımı koruma | İnsan son rötuş editörü; stil bilgilerini ayrı modelleme. |
| [Google Translate / Lens](https://blog.google/products-and-platforms/products/translate/new-features-make-translate-more-accessible-for-its-1-billion-users/) | Görselde doğal metin harmanlama, cihazda çalışma seçenekleri | Orijinal/çeviri geçişi, bağlamsal render, offline hedef. |
| [DeepL image translation](https://support.deepl.com/hc/en-us/articles/4408415322130-Translate-text-from-an-image-in-the-mobile-apps) | Overlay toggle, kaynak/çeviri ayrıntısı, döndürme, kopyalama | Mevcut DeepL akışına güvenli overlay, ayrıntı ve yeniden deneme kontrolleri. |
| [Papago](https://papago.naver.com/) | Görsel/belge/web çeviri, geçmiş, favori, sözlük, alan vurgulama | Lasso seçimi, geçmiş/favori/sözlük, seri görsel işleme. |
| [Microsoft image translation](https://support.microsoft.com/en-US/defender/translate-text-on-images) | Görüntü/PDF/kamera metnini seçme, kopyalama, paylaşma, arama | OCR sonucunu çizimin yanında tekrar kullanılabilir veri yapmak. |

## Uygulanabilir özellik havuzu

| Öncelik | Özellik | Başarı ölçütü |
| --- | --- | --- |
| P0 | Bölge/maske elle düzeltme | Düşük güvenli alan 2–3 hareketle seçilebilir. |
| P0 | OCR önizlemesi + kalite rozeti | Düşük kalite otomatik kesin çeviri olarak yayınlanmaz. |
| P0 | Overlay ve orijinal/çeviri toggle | Orijinal piksel her an erişilebilir. |
| P0 | Hash önbelleği, görünür alan kuyruğu | Aynı görsel tekrar API’ye gönderilmez; okuma akışı tıkanmaz. |
| P1 | Balon maskesi + geri alınabilir inpainting | Maske taşması/eksikliği düzenlenebilir. |
| P1 | Sözlük, isim kilidi, bölüm bağlamı | Terimler bölüm boyunca tutarlı kalır. |
| P1 | Çoklu sağlayıcı/fallback | Sağlayıcı arızası kullanıcı işini kaybettirmez. |
| P1 | SFX/bağırış/altyazı politikası | Kullanıcı kategori için atla/overlay/render seçer. |
| P2 | Geçmiş, favori, bildirim | Tamamen isteğe bağlı, yerel varsayılanlıdır. |
| P2 | Sözlük/öğrenme, sesli okuma | Kaynak kelime ve çeviri kolayca karşılaştırılır. |
| P2 | Yerel WebGPU/OCR | Buluta piksel çıkmadan çalışma modu görünürdür. |

## Projeye önerilen mimari

```text
content script → görünür görsel/overlay/kullanıcı düzenlemesi
background coordinator → hash önbellek + kuyruk + izin/site profili
pipeline → normalize → aday algılama → OCR ensemble → quality gate
         → glossary/context translation → text fit → overlay/reversible render
correction store → maske, OCR düzeltmesi, terim, render tercihi
```

Mevcut `src/image`, `src/ocr`, `src/layout` ve `src/pipeline` modülleri pipeline’ın ilk yarısını bağımsız tutar. Ana uzantıya alınırken UI koduna gömülmemeli; background/local-service sınırında analiz paketi kalmalıdır.

## Lisans, telif ve güvenlik

- Açık repo, kodun/modelin/fontun/veri setinin otomatik serbest dağıtılabildiği anlamına gelmez. Her bağımlılık için repo, model ve veri lisansı ayrı kontrol edilir.
- Fikir/mimari alınır; kaynak kod doğrudan kopyalanmaz. Copyleft koşulları dağıtımdan önce incelenir.
- `all_urls`, görselin dış sağlayıcıya gönderimi ve API kullanımı açık rıza/gerekçe ister.
- DeepL anahtarı kaynak koda, loga veya `chrome.storage.sync` içine girmez; görünür hata mesajlarında da maskelenir.
- Erişim engeli/DRM aşma, içerik indirme ve yeniden dağıtma kapsam dışıdır.

## Kaynaklar

Üretime alma öncesi ilgili projenin güncel README, issue ve lisansını tekrar kontrol edin; OCR projeleri hızlı değişir.

- [MangoTL](https://github.com/gpdir16/MangoTL), [ComicTL](https://github.com/kiuyha/ComicTL), [PanoraTL](https://github.com/PanoraTL/extension), [Copyfish](https://github.com/A9T9/Copyfish)
- [manga-image-translator](https://github.com/zyddnys/manga-image-translator), [comic-translate](https://github.com/ogkalu2/comic-translate), [BallonsTranslator](https://github.com/dmMaze/BallonsTranslator), [manga-ocr](https://github.com/kha-white/manga-ocr)
- [ImageTrans docs](https://imagetrans.readthedocs.io/en/latest/textarea_detection_and_text_reinjection.html), [MangaLens](https://usemangalens.com/), [Torii](https://toriitranslate.com/pages/extension/extension.html), [DeepL](https://support.deepl.com/hc/en-us/articles/4408415322130-Translate-text-from-an-image-in-the-mobile-apps)

