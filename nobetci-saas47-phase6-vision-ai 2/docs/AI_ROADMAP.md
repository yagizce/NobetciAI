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
| Fotoğraftan Tehlike Tespiti | `riskDetection/RiskDetectionPanel.jsx` (`usePhotoDetection.js`) | Kullanıcının kendi telefonuyla çektiği fotoğrafı 6 kategoriden birine sınıflandırır + kısa not üretir; Risk Tespiti formunu ön doldurur. Kamera KURULUMU değil — bkz. Phase 9.2 |
| Bilgi Kütüphanesi "AI'ya Sor" | `knowledge-center/KnowledgeAIAssistant.jsx` | Soruyu ilgili dokümanlara daraltıp (anahtar kelime eşleştirmesi) AI'ye bağlam verir, kaynak dokümanı gösterir — bkz. "RAG-lite" aşağıda |

### Güvenlik Önlemi: Artık Risk Önerisi

AI'nin önerdiği artık risk değerleri (`parseResidualSuggestion`), kod seviyesinde asıl
risk değerlerini **asla aşamaz** (`Math.min` ile sınırlı) ve her zaman kullanıcı
tarafından düzenlenebilir alanlara yazılır — hiçbir zaman sessizce/geri dönüşsüz
uygulanmaz. Gelecekteki tüm AI-önerisi özellikleri bu ilkeyi izler:
**AI önerir, insan onaylar.**

## Hazır Altyapı, Henüz Bağlanmamış

- **Risk ek dosyaları (fotoğraf/PDF/Word/Excel)** — Sprint 5A'da eklenen mock altyapı,
  her ek dosyayı `{ id, name, type, addedAt, addedBy }` şeklinde tutar. Bu veri şekli,
  ileride bir AI Vision servisi devreye girdiğinde **değişmeden** kullanılabilecek
  şekilde tasarlandı.

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

1. **Phase 9.2 — gerçek sabit kamera entegrasyonu.** Kullanıcının kendi fotoğraf
   yüklemesinden farklı olarak, işyerlerine kurulacak sabit kameralardan canlı/otomatik
   tespit. Bu, fiziksel kurulum gerektirdiği için mobil-öncelikli geliştirmenin
   kapsamı dışında tutuluyor.
2. **Vektör tabanlı gerçek RAG** — yukarıda açıklandığı gibi, Phase 7'ye bağlı.

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
