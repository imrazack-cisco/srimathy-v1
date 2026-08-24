import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type HardwareResult = {
  model: string;
  quantization: string;
  run: number;
  loadDurationMs: number | null;
  totalLatencyMs: number;
  prefillLatencyMs: number | null;
  generationLatencyMs: number | null;
  promptTokens: number | null;
  outputTokens: number | null;
  prefillTokensPerSecond: number | null;
  generationTokensPerSecond: number | null;
  peakUsedMemoryGB: number | null;
  baselineUsedMemoryGB: number | null;
  memoryDeltaGB: number | null;
  responseLength: number;
  timestamp: string;
  error?: string;
};

function average(values: number[]): number | null {
  if (!values.length) return null;

  return (
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / values.length
  );
}

function median(values: number[]): number | null {
  if (!values.length) return null;

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  const middle =
    Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (
      (sorted[middle - 1] +
        sorted[middle]) /
      2
    );
  }

  return sorted[middle];
}

function summarize(
  results: HardwareResult[],
  quantization: string
) {
  const rows =
    results.filter(
      (result) =>
        result.quantization === quantization &&
        !result.error
    );

  const totalLatency =
    rows
      .map((r) => r.totalLatencyMs)
      .filter(Number.isFinite);

  const prefill =
    rows
      .map((r) => r.prefillLatencyMs)
      .filter(
        (value): value is number =>
          value !== null &&
          Number.isFinite(value)
      );

  const generation =
    rows
      .map(
        (r) =>
          r.generationTokensPerSecond
      )
      .filter(
        (value): value is number =>
          value !== null &&
          Number.isFinite(value)
      );

  const peakMemory =
    rows
      .map(
        (r) =>
          r.peakUsedMemoryGB
      )
      .filter(
        (value): value is number =>
          value !== null &&
          Number.isFinite(value)
      );

  const memoryDelta =
    rows
      .map(
        (r) =>
          r.memoryDeltaGB
      )
      .filter(
        (value): value is number =>
          value !== null &&
          Number.isFinite(value)
      );

  const load =
    rows
      .map(
        (r) =>
          r.loadDurationMs
      )
      .filter(
        (value): value is number =>
          value !== null &&
          Number.isFinite(value)
      );

  return {
    quantization,

    model:
      rows[0]?.model ??
      null,

    measurements:
      rows.length,

    successfulRuns:
      rows.length,

    avgTotalLatencyMs:
      average(totalLatency),

    medianTotalLatencyMs:
      median(totalLatency),

    minTotalLatencyMs:
      totalLatency.length
        ? Math.min(...totalLatency)
        : null,

    maxTotalLatencyMs:
      totalLatency.length
        ? Math.max(...totalLatency)
        : null,

    avgPrefillLatencyMs:
      average(prefill),

    medianPrefillLatencyMs:
      median(prefill),

    avgGenerationTokensPerSecond:
      average(generation),

    minGenerationTokensPerSecond:
      generation.length
        ? Math.min(...generation)
        : null,

    maxGenerationTokensPerSecond:
      generation.length
        ? Math.max(...generation)
        : null,

    avgPeakUnifiedMemoryGB:
      average(peakMemory),

    maxPeakUnifiedMemoryGB:
      peakMemory.length
        ? Math.max(...peakMemory)
        : null,

    avgMemoryDeltaGB:
      average(memoryDelta),

    maxMemoryDeltaGB:
      memoryDelta.length
        ? Math.max(...memoryDelta)
        : null,

    avgLoadDurationMs:
      average(load),

    measured:
      rows.length > 0,
  };
}

export async function GET() {
  try {
    const directory =
      path.join(
        process.cwd(),
        "benchmark-results"
      );

    if (!fs.existsSync(directory)) {
      return NextResponse.json({
        success: false,
        error:
          "benchmark-results directory does not exist.",
      });
    }

    const files =
      fs
        .readdirSync(directory)
        .filter(
          (file) =>
            file.startsWith(
              "hardware-profile-"
            ) &&
            file.endsWith(".json")
        )
        .map((file) => {
          const fullPath =
            path.join(
              directory,
              file
            );

          return {
            file,
            fullPath,
            modifiedAt:
              fs.statSync(
                fullPath
              ).mtimeMs,
          };
        })
        .sort(
          (a, b) =>
            b.modifiedAt -
            a.modifiedAt
        );

    if (!files.length) {
      return NextResponse.json({
        success: false,
        error:
          "No hardware profiling results found.",
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
      HardwareResult[] =
      Array.isArray(
        benchmark.results
      )
        ? benchmark.results
        : [];

    const q4 =
      summarize(
        results,
        "Q4_K_M"
      );

    const q8 =
      summarize(
        results,
        "Q8_0"
      );

    let generationDifferencePercent:
      number | null = null;

    if (
      q4.avgGenerationTokensPerSecond !==
        null &&
      q8.avgGenerationTokensPerSecond !==
        null &&
      q4.avgGenerationTokensPerSecond > 0
    ) {
      generationDifferencePercent =
        (
          (
            q8.avgGenerationTokensPerSecond -
            q4.avgGenerationTokensPerSecond
          ) /
          q4.avgGenerationTokensPerSecond
        ) *
        100;
    }

    return NextResponse.json({
      success: true,

      sourceFile:
        latest.file,

      generatedAt:
        benchmark.generatedAt ??
        null,

      benchmark:
        benchmark.benchmark ??
        "q4-q8-hardware-profile",

      hardware:
        benchmark.hardware ??
        null,

      prompt:
        benchmark.prompt ??
        null,

      runsPerModel:
        benchmark.runsPerModel ??
        null,

      totalMeasurements:
        results.length,

      models: {
        q4,
        q8,
      },

      comparison: {
        q8VsQ4GenerationPercent:
          generationDifferencePercent,

        note:
          "Memory measurements represent macOS system unified-memory usage during inference, not dedicated VRAM or model-only allocation.",
      },

      edgeHardwareStatus: {
        tested: false,

        note:
          "No Raspberry Pi 5 or NVIDIA Jetson Nano measurements are included in this dataset.",
      },
    });
  } catch (error) {
    console.error(
      "Hardware benchmark API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown hardware benchmark error.",
      },
      {
        status: 500,
      }
    );
  }
}
