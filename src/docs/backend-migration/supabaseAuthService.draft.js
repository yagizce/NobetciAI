// =============================================================================
// NÖBETÇİ — Supabase authService TASLAĞI (henüz devreye alınmamıştır)
// =============================================================================
// ⚠️  BU DOSYA `src/` DIŞINDADIR VE HİÇBİR YERDEN IMPORT EDİLMEZ — bilerek, aynı
//     supabaseDataProvider.draft.js gibi. Build'e hiçbir etkisi yoktur.
//
// Bu dosya, src/services/authService.js'teki (bkz. o dosyanın kendi yorumu:
// "Every function below is named and shaped to match what Supabase Auth's
// client actually returns") YEDİ fonksiyonla AYNI İSİM/İMZAYI korur — Header,
// Profile, Login, Register, Dashboard'lar TEK SATIR DEĞİŞMEDEN çalışmaya devam
// eder. Devreye alınacağı gün (supabaseDataProvider.draft.js ile AYNI anda,
// ikisi ayrı ayrı devreye alınmaz — auth olmadan company_id'siz veri sorgusu
// anlamsızdır):
//   1. `npm install @supabase/supabase-js` (zaten dataProvider için de gerekiyor)
//   2. Bu dosya `src/services/authService.js`'in YERİNE geçer (üzerine yazılır
//      veya içeriği kopyalanır — dataProvider'daki gibi "tek satır" değişikliği
//      burada YOK, çünkü mock authService'in kendisi baştan sona mock; gerçek
//      geçişte dosyanın tamamı değişir).
//   3. `.env`'e VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY eklenir (bkz.
//      supabaseDataProvider.draft.js'teki AYNI değişkenler — İKİSİ AYNI client'ı
//      kullanmalı, iki ayrı `createClient` çağrısı YAPILMAMALI).
//
// YENİ fonksiyonlar (mock authService.js'te KARŞILIĞI YOK — davet linki akışı
// için eklendi, bkz. DATABASE_PLAN.md → "CompanyInvites"):
//   - createCompanyInvite(companyId, roleKey, email?)
//   - acceptInvite(token)
// Bu ikisi, davet akışı gerçek backend'e geçilene kadar UI'da HİÇBİR YERDEN
// çağrılmamalıdır (mock ortamda karşılığı yok, çağrılırsa hata verir).
// =============================================================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const listeners = new Set();

// -----------------------------------------------------------------------------
// getCurrentUser — mock sürümde `role` parametresiyle "hangi mock kimliği
// göster" seçiliyordu (bkz. authService.js'teki JSDoc: "In a real system this
// parameter wouldn't exist"). Gerçek sürümde parametre YOK SAYILIR — kim giriş
// yaptıysa o döner, session zaten Supabase'te.
// -----------------------------------------------------------------------------
export async function getCurrentUser() {
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) return null;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();
  if (profileError) throw profileError;
  return profile;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// -----------------------------------------------------------------------------
// signIn — mock sürüm yalnızca { email } alıp şifreyi HİÇ kontrol etmiyordu
// (bkz. authService.js üstündeki güvenlik notu). Gerçek sürüm password da alır
// — bu, ÇAĞIRAN TARAFIN (Login.jsx) da güncellenmesi gerektiği anlamına gelir,
// dataProvider geçişindeki gibi "hiçbir bileşen değişmez" garantisi authService
// için TAM olarak geçerli değildir (imza genişliyor, daralmıyor — eski
// çağrıların hepsi yeni imzayla da UYUMSUZ olur, çünkü password artık zorunlu).
// -----------------------------------------------------------------------------
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

// -----------------------------------------------------------------------------
// signUp — account_type artık ZORUNLU (bkz. supabase-schema-draft.sql →
// public.users.account_type). `options.data` içine konan alanlar
// `auth.users.raw_user_meta_data`'ya yazılır, `handle_new_user()` trigger'ı
// (bkz. şema taslağı) bunları okuyup public.users satırını OTOMATİK oluşturur
// — burada AYRICA bir `.from("users").insert(...)` YAPILMAZ (yapılırsa trigger
// ile çakışıp "duplicate key" hatası verir).
//
// companyId parametresi BİLEREK YOK — mock sürümde vardı ama yeni akışta bir
// kullanıcı ya (a) YENİ bir firma kaydıyla employer olarak başlar (companies
// INSERT akışı, bkz. RLS taslağındaki "kontrol edilmesi gerekenler" #1 —
// HENÜZ YAZILMADI) ya da (b) bir company_invites token'ıyla katılır (aşağıdaki
// acceptInvite). "Kayıt olurken companyId ver" üçüncü, tanımsız bir yol olurdu.
// -----------------------------------------------------------------------------
export async function signUp({ email, password, name, accountType }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, account_type: accountType } },
  });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPasswordForEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  listeners.add(callback);
  return () => {
    subscription.unsubscribe();
    listeners.delete(callback);
  };
}

// -----------------------------------------------------------------------------
// createCompanyInvite — İşveren/Uzman ekranındaki "Yeni Kişi Davet Et" butonu
// bunu çağırır. Dönen `token`, uygulamanın kendisinin bir link haline getirip
// (`${origin}/davet?kod=${token}`) İŞVERENE GÖSTERMESİ gerekir — link'i
// GÖNDERMEK (e-posta/SMS) uygulamanın işi DEĞİL, işveren kopyalayıp kendisi
// paylaşır (bkz. DATABASE_PLAN.md → CompanyInvites → "Nasıl işler", madde 1).
// RLS (company_invites_insert politikası) zaten "yalnızca o firmanın
// employer/expert'i" kuralını sunucu tarafında da zorunlu kılıyor — buradaki
// kontrol yalnızca ERKEN/anlaşılır bir hata mesajı için, GÜVENLİK burada değil.
// -----------------------------------------------------------------------------
export async function createCompanyInvite({ companyId, roleKey, email }) {
  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("key", roleKey)
    .single();
  if (roleError) throw roleError;

  const { data: currentUser } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("company_invites")
    .insert({
      company_id: companyId,
      role_id: role.id,
      email: email || null,
      created_by: currentUser.user.id,
    })
    .select("token, expires_at")
    .single();
  if (error) throw error;
  return data; // { token, expires_at } — link: `${origin}/davet?kod=${data.token}`
}

// -----------------------------------------------------------------------------
// acceptInvite — davet linkine tıklayan kişi ÖNCE normal signUp/signIn ile
// giriş yapar, SONRA (auth.uid() dolu olduğunda) bu çağrılır. Asıl doğrulama
// (token geçerli mi, süresi dolmuş mu, e-posta eşleşiyor mu) ve user_roles
// yazımı `accept_invite()` Postgres fonksiyonunda (bkz. RLS taslağı) TEK
// ATOMIK işlem olarak yapılır — burada sadece o RPC'yi çağırıyoruz.
// -----------------------------------------------------------------------------
export async function acceptInvite(token) {
  const { error } = await supabase.rpc("accept_invite", { invite_token: token });
  if (error) throw error; // ör. "Bu davetin süresi dolmuş, yeni bir davet isteyin."
}
