import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { turkishLower } from "./text.js";

describe("turkishLower", () => {
  test("Türkçe büyük İ'yi düz 'i'ye çevirir (JS'in varsayılan .toLowerCase()'inin YAPMADIĞI şey)", () => {
    // Regresyon testi: bkz. src/utils/text.js dosya başı yorumu. Düz .toLowerCase()
    // burada "forkli̇ft" (nokta işaretli i) döner, bu da substring eşleşmesini bozar.
    assert.equal(turkishLower("FORKLİFT"), "forklift");
  });

  test("Türkçe büyük I'yı noktasız 'ı'ya çevirir", () => {
    assert.equal(turkishLower("IŞIK"), "ışık");
  });

  test("zaten küçük harfli Türkçe metni değiştirmeden bırakır", () => {
    assert.equal(turkishLower("forklift çarpması"), "forklift çarpması");
  });

  test("null/undefined/boş string için boş string döner (çökmez)", () => {
    assert.equal(turkishLower(null), "");
    assert.equal(turkishLower(undefined), "");
    assert.equal(turkishLower(""), "");
  });

  test("gerçek dünya senaryosu: Caps Lock ile yazılan arama, normal yazılmış veriyle eşleşir", () => {
    const query = turkishLower("FORKLİFT");
    const haystack = turkishLower("Forklift çarpması");
    assert.ok(haystack.includes(query));
  });
});
