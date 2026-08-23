# Çalışma Günlüğü — 23 Ağustos 2026

## İncelenen bilgiler

- Önceki konuşmalardaki hedef: manga/web sayfası OCR → Türkçe çeviri extension'ı.
- Kullanıcının verdiği gerçek son durum: DeepL API kullanılan, sayfadaki OCR'ları
  otomatik okumaya çalışan çalışan sürüm ana bilgisayarda.
- Ana sorunlar: eksik bölge algılama, yanlış otomatik kırpma/ölçek, balona uymayan
  font ve kelime aralıkları.
- `CeyhanHans/Projem-manga` özel deposu bulundu; başlangıçta boştu.

## Üretilen mimari

Ana extension'dan bağımsız “support kit” yaklaşımı seçildi. Bunun nedeni bilinmeyen
son sürümü tahmin ederek değiştirmemek ve daha sonra kontrollü entegrasyon yapmaktır.

Üretilen bileşenler:

- Geometri yardımcıları.
- OCR veri temizleme ve Tesseract v5 kelime çıkarımı.
- İki aşamalı satır/bölge kümeleme.
- LTR ve RTL okuma sırası.
- Güvenli tahmini balon alanı.
- Bölgesel yeniden OCR planı.
- Türkçe tipografi yerleşim motoru.
- Font profili önerisi.
- Tek birleşik analiz pipeline'ı.
- SVG debug overlay.
- Eski `{en, fr, confidence, bbox}` biçimine adaptör.

## Doğrulama

Testler şu davranışları korur:

- Yan yana iki balon ayrı kalır.
- Manga RTL okuma sırası uygulanır.
- Balon kutusu görüntünün dışına taşmaz.
- Düşük güvenli gürültü filtrelenir.
- Türkçe metin otomatik sarılır.
- Sığmayan çeviri kesilmeden uyarılır.
- Tesseract v5'in iç içe blok yapısı okunur.
- Debug SVG üretilebilir.

## Karşılaşılan operasyonel sorun

Yerel Codex Git paketinde `git-remote-https` bulunmadığı için normal HTTPS clone
başarısız oldu. Bu durum geliştirme kodunu etkilemedi. Dosyalar yerelde üretildi;
GitHub'a bağlı hesap üzerinden repo API'siyle aktarım yolu kullanıldı.

## Sonraki geliştiriciye not

Ana bilgisayardaki extension gelmeden bu eşikleri “daha iyi görünmesi” için
rastgele değiştirmeyin. Her hata için gerçek OCR kelimelerini fixture olarak ekleyin,
önce kırmızı test oluşturun, sonra algoritmayı düzeltin.

---

## OCR güçlendirme — aynı gün ikinci çalışma

Resmî Tesseract, OpenCV ve Canvas kaynakları incelendi. Önceki kodun ana açığı,
OCR'ın hiç görmediği balonu tespit edememesiydi.

Eklenenler:

- RGBA/alfa güvenli gri ton dönüşümü.
- Yüzdelik kontrast germe.
- Integral görüntü tabanlı Sauvola adaptif eşikleme.
- Koyu ve açık yazı için doğru çift polarite.
- 4/8 bağlı bileşen analizi ve harf geometrisi filtreleri.
- OCR'dan bağımsız metin bölgesi adayları.
- Büyük görüntüler için 2,5 MP analiz bütçesi.
- OCR kalite puanı ve pahalı fallbackleri gereksizken durdurma.
- Baseline/contrast/adaptive-dark/adaptive-light geçiş planı.
- Aynı koordinattaki okumaları metin konsensüsüyle birleştirme.
- Geçiş hatasında diğer sonuçlarla devam etme.

İlk yeni test çalışmasında 21/23 başarı görüldü. Adayların okuma sırası hatası
düzeltildi; konsensüs testi açıkça üç geçiş isteyecek şekilde netleştirildi.
Morfoloji yardımcıları ve testi eklendi. Son durum 24/24 başarılı ve bütün
kaynaklar sözdizimi kontrolünden geçti.

