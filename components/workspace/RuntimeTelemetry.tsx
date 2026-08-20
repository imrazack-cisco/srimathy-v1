"use client";

export interface RuntimeTelemetryData {
  provider?: string;
  model?: string;

  fallback?: boolean;
  fallbackReason?: string;

  latencyMs?: number;

  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;

  tokensPerSecond?: number;

  retrievedChunks?: number;
  retrievalLatency?: number;

  curriculumAlignment?: number;
  semanticSimilarity?: number;
  topicCoverage?: number;
  confidence?: number;

  unsupportedContent?: number;

  hallucinationRisk?: string;
}

interface RuntimeTelemetryProps {
  runtime: RuntimeTelemetryData | null;
}

function formatLatency(
  latency?: number
): string {
  if (!latency || latency <= 0) {
    return "—";
  }

  if (latency < 1000) {
    return `${Math.round(latency)}ms`;
  }

  return `${(
    latency / 1000
  ).toFixed(2)}s`;
}

function formatNumber(
  value?: number
): string {
  if (
    value === undefined ||
    value === null ||
    value <= 0
  ) {
    return "—";
  }

  return value.toLocaleString();
}

export default function RuntimeTelemetry({
  runtime,
}: RuntimeTelemetryProps) {

  if (!runtime) {
    return (
      <div
        className="
          mt-2
          flex
          items-center
          gap-2
          px-1
          text-xs
          text-slate-500
        "
      >
        <span>🤖</span>

        <span>
          SRIMATHY · Ready
        </span>
      </div>
    );
  }

  const provider =
    runtime.provider
      ?.toLowerCase()
      ?? "";

  const isOllama =
    provider === "ollama";

  const isCircuit =
    provider === "circuit";

  const model =
    runtime.model ??
    "Unknown model";

  const providerName =
    isOllama
      ? "Ollama Local"
      : isCircuit
        ? "Cisco CIRCUIT"
        : runtime.provider ??
          "Unknown Provider";

  const icon =
    isOllama
      ? "🦙"
      : isCircuit
        ? "☁️"
        : "🤖";

  const hallucinationRisk =
    runtime.hallucinationRisk ??
    "UNKNOWN";

  let hallucinationClass =
    "text-slate-400";

  if (
    hallucinationRisk === "LOW"
  ) {
    hallucinationClass =
      "text-emerald-400";
  }

  if (
    hallucinationRisk === "MEDIUM"
  ) {
    hallucinationClass =
      "text-amber-400";
  }

  if (
    hallucinationRisk === "HIGH"
  ) {
    hallucinationClass =
      "text-red-400";
  }

  const grounding =
    runtime.curriculumAlignment ??
    0;

  const confidence =
    runtime.confidence ??
    0;

  return (
    <div
      className="
        mt-2
        rounded-xl
        border
        border-slate-700
        bg-slate-900/70
        px-4
        py-3
      "
    >

      {/* MODEL */}

      <div
        className="
          flex
          flex-wrap
          items-center
          gap-2
        "
      >

        <span
          className="
            text-xs
            font-semibold
            text-cyan-300
          "
        >
          {icon} {model}
        </span>

        <span className="text-slate-600">
          •
        </span>

        <span
          className="
            text-xs
            text-slate-300
          "
        >
          {providerName}
        </span>

        {runtime.fallback && (
          <span
            className="
              rounded-full
              border
              border-amber-500/30
              bg-amber-500/10
              px-2
              py-0.5
              text-[10px]
              font-semibold
              text-amber-300
            "
          >
            ⚡ FALLBACK
          </span>
        )}

      </div>


      {/* MAIN METRICS */}

      <div
        className="
          mt-2
          flex
          flex-wrap
          gap-x-5
          gap-y-1.5
          text-[11px]
          text-slate-400
        "
      >

        <span>
          ⚡ Latency:

          {" "}

          <strong
            className="
              font-medium
              text-slate-200
            "
          >
            {formatLatency(
              runtime.latencyMs
            )}
          </strong>
        </span>


        <span>
          🔢 Tokens:

          {" "}

          <strong
            className="
              font-medium
              text-slate-200
            "
          >
            {formatNumber(
              runtime.totalTokens
            )}
          </strong>
        </span>


        <span>
          🚀 Throughput:

          {" "}

          <strong
            className="
              font-medium
              text-slate-200
            "
          >
            {runtime.tokensPerSecond &&
            runtime.tokensPerSecond > 0
              ? `${runtime.tokensPerSecond.toFixed(
                  1
                )} tok/s`
              : "—"}
          </strong>
        </span>


        <span>
          🎯 Grounding:

          {" "}

          <strong
            className="
              font-medium
              text-slate-200
            "
          >
            {grounding > 0
              ? `${grounding}%`
              : "—"}
          </strong>
        </span>


        <span>
          🧠 Hallucination:

          {" "}

          <strong
            className={`
              font-medium
              ${hallucinationClass}
            `}
          >
            {hallucinationRisk}
          </strong>
        </span>

      </div>


      {/* SECONDARY METRICS */}

      <div
        className="
          mt-1.5
          flex
          flex-wrap
          gap-x-5
          gap-y-1
          text-[10px]
          text-slate-500
        "
      >

        <span>
          Prompt:

          {" "}

          {formatNumber(
            runtime.promptTokens
          )}

          {" "}tokens
        </span>


        <span>
          Output:

          {" "}

          {formatNumber(
            runtime.completionTokens
          )}

          {" "}tokens
        </span>


        <span>
          Confidence:

          {" "}

          {confidence > 0
            ? `${confidence}%`
            : "—"}
        </span>


        <span>
          NCERT:

          {" "}

          {runtime.retrievedChunks ??
            "—"}

          {" "}chunks
        </span>


        <span>
          Retrieval:

          {" "}

          {formatLatency(
            runtime.retrievalLatency
          )}
        </span>


        <span>
          Unsupported:

          {" "}

          {runtime.unsupportedContent ??
            "—"}
        </span>

      </div>


      {/* FALLBACK MESSAGE */}

      {runtime.fallback && (
        <div
          className="
            mt-2
            text-[10px]
            text-amber-400/80
          "
        >
          ⚡ Ollama unavailable —
          SRIMATHY automatically switched
          to Cisco CIRCUIT.
        </div>
      )}

    </div>
  );
}
