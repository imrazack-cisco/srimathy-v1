import os from "os";

export interface InferenceTelemetry {
  model: string;

  promptTokens: number;

  completionTokens: number;

  prefillMs: number;

  generationMs: number;

  totalMs: number;

  tokensPerSecond: number;

  ramMb: number;

  cpuUsage: number;
}

export interface ProfilerSnapshot {
  timestamp: string;

  ramMb: number;

  cpuUsage: number;

  cpuCount: number;

  platform: string;

  architecture: string;
}

function getCpuUsagePercent(
  cpuStart: NodeJS.CpuUsage,
  elapsedMs: number
): number {
  const cpuEnd = process.cpuUsage(cpuStart);

  const cpuTimeMicros =
    cpuEnd.user + cpuEnd.system;

  const elapsedMicros =
    elapsedMs * 1000;

  if (elapsedMicros <= 0) {
    return 0;
  }

  const cpuCount = os.cpus().length;

  const percentage =
    (cpuTimeMicros / elapsedMicros / cpuCount) * 100;

  return Math.min(
    100,
    Math.max(0, percentage)
  );
}

export function createProfiler() {
  const startedAt = performance.now();

  const cpuStart = process.cpuUsage();

  const memoryStart =
    process.memoryUsage().rss;

  return {
    startedAt,

    cpuStart,

    memoryStart,

    finish(): {
      elapsedMs: number;
      ramMb: number;
      cpuUsage: number;
    } {
      const elapsedMs =
        performance.now() - startedAt;

      const ramMb =
        process.memoryUsage().rss /
        1024 /
        1024;

      const cpuUsage =
        getCpuUsagePercent(
          cpuStart,
          elapsedMs
        );

      return {
        elapsedMs,
        ramMb: Math.round(ramMb),
        cpuUsage: Number(
          cpuUsage.toFixed(1)
        ),
      };
    },
  };
}

export function createSnapshot(): ProfilerSnapshot {
  const memory =
    process.memoryUsage();

  return {
    timestamp:
      new Date().toISOString(),

    ramMb: Math.round(
      memory.rss / 1024 / 1024
    ),

    cpuUsage: 0,

    cpuCount:
      os.cpus().length,

    platform:
      process.platform,

    architecture:
      process.arch,
  };
}