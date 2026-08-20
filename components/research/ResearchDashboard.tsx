"use client";

import CircuitStatus from "@/components/ai/CircuitStatus";
import { useEffect, useState } from "react";

import MetricCard from "./MetricCard";

interface ResearchMetrics {
  online: boolean;

  model: string;

  embeddingModel: string;

  inference: string;

  prefillMs: number;

  generationMs: number;

  totalMs: number;

  tokensPerSecond: number;

  promptTokens: number;

  completionTokens: number;

  peakRamMb: number;

  cpuUsage: number;

  retrievedChunks: number;

  retrievalLatency: number;

  confidence: number;

  similarity: number;

  curriculumAlignment: number;

  hallucinationRisk: string;

  privacy: string;

  lastPrompt: string;

  lastUpdated: string;

  experimentCount: number;

  platform: string;

  architecture: string;
}

export default function ResearchDashboard() {
  const [metrics, setMetrics] =
    useState<ResearchMetrics | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await fetch(
          "/api/runtime",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load runtime metrics"
          );
        }

        const data =
          await response.json();

        setMetrics(data);
        setError("");
      } catch (err) {
        console.error(err);

        setError(
          "Unable to connect to SRIMATHY runtime"
        );
      }
    }

    loadMetrics();

    const interval = setInterval(
      loadMetrics,
      2000
    );

    return () =>
      clearInterval(interval);
  }, []);

  function formatTime(
    timestamp: string
  ) {
    if (!timestamp) {
      return "No inference yet";
    }

    return new Date(
      timestamp
    ).toLocaleTimeString();
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="mb-8 flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-white">
            Research Dashboard
          </h1>

          <p className="mt-2 text-slate-400">
            Live experimental telemetry from the
            SRIMATHY edge runtime
          </p>
        </div>

        <div className="flex items-center gap-3">

          <div
            className={`h-3 w-3 rounded-full ${
              metrics?.online
                ? "animate-pulse bg-green-400"
                : "bg-red-400"
            }`}
          />

          <span
            className={
              metrics?.online
                ? "text-green-400"
                : "text-red-400"
            }
          >
            {metrics?.online
              ? "LIVE"
              : "OFFLINE"}
          </span>

        </div>
      </div>

      {/* =========================================
          ERROR
      ========================================= */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}

      {/* =========================================
          AI PROVIDER STATUS
      ========================================= */}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* LOCAL PRIMARY */}

        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-6">

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-semibold text-white">
                Primary AI Runtime
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Offline-first local inference
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              LOCAL
            </div>

          </div>

          <div className="space-y-3">

            <div className="flex items-center justify-between rounded-lg bg-slate-800/80 px-4 py-3">

              <span className="text-slate-400">
                Provider
              </span>

              <span className="font-medium text-emerald-400">
                Ollama
              </span>

            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-800/80 px-4 py-3">

              <span className="text-slate-400">
                Model
              </span>

              <span className="font-medium text-cyan-400">
                {metrics?.model ?? "gemma3:4b"}
              </span>

            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-800/80 px-4 py-3">

              <span className="text-slate-400">
                Execution
              </span>

              <span className="font-medium text-white">
                On-device
              </span>

            </div>

          </div>

        </div>

        {/* CIRCUIT BACKUP */}

        <CircuitStatus />

      </div>

      {/* =========================================
          LIVE INFERENCE RUNTIME
      ========================================= */}

      <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">

        <div className="mb-5 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold text-white">
              Live Inference Runtime
            </h2>

            <p className="text-sm text-slate-500">
              Measurements from the latest real
              Ollama inference
            </p>

          </div>

          <div className="text-right text-xs text-slate-500">

            <div>
              Last update
            </div>

            <div className="mt-1 text-cyan-400">
              {formatTime(
                metrics?.lastUpdated ?? ""
              )}
            </div>

          </div>

        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <MetricCard
            title="Model"
            value={
              metrics?.model ?? "--"
            }
          />

          <MetricCard
            title="Prefill"
            value={
              metrics
                ? `${metrics.prefillMs.toFixed(0)} ms`
                : "--"
            }
            subtitle="Ollama prompt evaluation"
          />

          <MetricCard
            title="Generation"
            value={
              metrics
                ? `${metrics.generationMs.toFixed(0)} ms`
                : "--"
            }
          />

          <MetricCard
            title="Tokens / sec"
            value={
              metrics
                ? metrics.tokensPerSecond.toFixed(2)
                : "--"
            }
          />

        </div>
      </div>

      {/* =========================================
          RESOURCE TELEMETRY
      ========================================= */}

      <div className="mb-6">

        <h2 className="mb-4 text-xl font-semibold text-white">
          Edge Resource Telemetry
        </h2>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <MetricCard
            title="Total Inference"
            value={
              metrics
                ? `${metrics.totalMs.toFixed(0)} ms`
                : "--"
            }
          />

          <MetricCard
            title="Peak RSS"
            value={
              metrics
                ? `${metrics.peakRamMb} MB`
                : "--"
            }
            subtitle="Node process resident memory"
          />

          <MetricCard
            title="CPU"
            value={
              metrics
                ? `${metrics.cpuUsage.toFixed(1)}%`
                : "--"
            }
          />

          <MetricCard
            title="Experiments"
            value={
              metrics?.experimentCount ?? 0
            }
            subtitle="Measured inference runs"
          />

        </div>
      </div>

      {/* =========================================
          TOKEN TELEMETRY
      ========================================= */}

      <div className="mb-6">

        <h2 className="mb-4 text-xl font-semibold text-white">
          Model Telemetry
        </h2>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <MetricCard
            title="Prompt Tokens"
            value={
              metrics?.promptTokens ?? 0
            }
          />

          <MetricCard
            title="Completion Tokens"
            value={
              metrics?.completionTokens ?? 0
            }
          />

          <MetricCard
            title="Retrieved Chunks"
            value={
              metrics?.retrievedChunks ?? 0
            }
          />

          <MetricCard
            title="Retrieval Latency"
            value={
              metrics
                ? `${metrics.retrievalLatency} ms`
                : "--"
            }
          />

        </div>
      </div>

      {/* =========================================
          RESEARCH SIGNALS
      ========================================= */}

      <div className="mb-6">

        <h2 className="mb-4 text-xl font-semibold text-white">
          Research Signals
        </h2>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <MetricCard
            title="Similarity"
            value={
              metrics
                ? metrics.similarity.toFixed(3)
                : "--"
            }
            subtitle="Measured RAG value"
          />

          <MetricCard
            title="Confidence"
            value={
              metrics
                ? `${metrics.confidence}%`
                : "--"
            }
          />

          <MetricCard
            title="Curriculum"
            value={
              metrics
                ? `${metrics.curriculumAlignment}%`
                : "--"
            }
          />

          <MetricCard
            title="Hallucination"
            value={
              metrics?.hallucinationRisk ??
              "UNKNOWN"
            }
          />

        </div>
      </div>

      {/* =========================================
          RUNTIME FOOTER
      ========================================= */}

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">

        <div className="grid gap-4 text-sm md:grid-cols-4">

          <div>
            <div className="text-slate-500">
              Inference
            </div>

            <div className="mt-1 font-medium text-cyan-400">
              {metrics?.inference ?? "--"}
            </div>
          </div>

          <div>
            <div className="text-slate-500">
              Embedding Model
            </div>

            <div className="mt-1 font-medium text-cyan-400">
              {metrics?.embeddingModel ?? "--"}
            </div>
          </div>

          <div>
            <div className="text-slate-500">
              Platform
            </div>

            <div className="mt-1 font-medium text-cyan-400">
              {metrics
                ? `${metrics.platform} / ${metrics.architecture}`
                : "--"}
            </div>
          </div>

          <div>
            <div className="text-slate-500">
              Privacy
            </div>

            <div className="mt-1 font-medium text-green-400">
              {metrics?.privacy ?? "--"}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}