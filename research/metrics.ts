import { RuntimeMetrics } from "./types";

export const runtimeMetrics: RuntimeMetrics = {
  model: "Not yet measured",

  embeddingModel:
    process.env.OLLAMA_EMBEDDING_MODEL ??
    "nomic-embed-text",

  inference: "Ollama Local",

  prefillMs: 0,
  generationMs: 0,
  totalMs: 0,

  tokensPerSecond: 0,

  promptTokens: 0,
  completionTokens: 0,

  retrievedChunks: 0,
  retrievalLatency: 0,

  peakRamMb: 0,
  cpuUsage: 0,

  confidence: 0,
  similarity: 0,
  curriculumAlignment: 0,

  hallucinationRisk: "UNKNOWN",

  privacy: "Local / Offline",

  lastPrompt: "",
  lastUpdated: "",

  experimentCount: 0,
};


// ============================================================
// HELPERS
// ============================================================

function validNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}


// ============================================================
// INFERENCE METRICS
// ============================================================

export function recordInferenceMetrics(
  input: {
    model: string;

    totalDurationNs?: number;

    promptEvalCount?: number;
    promptEvalDurationNs?: number;

    evalCount?: number;
    evalDurationNs?: number;

    prompt?: string;

    retrievedChunks?: number;
    retrievalLatencyMs?: number;
  }
) {

  const totalMs =
    validNumber(input.totalDurationNs)
      ? input.totalDurationNs / 1_000_000
      : 0;

  const prefillMs =
    validNumber(
      input.promptEvalDurationNs
    )
      ? input.promptEvalDurationNs /
        1_000_000
      : 0;

  const generationMs =
    validNumber(
      input.evalDurationNs
    )
      ? input.evalDurationNs /
        1_000_000
      : 0;

  const tokensPerSecond =
    validNumber(input.evalCount) &&
    validNumber(input.evalDurationNs) &&
    input.evalDurationNs > 0
      ? input.evalCount /
        (input.evalDurationNs /
          1_000_000_000)
      : 0;


  // ==========================================================
  // INFERENCE
  // ==========================================================

  runtimeMetrics.model =
    input.model;

  runtimeMetrics.prefillMs =
    prefillMs;

  runtimeMetrics.generationMs =
    generationMs;

  runtimeMetrics.totalMs =
    totalMs;

  runtimeMetrics.tokensPerSecond =
    tokensPerSecond;

  runtimeMetrics.promptTokens =
    input.promptEvalCount ?? 0;

  runtimeMetrics.completionTokens =
    input.evalCount ?? 0;


  // ==========================================================
  // RAG
  // ==========================================================

  if (
    validNumber(
      input.retrievedChunks
    )
  ) {
    runtimeMetrics.retrievedChunks =
      input.retrievedChunks;
  }

  if (
    validNumber(
      input.retrievalLatencyMs
    )
  ) {
    runtimeMetrics.retrievalLatency =
      input.retrievalLatencyMs;
  }


  // ==========================================================
  // PROMPT
  // ==========================================================

  if (
    input.prompt !== undefined
  ) {
    runtimeMetrics.lastPrompt =
      input.prompt;
  }

  runtimeMetrics.lastUpdated =
    new Date().toISOString();

  runtimeMetrics.experimentCount += 1;
}


// ============================================================
// CURRICULUM / GROUNDING EVALUATION
// ============================================================

export function recordCurriculumEvaluation(
  input: {
    semanticSimilarity: number;

    topicCoverage: number;

    score: number;

    confidence: number;

    status:
      | "GOOD"
      | "MODERATE"
      | "LOW"
      | "NO_REFERENCE";

    referenceChunks: number;
  }
) {

  runtimeMetrics.similarity =
    Number(
      input.semanticSimilarity ?? 0
    );

  runtimeMetrics.curriculumAlignment =
    Number(
      input.score ?? 0
    );

  runtimeMetrics.confidence =
    Number(
      input.confidence ?? 0
    );

  runtimeMetrics.retrievedChunks =
    Number(
      input.referenceChunks ?? 0
    );


  // ==========================================================
  // GROUNDING-BASED HALLUCINATION RISK
  // ==========================================================

  switch (input.status) {

    case "GOOD":

      runtimeMetrics.hallucinationRisk =
        "LOW";

      break;

    case "MODERATE":

      runtimeMetrics.hallucinationRisk =
        "MEDIUM";

      break;

    case "LOW":

      runtimeMetrics.hallucinationRisk =
        "HIGH";

      break;

    case "NO_REFERENCE":

      runtimeMetrics.hallucinationRisk =
        "UNKNOWN";

      break;

    default:

      runtimeMetrics.hallucinationRisk =
        "UNKNOWN";
  }


  runtimeMetrics.lastUpdated =
    new Date().toISOString();
}


// ============================================================
// RESET LIVE EVALUATION
// ============================================================

export function resetEvaluationMetrics() {

  runtimeMetrics.confidence = 0;

  runtimeMetrics.similarity = 0;

  runtimeMetrics.curriculumAlignment = 0;

  runtimeMetrics.hallucinationRisk =
    "UNKNOWN";

  runtimeMetrics.retrievedChunks = 0;

  runtimeMetrics.retrievalLatency = 0;
}


// ============================================================
// HUMAN-READABLE STATUS
// ============================================================

export function getMeasurementStatus() {

  if (
    runtimeMetrics.experimentCount === 0
  ) {
    return "NOT_MEASURED";
  }

  return "MEASURED";
}
