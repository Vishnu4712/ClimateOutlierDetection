"use client";
import { useRef, useState } from "react";

export default function Home() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [preview, setPreview] = useState(null); // show top lines of returned CSV

  const onAnalyze = async () => {
    if (!file) { setMsg("Please choose a CSV file."); return; }
    setLoading(true); setMsg(null); setPreview(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      // In dev, you can also use rewrites() and call "/api/analyze"
      const url = `${(process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000').replace(/\/$/, '')}/analyze`;

      const res = await fetch(url, { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      // Clone response: one for download (blob), one for preview (text)
      const resClone = res.clone();

      // 1) Download the CSV
      const blob = await res.blob();
      const a = document.createElement("a");
      const href = URL.createObjectURL(blob);
      a.href = href;
      const base = file.name.replace(/\.csv(\.gz)?$/i, "");
      a.download = `${base}_flagged.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);

      // 2) Preview first 10 rows
      const text = await resClone.text();
      const lines = text.split(/\r?\n/).slice(0, 11); // header + 10 rows
      setPreview(lines.join("\n"));

      setMsg("Download started. Preview shown below.");
    } catch (e) {
      setMsg(e.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null); setMsg(null); setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <main className="min-h-screen p-8 flex flex-col items-center gap-6">
      <div className="w-full max-w-3xl space-y-3">
        <h1 className="text-2xl font-bold">Vector-Aware Anomaly Detector</h1>
        <p className="text-sm opacity-80">
          Upload CSV with columns:&nbsp;
          <code>Lat, Lon, Year, Month, Date, WS10M, WD10M, QV2M, Prec</code>
        </p>

        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.csv.gz"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="border p-2 rounded"
          />
          <button
            onClick={onAnalyze}
            disabled={!file || loading}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {loading ? "Processing..." : "Analyze & Download"}
          </button>
          <button onClick={reset} className="px-4 py-2 rounded border">Reset</button>
        </div>

        {msg && <div className="text-sm">{msg}</div>}

        {preview && (
          <section className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Preview (first 10 rows)</h2>
            <pre className="p-3 border rounded overflow-auto text-sm whitespace-pre-wrap">
{preview}
            </pre>
          </section>
        )}
      </div>
    </main>
  );
}
