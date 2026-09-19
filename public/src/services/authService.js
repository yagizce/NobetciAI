// authService — MOCK implementation. There is no real backend authentication yet.
//
// Every function below is named and shaped to match what Supabase Auth's client actually
// returns (signUp/signIn/signOut/getSession/onAuthStateChange/resetPasswordForEmail all
// exist on `supabase.auth` with this same rough shape). The goal: when a real backend is
// connected, this file's internals get replaced with real `supabase.auth.*` calls, but
// every component that imports from here (Header, Profile, Login, Register, Dashboards)
// keeps working unchanged — same function names, same return shapes.
//
// ⚠️ SECURITY NOTE: nothing here is actually secure. `signIn`/`signUp` do NOT verify
// credentials against anything — there is no credential store. The "session" is a plain
// object in localStorage that anyone can edit via devtools. This exists purely so the UI
// (login/register forms, role-based redirect) can be wired and demoed end-to-end before
// a real backend exists. Do not treat this as authentication in any real sense.

import { MOCK_USERS } from "../constants/mockUsers.js";
import { createId } from "../utils/id.js";

const SESSION_STORAGE_KEY = "isg-mock-session";
const LEGACY_SESSION_STORAGE_KEY = "nobetci-mock-session";
const listeners = new Set();

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(LEGACY_SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // localStorage unavailable — session just won't persist across reloads
  }
  listeners.forEach((cb) => cb(session ? "SIGNED_IN" : "SIGNED_OUT", session));
}

/**
 * @param {"expert"|"employer"|"employee"} [role] — which mock identity to return.
 *   In a real system this parameter wouldn't exist; the server would already know who's logged in.
 * @returns {Promise<import("../types/index.js").User>}
 */
export async function getCurrentUser(role = "employee") {
  const user = MOCK_USERS[role] || MOCK_USERS.employee;
  // Simulated network delay so loading states can be exercised meaningfully.
  return new Promise((resolve) => setTimeout(() => resolve({ ...user }), 150));
}

/**
 * Supabase-shaped: real `supabase.auth.getSession()` returns `{ data: { session }, error }`.
 * @returns {Promise<{ data: { session: { user: import("../types/index.js").User } | null }, error: null }>}
 */
export async function getSession() {
  return { data: { session: readSession() }, error: null };
}

/**
 * MOCK — accepts any email whose local part matches a known role keyword (e.g. contains
 * "expert"/"employer"), otherwise defaults to "employee". Does NOT verify a password.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ data: { session: object|null }, error: { message: string }|null }>}
 */
export async function signIn({ email }) {
  if (!email) return { data: { session: null }, error: { message: "E-posta gerekli." } };
  const guessedRole = email.includes("expert") ? "expert" : email.includes("employer") ? "employer" : "employee";
  const user = { ...MOCK_USERS[guessedRole], email };
  const session = { user, createdAt: new Date().toISOString() };
  writeSession(session);
  return { data: { session }, error: null };
}

/**
 * MOCK — creates a local session immediately, no verification email actually sent.
 * `emailConfirmed: false` models the "E-posta doğrulama (altyapı)" requirement so the UI
 * can show a "verify your email" state without a real mail service wired up yet.
 * @param {{ email: string, password: string, name: string, companyId?: string }} details
 * @returns {Promise<{ data: { session: object|null }, error: { message: string }|null }>}
 */
export async function signUp({ email, password, name, companyId }) {
  if (!email || !password) return { data: { session: null }, error: { message: "E-posta ve şifre gerekli." } };
  const user = {
    id: createId(),
    name: name || email.split("@")[0],
    email,
    companyId: companyId || null,
    role: "employee",
    subscription: "trial",
    emailConfirmed: false,
  };
  const session = { user, createdAt: new Date().toISOString() };
  writeSession(session);
  return { data: { session }, error: null };
}

/**
 * @returns {Promise<{ error: null }>}
 */
export async function signOut() {
  writeSession(null);
  return { error: null };
}

/**
 * MOCK — always "succeeds" and never sends a real email (no mail service connected yet).
 * @param {string} _email
 * @returns {Promise<{ data: { message: string }, error: null }>}
 */
export async function resetPasswordForEmail(_email) {
  return { data: { message: "Şifre sıfırlama bağlantısı gönderildi (mock — gerçek e-posta gönderilmedi)." }, error: null };
}

/**
 * Supabase-shaped subscription API: `supabase.auth.onAuthStateChange(cb)` returns
 * `{ data: { subscription: { unsubscribe } } }`. Mirrored here so consumers don't change later.
 * @param {(event: "SIGNED_IN"|"SIGNED_OUT", session: object|null) => void} callback
 * @returns {{ data: { subscription: { unsubscribe: () => void } } }}
 */
export function onAuthStateChange(callback) {
  listeners.add(callback);
  return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
}
