# Destek Mimarisi

## Veri akışı

```text
Tesseract / başka OCR
        │ ham words: text + confidence + bbox
        ▼
normalizeOcrWords
        │ temiz ve tek koordinat biçimi
        ▼
clusterWordsIntoLines
        │ dikey örtüşme + karakter yüksekliğine göre boşluk
        ▼
detectTextRegions
        │ satırlar arası yakınlık + yatay hizalama
        ├── text bbox
        ├── tahmini balloonBox
        └── okuma sırası (LTR / manga RTL)
        ▼
createRegionOcrPlan
        │ bölgeye özel crop + upscale + PSM + polarite
        ▼
Çeviri katmanı (DeepL / LLM / başka sağlayıcı)
        ▼
fitTextToBox + buildFontProfile
        │ satırlar + font + line-height + letter-spacing + stroke
        ▼
Ana extension render/overlay katmanı
```

## Önemli kararlar

### 1. Sabit piksel yerine medyan karakter yüksekliği

Bir webtoon 800 px, başka bir manga sayfası 3000 px olabilir. `20 px boşluk`
gibi sabit eşikler ölçek değişince bozulur. Bölge eşikleri OCR kelimelerinin
**medyan yüksekliğiyle çarpılarak** hesaplanır.

### 2. İki aşamalı gruplama

Kelimeleri doğrudan tek kümeye bağlamak yan yana balonları birleştirir. Önce aynı
satırdaki kelimeler bulunur; sonra yalnızca dikey olarak yakın ve yatay olarak
hizalı satırlar aynı konuşma bölgesine alınır.

### 3. Metin kutusu ile balon kutusunu ayırma

`bbox`, OCR'ın gördüğü dar metin alanıdır. `balloonBox`, yeniden OCR ve çeviri
yerleşimi için çevresine ölçekli boşluk eklenmiş tahmini alandır. Böylece harflerin
kenardan kesilme ihtimali azalır.

### 4. Tek OCR ayarı yerine bölgeye özel plan

Küçük yazı daha çok büyütülür. Düşük güvenli bölge iki polaritede denenir. Tek
satır ve çok satır için farklı Tesseract PSM değerleri önerilir. Planın her kararı
`rationale` alanında açıklanır.

### 5. Çeviri metni hiçbir zaman sessizce kesilmez

Metin minimum font boyutunda sığmıyorsa `overflow: true` ve uyarı döner. Sonraki
katman balonu genişletebilir, çeviriyi kısaltabilir veya kullanıcıya bildirebilir.

## Veri sözleşmesi

`analyzePage()` çıktısının temel şekli:

```json
{
  "schemaVersion": 1,
  "image": { "width": 1000, "height": 700 },
  "regions": [
    {
      "id": "region-1",
      "text": "WHERE ARE\nYOU?",
      "confidence": 90.7,
      "bbox": { "x0": 100, "y0": 100, "x1": 220, "y1": 163 },
      "balloonBox": { "x0": 75, "y0": 81, "x1": 245, "y1": 182 },
      "ocrPlan": { "upscale": 1.85, "pageSegmentationMode": 11 },
      "layout": { "fontSize": 18.4, "lines": ["NEREYE", "GİDİYORSUN?"] },
      "font": { "weight": 700, "color": "#111111" }
    }
  ],
  "warnings": []
}
```

Sözleşme sürümlüdür. Ana extension entegrasyonundan sonra alanlar değiştirilirse
`schemaVersion` artırılmalıdır.

