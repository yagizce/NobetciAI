/**
 * Header'daki "Bildirim Merkezi" dropdown'ının veri kaynağı — genel sistem olayları
 * (yeni risk, kritik risk, eğitim/kontrol hatırlatması, yeni çalışan). Risk Analizi
 * sayfasındaki `Notification` tipiyle KARIŞTIRILMASIN — o, çalışan-uzman-işveren
 * arasındaki ramak kala/tehlike/kaza bildirim iş akışına ait, tamamen ayrı bir kavram.
 * @typedef {Object} SystemNotification
 * @property {string|number} id
 * @property {string|null} companyId
 * @property {"riskCreated"|"criticalRisk"|"trainingDue"|"periodicCheckDue"|"employeeAdded"|"backupStale"} type
 * @property {string} title
 * @property {string} message
 * @property {boolean} read
 * @property {string} createdAt - ISO datetime
 */

/**
 * Sistemdeki rol kümesi. Bkz. src/constants/allRoles.js (tek kaynak).
 * @typedef {"employer"|"expert"|"employee"} FullRole
 */

/**
 * @typedef {Object} Company
 * @property {string} id
 * @property {string} name - Firma adı
 * @property {string} taxNumber - Vergi numarası (opsiyonel)
 * @property {string} sector - Sektör
 * @property {number} employeeCount - Beyan edilen çalışan sayısı (gerçek çalışan listesinden bağımsız, firma profilinde girilen değer)
 * @property {string|null} logo - Base64 data URL veya null
 * @property {string} address
 * @property {string} phone
 * @property {string} email
 */

/**
 * @typedef {Object} Branch
 * @property {string|number} id
 * @property {string} companyId
 * @property {string} name - Şube adı
 * @property {string} address
 * @property {string} responsible - Sorumlu kişi
 */

/**
 * @typedef {Object} Department
 * @property {string|number} id
 * @property {string} companyId
 * @property {string} name
 * @property {boolean} isCustom - Kullanıcı tarafından mı eklendi, yoksa varsayılan setten mi geldi
 */

/**
 * @typedef {Object} Employee
 * @property {string|number} id
 * @property {string} companyId
 * @property {string} fullName - Ad Soyad
 * @property {string} employeeNumber - Sicil No
 * @property {string|number|null} departmentId
 * @property {string} position - Görev
 * @property {string} phone
 * @property {string} email
 * @property {"active"|"inactive"} status
 */

/**
 * @typedef {Object} PeriodicCheck
 * @property {string|number} id
 * @property {string|null} companyId
 * @property {string} itemName - Kontrol edilecek kalem (örn. "Yangın Tüpü — Depo B")
 * @property {"equipment"|"fireExtinguisher"|"electrical"|"scaffolding"|"other"} category
 * @property {string|number|null} departmentId - Sprint 7.2.3: departman filtresi/detayı için (opsiyonel)
 * @property {string} lastCheckDate - ISO tarih (YYYY-MM-DD)
 * @property {number} intervalDays - Kaç günde bir kontrol edilmeli
 * @property {string} nextDueDate - Hesaplanmış sonraki kontrol tarihi (ISO)
 * @property {"ok"|"upcoming"|"overdue"} status - Hesaplanmış durum
 * @property {string} responsible - Sorumlu kişi
 * @property {string} notes
 */

/**
 * @typedef {Object} AuditLogEntry
 * @property {string|number} id
 * @property {string|null} companyId
 * @property {string} timestamp - ISO datetime
 * @property {string} actor - Rol/kullanıcı adı (örn. "Uzman", "Ahmet Yıldız")
 * @property {string} action - Kısa eylem adı (örn. "Bildirim onaylandı")
 * @property {string} details - İnsan-okunur açıklama
 * @property {string} entityType - Hangi modülle ilgili (örn. "notification", "fineKinney", "document", "equipment", "periodicCheck")
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} companyId
 * @property {"expert"|"employer"|"employee"} role
 * @property {"trial"|"pro"|"enterprise"} subscription
 * @property {string|null} photo - Base64 data URL veya null
 * @property {string} title - Ünvan (örn. "İSG Uzmanı", "Operasyon Müdürü")
 * @property {string} phone
 * @property {string} department
 * @property {string} lastLoginAt - ISO datetime (mock)
 */

/**
 * @typedef {Object} Conversation
 * @property {string} conversationId
 * @property {string} userId
 * @property {import("./index.js").ChatMessage[]} messages
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

/**
 * @typedef {Object} DocumentRecord
 * @property {string|number} id
 * @property {string|null} companyId
 * @property {string} type - Belge türü (bkz. constants/documentTypes.js)
 * @property {string} title
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {"draft"|"completed"} status
 * @property {string} content - Şu an boş/placeholder; AI üretimi eklenince doldurulacak
 */

/**
 * Bilgi Kütüphanesi (Knowledge Center) dokümanı — bkz. constants/knowledgeCenter.js →
 * MOCK_KNOWLEDGE_DOCUMENTS. AI_ROADMAP.md/ROADMAP.md Phase 5 gereği: bugün tamamen mock
 * ve dataProvider'a BAĞLI DEĞİL (companyId her zaman null/undefined) — gerçek RAG bu
 * sprintin kapsamı dışında bırakıldı, yalnızca ŞEKİL burada gelecekteki geçiş için
 * belgelendi. Gerçek backend'e (Phase 7) taşındığında:
 *   - `companyId: null` → firmaya özel dokümanlar için doldurulacak; genel/mevzuat
 *     nitelikli dokümanlar DATABASE_PLAN.md ilkesi gereği null kalabilir.
 *   - `content` (bugün tam metin) → embedding üretiminin kaynağı olacak; alan adı/şekli
 *     DEĞİŞMEYECEK, yalnızca ayrıca bir vektör indeksine de gönderilecek.
 *   - `tags` → bugünkü anahtar kelime eşleştirmesinin (RAG-lite) girdisi; gerçek
 *     embedding'e geçilse bile ikincil bir filtre olarak kullanılabilir.
 * @typedef {Object} KnowledgeDocument
 * @property {number} id
 * @property {string|null} [companyId] - Bugün her zaman null/undefined (paylaşılan mock liste)
 * @property {string} category - bkz. constants/knowledgeCenter.js → KNOWLEDGE_CATEGORIES
 * @property {string} type - bkz. constants/knowledgeCenter.js → DOCUMENT_TYPES
 * @property {string} title
 * @property {string} summary
 * @property {string} content - Tam metin (bugün elle yazılmış mock içerik)
 * @property {string[]} tags
 * @property {string} updatedAt - ISO tarih (YYYY-MM-DD)
 * @property {string} sizeLabel - Görüntüleme amaçlı (örn. "1.2 MB") — gerçek dosya yok
 */

/**
 * @typedef {Object} FineKinneyEntry
 * @property {string|number} id
 * @property {string|null} companyId
 * @property {string} hazard - Tehlike
 * @property {string} risk - Risk
 * @property {string} [affected] - Etkilenenler (örn. "Çalışanlar ve çevre") — opsiyonel, eski kayıtlarda boş olabilir
 * @property {number} probability - Olasılık (önlem öncesi)
 * @property {number} frequency - Maruziyet (Frekans) (önlem öncesi)
 * @property {number} severity - Şiddet (önlem öncesi)
 * @property {number} score - Otomatik puan (probability × frequency × severity)
 * @property {string} riskLevel - Risk seviyesi (computed label)
 * @property {string} action - Alınacak önlem
 * @property {string} responsible - Sorumlu kişi
 * @property {string} dueDate - Termin tarihi
 * @property {string} date - Kayıt tarihi (oluşturulma)
 * @property {"open"|"in_progress"|"done"} status - Durum
 * @property {number|null} residualProbability - Artık Olasılık (önlem sonrası, opsiyonel)
 * @property {number|null} residualFrequency - Artık Maruziyet (önlem sonrası, opsiyonel)
 * @property {number|null} residualSeverity - Artık Şiddet (önlem sonrası, opsiyonel)
 * @property {number|null} residualScore - Artık Risk puanı (opsiyonel)
 * @property {string|null} residualRiskLevel - Artık Risk seviyesi (opsiyonel)
 * @property {"low"|"medium"|"high"|"urgent"} priority - Düzeltici faaliyet önceliği
 * @property {number} completionPercent - Düzeltici faaliyet tamamlanma yüzdesi (0-100)
 * @property {string|null} closedAt - Durum "done" olduğunda damgalanan ISO tarih (risk kapanma süresi hesaplaması için)
 * @property {string|number|null} [departmentId] - Sprint 5A: filtreleme için opsiyonel departman referansı
 * @property {string|number|null} [branchId] - Sprint 5A: filtreleme için opsiyonel şube referansı
 * @property {Array<{id:string|number,title:string,description:string,responsible:string,dueDate:string,priority:string,status:string,completionPercent:number,createdAt:string}>} [correctiveActions] - Sprint 5A: Risk Detay Sayfası'ndaki çoklu düzeltici faaliyet listesi
 * @property {Array<{id:string|number,name:string,type:string,addedAt:string,addedBy:string}>} [attachments] - Sprint 5A: mock ek dosya listesi (fotoğraf/PDF/Word/Excel)
 * @property {Array<{id:string|number,text:string,author:string,at:string}>} [notes] - Sprint 5A: serbest metin notlar
 * @property {Array<{id:string,event:string,detail:string,actor:string,at:string}>} [history] - Sprint 5A: Risk Geçmişi (timeline) olayları
 * @property {"draft"|"open"|"inReview"|"awaitingAction"|"completed"|"closed"} [workflowState] - Sprint 7.1: risk yaşam döngüsü durumu (bkz. constants/riskWorkflow.js). Legacy `status` alanından türetilir, henüz hiçbir UI'da gösterilmez.
 */

/**
 * @typedef {Object} Notification
 * @property {string|number} id
 * @property {string|null} companyId
 * @property {"ramakKala"|"tehlike"|"kaza"} type
 * @property {string} desc
 * @property {"pending"|"ai_analyzed"|"approved"} status
 * @property {string} worker
 * @property {string} date
 * @property {string|null} aiAnalysis
 * @property {string|null} expertNote
 */

/**
 * @typedef {Object} Equipment
 * @property {string|number} id
 * @property {string|null} companyId
 * @property {string} name
 * @property {string|null} qr
 * @property {string} lastCheck
 */

/**
 * @typedef {Object} ChatMessage
 * @property {"user"|"assistant"} role
 * @property {string} text
 * @property {string} [image]
 * @property {string} time
 */

/**
 * @typedef {Object} TrainingCompletion
 * Eğitim Modülü — bir çalışanın bir kursu tamamladığına dair kayıt. Sertifika/PDF
 * ÜRETMEZ — "uzaktan eğitimin verildiğinin belgesi" bu kaydın kendisidir (bkz.
 * features/training/).
 * @property {string|number} id
 * @property {string|null} companyId
 * @property {string} courseId - constants/trainingCourses.js → TRAINING_COURSES[].id
 * @property {string} employeeName
 * @property {boolean} watchedFullVideo
 * @property {number} quizScore - 0-100
 * @property {boolean} passed
 * @property {string} completedAt - ISO tarih
 */

/**
 * @typedef {Object} TrainingProgress
 * Bir çalışanın bir kurstaki VİDEO İLERLEMESİ — sınav sonucundan (TrainingCompletion)
 * bilinçli olarak ayrı tutulur, çünkü biri "izleme", diğeri "değerlendirme" kaydıdır.
 * Sprint 7.2.1: "kaldığı yerden devam et" ve İlerleme yüzdesi bu kayıttan hesaplanır.
 * Her (courseId, employeeName) çifti için TEK kayıt vardır (id = "courseId::employeeName").
 * @property {string} id
 * @property {string|null} companyId
 * @property {string} courseId
 * @property {string} employeeName
 * @property {number} positionSeconds
 * @property {number} durationSeconds
 * @property {string} updatedAt - ISO tarih
 */

/**
 * Phase 9.1 — Risk Tespiti (triage havuzu). Fine-Kinney'den BİLİNÇLİ olarak ayrı: bu,
 * ham/doğrulanmamış bir tespit havuzudur (kamera henüz yok — bugün manuel veya simüle
 * kaynaklı), resmi Fine-Kinney kaydı DEĞİLDİR. Yalnızca insan onayından geçtikten sonra
 * (bkz. RiskDetectionPanel.jsx → "AI ile Taslak Oluştur" / "Sahaya İn") bir Fine-Kinney
 * kaydına dönüşür.
 * @typedef {Object} RiskDetection
 * @property {string|number} id
 * @property {string|null} companyId
 * @property {string} category - constants/riskDetection.js → RISK_DETECTION_CATEGORIES key
 * @property {string} location - Serbest metin konum bilgisi (örn. "Depo B — Giriş")
 * @property {string|number|null} departmentId
 * @property {"manual"|"simulated"|"photo"} source - "simulated": demo modunda sistemin ürettiği örnek tespit (gerçek kamera değil); "photo": fotoğraf tabanlı AI analizinden gelen tespit (Phase 6 — bkz. riskDetection/useVisionFindings.js)
 * @property {string} detectedAt - ISO zaman damgası, ilk görülme
 * @property {string} lastSeenAt - ISO zaman damgası, en son görülme
 * @property {number} occurrenceCount - Aynı kategori+konum kombinasyonu tekrar tespit edildikçe artar (biriktirme — yeni satır açılmaz)
 * @property {"new"|"reviewing"|"converted"|"dismissed"} status
 * @property {string} dismissReason - Yalnızca status "dismissed" ise anlamlı
 * @property {string} [hazardNote] - Yalnızca source "photo" ise anlamlı; AI'nin fotoğrafta gördüğünü açıklayan kısa not
 * @property {string|null} [photoDataUrl] - LEGACY/inline biçim: eski tek-tespit fotoğraf akışı (Phase 9, artık kaldırıldı) tarafından üretilen geçmiş kayıtlar için. Hiçbir güncel akış bu alanı ARTIK YAZMIYOR (yalnızca okuma/geriye dönük uyumluluk) — Phase 6 çoklu-bulgu akışı bunun yerine `photoId` kullanır.
 * @property {string|null} [photoId] - Phase 6 depolama optimizasyonu: fotoğraf `riskDetectionPhotos` store'unda BİR KEZ saklanır (bkz. services/riskDetectionPhotoService.js), aynı fotoğraftan türeyen tüm bulgular bu id'yi paylaşır. Görüntülemek için bkz. riskDetection/useRiskDetectionPhotoUrl.js
 * @property {string} [description] - Phase 6/Vision AI v1: bkz. services/visionAnalysisService.js → VisionFinding. Yalnızca source "photo" (yeni akış) ise dolu.
 * @property {string} [recommendedAction] - Phase 6: AI'nin önerdiği önlem — yalnızca öneri, Fine-Kinney'e köprülendiğinde `action` alanına ön dolgu olarak taşınır (bkz. RiskDetectionCard.jsx)
 * @property {string} [affected] - Phase 6: etkilenen kişiler — Fine-Kinney'e köprülendiğinde `affected` alanına ön dolgu olarak taşınır
 * @property {string} [legislationRef] - Phase 6: mevzuat/kaynak referansı (serbest metin alan, RAG-lite eşleştirmesi değil)
 * @property {number} [confidenceScore] - Phase 6: AI güven skoru (0-100)
 */

export {};
