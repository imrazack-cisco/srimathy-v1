import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type BenchmarkResult = {
  model: string;
  provider: string;
  promptId: string;
  grade: string;
  subject: string;
  latencyMs: number;
  loadDurationMs?: number;
  promptTokens?: number;
  outputTokens?: number;
  tokensPerSecond?: number;
  responseLength: number;
  response: string;
  error?: string;
};

type BenchmarkFile = {
  generatedAt: string;
  benchmark: string;
  results: BenchmarkResult[];
};

type ModelBenchmark = {
  provider: string;
  model: string;
  runs: number;
  successfulRuns: number;
  failedRuns: number;
  averageLatencyMs: number;
  averageLatencySec: number;
  averageTokensPerSecond: number | null;
  online: boolean;
  results: BenchmarkResult[];
};

export async function GET() {
  try {
    const directory = path.join(
      process.cwd(),
      "benchmark-results"
    );

    if (!fs.existsSync(directory)) {
      return NextResponse.json({
        success: false,
        error: "No benchmark-results directory found.",
      });
    }

    const files = fs
      .readdirSync(directory)
      .filter(
        (file) =>
          file.startsWith("q3-q4-circuit-") &&
          file.endsWith(".json")
      )
      .map((file) => {
        const fullPath = path.join(
          directory,
          file
        );

        return {
          file,
          fullPath,
          mtime: fs.statSync(fullPath).mtimeMs,
        };
      })
      .sort(
        (a, b) =>
          b.mtime - a.mtime
      );

    if (files.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No benchmark results found.",
      });
    }

    const latest = files[0];

    const data = JSON.parse(
      fs.readFileSync(
        latest.fullPath,
        "utf-8"
      )
    ) as BenchmarkFile;

    const groups =
      new Map<
        string,
        BenchmarkResult[]
      >();

    for (
      const result of data.results ?? []
    ) {
      const key =
        `${result.provider}|${result.model}`;

      const existing =
        groups.get(key);

      if (existing) {
        existing.push(result);
      } else {
        groups.set(
          key,
          [result]
        );
      }
    }

    const models: ModelBenchmark[] =
      Array.from(
        groups.entries()
      ).map(
        ([key, group]) => {

          const [
            provider,
            model,
          ] = key.split("|");

          // ==================================================
          // LATENCY
          // ==================================================

          const validLatency =
            group.filter(
              (
                item
              ): item is BenchmarkResult =>
                typeof item.latencyMs ===
                  "number" &&
                Number.isFinite(
                  item.latencyMs
                ) &&
                item.latencyMs > 0
            );

          const latency =
            validLatency.length > 0
              ? validLatency.reduce(
                  (
                    sum,
                    item
                  ) =>
                    sum +
                    item.latencyMs,
                  0
                ) /
                validLatency.length
              : 0;

          // ==================================================
          // TOKENS / SECOND
          // ==================================================

          const throughputValues =
            group
              .map(
                (
                  item
                ) =>
                  item.tokensPerSecond
              )
              .filter(
                (
                  value
                ): value is number =>
                  typeof value ===
                    "number" &&
                  Number.isFinite(
                    value
                  ) &&
                  value > 0
              );

          const throughput =
            throughputValues.length > 0
              ? throughputValues.reduce(
                  (
                    sum: number,
                    value: number
                  ) =>
                    sum + value,
                  0
                ) /
                throughputValues.length
              : null;

          // ==================================================
          // SUCCESS / FAILURE
          // ==================================================

          const successfulRuns =
            group.filter(
              (item) =>
                !item.error
            ).length;

          const failedRuns =
            group.length -
            successfulRuns;

          return {
            provider,
            model,

            runs:
              group.length,

            successfulRuns,

            failedRuns,

            averageLatencyMs:
              Math.round(
                latency
              ),

            averageLatencySec:
              Number(
                (
                  latency /
                  1000
                ).toFixed(3)
              ),

            averageTokensPerSecond:
              throughput !== null
                ? Number(
                    throughput.toFixed(
                      1
                    )
                  )
                : null,

            online:
              successfulRuns > 0,

            results:
              group,
          };
        }
      );

    // ========================================================
    // FIND MODELS
    // ========================================================

    const q3 =
      models.find(
        (item) =>
          item.model ===
          "gemma3:4b-q3"
      ) ?? null;

    const q4 =
      models.find(
        (item) =>
          item.model ===
          "gemma3:4b"
      ) ?? null;

    const circuit =
      models.find(
        (item) =>
          item.provider ===
            "CIRCUIT" ||
          item.provider ===
            "circuit"
      ) ?? null;

    // ========================================================
    // COMPARISONS
    // ========================================================

    const q3Latency =
      q3?.averageLatencyMs ?? 0;

    const q4Latency =
      q4?.averageLatencyMs ?? 0;

    const circuitLatency =
      circuit?.averageLatencyMs ?? 0;

    const q3VsQ4 =
      q3Latency > 0 &&
      q4Latency > 0
        ? Number(
            (
              (
                (q4Latency -
                  q3Latency) /
                q4Latency
              ) *
              100
            ).toFixed(1)
          )
        : null;

    const circuitVsQ3 =
      circuitLatency > 0 &&
      q3Latency > 0
        ? Number(
            (
              q3Latency /
              circuitLatency
            ).toFixed(1)
          )
        : null;

    const circuitVsQ4 =
      circuitLatency > 0 &&
      q4Latency > 0
        ? Number(
            (
              q4Latency /
              circuitLatency
            ).toFixed(1)
          )
        : null;

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,

      generatedAt:
        data.generatedAt,

      file:
        latest.file,

      benchmark:
        data.benchmark,

      models,

      comparison: {
        q3VsQ4,
        circuitVsQ3,
        circuitVsQ4,
      },

      q3,
      q4,
      circuit,
    });

  } catch (error) {

    console.error(
      "Latest benchmark API failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to read benchmark.",
      },
      {
        status: 500,
      }
    );
  }
}
