import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCompanyUpdate } from "./companyForm.js";

const form = { name: " Firma ", sector: "İnşaat", employeeCount: "12", dangerClass: "high", address: " Adres ", taxNumber: "", logo: null, phone: "", email: "", expertIsEmployer: false };

test("uzman formu gizli alanları ve ek kayıt bilgilerini değiştirmez", () => {
  const original = { id: "c1", address: "Eski adres", taxNumber: "123", logo: "old-logo", phone: "555", email: "a@example.com", expertIsEmployer: true, customField: "sakla" };
  const updated = buildCompanyUpdate(form, original);
  for (const key of Object.keys(original)) assert.deepEqual(updated[key], original[key]);
  assert.equal(updated.name, "Firma");
  assert.equal(updated.employeeCount, 12);
  assert.equal(updated.address, "Eski adres");
});

test("yeni uzman firması gizli yönetim bilgilerini istemez", () => {
  const updated = buildCompanyUpdate(form, null);
  assert.equal(updated.name, "Firma");
  assert.equal(Object.hasOwn(updated, "taxNumber"), false);
  assert.equal(Object.hasOwn(updated, "address"), false);
});

test("yönetim alanları yeniden açıldığında güncellenebilir", () => {
  const updated = buildCompanyUpdate({ ...form, taxNumber: " 456 " }, { taxNumber: "123" }, true);
  assert.equal(updated.taxNumber, "456");
  assert.equal(updated.address, "Adres");
});
