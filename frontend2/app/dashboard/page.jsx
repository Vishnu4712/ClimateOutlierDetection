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
          <div className="flex justify-center">
            <div className="bg-white border border-blue-200 shadow-lg rounded-2xl p-12 w-full max-w-3xl">
              <div className="mb-4 text-3xl font-bold text-blue-700">Processing Status</div>
              <ul className="space-y-4 text-xl">
                <li className="flex justify-between items-center">
                  <span>File Upload</span>
                  <span className={`font-semibold ${uploadedFile ? 'text-blue-500' : 'text-blue-300'}`}>{uploadedFile ? "Done" : "Pending"}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Analysis</span>
                  <span className={`font-semibold ${isProcessing ? 'text-blue-500 animate-pulse' : isProcessed ? 'text-blue-500' : 'text-blue-300'}`}>{isProcessing ? "Processing" : isProcessed ? "Done" : "Pending"}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Results</span>
                  <span className={`font-semibold ${isProcessed ? 'text-blue-700' : 'text-blue-300'}`}>{isProcessed ? "Ready" : "Pending"}</span>
                </li>
              </ul>
              {messages.length > 0 && (
                <div className="mt-8 text-lg text-blue-400">
                  {messages.map((m, i) => (
                    <div key={i}>• {m}</div>
                  ))}
                </div>
              )}
              {isProcessing && (
                <div className="mt-6 w-full">
                  <div className="relative h-4 bg-blue-100 rounded-full overflow-hidden">
                    <div className="absolute left-0 top-0 h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
                  </div>
                  <div className="text-base text-blue-400 mt-2 text-right">
                    Processing file, please wait…
                  </div>
                </div>
              )}
              {/* Download button after processing */}
              {isProcessed && (
                <div className="bg-white border border-blue-200 shadow-xl rounded-2xl p-8 mt-8">
                  <div className="flex flex-col items-center">
                    <CheckCircle className="h-12 w-12 text-blue-500 mb-2" />
                    <div className="text-xl font-semibold text-blue-700 mb-1">{uploadedFile ? uploadedFile.name.replace(/\.csv(\.gz)?$/i, "_flagged.csv") : "output_flagged.csv"}</div>
                    <div className="text-base text-blue-400 mb-6">{uploadedFile ? (uploadedFile.size / (1024 * 1024)).toFixed(2) : "-"} MB</div>
                    <div className="flex gap-4 w-full max-w-md">
                      <button
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold py-3 rounded-lg shadow-lg"
                        onClick={() => {
                          if (!preview) return;
                          const blob = new Blob([preview], { type: 'text/csv' });
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob);
                          a.download = uploadedFile ? uploadedFile.name.replace(/\.csv(\.gz)?$/i, "_flagged.csv") : "output_flagged.csv";
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(a.href);
                        }}
                      >
                        Download
                      </button>
                      <button
                        className="flex-1 border border-blue-500 text-blue-500 text-lg font-semibold py-3 rounded-lg bg-white hover:bg-blue-50"
                        onClick={clearAll}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
