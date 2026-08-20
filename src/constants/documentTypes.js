// Supported document types for the document generation infrastructure.
// AI-assisted draft content generation is implemented — see documentService.js
// → generateDocumentDraft() and DocumentGenerator.jsx.

export const DOCUMENT_TYPES = [
  { value: "riskAnalizi", label: "Risk Analizi" },
  { value: "acilDurumPlani", label: "Acil Durum Planı" },
  { value: "talimat", label: "Talimat" },
  { value: "kkdTutanagi", label: "KKD Teslim Tutanağı" },
  { value: "ramakKala", label: "Ramak Kala" },
  { value: "isKazasiBildirimi", label: "İş Kazası Bildirimi" },
];

export function getDocumentTypeLabel(value) {
  return DOCUMENT_TYPES.find((t) => t.value === value)?.label || value;
}
