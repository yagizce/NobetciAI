import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getRiskDetections, saveRiskDetection, deleteRiskDetection } from "../../../services/riskDetectionService.js";
import { RISK_DETECTION_CATEGORIES, MOCK_DETECTION_LOCATIONS, computeRiskDetectionStats } from "../../../constants/riskDetection.js";
import { logActivity } from "../../../services/auditService.js";
import { pushSystemNotification } from "../../../services/systemNotificationService.js";
import { useRole } from "../../../contexts/RoleContext.jsx";
import { getRoleLabel } from "../../../constants/allRoles.js";
import { turkishLower } from "../../../utils/text.js";
import { createId } from "../../../utils/id.js";

const SIMULATION_INTERVAL_MS = 25000; // demo modunda ~25 saniyede bir yeni örnek tespit

export function useRiskDetections(initialSearch = "") {
  const { role } = useRole();
  const [detections, setDetections] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [simulating, setSimulating] = useState(false);
  const simulationTimerRef = useRef(null);

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
      photoDataUrl: extra.photoDataUrl || null,
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

  // RİSK TEMİZLİĞİ: `addDetection`, `[detections, role]`'e bağımlı olduğu için HER yeni
  // tespitte (simülasyonun kendi ürettiği tespitler dahil) kimliği değişiyordu — bu da
  // aşağıdaki interval efektinin (`[simulating, addDetection]` bağımlılığıyla) her
  // tespitte interval'i temizleyip YENİDEN kurmasına yol açıyordu. Bir bellek sızıntısı
  // DEĞİLDİ (cleanup her zaman doğru çalışıyordu) ama gereksiz bir kur/söküm döngüsüydü.
  // Standart çözüm: `addDetection`'ın en güncel halini bir ref'te tutup interval'in
  // KENDİSİ yalnızca `simulating` değiştiğinde bir kez kurulsun/sökülsün.
  const addDetectionRef = useRef(addDetection);
  useEffect(() => { addDetectionRef.current = addDetection; }, [addDetection]);

  // Demo: Otomatik Simülasyon — gerçek kamera henüz yoktur; açıkken periyodik olarak
  // rastgele kategori+konum ile "simulated" kaynaklı bir tespit üretir. Sekme kapatılınca
  // veya "simulating" false olunca interval temizlenir (bellek sızıntısı yok).
  useEffect(() => {
    if (!simulating) {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      return;
    }
    simulationTimerRef.current = setInterval(() => {
      const category = RISK_DETECTION_CATEGORIES[Math.floor(Math.random() * RISK_DETECTION_CATEGORIES.length)].value;
      const location = MOCK_DETECTION_LOCATIONS[Math.floor(Math.random() * MOCK_DETECTION_LOCATIONS.length)];
      addDetectionRef.current(category, location, "simulated");
    }, SIMULATION_INTERVAL_MS);
    return () => clearInterval(simulationTimerRef.current);
  }, [simulating]);

  // Sekmeden ayrılınca / bileşen unmount olunca interval'in mutlaka temizlenmesi.
  useEffect(() => () => { if (simulationTimerRef.current) clearInterval(simulationTimerRef.current); }, []);

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
    simulating, setSimulating,
  };
}
