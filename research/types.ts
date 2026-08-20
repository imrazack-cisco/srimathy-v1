export type HallucinationRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "UNKNOWN";

export interface RuntimeMetrics {
  model: string;
  embeddingModel: string;
  inference: string;

  prefillMs: number;
  generationMs: number;
  totalMs: number;

  tokensPerSecond: number;

  promptTokens: number;
  completionTokens: number;

  retrievedChunks: number;
  retrievalLatency: number;

  peakRamMb: number;
  cpuUsage: number;

  confidence: number;
  similarity: number;

  curriculumAlignment: number;

  hallucinationRisk: HallucinationRisk;

  privacy: string;

  lastPrompt: string;
  lastUpdated: string;

  experimentCount: number;
}