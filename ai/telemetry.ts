export interface AgentTelemetry {
  agent: string;

  model: string;

  latencyMs: number;

  timestamp: string;
}

export interface RetrievalTelemetry {
  query: string;

  embeddingLatencyMs: number;

  retrievalLatencyMs: number;

  rerankLatencyMs: number;

  totalRetrievalLatencyMs: number;

  chunksRetrieved: number;

  distances: number[];

  timestamp: string;
}

export interface RequestTelemetry {

  requestId: string;

  prompt: string;

  startedAt: string;

  completedAt: string;

  totalLatencyMs: number;

  model: string;

  provider: string;

  agents: AgentTelemetry[];

  retrieval?: RetrievalTelemetry;

}


let latestTelemetry: RequestTelemetry | null = null;


export function startRequest(
  prompt: string,
  model = "gemma3:4b",
  provider = "Ollama Local"
) {

  return {
    requestId:
      `req-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    prompt,

    startedAt:
      new Date().toISOString(),

    startTime:
      performance.now(),

    model,

    provider,

    agents: [] as AgentTelemetry[],
  };

}


export function recordAgent(
  context: ReturnType<typeof startRequest>,
  agent: string,
  latencyMs: number
) {

  context.agents.push({

    agent,

    model:
      context.model,

    latencyMs,

    timestamp:
      new Date().toISOString(),

  });

}


export function recordRetrieval(
  context: ReturnType<typeof startRequest>,
  retrieval: Omit<
    RetrievalTelemetry,
    "timestamp"
  >
) {

  (
    context as any
  ).retrieval = {

    ...retrieval,

    timestamp:
      new Date().toISOString(),

  };

}


export function finishRequest(
  context: ReturnType<typeof startRequest>
) {

  const totalLatencyMs =
    performance.now() -
    context.startTime;

  latestTelemetry = {

    requestId:
      context.requestId,

    prompt:
      context.prompt,

    startedAt:
      context.startedAt,

    completedAt:
      new Date().toISOString(),

    totalLatencyMs,

    model:
      context.model,

    provider:
      context.provider,

    agents:
      context.agents,

    retrieval:
      (context as any).retrieval,

  };

  return latestTelemetry;

}


export function getLatestTelemetry() {

  return latestTelemetry;

}