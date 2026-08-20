"use client";

import { useEffect, useState } from "react";

interface Telemetry {
  timestamp: string;
  provider: string;
  model: string;

  latencyMs: number;

  promptTokens?: number;
  outputTokens?: number;
  totalTokens?: number;

  promptEvalMs?: number;
  generationMs?: number;

  tokensPerSecond?: number;

  fallback: boolean;
}

interface TelemetryResponse {
  success: boolean;
  telemetry: Telemetry | null;
}

export default function LiveResearchPanel() {
  const [telemetry, setTelemetry] =
    useState<Telemetry | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  async function fetchTelemetry() {
    try {
      const response = await fetch(
        "/api/telemetry",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Telemetry unavailable");
      }

      const data: TelemetryResponse =
        await response.json();

      if (data.success) {
        setTelemetry(data.telemetry);
        setError(false);
      }

    } catch (err) {

      console.error(
        "Telemetry fetch failed:",
        err
      );

      setError(true);

    } finally {

      setLoading(false);

    }
  }

  useEffect(() => {

    fetchTelemetry();

    const interval =
      setInterval(
        fetchTelemetry,
        2000
      );

    return () =>
      clearInterval(interval);

  }, []);

  const online =
    !error;

  return (
    <section className="mt-8">

      {/* Header */}

      <div className="flex items-center justify-between mb-4">

        <div>

          <h2 className="text-2xl font-bold">
            🔬 Live Research Telemetry
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Real-time edge inference measurements
          </p>

        </div>

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            online
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/10 text-red-400 border border-red-500/30"
          }`}
        >

          <span
            className={`w-2 h-2 rounded-full ${
              online
                ? "bg-emerald-400 animate-pulse"
                : "bg-red-400"
            }`}
          />

          {online
            ? "Telemetry Online"
            : "Telemetry Offline"}

        </div>

      </div>


      {/* Main telemetry card */}

      <div className="rounded-2xl border border-cyan-500/20 bg-slate-800/70 backdrop-blur-sm p-6">

        {/* Runtime identity */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

          <TelemetryBox
            label="Model"
            value={
              telemetry?.model ??
              "gemma3:4b"
            }
          />

          <TelemetryBox
            label="Inference"
            value={
              telemetry?.provider ??
              "Ollama Local"
            }
          />

          <TelemetryBox
            label="Execution"
            value="100% Local"
          />

          <TelemetryBox
            label="Fallback"
            value={
              telemetry
                ? telemetry.fallback
                  ? "Yes"
                  : "No"
                : "—"
            }
          />

        </div>


        {/* Metrics */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <Metric
            label="Latency"
            value={
              telemetry
                ? `${(
                    telemetry.latencyMs / 1000
                  ).toFixed(2)}s`
                : "—"
            }
          />

          <Metric
            label="Tokens / sec"
            value={
              telemetry?.tokensPerSecond
                ? telemetry.tokensPerSecond.toFixed(
                    1
                  )
                : "—"
            }
          />

          <Metric
            label="Prompt Tokens"
            value={
              telemetry?.promptTokens?.toString() ??
              "—"
            }
          />

          <Metric
            label="Output Tokens"
            value={
              telemetry?.outputTokens?.toString() ??
              "—"
            }
          />

        </div>


        {/* Detailed measurements */}

        <div className="mt-6 pt-5 border-t border-slate-700">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <Detail
              label="Total Tokens"
              value={
                telemetry?.totalTokens?.toString() ??
                "—"
              }
            />

            <Detail
              label="Prompt Evaluation"
              value={
                telemetry?.promptEvalMs
                  ? `${telemetry.promptEvalMs.toFixed(
                      0
                    )} ms`
                  : "—"
              }
            />

            <Detail
              label="Generation"
              value={
                telemetry?.generationMs
                  ? `${(
                      telemetry.generationMs /
                      1000
                    ).toFixed(2)} s`
                  : "—"
              }
            />

          </div>

        </div>


        {/* Research status */}

        <div className="mt-6 flex flex-wrap gap-3">

          <ResearchBadge>
            🧠 Local SLM
          </ResearchBadge>

          <ResearchBadge>
            🦙 Ollama
          </ResearchBadge>

          <ResearchBadge>
            🔒 Zero Cloud Inference
          </ResearchBadge>

          <ResearchBadge>
            📊 Live Measurements
          </ResearchBadge>

        </div>


        {loading && !telemetry && (

          <p className="mt-4 text-xs text-slate-500">
            Waiting for first inference...
          </p>

        )}

      </div>

    </section>
  );
}


/* -------------------------------- */
/* Supporting components             */
/* -------------------------------- */

function TelemetryBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-xl bg-slate-900/70 border border-slate-700 p-4">

      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-semibold text-cyan-300 truncate">
        {value}
      </p>

    </div>

  );
}


function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-xl bg-slate-900/70 p-5">

      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-white">
        {value}
      </p>

    </div>

  );
}


function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div>

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-200">
        {value}
      </p>

    </div>

  );

}


function ResearchBadge({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <span className="px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">

      {children}

    </span>

  );

}