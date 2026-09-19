import { useState, useEffect, useMemo } from "react";
import { useIsgData } from "../../../contexts/IsgDataContext.jsx";
import { getPrimaryCompany } from "../../../services/companyService.js";
import { getBranches } from "../../../services/branchService.js";
import { getDepartments } from "../../../services/departmentService.js";
import { getEmployees } from "../../../services/employeeService.js";
import { getFineKinneyEntries } from "../../../services/riskService.js";
import { getPeriodicChecks } from "../../../services/periodicCheckService.js";
import { getAuditLog } from "../../../services/auditService.js";
import { getDocuments } from "../../../services/documentService.js";
import { getFineKinneyRiskLevel } from "../../../constants/fineKinney.js";
import { EDUCATION_MODULES } from "../../../constants/education.js";
import { TRAINING_COURSES } from "../../../constants/trainingCourses.js";
import { computeTrainingStats, getOngoingTrainingItems } from "../../../constants/trainingStatus.js";
import { getTrainingProgress, getTrainingCompletions } from "../../../services/trainingService.js";
import { computeSafetyScore } from "../../../utils/safetyScore.js";
import { computeWeeklySummary } from "../../../utils/executiveSummary.js";
import { computeAccidentFreeStreak } from "../../../utils/accidentFreeStreak.js";
import { computeLast30DayChange } from "../../../utils/dashboardTrends.js";

/**
 * Tek yerden yükler, Genel Bakış / Performans sekmeleri ve tüm widget'lar aynı veriyi
 * tekrar çekmeden kullanır. Sprint 7.2.1 ile "Tamamlanan Eğitimler" artık gerçek
 * `trainingCompletions`/`trainingProgress` verisinden hesaplanıyor (bkz. trainingStats).
 */
export function useEmployerDashboardData() {
  const { notifications } = useIsgData();
  const [company, setCompany] = useState(null);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [fineKinneyEntries, setFineKinneyEntries] = useState([]);
  const [periodicChecks, setPeriodicChecks] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [trainingProgress, setTrainingProgress] = useState([]);
  const [trainingCompletionRecords, setTrainingCompletionRecords] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPrimaryCompany().then(async (c) => {
      if (cancelled) return;
      setCompany(c);
      if (c) {
        try {
          const [b, d, e, fk, pc, log, tp, tc, docs] = await Promise.all([
            getBranches(c.id), getDepartments(c.id), getEmployees(c.id),
            getFineKinneyEntries(), getPeriodicChecks(), getAuditLog(),
            getTrainingProgress(), getTrainingCompletions(), getDocuments(),
          ]);
          if (cancelled) return;
          setBranches(b);
          setDepartments(d);
          setEmployees(e);
          setFineKinneyEntries(fk);
          setPeriodicChecks(pc);
          setAuditLog(log);
          setTrainingProgress(tp);
          setTrainingCompletionRecords(tc);
          setDocuments(docs);
        } catch (e) {
          // IndexedDB engellenmiş olabilir (örn. gizli sekme/depolama izni yok) — Dashboard
          // burada çökmek yerine ErrorState gösterebilsin diye hatayı state'e taşıyoruz.
          if (!cancelled) setError(e);
        }
      }
      if (!cancelled) setLoaded(true);
    }).catch((e) => {
      if (!cancelled) { setError(e); setLoaded(true); }
    });
    return () => { cancelled = true; };
  }, []);

  const riskAnalyses = useMemo(() => notifications.filter((n) => n.status === "approved"), [notifications]);
  const aiAnalyzedNotifications = useMemo(() => notifications.filter((n) => n.aiAnalysis), [notifications]);

  const metrics = useMemo(() => {
    const openRisks = fineKinneyEntries.filter((e) => e.status !== "done").length;
    const criticalRisks = fineKinneyEntries.filter((e) => {
      const level = getFineKinneyRiskLevel(e.score).key;
      return level === "high" || level === "veryHigh";
    }).length;
    const upcomingChecks = periodicChecks.filter((c) => c.status === "upcoming" || c.status === "overdue").length;
    const closedEntries = fineKinneyEntries.filter((e) => e.status === "done");
    const riskClosureRate = fineKinneyEntries.length > 0 ? Math.round((closedEntries.length / fineKinneyEntries.length) * 100) : 0;
    const okChecks = periodicChecks.filter((c) => c.status === "ok").length;
    const periodicCompletionRate = periodicChecks.length > 0 ? Math.round((okChecks / periodicChecks.length) * 100) : 0;
    // Sprint 7.2.1: artık gerçek veriden — kaç kursun en az bir başarılı tamamlama
    // kaydı olduğu (aynı "X/Y" formatını koruyarak, yalnızca kaynağı gerçek yapıyor).
    const coursesWithPassingCompletion = TRAINING_COURSES.filter((course) =>
      trainingCompletionRecords.some((c) => c.courseId === course.id && c.passed)
    ).length;
    const trainingCompletionRate = EDUCATION_MODULES.length > 0
      ? Math.round((coursesWithPassingCompletion / EDUCATION_MODULES.length) * 100)
      : 0;

    // KPI: Ortalama Risk Puanı — gerçek, tüm Fine-Kinney kayıtlarının ortalaması.
    const avgRiskScore = fineKinneyEntries.length > 0
      ? Math.round(fineKinneyEntries.reduce((sum, e) => sum + e.score, 0) / fineKinneyEntries.length)
      : 0;

    // KPI: Risk Kapanma Süresi — gerçek, closedAt - date farkının gün ortalaması (yalnızca closedAt damgalı kayıtlar).
    const closureDurations = closedEntries
      .filter((e) => e.closedAt && e.date)
      .map((e) => Math.max(0, Math.round((new Date(e.closedAt) - new Date(e.date)) / (1000 * 60 * 60 * 24))));
    const avgClosureDays = closureDurations.length > 0 ? Math.round(closureDurations.reduce((a, b) => a + b, 0) / closureDurations.length) : null;

    // Düzeltici Faaliyet Modülü: her açık risk aynı zamanda bir düzeltici faaliyettir (priority/completionPercent alanlarıyla).
    const activeCorrectiveActions = fineKinneyEntries.filter((e) => e.status !== "done").length;
    const avgCompletionOfActive = activeCorrectiveActions > 0
      ? Math.round(fineKinneyEntries.filter((e) => e.status !== "done").reduce((sum, e) => sum + (e.completionPercent || 0), 0) / activeCorrectiveActions)
      : 100;
    const correctiveActionCompletionRate = fineKinneyEntries.length > 0
      ? Math.round(fineKinneyEntries.reduce((sum, e) => sum + (e.status === "done" ? 100 : (e.completionPercent || 0)), 0) / fineKinneyEntries.length)
      : 100;

    return {
      totalEmployees: employees.length,
      openRisks,
      criticalRisks,
      upcomingChecks,
      completedTrainings: Math.round((trainingCompletionRate / 100) * EDUCATION_MODULES.length),
      totalTrainings: EDUCATION_MODULES.length,
      recentAiAnalyses: aiAnalyzedNotifications.length,
      riskClosureRate,
      periodicCompletionRate,
      trainingCompletionRate,
      branchCount: branches.length,
      departmentCount: departments.length,
      avgRiskScore,
      avgClosureDays,
      activeCorrectiveActions,
      avgCompletionOfActive,
      correctiveActionCompletionRate,
      totalRisks: fineKinneyEntries.length,
    };
  }, [fineKinneyEntries, periodicChecks, employees, branches, departments, aiAnalyzedNotifications, trainingCompletionRecords]);

  const safetyScore = useMemo(() => computeSafetyScore({
    openRisks: metrics.openRisks,
    criticalRisks: metrics.criticalRisks,
    totalRisks: fineKinneyEntries.length,
    trainingCompletionRate: metrics.trainingCompletionRate,
    upcomingChecks: metrics.upcomingChecks,
    totalChecks: periodicChecks.length,
    correctiveActionCompletionRate: metrics.correctiveActionCompletionRate,
  }), [metrics, fineKinneyEntries.length, periodicChecks.length]);

  const weeklySummary = useMemo(
    () => computeWeeklySummary(fineKinneyEntries, periodicChecks),
    [fineKinneyEntries, periodicChecks]
  );

  const accidentFreeStreak = useMemo(
    () => computeAccidentFreeStreak(notifications),
    [notifications]
  );

  // Sprint 7.2.1: "Dashboard'un kullanacağı eğitim istatistikleri" — bugünkü tek KPI
  // kartından (trainingCompletionRate, yukarıda) daha zengin bir kırılım. Sprint 7.4 ile
  // "Devam Eden Eğitimler" kartı (OngoingTrainingsCard) bu veriyi tüketiyor.
  const trainingStats = useMemo(
    () => computeTrainingStats(TRAINING_COURSES, trainingProgress, trainingCompletionRecords),
    [trainingProgress, trainingCompletionRecords]
  );

  // Sprint 7.4: trainingStats'ı tüketen ilk widget (Devam Eden Eğitimler kartı) — somut
  // katılımcı/kurs/ilerleme satırları için.
  const ongoingTrainingItems = useMemo(
    () => getOngoingTrainingItems(TRAINING_COURSES, trainingProgress, trainingCompletionRecords),
    [trainingProgress, trainingCompletionRecords]
  );

  // Sprint 7.4: "Son 30 Gün Değişim" kartı — gerçek zaman damgalı kayıtlardan hesaplanır.
  const last30DayChange = useMemo(
    () => computeLast30DayChange(fineKinneyEntries, periodicChecks, trainingCompletionRecords),
    [fineKinneyEntries, periodicChecks, trainingCompletionRecords]
  );

  return {
    company, branches, departments, employees, fineKinneyEntries, periodicChecks, auditLog, notifications, documents,
    riskAnalyses, metrics, safetyScore, weeklySummary, accidentFreeStreak, trainingStats, ongoingTrainingItems,
    trainingCompletionRecords, trainingProgressRecords: trainingProgress, last30DayChange, loaded, error,
  };
}
