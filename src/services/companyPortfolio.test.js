import { test } from "node:test";
import assert from "node:assert/strict";
import { dataProvider } from "./dataProvider.js";
import { MAX_COMPANIES } from "../constants/company.js";
import { saveCompany, setActiveCompany } from "./companyService.js";
import { getExpertOverview } from "./expertDashboardService.js";
import { getFineKinneyEntries, saveFineKinneyEntry } from "./riskService.js";

test("firma sınırı yeni kaydı durdurur, mevcut firmayı güncellemeye izin verir", async (t) => {
  const companies = Array.from({ length: MAX_COMPANIES }, (_, i) => ({ id: `c${i}`, name: `Firma ${i}` }));
  t.mock.method(dataProvider, "getAll", async (store) => store === "companies" ? companies : []);
  const write = t.mock.method(dataProvider, "upsertWithLimit", async (_, record, limit) => { assert.equal(limit, MAX_COMPANIES); return record; });
  await assert.rejects(saveCompany({ id: "new", name: "Yeni" }), /en fazla 30/);
  assert.equal(write.mock.callCount(), 0);
  await saveCompany({ id: "c0", name: "Güncellenmiş" });
  assert.equal(write.mock.callCount(), 1);
});

test("ikinci firma öncesinde eski kayıtlar ilk firmaya taşınır; firma değişimi verileri ayırır", async (t) => {
  const storage = new Map();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } });
  t.after(() => { if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor); else delete globalThis.localStorage; });
  const rows = { companies: [{ id: "a", name: "A" }], fineKinney: [{ id: "old", hazard: "A kaydı", status: "open", probability: 10, frequency: 10, severity: 40 }] };
  t.mock.method(dataProvider, "getAll", async (store, filter) => (rows[store] || []).filter((r) => !filter || Object.entries(filter).every(([k, v]) => r[k] === v)));
  t.mock.method(dataProvider, "getById", async (store, id) => (rows[store] || []).find((r) => r.id === id));
  const put = async (store, record) => { const list = rows[store] ||= []; const i = list.findIndex((r) => r.id === record.id); if (i < 0) list.push(record); else list[i] = record; return record; };
  t.mock.method(dataProvider, "upsert", put);
  t.mock.method(dataProvider, "upsertWithLimit", put);
  await saveCompany({ id: "b", name: "B" });
  assert.equal(rows.fineKinney[0].companyId, "a");
  await setActiveCompany("b");
  assert.deepEqual(await getFineKinneyEntries(), []);
  assert.equal((await getExpertOverview()).priorityRisks.length, 0);
  await assert.rejects(saveFineKinneyEntry({ id: "old", companyId: "b", hazard: "Ezme" }), /başka bir firmaya/);
  await setActiveCompany("a");
  assert.equal((await getFineKinneyEntries()).length, 1);
  assert.equal((await getExpertOverview()).priorityRisks.length, 1);
});
