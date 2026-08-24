import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type BenchmarkResult = {
  provider: string;
  model: string;
  promptId: string;
  latencyMs: number;
  tokensPerSecond?: number;
};

type ModelSummary = {
  provider: string;
  model: string;
  quantization: string;
  measurements: number;
  successfulRuns: number;
  avgLatencyMs: number | null;
  medianLatencyMs: number | null;
  avgTokensPerSecond: number | null;
  minLatencyMs: number | null;
  maxLatencyMs: number | null;
  measured: boolean;
};

function median(values: number[]): number | null {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function average(values: number[]): number | null {
  if (!values.length) return null;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function summarize(
  results: BenchmarkResult[],
  provider: string,
  modelMatcher: (model: string) => boolean,
  quantization: string
): ModelSummary {

  const rows = results.filter(
    (r) =>
      r.provider.toLowerCase() === provider.toLowerCase() &&
      modelMatcher(r.model)
  );

  const latencies = rows
    .map((r) => Number(r.latencyMs))
    .filter(Number.isFinite);

  const speeds = rows
    .map((r) => Number(r.tokensPerSecond))
    .filter(Number.isFinite);

  return {
    provider,
    model:
      rows[0]?.model ??
      (quantization === "Q4_K_M"
        ? "gemma3:4b"
        : "gemma3:4b-it-q8_0"),

    quantization,

    measurements:
      rows.length,

    successfulRuns:
      rows.length,

    avgLatencyMs:
      average(latencies),

    medianLatencyMs:
      median(latencies),

    avgTokensPerSecond:
      average(speeds),

    minLatencyMs:
      latencies.length
        ? Math.min(...latencies)
        : null,

    maxLatencyMs:
      latencies.length
        ? Math.max(...latencies)
        : null,

    measured:
      rows.length > 0,
  };
}

export async function GET() {

  try {

    const resultsDirectory =
      path.join(
        process.cwd(),
        "benchmark-results"
      );

    if (!fs.existsSync(resultsDirectory)) {

      return NextResponse.json({
        success: false,
        error:
          "benchmark-results directory does not exist.",
      });

    }

    const files =
      fs
        .readdirSync(resultsDirectory)
        .filter(
          (file) =>
            file.startsWith(
              "q4-q8-circuit-"
            ) &&
            file.endsWith(".json")
        )
        .map((file) => ({
          file,
          fullPath:
            path.join(
              resultsDirectory,
              file
            ),
          mtime:
            fs.statSync(
              path.join(
                resultsDirectory,
                file
              )
            ).mtimeMs,
        }))
        .sort(
          (a, b) =>
            b.mtime - a.mtime
        );

    if (!files.length) {

      return NextResponse.json({
        success: false,
        error:
          "No Q4/Q8 benchmark result files found.",
      });

    }

    const latest =
      files[0];

    const raw =
      fs.readFileSync(
        latest.fullPath,
        "utf8"
      );

    const benchmark =
      JSON.parse(raw);

    const results:
      BenchmarkResult[] =
      Array.isArray(
        benchmark.results
      )
        ? benchmark.results
        : [];

    const q4 =
      summarize(
        results,
        "OLLAMA",
        (model) =>
          model === "gemma3:4b" ||
          model.includes("Q4"),
        "Q4_K_M"
      );

    const q8 =
      summarize(
        results,
        "OLLAMA",
        (model) =>
          model.includes("q8_0") ||
          model.includes("Q8_0"),
        "Q8_0"
      );

    /*
     * CIRCUIT is deliberately NOT inferred
     * from this benchmark because the latest
     * benchmark explicitly skipped CIRCUIT.
     */
    const circuit = {
      provider: "CIRCUIT",
      model:
        process.env.CIRCUIT_MODEL ||
        "gemini-3.1-flash-lite",
      measured: false,
      measurements: 0,
      avgLatencyMs: null,
      medianLatencyMs: null,
      avgTokensPerSecond: null,
      minLatencyMs: null,
      maxLatencyMs: null,
      successfulRuns: 0,
      note:
        "Not measured in the latest Q4/Q8 benchmark because CIRCUIT_URL was not configured.",
    };

    let q8VsQ4ThroughputPercent:
      number | null = null;

    if (
      q4.avgTokensPerSecond !== null &&
      q8.avgTokensPerSecond !== null &&
      q4.avgTokensPerSecond > 0
    ) {

      q8VsQ4ThroughputPercent =
        (
          (q8.avgTokensPerSecond -
            q4.avgTokensPerSecond) /
          q4.avgTokensPerSecond
        ) *
        100;
    }

    return NextResponse.json({
      success: true,

      generatedAt:
        benchmark.generatedAt ??
        null,

      benchmark:
        benchmark.benchmark ??
        "q4-q8-circuit",

      sourceFile:
        latest.file,

      totalMeasurements:
        results.length,

      hardware: {
        platform:
          "Apple MacBook Pro",
        processor:
          "Apple M5 Pro",
        cpuCores:
          15,
        memoryGB:
          24,
        runtime:
          "Ollama 0.32.0 · Apple Silicon",
      },

      models: {
        q4,
        q8,
        circuit,
      },

      comparison: {
        q8VsQ4ThroughputPercent,
        q8VsQ4LatencyPercent:
          q4.avgLatencyMs !== null &&
          q8.avgLatencyMs !== null &&
          q4.avgLatencyMs > 0
            ? (
                (
                  q8.avgLatencyMs -
                  q4.avgLatencyMs
                ) /
                q4.avgLatencyMs
              ) *
              100
            : null,
      },

    });

  } catch (error) {

    console.error(
      "Benchmark API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown benchmark error.",
      },
      {
        status: 500,
      }
    );
  }
}
