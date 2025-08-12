import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { D3LineChart } from "@/components/charts/D3LineChart";
import { DatasetSelector } from "@/components/datasets/DatasetSelector";
import { RuleInsights } from "@/components/insights/RuleInsights";
import { DashboardToolbar } from "@/components/toolbar/DashboardToolbar";
import { Dataset, DatasetId, getDataset, SeriesPoint } from "@/services/openData";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Utility: Get datasetId from URL or fallback
function getInitialDatasetId(): DatasetId {
  const param = new URLSearchParams(window.location.search).get("dataset");
  return (param as DatasetId) || "economy_gdp_growth_kenya";
}

// Utility: Format dataset name from id
function formatDatasetName(id: string) {
  return id
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const Index: React.FC = () => {
  const { toast } = useToast();
  const [datasetId, setDatasetId] = React.useState<DatasetId>(getInitialDatasetId);
  const [dataset, setDataset] = React.useState<Dataset | null>(null);
  const [windowPercent, setWindowPercent] = React.useState<number>(100);
  const [svgEl, setSvgEl] = React.useState<SVGSVGElement | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch dataset when datasetId changes
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDataset(datasetId)
      .then((data) => {
        if (!cancelled) setDataset(data);
      })
      .catch((err) => {
        if (!cancelled) setError("Failed to load dataset.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("dataset", datasetId);
    window.history.replaceState({}, "", url);

    return () => {
      cancelled = true;
    };
  }, [datasetId]);

  // Memoize visible data and anomaly detection
  const visibleData: SeriesPoint[] = React.useMemo(() => {
    if (!dataset) return [];
    const n = dataset.series.length;
    const startIndex = Math.floor(n * (1 - windowPercent / 100));
    const slice = dataset.series.slice(Math.max(0, startIndex));
    // Mark anomalies with simple z-score over the visible window
    const vals = slice.map((d) => d.value);
    const mean = vals.reduce((a, b) => a + b, 0) / Math.max(vals.length, 1);
    const sd = Math.sqrt(vals.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / Math.max(vals.length, 1));
    return slice.map((d) => ({
      ...d,
      anomaly: sd ? Math.abs((d.value - mean) / sd) >= 2.2 : false,
    }));
  }, [dataset, windowPercent]);

  // Bookmark handler
  const handleBookmark = () => {
    if (!dataset) return;
    const key = "odip_bookmarks";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    // Avoid duplicate bookmarks for same datasetId+windowPercent
    const already = existing.find(
      (b: any) => b.datasetId === datasetId && b.windowPercent === windowPercent
    );
    if (already) {
      toast({
        title: "Already Bookmarked",
        description: `${dataset.meta.name} is already in your bookmarks.`,
        variant: "default", // fixed: "info" is not a valid variant
      });
      return;
    }
    existing.unshift({
      datasetId,
      windowPercent,
      savedAt: new Date().toISOString(),
      name: dataset.meta.name,
    });
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 25)));
    toast({
      title: "Bookmarked",
      description: `${dataset.meta.name} saved.`,
    });
  };

  // Scroll helpers
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between py-6">
          <a href="/" className="inline-flex items-center gap-2">
            <img src="/logo.png" className="w-12 h-12"/>
            <h5 className="font-semibold">Open Data Insights Portal</h5>
          </a>
          <nav className="hidden md:flex items-center gap-3">
            <Button variant="link" asChild>
              <a href="#datasets" onClick={() => scrollToSection("dashboard")}>Datasets</a>
            </Button>
            <Button variant="link" asChild>
              <a href="#insights" onClick={() => scrollToSection("insights")}>Insights</a>
            </Button>
            <Button
              variant="hero"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            >
              Explore
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto flex-1 space-y-8 py-8">
        {/* Hero Section */}
        <section aria-labelledby="hero" className="rounded-xl border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div className="space-y-3">
              <h5 className="font-bold">Turn public data into clear, interactive insights</h5>

              <p className="text-gray-500 font-light">
                Aggregate open datasets, explore with interactive D3 charts, and get instant summaries highlighting trends, patterns, and anomalies.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="hero"
                  onClick={() => scrollToSection("dashboard")}
                  aria-label="Get started"
                >
                  Get started
                </Button>
                <Button variant="soft" asChild>
                  <a
                    href="https://data.worldbank.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Data sources
                  </a>
                </Button>
              </div>
            </div>

            <div className="md:col-span-1 rounded-lg bg-[linear-gradient(135deg,hsl(var(--brand)/0.1),hsl(var(--brand-2)/0.1))] p-6">
              <h5 className="font-bold">Featured categories</h5>

              <ul className="mt-2 space-y-1 text-sm text-gray-500">
                <li>• Economics & Finance</li>
                <li>• Environment & Climate</li>
                <li>• Health</li>
                <li>• Transport</li>
                <li>• Population & Demographics</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Dashboard Section */}
        <section id="dashboard" aria-labelledby="dashboard-title" className="space-y-4">
          <h4 id="dashboard-title" className="font-bold">Interactive dashboard</h4>

          <div className="border rounded-md">
            <CardHeader>
              <h5 className="font-bold">Controls</h5>
            </CardHeader>

            <CardContent>
              <DatasetSelector
                dataset={datasetId}
                onChange={setDatasetId}
                windowPercent={windowPercent}
                onWindowPercentChange={setWindowPercent}
              />
            </CardContent>
          </div>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <span className="text-muted-foreground">Loading dataset...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center py-8">
              <span className="text-destructive">{error}</span>
            </div>
          )}
          {dataset && !loading && !error && (
            <Card>
              <div  className="flex flex-wrap items-center justify-between gap-3 px-4 pt-2">
                <h5 className="font-bold">
                  <span className="truncate" title={dataset.meta.name}>
                    {dataset.meta.name}
                  </span>
                </h5>

                <DashboardToolbar
                    dataset={dataset}
                    visibleData={visibleData}
                    svgRef={{ current: svgEl }}
                    onBookmark={handleBookmark}
                  />
              </div>

              <CardContent className="space-y-4">
                <D3LineChart
                  data={visibleData}
                  unit={dataset.meta.unit}
                  onReady={setSvgEl}
                  // loading prop removed: not in D3LineChartProps
                  highlightAnomalies
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <h5 className="font-bold">Source</h5>

                    <a
                      className="text-primary underline-offset-4 hover:underline break-all"
                      href={dataset.meta.source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {dataset.meta.source.name}
                    </a>

                    <div className="text-md mt-1">
                      Frequency: <span className="text-gray-500 capitalize underline underline-offset-4">{dataset.meta.frequency}</span>
                    </div>
                  </div>

                  <div
                    id="insights"
                    className="md:col-span-2 rounded-md border p-3"
                  >
                    <RuleInsights data={visibleData} unit={dataset.meta.unit} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Bookmarks Section */}
        <section aria-labelledby="bookmarks" className="space-y-3">
          <h4 id="bookmarks" className="font-bold">Your bookmarks</h4>

          <BookmarksList
            onApply={(ds) => {
              setDatasetId(ds.datasetId as DatasetId);
              setWindowPercent(ds.windowPercent);
            }}
          />
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 py-6 md:flex-row">
          <small className="text-gray-500">© {new Date().getFullYear()} Open Data Insights</small>

          <small className="text-gray-500">Built with React + D3. Public datasets: World Bank, Open-Meteo.</small>
        </div>
      </footer>
    </div>
  );
};

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// BookmarksList: Improved with delete and name display
const BookmarksList: React.FC<{
  onApply: (b: { datasetId: string; windowPercent: number }) => void;
}> = ({ onApply }) => {
  const [list, setList] = React.useState<
    Array<{
      datasetId: string;
      windowPercent: number;
      savedAt: string;
      name?: string;
    }>
  >([]);
  const { toast } = useToast();

  // Load bookmarks from localStorage
  React.useEffect(() => {
    const key = "odip_bookmarks";
    setList(JSON.parse(localStorage.getItem(key) || "[]"));
  }, []);

  // Delete bookmark
  const handleDelete = (idx: number) => {
    const key = "odip_bookmarks";
    const updated = [...list];
    updated.splice(idx, 1);
    setList(updated);
    localStorage.setItem(key, JSON.stringify(updated));
    toast({ title: "Bookmark removed" });
  };

  if (!list.length)
    return (
      <div className="text-sm text-muted-foreground">No bookmarks yet.</div>
    );

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {list.map((b, i) => (
        <Card
          key={`${b.datasetId}-${b.windowPercent}-${i}`}
          className="group transition-transform"
        >
          <CardContent className="flex items-center justify-between gap-2 py-4">
            <div className="text-sm min-w-0 flex-1">
              <div className="font-medium truncate" title={b.name || formatDatasetName(b.datasetId)}>
                {b.name || formatDatasetName(b.datasetId)}
              </div>
              <div className="text-xs text-muted-foreground">
                Window: {b.windowPercent}% •{" "}
                {new Date(b.savedAt).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="glow"
                size="sm"
                onClick={() => onApply(b)}
                aria-label="Load bookmark"
              >
                Load
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-60 hover:opacity-100"
                    aria-label="Delete bookmark"
                    title="Delete bookmark"
                  >
                    <svg
                      width={16}
                      height={16}
                      fill="none"
                      stroke="red"
                      strokeWidth={1.5}
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                    >
                      <path
                        d="M4.5 4.5l7 7m0-7l-7 7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your bookmark.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(i)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Index;
