# Sürüm Geçmişi

## 0.2.0 — 23 Ağustos 2026

### Eklendi

- RGBA/alfa güvenli gri ton dönüşümü.
- Yüzdelik kontrast germe.
- Büyük görüntü analiz bütçesi ve koordinat geri ölçekleme.
- Integral görüntü tabanlı Sauvola eşikleme.
- Koyu ve açık yazı polaritesi.
- 4/8 bağlı bileşen analizi.
- Piksel tabanlı, OCR'dan bağımsız metin adayı tespiti.
- Dilation, erosion, opening ve closing.
- OCR kalite puanı.
- Erken durdurmalı adaptif OCR ensemble.
- Baseline, contrast, adaptive-dark ve adaptive-light geçişleri.
- Koordinat ve metin konsensüsü.
- Geçiş hatasında devam etme ve provenance kaydı.
- OCR araştırma ve kod inceleme belgeleri.

### Düzeltildi

- Tekilleştirilen metin adaylarının görsel okuma sırasını kaybetmesi.
- Açık metin Sauvola geçişinde yerel ortalamanın doğru ters çevrilmesi.

### Doğrulama

- 24/24 test başarılı.
- Bütün kaynak dosyaları sözdizimi kontrolünden geçti.

## 0.1.0 — 23 Ağustos 2026

### Eklendi

- Geometri yardımcıları ve ortak bbox biçimi.
- OCR kelime temizleme ve Tesseract v5 adaptörü.
- Kelime → satır → konuşma bölgesi gruplama.
- LTR/RTL okuma sırası.
- Tahmini balloonBox.
- Bölgesel OCR crop/upscale/PSM/polarite planı.
- Türkçe metin için font ve satır yerleşimi.
- Font profili.
- SVG debug overlay.
- IoU/precision/recall/F1 değerlendirmesi.
- Fixture ve regression testleri.
- Mimari, entegrasyon, güvenlik ve yol haritası belgeleri.

### Operasyonel not

- Yerel Git HTTPS bileşeni bulunmadığı için GitHub repository API kullanıldı.
- İlk uzak ağaçtaki Windows yol ayırıcıları sonraki doğrulama commit'inde düzeltildi.

