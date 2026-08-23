# Güvenlik Notları

## API anahtarları

DeepL, Gemini, OpenAI veya başka sağlayıcı anahtarları hiçbir zaman kaynak koda,
fixture dosyalarına, hata raporlarına ya da Git geçmişine yazılmamalıdır.

Tarayıcı eklentisinde önerilen yaklaşım:

- Anahtarları yalnızca `chrome.storage.local` içinde tutun.
- Konsol mesajlarında anahtarı veya tam Authorization başlığını göstermeyin.
- Tanılama dışa aktarımında `apiKey`, `authorization`, `token` ve benzeri alanları
  otomatik olarak `[REDACTED]` ile değiştirin.
- Kullanıcıdan gelen ekran görüntüsünde veya logda anahtar görünüyorsa repoya
  eklemeden önce temizleyin.
- Bir anahtar yanlışlıkla commit edildiyse commit'i silmekle yetinmeyin; ilgili
  sağlayıcı panelinden anahtarı derhal iptal edip yenisini oluşturun.

## Bu destek kitinin yetkileri

Mevcut kod ağ isteği yapmaz, API anahtarı işlemez ve tarayıcı izni istemez. Yalnızca
OCR kelime kutuları ve çeviri metni üzerinde hesaplama yapar. Entegrasyon sırasında
bu sınır korunmalıdır; sağlayıcı çağrıları ayrı bir katmanda kalmalıdır.

