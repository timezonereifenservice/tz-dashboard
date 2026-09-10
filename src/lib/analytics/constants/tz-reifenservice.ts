import type { ProjectAnalyticsConstants } from "./types";

export const tzReifenserviceAnalyticsConstants: ProjectAnalyticsConstants = {
  serviceAnalytics: [
    { id: "reifen", label: "Reifenservice", paths: ["/reifenservice"], formKeys: [] },
    {
      id: "getriebe",
      label: "Getriebespülung",
      paths: ["/getriebespuelung"],
      formKeys: [],
    },
    { id: "kfz", label: "KFZ Service", paths: ["/kfz-services", "/kfz-service"], formKeys: [] },
    { id: "klima", label: "Klimaservice", paths: ["/klimaservice"], formKeys: [] },
    { id: "oel", label: "Ölwechsel", paths: ["/oelwechsel-service"], formKeys: [] },
    { id: "glas", label: "Autoglas Service", paths: ["/autoglas-service"], formKeys: [] },
    { id: "achs", label: "Achsvermessung", paths: ["/achsvermessung"], formKeys: [] },
    { id: "tuning", label: "Fahrzeugtuning", paths: ["/fahrzeugtuning"], formKeys: [] },
  ],
  ctaLabels: {
    whatsapp: "WhatsApp",
    call: "Jetzt anrufen",
    contact: "Kontaktformular",
    services: "Unsere Leistungen",
    email: "E-Mail senden",
  },
  localeLabels: {
    de: "German",
  },
  pageLabels: {
    "/": "Startseite",
    "/kontakt": "Kontakt",
    "/ueber-uns": "Über uns",
    "/reifenservice": "Reifenservice",
    "/getriebespuelung": "Getriebespülung",
    "/kfz-services": "KFZ Service",
    "/klimaservice": "Klimaservice",
    "/oelwechsel-service": "Ölwechsel",
    "/autoglas-service": "Autoglas Service",
    "/achsvermessung": "Achsvermessung",
    "/fahrzeugtuning": "Fahrzeugtuning",
  },
};
