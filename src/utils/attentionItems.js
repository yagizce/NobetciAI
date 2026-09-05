// attentionItems — Dashboard'daki "Dikkat Gerektirenler" widget'ı için, iki farklı ve
// bugün dashboard'da hiçbir yerde TEK TEK listelenmeyen kaynağı birleştirir:
//   1) Risk Detay Sayfası'ndaki (Sprint 5A) çoklu düzeltici faaliyet alt-listesi
//      (entry.correctiveActions[]) — bugün yalnızca risk-bazlı özet olarak
//      CorrectiveActionsPanel'de görünüyor, alt-faaliyet bazında değil.
//   2) Yaklaşan/geciken periyodik kontroller — bugün yalnızca bir SAYI (KPI kartı)
//      olarak görünüyor, HANGİ kontrol olduğu hiçbir yerde listelenmiyor.
// Her ikisi de gerçek veriden hesaplanır, mock içermez.
//
// GENİŞLETME: bu widget artık "Dikkat Gerektirenler"in TEK adresi — önceden ayrı
// var olan `CorrectiveActionsPanel` (risk kaydı bazında, önceliğe göre sıralı aktif
// liste) buraya katıldı. Bu yüzden her aksiyon kalemi artık üst risk kaydının
// `priority` alanını da taşır (bkz. `priority` alanı) — AttentionNeededPanel.jsx bunu
// bir rozet olarak gösterir.

import { todayISO } from "./dateUtils.js";

/**
 * @param {import("../types/index.js").FineKinneyEntry[]} fineKinneyEntries
 * @param {import("../types/index.js").PeriodicCheck[]} periodicChecks
 * @returns {Array<{ kind: "action"|"check", id: string, title: string, context: string|null, dueDate: string, overdue: boolean, priority?: string }>}
 */
export function collectAttentionItems(fineKinneyEntries, periodicChecks) {
  const today = todayISO();

  const actionItems = [];
  (fineKinneyEntries || []).forEach((entry) => {
    (entry.correctiveActions || []).forEach((a) => {
      if (a.status === "done" || !a.dueDate) return;
      actionItems.push({
        kind: "action",
        id: `action-${entry.id}-${a.id}`,
        title: a.title || "İsimsiz faaliyet",
        context: entry.hazard,
        dueDate: a.dueDate,
        overdue: a.dueDate < today,
        priority: entry.priority,
      });
    });
  });

  const checkItems = (periodicChecks || [])
    .filter((c) => c.status === "upcoming" || c.status === "overdue")
    .map((c) => ({
      kind: "check",
      id: `check-${c.id}`,
      title: c.itemName,
      context: null,
      dueDate: c.nextDueDate,
      overdue: c.status === "overdue",
    }));

  return [...actionItems, ...checkItems].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
