import {
  fetchMarketingGaOverview,
  fetchServiceDetailAnalytics,
} from "../src/lib/marketing/service-analytics";

async function main() {
  const overview = await fetchMarketingGaOverview("30d");
  console.log(
    JSON.stringify(
      {
        totals: overview.totals,
        services: overview.services.map((s) => ({
          id: s.id,
          views: s.pageViews,
          leads: s.leads,
          conv: s.conversionRate,
          country: s.topCountry,
          city: s.topCity,
        })),
      },
      null,
      2,
    ),
  );

  const detail = await fetchServiceDetailAnalytics("30d", "tires");
  console.log(
    "tires detail",
    detail
      ? {
          views: detail.service.pageViews,
          countries: detail.countries.slice(0, 3),
          cities: detail.cities.slice(0, 3),
          leads: detail.recentLeads.length,
        }
      : null,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
