import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { toLocalIsoDate, todayISO, isoDateNDaysAgo, isoDateNDaysFromNow, toComparableDate } from "./dateUtils.js";

describe("toLocalIsoDate", () => {
  test("bilinen bir tarihi YYYY-MM-DD olarak doğru döner", () => {
    assert.equal(toLocalIsoDate(new Date(2024, 2, 5)), "2024-03-05"); // ay index 0-tabanlı: 2=Mart
  });

  test("tek haneli ay/gün sıfırla doldurulur", () => {
    assert.equal(toLocalIsoDate(new Date(2024, 0, 9)), "2024-01-09");
  });

  test("RİSK TEMİZLİĞİ: gece yarısına yakın yerel saatte bile YEREL günü döner (UTC'ye kaymaz)", () => {
    // Saat 01:00 yerel zaman, UTC+3 (Türkiye) gibi ileri saat dilimlerinde
    // toISOString() bir önceki günü döndürürdü — toLocalIsoDate bundan etkilenmez
    // çünkü tamamen yerel getFullYear/getMonth/getDate kullanır, saat diliminden
    // BAĞIMSIZDIR (test ortamının saat dilimi ne olursa olsun aynı yerel günü verir).
    const earlyMorning = new Date(2024, 5, 15, 1, 0, 0); // 15 Haziran 2024, 01:00 yerel
    assert.equal(toLocalIsoDate(earlyMorning), "2024-06-15");
  });

  test("günün son anında (23:59) bile doğru günü döner", () => {
    const lateNight = new Date(2024, 5, 15, 23, 59, 59);
    assert.equal(toLocalIsoDate(lateNight), "2024-06-15");
  });
});

describe("todayISO", () => {
  test("YYYY-MM-DD formatında, 10 karakter uzunluğunda bir string döner", () => {
    const result = todayISO();
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  test("toLocalIsoDate(new Date()) ile aynı sonucu verir", () => {
    assert.equal(todayISO(), toLocalIsoDate(new Date()));
  });
});

describe("isoDateNDaysAgo / isoDateNDaysFromNow", () => {
  test("0 gün önce, bugünle aynıdır", () => {
    assert.equal(isoDateNDaysAgo(0), todayISO());
  });

  test("isoDateNDaysFromNow(n), isoDateNDaysAgo(-n) ile aynıdır", () => {
    assert.equal(isoDateNDaysFromNow(5), isoDateNDaysAgo(-5));
  });

  test("30 gün önce, bugünden farklı ve geçmişte bir tarihtir", () => {
    const past = isoDateNDaysAgo(30);
    assert.notEqual(past, todayISO());
    assert.ok(past < todayISO());
  });

  test("7 gün sonra, bugünden ileride bir tarihtir", () => {
    const future = isoDateNDaysFromNow(7);
    assert.ok(future > todayISO());
  });
});

describe("toComparableDate", () => {
  test("DD.MM.YYYY formatını YYYY-MM-DD'ye çevirir", () => {
    assert.equal(toComparableDate("05.03.2024"), "2024-03-05");
  });

  test("boş/null girişte null döner", () => {
    assert.equal(toComparableDate(""), null);
    assert.equal(toComparableDate(null), null);
  });

  test("geçersiz formatta null döner", () => {
    assert.equal(toComparableDate("2024-03-05"), null);
    assert.equal(toComparableDate("bozuk veri"), null);
  });
});
