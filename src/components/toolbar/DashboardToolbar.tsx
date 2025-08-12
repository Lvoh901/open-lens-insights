import React from "react";
import { Button } from "@/components/ui/button";
import { toCSV, downloadFile, downloadJSON, downloadSVGasPNG } from "@/lib/export";
import { SeriesPoint, Dataset } from "@/services/openData";
import { useToast } from "@/hooks/use-toast";

export const DashboardToolbar: React.FC<{
  dataset: Dataset;
  visibleData: SeriesPoint[];
  svgRef: React.RefObject<SVGSVGElement>;
  onBookmark: () => void;
}> = ({ dataset, visibleData, svgRef, onBookmark }) => {
  const { toast } = useToast();

  const handleCSV = () => {
    const rows = visibleData.map((d) => ({ date: d.date.toISOString(), value: d.value }));
    const csv = toCSV(rows);
    downloadFile(`${dataset.meta.id}.csv`, csv, "text/csv");
  };
  const handleJSON = () => downloadJSON(`${dataset.meta.id}.json`, { meta: dataset.meta, data: visibleData });
  const handlePNG = () => {
    if (svgRef.current) downloadSVGasPNG(svgRef.current, `${dataset.meta.id}.png`);
  };
  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("dataset", dataset.meta.id);
    await navigator.clipboard.writeText(url.toString());
    toast({ title: "Link copied", description: "Shareable link copied to clipboard." });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="hero" onClick={onBookmark}>Bookmark</Button>
      <Button variant="soft" onClick={handleCSV}>Download CSV</Button>
      <Button variant="soft" onClick={handleJSON}>Download JSON</Button>
      <Button variant="glow" onClick={handlePNG}>Export PNG</Button>
      <Button variant="ghost" onClick={handleShare}>Share Link</Button>
    </div>
  );
};
