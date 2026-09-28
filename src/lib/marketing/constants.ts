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
  tires: "Reifenservice",
  oil: "Ölwechsel",
  climate: "Klimaservice",
  glass: "Autoglas",
};

export const MARKETING_LOCALE_LABELS: Record<string, string> = {
  de: "German",
  en: "English",
};

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
