import * as d3 from "d3";
import React from "react";
import { SeriesPoint } from "@/services/openData";

export type D3LineChartProps = {
  data: SeriesPoint[];
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  unit?: string;
  onReady?: (svg: SVGSVGElement | null) => void;
};

export const D3LineChart: React.FC<D3LineChartProps> = ({
  data,
  height = 340,
  margin = { top: 20, right: 20, bottom: 36, left: 48 },
  unit,
  onReady,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [width, setWidth] = React.useState(800);
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number; label: string } | null>(null);

  React.useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(Math.floor(entry.contentRect.width));
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  React.useEffect(() => {
    if (!svgRef.current || !data.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const innerW = Math.max(width - margin.left - margin.right, 100);
    const innerH = Math.max(height - margin.top - margin.bottom, 100);

    const x = d3
      .scaleUtc()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerW]);

    const y = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.value) ?? 0, d3.max(data, (d) => d.value) ?? 1])
      .nice()
      .range([innerH, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xAxis = d3.axisBottom<Date>(x).ticks(6);
    const yAxis = d3.axisLeft<number>(y).ticks(6).tickFormat((v) => `${v}${unit ?? ""}`);

    g.append("g").attr("transform", `translate(0,${innerH})`).attr("class", "text-muted-foreground").call(xAxis as any);
    g.append("g").attr("class", "text-muted-foreground").call(yAxis as any);

    const line = d3
      .line<SeriesPoint>()
      .x((d) => x(d.date))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    // Area under line for a polished look
    const area = d3
      .area<SeriesPoint>()
      .x((d) => x(d.date))
      .y0(innerH)
      .y1((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", "url(#grad)")
      .attr("d", area);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "hsl(" + getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() + ")")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Gradient definition
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "grad")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");
    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "hsl(" + getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() + ")")
      .attr("stop-opacity", 0.25);
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "hsl(" + getComputedStyle(document.documentElement).getPropertyValue("--brand-2").trim() + ")")
      .attr("stop-opacity", 0);

    // Anomalies as dots
    g.selectAll("circle")
      .data(data.filter((d) => d.anomaly))
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.value))
      .attr("r", 3)
      .attr("fill", "hsl(" + getComputedStyle(document.documentElement).getPropertyValue("--brand-3").trim() + ")");

    // Pointer interaction
    const bisect = d3.bisector<SeriesPoint, Date>((d) => d.date).left;
    svg
      .on("mousemove", (event) => {
        const [mx, my] = d3.pointer(event);
        const x0 = x.invert(mx - margin.left);
        const i = Math.min(bisect(data, x0, 1), data.length - 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        const d = !d0 ? d1 : !d1 ? d0 : x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
        if (!d) return;
        setTooltip({ x: x(d.date) + margin.left, y: y(d.value) + margin.top, label: `${d.date.toISOString().slice(0, 10)} — ${d.value}${unit ?? ""}` });
      })
      .on("mouseleave", () => setTooltip(null));

    if (onReady) onReady(svgRef.current);
  }, [data, height, margin, unit, width, onReady]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} width={width} height={height} role="img" aria-label="Line chart" />
      {tooltip && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-3 rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  );
};
