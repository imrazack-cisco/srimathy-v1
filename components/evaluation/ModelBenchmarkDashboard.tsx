"use client";

import { useEffect, useState } from "react";

interface ModelResult {
  provider: string;
  model: string;
  quantization?: string;
  measurements: number;
  successfulRuns: number;
  avgLatencyMs: number | null;
  medianLatencyMs?: number | null;
  avgTokensPerSecond: number | null;
  minLatencyMs?: number | null;
  maxLatencyMs?: number | null;
  measured: boolean;
  note?: string;
}

interface BenchmarkResponse {
  success: boolean;
  generatedAt: string;
  benchmark: string;
  sourceFile: string;
  totalMeasurements: number;
  hardware?: {
    platform?: string;
    processor?: string;
    cpuCores?: number;
    memoryGB?: number;
    runtime?: string;
  };
  models: {
    q4?: ModelResult;
    q8?: ModelResult;
    circuit?: ModelResult;
  };
  comparison?: {
    q8VsQ4ThroughputPercent?: number | null;
    q8VsQ4LatencyPercent?: number | null;
    circuitVsQ4LatencyPercent?: number | null;
    circuitVsQ8LatencyPercent?: number | null;
  };
}

interface HardwareResponse {
  success: boolean;
  sourceFile?: string;
  hardware?: {
    platform?: string;
    processor?: string;
    cpuCores?: number;
    memoryGB?: number;
    memoryType?: string;
    runtime?: string;
  };
  models?: {
    q4?: {
      quantization: string;
      model: string;
      measurements: number;
      avgTotalLatencyMs: number;
      medianTotalLatencyMs: number;
      avgPrefillLatencyMs: number;
      avgGenerationTokensPerSecond: number;
      maxPeakUnifiedMemoryGB: number;
      maxMemoryDeltaGB: number;
      avgLoadDurationMs: number;
      measured: boolean;
    };
    q8?: {
      quantization: string;
      model: string;
      measurements: number;
      avgTotalLatencyMs: number;
      medianTotalLatencyMs: number;
      avgPrefillLatencyMs: number;
      avgGenerationTokensPerSecond: number;
      maxPeakUnifiedMemoryGB: number;
      maxMemoryDeltaGB: number;
      avgLoadDurationMs: number;
      measured: boolean;
    };
  };
  edgeHardwareStatus?: {
    tested: boolean;
    note?: string;
  };
}

function formatLatency(ms: number | null | undefined) {
  if (ms === null || ms === undefined) {
    return "Not measured";
  }

  return `${(ms / 1000).toFixed(3)} sec`;
}

function formatThroughput(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Not measured";
  }

  return `${value.toFixed(1)} tok/s`;
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Not available";
  }

  return `${Math.abs(value).toFixed(1)}%`;
}

function statusClass(measured: boolean) {
  return measured
    ? "bg-emerald-500/10 text-emerald-300"
    : "bg-slate-700 text-slate-400";
}

function ModelCard({
  label,
  model,
  quantization,
  result,
  mode,
}: {
  label: string;
  model: string;
  quantization: string;
  result?: ModelResult;
  mode: "OFFLINE" | "ONLINE";
}) {
  const measured = result?.measured === true;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
      <div className="flex items-center justify-between">
        <div className="text-sm uppercase tracking-widest text-slate-500">
          {label}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
            measured
          )}`}
        >
          {measured ? mode : "NOT MEASURED"}
        </span>
      </div>

      <h4 className="mt-5 text-xl font-bold text-white">
        {model}
      </h4>

      <p className="mt-1 text-sm text-slate-500">
        {quantization}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Avg Latency
          </p>

          <p className="mt-2 text-2xl font-bold text-cyan-400">
            {formatLatency(result?.avgLatencyMs)}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Throughput
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {formatThroughput(result?.avgTokensPerSecond)}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {measured
          ? `${result?.successfulRuns ?? 0}/${result?.measurements ?? 0} successful runs`
          : result?.note ?? "No benchmark measurement available."}
      </p>
    </div>
  );
}

function HardwareMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

export default function ModelBenchmarkDashboard() {
  const [benchmark, setBenchmark] =
    useState<BenchmarkResponse | null>(null);

  const [hardware, setHardware] =
    useState<HardwareResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        benchmarkResponse,
        hardwareResponse,
      ] = await Promise.all([
        fetch("/api/benchmark/latest", {
          cache: "no-store",
        }),
        fetch("/api/benchmark/hardware", {
          cache: "no-store",
        }),
      ]);

      if (!benchmarkResponse.ok) {
        throw new Error(
          "Benchmark API failed."
        );
      }

      const benchmarkData =
        await benchmarkResponse.json();

      const hardwareData =
        hardwareResponse.ok
          ? await hardwareResponse.json()
          : null;

      if (!benchmarkData.success) {
        throw new Error(
          benchmarkData.error ??
            "Benchmark data unavailable."
        );
      }

      setBenchmark(benchmarkData);
      setHardware(hardwareData);
    } catch (err) {
      console.error(
        "Benchmark dashboard load failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load benchmark data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <section className="mt-10 rounded-2xl border border-slate-700 bg-slate-950 p-8">
        <div className="text-cyan-400">
          Loading empirical benchmark data...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-10 rounded-2xl border border-red-900 bg-red-950/20 p-8">
        <div className="font-semibold text-red-300">
          Benchmark dashboard error
        </div>

        <p className="mt-2 text-sm text-red-200/70">
          {error}
        </p>
      </section>
    );
  }

  if (!benchmark) {
    return null;
  }

  const q4 = benchmark.models.q4;
  const q8 = benchmark.models.q8;
  const circuit = benchmark.models.circuit;

  const q4Hardware =
    hardware?.models?.q4;

  const q8Hardware =
    hardware?.models?.q8;

  const measuredModels = [
    {
      name: "Gemma 3 4B Q4_K_M",
      result: q4,
    },
    {
      name: "Gemma 3 4B Q8_0",
      result: q8,
    },
    {
      name: "Gemini 3.1 Flash Lite",
      result: circuit,
    },
  ].filter(
    (item) =>
      item.result?.measured &&
      item.result.avgLatencyMs !== null &&
      item.result.avgLatencyMs !== undefined
  );

  const fastest =
    measuredModels.length > 0
      ? measuredModels.reduce((a, b) =>
          (a.result!.avgLatencyMs ?? Infinity) <
          (b.result!.avgLatencyMs ?? Infinity)
            ? a
            : b
        )
      : null;

  return (
    <section className="mt-10 rounded-2xl border border-slate-700 bg-slate-950/90 p-8 shadow-xl">

      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm uppercase tracking-widest text-cyan-400">
            Benchmark Suite
          </div>

          <h2 className="mt-2 text-3xl font-bold text-white">
            Local Quantization & Cloud Comparison
          </h2>

          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Empirical comparison of Gemma 3 4B
            quantization levels running locally
            through Ollama against Cisco CIRCUIT
            cloud inference.
          </p>
        </div>

        <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300">
          MEASURED DATA ONLY
        </div>
      </div>

      {/* HARDWARE */}
      <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-6">

        <div className="text-sm uppercase tracking-widest text-cyan-400">
          Local Hardware Baseline
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-4">

          <HardwareMetric
            label="Platform"
            value={
              hardware?.hardware?.platform ??
              benchmark.hardware?.platform ??
              "Not recorded"
            }
          />

          <HardwareMetric
            label="Processor"
            value={
              hardware?.hardware?.processor ??
              benchmark.hardware?.processor ??
              "Not recorded"
            }
          />

          <HardwareMetric
            label="CPU Cores"
            value={
              hardware?.hardware?.cpuCores?.toString() ??
              benchmark.hardware?.cpuCores?.toString() ??
              "Not recorded"
            }
          />

          <HardwareMetric
            label="Memory"
            value={
              hardware?.hardware?.memoryGB
                ? `${hardware.hardware.memoryGB} GB`
                : benchmark.hardware?.memoryGB
                  ? `${benchmark.hardware.memoryGB} GB`
                  : "Not recorded"
            }
          />

        </div>

        <p className="mt-5 text-xs text-slate-500">
          {hardware?.hardware?.runtime ??
            benchmark.hardware?.runtime ??
            "Runtime not recorded"}
        </p>
      </div>

      {/* MODEL CARDS */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">

        <ModelCard
          label="OLLAMA"
          model="Gemma 3 4B · Q4_K_M"
          quantization="4-bit quantization"
          result={q4}
          mode="OFFLINE"
        />

        <ModelCard
          label="OLLAMA"
          model="Gemma 3 4B · Q8_0"
          quantization="8-bit quantization"
          result={q8}
          mode="OFFLINE"
        />

        <ModelCard
          label="CIRCUIT"
          model="Gemini 3.1 Flash Lite"
          quantization="Cloud inference"
          result={circuit}
          mode="ONLINE"
        />

      </div>

      {/* FASTEST */}
      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-6">

        <div className="text-xs uppercase tracking-widest text-slate-500">
          Fastest Measured Inference
        </div>

        <div className="mt-3 text-2xl font-bold text-white">
          {fastest
            ? fastest.name
            : "Not enough measurements"}
        </div>

        {fastest && (
          <p className="mt-2 text-sm text-slate-400">
            {formatLatency(
              fastest.result?.avgLatencyMs
            )} average latency
          </p>
        )}

      </div>

      {/* QUANTIZATION IMPACT */}
      <div className="mt-8">

        <h3 className="text-xl font-bold text-white">
          Quantization Impact
        </h3>

        <p className="mt-2 text-sm text-slate-400">
          Q4 and Q8 are compared only when both
          have actual benchmark measurements.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-3">

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Q4 Throughput
            </p>

            <p className="mt-2 text-2xl font-bold text-cyan-400">
              {formatThroughput(
                q4?.avgTokensPerSecond
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Q8 Throughput
            </p>

            <p className="mt-2 text-2xl font-bold text-cyan-400">
              {formatThroughput(
                q8?.avgTokensPerSecond
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Q8 vs Q4
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {formatPercent(
                benchmark.comparison
                  ?.q8VsQ4ThroughputPercent
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              throughput difference
            </p>
          </div>

        </div>
      </div>

      {/* HARDWARE PROFILE */}
      {(q4Hardware || q8Hardware) && (
        <div className="mt-8">

          <h3 className="text-xl font-bold text-white">
            Edge / Hardware Profiling
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Measurements captured during local
            inference on the development hardware.
          </p>

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-700">

            <table className="w-full text-left text-sm">

              <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">
                    Metric
                  </th>
                  <th className="px-5 py-4">
                    Q4_K_M
                  </th>
                  <th className="px-5 py-4">
                    Q8_0
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">

                <tr>
                  <td className="px-5 py-4 text-slate-400">
                    Avg total latency
                  </td>

                  <td className="px-5 py-4 font-semibold text-white">
                    {q4Hardware
                      ? `${q4Hardware.avgTotalLatencyMs.toFixed(0)} ms`
                      : "Not measured"}
                  </td>

                  <td className="px-5 py-4 font-semibold text-white">
                    {q8Hardware
                      ? `${q8Hardware.avgTotalLatencyMs.toFixed(0)} ms`
                      : "Not measured"}
                  </td>
                </tr>

                <tr>
                  <td className="px-5 py-4 text-slate-400">
                    Prefill latency
                  </td>

                  <td className="px-5 py-4 font-semibold text-white">
                    {q4Hardware
                      ? `${q4Hardware.avgPrefillLatencyMs.toFixed(2)} ms`
                      : "Not measured"}
                  </td>

                  <td className="px-5 py-4 font-semibold text-white">
                    {q8Hardware
                      ? `${q8Hardware.avgPrefillLatencyMs.toFixed(2)} ms`
                      : "Not measured"}
                  </td>
                </tr>

                <tr>
                  <td className="px-5 py-4 text-slate-400">
                    Generation speed
                  </td>

                  <td className="px-5 py-4 font-semibold text-cyan-400">
                    {q4Hardware
                      ? `${q4Hardware.avgGenerationTokensPerSecond.toFixed(2)} tok/s`
                      : "Not measured"}
                  </td>

                  <td className="px-5 py-4 font-semibold text-cyan-400">
                    {q8Hardware
                      ? `${q8Hardware.avgGenerationTokensPerSecond.toFixed(2)} tok/s`
                      : "Not measured"}
                  </td>
                </tr>

                <tr>
                  <td className="px-5 py-4 text-slate-400">
                    Peak unified memory
                  </td>

                  <td className="px-5 py-4 font-semibold text-white">
                    {q4Hardware
                      ? `${q4Hardware.maxPeakUnifiedMemoryGB.toFixed(2)} GB`
                      : "Not measured"}
                  </td>

                  <td className="px-5 py-4 font-semibold text-white">
                    {q8Hardware
                      ? `${q8Hardware.maxPeakUnifiedMemoryGB.toFixed(2)} GB`
                      : "Not measured"}
                  </td>
                </tr>

                <tr>
                  <td className="px-5 py-4 text-slate-400">
                    Model load duration
                  </td>

                  <td className="px-5 py-4 font-semibold text-white">
                    {q4Hardware
                      ? `${q4Hardware.avgLoadDurationMs.toFixed(0)} ms`
                      : "Not measured"}
                  </td>

                  <td className="px-5 py-4 font-semibold text-white">
                    {q8Hardware
                      ? `${q8Hardware.avgLoadDurationMs.toFixed(0)} ms`
                      : "Not measured"}
                  </td>
                </tr>

              </tbody>

            </table>

          </div>

          <p className="mt-4 text-xs text-slate-500">
            Memory measurements represent macOS
            unified-memory usage during inference,
            not dedicated VRAM or model-only allocation.
          </p>

          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <p className="text-sm font-semibold text-amber-300">
              Edge hardware status
            </p>

            <p className="mt-2 text-sm text-slate-400">
              {hardware?.edgeHardwareStatus?.tested
                ? "Edge hardware measurements included."
                : "Raspberry Pi 5 / Jetson Nano measurements have not yet been performed."}
            </p>
          </div>

        </div>
      )}

      {/* DATA PROVENANCE */}
      <div className="mt-8 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">

        <div className="text-xs uppercase tracking-widest text-cyan-400">
          Measurement Provenance
        </div>

        <p className="mt-3 text-sm text-slate-300">
          All displayed performance values are loaded
          dynamically from the latest SRIMATHY benchmark
          artifacts. No benchmark latency or throughput
          values are hard-coded into this dashboard.
        </p>

        <p className="mt-3 text-xs text-slate-500">
          Source: {benchmark.sourceFile}
          {" · "}
          {benchmark.totalMeasurements} measurements
          {" · "}
          {new Date(
            benchmark.generatedAt
          ).toLocaleString()}
        </p>

      </div>

    </section>
  );
}