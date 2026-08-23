# Mimari Karar Günlüğü

Bu dosya yalnızca ne yapıldığını değil, neden o yolun seçildiğini kaydeder.

## ADR-001 — Ana extension yerine bağımsız destek kiti

- **Durum:** Kabul edildi.
- **Bağlam:** Ana bilgisayardaki son extension kodu mevcut değil.
- **Karar:** Ağ/API/UI katmanından bağımsız saf ES modülleri üretmek.
- **Neden:** Son kodla çakışmayı ve çalışan DeepL akışını bozmayı önlemek.
- **Bedel:** Gerçek entegrasyon ana kod geldiğinde yapılacak.

## ADR-002 — Sabit piksel yerine medyan karakter yüksekliği

- **Durum:** Kabul edildi.
- **Karar:** Boşluk/padding/gruplama eşiklerini medyan OCR kelime yüksekliğiyle
  ölçeklemek.
- **Neden:** Farklı çözünürlük ve tarayıcı zoom'larında aynı davranışı korumak.

## ADR-003 — İki aşamalı bölge gruplama

- **Durum:** Kabul edildi.
- **Karar:** Önce kelime → satır, sonra satır → balon.
- **Neden:** Yan yana konuşma balonlarının tek kümeye dönüşmesini azaltmak.

## ADR-004 — Metin bbox ve balloonBox ayrımı

- **Durum:** Kabul edildi.
- **Karar:** OCR'ın dar kutusunu koruyup yeniden OCR/render için paddingli ayrı kutu
  üretmek.
- **Neden:** Kenar kesilmesini önlemek ve çeviri için kullanılabilir alan sağlamak.

## ADR-005 — Sessiz metin kesme yok

- **Durum:** Kabul edildi.
- **Karar:** Türkçe metin minimum fontta sığmıyorsa `overflow` raporlamak.
- **Neden:** Anlam ve okunabilirlik kaybını gizlememek.

## ADR-006 — OCR öncesi piksel metin dedektörü

- **Durum:** Kabul edildi.
- **Karar:** OCR kelimesi olmadan ImageData üzerinden metin adayları çıkarmak.
- **Neden:** OCR'ın tamamen kaçırdığı balonları kurtarabilmek.

## ADR-007 — İki polariteli Sauvola

- **Durum:** Kabul edildi.
- **Karar:** Koyu ve açık metni ayrı adaptif eşik geçişlerinde aramak.
- **Neden:** Beyaz yazı/koyu panel ve değişken aydınlatma desteği.

## ADR-008 — OpenCV.js zorunlu bağımlılık değil

- **Durum:** Kabul edildi.
- **Karar:** Gerekli integral görüntü, connected-components ve morfolojiyi saf JS
  uygulamak.
- **Neden:** MV3 CSP, WASM, bundle boyutu ve entegrasyon yükünü düşük tutmak.
- **Tekrar değerlendirme:** Gerçek benchmark OpenCV.js lehine belirgin sonuç verirse.

## ADR-009 — Kalite tabanlı erken durdurma

- **Durum:** Kabul edildi.
- **Karar:** İlk OCR iyi olduğunda ek geçişleri çalıştırmamak.
- **Neden:** Her sayfada 4× OCR gecikmesini engellemek.

## ADR-010 — Tek güven yerine konsensüs

- **Durum:** Kabul edildi.
- **Karar:** Aynı koordinattaki sonuçları metin oyu + güven ile birleştirmek.
- **Neden:** Bir preprocessing yolundaki yüksek güvenli hatanın kesin sonuç olmasını
  önlemek.

## ADR-011 — 2,5 MP ön analiz bütçesi

- **Durum:** Kabul edildi.
- **Karar:** Büyük görüntüyü metin adayı tespitinde küçültmek ve kutuları geri
  ölçeklemek.
- **Neden:** Integral görüntü belleğini ve side-panel donmasını sınırlamak.
- **Tekrar değerlendirme:** Uzun webtoon için tile pipeline eklendiğinde.

## ADR-012 — Model eğitimi ve ağır text detector ertelendi

- **Durum:** Ertelendi.
- **Karar:** Önce gerçek fixture, baseline ve hata sınıfları toplanacak.
- **Neden:** Kanıtsız model/bundle eklemek maliyet getirir fakat problemin doğru
  kısmını çözmeyebilir.

## ADR-013 — API anahtarları destek kitinin dışında

- **Durum:** Kabul edildi.
- **Karar:** DeepL/LLM çağrıları ana extension sağlayıcı katmanında kalacak.
- **Neden:** Test edilebilirlik, güvenlik ve sorumluluk ayrımı.

