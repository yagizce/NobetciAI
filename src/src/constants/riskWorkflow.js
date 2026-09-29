// Sprint 7.1 — Risk Workflow Foundation.
//
// AMAÇ: Risk oluşturulduktan sonraki yaşam döngüsünü (Taslak → ... → Kapatıldı) temsil
// edecek ESNEK bir veri modeli kurmak. Bu dosya yalnızca MİMARİ/VERİ MODELİdir — hiçbir
// UI bileşeni bu state'leri henüz göstermez veya değiştirmez (Sprint 7.1 kapsamı
// bilinçli olarak buna izin vermiyor, bkz. docs/SPRINTS.md).
//
// Bugünkü basit üçlü durum (constants/fineKinney.js → STATUS_OPTIONS: open/in_progress/
// done) DEĞİŞTİRİLMEDİ ve hâlâ tek "gerçek" kullanıcı arayüzü durumu. Bu dosya, ona
// PARALEL, geriye dönük uyumlu bir workflow katmanı ekler:
//   - Her yeni/güncellenen Fine-Kinney kaydı, legacy `status` alanından türetilen bir
//     `workflowState` alanı da taşır (bkz. useFineKinneyEntries.js).
//   - Hiçbir ekran bu alanı henüz okumuyor/göstermiyor — bu bilinçli bir tercih, "yeni
//     ekran ekleme" kapsamına uyum içindir.
//   - Gelecekteki bir sprint, mevcut STATUS_OPTIONS dropdown'ını bu modele kademeli
//     olarak taşıyabilir; o güne kadar iki katman birbirinden bağımsız çalışır.

/**
 * Risk yaşam döngüsündeki 6 durum. Sıra, doğal akışı yansıtır ama zorunlu değildir —
 * geçişler RISK_WORKFLOW_TRANSITIONS ile ayrıca tanımlanır (bkz. aşağı).
 *
 * `tone`, mevcut Badge bileşeninin tone sözleşmesiyle (neutral/success/warning/danger/
 * pending) birebir uyumludur — ileride bir UI eklendiğinde ekstra eşleme gerekmez.
 */
export const RISK_WORKFLOW_STATES = [
  {
    id: "draft",
    label: "Taslak",
    description: "Risk kaydı oluşturuldu ama henüz gözden geçirilmedi/onaylanmadı.",
    tone: "neutral",
    isTerminal: false,
  },
  {
    id: "open",
    label: "Açık",
    description: "Risk aktif olarak takip ediliyor, önlem süreci başladı.",
    tone: "warning",
    isTerminal: false,
  },
  {
    id: "inReview",
    label: "İncelemede",
    description: "Risk, İSG uzmanı veya işveren tarafından değerlendiriliyor.",
    tone: "pending",
    isTerminal: false,
  },
  {
    id: "awaitingAction",
    label: "Aksiyon Bekliyor",
    description: "Değerlendirme tamamlandı, düzeltici faaliyetin uygulanması bekleniyor.",
    tone: "danger",
    isTerminal: false,
  },
  {
    id: "completed",
    label: "Tamamlandı",
    description: "Gerekli önlemler uygulandı; risk henüz resmi olarak kapatılmadı.",
    tone: "success",
    isTerminal: false,
  },
  {
    id: "closed",
    label: "Kapatıldı",
    description: "Risk resmi olarak kapatıldı ve arşivlendi. Terminal durum.",
    tone: "neutral",
    isTerminal: true,
  },
];

/**
 * İzin verilen durum geçişleri (yönlü graf). Anahtar: mevcut durum, değer: gidilebilecek
 * durumların listesi. Henüz hiçbir yerde uygulanmıyor (enforcement yok) — ileride bir
 * workflow UI'ı bu tabloyu kullanarak geçersiz geçişleri engelleyebilir.
 */
export const RISK_WORKFLOW_TRANSITIONS = {
  draft: ["open"],
  open: ["inReview", "awaitingAction", "closed"],
  inReview: ["awaitingAction", "open", "closed"],
  awaitingAction: ["inReview", "completed", "closed"],
  completed: ["closed", "awaitingAction"], // yeniden açılabilir (ör. önlem yetersiz çıkarsa)
  closed: [], // terminal — geçiş yok
};

// Bugünkü basit `status` alanının (open/in_progress/done) yeni workflow state'lerine
// eşlemesi. `done`, bilinçli olarak "closed" değil "completed"e eşlenir: bugünkü tek
// "bitti" durumu, yeni modelde "iş tamamlandı" ile "resmi olarak kapatıldı" olmak üzere
// iki ayrı adıma bölünüyor — legacy veri en güvenli/en az iddialı karşılığa eşlenir.
const LEGACY_STATUS_TO_WORKFLOW_STATE = {
  open: "open",
  in_progress: "inReview",
  done: "completed",
};

export function getWorkflowState(stateId) {
  return RISK_WORKFLOW_STATES.find((s) => s.id === stateId) || null;
}

/**
 * Legacy `status` değerinden (open/in_progress/done) karşılık gelen workflow state id'sini
 * üretir. Tanınmayan/boş bir değer için güvenli varsayılan "draft"tır.
 * @param {string} legacyStatus
 * @returns {string} workflow state id
 */
export function mapLegacyStatusToWorkflowState(legacyStatus) {
  return LEGACY_STATUS_TO_WORKFLOW_STATE[legacyStatus] || "draft";
}

/**
 * Bir Fine-Kinney kaydı için güncel workflow state'i döndürür. Kayıt bu alanı henüz
 * taşımıyorsa (Sprint 7.1 öncesi oluşturulmuş eski kayıtlar), legacy `status`
 * alanından anlık olarak türetir — geriye dönük uyumluluk için veri migrasyonu
 * GEREKMEZ.
 * @param {{ workflowState?: string|null, status?: string }} entry
 * @returns {object} RISK_WORKFLOW_STATES içindeki state nesnesi
 */
export function resolveEntryWorkflowState(entry) {
  const stateId = entry?.workflowState || mapLegacyStatusToWorkflowState(entry?.status);
  return getWorkflowState(stateId) || RISK_WORKFLOW_STATES[0];
}

/**
 * Bir durumdan gidilebilecek geçerli sonraki durumları döndürür.
 * @param {string} currentStateId
 * @returns {object[]} RISK_WORKFLOW_STATES alt kümesi
 */
export function getAllowedNextStates(currentStateId) {
  const allowedIds = RISK_WORKFLOW_TRANSITIONS[currentStateId] || [];
  return allowedIds.map(getWorkflowState).filter(Boolean);
}

/**
 * İki durum arasındaki geçişin tanımlı geçiş grafına göre geçerli olup olmadığını
 * kontrol eder. Henüz hiçbir kayıt yolu bunu zorunlu kılmıyor (bkz. dosya başı notu).
 * @param {string} fromStateId
 * @param {string} toStateId
 * @returns {boolean}
 */
export function isValidWorkflowTransition(fromStateId, toStateId) {
  return (RISK_WORKFLOW_TRANSITIONS[fromStateId] || []).includes(toStateId);
}
