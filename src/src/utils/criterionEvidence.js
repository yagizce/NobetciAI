// Denetim Modülü — kriter bazlı kanıt yönetimi (checklist maddesine bağlı kanıtlar).
// DİF'in kendi `evidence[]` alanından (bkz. auditManagementService.js →
// buildDifFromFinding) BİLİNÇLİ OLARAK AYRIDIR — biri "düzeltici faaliyetin kapanış
// kanıtı", diğeri "denetim kriterinin sahada tespit edilen kanıtı". Aynı veri iki
// yerde KOPYALANMAZ; ikisi de yalnızca kendi checklistItemId/criterionId'sine bağlı
// kalır, birbirinden bağımsız yaşar.
//
// GELECEK UYUMLULUK NOTU: `dataUrl`/dosya alanı BİLEREK yok — gerçek dosya
// yükleme/storage altyapısı henüz yok, bu yüzden şimdilik yalnızca METADATA
// tutulur (bkz. `description` alanı: kullanıcının elle girdiği kısa açıklama).
// İleride gerçek dosya yükleme eklendiğinde, her kanıt kaydına bir `fileRef`/
// `dataUrl` alanı eklenmesi yeterli olacak — mevcut alanların hiçbiri değişmeyecek,
// bu da AI analizi (ör. fotoğraf üzerinden otomatik değerlendirme) gibi ileri
// fazların bu şemanın üzerine inşa edilebilmesini sağlar.

import { createId } from "./id.js";

export const EVIDENCE_TYPES = [
  { value: "photo", label: "Fotoğraf" },
  { value: "document", label: "Belge" },
  { value: "note", label: "Not" },
];

export function getEvidenceTypeLabel(value) {
  return EVIDENCE_TYPES.find((t) => t.value === value)?.label || value;
}

export const EVIDENCE_STATUSES = [
  { value: "none", label: "Kanıt Yok", tone: "neutral" },
  { value: "incomplete", label: "Eksik", tone: "warning" },
  { value: "present", label: "Mevcut", tone: "success" },
];

export function getEvidenceStatusMeta(value) {
  return EVIDENCE_STATUSES.find((s) => s.value === value) || EVIDENCE_STATUSES[0];
}

/**
 * Yeni bir kriter kanıtı kaydı üretir — SAF fonksiyon (`createId()` hariç yan
 * etkisi yok), I/O yapmaz.
 * @param {{ type: "photo"|"document"|"note", description?: string, criterionId: string,
 *   stage?: string|null, createdBy?: string }} input
 * @returns {{ id: string, type: string, description: string, createdAt: string,
 *   createdBy: string, criterionId: string, stage: string|null }}
 */
export function createCriterionEvidence({ type, description, criterionId, stage = null, createdBy = "" }) {
  return {
    id: createId(),
    type,
    description: description?.trim() || "",
    createdAt: new Date().toISOString(),
    createdBy,
    criterionId,
    stage,
  };
}

/**
 * @param {object[]} existingEvidence
 * @param {object} entry
 * @returns {object[]}
 */
export function addCriterionEvidence(existingEvidence, entry) {
  return [...(existingEvidence || []), entry];
}

/**
 * @param {object[]} existingEvidence
 * @param {string} evidenceId
 * @returns {object[]}
 */
export function removeCriterionEvidence(existingEvidence, evidenceId) {
  return (existingEvidence || []).filter((e) => e.id !== evidenceId);
}

/**
 * Kanıt durumunu (Kanıt Yok / Eksik / Mevcut) hesaplar — TEK merkezi, SAF
 * fonksiyon; UI kendi başına bu mantığı tekrar üretmez.
 *
 * KRİTİK KURAL: bu fonksiyon `checklistItem.result`'ı ASLA DEĞİŞTİRMEZ, yalnızca
 * OKUR. "Kanıt Yok" durumu hiçbir şekilde "Uygun Değil" sonucuna dönüştürülmez —
 * ikisi tamamen bağımsız alanlardır. Kanıt eklemek/çıkarmak da `result`'a hiç
 * dokunmaz (bkz. AuditDetailDrawer.jsx'teki kullanım: kanıt işlemleri her zaman
 * yalnızca `evidence` alanını patch'ler, `result`'ı asla).
 *
 * Mantık: hiç kanıt yoksa "Kanıt Yok". Kanıt var ama kriter henüz
 * değerlendirilmemişse ("degerlendirilmedi") — kanıt toplanmış ama değerlendirme
 * tamamlanmamış demektir, bu yüzden "Eksik". Kanıt var VE kriter değerlendirilmişse
 * (Uygun/Kısmen Uygun/Uygun Değil/Kanıt Yok sonucu fark etmez) "Mevcut".
 *
 * @param {object[]} evidence
 * @param {{ result?: string }} checklistItem
 * @returns {"none"|"incomplete"|"present"}
 */
export function computeEvidenceStatus(evidence, checklistItem) {
  if (!evidence || evidence.length === 0) return "none";
  if (checklistItem?.result === "degerlendirilmedi") return "incomplete";
  return "present";
}
