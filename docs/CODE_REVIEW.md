# Kod İncelemesi — v0.2.0

## İncelenen önceki modüller

- Geometri ve dikdörtgen normalizasyonu
- OCR kelime temizleme
- Satır ve konuşma bölgesi gruplama
- Bölgesel yeniden OCR planı
- Türkçe metni balona sığdırma
- Font profili
- Tesseract adaptörü
- SVG debug ve başarı ölçümü

## Önceki kodun doğru kalan tarafları

- Sabit piksel yerine medyan kelime yüksekliği kullanılması ölçek değişimine dayanıklı.
- Yan yana balon testi gerçek bir regression koruması sağlıyor.
- Metin taşmasında sessiz kesme yapılmıyor.
- Ağ isteği/API anahtarı ana karar katmanına karıştırılmamış.
- Çıktılar sürümlü ve Tesseract adaptörü çekirdekten ayrılmış.

## Bulunan ana mimari eksik

Önceki `region-detector`, yalnızca OCR'ın zaten bulduğu kelimeleri işliyordu. OCR
bir balonu tamamen kaçırdığında sistemin o balonu kurtarma yolu yoktu.

**Düzeltme:** OCR'dan önce çalışan `detectTextCandidates()` eklendi. Canvas
`ImageData` → gri ton → kontrast → iki polarite Sauvola → bağlı bileşen → harf
filtresi → metin bölgesi akışı kuruldu.

## Yeni geliştirmede test sırasında bulunan hata

Metin adayları duplicate suppression sonrasında güven puanına göre kalıyor ve
görsel okuma sırasını kaybediyordu.

**Düzeltme:** Adaylar satırlara ayrılıp seçilen LTR/RTL yönüne göre tekrar sıralandı.
Bu hata kırmızı test sırasında, GitHub'a gönderilmeden önce yakalandı.

## Doğrulama

- 24 test başarılı.
- Bütün `src/**/*.js` dosyaları Node sözdizimi denetiminden geçti.
- Koyu ve açık yazı polaritesi ayrı test edildi.
- OCR olmadan iki ayrı metin alanı bulma testi eklendi.
- Çoklu geçişte yanlış `STAYS` / doğru `STATS` konsensüs testi eklendi.
- OCR worker hatasında diğer geçişlerden toparlanma testi eklendi.
- Dilation/erosion/closing davranışı test edildi.

## Kalan gerçek riskler

- Sentetik glif testi gerçek manga fontlarının yerini tutmaz.
- Eğik/dikey yazı için özel deskew ve okuma sırası henüz yok.
- SFX çizime benzediği için bağlı bileşen filtresinde yanlış pozitif oluşturabilir.
- Piksel dedektörü en fazla 2,5 milyon pikselde analiz yapıp büyük görüntüyü
  küçültür; çok küçük yazı için sayfa yerine bölüm bölüm tarama gerekebilir.
- Gerçek Canvas font ölçümü ana extension entegrasyonunda verilmelidir.

