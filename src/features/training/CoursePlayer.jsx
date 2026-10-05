import { useState, useEffect, useRef } from "react";
import NoSkipVideoPlayer from "./NoSkipVideoPlayer.jsx";
import CourseQuiz from "./CourseQuiz.jsx";
import { printTrainingCompletionCertificate } from "./printTrainingCompletionCertificate.js";
import { getPrimaryCompany } from "../../services/companyService.js";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { X, CheckCircle2, AlertTriangle, FileText } from "../../components/icons/index.jsx";

/**
 * Video → Sınav → Sonuç akışını yöneten orkestratör. Kendisi bir sertifika/PDF
 * ÜRETMEZ — sonuç ekranındaki "Tamamlandı" durumu ve arkada kaydedilen
 * TrainingCompletion kaydı, uzaktan eğitimin verildiğinin asıl belgesidir. Ayrıca,
 * isteğe bağlı bir "Tamamlama Belgesi" (bilinçli olarak "sertifika" DEĞİL — bkz.
 * printTrainingCompletionCertificate.js dosya başı yorumu) yazdırılabilir; bu yalnızca
 * ek bir kolaylıktır, TrainingCompletion kaydının yerini tutmaz.
 *
 * Sprint 7.2.1: `myProgress` (varsa) ile "kaldığı yerden devam et" desteklenir.
 *
 * @param {{ theme: object, course: object, employeeName: string, myProgress: import("../../types/index.js").TrainingProgress|null, onClose: () => void, onComplete: (data: object) => void, onProgress: (data: object) => void }} props
 */
export default function CoursePlayer({ theme, course, employeeName, myProgress, onClose, onComplete, onProgress }) {
  const alreadyFullyWatched = Boolean(myProgress && myProgress.durationSeconds > 0 && myProgress.positionSeconds >= myProgress.durationSeconds - 1);
  const [step, setStep] = useState("video"); // video | quiz | result
  const [videoWatched, setVideoWatched] = useState(alreadyFullyWatched);
  const [result, setResult] = useState(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  // Her sınav denemesi için artan sayaç: geç dönen eski bir kayıt sonucu, yeni denemenin
  // durumunu yanlışlıkla güncellemesin.
  const attemptRef = useRef(0);
  // UX FIX (Eğitim cilası — çift tıklama): `handlePrintCertificate` async (getPrimaryCompany
  // beklemesi var) — hızlı çift tıklamada iki ayrı yazdırma penceresi açılabiliyordu.
  const [printing, setPrinting] = useState(false);

  // `saveStatus`: "saving" → "saved" | "failed". Sonuç ekranı hemen açılır (akış hızı korunur),
  // ama "tamamlandı / kayıt oluşturuldu / belge" yalnızca kayıt GERÇEKTEN oluştuysa gösterilir.
  async function handleQuizSubmit({ scorePercent, passed }) {
    const attempt = ++attemptRef.current;
    setResult({ scorePercent, passed, saveStatus: "saving" });
    setStep("result");
    let ok = false;
    try {
      ok = (await onComplete({
        courseId: course.id,
        employeeName,
        watchedFullVideo: true,
        quizScore: scorePercent,
        passed,
      })) === true;
    } catch {
      ok = false;
    }
    if (attempt !== attemptRef.current) return;
    setResult((prev) => (prev ? { ...prev, saveStatus: ok ? "saved" : "failed" } : prev));
  }

  async function handlePrintCertificate() {
    if (printing) return;
    setPrinting(true);
    try {
      const company = await getPrimaryCompany();
      const opened = printTrainingCompletionCertificate({
        employeeName,
        courseTitle: course.title,
        completedAt: new Date().toISOString(),
        quizScore: result.scorePercent,
        companyName: company?.name,
      });
      setPopupBlocked(!opened);
    } finally {
      setPrinting(false);
    }
  }

  // A11Y FIX: diğer tüm modal/çekmecelerde olduğu gibi (bkz. Modal.jsx, Sidebar.jsx)
  // Escape tuşu kapatmalı — ama BURADA kasıtlı bir istisna korunuyor: sınav adımında
  // (step === "quiz") X butonu da, arka plana tıklama da zaten devre dışı (yukarıdaki
  // aynı `step !== "quiz"` şartına bakın) — "no-skip" eğitim akışının kullanıcıyı
  // yarıda sınavdan kolayca çıkarmaması kasıtlı bir tasarım kararı. Escape bu kuralı
  // atlamamalı, aynı şartla tutarlı olmalı.
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && step !== "quiz") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4">
      <div className="absolute inset-0 bg-black/40" onClick={step !== "video" ? undefined : onClose} />
      <div role="dialog" aria-modal="true" aria-label={course.title} className="relative w-full max-w-lg rounded-2xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="font-[Oswald] text-base uppercase tracking-wide min-w-0 break-words" style={{ color: theme.textPrimary }}>{course.title}</p>
          {step !== "quiz" && (
            <button onClick={onClose} aria-label="Kapat" className="p-1.5 -m-1.5 -mt-1 rounded-lg shrink-0"><X style={{ fontSize: "18px", color: theme.textMuted }} /></button>
          )}
        </div>

        {step === "video" && (
          <NoSkipVideoPlayer
            theme={theme}
            videoUrl={course.videoUrl}
            initialPositionSeconds={myProgress?.positionSeconds || 0}
            onFullyWatched={() => setVideoWatched(true)}
            onProgress={(positionSeconds, durationSeconds) => onProgress({ courseId: course.id, employeeName, positionSeconds, durationSeconds })}
          />
        )}

        {step === "video" && (
          <Button className="w-full mt-3" onClick={() => setStep("quiz")} disabled={!videoWatched}>
            {videoWatched ? "Sınava Geç" : "Sınava geçmek için videoyu tamamlayın"}
          </Button>
        )}

        {step === "quiz" && (
          <CourseQuiz theme={theme} quiz={course.quiz} passingScorePercent={course.passingScorePercent} onSubmit={handleQuizSubmit} />
        )}

        {step === "result" && result && (() => {
          // Geçti ama kayıt henüz bitmedi/başarısız → "tamamlandı" ve belge GÖSTERİLMEZ.
          const passedAndSaved = result.passed && result.saveStatus === "saved";
          const passedSaving = result.passed && result.saveStatus === "saving";
          const passedSaveFailed = result.passed && result.saveStatus === "failed";
          return (
            <div className="text-center py-4">
              {passedAndSaved ? (
                <CheckCircle2 style={{ fontSize: "40px", color: theme.successText, margin: "0 auto 8px" }} />
              ) : (
                <AlertTriangle style={{ fontSize: "40px", color: theme.warnText, margin: "0 auto 8px" }} />
              )}
              <p className="text-lg font-bold mb-1" style={{ color: theme.textPrimary }}>%{result.scorePercent}</p>
              <div className="mb-3">
                {passedAndSaved && <Badge tone="success">Başarılı — Eğitim Tamamlandı</Badge>}
                {passedSaving && <Badge tone="neutral">Sonuç kaydediliyor...</Badge>}
                {passedSaveFailed && <Badge tone="warning">Sonuç Kaydedilemedi</Badge>}
                {!result.passed && <Badge tone="warning">Başarısız — Tekrar Deneyin</Badge>}
              </div>
              <p className="text-xs mb-4" style={{ color: passedSaveFailed ? theme.warnText : theme.textFaint }}>
                {passedAndSaved && "Tamamlama kaydınız oluşturuldu."}
                {passedSaving && "Sınavı geçtiniz. Tamamlama kaydınız oluşturuluyor, lütfen bekleyin."}
                {passedSaveFailed && "Sınavı geçtiniz ancak tamamlama kaydınız oluşturulamadı. Lütfen sınavı yeniden tamamlayın."}
                {!result.passed && `Geçme notu %${course.passingScorePercent}. Videoyu tekrar izleyip sınava yeniden girebilirsiniz.`}
              </p>
              {passedAndSaved && (
                <>
                  <Button variant="secondary" onClick={handlePrintCertificate} disabled={printing} className="w-full mb-2 flex items-center justify-center gap-1.5">
                    <FileText style={{ fontSize: "14px" }} /> {printing ? "Hazırlanıyor..." : "Tamamlama Belgesini İndir (PDF)"}
                  </Button>
                  {popupBlocked && (
                    <p className="text-[10.5px] mb-2" style={{ color: theme.warnText }}>
                      Tarayıcınız yeni pencereyi engelledi. Lütfen bu site için pop-up izni verip tekrar deneyin.
                    </p>
                  )}
                </>
              )}
              <div className="flex gap-2">
                {(!result.passed || passedSaveFailed) && (
                  <Button variant="secondary" className="flex-1" onClick={() => { setStep("video"); setResult(null); }}>
                    Tekrar Dene
                  </Button>
                )}
                <Button className="flex-1" onClick={onClose}>Kapat</Button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
