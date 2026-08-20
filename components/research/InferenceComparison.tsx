"use client";

import { useMemo, useState } from "react";

type BenchmarkStatus = "MEASURED" | "PENDING";

interface BenchmarkResult {
  provider: string;
  model: string;
  quantization: string;
  execution: string;
  status: BenchmarkStatus;

  totalMs?: number;
  prefillMs?: number;
  generationMs?: number;
  tokensPerSecond?: number;
  memoryGb?: number;

  network: string;
  privacy: string;
}

const benchmarkData: BenchmarkResult[] = [
  {
    provider: "Ollama",
    model: "Gemma 3 4B",
    quantization: "Q4_K_M",
    execution: "Local GPU",
    status: "MEASURED",

    totalMs: 6666.53,
    prefillMs: 43.05,
    generationMs: 6389.53,
    tokensPerSecond: 82.42,
    memoryGb: 3.7,

    network: "None",
    privacy: "On-device",
  },

  {
    provider: "Ollama",
    model: "Gemma 3 4B",
    quantization: "Q3",
    execution: "Local GPU",
    status: "PENDING",

    network: "None",
    privacy: "On-device",
  },

  {
    provider: "Cisco CIRCUIT",
    model: "gemini-3.1-flash-lite",
    quantization: "N/A",
    execution: "Cloud API",
    status: "MEASURED",

    // Last verified CIRCUIT test shown in your UI.
    totalMs: 1862,

    network: "Required",
    privacy: "Cloud",
  },
];

function Metric({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-950/60 px-4 py-3">
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div
        className={`mt-1 text-sm font-semibold ${
          muted
            ? "text-slate-500"
            : "text-slate-200"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: BenchmarkStatus;
}) {
  if (status === "MEASURED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        MEASURED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      PENDING
    </span>
  );
}

export default function InferenceComparison() {
  const [view, setView] = useState<
    "overview" | "latency" | "deployment"
  >("overview");

  const q4 = benchmarkData[0];
  const q3 = benchmarkData[1];
  const circuit = benchmarkData[2];

  const q4VsCircuit = useMemo(() => {
    if (!q4.totalMs || !circuit.totalMs) {
      return null;
    }

    return (
      circuit.totalMs /
      q4.totalMs
    ).toFixed(2);
  }, [q4.totalMs, circuit.totalMs]);

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-xl">
              📊
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                Inference Analytics
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Controlled comparison of local and cloud inference
              </p>
            </div>

          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-2 text-right">

          <div className="text-xs text-slate-500">
            Benchmark platform
          </div>

          <div className="mt-1 text-sm font-semibold text-cyan-400">
            Apple M5 Pro • 24 GB
          </div>

        </div>

      </div>

      {/* TABS */}

      <div className="mt-6 flex gap-2 border-b border-slate-800">

        <button
          onClick={() => setView("overview")}
          className={`px-4 py-3 text-sm font-medium transition ${
            view === "overview"
              ? "border-b-2 border-cyan-400 text-cyan-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setView("latency")}
          className={`px-4 py-3 text-sm font-medium transition ${
            view === "latency"
              ? "border-b-2 border-cyan-400 text-cyan-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Performance
        </button>

        <button
          onClick={() => setView("deployment")}
          className={`px-4 py-3 text-sm font-medium transition ${
            view === "deployment"
              ? "border-b-2 border-cyan-400 text-cyan-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Deployment
        </button>

      </div>

      {/* ================================================== */}
      {/* OVERVIEW                                            */}
      {/* ================================================== */}

      {view === "overview" && (

        <div className="mt-6">

          {/* MODEL CARDS */}

          <div className="grid gap-4 lg:grid-cols-3">

            {benchmarkData.map((item) => (

              <div
                key={`${item.provider}-${item.quantization}`}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"
              >

                <div className="flex items-start justify-between">

                  <div>

                    <div className="text-xs uppercase tracking-wider text-slate-500">
                      {item.provider}
                    </div>

                    <h3 className="mt-2 text-lg font-bold text-white">
                      {item.model}
                    </h3>

                  </div>

                  <StatusBadge status={item.status} />

                </div>

                <div className="mt-5 space-y-3">

                  <Metric
                    label="Quantization"
                    value={item.quantization}
                  />

                  <Metric
                    label="Execution"
                    value={item.execution}
                  />

                  <Metric
                    label="Total latency"
                    value={
                      item.totalMs
                        ? `${item.totalMs.toFixed(0)} ms`
                        : "Awaiting benchmark"
                    }
                    muted={
                      item.status === "PENDING"
                    }
                  />

                  <Metric
                    label="Tokens / sec"
                    value={
                      item.tokensPerSecond
                        ? item.tokensPerSecond.toFixed(2)
                        : "Awaiting benchmark"
                    }
                    muted={
                      item.status === "PENDING"
                    }
                  />

                </div>

              </div>

            ))}

          </div>

          {/* KEY FINDING */}

          <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">

            <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Current research finding
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-300">

              The current Q4_K_M local baseline generates at approximately{" "}
              <strong className="text-white">
                82.42 tokens/sec
              </strong>{" "}
              with an average end-to-end inference time of{" "}
              <strong className="text-white">
                6.67 seconds
              </strong>.
              The CIRCUIT path is currently verified as operational,
              but introduces network-dependent latency.

            </p>

            {q4VsCircuit && (

              <p className="mt-3 text-sm text-slate-400">

                Based on the latest measured values, the CIRCUIT request
                latency is approximately{" "}
                <strong className="text-cyan-400">
                  {q4VsCircuit}×
                </strong>{" "}
                the Q4 local total latency.

              </p>

            )}

          </div>

        </div>

      )}

      {/* ================================================== */}
      {/* PERFORMANCE                                         */}
      {/* ================================================== */}

      {view === "latency" && (

        <div className="mt-6">

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <Metric
              label="Q4 Average Total"
              value="6,666.53 ms"
            />

            <Metric
              label="Q4 Prefill"
              value="43.05 ms"
            />

            <Metric
              label="Q4 Generation"
              value="6,389.53 ms"
            />

            <Metric
              label="Q4 Generation Speed"
              value="82.42 tok/s"
            />

          </div>

          {/* PERFORMANCE BAR */}

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h3 className="font-semibold text-white">
                  Relative latency
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Lower is better
                </p>
              </div>

            </div>

            <div className="space-y-5">

              {/* Q4 */}

              <div>

                <div className="mb-2 flex justify-between text-sm">

                  <span className="text-slate-300">
                    Ollama • Q4_K_M
                  </span>

                  <span className="text-cyan-400">
                    6.67 s
                  </span>

                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-800">

                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{
                      width: "100%",
                    }}
                  />

                </div>

              </div>

              {/* CIRCUIT */}

              <div>

                <div className="mb-2 flex justify-between text-sm">

                  <span className="text-slate-300">
                    Cisco CIRCUIT
                  </span>

                  <span className="text-purple-400">
                    1.86 s*
                  </span>

                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-800">

                  <div
                    className="h-full rounded-full bg-purple-400"
                    style={{
                      width: "28%",
                    }}
                  />

                </div>

              </div>

              {/* Q3 */}

              <div>

                <div className="mb-2 flex justify-between text-sm">

                  <span className="text-slate-300">
                    Ollama • Q3
                  </span>

                  <span className="text-amber-400">
                    Pending
                  </span>

                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-800">

                  <div
                    className="h-full rounded-full bg-amber-400/30"
                    style={{
                      width: "15%",
                    }}
                  />

                </div>

              </div>

            </div>

            <p className="mt-5 text-xs text-slate-600">
              * CIRCUIT value represents the latest verified API
              request latency, not equivalent local generation telemetry.
            </p>

          </div>

          {/* EXPERIMENT NOTES */}

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">

            <h3 className="font-semibold text-white">
              Experimental interpretation
            </h3>

            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">

              <li>
                • Q4 measurements were obtained from three Ollama
                inference runs.
              </li>

              <li>
                • Prefill averaged only 43.05 ms, while generation
                dominated total latency.
              </li>

              <li>
                • Local generation achieved approximately 82.42
                tokens/sec.
              </li>

              <li>
                • Q3 must be benchmarked using the same prompt and
                number of runs before drawing conclusions.
              </li>

            </ul>

          </div>

        </div>

      )}

      {/* ================================================== */}
      {/* DEPLOYMENT                                          */}
      {/* ================================================== */}

      {view === "deployment" && (

        <div className="mt-6">

          <div className="grid gap-4 lg:grid-cols-3">

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">

              <div className="text-xs uppercase tracking-wider text-emerald-400">
                Primary
              </div>

              <h3 className="mt-2 text-xl font-bold text-white">
                Ollama Q4
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Local-first inference. No network dependency.
                Suitable for privacy-sensitive educational data.
              </p>

              <div className="mt-5 space-y-2 text-sm">

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Network
                  </span>

                  <span className="text-emerald-400">
                    None
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Privacy
                  </span>

                  <span className="text-emerald-400">
                    On-device
                  </span>
                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">

              <div className="text-xs uppercase tracking-wider text-amber-400">
                Experiment
              </div>

              <h3 className="mt-2 text-xl font-bold text-white">
                Ollama Q3
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Lower-precision local model configuration intended
                to evaluate the memory/performance trade-off.
              </p>

              <div className="mt-5">

                <StatusBadge status="PENDING" />

              </div>

            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">

              <div className="text-xs uppercase tracking-wider text-purple-400">
                Backup
              </div>

              <h3 className="mt-2 text-xl font-bold text-white">
                Cisco CIRCUIT
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Cloud fallback path used when local inference is
                unavailable or unsuitable.
              </p>

              <div className="mt-5 space-y-2 text-sm">

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Network
                  </span>

                  <span className="text-purple-400">
                    Required
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Status
                  </span>

                  <span className="text-emerald-400">
                    Verified
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* RESEARCH MATRIX */}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">

            <div className="border-b border-slate-800 bg-slate-950/70 p-5">

              <h3 className="font-semibold text-white">
                Deployment comparison
              </h3>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="bg-slate-950">

                  <tr className="text-xs uppercase tracking-wider text-slate-500">

                    <th className="px-5 py-4">
                      Dimension
                    </th>

                    <th className="px-5 py-4">
                      Ollama Q4
                    </th>

                    <th className="px-5 py-4">
                      Ollama Q3
                    </th>

                    <th className="px-5 py-4">
                      CIRCUIT
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-800">

                  <tr>
                    <td className="px-5 py-4 text-slate-400">
                      Execution
                    </td>

                    <td className="px-5 py-4 text-emerald-400">
                      Local
                    </td>

                    <td className="px-5 py-4 text-emerald-400">
                      Local
                    </td>

                    <td className="px-5 py-4 text-purple-400">
                      Cloud
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 text-slate-400">
                      Network
                    </td>

                    <td className="px-5 py-4 text-emerald-400">
                      None
                    </td>

                    <td className="px-5 py-4 text-emerald-400">
                      None
                    </td>

                    <td className="px-5 py-4 text-purple-400">
                      Required
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 text-slate-400">
                      Privacy boundary
                    </td>

                    <td className="px-5 py-4 text-emerald-400">
                      On-device
                    </td>

                    <td className="px-5 py-4 text-emerald-400">
                      On-device
                    </td>

                    <td className="px-5 py-4 text-purple-400">
                      Cloud
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 text-slate-400">
                      Quantization
                    </td>

                    <td className="px-5 py-4 text-cyan-400">
                      Q4_K_M
                    </td>

                    <td className="px-5 py-4 text-amber-400">
                      Q3
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      N/A
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 text-slate-400">
                      Benchmark status
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status="MEASURED" />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status="PENDING" />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status="MEASURED" />
                    </td>
                  </tr>

                </tbody>

              </table>

            </div>

          </div>

        </div>

      )}

    </section>
  );
}