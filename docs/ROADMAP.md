# Yol Haritası

## Ana bilgisayar gelmeden tamamlananlar

- [x] OCR kelime normalizasyonu
- [x] Ölçekten bağımsız satır gruplama
- [x] Konuşma bölgesi algılama
- [x] Sağdan sola manga okuma sırası
- [x] Tahmini balon kutusu
- [x] Bölgeye özel OCR yeniden-deneme planı
- [x] Türkçe metin için otomatik font/satır yerleşimi
- [x] Taşma uyarısı
- [x] SVG tanılama katmanı
- [x] Tesseract v5 adaptörü
- [x] IoU tabanlı precision/recall/F1 değerlendirme aracı
- [x] OCR'dan bağımsız iki polariteli piksel metin adayı algılama
- [x] Sauvola adaptif eşikleme ve bağlı bileşen filtresi
- [x] OCR kalite skoru ve erken durdurmalı çoklu geçiş
- [x] Geçişler arası koordinat/metin konsensüsü
- [x] Regression testleri ve örnek fixture

## Ana bilgisayarda ilk oturum

- [ ] Gerçek extension sürümünü ayrı dala yedekle
- [ ] Kullanılan OCR motorunu ve ham çıktı biçimini doğrula
- [ ] DeepL çağrısının nerede yapıldığını belirle
- [ ] Bu kiti önce yalnızca gözlem/debug modunda bağla
- [ ] En az 10 sorunlu manga sayfasından fixture üret
- [ ] Eski/yeni algılama başarısını aynı veri üzerinde ölç

## İkinci aşama

- [ ] Hazır adaptif OCR katmanını gerçek Tesseract worker'a bağla
- [ ] Canvas `measureText` ile gerçek font ölçümünü bağla
- [ ] Çeviri önbelleği ve 429 retry/backoff ekle
- [ ] OCR/çeviri/render sürelerini tanılama raporuna ekle
- [ ] Kullanıcı düzeltmelerini fixture'a dönüştüren “geri bildirim” butonu ekle

## Görsel kalitesi aşaması

- [ ] Gerçek balon maskesi için connected-component prototipi
- [ ] Eğik metin için deskew açısı tahmini
- [ ] Dikey metin/SFX için ayrı aday sınıflandırması
- [ ] Beyaz/siyah/renkli balonlar için ayrı test seti
- [ ] Dikey metin ve SFX sınıflandırması
- [ ] Orijinal yazıyı silme/inpainting katmanı
- [ ] Font karakteri sınıflandırma veya küçük bir font profili kataloğu

## Başarı ölçütleri

- Metin bölgesi recall: beklenen balonların en az %95'i bulunmalı.
- Yanlış birleşme: yan yana balonların %2'sinden azı birleşmeli.
- OCR yeniden denemesi: düşük güvenli bölgelerde ortalama güveni artırmalı.
- Yerleşim: Türkçe çevirilerin en az %98'i minimum font sınırında taşmamalı.
- Hiçbir API anahtarı log, fixture veya Git geçmişine girmemeli.

