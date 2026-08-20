import { NextResponse } from "next/server";
import { runtimeMetrics } from "@/research/metrics";

export async function GET() {
  let online = false;
  let installedModels = 0;

  try {
    const response = await fetch(
      "http://127.0.0.1:11434/api/tags",
      {
        cache: "no-store",
      }
    );

    online = response.ok;

    if (response.ok) {
      const data = await response.json();

      installedModels =
        Array.isArray(data.models)
          ? data.models.length
          : 0;
    }
  } catch {
    online = false;
  }

  const measured =
    runtimeMetrics.experimentCount > 0;

  return NextResponse.json({
    online,

    model:
      runtimeMetrics.model,

    embeddingModel:
      runtimeMetrics.embeddingModel,

    inference:
      runtimeMetrics.inference,

    installedModels,

    promptCount:
      runtimeMetrics.experimentCount,

    averageResponseTime:
      runtimeMetrics.totalMs,

    lastResponseTime:
      runtimeMetrics.totalMs,

    uptime:
      process.uptime(),

    apiCost:
      "$0",

    prefillMs:
      runtimeMetrics.prefillMs,

    generationMs:
      runtimeMetrics.generationMs,

    totalMs:
      runtimeMetrics.totalMs,

    tokensPerSecond:
      runtimeMetrics.tokensPerSecond,

    promptTokens:
      runtimeMetrics.promptTokens,

    completionTokens:
      runtimeMetrics.completionTokens,

    peakRamMb:
      Number(
        (
          process.memoryUsage().rss /
          1024 /
          1024
        ).toFixed(1)
      ),

    cpuUsage:
      0,

    retrievedChunks:
      runtimeMetrics.retrievedChunks,

    retrievalLatency:
      runtimeMetrics.retrievalLatency,

    confidence:
      runtimeMetrics.confidence,

    similarity:
      runtimeMetrics.similarity,

    curriculumAlignment:
      runtimeMetrics.curriculumAlignment,

    hallucinationRisk:
      runtimeMetrics.hallucinationRisk,

    measurementStatus:
      measured
        ? "MEASURED"
        : "NOT_MEASURED",

    privacy:
      runtimeMetrics.privacy,

    lastPrompt:
      runtimeMetrics.lastPrompt,

    lastUpdated:
      runtimeMetrics.lastUpdated,

    experimentCount:
      runtimeMetrics.experimentCount,

    platform:
      process.platform,

    // Correct Node.js architecture property
    architecture:
      process.arch,
  });
}