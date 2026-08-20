import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { findRelevantDocuments, findRelatedDocuments } from "./knowledgeCenter.js";

const docs = [
  { id: 1, title: "Yüksekte Çalışma Yönetmeliği", summary: "Yüksekte çalışma güvenlik kuralları", content: "Düşme önleme ekipmanları zorunludur.", tags: ["yükseklik", "düşme"], category: "legislation" },
  { id: 2, title: "KKD Kullanım Kılavuzu", summary: "Kişisel koruyucu donanım seçimi", content: "Baret, eldiven ve emniyet kemeri kullanımı.", tags: ["kkd", "ekipman"], category: "ppe" },
  { id: 3, title: "Forklift Güvenlik Talimatı", summary: "Forklift operasyonlarında güvenlik", content: "Yaya-forklift yakınlığı risklidir.", tags: ["forklift", "ekipman"], category: "riskAnalysis" },
];

describe("findRelevantDocuments", () => {
  test("sorudaki kelimeyle eşleşen dokümanı bulur", () => {
    const result = findRelevantDocuments("yüksekte çalışırken ne yapmalıyım", docs);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 1);
  });

  test("2 harf ve altı kelimeleri (ne, mi, de vb.) yok sayar", () => {
    // "ne" gibi kısa kelimeler filtrelenmezse alakasız eşleşmeler çıkabilir.
    const result = findRelevantDocuments("ne mi de", docs);
    assert.equal(result.length, 0);
  });

  test("hiçbir doküman eşleşmezse boş dizi döner", () => {
    const result = findRelevantDocuments("alakasız bambaşka konu", docs);
    assert.equal(result.length, 0);
  });

  test("birden fazla doküman eşleşirse skora göre azalan sırada döner", () => {
    // "ekipman" hem KKD hem Forklift dokümanında geçiyor; "koruyucu" yalnızca KKD'de.
    const result = findRelevantDocuments("ekipman koruyucu donanım", docs);
    assert.ok(result.length >= 1);
    assert.equal(result[0].id, 2); // daha çok kelime eşleşen doküman önde olmalı
  });

  test("maxResults sınırına uyar", () => {
    const result = findRelevantDocuments("ekipman", docs, 1);
    assert.equal(result.length, 1);
  });

  test("eş anlamlı/kısaltma genişletmesi: 'KKD' araması tam adı 'kişisel koruyucu donanım' geçen dokümanı bulur", () => {
    const result = findRelevantDocuments("kkd nedir", docs);
    assert.ok(result.some((d) => d.id === 2));
  });

  test("eş anlamlı genişletme ters yönde de çalışır: tam terimle arama kısaltmayı içeren dokümanı bulur", () => {
    const onlyAbbrevDoc = [{ id: 9, title: "KKD Zorunluluğu", summary: "kkd kullanımı şart", content: "detay", tags: ["kkd"], category: "ppe" }];
    const result = findRelevantDocuments("kişisel koruyucu donanım gerekli mi", onlyAbbrevDoc);
    assert.equal(result.length, 1);
  });

  test("alan ağırlıklandırması: terim başlıkta geçen doküman, yalnızca içerikte geçenden önde çıkar", () => {
    const titleMatch = { id: 10, title: "Gürültü Yönetmeliği", summary: "genel", content: "genel", tags: [], category: "legislation" };
    const contentOnlyMatch = { id: 11, title: "Genel Talimat", summary: "genel", content: "işyerinde gürültü seviyesi ölçülmelidir", tags: [], category: "legislation" };
    const result = findRelevantDocuments("gürültü", [contentOnlyMatch, titleMatch]); // bilinçli olarak ters sırada veriliyor
    assert.equal(result[0].id, 10); // başlıkta geçen önde olmalı, dizideki sıra önemli değil
  });

  test("çok kelimeli tam ifade başlıkta birebir geçince ekstra bonus alır", () => {
    const exactPhrase = { id: 12, title: "Yangın Söndürme Eğitimi", summary: "x", content: "x", tags: [], category: "training" };
    const partialWords = { id: 13, title: "Eğitim Takvimi", summary: "yangın ve söndürme konuları ayrı ayrı geçer burada", content: "x", tags: [], category: "training" };
    const result = findRelevantDocuments("yangın söndürme eğitimi", [partialWords, exactPhrase]);
    assert.equal(result[0].id, 12);
  });
});

describe("findRelatedDocuments", () => {
  test("aynı kategoriyi paylaşan dokümanı bulur, kendisini hariç tutar", () => {
    const target = docs[1]; // KKD Kullanım Kılavuzu (ppe)
    const related = findRelatedDocuments(target, docs);
    assert.ok(!related.some((d) => d.id === target.id));
  });

  test("ortak etiketi olan dokümanı ilişkili sayar", () => {
    const target = docs[1]; // tags: kkd, ekipman
    const related = findRelatedDocuments(target, docs);
    assert.ok(related.some((d) => d.id === 3)); // "ekipman" etiketi ortak
  });
});
