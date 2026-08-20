-- =============================================================================
-- NÖBETÇİ — Supabase RLS (Row Level Security) Politika Taslağı
-- =============================================================================
-- ⚠️  BU DOSYA YALNIZCA BİR TASLAKTIR. supabase-schema-draft.sql UYGULANMADAN bu
--     dosyanın hiçbir anlamı yoktur — önce şema, sonra bu dosya, hep BİRLİKTE
--     uygulanmalıdır. İkisi de gerçek bir Supabase projesine karşı
--     ÇALIŞTIRILMAMIŞTIR.
--
-- Neden bu ayrı dosyada: DEVELOPMENT_RULES.md → "Architecture" ilkesi gereği
-- (mock veri yapısını gerçek sistemlere kolay taşınabilecek şekilde tasarla),
-- RLS politikaları uygulamanın ZATEN yaptığı client-side izolasyonun
-- (createCrudService.js → companyScoped, bkz. o dosya) SUNUCU TARAFI karşılığıdır.
-- Client-side kontrol asla gerçek güvenlik değildir — tarayıcı konsolundan
-- atlanabilir; gerçek izolasyon yalnızca burada, veritabanı seviyesinde sağlanır.
--
-- Strateji: her kullanıcının HANGİ firma(lar)a erişebildiği `user_roles`
-- tablosundan (auth.uid() üzerinden) okunur. Bu, tek bir `helper` fonksiyonla
-- (aşağıda) her tabloda TEKRAR TEKRAR yazılmaz — DEVELOPMENT_RULES.md → "Kod
-- tekrarını azalt" ilkesiyle tutarlı.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: auth.uid()'nin erişebildiği firma id'lerinin kümesi.
-- SECURITY DEFINER + STABLE: RLS politikaları içinde performanslı şekilde
-- tekrar tekrar çağrılabilir (Postgres planlayıcısı STABLE fonksiyonları
-- sorgu başına bir kez değerlendirebilir).
-- -----------------------------------------------------------------------------
create or replace function public.user_company_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.user_roles where user_id = auth.uid();
$$;

-- Belirli bir yetkiye (permission key) sahip mi? — ince taneli yetki kontrolü
-- için (bkz. DATABASE_PLAN.md → Permissions/RolePermissions). Bugün uygulama
-- yalnızca rol bazlı kontrol yapıyor (permissions.js); bu fonksiyon, ileride
-- "risk.approve" gibi ince taneli izinlere geçilirse hazır olsun diye eklendi,
-- BUGÜN HİÇBİR POLİTİKADA KULLANILMIYOR (yalnızca rol bazlı politikalar aşağıda).
create or replace function public.user_has_permission(target_company_id uuid, permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and ur.company_id = target_company_id
      and p.key = permission_key
  );
$$;

-- =============================================================================
-- RLS'i ETKİNLEŞTİR — tanımlı bir politika olmadan RLS açık bir tablo,
-- varsayılan olarak TÜM erişimi REDDEDER (Postgres'in "deny by default" ilkesi).
-- Bu satırlar unutulursa (Supabase'de tablo RLS kapalıyken) tablo HERKESE
-- (anon dahil) tamamen açık kalır — bu yüzden şema dosyasından BİLEREK ayrı
-- tutuldu, gözden kaçmasın diye tek bir listede toplandı.
-- =============================================================================
alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.companies enable row level security;
alter table public.branches enable row level security;
alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.risks enable row level security;
alter table public.risk_attachments enable row level security;
alter table public.corrective_actions enable row level security;
alter table public.risk_history enable row level security;
alter table public.risk_detections enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.system_notifications enable row level security;
alter table public.audits enable row level security;
alter table public.trainings enable row level security;
alter table public.training_completions enable row level security;
alter table public.training_progress enable row level security;
alter table public.training_course_settings enable row level security;
alter table public.equipment enable row level security;
alter table public.periodic_inspections enable row level security;
alter table public.ai_history enable row level security;

-- =============================================================================
-- users — bir kullanıcı yalnızca KENDİ profilini görebilir/güncelleyebilir.
-- (Aynı firmadaki diğer kullanıcıları görmek employees/user_roles üzerinden
-- dolaylı olur, users tablosunun kendisi kişisel profil verisidir.)
-- =============================================================================
create policy users_select_own on public.users
  for select using (id = auth.uid());
create policy users_update_own on public.users
  for update using (id = auth.uid());
-- INSERT: Supabase Auth trigger'ı (auth.users → public.users) tarafından
-- yapılması önerilir, bu yüzden burada ayrı bir insert politikası TANIMLANMADI.

-- =============================================================================
-- roles / permissions / role_permissions — sabit/referans veri.
-- Herkes (giriş yapmış herkes) OKUYABİLİR, YAZAMAZ (yalnızca migration/admin
-- panelinden, service_role anahtarıyla değişir — RLS bunu zaten atlar).
-- =============================================================================
create policy roles_select_authenticated on public.roles
  for select using (auth.role() = 'authenticated');
create policy permissions_select_authenticated on public.permissions
  for select using (auth.role() = 'authenticated');
create policy role_permissions_select_authenticated on public.role_permissions
  for select using (auth.role() = 'authenticated');

-- =============================================================================
-- user_roles — bir kullanıcı yalnızca KENDİ firma-rol atamalarını görebilir.
-- Yazma (kimin hangi firmada hangi rolde olduğunu değiştirme) BİLEREK buraya
-- açık bırakılmadı — bu, "firma yöneticisi kullanıcı ekler/çıkarır" akışı
-- kurulduğunda ayrı bir INSERT/DELETE politikasıyla (yalnızca o firmada zaten
-- 'employer'/'admin' rolü olanlar için) eklenmelidir. Bugün TASLAK aşamasında
-- kasıtlı olarak yalnızca okuma var — DEVELOPMENT_RULES.md → "emin olmadığın
-- konularda varsayım yapma" ilkesi gereği, kimin kullanıcı ekleyebileceği
-- ayrı bir üründe kararı gerektirir.
-- =============================================================================
create policy user_roles_select_own on public.user_roles
  for select using (user_id = auth.uid());

-- =============================================================================
-- companies — yalnızca erişebildiğin firma(lar)ı görebilirsin. Yeni firma
-- oluşturma (INSERT) BİLEREK açık bırakılmadı — "firma kaydı" akışı kurulunca
-- (örn. bir Edge Function ile: firma oluştur + oluşturan kullanıcıya otomatik
-- 'employer' rolü ata, TEK transaction'da) ayrıca eklenmelidir; aksi halde
-- herkes sınırsız firma oluşturabilir ve kendine rol atayamadığı "sahipsiz"
-- firmalar birikir.
-- =============================================================================
create policy companies_select_member on public.companies
  for select using (id in (select public.user_company_ids()));
create policy companies_update_member on public.companies
  for update using (id in (select public.user_company_ids()));

-- =============================================================================
-- Aşağıdaki TÜM tablolar için ORTAK KALIP: company_id, user_company_ids()
-- kümesinde mi? SELECT/INSERT/UPDATE/DELETE için AYNI kural — bu app'te
-- rol bazlı ince ayrım (örn. yalnızca 'employer' silebilir) BUGÜN client-side
-- RouteGuard/permissions.js'te var ama RLS'e henüz taşınmadı; taşınırsa her
-- politika `and exists (select 1 from user_roles where ... and role_id = ...)`
-- ile daraltılır. Şimdilik "firma üyesiyse tam CRUD" — client-side UI zaten
-- kısıtlıyor, bu politikalar yalnızca ÇAPRAZ FİRMA sızıntısını engelliyor
-- (bu sprintin asıl hedefi, bkz. VERI_MIMARISI_SPRINT_RAPORU.md).
-- =============================================================================

create policy branches_all_member on public.branches
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

create policy departments_all_member on public.departments
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

create policy employees_all_member on public.employees
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

create policy risks_all_member on public.risks
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- risk_attachments / corrective_actions / risk_history: kendi company_id
-- SÜTUNU yok — ana kayıt (risks) üzerinden dolaylı kontrol edilir.
create policy risk_attachments_via_risk on public.risk_attachments
  for all using (risk_id in (select id from public.risks where company_id in (select public.user_company_ids())))
  with check (risk_id in (select id from public.risks where company_id in (select public.user_company_ids())));

create policy corrective_actions_via_risk on public.corrective_actions
  for all using (risk_id in (select id from public.risks where company_id in (select public.user_company_ids())))
  with check (risk_id in (select id from public.risks where company_id in (select public.user_company_ids())));

create policy risk_history_via_risk on public.risk_history
  for all using (risk_id in (select id from public.risks where company_id in (select public.user_company_ids())))
  with check (risk_id in (select id from public.risks where company_id in (select public.user_company_ids())));

create policy risk_detections_all_member on public.risk_detections
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- knowledge_documents — company_id NULL ise (genel/mevzuat doküman) HERKESE
-- (giriş yapmış herkese) açık okuma; company_id doluysa yalnızca o firmanın
-- üyeleri. Yazma yalnızca kendi firmana ait dokümanlar için (genel/mevzuat
-- dokümanları normal kullanıcı ekleyemez, o başka bir yönetim akışıdır).
create policy knowledge_documents_select on public.knowledge_documents
  for select using (
    company_id is null
    or company_id in (select public.user_company_ids())
  );
create policy knowledge_documents_write_own_company on public.knowledge_documents
  for insert with check (company_id in (select public.user_company_ids()));
create policy knowledge_documents_update_own_company on public.knowledge_documents
  for update using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
create policy knowledge_documents_delete_own_company on public.knowledge_documents
  for delete using (company_id in (select public.user_company_ids()));

create policy documents_all_member on public.documents
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

create policy notifications_all_member on public.notifications
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

create policy system_notifications_all_member on public.system_notifications
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- audits — YALNIZCA OKUMA açık (herkes kendi firmasının denetim kaydını
-- görebilir), YAZMA/SİLME politikası BİLEREK tanımlanmadı: denetim kayıtları
-- normal kullanıcı akışından değil, sunucu tarafı (trigger veya
-- service_role ile Edge Function) tarafından oluşturulmalı — aksi halde bir
-- kullanıcı kendi denetim izini silebilir/değiştirebilir, bu denetim
-- kaydının BÜTÜNLÜĞÜNÜ anlamsızlaştırır.
create policy audits_select_member on public.audits
  for select using (company_id in (select public.user_company_ids()));

-- trainings — company_id NULL ise (herkese açık standart kurs) tüm giriş
-- yapmış kullanıcılar okuyabilir; doluysa yalnızca o firmanın üyeleri.
create policy trainings_select on public.trainings
  for select using (
    company_id is null
    or company_id in (select public.user_company_ids())
  );

create policy training_completions_all_member on public.training_completions
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

create policy training_progress_all_member on public.training_progress
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

create policy training_course_settings_all_member on public.training_course_settings
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

create policy equipment_all_member on public.equipment
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

create policy periodic_inspections_all_member on public.periodic_inspections
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- ai_history — company_id NULL olabilir (bkz. şema — kişisel/firma-dışı
-- sohbet). NULL ise yalnızca kendi kaydını gören kullanıcı; doluysa firma
-- üyeliği kontrolü.
create policy ai_history_select on public.ai_history
  for select using (
    (company_id is null and user_id = auth.uid())
    or company_id in (select public.user_company_ids())
  );
create policy ai_history_insert on public.ai_history
  for insert with check (
    (company_id is null and user_id = auth.uid())
    or company_id in (select public.user_company_ids())
  );

-- =============================================================================
-- Uygulanmadan ÖNCE kontrol edilmesi gerekenler (bu taslağın kapsamadığı):
--   1. "Firma oluşturma" akışı (companies INSERT + user_roles ilk kayıt,
--      TEK transaction'da) — Edge Function olarak ayrıca tasarlanmalı.
--   2. Kullanıcı davet/rol atama akışı (user_roles INSERT/DELETE) — kimin
--      kimi ekleyebileceği bir ürün kararı, burada varsayılmadı.
--   3. Storage bucket politikaları (risk_attachments.storage_path,
--      risk_detections.photo_storage_path, knowledge_documents.storage_path,
--      companies.logo_url) — bu dosya yalnızca Postgres tablo RLS'ini kapsar,
--      Supabase Storage RLS AYRI ve ayrı bir taslak gerektirir.
--   4. ÇÖZÜLDÜ: documents/risk_detections/system_notifications/
--      training_course_settings artık DATABASE_PLAN.md'de modellendi ve
--      şema+RLS taslaklarına eklendi (bkz. Sonraki Öneriler takibi).
-- =============================================================================
