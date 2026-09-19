// =============================================================================
// NÖBETÇİ — Supabase dataProvider TASLAĞI (henüz devreye alınmamıştır)
// =============================================================================
// ⚠️  BU DOSYA `src/` DIŞINDADIR VE HİÇBİR YERDEN IMPORT EDİLMEZ — bilerek.
//     Vite'ın build/dev sunucusu yalnızca `index.html` → `main.jsx`'ten başlayan
//     import zincirini tarar; bu dosya o zincirde OLMADIĞI için build'e hiçbir
//     etkisi yoktur, `@supabase/supabase-js` paketi kurulu OLMASA BİLE bu dosya
//     projede durabilir ve build'i BOZMAZ. Devreye alınacağı gün:
//       1. `npm install @supabase/supabase-js` (kullanıcı onayıyla, yeni bağımlılık)
//       2. Bu dosya `src/services/supabaseDataProvider.js` olarak kopyalanır
//       3. `src/services/dataProvider.js`'in EN ALTINDAKİ tek satır değişir:
//            export const dataProvider = supabaseDataProvider;
//          (bkz. o dosyadaki "🔧 Backend geçiş noktası" yorumu — bu TEK NOKTA
//          değişikliği, dataProvider.js'in tasarım amacının ta kendisidir.)
//       4. HİÇBİR domain servisi (companyService.js, riskService.js, vb.),
//          HİÇBİR React bileşeni DEĞİŞMEZ — hepsi zaten yalnızca `dataProvider`
//          arayüzünü (getAll/getById/upsert/remove) çağırıyor.
//
// Bu dosya indexedDbProvider (src/services/dataProvider.js) ile TAM OLARAK AYNI
// arayüzü uygular — imza, dönüş tipi, hata davranışı bire bir eşleşir. Bu, bir
// TASARIM KISITIdır: dataProvider.js'in sözleşmesini bozan hiçbir şey buraya
// eklenmemelidir (örn. Supabase'e özel bir üçüncü parametre eklemek gibi).
//
// Şema ve RLS için bkz. supabase-schema-draft.sql / supabase-rls-policies-draft.sql
// (aynı klasör). Bu üç dosya BİRLİKTE bir bütündür.
// =============================================================================

import { createClient } from "@supabase/supabase-js";

// Gerçek değerler .env üzerinden gelir (Vite: import.meta.env.VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY) — burada asla hardcode edilmez. anon key, RLS
// politikaları sayesinde güvenle client'a gömülebilir (RLS olmadan GÖMÜLEMEZ —
// bkz. supabase-rls-policies-draft.sql, bu yüzden şema+RLS önce gelir).
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// -----------------------------------------------------------------------------
// "collection" (IndexedDB store adı) → Postgres tablo adı eşlemesi.
// Bugünkü camelCase koleksiyon adları (bkz. services/db.js → STORES) ile
// şema taslağındaki snake_case tablo adları BİREBİR AYNI DEĞİL (Postgres
// kuralı gereği snake_case tercih edildi, bkz. supabase-schema-draft.sql). Bu
// eşleme, domain servislerinin ("fineKinney", "periodicChecks" gibi mevcut
// adları) HİÇ DEĞİŞMEDEN çalışmaya devam etmesini sağlar.
// -----------------------------------------------------------------------------
const TABLE_NAME_MAP = {
  companies: "companies",
  branches: "branches",
  departments: "departments",
  employees: "employees",
  fineKinney: "risks",
  periodicChecks: "periodic_inspections",
  riskDetections: "risk_detections",
  notifications: "notifications",
  auditLog: "audits",
  systemNotifications: "system_notifications",
  trainingCompletions: "training_completions",
  trainingProgress: "training_progress",
  trainingCourseSettings: "training_course_settings",
  equipment: "equipment",
  documents: "documents",
  risks: "risks",
};

function resolveTableName(collection) {
  const table = TABLE_NAME_MAP[collection];
  if (!table) {
    throw new Error(
      `supabaseDataProvider: "${collection}" koleksiyonu için tablo eşlemesi tanımlı değil ` +
        `(bkz. TABLE_NAME_MAP). Devreye almadan önce supabase-schema-draft.sql ile karşılaştırıp tamamlayın.`
    );
  }
  return table;
}

/**
 * indexedDbProvider (src/services/dataProvider.js) ile AYNI arayüz.
 * @type {import("../../../src/services/dataProvider.js").DataProvider}
 */
export const supabaseDataProvider = {
  async getAll(collection, filter) {
    const table = resolveTableName(collection);
    let query = supabase.from(table).select("*");
    if (filter) {
      // dataProvider.js sözleşmesi: filter = düz obje, TÜM alanlar exact-match AND.
      // NOT: bugünkü IndexedDB tarafı camelCase alan adları kullanıyor (örn.
      // "companyId"); Postgres tarafı snake_case ("company_id"). Gerçek devreye
      // almada bu eşleme de netleştirilmeli (örn. küçük bir key-dönüştürücü) —
      // burada BİLEREK basit/naif bırakıldı, taslak amaçlı.
      for (const [key, value] of Object.entries(filter)) {
        query = query.eq(key, value);
      }
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(collection, id) {
    const table = resolveTableName(collection);
    const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async upsert(collection, record) {
    const table = resolveTableName(collection);
    // indexedDbProvider record.id'yi her zaman ensureId() ile dolduruyordu (bkz.
    // src/utils/id.js) — Postgres tarafında id kolonu `default gen_random_uuid()`
    // olduğu için, id verilmemişse DB kendisi üretir. Burada da tutarlılık için
    // id istemci tarafında üretilip gönderiliyor (aynı utils/id.js kullanılarak),
    // ki dönen kayıt indexedDbProvider ile davranışça birebir eşleşsin.
    const { data, error } = await supabase.from(table).upsert(record).select().single();
    if (error) throw error;
    return data;
  },

  async remove(collection, id) {
    const table = resolveTableName(collection);
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
  },
};

// =============================================================================
// ÇÖZÜLDÜ (bkz. "Sonraki Öneriler" takibi): documents/riskDetections/
// systemNotifications/trainingCourseSettings artık DATABASE_PLAN.md'de
// modellendi ve yukarıdaki TABLE_NAME_MAP + şema/RLS taslaklarına eklendi.
// Bu vesileyle bir de gerçek kod hatası düzeltildi: notifications tablosunun
// sütunları önceden `Notification` tipiyle (types/index.js) UYUŞMUYORDU —
// generic title/message/status(unread/read) alanları aslında
// `SystemNotification`'ın şekliydi. Artık notifications = olay kaydı
// (desc/status pending-ai_analyzed-approved/worker/aiAnalysis/expertNote),
// system_notifications = UI bildirim zili (title/message/read) — ikisi ayrı
// doğru sütun setleriyle şemada.
//
// Kalan tek gerçek açık soru: Supabase Storage bucket politikaları (bkz.
// supabase-rls-policies-draft.sql'in sonundaki not, madde 3) — bu taslak
// yalnızca Postgres tablolarını kapsar, dosya depolama RLS'i ayrıdır.
// =============================================================================
