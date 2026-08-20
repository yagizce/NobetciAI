import { test, describe, beforeEach, before } from "node:test";
import assert from "node:assert/strict";

// authService, tarayıcının gerçek localStorage'ını kullanıyor (globalThis.localStorage? gibi
// opsiyonel değil, doğrudan) — Node'da yerleşik değil. Üretim kodunda DEĞİŞİKLİK yapmadan,
// yalnızca test ortamı için minimal bir in-memory polyfill.
before(() => {
  if (typeof globalThis.localStorage === "undefined") {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  }
});

const authService = await import("./authService.js");

describe("authService (mock — gerçek backend değil)", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  test("başlangıçta oturum yok", async () => {
    const { data } = await authService.getSession();
    assert.equal(data.session, null);
  });

  test("signIn e-posta olmadan hata döner, oturum açmaz", async () => {
    const { data, error } = await authService.signIn({ email: "" });
    assert.equal(data.session, null);
    assert.ok(error?.message);
  });

  test("signIn geçerli e-posta ile oturum açar ve getSession bunu yansıtır", async () => {
    const { data, error } = await authService.signIn({ email: "test@ornek.com" });
    assert.equal(error, null);
    assert.equal(data.session.user.email, "test@ornek.com");

    const session = await authService.getSession();
    assert.equal(session.data.session.user.email, "test@ornek.com");
  });

  test("signIn e-postadaki role ipucuna göre mock kimliği seçer (expert/employer/employee)", async () => {
    const expert = await authService.signIn({ email: "birisi.expert@ornek.com" });
    assert.equal(expert.data.session.user.role, "expert");

    const employer = await authService.signIn({ email: "birisi.employer@ornek.com" });
    assert.equal(employer.data.session.user.role, "employer");

    const employee = await authService.signIn({ email: "sadece.calisan@ornek.com" });
    assert.equal(employee.data.session.user.role, "employee");
  });

  test("signUp e-posta veya şifre eksikse hata döner", async () => {
    const { data, error } = await authService.signUp({ email: "x@x.com", password: "" });
    assert.equal(data.session, null);
    assert.ok(error?.message);
  });

  test("signUp yeni kullanıcı için emailConfirmed: false ile oturum açar", async () => {
    const { data, error } = await authService.signUp({ email: "yeni@ornek.com", password: "sifre123", name: "Yeni Kullanıcı" });
    assert.equal(error, null);
    assert.equal(data.session.user.emailConfirmed, false);
    assert.equal(data.session.user.name, "Yeni Kullanıcı");
    assert.equal(data.session.user.role, "employee");
  });

  test("signUp name verilmezse e-postanın @ öncesini isim olarak kullanır", async () => {
    const { data } = await authService.signUp({ email: "isimsiz@ornek.com", password: "sifre123" });
    assert.equal(data.session.user.name, "isimsiz");
  });

  test("signOut sonrası oturum temizlenir", async () => {
    await authService.signIn({ email: "test@ornek.com" });
    await authService.signOut();
    const { data } = await authService.getSession();
    assert.equal(data.session, null);
  });

  test("onAuthStateChange, signIn/signOut'ta SIGNED_IN/SIGNED_OUT olayları yayınlar", async () => {
    const events = [];
    const { data } = authService.onAuthStateChange((event) => events.push(event));

    await authService.signIn({ email: "test@ornek.com" });
    await authService.signOut();

    assert.deepEqual(events, ["SIGNED_IN", "SIGNED_OUT"]);
    data.subscription.unsubscribe();
  });

  test("onAuthStateChange unsubscribe sonrası artık olay almaz", async () => {
    const events = [];
    const { data } = authService.onAuthStateChange((event) => events.push(event));
    data.subscription.unsubscribe();

    await authService.signIn({ email: "test@ornek.com" });
    assert.deepEqual(events, []);
  });

  test("resetPasswordForEmail her zaman 'başarılı' mock yanıt döner", async () => {
    const { data, error } = await authService.resetPasswordForEmail("kim@ornek.com");
    assert.equal(error, null);
    assert.ok(data.message);
  });

  test("getCurrentUser rol parametresine göre mock kullanıcı döner, varsayılan employee", async () => {
    const expert = await authService.getCurrentUser("expert");
    assert.equal(expert.role, "expert");
    const fallback = await authService.getCurrentUser("bilinmeyen-rol");
    assert.equal(fallback.role, "employee");
  });
});
