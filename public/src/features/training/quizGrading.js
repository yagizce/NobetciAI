// CourseQuiz.jsx'ten ÇIKARILDI: puanlama mantığı React'tan bağımsız, test edilebilir
// olsun diye. Yeni soru tipi eklemek istendiğinde (bkz. AI_ROADMAP.md → Eğitim Modülü
// genişletmeleri): `isAnswered`/`isCorrect`'e yeni bir `question.type` dalı eklemek
// yeterli — CourseQuiz.jsx yalnızca bu iki fonksiyonu çağırır, kendi puanlama mantığı yok.
//
// Sorular varsayılan olarak (type belirtilmemişse) "single" kabul edilir — bu, önceki
// tüm mock kurs verisiyle (constants/trainingCourses.js) GERİYE DÖNÜK UYUMLUDUR, hiçbir
// mevcut soru değiştirilmeden "multi" tipi eklenebilir.

/**
 * @param {{type?: "single"|"multi"}} question
 * @param {number|number[]|undefined} answer
 * @returns {boolean}
 */
export function isAnswered(question, answer) {
  if (question.type === "multi") return Array.isArray(answer) && answer.length > 0;
  return answer !== undefined;
}

/**
 * @param {{type?: "single"|"multi", correctIndex?: number, correctIndices?: number[]}} question
 * @param {number|number[]|undefined} answer
 * @returns {boolean}
 */
export function isCorrect(question, answer) {
  if (question.type === "multi") {
    if (!Array.isArray(answer)) return false;
    const correct = [...new Set(question.correctIndices || [])].sort((a, b) => a - b);
    const given = [...new Set(answer)].sort((a, b) => a - b);
    // Tam eşleşme (all-or-nothing) — kısmi puan verilmiyor, diğer sorularla tutarlı
    // olsun diye (her soru ya doğru ya yanlış sayılır, quiz genelinde yüzdeye yansır).
    return correct.length > 0 && correct.length === given.length && correct.every((v, i) => v === given[i]);
  }
  return answer === question.correctIndex;
}

/**
 * @param {Array<object>} quiz
 * @param {Record<string, number|number[]>} answers
 * @returns {{ correctCount: number, scorePercent: number }}
 */
export function gradeQuiz(quiz, answers) {
  const correctCount = quiz.filter((q) => isCorrect(q, answers[q.id])).length;
  const scorePercent = quiz.length > 0 ? Math.round((correctCount / quiz.length) * 100) : 0;
  return { correctCount, scorePercent };
}
