import { RuntimeMetrics } from "./types";

export const runtimeMetrics: RuntimeMetrics = {

    model: "Gemma 3 4B",

    embeddingModel: "nomic-embed-text",

    inference: "Ollama",

    ttft: 612,

    tokensPerSecond: 18.4,

    promptTokens: 146,

    completionTokens: 312,

    retrievedChunks: 5,

    retrievalLatency: 41,

    peakRamMb: 3148,

    cpuUsage: 32,

    confidence: 96,

    similarity: 0.93,

    curriculumAlignment: 94,

    hallucinationRisk: "LOW",

    privacy: "Zero Egress"

};