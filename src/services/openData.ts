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

// World Bank: GDP growth (annual %)
export async function fetchWorldBankGDPGrowth(country = "US"): Promise<Dataset> {
  const indicator = "NY.GDP.MKTP.KD.ZG";
  const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=70`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    const rows = (json?.[1] || []) as Array<{ date: string; value: number | null }>
    const series = rows
      .filter((r) => r.value !== null)
      .map((r) => ({ date: new Date(Number(r.date), 0, 1), value: Number(r.value) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      meta: {
        id: "economy_gdp_growth_us",
        name: "US GDP Growth (annual %)",
        category: "Economics & Finance",
        unit: "%",
        source: { name: "World Bank", url },
        frequency: "annual",
      },
      series,
    };
  } catch (e) {
    // Fallback sample
    const years = Array.from({ length: 15 }, (_, i) => 2008 + i);
    const series = years.map((y, i) => ({ date: new Date(y, 0, 1), value: Math.sin(i / 2) * 2 }))
    return {
      meta: {
        id: "economy_gdp_growth_us",
        name: "US GDP Growth (annual %)",
        category: "Economics & Finance",
        unit: "%",
        source: { name: "Sample", url: "" },
        frequency: "annual",
      },
      series,
    };
  }
}

// Open-Meteo: NYC daily mean temperature (last ~180 days)
export async function fetchOpenMeteoNYCTemp(): Promise<Dataset> {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 180);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = now.toISOString().slice(0, 10);
  const url = `https://archive-api.open-meteo.com/v1/era5?latitude=40.71&longitude=-74.01&daily=temperature_2m_mean&start_date=${startStr}&end_date=${endStr}&timezone=auto`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    const dates: string[] = json?.daily?.time ?? [];
    const temps: number[] = json?.daily?.temperature_2m_mean ?? [];
    const series = dates.map((d, i) => ({ date: new Date(d), value: Number(temps[i]) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return {
      meta: {
        id: "environment_temp_nyc",
        name: "NYC Daily Mean Temperature",
        category: "Environment",
        unit: "°C",
        source: { name: "Open-Meteo ERA5", url },
        frequency: "daily",
      },
      series,
    };
  } catch (e) {
    const days = Array.from({ length: 90 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (90 - i));
      return { date: d, value: 10 + Math.sin(i / 6) * 8 + (Math.random() - 0.5) * 1 };
    });
    return {
      meta: {
        id: "environment_temp_nyc",
        name: "NYC Daily Mean Temperature",
        category: "Environment",
        unit: "°C",
        source: { name: "Sample", url: "" },
        frequency: "daily",
      },
      series: days,
    };
  }
}

export type DatasetId = "economy_gdp_growth_us" | "environment_temp_nyc";

export async function getDataset(id: DatasetId): Promise<Dataset> {
  switch (id) {
    case "economy_gdp_growth_us":
      return fetchWorldBankGDPGrowth();
    case "environment_temp_nyc":
      return fetchOpenMeteoNYCTemp();
    default:
      return fetchWorldBankGDPGrowth();
  }
}
