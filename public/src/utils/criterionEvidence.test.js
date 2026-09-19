import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  EVIDENCE_TYPES, getEvidenceTypeLabel, createCriterionEvidence,
  addCriterionEvidence, removeCriterionEvidence, computeEvidenceStatus, getEvidenceStatusMeta,
} from "./criterionEvidence.js";

describe("EVIDENCE_TYPES — kanıt türleri", () => {
  test("üç tür tanımlı: Fotoğraf, Belge, Not", () => {
    assert.deepEqual(EVIDENCE_TYPES.map((t) => t.value), ["photo", "document", "note"]);
    assert.deepEqual(EVIDENCE_TYPES.map((t) => t.label), ["Fotoğraf", "Belge", "Not"]);
  });

  test("getEvidenceTypeLabel bilinmeyen bir değer için değeri olduğu gibi döner", () => {
    assert.equal(getEvidenceTypeLabel("photo"), "Fotoğraf");
    assert.equal(getEvidenceTypeLabel("xyz"), "xyz");
  });
});

describe("createCriterionEvidence — kriter bağlantısı ve aşama bilgisi", () => {
  test("gerekli tüm alanları (id, type, description, createdAt, createdBy, criterionId, stage) üretir", () => {
    const entry = createCriterionEvidence({ type: "photo", description: "Kaçış yolu fotoğrafı", criterionId: "yangin-3", stage: "ongoing", createdBy: "İSG Uzmanı" });
    assert.ok(entry.id);
    assert.equal(entry.type, "photo");
    assert.equal(entry.description, "Kaçış yolu fotoğrafı");
    assert.ok(entry.createdAt);
    assert.equal(entry.createdBy, "İSG Uzmanı");
    assert.equal(entry.criterionId, "yangin-3");
    assert.equal(entry.stage, "ongoing");
  });

  test("description boşsa/verilmezse boş string olur, çökmez", () => {
    const entry = createCriterionEvidence({ type: "note", criterionId: "risk-1" });
    assert.equal(entry.description, "");
  });

  test("stage verilmezse null olur", () => {
    const entry = createCriterionEvidence({ type: "note", criterionId: "risk-1" });
    assert.equal(entry.stage, null);
  });

  test("her çağrı benzersiz id üretir", () => {
    const e1 = createCriterionEvidence({ type: "photo", criterionId: "risk-1" });
    const e2 = createCriterionEvidence({ type: "photo", criterionId: "risk-1" });
    assert.notEqual(e1.id, e2.id);
  });
});

describe("addCriterionEvidence / removeCriterionEvidence — aynı kanıtı gereksiz kopyalamama", () => {
  test("ekleme mevcut diziyi bozmadan yeni bir dizi döner (immutable)", () => {
    const original = [{ id: "e1" }];
    const updated = addCriterionEvidence(original, { id: "e2" });
    assert.equal(original.length, 1, "orijinal dizi değişmemeli");
    assert.equal(updated.length, 2);
  });

  test("boş/undefined diziye ekleme çökmez", () => {
    assert.equal(addCriterionEvidence(undefined, { id: "e1" }).length, 1);
    assert.equal(addCriterionEvidence([], { id: "e1" }).length, 1);
  });

  test("silme yalnızca eşleşen id'yi çıkarır, diğerlerini KOPYALAMADAN korur", () => {
    const original = [{ id: "e1", type: "photo" }, { id: "e2", type: "note" }];
    const updated = removeCriterionEvidence(original, "e1");
    assert.equal(updated.length, 1);
    assert.equal(updated[0], original[1], "kalan kayıt aynı referans, gereksiz kopya oluşturulmamış");
  });
});

describe("computeEvidenceStatus — merkezi kanıt durumu (Kanıt Yok / Eksik / Mevcut)", () => {
  test("hiç kanıt yoksa 'none' (Kanıt Yok) döner", () => {
    assert.equal(computeEvidenceStatus([], { result: "uygun_degil" }), "none");
    assert.equal(computeEvidenceStatus(undefined, { result: "uygun" }), "none");
  });

  test("kanıt var ama kriter henüz değerlendirilmemişse 'incomplete' (Eksik) döner", () => {
    const evidence = [{ id: "e1" }];
    assert.equal(computeEvidenceStatus(evidence, { result: "degerlendirilmedi" }), "incomplete");
  });

  test("kanıt var ve kriter değerlendirilmişse (sonuç ne olursa olsun) 'present' (Mevcut) döner", () => {
    const evidence = [{ id: "e1" }];
    ["uygun", "kismen_uygun", "uygun_degil", "kanit_yok"].forEach((result) => {
      assert.equal(computeEvidenceStatus(evidence, { result }), "present", `${result} için 'present' beklenir`);
    });
  });

  test("KRİTİK: 'Kanıt Yok' durumu checklistItem.result'ı hiçbir şekilde değiştirmez/döndürmez — yalnızca kanıt durumu string'i döner", () => {
    const checklistItem = { result: "uygun" };
    const status = computeEvidenceStatus([], checklistItem);
    assert.equal(status, "none");
    assert.equal(checklistItem.result, "uygun", "orijinal result asla 'uygun_degil'e dönüştürülmemeli");
  });

  test("KRİTİK: 'Kanıt Yok' + 'uygun' sonuçlu bir kriter 'uygun_degil'e dönüşmez", () => {
    const checklistItem = { result: "uygun" };
    computeEvidenceStatus([], checklistItem);
    assert.notEqual(checklistItem.result, "uygun_degil");
  });
});

describe("getEvidenceStatusMeta", () => {
  test("her durum için Türkçe etiket ve ton döner", () => {
    assert.equal(getEvidenceStatusMeta("none").label, "Kanıt Yok");
    assert.equal(getEvidenceStatusMeta("incomplete").label, "Eksik");
    assert.equal(getEvidenceStatusMeta("present").label, "Mevcut");
  });
});
