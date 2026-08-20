// MOCK data — there is no real backend/auth yet. Keyed by role so the demo role switcher
// (src/contexts/RoleContext.jsx) can simulate "being logged in" as each user type.
// Swapping this for real authentication later only requires changing services/authService.js.

/** @type {Record<string, import("../types/index.js").User>} */
export const MOCK_USERS = {
  expert: {
    id: "usr_expert_001",
    name: "Elif Demir",
    email: "elif.demir@nobetci.app",
    companyId: "comp_002",
    role: "expert",
    subscription: "pro",
    photo: null,
    title: "İSG Uzmanı (A Sınıfı)",
    phone: "+90 532 000 00 01",
    department: "İSG Danışmanlığı",
    lastLoginAt: new Date().toISOString(),
  },
  employer: {
    id: "usr_employer_001",
    name: "Mehmet Kaya",
    email: "mehmet.kaya@ornek-sanayi.com",
    companyId: "comp_001",
    role: "employer",
    subscription: "enterprise",
    photo: null,
    title: "Operasyon Müdürü",
    phone: "+90 532 000 00 02",
    department: "İdari İşler",
    lastLoginAt: new Date().toISOString(),
  },
  employee: {
    id: "usr_employee_001",
    name: "Ahmet Yıldız",
    email: "ahmet.yildiz@ornek-sanayi.com",
    companyId: "comp_001",
    role: "employee",
    subscription: "trial",
    photo: null,
    title: "Saha Operatörü",
    phone: "+90 532 000 00 03",
    department: "Üretim",
    lastLoginAt: new Date().toISOString(),
  },
};
