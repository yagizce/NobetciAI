import { useState, useEffect, useCallback, useMemo } from "react";
import { getRiskDetections, saveRiskDetection, deleteRiskDetection } from "../../../services/riskDetectionService.js";
import { computeRiskDetectionStats } from "../../../constants/riskDetection.js";
import { logActivity } from "../../../services/auditService.js";
import { pushSystemNotification } from "../../../services/systemNotificationService.js";
import { useRole } from "../../../contexts/RoleContext.jsx";
import { getRoleLabel } from "../../../constants/allRoles.js";
import { turkishLower } from "../../../utils/text.js";
import { createId } from "../../../utils/id.js";

export function useRiskDetections(initialSearch = "") {
  const { role } = useRole();
  const [detections, setDetections] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    getRiskDetections().then((data) => {
      setDetections(data);
      setLoaded(true);
    }).catch((err) => {
      console.error("Risk tespitleri yüklenemedi:", err);
      setLoadError("Risk tespitleri yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
      setLoaded(true);
    });
  }, []);

  // Biriktirme (accumulation): aynı kategori+konum için AÇIK (new/reviewing) bir tespit
  // zaten varsa yeni satır açmak yerine occurrenceCount'u artırıp lastSeenAt'i güncelle.
  // Önceki "vaka" zaten kapanmışsa (converted/dismissed) yeni bir vaka olarak açılır —
  // bu bilinçli: kapanmış bir tehlikenin yeniden görülmesi, gerçekten yeni bir olaydır.
  const addDetection = useCallback(async (category, location, source, departmentId = null, extra = {}) => {
    const nowIso = new Date().toISOString();
    const existing = detections.find(
      (d) => d.category === category && d.location === location && (d.status === "new" || d.status === "reviewing")
    );

    if (existing) {
      const updated = { ...existing, occurrenceCount: existing.occurrenceCount + 1, lastSeenAt: nowIso };
      await saveRiskDetection(updated);
      setDetections((prev) => prev.map((d) => (d.id === existing.id ? updated : d)));
      return updated;
    }

    const fresh = {
      id: createId(),
      category,
      location,
      departmentId,
      source,
      detectedAt: nowIso,
      lastSeenAt: nowIso,
      occurrenceCount: 1,
      status: "new",
      dismissReason: "",
      hazardNote: extra.hazardNote || "",
      // Bu alan yalnızca kaldırılmış eski tek-tespit fotoğraf akışının ürettiği geçmiş
      // kayıtlar için (geriye dönük uyumluluk) — Phase 6 çoklu bulgu akışı artık `photoId`
      // kullanıyor (bkz. riskDetectionPhotoService.js), fotoğrafı her bulgu kaydına
      // AYRI AYRI gömmüyor. İkisi birlikte gelmez: extra ya photoDataUrl ya da photoId taşır.
      photoDataUrl: extra.photoDataUrl || null,
      photoId: extra.photoId || null,
      // BUG FIX: Phase 6 Vision AI alanları önceden buraya HİÇ yazılmıyordu — RiskDetectionCard.jsx
      // bu alanları gösterecek şekilde güncellenmişti ama addDetection() extra'dan yalnızca
      // hazardNote/photoDataUrl okuyordu, geri kalanı sessizce kaybediliyordu.
      description: extra.description || "",
      recommendedAction: extra.recommendedAction || "",
      affected: extra.affected || "",
      legislationRef: extra.legislationRef || "",
      confidenceScore: typeof extra.confidenceScore === "number" ? extra.confidenceScore : null,
    };
    await saveRiskDetection(fresh);
    setDetections((prev) => [fresh, ...prev]);
    logActivity({
      actor: source === "manual" || source === "photo" ? getRoleLabel(role) : "Sistem (Demo Simülasyonu)",
      action: source === "photo" ? "Yeni risk tespiti (fotoğraf)" : "Yeni risk tespiti",
      details: `${location} — ${category}`,
      entityType: "riskDetection",
    });
    pushSystemNotification({ type: "riskDetection", title: "Yeni Risk Tespiti", message: `${location} konumunda yeni bir tespit var.` });
    return fresh;
  }, [detections, role]);

  const updateStatus = useCallback(async (id, status, extra = {}) => {
    const current = detections.find((d) => d.id === id);
    if (!current) return;
    const updated = { ...current, status, ...extra };
    await saveRiskDetection(updated);
    setDetections((prev) => prev.map((d) => (d.id === id ? updated : d)));
    logActivity({
      actor: getRoleLabel(role),
      action: status === "reviewing" ? "Tespit incelemeye alındı" : status === "converted" ? "Tespit Fine-Kinney'e dönüştürüldü" : status === "dismissed" ? "Tespit reddedildi" : "Tespit güncellendi",
      details: `${current.location} — ${current.category}`,
      entityType: "riskDetection",
    });
  }, [detections, role]);

  const removeDetection = useCallback(async (id) => {
    await deleteRiskDetection(id);
    setDetections((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const filteredDetections = useMemo(() => {
    const query = turkishLower(search.trim());
    return detections
      .filter((d) => {
        const matchesSearch = !query || turkishLower(d.location).includes(query);
        const matchesStatus = statusFilter === "all" || d.status === statusFilter;
        const matchesCategory = categoryFilter === "all" || d.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt));
  }, [detections, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => computeRiskDetectionStats(detections), [detections]);

  return {
    detections: filteredDetections,
    allDetections: detections,
    totalCount: detections.length,
    stats,
    loaded,
    loadError,
    addDetection,
    updateStatus,
    removeDetection,
    search, setSearch,
    statusFilter, setStatusFilter,
    categoryFilter, setCategoryFilter,
  };
}
