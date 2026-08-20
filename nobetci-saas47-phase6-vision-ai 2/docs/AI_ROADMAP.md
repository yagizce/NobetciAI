# AI Yol Haritası

## Mevcut Entegrasyon

Tüm AI çağrıları tek bir yoldan geçer: `src/services/chatService.js` →
`api/chat.js` (Vercel Serverless Function, sunucu taraflı proxy) → Anthropic API.
API anahtarı yalnızca Vercel ortam değişkeninde (`ANTHROPIC_API_KEY`) tutulur,
frontend koduna asla yazılmaz.

### Bugün Çalışan AI Özellikleri

| Özellik | Konum | Not |
|---|---|---|
| AI Chat | `features/chat/ChatPanel.jsx` | Hazır sorular, serbest metin sohbet |
| Fotoğraf analizi | Chat üzerinden | Görsel gönderilip AI yorumu alınıyor |
| Fine-Kinney önerisi | `fineKinney/FineKinneyForm.jsx` (`useAIRiskAnalysis.js`) | Tehlike/risk metninden Kontrol Tedbirleri + KKD + Artık Risk önerisi üretir |
| Başlangıç Fine-Kinney puanı | `fineKinney/FineKinneyForm.jsx` (`useInitialRiskScore.js` → `riskService.scoreRisk()`) | Yalnızca tehlike+risk metninden, henüz P/M/Ş seçilmemişken önlem öncesi başlangıç puan önerisi üretir |
| Bağlama Duyarlı AI Copilot | `features/chat/ChatPanel.jsx` (`constants/chatContexts.js`) | Fine-Kinney/Risk Tespiti/Periyodik Kontrol/Mevzuat ekranlarından "AI'ya Sor" ile girildiğinde asistan o bağlama göre sistem promptu + karşılama + önerilen sorular kullanır |
| Doküman içeriği üretimi | `documents/DocumentGenerator.jsx` (`documentService.js` → `generateDocumentDraft()`) | Belge türü+başlıktan düzenlenmeye hazır ilk taslak üretir; `DocumentDetailDrawer.jsx`'te gözden geçirilip düzenlenir |
| Fotoğraftan Çoklu Tehlike Tespiti (Vision AI v1) | `riskDetection/RiskDetectionPanel.jsx` (`useVisionFindings.js`, `services/visionAnalysisService.js`) | Kullanıcının kendi telefonuyla çektiği/galeriden seçtiği fotoğraftan BİRDEN FAZLA yapılandırılmış tehlike bulgusu (tehlike/açıklama/kategori/önerilen önlem/etkilenenler/mevzuat referansı/güven skoru) üretir; kullanıcı her bulguyu tek tek onaylar/düzenler (bkz. `VisionFindingsPanel.jsx`). Kamera KURULUMU değil, Phase 6 kapsamı — bkz. aşağıdaki "Bilinçli Sınır" notu. Sabit kamera entegrasyonu ayrı, bkz. Phase 9.2 |
| Bilgi Kütüphanesi "AI'ya Sor" | `knowledge-center/KnowledgeAIAssistant.jsx` | Soruyu ilgili dokümanlara daraltıp (anahtar kelime eşleştirmesi) AI'ye bağlam verir, kaynak dokümanı gösterir — bkz. "RAG-lite" aşağıda |

### Güvenlik Önlemi: Artık Risk Önerisi

AI'nin önerdiği artık risk değerleri (`parseResidualSuggestion`), kod seviyesinde asıl
risk değerlerini **asla aşamaz** (`Math.min` ile sınırlı) ve her zaman kullanıcı
tarafından düzenlenebilir alanlara yazılır — hiçbir zaman sessizce/geri dönüşsüz
uygulanmaz. Gelecekteki tüm AI-önerisi özellikleri bu ilkeyi izler:
**AI önerir, insan onaylar.**

### Bilinçli Sınır: Vision AI v1 Bugün MOCK

Yukarıdaki tablodaki "Fotoğraftan Çoklu Tehlike Tespiti" satırı, **gerçek bir Vision AI
API'sine bağlı DEĞİL** — `services/visionAnalysisService.js` bilinçli olarak bir mock
adapter kullanıyor (dosya adı/boyutuna göre deterministik, gerçekçi görünen bulgular
üretir). Bu tablodaki diğer tüm AI özellikleri (Chat, Fine-Kinney önerisi, Doküman
üretimi vb.) gerçek Anthropic API'sine bağlıyken, bu biri bilinçli olarak değil —
ROADMAP.md Phase 6 kapsamı gereği. Adapter arayüzü gerçek bir sağlayıcıya
(Anthropic/OpenAI Vision) geçilebilecek şekilde tasarlandı; geçiş adımları o dosyanın
başında yazılı. Bu, aşağıdaki "Planlanan Genişlemeler" listesindeki bir sonraki adım.

## Hazır Altyapı, Henüz Bağlanmamış

- **Fotoğraf saklama altyapısı Phase 6'da genişledi.** Fotoğraflar artık ayrı bir
  `riskDetectionPhotos` IndexedDB store'unda (dedup + sıkıştırma ile) saklanıyor, bkz.
  `services/riskDetectionPhotoService.js`. Bu, ileride bir gerçek AI Vision servisi
  devreye girdiğinde **değişmeden** kullanılabilecek şekilde tasarlandı — yalnızca
  `visionAnalysisService.js`'teki `activeAdapter` değişecek.

## Bilgi Kütüphanesi "AI'ya Sor" — RAG-lite

Phase 5 (RAG)'in ilk, mütevazı sürümü canlıda. **Gerçek bir vektör/embedding tabanlı
RAG değildir** — bu bilinçli bir sınırdır, yanlışlıkla "tam RAG" olarak sunulmamalıdır:

1. Kullanıcının sorusu, `constants/knowledgeCenter.js` → `findRelevantDocuments` ile
   basit anahtar kelime eşleştirmesi kullanılarak en ilgili 1-3 dokümana daraltılır.
2. Bu dokümanların tam içeriği, `KNOWLEDGE_AI_PROMPT` ile birlikte AI'ye bağlam olarak
   verilir.
3. AI yalnızca verilen içeriğe dayanarak cevap üretir (dışarıdan bilgi uydurmaması
   promptta açıkça yasaklanır); ilgili doküman bulunamazsa AI hiç çağrılmaz.
4. Kullanılan kaynak doküman(lar) cevapla birlikte, tıklanabilir şekilde gösterilir —
   izlenebilirlik için zorunlu tutuldu.

**Gerçek (vektör tabanlı) RAG'e giden yol:** dokümanlar bir embedding modelinden
geçirilip bir vektör indeksinde (örn. Supabase'in `pgvector` uzantısı) saklanmalı;
bu, gerçek backend'e geçişten (Phase 7) sonra, kullanıcı onayıyla değerlendirilecek.

## Planlanan Genişlemeler

1. **Gerçek bir Vision AI sağlayıcısına bağlanma (Anthropic/OpenAI Vision).**
   `services/visionAnalysisService.js`'teki mock adapter'ın yerini gerçek bir API
   çağrısı alacak — adapter arayüzü buna hazır, geri kalan uygulama (onay akışı, Risk
   Tespiti/Fine-Kinney köprüsü) DEĞİŞMEDEN kalacak. ROADMAP.md Phase 6'nın kalan kısmı.
2. **Phase 9.2 — gerçek sabit kamera entegrasyonu.** Kullanıcının kendi fotoğraf
   yüklemesinden farklı olarak, işyerlerine kurulacak sabit kameralardan canlı/otomatik
   tespit. Bu, fiziksel kurulum gerektirdiği için mobil-öncelikli geliştirmenin
   kapsamı dışında tutuluyor.
3. **Vektör tabanlı gerçek RAG** — yukarıda açıklandığı gibi, Phase 7'ye bağlı.

## Açık Soru: Offline AI Davranışı

Uygulama offline-first (IndexedDB) olmasına rağmen AI özellikleri internet bağlantısı
gerektirir (Vercel Serverless Function → Anthropic API). Çevrimdışıyken bu özelliklerin nasıl
davranacağı (istek kuyruğa alınsın mı, kullanıcıya net biçimde "AI şu an kullanılamıyor"
mu gösterilsin) henüz karara bağlanmadı — bkz. [ROADMAP.md](./ROADMAP.md) "Açık
Kararlar".

## İlke

Yeni bir AI özelliği eklenirken:
- Yeni bir AI sağlayıcısı/kütüphanesi eklenmez — mevcut Vercel Serverless Function proxy deseni
  genişletilir.
- Öneri niteliğindeki her çıktı, kullanıcının düzenleyip onaylayabileceği bir alana
  yazılır; otomatik/sessiz veri değişikliği yapılmaz.
- Mock/placeholder olan kısımlar kod içinde açıkça işaretlenir.
