"use client";

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
  if (typeof window !== "undefined") {
    const param = new URLSearchParams(window.location.search).get("dataset");
    if (param) return param as DatasetId;
  }
  return "economy_gdp_growth_kenya";
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
        variant: "default",
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-slate-100 flex flex-col">
      {/* Enhanced header */}
      <header className="border-b bg-gray-300 shadow sticky top-0 z-30">
        <div className="container mx-auto flex items-center justify-between py-3">
          <Link href="/" className="inline-flex items-center gap-3 hover:opacity-90 transition font-bold text-xl">Open Data Insights</Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link href="#dashboard" onClick={() => scrollToSection("dashboard")} className="px-3 hover:underline decoration-brand underline-offset-8 text-[15px]">Datasets</Link>
            <Link href="#insights" onClick={() => scrollToSection("insights")} className="px-3 hover:underline decoration-brand underline-offset-8 text-[15px]">Insights</Link>

            <Button
              variant="hero"
              className="ml-2 px-6 py-2 font-bold shadow-glow"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            >
              Explore
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-1 space-y-12 py-8 md:py-14">
        {/* Hero Section */}
        <section aria-labelledby="hero" className="relative overflow-hidden rounded-2xl border bg-card/95 p-7 shadow-[0_8px_40px_-8px_var(--brand-2,theme(colors.brand-2))]">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-transparent via-white/30 to-brand/10 opacity-60" />
          <div className="grid gap-8 md:grid-cols-2 md:items-center z-10 relative">
            <div className="space-y-4">
              <h1 className="font-bold text-2xl md:text-3xl">
                Unlock public data as interactive insights
              </h1>

              <p className="text-gray-500 font-light text-lg">
                Aggregate open datasets, explore with interactive D3 charts, and get instant summaries—highlighting trends, patterns, and anomalies.
              </p>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="hero"
                  onClick={() => scrollToSection("dashboard")}
                  aria-label="Get started"
                  className="rounded-full px-6 py-2 text-lg shadow-glow"
                >
                  <span role="img" aria-label="rocket" className="mr-2">🚀</span>
                  Get started
                </Button>
                <Button
                  variant="soft"
                  asChild
                  className="rounded px-5 py-2 text-base"
                >
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
            <div className="md:col-span-1 rounded-2xl bg-gradient-to-tl from-brand/5 via-brand-2/10 to-background/0 p-7 border-t border-brand/10 shadow-inner flex flex-col gap-3 overflow-hidden">
              <h5 className="font-bold text-brand-2 text-lg mb-2">Featured categories</h5>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                <div className="flex items-center gap-2 rounded px-2 py-1 hover:bg-brand/10 transition">
                  <span role="img" aria-label="Economics">💹</span>
                  <span>Economics & Finance</span>
                </div>
                <div className="flex items-center gap-2 rounded px-2 py-1 hover:bg-brand-2/10 transition">
                  <span role="img" aria-label="Environment">🌿</span>
                  <span>Environment & Climate</span>
                </div>
                <div className="flex items-center gap-2 rounded px-2 py-1 hover:bg-brand/10 transition">
                  <span role="img" aria-label="Health">🩺</span>
                  <span>Health</span>
                </div>
                <div className="flex items-center gap-2 rounded px-2 py-1 hover:bg-brand-2/10 transition">
                  <span role="img" aria-label="Transport">🚚</span>
                  <span>Transport</span>
                </div>
                <div className="flex items-center gap-2 rounded px-2 py-1 hover:bg-brand/10 transition md:col-span-1 col-span-2">
                  <span role="img" aria-label="Population">👥</span>
                  <span>Population & Demographics</span>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-28 h-28 bg-[radial-gradient(circle_at_80%_100%,var(--brand-2)_10%,transparent)] pointer-events-none opacity-30" />
            </div>
          </div>
        </section>

        {/* Dashboard Section */}
        <section id="dashboard" aria-labelledby="dashboard-title" className="">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 animate-pulse">
              <svg className="animate-spin mb-3 text-muted-foreground" width="36" height="36" viewBox="0 0 48 48">
                <circle className="opacity-60" cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" />
                <path d="M44 24a20 20 0 0 1-20 20" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
              <span className="text-muted-foreground text-lg tracking-wide">Loading dataset…</span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center py-12 rounded bg-red-50 border border-red-200 shadow-inner">
              <span className="text-destructive text-lg font-semibold">
                <span role="img" aria-label="error" className="mr-2">⚠️</span>
                {error}
              </span>
            </div>
          )}

          {dataset && !loading && !error && (
            <Card className="shadow-xl border-brand/30 border-2">
              <h4 id="dashboard-title" className="font-black text-2xl tracking-tight text-brand pt-4 underline underline-offset-4 px-6 uppercase">Interactive Dashboard</h4>

              <div>
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

              <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-4">
                <h5 className="font-bold text-lg text-brand-2 flex-1 min-w-0 truncate" title={dataset.meta.name}>
                  {dataset.meta.name}
                </h5>
                <DashboardToolbar
                  dataset={dataset}
                  visibleData={visibleData}
                  svgRef={{ current: svgEl }}
                  onBookmark={handleBookmark}
                />
              </div>

              <CardContent className="space-y-6">
                <div className="rounded-xl bg-background/70 p-4 md:p-6 shadow-lg border border-brand-2/10">
                  <D3LineChart
                    data={visibleData}
                    unit={dataset.meta.unit}
                    onReady={setSvgEl}
                    highlightAnomalies
                  />
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  <div className="rounded-lg border p-4 bg-gray-50/50 flex flex-col justify-between shadow-inner">
                    <h5 className="font-semibold mb-1 text-brand">Source</h5>
                    <a
                      className="text-primary font-medium underline underline-offset-2 hover:text-brand hover:underline break-all transition"
                      href={dataset.meta.source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {dataset.meta.source.name}
                    </a>
                    <div className="text-md mt-1">
                      Frequency:{" "}
                      <span className="text-gray-600 capitalize underline underline-offset-4 font-medium">{dataset.meta.frequency}</span>
                    </div>
                  </div>
                  <div
                    id="insights"
                    className="md:col-span-2 rounded-lg border p-4 bg-card shadow-sm"
                  >
                    <RuleInsights data={visibleData} unit={dataset.meta.unit} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Bookmarks Section */}
        <section aria-labelledby="bookmarks" className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="inline-block w-1.5 h-5 rounded-full bg-brand/60" />
            <h4 id="bookmarks" className="font-black text-xl tracking-tight text-brand-2">Your Bookmarks</h4>
          </div>
          <BookmarksList
            onApply={(ds) => {
              setDatasetId(ds.datasetId as DatasetId);
              setWindowPercent(ds.windowPercent);
            }}
          />
        </section>
      </main>

      <footer className="border-t bg-card/60 shadow-inner mt-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-7 md:flex-row">
          <small className="text-gray-400 font-medium">© {new Date().getFullYear()} Open Data Insights</small>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Built with</span>
            <span className="text-brand-2 font-bold">React</span>
            <span className="px-1 text-xs font-light text-gray-400">&</span>
            <span className="text-brand font-bold">D3</span>
            <span className="ml-2 text-gray-400">Public datasets: World Bank, Open-Meteo.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import Link from "next/link";

// BookmarksList: UI improved
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
      <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded py-4 px-5 bg-slate-50/60">
        <span role="img" aria-label="bookmark">🔖</span>
        No bookmarks yet—save a view for quick access!
      </div>
    );

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {list.map((b, i) => (
        <Card
          key={`${b.datasetId}-${b.windowPercent}-${i}`}
          className="group transition-transform shadow-md border-brand-2/20 hover:border-brand-2/60 hover:scale-[1.015]"
        >
          <CardContent className="flex items-center justify-between gap-4 py-4 px-4">
            <div className="text-sm min-w-0 flex-1">
              <div className="font-semibold truncate text-brand-2" title={b.name || formatDatasetName(b.datasetId)}>
                {b.name || formatDatasetName(b.datasetId)}
              </div>
              <div className="text-xs text-muted-foreground flex gap-2 items-center mt-1">
                <span className="whitespace-nowrap px-2 bg-brand-2/10 text-brand-2 rounded-full font-medium">{b.windowPercent}% window</span>
                <span>•</span>
                <span className="truncate" title={new Date(b.savedAt).toLocaleString()}>{new Date(b.savedAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="glow"
                size="sm"
                className="rounded-full font-semibold px-4 hover:scale-105 transition"
                onClick={() => onApply(b)}
                aria-label="Load bookmark"
              >
                <span role="img" aria-label="restore" className="mr-1">⤴️</span>
                Load
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-60 hover:opacity-100 transition"
                    aria-label="Delete bookmark"
                    title="Delete bookmark"
                  >
                    <svg
                      width={18}
                      height={18}
                      fill="none"
                      stroke="#e11d48"
                      strokeWidth={2}
                      viewBox="0 0 18 18"
                      aria-hidden="true"
                    >
                      <circle cx="9" cy="9" r="8" stroke="#e11d48" strokeWidth={1} />
                      <path
                        d="M6 6l6 6m0-6l-6 6"
                        strokeLinecap="round"
                        strokeWidth={2.5}
                      />
                    </svg>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this bookmark?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Do you want to permanently remove this bookmark?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full px-4">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-white rounded-full px-4" onClick={() => handleDelete(i)}>Delete</AlertDialogAction>
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
