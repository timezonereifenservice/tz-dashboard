# Marketing LP events for GA-style targeting

## Already captured (live)

| Event | Why it matters |
|-------|----------------|
| `page_view` | Traffic / sessions per ad LP |
| `click_call` | High-intent phone CTA |
| `click_whatsapp` | High-intent chat CTA |
| `click_email` | Contact intent |
| `click_form` | Scroll/quote → form |
| `click_map` | Location interest |
| `form_submit` / `form_success` / `form_error` | Conversion funnel |

Also stored: country, city, region (Vercel), device/browser/OS, UTM, referrer, sessionId.

## Recommended next events (best ROI, still event-driven)

Add only once-per-session or on click — **no polling**.

| Event | Placement / trigger | Decision value |
|-------|---------------------|----------------|
| `form_start` | First focus on any form field | Soft conversion / drop-off before submit |
| `scroll_depth` | Fire once at 25 / 50 / 75 / 100 | Content engagement quality |
| `section_view` | IntersectionObserver for price, FAQ, reviews, map | Which blocks drive intent |
| `click_locale` | DE/EN toggle | Language demand |
| `outbound_main_site` | Footer / impressum / main site links | Leakage off the ad LP |
| `click_offer` | Marquee offer lines (already partly `click_form`) | Offer messaging tests |

Optional Ads-specific (if you use Google Ads):

| Field / event | Notes |
|---------------|-------|
| `gclid` | Store on first hit into session + Lead |
| `utm_content` / `utm_term` | Creative / keyword splits |

## How to use the preview

Open: `/tz-reifenservice/test-website-analytics`

- Overview: compare Getriebespülung / Reifenservice / Ölwechsel
- Click a service card: countries, cities, views, leads, CTAs, devices, UTM, daily, recent forms
