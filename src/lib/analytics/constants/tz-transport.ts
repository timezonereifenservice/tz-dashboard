import type { ProjectAnalyticsConstants } from "./types";

export const tzTransportAnalyticsConstants: ProjectAnalyticsConstants = {
  serviceAnalytics: [
    {
      id: "kurier",
      label: "Kurier",
      pathPrefixes: ["/services/kurier-express", "/services/courier"],
      formKeys: ["kurier-location-lead", "kurier-form"],
    },
    {
      id: "spedition",
      label: "Spedition / LKW",
      pathPrefixes: ["/services/spedition-lkw", "/services/freight-forwarding"],
      formKeys: ["spedition-location-lead", "spedition-form"],
    },
    {
      id: "kuehltransporte",
      label: "Kühltransporte",
      pathPrefixes: ["/services/kuehltransporte", "/services/refrigerated-transport"],
      formKeys: ["kuehltransporte-location-lead", "kuehltransporte-form"],
    },
    {
      id: "feste-touren",
      label: "Feste Touren",
      pathPrefixes: ["/services/feste-touren", "/services/regular-tours"],
      formKeys: ["feste-touren-location-lead", "feste-touren-form"],
    },
    {
      id: "internationale-transporte",
      label: "Internationale Transporte",
      pathPrefixes: [
        "/services/internationale-transporte",
        "/services/international-shipping",
        "/services/local-deliveries",
      ],
      formKeys: [
        "internationale-transporte-location-lead",
        "internationale-transporte-form",
      ],
    },
    {
      id: "lebensmittel-lieferservice",
      label: "Lebensmittel-Lieferservice",
      pathPrefixes: [
        "/services/lebensmittel-lieferservice",
        "/services/refrigerated-food-delivery",
      ],
      formKeys: [
        "lebensmittel-lieferservice-full",
        "lebensmittel-lieferservice-location",
        "service_location_full_lebensmittel-lieferservice",
      ],
    },
  ],
  ctaLabels: {
    "get-quote": "Get Quote",
    contact: "Contact Form",
    call: "Call",
    whatsapp: "WhatsApp",
    "floating-call": "Floating Call",
    "floating-whatsapp": "Floating WhatsApp",
    track: "Track Shipment",
    newsletter: "Newsletter",
    chatbot: "AI Chatbot",
  },
  localeLabels: {
    de: "German",
    en: "English",
  },
  pageLabels: {
    "/": "Homepage",
    "/kontakt": "Contact",
    "/contact": "Contact",
    "/blog": "Blog",
    "/branchen": "Industries",
    "/industries": "Industries",
    "/tracking": "Tracking",
    "/ueber-uns": "About",
    "/about-us": "About",
    "/get-quote": "Get Quote",
    "/services": "Services Overview",
  },
};
