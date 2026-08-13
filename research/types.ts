export type HallucinationRisk = "LOW" | "MEDIUM" | "HIGH";

export interface RuntimeMetrics {

    model: string;

    embeddingModel: string;

    inference: string;

    ttft: number;

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

}