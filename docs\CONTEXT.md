# Proje Bağlamı

## Kullanıcıdan alınan son gerçek çalışma bilgisi

Ana bilgisayardaki extension'ın son sürümü bu depoda bulunmuyor. Kullanıcının
anlattığı çalışan kaba akış şöyledir:

```text
Extension açılır
  → DeepL API anahtarı girilir/okutulur
  → OCR komutu verilir
  → Sayfadaki metinler otomatik okunmaya çalışılır
  → Çevrilmesi gereken manga metinleri API ile Türkçeye çevrilir
```

Bilinen sorunlar:

1. Sayfadaki metin bölgelerinin tamamı otomatik ve güvenilir biçimde bulunamıyor.
2. Hangi bölgede ne kadar yazı olduğu yanlış tahmin edilebiliyor.
3. Konuşma balonuna göre OCR kırpma alanı ve büyütme seviyesi seçilemiyor.
4. Türkçe çeviri uzadığında font boyutu, satır kırılması, kelime/harf aralığı ve
   balona sığdırma bozuluyor.
5. Ana projenin son kodları başka bilgisayarda olduğu için doğrudan değişiklik
   yapmak güvenli değil.

## Bu depoda çözülen kapsam

Bu depo API veya ana extension yerine **karar katmanı** üretir:

- OCR kelimelerini normalize eder.
- Kelimeleri önce satırlara, sonra konuşma bölgelerine gruplar.
- Bölgenin çevresinde güvenli bir tahmini balon kutusu oluşturur.
- Küçük/düşük güvenli her bölgeye özel yeniden-OCR planı üretir.
- Türkçe metni kutuya sığdıracak tipografi değerlerini hesaplar.
- Sonucu incelemek için renk kodlu SVG kutuları üretir.
- Tesseract.js v5 verisini mevcut extension'a yakın bir biçime dönüştürür.

## Bilerek yapılmayanlar

- DeepL anahtarı veya başka bir gizli bilgi depoya yazılmadı.
- Bilinmeyen ana extension kodu taklit edilmedi.
- Görüntü üzerine kalıcı yazı basılmadı; yalnızca uygulanabilir yerleşim planı
  üretildi.
- Piksel tabanlı gerçek konuşma balonu segmentasyonu henüz eklenmedi. Bunun için
  gerçek manga örnekleri ve ana bilgisayardaki pipeline gerekir.

## Ana proje geldiğinde toplanması gereken kanıtlar

Her sorunlu sayfa için aşağıdakiler kaydedilmelidir:

- Orijinal ekran görüntüsü veya manga görseli.
- OCR motorunun ham kelimeleri: `text`, `confidence`, `bbox`.
- Beklenen konuşma bölgeleri.
- Gerçekte algılanan bölgeler.
- Kaynak metin ve DeepL sonucu.
- Kullanılan görsel ölçeği, sayfa zoom'u ve cihaz piksel oranı.
- Hata süresi: yakalama, OCR, çeviri, render.

Bu veri olmadan eşikleri rastgele değiştirmek yerine, fixture/test eklenerek her
düzeltmenin önceki örnekleri bozmadığı kanıtlanmalıdır.

