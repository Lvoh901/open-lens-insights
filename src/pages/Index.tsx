import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { D3LineChart } from "@/components/charts/D3LineChart";
import { DatasetSelector } from "@/components/datasets/DatasetSelector";
import { RuleInsights } from "@/components/insights/RuleInsights";
import { DashboardToolbar } from "@/components/toolbar/DashboardToolbar";
import { Dataset, DatasetId, getDataset, SeriesPoint } from "@/services/openData";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [datasetId, setDatasetId] = React.useState<DatasetId>(() => (new URLSearchParams(location.search).get("dataset") as DatasetId) || "economy_gdp_growth_us");
  const [dataset, setDataset] = React.useState<Dataset | null>(null);
  const [windowPercent, setWindowPercent] = React.useState<number>(100);
  const [svgEl, setSvgEl] = React.useState<SVGSVGElement | null>(null);

  React.useEffect(() => {
    getDataset(datasetId).then(setDataset);
    const url = new URL(window.location.href);
    url.searchParams.set("dataset", datasetId);
    window.history.replaceState({}, "", url);
  }, [datasetId]);

  const visibleData: SeriesPoint[] = React.useMemo(() => {
    if (!dataset) return [];
    const n = dataset.series.length;
    const startIndex = Math.floor(n * (1 - windowPercent / 100));
    const slice = dataset.series.slice(Math.max(0, startIndex));
    // Mark anomalies with simple z-score over the visible window
    const vals = slice.map((d) => d.value);
    const mean = vals.reduce((a, b) => a + b, 0) / Math.max(vals.length, 1);
    const sd = Math.sqrt(vals.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / Math.max(vals.length, 1));
    return slice.map((d) => ({ ...d, anomaly: sd ? Math.abs((d.value - mean) / sd) >= 2.2 : false }));
  }, [dataset, windowPercent]);

  const handleBookmark = () => {
    if (!dataset) return;
    const key = "odip_bookmarks";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.unshift({ datasetId, windowPercent, savedAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 25)));
    toast({ title: "Bookmarked", description: `${dataset.meta.name} saved.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between py-6">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-[linear-gradient(135deg,hsl(var(--brand)),hsl(var(--brand-2)))] shadow-[var(--shadow-glow)]" />
            <span className="text-lg font-semibold">Open Data Insights Portal</span>
          </a>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="link" asChild>
              <a href="#datasets">Datasets</a>
            </Button>
            <Button variant="link" asChild>
              <a href="#insights">Insights</a>
            </Button>
            <Button variant="hero" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}>Explore</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-8 py-8">
        <section aria-labelledby="hero" className="rounded-xl border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h1 id="hero" className="sr-only">Open Data Insights Portal</h1>
          <div className="grid gap-6 md:grid-cols-3 md:items-center">
            <div className="md:col-span-2 space-y-3">
              <h2 className="text-2xl font-bold tracking-tight">Turn public data into clear, interactive insights</h2>
              <p className="text-muted-foreground">Aggregate open datasets, explore with interactive D3 charts, and get instant summaries highlighting trends, patterns, and anomalies.</p>
              <div className="flex gap-2">
                <Button variant="hero" onClick={() => document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })}>Get started</Button>
                <Button variant="soft" asChild>
                  <a href="https://data.worldbank.org/" target="_blank" rel="noreferrer">Data sources</a>
                </Button>
              </div>
            </div>
            <div className="md:col-span-1 rounded-lg bg-[linear-gradient(135deg,hsl(var(--brand)/0.1),hsl(var(--brand-2)/0.1))] p-6">
              <div className="text-sm text-muted-foreground">Featured categories</div>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Economics & Finance</li>
                <li>• Environment & Climate</li>
                <li>• Health</li>
                <li>• Transport</li>
                <li>• Population & Demographics</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="dashboard" aria-labelledby="dashboard-title" className="space-y-4">
          <h2 id="dashboard-title" className="text-xl font-semibold">Interactive dashboard</h2>

          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <DatasetSelector
                dataset={datasetId}
                onChange={setDatasetId}
                windowPercent={windowPercent}
                onWindowPercentChange={setWindowPercent}
              />
            </CardContent>
          </Card>

          {dataset && (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                  <span>{dataset.meta.name}</span>
                  <DashboardToolbar
                    dataset={dataset}
                    visibleData={visibleData}
                    svgRef={{ current: svgEl }}
                    onBookmark={handleBookmark}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <D3LineChart data={visibleData} unit={dataset.meta.unit} onReady={(el) => setSvgEl(el)} />
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-md border p-3 text-sm">
                    <div className="font-medium">Source</div>
                    <a className="text-primary underline-offset-4 hover:underline" href={dataset.meta.source.url} target="_blank" rel="noreferrer">{dataset.meta.source.name}</a>
                    <div className="text-xs text-muted-foreground mt-1">Frequency: {dataset.meta.frequency}</div>
                  </div>
                  <div id="insights" className="md:col-span-2 rounded-md border p-3">
                    <RuleInsights data={visibleData} unit={dataset.meta.unit} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        <section aria-labelledby="bookmarks" className="space-y-3">
          <h2 id="bookmarks" className="text-xl font-semibold">Your bookmarks</h2>
          <BookmarksList onApply={(ds) => { setDatasetId(ds.datasetId as DatasetId); setWindowPercent(ds.windowPercent); }} />
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 py-6 md:flex-row">
          <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} Open Data Insights</div>
          <div className="text-xs text-muted-foreground">Built with React + D3. Public datasets: World Bank, Open-Meteo.</div>
        </div>
      </footer>
    </div>
  );
};

const BookmarksList: React.FC<{ onApply: (b: { datasetId: string; windowPercent: number }) => void }> = ({ onApply }) => {
  const [list, setList] = React.useState<Array<{ datasetId: string; windowPercent: number; savedAt: string }>>([]);
  React.useEffect(() => {
    const key = "odip_bookmarks";
    setList(JSON.parse(localStorage.getItem(key) || "[]"));
  }, []);
  if (!list.length) return <div className="text-sm text-muted-foreground">No bookmarks yet.</div>;
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {list.map((b, i) => (
        <Card key={`${b.datasetId}-${i}`} className="group transition-transform">
          <CardContent className="flex items-center justify-between gap-2 py-4">
            <div className="text-sm">
              <div className="font-medium">{b.datasetId}</div>
              <div className="text-xs text-muted-foreground">Window: {b.windowPercent}% • {new Date(b.savedAt).toLocaleString()}</div>
            </div>
            <Button variant="glow" onClick={() => onApply(b)}>Load</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Index;
