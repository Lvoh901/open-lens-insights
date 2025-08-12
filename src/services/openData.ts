export type SeriesPoint = { date: Date; value: number; anomaly?: boolean };

export type DatasetMeta = {
  id: string;
  name: string;
  category: string;
  unit?: string;
  source: { name: string; url: string };
  frequency: "annual" | "daily" | "monthly";
};

export type Dataset = {
  meta: DatasetMeta;
  series: SeriesPoint[];
};

async function fetchWorldBankData(indicator: string, id: string, name: string, category: string, unit?: string): Promise<Dataset> {
  const url = `https://api.worldbank.org/v2/country/KEN/indicator/${indicator}?format=json&per_page=70`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch data from World Bank API: ${res.statusText}`);
    }
    const json = await res.json();
    if (!json || !Array.isArray(json[1])) {
      throw new Error("Invalid data format from World Bank API");
    }
    const rows = (json[1] || []) as Array<{ date: string; value: number | null }>
    const series = rows
      .filter((r) => r.value !== null)
      .map((r) => ({ date: new Date(Number(r.date), 0, 1), value: Number(r.value) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      meta: {
        id,
        name,
        category,
        unit,
        source: { name: "World Bank", url },
        frequency: "annual",
      },
      series,
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export type DatasetId = "economy_gdp_growth_kenya" | "population_total_kenya" | "economy_inflation_kenya" | "health_life_expectancy_kenya" | "development_access_to_electricity_kenya";

export async function getDataset(id: DatasetId): Promise<Dataset> {
  switch (id) {
    case "economy_gdp_growth_kenya":
      return fetchWorldBankData("NY.GDP.MKTP.KD.ZG", id, "Kenya GDP Growth (annual %)", "Economics & Finance", "%");
    case "population_total_kenya":
      return fetchWorldBankData("SP.POP.TOTL", id, "Kenya Population, total", "Population & Demographics");
    case "economy_inflation_kenya":
      return fetchWorldBankData("FP.CPI.TOTL.ZG", id, "Kenya Inflation, consumer prices (annual %)", "Economics & Finance", "%");
    case "health_life_expectancy_kenya":
      return fetchWorldBankData("SP.DYN.LE00.IN", id, "Kenya Life expectancy at birth, total (years)", "Health", "years");
    case "development_access_to_electricity_kenya":
      return fetchWorldBankData("EG.ELC.ACCS.ZS", id, "Kenya Access to electricity (% of population)", "Development", "%");
    default:
      return fetchWorldBankData("NY.GDP.MKTP.KD.ZG", "economy_gdp_growth_kenya", "Kenya GDP Growth (annual %)", "Economics & Finance", "%");
  }
}
