export type Row = Record<string, string | number | boolean | null | undefined>;

export function toCSV(rows: Row[], delimiter = ",") {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    const needsQuotes = s.includes(delimiter) || s.includes("\n") || s.includes('"');
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };
  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(delimiter));
  }
  return lines.join("\n");
}

export function downloadFile(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJSON(filename: string, data: unknown) {
  downloadFile(filename, JSON.stringify(data, null, 2), "application/json");
}

// Converts an SVG element to a PNG data URL via canvas and triggers download
export async function downloadSVGasPNG(svgEl: SVGSVGElement, filename: string, scale = 2) {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgEl);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  const bbox = svgEl.getBBox();
  const width = Math.max(svgEl.clientWidth || bbox.width, 800);
  const height = Math.max(svgEl.clientHeight || bbox.height, 450);

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--background").trim()
    ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--background").trim()})`
    : "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = url;
  });
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const pngUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(pngUrl);
  }, "image/png");
}
