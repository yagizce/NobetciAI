import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { canCreateDif, findExistingDif, buildDifFromFinding } from "./auditManagementService.js";
import { canTransitionDifStage } from "../constants/auditWorkflow.js";

// Bu dosya yalnızca SAF (I/O yapmayan) fonksiyonları test eder — auditManagementService.js'in
// DB'ye dokunan kısımları (getAudits, createAudit, updateDifStage vb.) codebase genelindeki
// kuralla tutarlı olarak burada test EDİLMEZ (bkz. dosya başı: hiçbir CRUD servisinin gerçek
// IndexedDB entegrasyon testi yok). openDifFromFinding, bu saf fonksiyonları I/O ile sarar;
// davranışı zaten burada test edilen parçalardan türer.

const mevzuatItem = {
  id: "risk-1",
  categoryCode: "risk",
  title: "Risk değerlendirmesinin yapılmış ve güncel olması",
  result: "uygun_degil",
  note: "Risk değerlendirmesi 3 yıldır güncellenmemiş.",
  departmentId: null,
  legislationName: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu",
  article: "Madde 10",
  verified: true,
};

const audit = { id: "audit-1", companyId: "company-1" };

describe("canCreateDif — Uygun olmayan kriterden manuel DİF oluşturma / Uygun kriterden oluşturulamaması", () => {
  test("'Uygun Değil' sonuçlu kriterden DİF oluşturmaya izin verir", () => {
    const result = canCreateDif(mevzuatItem);
    assert.equal(result.allowed, true);
    assert.equal(result.reason, null);
  });

  test("'Uygun' sonuçlu kriterden DİF oluşturmayı REDDEDER", () => {
    const result = canCreateDif({ ...mevzuatItem, result: "uygun" });
    assert.equal(result.allowed, false);
    assert.ok(result.reason?.length > 0);
  });

  test("'Kısmen Uygun', 'Kanıt Yok' ve 'Değerlendirilmedi' sonuçlarından da DİF oluşturmayı reddeder", () => {
    ["kismen_uygun", "kanit_yok", "degerlendirilmedi"].forEach((r) => {
      assert.equal(canCreateDif({ ...mevzuatItem, result: r }).allowed, false, `${r} için izin verilmemeli`);
    });
  });

  test("result alanı olmayan/undefined bir kriterden DİF oluşturmayı reddeder", () => {
    assert.equal(canCreateDif({}).allowed, false);
    assert.equal(canCreateDif(undefined).allowed, false);
  });
});

describe("findExistingDif — aynı kriter için duplicate DİF engeli", () => {
  test("aynı denetim + aynı kriter için mevcut DİF'i bulur", () => {
    const findings = [{ id: "f1", auditId: "audit-1", checklistItemId: "risk-1" }];
    const found = findExistingDif(findings, "audit-1", "risk-1");
    assert.equal(found?.id, "f1");
  });

  test("farklı kriter veya farklı denetim için eşleşme bulmaz", () => {
    const findings = [{ id: "f1", auditId: "audit-1", checklistItemId: "risk-1" }];
    assert.equal(findExistingDif(findings, "audit-1", "risk-2"), undefined);
    assert.equal(findExistingDif(findings, "audit-2", "risk-1"), undefined);
  });

  test("boş/undefined findings listesiyle çökmez", () => {
    assert.equal(findExistingDif([], "audit-1", "risk-1"), undefined);
    assert.equal(findExistingDif(undefined, "audit-1", "risk-1"), undefined);
  });
});

describe("buildDifFromFinding — audit/kriter bağlantısı ve mevzuat dayanağı aktarımı", () => {
  const dif = buildDifFromFinding(audit, mevzuatItem);

  test("denetim ve kriter bağlantısı korunur", () => {
    assert.equal(dif.auditId, "audit-1");
    assert.equal(dif.checklistItemId, "risk-1");
    assert.equal(dif.companyId, "company-1");
  });

  test("kriter başlığı DİF'e kopyalanır", () => {
    assert.equal(dif.criterionTitle, mevzuatItem.title);
  });

  test("mevzuat dayanağı (ad + madde) KRİTERDEN otomatik ve doğru aktarılır", () => {
    assert.equal(dif.legislationName, "6331 sayılı İş Sağlığı ve Güvenliği Kanunu");
    assert.equal(dif.article, "Madde 10");
  });

  test("ISO 45001 kriterinde (legislationName/article yok) bu alanlar null olur, çökmez", () => {
    const isoItem = { id: "4.1", categoryCode: "4", title: "Bağlam", result: "uygun_degil" };
    const isoDif = buildDifFromFinding(audit, isoItem);
    assert.equal(isoDif.legislationName, null);
    assert.equal(isoDif.article, null);
  });

  test("yeni DİF her zaman 'open' aşamasında ve boş geçmişle başlar", () => {
    assert.equal(dif.stage, "open");
    assert.deepEqual(dif.history, []);
    assert.equal(dif.closedAt, null);
  });

  test("her çağrı benzersiz bir id üretir (mükerrer kayıt riski taşımaz)", () => {
    const dif2 = buildDifFromFinding(audit, mevzuatItem);
    assert.notEqual(dif.id, dif2.id);
  });
});

describe("DİF durum yönetimi Faz 3 merkezi workflow üzerinden çalışır", () => {
  test("yeni açılan bir DİF, merkezi canTransitionDifStage'e göre 'Aksiyon Bekliyor'a geçebilir (düzeltici faaliyet girilince)", () => {
    const dif = buildDifFromFinding(audit, mevzuatItem);
    const withoutAction = canTransitionDifStage({ fromStage: dif.stage, toStage: "awaitingAction", dif, actorRole: "expert", company: null });
    assert.equal(withoutAction.allowed, false, "düzeltici faaliyet girilmeden geçişe izin verilmemeli");

    const withAction = canTransitionDifStage({
      fromStage: dif.stage, toStage: "awaitingAction",
      dif: { ...dif, correctiveAction: "Risk değerlendirmesi güncellenecek" },
      actorRole: "expert", company: null,
    });
    assert.equal(withAction.allowed, true);
  });
});
