import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getChatContext, CHAT_CONTEXTS } from "./chatContexts.js";

describe("getChatContext", () => {
  test("geçerli bir contextId için ilgili context config'i döner", () => {
    const result = getChatContext("fineKinney");
    assert.equal(result, CHAT_CONTEXTS.fineKinney);
    assert.equal(result.label, "Fine-Kinney Değerlendirmesi");
  });

  test("tanımsız contextId için null döner (genel sohbet moduna düşer)", () => {
    assert.equal(getChatContext("olmayanContext"), null);
  });

  test("undefined/null/boş string için null döner", () => {
    assert.equal(getChatContext(undefined), null);
    assert.equal(getChatContext(null), null);
    assert.equal(getChatContext(""), null);
  });

  test("her context'in gerekli alanları (label, promptAddendum, greeting, quickPrompts) vardır", () => {
    for (const [id, ctx] of Object.entries(CHAT_CONTEXTS)) {
      assert.ok(ctx.label, `${id}.label eksik`);
      assert.ok(ctx.promptAddendum, `${id}.promptAddendum eksik`);
      assert.ok(ctx.greeting, `${id}.greeting eksik`);
      assert.ok(Array.isArray(ctx.quickPrompts) && ctx.quickPrompts.length > 0, `${id}.quickPrompts eksik/boş`);
    }
  });
});
