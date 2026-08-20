// dataProvider — THE single abstraction boundary between the app's domain services
// (companyService, employeeService, fineKinney, vb.) and however data is actually stored.
//
// Today: backed by IndexedDB (services/db.js) — everything is local to one browser.
// Later: a `supabaseDataProvider.js` implementing this exact same interface can be dropped
// in, and ONLY the `ACTIVE_PROVIDER` line at the bottom of this file changes. No domain
// service, no React component, no page needs to change — that is the whole point of this
// file existing.
//
// Interface (intentionally Supabase-shaped — its client has near-identical async methods):
//   getAll(collection, filter?)   -> Promise<Array<Record>>   filter: plain object, exact-match AND
//   getById(collection, id)       -> Promise<Record|null>
//   upsert(collection, record)    -> Promise<Record>          insert if new id, replace if existing
//   remove(collection, id)        -> Promise<void>
//
// "collection" today maps 1:1 to an IndexedDB object store name (see services/db.js STORES).
// With Supabase it would map 1:1 to a Postgres table name — no renaming needed since the
// domain services already use plain, database-friendly names ("companies", "employees", ...).

import { loadAllData, saveData, deleteData } from "./db.js";
import { ensureId } from "../utils/id.js";

function matchesFilter(record, filter) {
  if (!filter) return true;
  return Object.entries(filter).every(([key, value]) => record[key] === value);
}

const indexedDbProvider = {
  async getAll(collection, filter) {
    const all = await loadAllData(collection);
    return filter ? all.filter((record) => matchesFilter(record, filter)) : all;
  },

  async getById(collection, id) {
    const all = await loadAllData(collection);
    return all.find((record) => record.id === id) || null;
  },

  async upsert(collection, record) {
    const normalized = { ...record, id: ensureId(record) };
    await saveData(collection, normalized);
    return normalized;
  },

  async remove(collection, id) {
    await deleteData(collection, id);
  },
};

// 🔧 Backend geçiş noktası: Supabase eklendiğinde bu satır
//     `export const dataProvider = supabaseDataProvider;` olarak değişecek — başka HİÇBİR
//     dosyanın değişmesi gerekmeyecek.
export const dataProvider = indexedDbProvider;
