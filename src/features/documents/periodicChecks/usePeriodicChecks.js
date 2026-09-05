import { useState, useEffect, useCallback, useMemo } from "react";
import { getPeriodicChecks, savePeriodicCheck, deletePeriodicCheck } from "../../../services/periodicCheckService.js";
import { computeNextDueDate, computeCheckStatus, computePeriodicCheckStats, normalizeIntervalDays } from "../../../constants/periodicCheck.js";
import { logActivity } from "../../../services/auditService.js";
import { pushSystemNotification } from "../../../services/systemNotificationService.js";
import { turkishLower } from "../../../utils/text.js";
import { useRole } from "../../../contexts/RoleContext.jsx";
import { getRoleLabel } from "../../../constants/allRoles.js";
import { todayISO } from "../../../utils/dateUtils.js";
import { createId } from "../../../utils/id.js";

export function usePeriodicChecks(initialSearch = "") {
  const { role } = useRole();
  const [checks, setChecks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Sprint 7.2.2: filtreleme — Fine-Kinney modülündeki (useFineKinneyEntries.js)
  // AYNI desen: arama + durum/kategori chip'leri, useMemo ile hesaplanan liste.
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  // Sprint 7.2.3: Departman + tarih aralığı filtresi — yine Fine-Kinney ile AYNI desen.
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    getPeriodicChecks().then((data) => {
      setChecks(data);
      setLoaded(true);
    }).catch((err) => {
      console.error("Periyodik kontroller yüklenemedi:", err);
      setLoadError("Periyodik kontrol verileri yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
      setLoaded(true);
    });
  }, []);

  const saveCheck = useCallback(async (formValues, editingId) => {
    const nextDueDate = computeNextDueDate(formValues.lastCheckDate, formValues.intervalDays);
    const status = computeCheckStatus(nextDueDate);
    const entry = {
      id: editingId || createId(),
      itemName: formValues.itemName.trim(),
      category: formValues.category,
      departmentId: formValues.departmentId || null,
      lastCheckDate: formValues.lastCheckDate,
      intervalDays: normalizeIntervalDays(formValues.intervalDays),
      nextDueDate,
      status,
      responsible: formValues.responsible.trim(),
      notes: formValues.notes.trim(),
      // QR Kod → Periyodik Kontrol entegrasyonu. `saveCheck` bu haliyle formValues'ta
      // olmayan hiçbir alanı önceki kayıttan KORUMUYOR (Fine-Kinney'deki `??
      // previousEntry?.x` düşürme deseninin aksine burada zaten tüm çağıranlar —
      // markCheckedToday, bulkUpdateDepartment — mevcut kaydın alanlarını elle
      // yeniden geçiriyor). Aynı disiplin qrCode/photoId için de korundu: her iki
      // çağıran da aşağıda güncellendi, buraya `?? null` eklemek yeterli değildi.
      qrCode: formValues.qrCode ?? null,
      photoId: formValues.photoId ?? null,
    };
    await savePeriodicCheck(entry);
    setChecks((prev) => {
      const exists = prev.some((c) => c.id === entry.id);
      return exists ? prev.map((c) => (c.id === entry.id ? entry : c)) : [entry, ...prev];
    });
    logActivity({
      actor: getRoleLabel(role),
      action: editingId ? "Periyodik kontrol güncellendi" : "Periyodik kontrol eklendi",
      details: entry.itemName,
      entityType: "periodicCheck",
    });
    if (status === "upcoming" || status === "overdue") {
      pushSystemNotification({
        type: "periodicCheckDue",
        title: status === "overdue" ? "Periyodik kontrol süresi geçti" : "Periyodik kontrol zamanı yaklaşıyor",
        message: `${entry.itemName} — sonraki kontrol: ${entry.nextDueDate}`,
      });
    }
    return entry;
  }, [role]);

  const removeCheck = useCallback(async (id) => {
    const check = checks.find((c) => c.id === id);
    await deletePeriodicCheck(id);
    setChecks((prev) => prev.filter((c) => c.id !== id));
    logActivity({
      actor: getRoleLabel(role),
      action: "Periyodik kontrol silindi",
      details: check?.itemName || `#${id}`,
      entityType: "periodicCheck",
    });
  }, [checks, role]);

  // Sprint 7.2.2 — yaratıcı ek: tek tıkla "Bugün Kontrol Edildi". Bugüne kadar bir
  // kontrolü tamamlanmış işaretlemenin tek yolu formu açıp tarihi elle değiştirmekti —
  // bu, modülün en sık yapılacak işlemi için gereksiz sürtünmeydi.
  const markCheckedToday = useCallback(async (id) => {
    const check = checks.find((c) => c.id === id);
    if (!check) return;
    await saveCheck({
      itemName: check.itemName,
      category: check.category,
      departmentId: check.departmentId,
      lastCheckDate: todayISO(),
      intervalDays: check.intervalDays,
      responsible: check.responsible,
      notes: check.notes,
      // BUG FIX (QR entegrasyonu): bu alanlar eklenmeden önce "Bugün Kontrol Edildi"
      // tek-tık aksiyonu, kaydın qrCode/photoId'sini SESSİZCE SİLERDİ — çünkü saveCheck
      // yalnızca kendisine verilen alanları yazıyor, formValues'ta olmayan bir alanı
      // önceki kayıttan miras almıyor (yukarıdaki not).
      qrCode: check.qrCode,
      photoId: check.photoId,
    }, id);
  }, [checks, saveCheck]);

  // Toplu işlem (bulk actions) — AI_ROADMAP.md'nin karşılığı. İkisi de tek tek
  // `saveCheck` çağırarak var olan tekli mantığı yeniden kullanır; yalnızca döngü
  // ekler, kendi başına yeni bir kayıt mantığı İÇERMEZ (tek sorumluluk noktası
  // korunur, tekli ve toplu işlem asla farklı davranmaz).
  const bulkMarkCheckedToday = useCallback(async (ids) => {
    for (const id of ids) await markCheckedToday(id);
  }, [markCheckedToday]);

  const bulkUpdateDepartment = useCallback(async (ids, departmentId) => {
    for (const id of ids) {
      const check = checks.find((c) => c.id === id);
      if (!check) continue;
      await saveCheck({
        itemName: check.itemName, category: check.category, departmentId,
        lastCheckDate: check.lastCheckDate, intervalDays: check.intervalDays,
        responsible: check.responsible, notes: check.notes,
        qrCode: check.qrCode, photoId: check.photoId,
      }, id);
    }
  }, [checks, saveCheck]);

  const filteredChecks = useMemo(() => {
    const query = turkishLower(search.trim());
    return checks.filter((c) => {
      const matchesSearch = !query || turkishLower(c.itemName).includes(query) || turkishLower(c.responsible || "").includes(query);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
      const matchesDepartment = departmentFilter === "all" || String(c.departmentId) === departmentFilter;
      // nextDueDate zaten ISO (YYYY-MM-DD) — leksikografik karşılaştırma güvenli.
      const matchesDateFrom = !dateFrom || (c.nextDueDate && c.nextDueDate >= dateFrom);
      const matchesDateTo = !dateTo || (c.nextDueDate && c.nextDueDate <= dateTo);
      return matchesSearch && matchesStatus && matchesCategory && matchesDepartment && matchesDateFrom && matchesDateTo;
    });
  }, [checks, search, statusFilter, categoryFilter, departmentFilter, dateFrom, dateTo]);

  // Sprint 7.2.3: üst özet kartları — her zaman TÜM kayıtlar üzerinden (filtreden
  // bağımsız), aksi halde bir filtre uygulandığında "Geciken" sayısı yanıltıcı görünürdü.
  const stats = useMemo(() => computePeriodicCheckStats(checks), [checks]);

  return {
    checks: filteredChecks,
    totalCount: checks.length,
    allChecks: checks,
    stats,
    loaded,
    loadError,
    saveCheck,
    removeCheck,
    markCheckedToday,
    bulkMarkCheckedToday,
    bulkUpdateDepartment,
    search, setSearch,
    statusFilter, setStatusFilter,
    categoryFilter, setCategoryFilter,
    departmentFilter, setDepartmentFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
  };
}
