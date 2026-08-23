# Test Matrisi

Test komutu: `npm test`  
Sonuç: **24/24 başarılı**

| Test alanı | Koruduğu sorun | Beklenen davranış |
|---|---|---|
| IoU — aynı kutu | Geometri hesabı bozulması | IoU = 1 |
| Detection metrics | İyileşmenin ölçülememesi | Precision/recall/F1 doğru hesaplanır |
| Alfa → gri ton | Şeffaf pikselin siyah gürültü olması | Şeffaf siyah beyaz arka plana dönüşür |
| Kontrast germe | Soluk görüntü aralığının dar kalması | En düşük/yüksek değer 0/255'e açılır |
| Koyu Sauvola | Siyah yazının kaçması | Koyu merkez foreground olur |
| Açık Sauvola | Beyaz yazının kaçması | Açık merkez foreground olur |
| Connected components | Harf geometrisinin çıkarılamaması | Bbox/piksel/doluluk doğru |
| Morfoloji | Kopuk ince vuruş | Dilation/closing kontrollü birleştirir |
| OCR'sız aday tespiti | OCR tamamen boş döndüğünde balon kaybı | İki ayrı metin alanı bulunur |
| Çoklu OCR konsensüsü | `STAYS`/`STATS` çelişkisi | İki geçişin `STATS` sonucu kazanır |
| OCR kalite puanı | Gürültülü sonucun iyi sanılması | Retry gerekir |
| Erken durdurma | Her görüntüde pahalı fallback | Kaliteli baseline sonrası durur |
| Adaptif fallback | Zayıf baseline | Kontrast/adaptif geçişler çalışır |
| Worker hata toleransı | Bir geçişin bütün pipeline'ı bozması | Diğer geçiş sonucu korunur |
| Birleşik pipeline | Modüllerin sözleşme uyumsuzluğu | Bölge, OCR planı, font ve layout oluşur |
| Tesseract v5 adaptörü | `data.words` varsayımı | İç içe blocks yapısı okunur |
| Debug SVG | Hatanın görünmemesi | Renkli kutu SVG'si oluşur |
| Yan yana balon | Balonların birleşmesi | İki ayrı bölge kalır |
| RTL sıra | Manga okuma sırasının yanlışlığı | Sağdaki bölge önce gelir |
| Görsel sınırı | Crop alanının taşması | BalloonBox 0..width/height içinde |
| OCR gürültüsü | Boş/düşük güven token | Gürültü elenir |
| Türkçe satır sarma | Çeviri taşması | Metin uygun satırlara bölünür |
| Minimum font taşması | Metnin sessiz kesilmesi | `overflow` ve uyarı oluşur |
| Uzun tek kelime | Boşluksuz token taşması | Karakter bazında kontrollü bölünür |
| Font profili | Bağırma metninin düz görünmesi | Güçlü ağırlık/emphasis seçilir |

> Not: Node test raporunda bazı yakın davranışlar aynı test dosyası/başlığı altında
> birleşebilir. Bu matris korunmak istenen davranışları tek tek listeler.

## Gerçek veri geldiğinde eklenecek test sınıfları

- Düşük kontrastlı gerçek manga balonu.
- Beyaz yazı/koyu panel.
- Dikey Japonca/İngilizce metin.
- Eğik/rotasyonlu balon metni.
- Büyük SFX ve çizimle birleşik harfler.
- İki balonun birbirine çok yakın olduğu panel.
- Uzun webtoon ve yüksek `devicePixelRatio`.
- DeepL çevirisinin balona sığmadığı gerçek örnek.
- Aynı sayfada küçük ve büyük font karışımı.

