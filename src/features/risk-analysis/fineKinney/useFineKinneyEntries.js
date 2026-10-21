import { useState, useEffect, useMemo, useCallback } from "react";
import { getFineKinneyEntries, saveFineKinneyEntry, deleteFineKinneyEntry } from "../../../services/riskService.js";
import { computeFineKinneyScore, getFineKinneyRiskLevel } from "../../../constants/fineKinney.js";
import { todayLabel } from "../../../utils/dateUtils.js";
import { logActivity } from "../../../services/auditService.js";
import { showLocalNotification } from "../../../services/notificationService.js";
import { pushSystemNotification } from "../../../services/systemNotificationService.js";
import { useRole } from "../../../contexts/RoleContext.jsx";
import { getRoleLabel } from "../../../constants/allRoles.js";
import { makeHistoryEvent } from "./historyEvent.js";
import { mapLegacyStatusToWorkflowState } from "../../../constants/riskWorkflow.js";
import { filterFineKinneyEntries } from "./filterFineKinneyEntries.js";
import { clampPercent } from "../../../utils/numberGuards.js";
import { createId } from "../../../utils/id.js";

export function useFineKinneyEntries(initialSearch = "") {
  const { role } = useRole();
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState(initialSearch);
  const [levelFilter, setLevelFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    getFineKinneyEntries().then((data) => {
      setEntries(data);
      setLoaded(true);
    }).catch((err) => {
      console.error("Fine-Kinney kayıtları yüklenemedi:", err);
      setLoadError("Risk değerlendirmeleri yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
      setLoaded(true);
    });
  }, []);

  // Sprint 5A: Risk Detay Sayfası alt-sekmeleri (Düzeltici Faaliyetler, Ek Dosyalar, Notlar)
  // riskService.patchFineKinneyEntry ile kaydedip, güncel kaydı burada state'e yansıtır.
  const applyPatchedEntry = useCallback((updatedEntry) => {
    if (!updatedEntry) return;
    setEntries((prev) => prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e)));
  }, []);

  const saveEntry = useCallback(async (formValues, editingId) => {
    const probability = Number(formValues.probability);
    const frequency = Number(formValues.frequency);
    const severity = Number(formValues.severity);
    const score = computeFineKinneyScore(probability, frequency, severity);
    const level = getFineKinneyRiskLevel(score);

    // Artık risk yalnızca bir önlem girildiyse anlamlıdır (form da bu durumda gösteriyor).
    const hasAction = formValues.action?.trim().length > 0;
    const residualProbability = hasAction ? Number(formValues.residualProbability) : null;
    const residualFrequency = hasAction ? Number(formValues.residualFrequency) : null;
    const residualSeverity = hasAction ? Number(formValues.residualSeverity) : null;
    const residualScore = hasAction ? computeFineKinneyScore(residualProbability, residualFrequency, residualSeverity) : null;
    const residualLevel = residualScore !== null ? getFineKinneyRiskLevel(residualScore) : null;

    // Risk kapanma süresi hesaplanabilsin diye (KPI: "Risk Kapanma Süresi"), durum ilk kez
    // "done" olduğunda closedAt damgalanır. Zaten kapalıysa (düzenlemede tekrar "done"
    // seçilirse) mevcut closedAt korunur — yeniden açılıp kapatılmadıkça değişmez.
    const previousEntry = editingId ? entries.find((e) => e.id === editingId) : null;
    let closedAt = previousEntry?.closedAt || null;
    if (formValues.status === "done" && !closedAt) closedAt = new Date().toISOString();
    if (formValues.status !== "done") closedAt = null;

    const actorLabel = getRoleLabel(role);
    const isClosingNow = formValues.status === "done" && !previousEntry?.closedAt;
    const previousHistory = previousEntry?.history || [];
    const newHistoryEvent = !editingId
      ? makeHistoryEvent("created", `${formValues.hazard.trim()} — ${score} puan`, actorLabel)
      : isClosingNow
        ? makeHistoryEvent("closed", `${formValues.hazard.trim()} kapatıldı`, actorLabel)
        : makeHistoryEvent("fineKinneyUpdated", `Puan: ${score} (${level.label})`, actorLabel);

    const entry = {
      id: editingId || createId(),
      hazard: formValues.hazard.trim(),
      risk: formValues.risk.trim(),
      probability,
      frequency,
      severity,
      score,
      riskLevel: level.label,
      action: formValues.action.trim(),
      responsible: formValues.responsible.trim(),
      dueDate: formValues.dueDate,
      date: editingId ? formValues.date || todayLabel() : todayLabel(),
      status: formValues.status,
      priority: formValues.priority || "medium",
      completionPercent: clampPercent(formValues.completionPercent),
      closedAt,
      residualProbability,
      residualFrequency,
      residualSeverity,
      residualScore,
      residualRiskLevel: residualLevel?.label || null,
      // Sprint 5A alanları — hiçbiri zorunlu değil, eski kayıtlarda undefined/[] olarak kalır.
      departmentId: formValues.departmentId ?? previousEntry?.departmentId ?? null,
      branchId: formValues.branchId ?? previousEntry?.branchId ?? null,
      // Risk Tespiti'nden (Vision AI) köprülenen kanıt fotoğrafı, varsa. Manuel girilen
      // kayıtlarda ve düzenlemede korunur — form bu alan için bir UI sunmuyor, yalnızca
      // taşıma amaçlı (bkz. FineKinneyModule.jsx openDraftForm).
      photoId: formValues.photoId ?? previousEntry?.photoId ?? null,
      photoDataUrl: formValues.photoDataUrl ?? previousEntry?.photoDataUrl ?? null,
      // Düzeltici Faaliyet Kanıt Zorunluluğu: bkz. FineKinneyForm.jsx (zorunluluk
      // kontrolü) ve FineKinneyModule.jsx handleSubmit (pendingClosurePhotoDataUrl →
      // closurePhotoId dönüşümü, submit anında). `pendingClosurePhotoDataUrl` burada
      // KASITLI OLARAK yok — o hiçbir zaman kalıcı kayda yazılmaz.
      closureNote: formValues.closureNote ?? previousEntry?.closureNote ?? "",
      closurePhotoId: formValues.closurePhotoId ?? previousEntry?.closurePhotoId ?? null,
      correctiveActions: previousEntry?.correctiveActions || [],
      attachments: previousEntry?.attachments || [],
      notes: previousEntry?.notes || [],
      history: [...previousHistory, newHistoryEvent],
      // Sprint 7.1: legacy `status`tan türetilen workflow durumu. Hiçbir UI bu alanı
      // henüz okumuyor — yalnızca gelecekteki workflow ekranları için hazır veri.
      workflowState: mapLegacyStatusToWorkflowState(formValues.status),
    };

    await saveFineKinneyEntry(entry);
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === entry.id);
      return exists ? prev.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...prev];
    });

    logActivity({
      actor: actorLabel,
      action: editingId ? (isClosingNow ? "Risk kapatıldı" : "Risk güncellendi") : "Yeni risk oluşturuldu",
      details: `${entry.hazard} — ${entry.score} (${level.label})`,
      entityType: "fineKinney",
    });
    if (level.key === "veryHigh") {
      showLocalNotification("criticalRisk", "Çok Yüksek Risk Tespit Edildi", `"${entry.hazard}" — puan ${entry.score}. Acil önlem gerekebilir.`);
    }

    // Yalnızca yeni kayıtlarda bildirim üret (düzenlemede tekrar tekrar bildirim gitmesin).
    if (!editingId) {
      pushSystemNotification({ type: "riskCreated", title: "Yeni Risk Oluşturuldu", message: `${entry.hazard} — ${level.label} (${entry.score} puan)` });
      if (level.key === "high" || level.key === "veryHigh") {
        pushSystemNotification({ type: "criticalRisk", title: "Kritik Risk", message: `${entry.hazard} — ${level.label} (${entry.score} puan). Acil önlem gerekebilir.` });
      }
    }

    return entry;
  }, [role, entries]);

  const removeEntry = useCallback(async (id) => {
    const entry = entries.find((e) => e.id === id);
    await deleteFineKinneyEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    logActivity({
      actor: getRoleLabel(role),
      action: "Fine-Kinney değerlendirmesi silindi",
      details: entry?.hazard || `#${id}`,
      entityType: "fineKinney",
    });
  }, [entries, role]);

  const filteredEntries = useMemo(
    () => filterFineKinneyEntries(entries, { search, levelFilter, departmentFilter, branchFilter, statusFilter, priorityFilter, dateFrom, dateTo }),
    [entries, search, levelFilter, departmentFilter, branchFilter, statusFilter, priorityFilter, dateFrom, dateTo]
  );

  return {
    entries: filteredEntries,
    allEntries: entries, // Açık ayrıntı kaydını filtrelerden bağımsız çözümlemek için.
    totalCount: entries.length,
    loaded,
    loadError,
    search,
    setSearch,
    levelFilter,
    setLevelFilter,
    departmentFilter,
    setDepartmentFilter,
    branchFilter,
    setBranchFilter,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    saveEntry,
    removeEntry,
    applyPatchedEntry,
  };
}
