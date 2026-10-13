export const MARKETING_SITE = {
  domain: "offers.timezone-reifenservice.de",
  url: "https://offers.timezone-reifenservice.de",
};

export const MARKETING_PAGE_LABELS: Record<string, string> = {
  getriebespuelung: "Getriebespülung LP",
  reifenservice: "Reifenservice LP",
  oelwechsel: "Ölwechsel LP",
  klimaservice: "Klimaservice LP",
  autoglas: "Autoglas LP",
};

export const MARKETING_SERVICE_LABELS: Record<string, string> = {
  transmission: "Getriebespülung",
  tyre: "Reifenservice",
  tires: "Reifenservice", // legacy alias
  oil: "Ölwechsel",
  climate: "Klimaservice",
  glass: "Autoglas",
};

export const MARKETING_LOCALE_LABELS: Record<string, string> = {
  de: "German",
  en: "English",
};

export const MARKETING_EVENT_LABELS: Record<string, string> = {
  page_view: "Page view",
  click_call: "Call click",
  click_whatsapp: "WhatsApp click",
  click_email: "Email click",
  click_form: "Form CTA",
  click_map: "Open map",
  click_locale: "Language switch",
  form_start: "Form start",
  form_submit: "Form submit",
  form_success: "Form success",
  form_error: "Form error",
  scroll_depth: "Scroll depth",
  section_view: "Section view",
  outbound_main_site: "Outbound main site",
};

/** Primary conversion CTAs shown in scorecards / CTA mix. */
export const MARKETING_CTA_EVENTS = new Set([
  "click_call",
  "click_whatsapp",
  "click_email",
  "click_form",
  "click_map",
]);

/** All action events included in placement breakdowns. */
export const MARKETING_ACTION_EVENTS = [
  "click_call",
  "click_whatsapp",
  "click_email",
  "click_form",
  "click_map",
  "click_locale",
  "form_start",
  "form_submit",
  "form_success",
  "form_error",
  "scroll_depth",
  "section_view",
  "outbound_main_site",
] as const;

export const MARKETING_CTA_EVENT_SQL = `'click_call','click_whatsapp','click_email','click_form','click_map'`;

export const MARKETING_ACTION_EVENT_SQL = MARKETING_ACTION_EVENTS.map(
  (e) => `'${e}'`,
).join(",");

export function marketingPageLabel(page: string, path?: string) {
  const key = page.trim().toLowerCase();
  if (MARKETING_PAGE_LABELS[key]) return MARKETING_PAGE_LABELS[key];
  if (path?.trim()) {
    const segment = path.split("/").filter(Boolean).pop();
    if (segment && MARKETING_PAGE_LABELS[segment]) {
      return MARKETING_PAGE_LABELS[segment];
    }
  }
  return page.replace(/[-_]/g, " ") || "Landing page";
}

export function marketingServiceLabel(service: string) {
  const key = service.trim().toLowerCase();
  return (
    MARKETING_SERVICE_LABELS[key] ?? (service.replace(/[-_]/g, " ") || "—")
  );
}

export function marketingEventLabel(event: string) {
  return (
    MARKETING_EVENT_LABELS[event] ??
    (event.replace(/_/g, " ") || "Unknown")
  );
}

export function marketingCountryLabel(code: string) {
  const key = code.trim().toUpperCase();
  if (!key || key === "UNKNOWN") return "Unknown";
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(key) ?? key
    );
  } catch {
    return key;
  }
}
