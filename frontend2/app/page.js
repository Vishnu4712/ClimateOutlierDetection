import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, FileText, Zap } from "lucide-react";
import Link from "next/link";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-300">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-8 leading-tight">
              Vectorized Anomaly
              <span className="text-blue-500 block">Detection</span>
            </h1>
            <p className="text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Advanced meteorological data analysis that automatically flags anomalies in gridded weather data.
              Upload your CSV file and get instant anomaly detection results.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/dashboard">
                <button className="bg-blue-500 hover:bg-blue-600 text-white text-xl px-10 py-7 rounded-lg font-semibold flex items-center justify-center transition-colors shadow-lg">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-6 w-6" />
                </button>
              </Link>
              <button className="bg-white border-2 border-blue-500 text-blue-500 text-xl px-10 py-7 rounded-lg font-semibold flex items-center justify-center transition-colors hover:bg-blue-500 hover:text-white shadow-lg">
                Learn More
              </button>
            </div>
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-200 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl" />
        </div>
      </section>
      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">How It Works</h2>
            <p className="text-2xl text-gray-600 max-w-2xl mx-auto">
              Our algorithm processes meteorological data to identify patterns and flag anomalies.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            <div className="bg-white border border-blue-200 shadow-xl hover:shadow-2xl transition-all rounded-2xl">
              <div className="text-center p-8">
                <div className="mx-auto mb-6 p-4 bg-blue-100 rounded-full w-fit">
                  <FileText className="h-10 w-10 text-blue-500" />
                </div>
                <div className="text-2xl font-semibold text-gray-800 mb-2">Upload Data</div>
                <div className="text-lg text-gray-600 mb-4">Upload your CSV file containing gridded meteorological measurements</div>
                <p className="text-base text-gray-400 text-center">
                  Supports standard CSV format with weather station data and atmospheric measurements.
                </p>
              </div>
            </div>
            <div className="bg-white border border-blue-200 shadow-xl hover:shadow-2xl transition-all rounded-2xl">
              <div className="text-center p-8">
                <div className="mx-auto mb-6 p-4 bg-blue-100 rounded-full w-fit">
                  <Zap className="h-10 w-10 text-blue-400" />
                </div>
                <div className="text-2xl font-semibold text-gray-800 mb-2">Vectorized Analysis</div>
                <div className="text-lg text-gray-600 mb-4">Advanced algorithms process your data to identify statistical anomalies</div>
                <p className="text-base text-gray-400 text-center">
                  Our vectorized approach analyzes large datasets to detect outliers and unusual patterns.
                </p>
              </div>
            </div>
            <div className="bg-white border border-blue-200 shadow-xl hover:shadow-2xl transition-all rounded-2xl">
              <div className="text-center p-8">
                <div className="mx-auto mb-6 p-4 bg-blue-100 rounded-full w-fit">
                  <BarChart3 className="h-10 w-10 text-blue-500" />
                </div>
                <div className="text-2xl font-semibold text-gray-800 mb-2">Download Results</div>
                <div className="text-lg text-gray-600 mb-4">Get a new CSV file with anomalies clearly flagged and documented</div>
                <p className="text-base text-gray-400 text-center">
                  Results include coherence scores and anomaly flags for further analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white border border-blue-200 shadow-2xl rounded-2xl">
            <div className="p-16 text-center">
              <h3 className="text-4xl font-bold text-gray-800 mb-6">
                Ready to Analyze Your Data?
              </h3>
              <p className="text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Start detecting anomalies in your meteorological data today.
                Upload your CSV file and get professional-grade analysis results.
              </p>
              <Link href="/dashboard">
                <button className="bg-blue-500 hover:bg-blue-600 text-white text-xl px-10 py-7 rounded-lg font-semibold flex mx-auto items-center justify-center transition-colors shadow-lg">
                  Get Started Now
                  <ArrowRight className="ml-2 h-6 w-6" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
