export type RuntimeProvider =
  | "ollama"
  | "circuit"
  | "unknown";

export type HallucinationRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "UNKNOWN";

export interface RuntimeTelemetry {

  provider: RuntimeProvider;

  model: string;

  fallback: boolean;

  fallbackReason?: string;

  latencyMs: number;

  promptTokens: number;

  completionTokens: number;

  totalTokens: number;

  tokensPerSecond: number;

  inference: string;

  runtime: string;

  retrievedChunks: number;

  retrievalLatency: number;

  curriculumAlignment: number;

  semanticSimilarity: number;

  topicCoverage: number;

  confidence: number;

  unsupportedContent: number;

  hallucinationRisk: HallucinationRisk;

  lastUpdated: string;
}


const defaultTelemetry: RuntimeTelemetry = {

  provider: "unknown",

  model: "Not yet measured",

  fallback: false,

  fallbackReason: undefined,

  latencyMs: 0,

  promptTokens: 0,

  completionTokens: 0,

  totalTokens: 0,

  tokensPerSecond: 0,

  inference: "Not measured",

  runtime: "Unknown",

  retrievedChunks: 0,

  retrievalLatency: 0,

  curriculumAlignment: 0,

  semanticSimilarity: 0,

  topicCoverage: 0,

  confidence: 0,

  unsupportedContent: 0,

  hallucinationRisk: "UNKNOWN",

  lastUpdated:
    new Date().toISOString(),

};


let currentTelemetry:
  RuntimeTelemetry = {
    ...defaultTelemetry,
  };


export function getRuntimeTelemetry():
  RuntimeTelemetry {

  return {
    ...currentTelemetry,
  };

}


export function updateRuntimeTelemetry(
  update: Partial<RuntimeTelemetry>
): RuntimeTelemetry {

  currentTelemetry = {

    ...currentTelemetry,

    ...update,

    lastUpdated:
      new Date().toISOString(),

  };

  return {
    ...currentTelemetry,
  };

}


export function resetRuntimeTelemetry() {

  currentTelemetry = {

    ...defaultTelemetry,

    lastUpdated:
      new Date().toISOString(),

  };

}


export function recordOllamaRuntime(
  values: {

    model: string;

    latencyMs: number;

    promptTokens?: number;

    completionTokens?: number;

    totalTokens?: number;

    tokensPerSecond?: number;

  }
) {

  const promptTokens =
    values.promptTokens ?? 0;

  const completionTokens =
    values.completionTokens ?? 0;

  const totalTokens =
    values.totalTokens ??
    promptTokens +
      completionTokens;


  return updateRuntimeTelemetry({

    provider: "ollama",

    model: values.model,

    fallback: false,

    fallbackReason: undefined,

    latencyMs:
      values.latencyMs,

    promptTokens,

    completionTokens,

    totalTokens,

    tokensPerSecond:
      values.tokensPerSecond ?? 0,

    inference: "Ollama Local",

    runtime: "Local / Offline",

  });

}


export function recordCircuitRuntime(
  values: {

    model: string;

    latencyMs: number;

    promptTokens?: number;

    completionTokens?: number;

    totalTokens?: number;

    tokensPerSecond?: number;

    fallback?: boolean;

    fallbackReason?: string;

  }
) {

  const promptTokens =
    values.promptTokens ?? 0;

  const completionTokens =
    values.completionTokens ?? 0;

  const totalTokens =
    values.totalTokens ??
    promptTokens +
      completionTokens;


  return updateRuntimeTelemetry({

    provider: "circuit",

    model: values.model,

    fallback:
      values.fallback ?? false,

    fallbackReason:
      values.fallbackReason,

    latencyMs:
      values.latencyMs,

    promptTokens,

    completionTokens,

    totalTokens,

    tokensPerSecond:
      values.tokensPerSecond ?? 0,

    inference:
      "Cisco CIRCUIT",

    runtime:
      "Online / Cisco CIRCUIT",

  });

}


export function recordEvaluationRuntime(
  values: {

    curriculumAlignment?: number;

    semanticSimilarity?: number;

    topicCoverage?: number;

    confidence?: number;

    unsupportedContent?: number;

    retrievedChunks?: number;

    retrievalLatency?: number;

  }
) {

  const unsupported =
    values.unsupportedContent ?? 0;

  const alignment =
    values.curriculumAlignment ?? 0;


  let hallucinationRisk:
    HallucinationRisk;


  if (
    unsupported === 0 &&
    alignment >= 80
  ) {

    hallucinationRisk = "LOW";

  } else if (
    unsupported <= 2 &&
    alignment >= 60
  ) {

    hallucinationRisk = "MEDIUM";

  } else if (
    unsupported > 2
  ) {

    hallucinationRisk = "HIGH";

  } else {

    hallucinationRisk = "UNKNOWN";

  }


  return updateRuntimeTelemetry({

    curriculumAlignment:
      alignment,

    semanticSimilarity:
      values.semanticSimilarity ?? 0,

    topicCoverage:
      values.topicCoverage ?? 0,

    confidence:
      values.confidence ?? 0,

    unsupportedContent:
      unsupported,

    hallucinationRisk,

    retrievedChunks:
      values.retrievedChunks ??
      currentTelemetry.retrievedChunks,

    retrievalLatency:
      values.retrievalLatency ??
      currentTelemetry.retrievalLatency,

  });

}
