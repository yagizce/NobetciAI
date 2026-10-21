// Gizlenen yönetim alanları ve eski kayıtlardaki ek bilgiler güncellemede korunur.
export function buildCompanyUpdate(form, company, includeAdmin = false) {
  return {
    ...company,
    name: form.name.trim(),
    sector: form.sector,
    employeeCount: Number(form.employeeCount) || 0,
    dangerClass: form.dangerClass || "",
    ...(includeAdmin ? {
      address: form.address.trim(),
      taxNumber: form.taxNumber.trim(),
      logo: form.logo,
      phone: form.phone.trim(),
      email: form.email.trim(),
      expertIsEmployer: Boolean(form.expertIsEmployer),
    } : {}),
  };
}
