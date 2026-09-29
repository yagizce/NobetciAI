import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { collectAttentionItems } from "./attentionItems.js";
import { todayISO, isoDateNDaysFromNow } from "./dateUtils.js";

const TODAY = todayISO();
const YESTERDAY = isoDateNDaysFromNow(-1);
const TOMORROW = isoDateNDaysFromNow(1);
const NEXT_WEEK = isoDateNDaysFromNow(7);

function entry(id, actions) {
  return { id, hazard: `Tehlike ${id}`, correctiveActions: actions };
}

describe("collectAttentionItems", () => {
  test("boş/null girdilerde çökmez, boş dizi döner", () => {
    assert.deepEqual(collectAttentionItems([], []), []);
    assert.deepEqual(collectAttentionItems(null, null), []);
    assert.deepEqual(collectAttentionItems(undefined, undefined), []);
  });

  test("status: 'done' olan düzeltici faaliyetler listeye girmez", () => {
    const entries = [entry("e1", [{ id: "a1", title: "Tamamlanan", status: "done", dueDate: TOMORROW }])];
    assert.deepEqual(collectAttentionItems(entries, []), []);
  });

  test("dueDate olmayan düzeltici faaliyetler listeye girmez", () => {
    const entries = [entry("e1", [{ id: "a1", title: "Tarihsiz", status: "open" }])];
    assert.deepEqual(collectAttentionItems(entries, []), []);
  });

  test("açık ve tarihli bir düzeltici faaliyet doğru alanlarla listelenir", () => {
    const entries = [entry("e1", [{ id: "a1", title: "Bariyer kur", status: "open", dueDate: TOMORROW }])];
    const result = collectAttentionItems(entries, []);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      kind: "action", id: "action-e1-a1", title: "Bariyer kur", context: "Tehlike e1", dueDate: TOMORROW, overdue: false, priority: undefined,
    });
  });

  test("üst risk kaydının önceliği (priority) faaliyet kalemine taşınır — CorrectiveActionsPanel'in yerini alan rozet için", () => {
    const entries = [{ id: "e1", hazard: "Tehlike e1", priority: "urgent", correctiveActions: [{ id: "a1", title: "Bariyer kur", status: "open", dueDate: TOMORROW }] }];
    assert.equal(collectAttentionItems(entries, [])[0].priority, "urgent");
  });

  test("son tarihi geçmiş düzeltici faaliyet overdue: true olarak işaretlenir", () => {
    const entries = [entry("e1", [{ id: "a1", title: "Geciken", status: "open", dueDate: YESTERDAY }])];
    const result = collectAttentionItems(entries, []);
    assert.equal(result[0].overdue, true);
  });

  test("başlıksız faaliyet 'İsimsiz faaliyet' olarak gösterilir", () => {
    const entries = [entry("e1", [{ id: "a1", status: "open", dueDate: TOMORROW }])];
    assert.equal(collectAttentionItems(entries, [])[0].title, "İsimsiz faaliyet");
  });

  test("status: 'upcoming'/'overdue' periyodik kontroller listelenir, diğerleri (ör. 'completed') listelenmez", () => {
    const checks = [
      { id: "c1", itemName: "Yangın Tüpü", status: "upcoming", nextDueDate: TOMORROW },
      { id: "c2", itemName: "Jeneratör", status: "overdue", nextDueDate: YESTERDAY },
      { id: "c3", itemName: "Asansör", status: "completed", nextDueDate: NEXT_WEEK },
    ];
    const result = collectAttentionItems([], checks);
    assert.equal(result.length, 2);
    assert.ok(result.every((r) => r.kind === "check"));
    assert.equal(result.find((r) => r.id === "check-c2").overdue, true);
    assert.equal(result.find((r) => r.id === "check-c1").overdue, false);
  });

  test("faaliyetler ve kontroller birlikte, son tarihe göre ARTAN sırada döner", () => {
    const entries = [entry("e1", [{ id: "a1", title: "Geç faaliyet", status: "open", dueDate: NEXT_WEEK }])];
    const checks = [{ id: "c1", itemName: "Erken kontrol", status: "upcoming", nextDueDate: YESTERDAY }];
    const result = collectAttentionItems(entries, checks);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, "check-c1"); // erken tarih önce
    assert.equal(result[1].id, "action-e1-a1");
  });

  test("bir kaydın birden fazla düzeltici faaliyeti varsa hepsi ayrı ayrı listelenir", () => {
    const entries = [entry("e1", [
      { id: "a1", title: "Faaliyet 1", status: "open", dueDate: TOMORROW },
      { id: "a2", title: "Faaliyet 2", status: "open", dueDate: NEXT_WEEK },
    ])];
    assert.equal(collectAttentionItems(entries, []).length, 2);
  });
});
