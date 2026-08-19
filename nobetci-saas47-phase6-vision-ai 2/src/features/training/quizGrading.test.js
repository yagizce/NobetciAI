import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isAnswered, isCorrect, gradeQuiz } from "./quizGrading.js";

const singleQ = { id: "q1", question: "?", options: ["a", "b", "c"], correctIndex: 1 };
const multiQ = { id: "q2", type: "multi", question: "?", options: ["a", "b", "c", "d"], correctIndices: [0, 2] };

describe("isAnswered", () => {
  test("single tipi için yalnızca undefined cevap 'cevapsız' sayılır", () => {
    assert.equal(isAnswered(singleQ, undefined), false);
    assert.equal(isAnswered(singleQ, 0), true);
  });

  test("multi tipi için boş dizi de 'cevapsız' sayılır", () => {
    assert.equal(isAnswered(multiQ, undefined), false);
    assert.equal(isAnswered(multiQ, []), false);
    assert.equal(isAnswered(multiQ, [0]), true);
  });
});

describe("isCorrect", () => {
  test("single tipte doğru/yanlış index kontrolü", () => {
    assert.equal(isCorrect(singleQ, 1), true);
    assert.equal(isCorrect(singleQ, 0), false);
  });

  test("multi tipte tam eşleşme doğru sayılır (sıra önemsiz)", () => {
    assert.equal(isCorrect(multiQ, [0, 2]), true);
    assert.equal(isCorrect(multiQ, [2, 0]), true); // sıra farklı ama küme aynı
  });

  test("multi tipte eksik veya fazla seçim yanlış sayılır (kısmi puan yok)", () => {
    assert.equal(isCorrect(multiQ, [0]), false); // eksik
    assert.equal(isCorrect(multiQ, [0, 1, 2]), false); // fazladan yanlış seçenek
    assert.equal(isCorrect(multiQ, [1, 3]), false); // tamamen yanlış
  });

  test("multi tipte boş dizi veya dizi olmayan cevap yanlış sayılır", () => {
    assert.equal(isCorrect(multiQ, []), false);
    assert.equal(isCorrect(multiQ, undefined), false);
    assert.equal(isCorrect(multiQ, 0), false);
  });
});

describe("gradeQuiz", () => {
  test("karışık single+multi sorularda doğru yüzdeyi hesaplar", () => {
    const quiz = [singleQ, multiQ];
    const result = gradeQuiz(quiz, { q1: 1, q2: [0, 2] });
    assert.equal(result.correctCount, 2);
    assert.equal(result.scorePercent, 100);
  });

  test("kısmen doğru cevaplarda oranı doğru hesaplar", () => {
    const quiz = [singleQ, multiQ];
    const result = gradeQuiz(quiz, { q1: 1, q2: [0] }); // yalnızca q1 doğru
    assert.equal(result.correctCount, 1);
    assert.equal(result.scorePercent, 50);
  });

  test("boş quiz için 0 döner (bölme hatası olmaz)", () => {
    const result = gradeQuiz([], {});
    assert.equal(result.scorePercent, 0);
    assert.equal(result.correctCount, 0);
  });
});
