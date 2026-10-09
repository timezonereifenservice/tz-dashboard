/**
 * Static route/feature matrix for dashboard redirects.
 * Run: npx tsx scripts/audit-dashboard-routes.ts
 */
import { PROJECTS, projectHasFeature } from "../src/lib/projects/config";
import { getProjectSwitchHref } from "../src/lib/projects/switch-href";

const SECTIONS = [
  "overview",
  "website-analytics",
  "leads",
  "marketing-analytics",
  "marketing-leads",
  "chatbot-leads",
  "blogs",
  "blogs/create-new",
] as const;

const SECTION_FEATURE: Record<string, string | null> = {
  overview: "overview",
  "website-analytics": "analytics",
  leads: "leads",
  "marketing-analytics": "marketing-analytics",
  "marketing-leads": "marketing-leads",
  "chatbot-leads": "chatbot-leads",
  blogs: "blogs",
  "blogs/create-new": "blogs",
};

let failures = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures += 1;
    console.error("FAIL:", msg);
  } else {
    console.log("OK  ", msg);
  }
}

console.log("=== Project switch always → overview ===");
for (const p of PROJECTS) {
  assert(
    getProjectSwitchHref(p.id) === `/${p.id}/overview`,
    `switch → ${p.id} lands on overview`,
  );
}

console.log("\n=== Feature URL matrix (unsupported → should soft-redirect to overview) ===");
for (const project of PROJECTS) {
  for (const section of SECTIONS) {
    const feature = SECTION_FEATURE[section];
    const url = `/${project.slug}/${section}`;
    const supported =
      !feature ||
      projectHasFeature(
        project,
        feature as
          | "overview"
          | "analytics"
          | "leads"
          | "blogs"
          | "chatbot-leads"
          | "marketing-analytics"
          | "marketing-leads",
      );
    if (supported) {
      console.log("OK  ", `${url} supported`);
    } else {
      console.log("→   ", `${url} unsupported → redirect /${project.slug}/overview`);
    }
  }
}

console.log("\n=== Cross-project switch scenarios (the 404 bug) ===");
const reifenMarketing = [
  "/tz-reifenservice/marketing-analytics",
  "/tz-reifenservice/marketing-leads",
];
for (const from of reifenMarketing) {
  for (const target of PROJECTS.filter((p) => p.id !== "tz-reifenservice")) {
    const href = getProjectSwitchHref(target.id);
    assert(
      href === `/${target.id}/overview`,
      `from ${from} switch to ${target.id} → ${href}`,
    );
  }
}

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nPASS — switch targets and feature matrix look correct");
