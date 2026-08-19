-- =============================================================================
-- NÖBETÇİ — Supabase (Postgres) Şema Taslağı
-- =============================================================================
-- ⚠️  BU DOSYA YALNIZCA BİR TASLAKTIR. Hiçbir Supabase projesine karşı
--     ÇALIŞTIRILMAMIŞTIR ve otomatik olarak çalıştırılmamalıdır.
--
-- Kaynak: docs/DATABASE_PLAN.md (kavramsal tablo/ilişki planı — bu dosya onun
-- birebir SQL karşılığıdır, yeni bir tasarım kararı İÇERMEZ). Her tablonun
-- üstünde, hangi mevcut IndexedDB koleksiyonunun (services/db.js → STORES)
-- karşılığı olduğu belirtilir — bu, veri taşıma (migration) script'i yazılırken
-- referans noktası olması içindir.
--
-- Bu dosya uygulanmaya karar verildiğinde:
--   1. RLS politikaları AYRI dosyada tutulur (bkz. supabase-rls-policies-draft.sql)
--      — şema ile politika birbirinden bağımsız gözden geçirilebilsin diye.
--   2. `auth.users` Supabase'in kendi tablosudur, burada YENİDEN OLUŞTURULMAZ;
--      `public.users` ona 1:1 genişleme (profil) tablosu olarak eklenir.
--   3. Kimlik üretimi: uygulama zaten `utils/id.js` ile UUID v4 üretiyor (bkz.
--      Sprint: Veri Mimarisi) — bu yüzden burada da `uuid` birincil anahtar
--      tercih edildi, `gen_random_uuid()` yalnızca DB-taraflı ekler için varsayılan.
--   4. DEVELOPMENT_RULES.md → "Architecture": bu planın UYGULANMASI (gerçek bir
--      Supabase projesinde çalıştırılması) ayrı, açık bir kullanıcı onayı
--      gerektirir. Bu dosyanın var olması, onayın verildiği anlamına gelmez.
-- =============================================================================

-- Postgres'in UUID üretim fonksiyonu için (Supabase projelerinde varsayılan
-- olarak zaten etkindir, bu satır yalnızca eksikse diye eklenmiştir).
create extension if not exists pgcrypto;

-- =============================================================================
-- KATEGORİ 2'den ÖNE ALINDI — Companies
-- =============================================================================
-- SQL bağımlılık sırası gereği (user_roles bu tabloya referans verir) Companies
-- burada tanımlanır; kavramsal kategorisi hâlâ "Kategori 2 — Organizasyon"dur
-- (bkz. DATABASE_PLAN.md). Karşılığı: IndexedDB "companies" store'u.
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_number text,
  sector text,
  risk_class text check (risk_class in ('az_tehlikeli', 'tehlikeli', 'cok_tehlikeli')),
  address text,
  phone text,
  email text,
  employee_count integer,
  logo_url text,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- KATEGORİ 1 — Kimlik, Rol ve Erişim
-- =============================================================================

-- Supabase Auth (auth.users) ile bire-bir genişleme. Karşılığı yok (mevcut
-- uygulamada gerçek kullanıcı hesabı kavramı henüz yok — mock-role sistemi).
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  title text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

-- Sabit/referans veri — uygulama kodunda constants/allRoles.js'nin karşılığı.
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- örn. 'employer', 'expert', 'employee' (bkz. constants/allRoles.js)
  display_name text not null,
  description text
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- örn. 'risk.create', 'risk.approve', 'company.manage'
  display_name text not null,
  module text -- örn. 'risk-analysis', 'company', 'training'
);

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Kullanıcının bir rolü HER ZAMAN firma bazlıdır (OSGB senaryosu — bkz.
-- DATABASE_PLAN.md → "İlişki Özeti"). Çok-kiracılı izolasyonun temel taşı: bir
-- kullanıcının hangi firma(lar)a erişebildiği BURADAN belirlenir.
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (user_id, company_id, role_id)
);

-- =============================================================================
-- KATEGORİ 2 — Organizasyon
-- =============================================================================
-- (Companies bu dosyada yukarıda, Kategori 1'den önce tanımlandı — bkz. o notdaki
-- SQL bağımlılık sırası açıklaması.)

-- Karşılığı: IndexedDB "branches" store'u.
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  address text,
  responsible_name text,
  created_at timestamptz not null default now()
);

-- Karşılığı: IndexedDB "departments" store'u.
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  is_custom boolean not null default true, -- varsayılan setten mi, kullanıcı mı ekledi (bkz. ensureDefaultDepartments)
  created_at timestamptz not null default now(),
  unique (company_id, name) -- BUG FIX'in (aynı isimde departman tekrarı) DB seviyesinde garantisi
);

-- Karşılığı: IndexedDB "employees" store'u.
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete set null,
  department_id uuid references public.departments (id) on delete set null,
  user_id uuid references public.users (id) on delete set null, -- isteğe bağlı, bire-bir
  full_name text not null,
  employee_number text,
  title text,
  phone text,
  email text,
  hire_date date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);
create index employees_company_id_idx on public.employees (company_id);

-- =============================================================================
-- KATEGORİ 3 — Risk Yönetimi
-- =============================================================================

-- Karşılığı: IndexedDB "fineKinney" store'u.
create table public.risks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete set null,
  department_id uuid references public.departments (id) on delete set null,
  created_by uuid references public.users (id) on delete set null,
  hazard text not null,
  risk_description text not null,
  affected text,
  probability smallint not null check (probability between 1 and 10),
  frequency smallint not null check (frequency between 1 and 10),
  severity smallint not null check (severity between 1 and 10),
  score numeric generated always as (probability * frequency * severity) stored,
  action text,
  responsible text,
  due_date date,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  completion_percent smallint not null default 0 check (completion_percent between 0 and 100),
  residual_probability smallint check (residual_probability between 1 and 10),
  residual_frequency smallint check (residual_frequency between 1 and 10),
  residual_severity smallint check (residual_severity between 1 and 10),
  entry_date date not null default current_date, -- bkz. utils/dateUtils.js → todayLabel/todayISO tutarlılığı
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index risks_company_id_idx on public.risks (company_id);
create index risks_status_idx on public.risks (company_id, status);

-- Karşılığı: bugün risks.attachments (gömülü dizi) — ayrı tabloya çıkarılır.
-- Planlanan Vision AI (bkz. AI_ROADMAP.md) bu tabloyu girdi olarak kullanacak.
create table public.risk_attachments (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid not null references public.risks (id) on delete cascade,
  uploaded_by uuid references public.users (id) on delete set null,
  file_name text not null,
  file_type text,
  storage_path text not null, -- Supabase Storage yolu; bugünkü mock "sadece dosya adı" alanının karşılığı DEĞİL
  created_at timestamptz not null default now()
);
create index risk_attachments_risk_id_idx on public.risk_attachments (risk_id);

-- Karşılığı: bugün risks.correctiveActions (gömülü dizi) — ayrı tabloya çıkarılır.
create table public.corrective_actions (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid not null references public.risks (id) on delete cascade,
  responsible_employee_id uuid references public.employees (id) on delete set null,
  title text not null,
  description text,
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  completion_percent smallint not null default 0 check (completion_percent between 0 and 100),
  created_at timestamptz not null default now()
);
create index corrective_actions_risk_id_idx on public.corrective_actions (risk_id);

-- Karşılığı: bugün risks.history (gömülü dizi) — ayrı tabloya çıkarılır.
-- BİLİNÇLİ OLARAK audits'ten AYRI (bkz. DATABASE_PLAN.md → "İlişki Özeti").
create table public.risk_history (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid not null references public.risks (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  event text not null, -- bkz. constants/fineKinney.js → HISTORY_EVENT_LABELS anahtarları
  detail text,
  created_at timestamptz not null default now()
);
create index risk_history_risk_id_idx on public.risk_history (risk_id);

-- Karşılığı: IndexedDB "riskDetections" store'u — Risks'ten BİLİNÇLİ OLARAK
-- AYRI, ham/doğrulanmamış tespit havuzu (bkz. DATABASE_PLAN.md → RiskDetections
-- ve types/index.js → RiskDetection). Aynı kategori+konum tekrar tespit
-- edilirse yeni satır AÇILMAZ, occurrence_count artırılır (biriktirme).
create table public.risk_detections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  department_id uuid references public.departments (id) on delete set null,
  converted_risk_id uuid references public.risks (id) on delete set null, -- yalnızca status='converted' ise dolu
  category text not null,
  location text not null,
  source text not null default 'manual' check (source in ('manual', 'simulated', 'photo')),
  detected_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  occurrence_count integer not null default 1,
  status text not null default 'new' check (status in ('new', 'reviewing', 'converted', 'dismissed')),
  dismiss_reason text,
  hazard_note text, -- yalnızca source='photo' ise anlamlı (AI'nin fotoğrafta gördüğü)
  photo_storage_path text -- Supabase Storage yolu; bugünkü mock'taki ham base64 data URL'in YERİNİ ALIR (bkz. DATABASE_PLAN.md notu — base64'ü satırda tutmak önerilmez)
);
create index risk_detections_company_id_idx on public.risk_detections (company_id);

-- =============================================================================
-- KATEGORİ 4 — Bilgi ve İletişim
-- =============================================================================

-- Karşılığı: bugün constants/knowledgeCenter.js (statik mock dizi) — gerçek
-- RAG kurulmadan bu tablo BOŞ/kullanılmıyor olabilir; şema hazırlığı yalnızca
-- yapıyı belgelemek içindir (bkz. types/index.js → KnowledgeDocument).
create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete cascade, -- NULL = genel/mevzuat (tüm firmalara açık)
  title text not null,
  summary text,
  content text, -- RAG embedding'inin kaynağı olacak (bkz. DATABASE_PLAN.md)
  category text not null,
  document_type text not null,
  tags text[] not null default '{}',
  storage_path text,
  updated_at timestamptz not null default now()
);
create index knowledge_documents_company_id_idx on public.knowledge_documents (company_id);

-- Karşılığı: IndexedDB "documents" store'u — AI destekli belge oluşturma
-- modülünün ÜRETTİĞİ taslak/tamamlanmış belgeler. knowledge_documents'tan
-- BİLİNÇLİ OLARAK AYRI (bkz. DATABASE_PLAN.md → Documents): biri OKUNAN
-- referans kütüphanesi, bu ise kullanıcının ÜRETTİĞİ belge kaydıdır.
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  created_by uuid references public.users (id) on delete set null,
  document_type text not null, -- bkz. constants/documentTypes.js
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'completed')),
  content text, -- bugün mock/placeholder; gerçek AI üretimi Phase 4/5 kapsamında
  created_at timestamptz not null default now()
);
create index documents_company_id_idx on public.documents (company_id);

-- Karşılığı: IndexedDB "notifications" store'u — ramak kala/tehlike/iş kazası
-- OLAY KAYITLARI (iş akışı verisi). system_notifications'tan (aşağıda)
-- BİLİNÇLİ OLARAK AYRI (bkz. DATABASE_PLAN.md → Notifications/SystemNotifications).
-- Sütunlar types/index.js → Notification şeklini birebir izler.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  type text not null check (type in ('ramak_kala', 'tehlike', 'kaza')),
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'ai_analyzed', 'approved')),
  reported_by_employee_id uuid references public.employees (id) on delete set null,
  incident_date date not null default current_date,
  ai_analysis text,
  expert_note text,
  created_at timestamptz not null default now()
);
create index notifications_company_id_idx on public.notifications (company_id);

-- Karşılığı: IndexedDB "systemNotifications" store'u — Header'daki Bildirim
-- Merkezi'nin (zil ikonu) UI uyarı akışı. Yukarıdaki notifications'tan BİLİNÇLİ
-- OLARAK AYRI. Sütunlar types/index.js → SystemNotification şeklini izler.
create table public.system_notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  type text not null check (type in ('riskCreated', 'criticalRisk', 'trainingDue', 'periodicCheckDue', 'employeeAdded')),
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index system_notifications_company_id_idx on public.system_notifications (company_id);

-- Karşılığı: IndexedDB "auditLog" store'u — sistem geneli TEKNİK denetim kaydı.
-- BİLİNÇLİ OLARAK risk_history'den AYRI (bkz. yukarı).
create table public.audits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  action text not null,
  details text,
  entity_type text, -- çok biçimli referans: 'risk' | 'employee' | 'company' | ... (bkz. auditService.js)
  entity_id uuid,
  created_at timestamptz not null default now()
);
create index audits_company_id_idx on public.audits (company_id);

-- =============================================================================
-- KATEGORİ 5 — Operasyonel Takip
-- =============================================================================

-- Kurs TANIMI — bugün constants/trainingCourses.js'te statik sabit; "kurs
-- oluşturma" arayüzü yok. Şema hazırlığı, ileride dinamik kurs eklenirse diye.
create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete cascade, -- NULL = tüm firmalara açık standart kurs
  course_key text not null, -- bugünkü constants/trainingCourses.js → TRAINING_COURSES[].id ile eşleşir
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Karşılığı: IndexedDB "trainingCompletions" store'u (sınav sonucu).
create table public.training_completions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  training_id uuid references public.trainings (id) on delete set null,
  course_key text not null,
  employee_id uuid references public.employees (id) on delete set null,
  video_completed boolean not null default false,
  quiz_score smallint,
  passed boolean,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index training_completions_company_id_idx on public.training_completions (company_id);

-- Karşılığı: IndexedDB "trainingProgress" store'u (video izleme ilerlemesi,
-- "kaldığı yerden devam et" için). Her (kurs, personel) çifti için tek kayıt.
create table public.training_progress (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  course_key text not null,
  employee_id uuid references public.employees (id) on delete set null,
  watched_seconds integer not null default 0,
  video_duration_seconds integer,
  updated_at timestamptz not null default now(),
  unique (company_id, course_key, employee_id)
);

-- Karşılığı: IndexedDB "trainingCourseSettings" store'u — kurs bazlı (kişiye
-- özel DEĞİL, firma çapında) son tarih ayarı (bkz. DATABASE_PLAN.md →
-- TrainingCourseSettings). Aynı firma aynı kurs için birden fazla son tarih
-- tutamaz (unique kısıtı).
create table public.training_course_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  course_key text not null,
  due_date date,
  unique (company_id, course_key)
);

-- Karşılığı: IndexedDB "equipment" store'u.
create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete set null,
  name text not null,
  qr_code text,
  equipment_type text,
  last_check_date date,
  created_at timestamptz not null default now()
);
create index equipment_company_id_idx on public.equipment (company_id);

-- Karşılığı: IndexedDB "periodicChecks" store'u.
create table public.periodic_inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  equipment_id uuid references public.equipment (id) on delete set null, -- isteğe bağlı: bazı kontroller tesisata ait
  responsible_employee_id uuid references public.employees (id) on delete set null,
  item_name text not null,
  category text not null, -- bkz. constants/periodicCheck.js
  last_check_date date not null,
  interval_days integer not null,
  next_due_date date not null, -- bkz. computeNextDueDate — YEREL tarih hesaplamasıyla üretilmeli (bkz. utils/dateUtils.js notu)
  status text not null default 'ok' check (status in ('ok', 'upcoming', 'overdue')),
  created_at timestamptz not null default now()
);
create index periodic_inspections_company_id_idx on public.periodic_inspections (company_id);

-- =============================================================================
-- KATEGORİ 6 — Yapay Zeka
-- =============================================================================

-- Karşılığı yok (bugün AI çağrıları izlenmiyor) — Sprint: AI Copilot/RAG ile
-- birlikte eklenmesi planlanan denetlenebilirlik tablosu (bkz. AI_ROADMAP.md).
create table public.ai_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  module text not null, -- 'chat' | 'fine_kinney_suggestion' | 'vision' | 'rag'
  request_summary text,
  response_summary text,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default now()
);
create index ai_history_company_id_idx on public.ai_history (company_id);

-- =============================================================================
-- updated_at otomatik güncelleme (yalnızca updated_at kolonu olan tablolar için)
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger risks_set_updated_at
  before update on public.risks
  for each row execute function public.set_updated_at();

create trigger training_progress_set_updated_at
  before update on public.training_progress
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Sıradaki adım: supabase-rls-policies-draft.sql (bu dosyadaki HER tabloda RLS
-- etkinleştirilmeden ve politika tanımlanmadan, Supabase varsayılan olarak
-- tabloyu HERKESE AÇIK bırakır — bu iki dosya birlikte uygulanmalıdır).
-- =============================================================================
