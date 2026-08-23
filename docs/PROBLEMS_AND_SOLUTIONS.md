# Sorunlar ve Uygulanan Çözümler

## 1. Ana projenin son sürümü mevcut değildi

**Risk:** Eski/açık kaynak bir sürümü ana proje sanarak yeniden yazmak, ana
bilgisayardaki ilerlemeyle çakışabilirdi.

**Çözüm:** Bağımsız ES modülleri ve açık veri sözleşmesi oluşturuldu. Mevcut
extension dosyaları hakkında varsayım yapılmadı. Tesseract adaptörü ayrı tutuldu.

## 2. GitHub deposu boştu

**Risk:** Çalışmanın amacı ve kararları yalnızca koddan anlaşılamazdı.

**Çözüm:** Kodla beraber bağlam, mimari, entegrasyon, sorun/çözüm günlüğü,
yol haritası, fixture ve testler hazırlandı.

## 3. OCR kelimeleri yan yana balonlarda birleşebiliyor

**Neden:** Tek aşamalı yakınlık algoritmaları aynı yatay banttaki bütün kelimeleri
tek küme sayabilir.

**Çözüm:** İki aşamalı gruplama kullanıldı. Kelimeler önce satıra; satırlar yalnızca
dikey yakınlık ve yatay örtüşme koşullarını birlikte sağladığında bölgeye bağlanır.
Yan yana iki balon için regression testi eklendi.

## 4. Farklı çözünürlüklerde sabit eşikler bozuluyor

**Neden:** Manga genişliği ve tarayıcı ölçeği değiştikçe `20px` aynı anlama gelmez.

**Çözüm:** Boşluk, padding ve satır toleransları medyan OCR kelime yüksekliğinin
katsayısı olarak hesaplanır.

## 5. Küçük metin yeterince okunamıyor

**Çözüm:** Her bölge için hedef karakter yüksekliğine göre `upscale` hesaplandı.
Güvene ve satır sayısına göre Tesseract PSM/polarite önerileri üretildi.

## 6. Türkçe çeviri İngilizceden uzun olup taşıyor

**Çözüm:** Binary search ile en büyük sığan font boyutu aranır; kelime sarma,
satır yüksekliği, padding ve harf aralığı birlikte hesaplanır. Sığmayan metin
kesilmez ve `TEXT_OVERFLOW` uyarısı üretir.

## 7. Hata gözle görülemiyor

**Çözüm:** Her bölgeyi güven puanına göre yeşil/turuncu/kırmızı gösteren bağımsız
SVG debug overlay üreticisi eklendi. Böylece “OCR kötü” yerine hangi kutunun neden
sorunlu olduğu kaydedilebilir.

## 8. Yerel Git HTTPS bileşeni eksikti

**Belirti:** `git: 'remote-https' is not a git command`.

**Çözüm:** Çalışma dosyaları yerel alanda hazırlanıp test edildi; GitHub'a bağlı
hesabın repository API'si üzerinden kaydedilecek şekilde süreç ayrıldı. Bu sorun
proje koduyla ilgili değildir.

