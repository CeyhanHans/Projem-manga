# Projem Manga — Ana Teknik Rapor

**Belge tarihi:** 23 Ağustos 2026  
**Destek kiti sürümü:** 0.2.0  
**Durum:** Ana extension'a bağlanmaya hazır bağımsız destek çekirdeği  
**Test durumu:** 24/24 başarılı

Bu belge yapılan bütün çalışmanın tek noktadan okunabilen kaydıdır. Her bölüm
“ne yapıldı, neden yapıldı, hangi sorunu çözüyor, nasıl çalışıyor ve nasıl
doğrulandı?” sorularını yanıtlar.

---

## 1. Bildiğimiz gerçek ana proje

Ana bilgisayardaki en güncel extension bu çalışma ortamında bulunmuyor. Kullanıcının
anlattığı son çalışan sistem şöyledir:

```text
Extension açılır
    ↓
DeepL API anahtarı okutulur
    ↓
OCR komutu verilir
    ↓
Sayfadaki manga metinleri otomatik bulunmaya çalışılır
    ↓
OCR ile kaynak metin okunur
    ↓
DeepL API ile Türkçeye çevrilir
    ↓
Çeviri manga üzerinde/extension arayüzünde gösterilir
```

Ana problemler:

1. OCR bazı konuşma balonlarını hiç bulamıyordu.
2. Hangi bölgede ne kadar yazı olduğu yanlış algılanabiliyordu.
3. Yan yana balonlar birleşebiliyordu.
4. Küçük veya düşük kontrastlı yazı yeterince okunamıyordu.
5. Siyah zemin üzerindeki beyaz yazı kaçabiliyordu.
6. Türkçe çeviri İngilizceden uzun olduğunda balondan taşıyordu.
7. Font boyutu, satır yüksekliği, kelime/harf aralığı otomatik uyarlanamıyordu.
8. “OCR kötü” denebiliyor fakat hatanın hangi aşamada olduğu ölçülemiyordu.

## 2. Neden ana extension yeniden yazılmadı?

Son kod başka bilgisayarda olduğu için ana extension'ı tahmin ederek yeniden yazmak
şu riskleri doğururdu:

- Çalışan DeepL entegrasyonunu bozmak.
- Ana bilgisayardaki yeni özelliklerle çakışmak.
- Eski dosyaları yeni sanarak yanlış mimari kurmak.
- API anahtarını veya kullanıcı ayarlarını yanlışlıkla kaynak koda taşımak.
- Daha sonra iki farklı projeyi birleştirmeyi zorlaştırmak.

Bu nedenle saf JavaScript ES modüllerinden oluşan bağımsız bir **destek kiti**
hazırlandı. Destek kiti ağ isteği yapmaz, API anahtarı tutmaz ve ana extension'ın
arayüzüne karar vermez. Yalnızca görüntü/OCR/yerleşim kararlarını üretir.

## 3. Kurulan genel mimari

```text
Canvas ImageData
    ↓
Alfa → beyaz arka plan + gri ton
    ↓
Yüzdelik kontrast germe
    ↓
Koyu ve açık yazı için iki Sauvola maskesi
    ↓
Connected components → olası harfler
    ↓
Harf → satır → metin bölgesi adayları
    ↓
Bölgesel crop/upscale/PSM/polarite planı
    ↓
Adaptif OCR ensemble
    ├─ baseline
    ├─ contrast
    ├─ adaptive-dark
    └─ adaptive-light
    ↓
Koordinat + metin konsensüsü
    ↓
Kelime → satır → konuşma bölgesi
    ↓
DeepL çevirisi (ana extension katmanı)
    ↓
Türkçe metni balona sığdırma
    ↓
Font profili + render/overlay
```

---

## 4. İlk sürümde yapılanlar — v0.1.0

### 4.1 Geometri çekirdeği

**Dosya:** `src/core/geometry.js`

**Sorun:** OCR motorları ve tarayıcı kodu dikdörtgenleri farklı biçimlerde
döndürebilir: `x0/y0/x1/y1`, `left/top/width/height` vb. Yanlış koordinat biçimi
balonları keser veya ekran dışına taşır.

**Çözüm:** Bütün dikdörtgenler tek biçime normalize edildi. Birleştirme, genişletme,
eksen örtüşmesi, yatay/dikey boşluk, merkez ve alan fonksiyonları eklendi.

**Neden:** Sonraki bütün algoritmalar aynı koordinat sistemine güvenebilmelidir.

### 4.2 OCR kelime temizleme ve Tesseract v5 adaptasyonu

**Dosya:** `src/ocr/normalize.js`

**Sorun:** Boş tokenlar, kontrol karakterleri, hatalı güven değerleri ve farklı bbox
biçimleri gruplama algoritmasını bozabilir. Tesseract.js v5'te kelimeler iç içe
`blocks → paragraphs → lines → words` yapısında bulunabilir.

**Çözüm:** Token temizleme, güven filtresi, bbox normalizasyonu ve iç içe Tesseract
verisini düz kelime listesine çevirme eklendi.

### 4.3 Kelime → satır → konuşma bölgesi algılama

**Dosya:** `src/ocr/region-detector.js`

**Sorun:** Tek aşamalı yakınlık algoritması yan yana balonları birleştirebilir.
Sabit `20px` eşikleri farklı manga çözünürlüklerinde bozulur.

**Çözüm:** İki aşamalı gruplama kuruldu:

1. Kelimeler dikey örtüşme ve yatay boşluğa göre satırlara alınır.
2. Satırlar dikey yakınlık ve yatay hizalamaya göre konuşma bölgelerine alınır.

Bütün eşikler sabit piksel yerine **medyan kelime yüksekliğinin katsayısıdır**.
Bu nedenle 800 px ve 3000 px genişliğindeki sayfalarda davranış ölçeklenebilir.

**Ek:** LTR ve manga için RTL okuma sırası desteklenir.

### 4.4 Tahmini balon alanı

**Dosya:** `src/ocr/region-detector.js`

**Sorun:** OCR kelime bbox'ı harflere çok sıkı oturur. Aynı alan yeniden OCR
yapılırsa kenardaki harfler kesilebilir; çeviri için de boşluk kalmaz.

**Çözüm:** Dar `bbox` korunurken çevresine karakter yüksekliğine bağlı padding
eklenerek ayrı `balloonBox` üretildi. Görüntü sınırlarının dışına çıkması engellendi.

### 4.5 Bölgeye özel OCR planı

**Dosya:** `src/ocr/preprocess-plan.js`

**Sorun:** Bütün sayfada tek büyütme ve tek PSM kullanmak küçük/büyük yazılarda
aynı sonucu vermez.

**Çözüm:** Her bölge için:

- Karakteri yaklaşık 48 px yüksekliğe taşıyan `upscale`.
- Tek satır/çok satır/seyrek metne uygun PSM.
- Düşük güvende çift polarite.
- Kontrast germe ve yeniden kontrol kararı.
- Her kararın nedenini anlatan `rationale`.

### 4.6 Türkçe metni balona sığdırma

**Dosya:** `src/layout/text-fit.js`

**Sorun:** Türkçe çeviri kaynak metinden daha uzun olabilir. Sabit font kullanmak
taşma veya okunamayacak kadar küçük yazı üretir.

**Çözüm:** Binary search ile kutuya sığan en büyük font aranır. Kelime sarma,
satır yüksekliği, padding, harf aralığı ve gerektiğinde sınırlı yatay ölçek üretilir.

**Güvenlik kararı:** Metin hiçbir zaman sessizce kesilmez. Minimum fontta dahi
sığmıyorsa `overflow: true` ve açıklayıcı uyarı döner.

### 4.7 Font profili

**Dosya:** `src/layout/font-profile.js`

**Sorun:** Bağırma/ünlem içeren manga metniyle normal diyalog aynı ağırlıkta
gösterilmemelidir. Koyu zeminde siyah yazı görünmez.

**Çözüm:** Büyük harf ve ünlem oranına göre ağırlık; arka plan parlaklığına göre
renk ve dış çizgi önerilir. Manga için dar font fallback zinciri sağlanır.

### 4.8 Tanılama SVG'si

**Dosya:** `src/diagnostics/debug-overlay.js`

**Sorun:** “OCR çalışmadı” ifadesi hangi bölgenin kaçtığını göstermez.

**Çözüm:** Her metin alanını güvene göre yeşil/turuncu/kırmızı kutuyla gösteren
SVG üretilir. Bölge kimliği ve güven puanı görüntüye eklenir.

### 4.9 Ölçülebilir başarı

**Dosya:** `src/diagnostics/evaluate-detection.js`

**Sorun:** Algoritma değiştikten sonra gerçekten iyileşip iyileşmediği yalnızca
gözle değerlendirilemez.

**Çözüm:** Beklenen ve bulunan kutular IoU ile eşlenir; precision, recall ve F1
hesaplanır. Kaçırılan ve yanlış pozitif bölgelerin kimlikleri raporlanır.

---

## 5. OCR güçlendirme sürümünde yapılanlar — v0.2.0

### 5.1 Önceki kod incelemesinde bulunan ana açık

İlk sürümdeki `region-detector` yalnızca OCR'ın **zaten gördüğü kelimeleri**
grupluyordu. OCR bir balonu tamamen kaçırdığında sisteme hiç bbox gelmiyor ve
balonu kurtaracak veri oluşmuyordu.

Bu nedenle OCR'dan önce çalışan piksel tabanlı bir metin aday dedektörü eklendi.

### 5.2 RGBA → güvenli gri ton

**Dosya:** `src/image/grayscale.js`

**Sorun:** Şeffaf PNG pikselleri doğrudan siyah kabul edilirse sahte koyu alanlar
oluşabilir.

**Çözüm:** Alfa kanalı önce beyaz arka planla birleştirilir; ardından Rec.601
ağırlıklarıyla gri tona çevrilir.

### 5.3 Yüzdelik kontrast germe

**Dosya:** `src/image/grayscale.js`

**Sorun:** Soluk tarama/JPEG görüntüsünde gerçek siyah ve beyaz kullanılmaz;
metinle arka plan arasındaki fark küçük kalır.

**Çözüm:** Yoğunluk histogramının %2 ve %98 noktaları 0–255 aralığına taşınır.
Aşırı uç birkaç pikselin bütün kontrastı bozması engellenir.

### 5.4 Büyük görüntü bellek koruması

**Dosya:** `src/image/grayscale.js`

**Sorun:** Adaptif eşik için iki `Float64` integral görüntü gerekir. Çok uzun
webtoon sayfası doğrudan işlenirse tarayıcı belleği ve gecikme büyür.

**Çözüm:** Aday tespit aşaması varsayılan olarak 2,5 milyon piksel bütçesiyle
sınırlandı. Büyük görüntü analiz için küçültülür; kutular orijinal koordinata geri
ölçeklenir. Daha sonra gerçek sayfa bölgesel/tile işlenebilir.

### 5.5 Sauvola adaptif eşikleme

**Dosya:** `src/image/adaptive-threshold.js`

**Sorun:** Global eşik renkli, gölgeli veya parlaklığı değişen manga panelinde
her bölgeye uymaz.

**Çözüm:** Integral görüntüyle her pikselin yerel ortalama ve standart sapması
hesaplanır. Sauvola eşiği komşuluğa göre belirlenir. Hesap O(piksel sayısı)
karmaşıklığındadır.

### 5.6 Doğru çift polarite

**Dosya:** `src/image/adaptive-threshold.js`

**Sorun:** Siyah yazı/beyaz balon dışında beyaz yazı/koyu panel vardır. Yalnızca
son maskeyi ters çevirmek yerel ortalamayı yanlış bırakır.

**Çözüm:** Açık metin geçişinde hem piksel değeri hem yerel ortalama matematiksel
olarak ters çevrilir; aynı “koyu foreground” formülü doğru uzayda uygulanır.

### 5.7 Connected components

**Dosya:** `src/image/connected-components.js`

**Sorun:** OCR çalışmadan önce olası harfleri geometrik olarak bulmak gerekir.

**Çözüm:** 4 veya 8 bağlantılı flood-fill bileşenleri çıkarılır. Her bileşen için
bbox, piksel sayısı, doluluk ve en-boy oranı hesaplanır.

### 5.8 Harf geometrisi filtresi ve metin adayları

**Dosya:** `src/image/text-candidate-detector.js`

**Sorun:** Connected components yalnızca harfleri değil panel çizgilerini, saçları,
noktaları ve büyük siyah alanları da bulur.

**Çözüm:** Bileşenler şu özelliklerle filtrelenir:

- Minimum/maksimum yükseklik oranı.
- Minimum piksel sayısı.
- En-boy oranı.
- Doluluk oranı.
- Görsel alanına göre maksimum bileşen alanı.

Kalan glif adayları mevcut satır/bölge algoritmasına sözde kelimeler olarak verilir.
Koyu ve açık polarite sonuçları örtüşme oranıyla tekilleştirilir. Sonuç LTR/RTL
okuma sırasına geri konur.

### 5.9 Morfoloji

**Dosya:** `src/image/morphology.js`

**Sorun:** Çok ince karakter vuruşları kopabilir; aşırı kalın vuruşlar birbirine
yapışabilir.

**Çözüm:** Dilation, erosion, opening ve closing fonksiyonları eklendi. Gerçek
görüntü ölçümü olmadan varsayılan zincire zorla eklenmedi; entegrasyon sırasında
vuruş kalınlığına göre seçilebilir.

### 5.10 OCR kalite puanı

**Dosya:** `src/ocr/quality.js`

**Sorun:** Her görselde bütün OCR geçişlerini çalıştırmak yavaş ve pahalıdır.

**Çözüm:** Karakter ağırlıklı güven, karakter miktarı ve şüpheli token oranından
kalite puanı hesaplanır. Sonuç yeterliyse fallback çalıştırılmaz.

### 5.11 Adaptif OCR ensemble

**Dosya:** `src/ocr/ensemble.js`

Varsayılan sıra:

1. `baseline`: gri ton, PSM 11.
2. `contrast`: %2–98 kontrast + kenar boşluğu.
3. `adaptive-dark`: koyu yazı Sauvola.
4. `adaptive-light`: açık yazı Sauvola.

**Davranış:** İlk geçiş iyiyse durur. Zayıfsa devam eder. Bir worker/geçiş hata
verirse hata kayıt altına alınır ve diğer geçişler sürer.

### 5.12 Çoklu geçiş konsensüsü

**Dosya:** `src/ocr/multi-pass-merge.js`

**Sorun:** Tek geçiş `STAYS`, diğerleri `STATS` okuyabilir. En yüksek tek güvene
bakmak kararsız olabilir.

**Çözüm:** Kelimeler bbox IoU veya normalize merkez mesafesine göre kümelenir.
Metinler NFKC normalize edilir. Aynı metni okuyan bağımsız geçiş sayısı güven
bonusuna dönüşür. Kazanan sonuç seçilir; alternatifler ve hangi geçişlerin ne
okuduğu `provenance` içinde saklanır.

---

## 6. Kod incelemesi sırasında yakalanan gerçek hata

Yeni piksel dedektörünün ilk testinde 23 testten 21'i geçti. Metin adayları
duplicate suppression sırasında güven puanına göre sıralandığı için görsel okuma
sırasını kaybediyordu.

**Çözüm:** Tekilleştirme sonrasında adaylar tekrar satırlara ayrıldı ve seçilen
LTR/RTL yönüne göre sıralandı. Hata GitHub'a gönderilmeden önce regression testiyle
yakalandı.

İkinci kırmızı test ürün hatası değildi: yüksek kaliteli ikinci OCR geçişinden sonra
erken durdurma doğru çalışmıştı; ancak test üç geçişli konsensüs bekliyordu. Teste
`minimumPasses: 3` eklenerek istenen senaryo açık hâle getirildi.

## 7. Test stratejisi ve doğrulama

Harici test paketi kullanılmadı; Node'un yerleşik `node:test` modülü kullanıldı.

Doğrulanan ana davranışlar:

- Yan yana balonların ayrı kalması.
- RTL manga okuma sırası.
- Balon kutusunun görsel dışına çıkmaması.
- Düşük güvenli gürültünün elenmesi.
- Türkçe metnin sarılması ve taşmanın raporlanması.
- Tesseract v5 iç içe kelime çıkarımı.
- Debug SVG üretimi.
- IoU/precision/recall/F1 hesabı.
- Alfa kanalının güvenli birleştirilmesi.
- Kontrast germe.
- Koyu ve açık Sauvola polaritesi.
- Connected components istatistikleri.
- Morfoloji davranışı.
- OCR olmadan iki ayrı metin bölgesi bulma.
- `STAYS`/`STATS` konsensüsü.
- Düşük kalitede retry, yüksek kalitede erken durma.
- OCR worker hatasından toparlanma.

Sonuç: **24 test, 24 başarılı, 0 başarısız.** Bütün `src/**/*.js` dosyaları ayrıca
Node sözdizimi denetiminden geçti. GitHub Actions her push ve pull request'te testleri
çalıştıracak şekilde yapılandırıldı.

## 8. Güvenlik kararları

- DeepL veya başka API anahtarı hiçbir kaynak dosyaya yazılmadı.
- Destek kiti ağ isteği yapmıyor.
- API çağrısı ana extension katmanında kalacak.
- Loglarda Authorization/API key gösterilmemeli.
- Fixture ve hata raporları repoya eklenmeden önce gizli bilgiler temizlenmeli.
- Sızan anahtar yalnızca Git geçmişinden silinmemeli; sağlayıcıdan iptal edilmelidir.

Ayrıntı: `SECURITY.md`.

## 9. Karşılaşılan operasyonel sorunlar

### Yerel Git HTTPS bileşeni eksikti

Belirti:

```text
git: 'remote-https' is not a git command
```

Bu proje koduyla ilgili değildi. Dosyalar yerelde hazırlanıp test edildi; bağlı
GitHub hesabının repository API'si ile blob/tree/commit olarak kaydedildi.

### Windows yol ayırıcıları

İlk tam ağaç aktarımında `docs\CONTEXT.md` gibi ters bölü çizgili yollar oluştu.
Uzak repo hemen doğrulandı, hata bulundu ve yeni tam ağaç `/` yollarıyla kuruldu.
Ana dalın güncel ağacında doğru klasörler bulunuyor.

## 10. Bilerek reddedilen/ertelenen çözümler

### Ana extension'ı tahmin ederek yeniden yazmak

Reddedildi; son kod olmadığı için çakışma riski yüksek.

### Her zaman dört OCR geçişi

Reddedildi; kaliteli sayfalarda gereksiz gecikme üretir. Kalite tabanlı erken durma
kullanıldı.

### Sabit piksel eşikleri

Reddedildi; çözünürlük değişiminde bozulur. Medyan karakter yüksekliği ve görsel
oranları kullanıldı.

### Metni zorla küçültmek veya kesmek

Reddedildi; okunabilirlik/anlam kaybı yaratır. Taşma açıkça raporlanır.

### OpenCV.js'yi hemen pakete eklemek

Ertelendi; bundle boyutu, WASM/CSP ve entegrasyon yükü getirir. Gereken temel
algoritmalar bağımsız JavaScript yazıldı.

### DBNet/CRAFT gibi ağır model eklemek

Ertelendi; gerçek benchmark olmadan model boyutu ve WebGPU/WASM maliyeti bilinmiyor.
İleride opsiyonel text detector sağlayıcısı olabilir.

### Tesseract modelini hemen yeniden eğitmek

Ertelendi; önce görüntü hazırlama ve gerçek hata veri seti tamamlanmalı.

## 11. Ana extension geldiğinde entegrasyon sırası

1. Ana bilgisayardaki son kod ayrı dal/ZIP ile yedeklenir.
2. Mevcut OCR fonksiyonunun aldığı görüntü ve döndürdüğü veri kaydedilir.
3. Destek kiti önce yalnızca debug/gözlem modunda bağlanır.
4. `detectTextCandidates()` sonuçları mevcut OCR sonuçlarıyla karşılaştırılır.
5. Gerçek sorunlu 10–30 sayfa fixture hâline getirilir.
6. Precision/recall/F1 temel ölçümü çıkarılır.
7. Yalnızca düşük güvenli bölgelerde `runAdaptiveOcr()` etkinleştirilir.
8. Konsensüs kelimeleri mevcut balon gruplamaya aktarılır.
9. DeepL sonuçları `fitTextToBox()` ile yerleştirilir.
10. Canvas `measureText` gerçek font ölçümü sağlanır.
11. Sonuç eski pipeline ile A/B karşılaştırılır.

## 12. Kalan sınırlar

- Sentetik test gerçek manga fontlarının tamamını temsil etmez.
- Gerçek balon dış çizgisi segmentasyonu henüz yok; dikdörtgen tahmini var.
- Eğik/dikey yazı için deskew ve özel okuma sırası yok.
- Büyük/çizimle birleşik SFX yanlış pozitif oluşturabilir.
- Uzun webtoon tam çözünürlükte tek parça yerine tile/bölge analizi gerektirebilir.
- Gerçek font ölçümü ana extension Canvas bağlanınca kesinleşecek.
- DeepL çağrısı bu bağımsız kitte uygulanmadı; çalışan ana projede korunacak.

## 13. Kullanılan birincil teknik kaynaklar

- [Tesseract — Improving the quality of the output](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)
- [Tesseract — Page Segmentation Modes](https://tesseract-ocr.github.io/tessdoc/Command-Line-Usage.html)
- [Tesseract — confidence ve bounding box API örneği](https://tesseract-ocr.github.io/tessdoc/APIExample.html)
- [OpenCV — Adaptive Thresholding](https://docs.opencv.org/4.13.0/d7/dd0/tutorial_js_thresholding.html)
- [OpenCV — Connected Components](https://docs.opencv.org/doc/doxygen/html/d3/dc0/group__imgproc__shape.html)
- [MDN — Canvas Pixel Manipulation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas)

## 14. Belge ve dosya haritası

| Dosya | İçerik |
|---|---|
| `README.md` | Hızlı proje özeti ve kullanım |
| `docs/MASTER_REPORT_TR.md` | Bütün çalışmanın ana raporu |
| `docs/CONTEXT.md` | Kullanıcıdan alınan proje bağlamı |
| `docs/ARCHITECTURE.md` | Veri akışı ve teknik mimari |
| `docs/INTEGRATION.md` | Ana extension'a bağlama sırası ve kod örnekleri |
| `docs/PROBLEMS_AND_SOLUTIONS.md` | Sorun → neden → çözüm kayıtları |
| `docs/OCR_RESEARCH.md` | Araştırma kaynakları ve teknik kararlar |
| `docs/CODE_REVIEW.md` | Önceki/yeni kod incelemesi |
| `docs/DECISION_LOG.md` | Mimari kararların gerekçeleri |
| `docs/TEST_MATRIX.md` | Testlerin hangi riski koruduğu |
| `docs/ROADMAP.md` | Tamamlanan ve sıradaki işler |
| `docs/WORKLOG.md` | Tarihsel çalışma günlüğü |
| `CHANGELOG.md` | Sürüm geçmişi |
| `SECURITY.md` | API anahtarı ve log güvenliği |

Bu rapor ana bilgisayardaki gerçek extension geldiğinde entegrasyonun başlangıç
noktasıdır. Kod değişmeden önce bu belgedeki sınırlar ve entegrasyon sırası
kontrol edilmelidir.

