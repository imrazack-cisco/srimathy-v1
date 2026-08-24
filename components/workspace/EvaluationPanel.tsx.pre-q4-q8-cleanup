"use client";

import { useEffect, useState } from "react";

interface BenchmarkResponse {
  success: boolean;

  benchmark: {
    status: string;
    tests: number;
    passed: number;
    failed: number;
    overallScore: number;
  };

  accuracy: {
    retrieval: number;
    curriculum: number;
    grounding: number;
  };

  performance: {
    averageRetrievalMs: number;
    averageGenerationMs: number;
    totalDurationMs: number;
  };

  runtime: {
    chatModel: string;
    embeddingModel: string;
    vectorStore: string;
    provider: string;
    mode: string;
  };
}

interface ModelBenchmark {
  provider: string;
  model: string;
  runs: number;
  successfulRuns: number;
  failedRuns: number;
  averageLatencyMs: number;
  averageLatencySec: number;
  averageTokensPerSecond: number | null;
  online: boolean;
}

interface LatestBenchmark {
  success: boolean;
  generatedAt: string;
  file: string;
  models: ModelBenchmark[];

  comparison: {
    q3VsQ4: number | null;
    circuitVsQ3: number | null;
    circuitVsQ4: number | null;
  };

  q3: ModelBenchmark | null;
  q4: ModelBenchmark | null;
  circuit: ModelBenchmark | null;

  error?: string;
}

interface RuntimeResponse {
  online: boolean;
  model: string;
  embeddingModel: string;
  inference: string;
  installedModels: number;
  promptCount: number;
  averageResponseTime: number;
  lastResponseTime: number;
  uptime: number;
  apiCost: string;
  prefillMs: number;
  generationMs: number;
  totalMs: number;
  tokensPerSecond: number;
  promptTokens: number;
  completionTokens: number;
  peakRamMb: number;
  cpuUsage: number;
  retrievedChunks: number;
  retrievalLatency: number;
  confidence: number;
  similarity: number;
  curriculumAlignment: number;
  hallucinationRisk: string;
  privacy: string;
  lastPrompt: string;
  lastUpdated: string;
  experimentCount: number;
  platform: string;
  architecture: string;
}

export default function EvaluationPanel() {
  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<BenchmarkResponse | null>(
      null
    );

  const [benchmark, setBenchmark] =
    useState<LatestBenchmark | null>(
      null
    );

  const [runtime, setRuntime] =
    useState<RuntimeResponse | null>(
      null
    );

  const [error, setError] =
    useState("");

  async function loadBenchmark() {
    try {
      const response =
        await fetch(
          "/api/benchmark/latest",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (data.success) {
        setBenchmark(data);
      }
    } catch (err) {
      console.error(
        "Benchmark load failed:",
        err
      );
    }
  }

  async function loadRuntime() {
    try {
      const response =
        await fetch(
          "/api/runtime",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      setRuntime(data);
    } catch (err) {
      console.error(
        "Runtime load failed:",
        err
      );
    }
  }

  async function runBenchmark() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/evaluation",
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Benchmark failed"
        );
      }

      setResult(data);

      // Refresh benchmark values
      // after evaluation completes.
      await loadBenchmark();
      await loadRuntime();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Benchmark failed"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBenchmark();
    loadRuntime();
  }, []);

  function findModel(
    provider: string,
    model: string
  ) {
    return benchmark?.models.find(
      (item) =>
        item.provider === provider &&
        item.model === model
    );
  }

  const q3 =
    findModel(
      "OLLAMA",
      "gemma3:4b-q3"
    );

  const q4 =
    findModel(
      "OLLAMA",
      "gemma3:4b"
    );

  const circuit =
    benchmark?.models.find(
      (item) =>
        item.provider ===
        "CIRCUIT"
    );

  return (
    <section className="mt-8">

      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          🧪 SRIMATHY Evaluation
        </h2>

        <p className="mt-2 text-slate-400">
          Reproducible benchmarking of
          curriculum-aware retrieval,
          grounding and runtime performance.
        </p>

      </div>

      <div className="
        rounded-2xl
        border
        border-slate-800
        bg-slate-950/70
        p-8
        shadow-xl
      ">

        <div className="
          flex
          flex-col
          gap-6
          lg:flex-row
          lg:items-center
          lg:justify-between
        ">

          <div>

            <div className="
              text-sm
              uppercase
              tracking-widest
              text-cyan-400
            ">
              Benchmark Suite
            </div>

            <h3 className="
              mt-2
              text-2xl
              font-bold
            ">
              Curriculum & RAG Evaluation
            </h3>

            <p className="
              mt-2
              max-w-2xl
              text-sm
              text-slate-400
            ">
              Tests NCERT curriculum isolation,
              retrieval accuracy, answer
              generation and local inference
              performance.
            </p>

          </div>

          <button
            type="button"
            onClick={runBenchmark}
            disabled={loading}
            className="
              rounded-xl
              bg-cyan-500
              px-8
              py-4
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loading
              ? "Running Benchmark..."
              : "▶ Run Benchmark"}
          </button>

        </div>

        {error && (
          <div className="
            mt-6
            rounded-xl
            border
            border-red-900
            bg-red-950/30
            p-4
            text-red-300
          ">
            ❌ {error}
          </div>
        )}

        {loading && (
          <div className="
            mt-8
            animate-pulse
            text-cyan-300
          ">
            🧠 Running SRIMATHY evaluation suite...
          </div>
        )}

        {result && (
          <div className="mt-10">

            <div className="
              grid
              grid-cols-1
              gap-6
              md:grid-cols-4
            ">

              <Metric
                label="Overall Score"
                value={`${result.benchmark.overallScore}%`}
              />

              <Metric
                label="Tests Passed"
                value={`${result.benchmark.passed}/${result.benchmark.tests}`}
              />

              <Metric
                label="Retrieval Accuracy"
                value={`${result.accuracy.retrieval}%`}
              />

              <Metric
                label="Curriculum Accuracy"
                value={`${result.accuracy.curriculum}%`}
              />

            </div>

            <div className="
              mt-6
              rounded-xl
              border
              border-slate-800
              bg-slate-900
              p-6
            ">

              <div className="
                flex
                items-center
                justify-between
              ">

                <div>

                  <div className="
                    text-sm
                    text-slate-500
                  ">
                    Benchmark Status
                  </div>

                  <div className={`
                    mt-1
                    text-2xl
                    font-bold
                    ${
                      result.benchmark.status ===
                      "PASS"
                        ? "text-green-400"
                        : "text-yellow-400"
                    }
                  `}>
                    {result.benchmark.status}
                  </div>

                </div>

                <div className="text-4xl">
                  {result.benchmark.status ===
                  "PASS"
                    ? "✅"
                    : "⚠️"}
                </div>

              </div>

            </div>

            <div className="mt-6">

              <h3 className="
                mb-4
                text-xl
                font-semibold
              ">
                Evaluation Dimensions
              </h3>

              <div className="
                grid
                grid-cols-1
                gap-4
                md:grid-cols-3
              ">

                <ScoreCard
                  title="Retrieval Accuracy"
                  score={result.accuracy.retrieval}
                  description="Correct curriculum knowledge retrieved"
                />

                <ScoreCard
                  title="Curriculum Accuracy"
                  score={result.accuracy.curriculum}
                  description="Grade, subject and book isolation"
                />

                <ScoreCard
                  title="Grounding"
                  score={result.accuracy.grounding}
                  description="Retrieved context successfully used"
                />

              </div>

            </div>

            <div className="mt-8">

              <h3 className="
                mb-4
                text-xl
                font-semibold
              ">
                ⚡ Runtime Performance
              </h3>

              <div className="
                grid
                grid-cols-1
                gap-4
                md:grid-cols-3
              ">

                <InfoCard
                  label="Avg Retrieval"
                  value={`${result.performance.averageRetrievalMs} ms`}
                />

                <InfoCard
                  label="Avg Generation"
                  value={`${(
                    result.performance.averageGenerationMs /
                    1000
                  ).toFixed(2)} sec`}
                />

                <InfoCard
                  label="Benchmark Runtime"
                  value={`${(
                    result.performance.totalDurationMs /
                    1000
                  ).toFixed(2)} sec`}
                />

              </div>

            </div>

          </div>
        )}

        {/* ================================================= */}
        {/* LIVE Q3 / Q4 / CIRCUIT BENCHMARK */}
        {/* ================================================= */}

        <div className="mt-10">

          <div className="mb-4">

            <h3 className="
              text-xl
              font-semibold
            ">
              🧪 Q3 Model Benchmark
            </h3>

            <p className="
              mt-2
              text-sm
              text-slate-400
            ">
              Latest empirical measurements from
              the SRIMATHY benchmark harness.
            </p>

            {benchmark?.generatedAt && (
              <p className="
                mt-1
                text-xs
                text-slate-600
              ">
                Latest run:{" "}
                {new Date(
                  benchmark.generatedAt
                ).toLocaleString()}
              </p>
            )}

          </div>

          <div className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-3
          ">

            <BenchmarkModelCard
              provider="OLLAMA"
              model="Gemma 3 4B Q3_K_M"
              latency={
                q3
                  ? `${q3.averageLatencySec.toFixed(3)} sec`
                  : "Not measured"
              }
              throughput={
                q3?.averageTokensPerSecond
                  ? `${q3.averageTokensPerSecond.toFixed(1)} tok/s`
                  : "—"
              }
              mode="OFFLINE"
              online={q3?.online ?? false}
              note={
                q3
                  ? `${q3.successfulRuns}/${q3.runs} successful runs`
                  : "No benchmark data"
              }
            />

            <BenchmarkModelCard
              provider="OLLAMA"
              model="Gemma 3 4B Q4_K_M"
              latency={
                q4
                  ? `${q4.averageLatencySec.toFixed(3)} sec`
                  : "Not measured"
              }
              throughput={
                q4?.averageTokensPerSecond
                  ? `${q4.averageTokensPerSecond.toFixed(1)} tok/s`
                  : "—"
              }
              mode="OFFLINE"
              online={q4?.online ?? false}
              note={
                q4
                  ? `${q4.successfulRuns}/${q4.runs} successful runs`
                  : "No benchmark data"
              }
            />

            <BenchmarkModelCard
              provider="CIRCUIT"
              model="Gemini 3.1 Flash Lite"
              latency={
                circuit &&
                circuit.averageLatencyMs > 0
                  ? `${circuit.averageLatencySec.toFixed(3)} sec`
                  : "Not measured"
              }
              throughput={
                circuit?.averageTokensPerSecond
                  ? `${circuit.averageTokensPerSecond.toFixed(1)} tok/s`
                  : "Cloud"
              }
              mode="ONLINE"
              online={
                circuit?.online ?? false
              }
              note={
                circuit
                  ? circuit.failedRuns > 0
                    ? `${circuit.successfulRuns}/${circuit.runs} successful runs`
                    : `${circuit.successfulRuns}/${circuit.runs} successful runs`
                  : "No benchmark data"
              }
            />

          </div>

          <div className="
            mt-6
            rounded-xl
            border
            border-slate-800
            bg-slate-900
            p-6
          ">

            <div className="
              grid
              grid-cols-1
              gap-6
              md:grid-cols-3
            ">

              <BenchmarkMetric
                label="Q3 vs Q4"
                value={
                  benchmark?.comparison.q3VsQ4 !==
                  null &&
                  benchmark?.comparison.q3VsQ4 !==
                  undefined
                    ? `${benchmark.comparison.q3VsQ4}% faster`
                    : "Not available"
                }
                description="Based on measured average latency."
              />

              <BenchmarkMetric
                label="CIRCUIT vs Q3"
                value={
                  benchmark?.comparison.circuitVsQ3 !==
                  null &&
                  benchmark?.comparison.circuitVsQ3 !==
                  undefined
                    ? `${benchmark.comparison.circuitVsQ3}× faster`
                    : "Not available"
                }
                description="Only calculated when CIRCUIT latency is measured."
              />

              <BenchmarkMetric
                label="CIRCUIT vs Q4"
                value={
                  benchmark?.comparison.circuitVsQ4 !==
                  null &&
                  benchmark?.comparison.circuitVsQ4 !==
                  undefined
                    ? `${benchmark.comparison.circuitVsQ4}× faster`
                    : "Not available"
                }
                description="Only calculated when CIRCUIT latency is measured."
              />

            </div>

          </div>

          <div className="
            mt-6
            rounded-xl
            border
            border-cyan-500/20
            bg-cyan-500/5
            p-6
          ">

            <div className="
              text-sm
              uppercase
              tracking-widest
              text-cyan-400
            ">
              SRIMATHY Model Strategy
            </div>

            <div className="
              mt-4
              grid
              grid-cols-1
              gap-5
              md:grid-cols-3
            ">

              <StrategyItem
                label="OFFLINE"
                model="Gemma 3 4B Q3_K_M"
                description="Local inference when privacy, connectivity or zero cloud dependency is required."
              />

              <StrategyItem
                label="ONLINE"
                model="Cisco CIRCUIT"
                description="Cloud inference when lower latency and higher-capability hosted inference are preferred."
              />

              <StrategyItem
                label="EMBEDDINGS"
                model="nomic-embed-text"
                description="768-dimensional embeddings used for curriculum-aware semantic retrieval."
              />

            </div>

          </div>

          <div className="
            mt-5
            rounded-xl
            border
            border-slate-800
            bg-slate-950
            p-5
          ">

            <div className="
              text-sm
              font-semibold
              text-slate-300
            ">
              Benchmark Methodology
            </div>

            <ul className="
              mt-3
              space-y-2
              text-xs
              leading-5
              text-slate-500
            ">

              <li>
                • Three educational prompts are evaluated across the models.
              </li>

              <li>
                • Local models are executed using Ollama on the development machine.
              </li>

              <li>
                • Gemma Q3 uses Q3_K_M quantization; Gemma Q4 uses Q4_K_M quantization.
              </li>

              <li>
                • Latency represents measured execution time from the benchmark run.
              </li>

              <li>
                • Local throughput is reported in generated tokens per second.
              </li>

              <li>
                • Results are loaded from the latest benchmark-results JSON.
              </li>

            </ul>

          </div>

        </div>

        {/* ================================================= */}
        {/* LIVE AI RUNTIME */}
        {/* ================================================= */}

        <div className="mt-8">

          <h3 className="
            mb-4
            text-xl
            font-semibold
          ">
            🤖 AI Runtime
          </h3>

          <div className="
            rounded-xl
            border
            border-slate-800
            bg-slate-900
            p-6
          ">

            <div className="
              grid
              grid-cols-1
              gap-6
              md:grid-cols-2
            ">

              <RuntimeItem
                label="GENERATION MODEL"
                value={
                  runtime?.model ||
                  "Loading..."
                }
              />

              <RuntimeItem
                label="EMBEDDING MODEL"
                value={
                  runtime?.embeddingModel ||
                  "Loading..."
                }
              />

              <RuntimeItem
                label="VECTOR STORE"
                value="ChromaDB"
              />

              <RuntimeItem
                label="PROVIDER"
                value={
                  runtime
                    ? `${runtime.inference} • ${
                        runtime.privacy.includes(
                          "Offline"
                        )
                          ? "Offline"
                          : "Online"
                      }`
                    : "Loading..."
                }
              />

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="
      rounded-xl
      border
      border-slate-800
      bg-slate-900
      p-6
    ">
      <div className="text-sm text-slate-500">
        {label}
      </div>

      <div className="
        mt-2
        text-3xl
        font-bold
        text-cyan-400
      ">
        {value}
      </div>
    </div>
  );
}

function ScoreCard({
  title,
  score,
  description,
}: {
  title: string;
  score: number;
  description: string;
}) {
  return (
    <div className="
      rounded-xl
      border
      border-slate-800
      bg-slate-900
      p-6
    ">

      <div className="text-sm text-slate-400">
        {title}
      </div>

      <div className="
        mt-2
        text-4xl
        font-bold
      ">
        {score}%
      </div>

      <div className="
        mt-3
        text-xs
        text-slate-500
      ">
        {description}
      </div>

    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="
      rounded-xl
      border
      border-slate-800
      bg-slate-900
      p-6
    ">

      <div className="text-sm text-slate-400">
        {label}
      </div>

      <div className="
        mt-2
        text-2xl
        font-bold
      ">
        {value}
      </div>

    </div>
  );
}

function BenchmarkModelCard({
  provider,
  model,
  latency,
  throughput,
  mode,
  online,
  note,
}: {
  provider: string;
  model: string;
  latency: string;
  throughput: string;
  mode: string;
  online: boolean;
  note: string;
}) {
  return (
    <div className="
      rounded-xl
      border
      border-slate-800
      bg-slate-900
      p-6
    ">

      <div className="
        flex
        items-center
        justify-between
      ">

        <div className="
          text-sm
          tracking-widest
          text-slate-500
        ">
          {provider}
        </div>

        <div className={`
          rounded-full
          px-3
          py-1
          text-xs
          font-semibold
          ${
            online
              ? "bg-blue-500/10 text-blue-400"
              : "bg-slate-800 text-slate-500"
          }
        `}>
          {online
            ? mode
            : "NOT MEASURED"}
        </div>

      </div>

      <div className="
        mt-6
        text-xl
        font-semibold
      ">
        {model}
      </div>

      <div className="
        mt-6
        grid
        grid-cols-2
        gap-4
      ">

        <div>
          <div className="
            text-xs
            text-slate-500
          ">
            AVG LATENCY
          </div>

          <div className="
            mt-2
            text-2xl
            font-bold
            text-cyan-400
          ">
            {latency}
          </div>
        </div>

        <div>
          <div className="
            text-xs
            text-slate-500
          ">
            THROUGHPUT
          </div>

          <div className="
            mt-2
            text-2xl
            font-bold
          ">
            {throughput}
          </div>
        </div>

      </div>

      <div className="
        mt-6
        text-xs
        text-slate-500
      ">
        {note}
      </div>

    </div>
  );
}

function BenchmarkMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div>

      <div className="
        text-xs
        uppercase
        tracking-widest
        text-slate-500
      ">
        {label}
      </div>

      <div className="
        mt-2
        text-2xl
        font-bold
      ">
        {value}
      </div>

      <div className="
        mt-2
        text-xs
        text-slate-500
      ">
        {description}
      </div>

    </div>
  );
}

function StrategyItem({
  label,
  model,
  description,
}: {
  label: string;
  model: string;
  description: string;
}) {
  return (
    <div>

      <div className="
        text-xs
        tracking-widest
        text-slate-500
      ">
        {label}
      </div>

      <div className="
        mt-2
        font-semibold
        text-cyan-400
      ">
        {model}
      </div>

      <div className="
        mt-2
        text-xs
        leading-5
        text-slate-500
      ">
        {description}
      </div>

    </div>
  );
}

function RuntimeItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <div className="
        text-xs
        tracking-widest
        text-slate-500
      ">
        {label}
      </div>

      <div className="
        mt-2
        text-lg
        text-cyan-400
      ">
        {value}
      </div>

    </div>
  );
}
