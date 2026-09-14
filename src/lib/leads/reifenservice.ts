export type ReifenserviceLeadType = "contact" | "whatsapp" | "phone" | "service";

export type ReifenserviceLeadStatus = "NEW" | "READ" | "ARCHIVED";

export type LeadFormField = {
  key: string;
  label: string;
  value: string;
};

export const REIFENSERVICE_LEAD_STATUSES: ReifenserviceLeadStatus[] = [
  "NEW",
  "READ",
  "ARCHIVED",
];

export const REIFENSERVICE_TYPE_LABELS: Record<ReifenserviceLeadType, string> = {
  contact: "Kontakt",
  whatsapp: "WhatsApp",
  phone: "Anruf",
  service: "Leistung",
};

export const REIFENSERVICE_TYPE_FILTERS: Array<{
  id: ReifenserviceLeadType | "ALL";
  label: string;
}> = [
  { id: "ALL", label: "Alle" },
  { id: "contact", label: "Kontakt" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "phone", label: "Anruf" },
  { id: "service", label: "Leistung" },
];

export function normalizeLeadFormFields(value: unknown): LeadFormField[] {
  if (!Array.isArray(value)) return [];

  const fields: LeadFormField[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const key = typeof row.key === "string" ? row.key.trim() : "";
    const label = typeof row.label === "string" ? row.label.trim() : "";
    const fieldValue = typeof row.value === "string" ? row.value.trim() : "";
    if (!key || !fieldValue) continue;
    fields.push({
      key,
      label: label || key,
      value: fieldValue,
    });
  }
  return fields;
}

export function isReifenserviceLeadStatus(
  value: string,
): value is ReifenserviceLeadStatus {
  return REIFENSERVICE_LEAD_STATUSES.includes(value as ReifenserviceLeadStatus);
}

export function reifenserviceTypeLabel(type: string) {
  return (
    REIFENSERVICE_TYPE_LABELS[type as ReifenserviceLeadType] ?? (type || "—")
  );
}

export function displaySourcePage(sourcePage: string) {
  const value = sourcePage.trim();
  if (!value || value.includes("/wp-json/")) return "";
  return value;
}

export function reifenserviceSourceLabel(lead: {
  formKey: string;
  meta: Record<string, unknown>;
}) {
  const label = lead.meta.sourceLabel;
  if (typeof label === "string" && label.trim()) return label.trim();
  if (lead.formKey.trim()) return lead.formKey.replace(/[-_]/g, " ");
  return "Website";
}
