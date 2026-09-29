import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createId, ensureId } from "./id.js";

describe("id helpers", () => {
  test("yeni id UUID v4 biçiminde üretir", () => {
    const id = createId();
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  test("ardışık yeni id'ler çakışmaz", () => {
    assert.notEqual(createId(), createId());
  });

  test("mevcut numeric ve string id'yi korur", () => {
    assert.equal(ensureId({ id: 42, name: "legacy" }), 42);
    assert.equal(ensureId({ id: "legacy-id" }), "legacy-id");
  });

  test("eksik id için UUID üretir", () => {
    assert.match(String(ensureId({ name: "new" })), /^[0-9a-f-]{36}$/i);
  });
});
