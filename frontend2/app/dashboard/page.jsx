"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileText, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [messages, setMessages] = useState([]);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const pushMsg = (m) => setMessages((prev) => [...prev, m]);

  const handleFileUpload = (file) => {
    // accept .csv and .csv.gz
    if (file.type === "text/csv" || /\.csv(\.gz)?$/i.test(file.name)) {
      setUploadedFile(file);
      setIsProcessed(false);
      setMessages([`Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`]);
      setPreview(null);
    } else {
      setMessages([`Please upload a .csv or .csv.gz file`]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) handleFileUpload(files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileUpload(files[0]);
  };

  const processFile = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setIsProcessed(false);
    setMessages(["Uploading file…"]);
    setPreview(null);

    try {
      const fd = new FormData();
      fd.append("file", uploadedFile);

      const url = `${(process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000')
  .replace(/\/$/, '')}/analyze`;

      const res = await fetch(url, { method: "POST", body: fd });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      pushMsg("Analyzing on server…");

      // clone for preview
      const resClone = res.clone();

      // trigger download
      pushMsg("Preparing download…");
      const blob = await res.blob();
      const a = document.createElement("a");
      const href = URL.createObjectURL(blob);
      a.href = href;
      const base = uploadedFile.name.replace(/\.csv(\.gz)?$/i, "");
      a.download = `${base}_flagged.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      pushMsg("Download started ✓");

      // quick preview (first 10 rows)
      const text = await resClone.text();
      const lines = text.split(/\r?\n/).slice(0, 11).join("\n");
      setPreview(lines);

      setIsProcessed(true);
    } catch (err) {
      pushMsg(`Error: ${err.message || "Upload failed"}`);
      setIsProcessed(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setUploadedFile(null);
    setIsProcessed(false);
    setIsProcessing(false);
    setMessages([]);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-700 mb-4">Processing Dashboard</h1>
          <p className="text-xl text-blue-400">Upload your meteorological data for anomaly detection</p>
        </div>

        <div className="max-w-5xl mx-auto grid gap-8">
          {/* Upload Section */}
          <div className="bg-white border border-blue-200 shadow-xl rounded-2xl p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-2xl font-semibold text-blue-700 mb-2">
                <Upload className="h-6 w-6 text-blue-400" />
                Upload CSV File
              </div>
              <div className="text-lg text-blue-400 mb-4">
                Upload your meteorological data file for anomaly detection processing
              </div>
            </div>
            <div
              className={`border-2 border-dashed border-blue-300 rounded-xl p-10 text-center transition cursor-pointer ${
                isDragOver
                  ? "border-blue-500 bg-blue-50"
                  : uploadedFile
                  ? "border-blue-500 bg-blue-50"
                  : "hover:border-blue-400"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.csv.gz"
                onChange={handleFileInput}
                className="hidden"
              />
              {uploadedFile ? (
                <div className="space-y-4">
                  <CheckCircle className="h-12 w-12 text-blue-500 mx-auto" />
                  <div>
                    <p className="text-xl font-medium text-blue-700">{uploadedFile.name}</p>
                    <p className="text-base text-blue-400">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <FileText className="h-12 w-12 text-blue-400 mx-auto" />
                  <div>
                    <p className="text-xl font-medium text-blue-700">
                      Drop your CSV file here, or click to browse
                    </p>
                    <p className="text-base text-blue-400">
                      Supports meteorological data in CSV format
                    </p>
                  </div>
                </div>
              )}
            </div>
            {uploadedFile && (
              <div className="mt-6 flex gap-4">
                <Button onClick={processFile} disabled={isProcessing} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold py-4 rounded-lg">
                  {isProcessing ? "Processing..." : "Process File"}
                </Button>
                <Button onClick={clearAll} className="flex-1 border border-blue-500 text-blue-500 text-lg font-semibold py-4 rounded-lg bg-white hover:bg-blue-50">
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Status + Preview */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-blue-200 shadow-lg rounded-2xl p-8">
              <div className="mb-4 text-2xl font-bold text-blue-700">Processing Status</div>
              <ul className="space-y-2 text-lg">
                <li className="flex justify-between items-center">
                  <span>File Upload</span>
                  <span className="font-semibold text-blue-500">{uploadedFile ? "Done" : "Pending"}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Analysis</span>
                  <span className={`font-semibold ${isProcessing ? "text-blue-400" : "text-blue-500"}`}>{isProcessing ? "Processing" : "Pending"}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Results</span>
                  <span className={`font-semibold ${isProcessed ? "text-blue-700" : "text-blue-500"}`}>{isProcessed ? "Ready" : "Pending"}</span>
                </li>
              </ul>
              {messages.length > 0 && (
                <div className="mt-6 text-base text-blue-400">
                  {messages.map((m, i) => (
                    <div key={i}>• {m}</div>
                  ))}
                </div>
              )}
              {isProcessing && (
                <div className="mt-4">
                  <div className="w-full bg-blue-100 rounded h-2 overflow-hidden">
                    <div className="h-2 bg-blue-500 animate-pulse" style={{ width: "60%" }} />
                  </div>
                  <div className="text-xs text-blue-400 mt-1">
                    Large files may take a while; don’t close this tab.
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white border border-blue-200 shadow-lg rounded-2xl p-8">
              <div className="mb-4 text-2xl font-bold text-blue-700">About Processing</div>
              <div className="text-lg text-blue-400 mb-2">
                Our vectorized anomaly detection algorithm analyzes gridded meteorological data to identify outliers and unusual patterns in weather measurements.
              </div>
              <div className="mt-6">
                <div className="mb-2 text-blue-700 font-semibold">Preview (first 10 rows)</div>
                {preview ? (
                  <pre className="text-sm overflow-auto max-h-80 whitespace-pre-wrap bg-blue-50 p-4 rounded-lg border border-blue-100">{preview}</pre>
                ) : (
                  <p className="text-base text-blue-300">No preview yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          {isProcessed && (
            <div className="bg-white border border-blue-200 shadow-xl rounded-2xl p-8">
              <div className="flex items-center gap-2 text-2xl font-semibold text-blue-700 mb-2">
                <Download className="h-6 w-6 text-blue-400" />
                Download Results
              </div>
              <div className="text-lg text-blue-400 mb-4">
                Your file has been processed successfully. A download should have started.
              </div>
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <CheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <p className="text-xl font-medium text-blue-700 mb-2">Processing Complete!</p>
                <p className="text-base text-blue-400">
                  Anomalies have been detected and flagged in your data.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
