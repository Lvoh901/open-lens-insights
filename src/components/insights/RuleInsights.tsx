import React from "react";
import { SeriesPoint } from "@/services/openData";

function summarize(data: SeriesPoint[]) {
  if (!data.length)
    return {
      trend: "Insufficient data",
      anomalies: [] as SeriesPoint[],
      notes: [] as string[],
    };
  const values = data.map((d) => d.value);
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / n;
  const sd = Math.sqrt(variance);

  // Simple linear trend via least squares
  const xs = data.map((_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = mean;
  const cov = xs.reduce((a, x, i) => a + (x - xMean) * (values[i] - yMean), 0);
  const denom = xs.reduce((a, x) => a + Math.pow(x - xMean, 2), 0) || 1;
  const slope = cov / denom;
  let trend = "Stable";
  if (slope > sd * 0.02) trend = "Upward";
  else if (slope < -sd * 0.02) trend = "Downward";

  // Z-score anomalies (> 2 sd)
  const withZ = data.map((d) => ({
    ...d,
    z: sd ? Math.abs((d.value - mean) / sd) : 0,
  }));
  const anomalies = withZ
    .filter((d) => d.z >= 2)
    .sort((a, b) => b.z - a.z)
    .slice(0, 5)
    .map(({ z, ...rest }) => rest);

  const pctChange =
    n > 1
      ? ((values[n - 1] - values[0]) / Math.max(Math.abs(values[0]), 1e-6)) *
        100
      : 0;
  const vol = sd;
  const notes = [
    `Average: ${mean.toFixed(2)}`,
    `Change: ${pctChange.toFixed(2)}% over the selected window`,
    `Volatility (sd): ${vol.toFixed(2)}`,
  ];
  return { trend, anomalies, notes };
}

export const RuleInsights: React.FC<{ data: SeriesPoint[]; unit?: string }> = ({
  data,
  unit,
}) => {
  const summary = React.useMemo(() => summarize(data), [data]);
  return (
    <div className="space-y-3">
      <h5 className="font-bold">Trend: <span className="font-bold text-red-500">{summary.trend}</span></h5>

      {summary.anomalies.length > 0 && (
        <p className="">
          Anomalies:{" "}
          {summary.anomalies
            .slice(0, 3)
            .map((a) => a.date.toISOString().slice(0, 10))
            .join(", ")}
        </p>
      )}
      <ul className="list-disc pl-5">
        {summary.notes.map((n, idx) => (
          <li key={idx}>
            {n}
            {unit ? ` ${unit}` : ""}
          </li>
        ))}
      </ul>
      <div className="rounded-md border bg-gradient-to-br from-[hsl(var(--accent))] to-transparent p-3 text-xs text-muted-foreground">
        What this means: These quick insights are rule-based. Connect an AI key later to generate richer, context-aware summaries and implications.
      </div>
    </div>
  );
};
