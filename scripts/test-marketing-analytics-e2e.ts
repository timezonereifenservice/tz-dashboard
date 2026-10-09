/**
 * Create TEST marketing analytics + lead rows, verify dashboard reads, delete.
 * Run: npx tsx --env-file=.env.local scripts/test-marketing-analytics-e2e.ts
 */
import { randomUUID } from "crypto";
import { offersQuery } from "../src/lib/db/offers-pool";
import {
  fetchMarketingAnalyticsSnapshot,
  getMarketingLeadById,
} from "../src/lib/marketing/fetch";

async function main() {
  const stamp = Date.now();
  const sessionId = `test-session-${stamp}`;
  const email = `test-analytics-${stamp}@example.com`;
  const leadId = `testlead${stamp}`;
  const eventIds: string[] = [];

  console.log("1) Inserting TEST analytics events + lead…");

  const events = [
    { event: "page_view", placement: null },
    { event: "click_call", placement: "hero" },
    { event: "click_form", placement: "price" },
    { event: "click_map", placement: "map" },
    { event: "form_submit", placement: "form" },
  ] as const;

  for (const item of events) {
    const id = randomUUID();
    eventIds.push(id);
    await offersQuery(
      `INSERT INTO "AnalyticsEvent"
       (id, "createdAt", event, page, service, locale, placement, "sessionId", path, referrer,
        "userAgent", country, city, region, device, browser, os,
        "utmSource", "utmMedium", "utmCampaign")
       VALUES
       ($1, NOW(), $2, 'reifenservice', 'tires', 'de', $3, $4, '/lp/reifenservice', 'https://google.com',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'DE', 'Pulheim', 'NW',
        'mobile', 'Safari', 'iOS', 'google', 'cpc', 'test-campaign')`,
      [id, item.event, item.placement, sessionId],
    );
  }

  await offersQuery(
    `INSERT INTO "Lead"
     (id, "createdAt", name, "firstName", "lastName", phone, email, vehicle, brand, model, year,
      service, "serviceLabel", page, locale, "sessionId",
      country, city, region, device, browser, os,
      "utmSource", "utmMedium", "utmCampaign", meta, "emailSent")
     VALUES
     ($1, NOW(), $2, 'Test', 'Analytics', '+491700000000', $3, 'BMW 3er 2020', 'BMW', '3er', '2020',
      'tires', 'Reifenservice', 'reifenservice', 'de', $4,
      'DE', 'Pulheim', 'NW', 'mobile', 'Safari', 'iOS',
      'google', 'cpc', 'test-campaign', $5::jsonb, false)`,
    [
      leadId,
      `TEST-ANALYTICS-${stamp}`,
      email,
      sessionId,
      JSON.stringify({ referrer: "https://google.com", sessionId, path: "/lp/reifenservice" }),
    ],
  );

  console.log("   Lead:", leadId, "Events:", eventIds.length);

  console.log("2) Verifying dashboard snapshot + lead detail…");
  const snapshot = await fetchMarketingAnalyticsSnapshot("7d");
  if (snapshot.kpis.pageViews < 1) {
    throw new Error("Expected page views in snapshot");
  }
  if (!snapshot.countries.some((c) => c.key === "DE" || c.label.includes("Germany"))) {
    throw new Error("Expected DE country breakdown");
  }
  if (!snapshot.cities.some((c) => c.key.toLowerCase().includes("pulheim"))) {
    throw new Error("Expected Pulheim city breakdown");
  }
  if (!snapshot.devices.some((d) => d.key === "mobile")) {
    throw new Error("Expected mobile device breakdown");
  }
  if (!snapshot.ctas.some((c) => c.event === "click_call" || c.event === "click_form")) {
    throw new Error("Expected CTA breakdown rows");
  }

  const detail = await getMarketingLeadById(leadId);
  if (!detail) throw new Error("Lead detail missing");
  if (detail.lead.email !== email) throw new Error("Lead email mismatch");
  if (detail.timeline.length < 3) {
    throw new Error(`Expected timeline events, got ${detail.timeline.length}`);
  }

  console.log("   Snapshot KPIs:", snapshot.kpis);
  console.log("   Countries:", snapshot.countries.slice(0, 3));
  console.log("   Timeline events:", detail.timeline.length);

  console.log("3) Deleting TEST rows…");
  await offersQuery(`DELETE FROM "Lead" WHERE id = $1`, [leadId]);
  await offersQuery(`DELETE FROM "AnalyticsEvent" WHERE "sessionId" = $1`, [
    sessionId,
  ]);

  const leftoverLead = await offersQuery(
    `SELECT id FROM "Lead" WHERE id = $1 OR email = $2`,
    [leadId, email],
  );
  const leftoverEvents = await offersQuery(
    `SELECT id FROM "AnalyticsEvent" WHERE "sessionId" = $1`,
    [sessionId],
  );
  if (leftoverLead.rows.length || leftoverEvents.rows.length) {
    throw new Error("Cleanup incomplete");
  }

  console.log("   Cleanup OK");
  console.log("\nPASS");
}

main()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("\nFAIL:", error);
    try {
      await offersQuery(
        `DELETE FROM "Lead" WHERE email LIKE 'test-analytics-%@example.com' OR name LIKE 'TEST-ANALYTICS-%'`,
      );
      await offersQuery(
        `DELETE FROM "AnalyticsEvent" WHERE "sessionId" LIKE 'test-session-%'`,
      );
    } catch (cleanupError) {
      console.error("Cleanup failed:", cleanupError);
    }
    process.exit(1);
  });
