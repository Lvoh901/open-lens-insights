import React from "react";
import { Button } from "@/components/ui/button";
import { toCSV, downloadFile, downloadJSON, downloadSVGasPNG } from "@/lib/export";
import { SeriesPoint, Dataset } from "@/services/openData";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, Download, FileText, Image, Share2 } from "lucide-react";

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
      <Button variant="hero" onClick={onBookmark} title="Bookmark this view">
        <Bookmark size={16} className="mr-1" />
        <span>Bookmark</span>
      </Button>
      <Button variant="soft" onClick={handleCSV} title="Download as CSV">
        <Download size={16} className="mr-1" />
        <span>CSV</span>
      </Button>
      <Button variant="soft" onClick={handleJSON} title="Download as JSON">
        <FileText size={16} className="mr-1" />
        <span>JSON</span>
      </Button>
      <Button variant="glow" onClick={handlePNG} title="Export chart as PNG">
        <Image size={16} className="mr-1" />
        <span>PNG</span>
      </Button>
      <Button variant="ghost" onClick={handleShare} title="Copy shareable link">
        <Share2 size={16} className="mr-1" />
        <span>Share</span>
      </Button>
    </div>
  );
};
