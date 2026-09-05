import { useState } from "react";
import Button from "../../components/ui/Button.jsx";
import { CheckCircle2 } from "../../components/icons/index.jsx";
import { isAnswered, gradeQuiz } from "./quizGrading.js";

/**
 * Video sonu sınavı. Tüm sorular cevaplanmadan gönderilemez. Puanlama tamamen
 * otomatiktir (bkz. quizGrading.js). İki soru tipini destekler:
 * - "single" (varsayılan, belirtilmemişse) — tek doğru cevap, `correctIndex`
 * - "multi" — birden fazla doğru cevap, `correctIndices` (tam eşleşme aranır, kısmi puan yok)
 *
 * @param {{ theme: object, quiz: Array<{id:string, type?: "single"|"multi", question:string, options:string[], correctIndex?:number, correctIndices?:number[]}>, passingScorePercent: number, onSubmit: (result: { scorePercent: number, passed: boolean }) => void }} props
 */
export default function CourseQuiz({ theme, quiz, passingScorePercent, onSubmit }) {
  const [answers, setAnswers] = useState({});

  const allAnswered = quiz.every((q) => isAnswered(q, answers[q.id]));

  function selectSingle(question, optionIndex) {
    setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }));
  }

  function toggleMulti(question, optionIndex) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[question.id]) ? prev[question.id] : [];
      const next = current.includes(optionIndex) ? current.filter((i) => i !== optionIndex) : [...current, optionIndex];
      return { ...prev, [question.id]: next };
    });
  }

  function submit() {
    if (!allAnswered) return;
    const { scorePercent } = gradeQuiz(quiz, answers);
    onSubmit({ scorePercent, passed: scorePercent >= passingScorePercent });
  }

  return (
    <div>
      <p className="text-sm font-semibold mb-3" style={{ color: theme.textPrimary }}>Sınav</p>
      <div className="flex flex-col gap-4 mb-4">
        {quiz.map((q, qi) => {
          const isMulti = q.type === "multi";
          const selected = answers[q.id];
          return (
            <div key={q.id}>
              <p className="text-sm font-medium mb-1 break-words" style={{ color: theme.textPrimary }}>{qi + 1}. {q.question}</p>
              {isMulti && (
                <p className="text-[10.5px] mb-1.5" style={{ color: theme.textFaint }}>Birden fazla seçenek işaretleyebilirsiniz.</p>
              )}
              <div className="flex flex-col gap-1.5">
                {q.options.map((opt, oi) => {
                  const isSelected = isMulti ? Array.isArray(selected) && selected.includes(oi) : selected === oi;
                  return (
                    <button
                      key={oi}
                      onClick={() => (isMulti ? toggleMulti(q, oi) : selectSingle(q, oi))}
                      className="flex items-center gap-2 text-left text-sm px-3 py-2 rounded-lg border break-words"
                      style={
                        isSelected
                          ? { background: theme.accent, color: theme.onAccent, borderColor: theme.accent }
                          : { background: theme.surface, color: theme.textPrimary, borderColor: theme.border }
                      }
                    >
                      {isMulti && <CheckCircle2 style={{ fontSize: "14px", opacity: isSelected ? 1 : 0.35 }} />}
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <Button onClick={submit} disabled={!allAnswered} className="w-full">
        {allAnswered ? "Sınavı Bitir" : `${quiz.filter((q) => isAnswered(q, answers[q.id])).length}/${quiz.length} soru cevaplandı`}
      </Button>
    </div>
  );
}
