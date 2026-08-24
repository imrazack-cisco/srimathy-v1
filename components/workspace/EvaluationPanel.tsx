"use client";

import { useEffect, useState } from "react";

import CurriculumAlignmentDashboard from "@/components/evaluation/CurriculumAlignmentDashboard";
import ModelBenchmarkDashboard from "@/components/evaluation/ModelBenchmarkDashboard";

/* ============================================================
   TYPES
   ============================================================ */

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

/* ============================================================
   LATEST MODEL BENCHMARK
   Supports both:
   OLD FORMAT:
     models: []

   NEW FORMAT:
     models: {
       q4: {...},
       q8: {...},
       circuit: {...}
     }
   ============================================================ */

interface ModelBenchmark {
  provider?: string;
  model?: string;
  quantization?: string;

  measurements?: number;
  runs?: number;

  successfulRuns?: number;
  failedRuns?: number;

  avgLatencyMs?: number;
  averageLatencyMs?: number;

  avgTokensPerSecond?: number | null;
  averageTokensPerSecond?: number | null;

  avgGenerationTokensPerSecond?: number | null;

  minLatencyMs?: number;
  maxLatencyMs?: number;

  measured?: boolean;
  online?: boolean;

  note?: string;
}

interface LatestBenchmark {
  success: boolean;
  generatedAt?: string;
  sourceFile?: string;
  file?: string;

  totalMeasurements?: number;

  hardware?: {
    platform?: string;
    processor?: string;
    cpuCores?: number;
    memoryGB?: number;
    memoryType?: string;
    runtime?: string;
  };

  models:
    | ModelBenchmark[]
    | Record<string, ModelBenchmark>;

  comparison?: {
    q8VsQ4ThroughputPercent?: number | null;
    q8VsQ4LatencyPercent?: number | null;
    q8VsQ4GenerationPercent?: number | null;

    q3VsQ4?: number | null;
    circuitVsQ3?: number | null;
    circuitVsQ4?: number | null;

    note?: string;
  };

  q3?: ModelBenchmark | null;
  q4?: ModelBenchmark | null;
  q8?: ModelBenchmark | null;
  circuit?: ModelBenchmark | null;

  error?: string;
}

/* ============================================================
   RUNTIME
   ============================================================ */

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

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function EvaluationPanel() {
  const [loading, setLoading] = useState(false);

  const [result, setResult] =
    useState<BenchmarkResponse | null>(null);

  const [benchmark, setBenchmark] =
    useState<LatestBenchmark | null>(null);

  const [runtime, setRuntime] =
    useState<RuntimeResponse | null>(null);

  const [error, setError] = useState("");

  /* ============================================================
     LOAD LATEST BENCHMARK
     ============================================================ */

  async function loadBenchmark() {
    try {
      const response = await fetch(
        "/api/benchmark/latest",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (data?.success) {
        setBenchmark(data);
      }
    } catch (err) {
      console.error(
        "Benchmark load failed:",
        err
      );
    }
  }

  /* ============================================================
     LOAD RUNTIME
     ============================================================ */

  async function loadRuntime() {
    try {
      const response = await fetch(
        "/api/runtime",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      setRuntime(data);
    } catch (err) {
      console.error(
        "Runtime load failed:",
        err
      );
    }
  }

  /* ============================================================
     RUN EVALUATION
     ============================================================ */

  async function runBenchmark() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/evaluation",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ||
            "Benchmark failed"
        );
      }

      setResult(data);

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

  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    loadBenchmark();
    loadRuntime();
  }, []);

  /* ============================================================
     SAFE MODEL LOOKUP
     ============================================================ */

  function getModels(): ModelBenchmark[] {
    if (!benchmark?.models) {
      return [];
    }

    if (Array.isArray(benchmark.models)) {
      return benchmark.models;
    }

    return Object.values(
      benchmark.models
    );
  }

  function findModel(
    provider: string,
    model: string
  ): ModelBenchmark | undefined {
    return getModels().find(
      (item) =>
        item?.provider === provider &&
        item?.model === model
    );
  }

  /* ============================================================
     CURRENT MODEL REFERENCES
     ============================================================ */

  const q4 =
    benchmark?.q4 ??
    findModel(
      "OLLAMA",
      "gemma3:4b"
    );

  const q8 =
    benchmark?.q8 ??
    findModel(
      "OLLAMA",
      "gemma3:4b-it-q8_0"
    );

  const circuit =
    benchmark?.circuit ??
    findModel(
      "CIRCUIT",
      "gemini-3.1-flash-lite"
    );

  /* ============================================================
     HELPERS
     ============================================================ */

  function formatLatency(
    model?: ModelBenchmark
  ) {
    const value =
      model?.avgLatencyMs ??
      model?.averageLatencyMs;

    if (
      typeof value !== "number"
    ) {
      return "Not measured";
    }

    return `${(
      value / 1000
    ).toFixed(3)} sec`;
  }

  function formatThroughput(
    model?: ModelBenchmark
  ) {
    const value =
      model?.avgTokensPerSecond ??
      model?.averageTokensPerSecond ??
      model?.avgGenerationTokensPerSecond;

    if (
      typeof value !== "number"
    ) {
      return "Not measured";
    }

    return `${value.toFixed(1)} tok/s`;
  }

  function isMeasured(
    model?: ModelBenchmark
  ) {
    if (!model) {
      return false;
    }

    if (
      typeof model.measured ===
      "boolean"
    ) {
      return model.measured;
    }

    return (
      (model.successfulRuns ??
        model.measurements ??
        model.runs ??
        0) > 0
    );
  }

  /* ============================================================
     UI
     ============================================================ */

  return (
    <section className="mt-8">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="mb-8">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <div className="
              text-sm
              uppercase
              tracking-widest
              text-cyan-400
            ">
              Evaluation & Analytics
            </div>

            <h2 className="
              mt-2
              text-3xl
              font-bold
            ">
              🧪 SRIMATHY Evaluation
            </h2>

            <p className="
              mt-2
              max-w-3xl
              text-slate-400
            ">
              Reproducible evaluation of
              curriculum-aware retrieval,
              NCERT alignment, grounding,
              local inference and model
              performance.
            </p>

          </div>

          <div className="
            rounded-full
            border
            border-cyan-500/40
            bg-cyan-500/10
            px-4
            py-2
            text-xs
            font-semibold
            tracking-widest
            text-cyan-300
          ">
            MEASURED DATA & VALIDATION
          </div>

        </div>

      </div>


      {/* ======================================================
          BENCHMARK SUITE
          ====================================================== */}

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
              Tests curriculum-aware retrieval,
              grounding, answer generation and
              local inference performance.
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


        {/* ERROR */}

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


        {/* LOADING */}

        {loading && (
          <div className="
            mt-8
            animate-pulse
            text-cyan-300
          ">
            🧠 Running SRIMATHY evaluation suite...
          </div>
        )}


        {/* ====================================================
            BENCHMARK RESULT
            ==================================================== */}

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


            <div className="mt-8">

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
                  description="Grade, subject and curriculum isolation"
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

      </div>


      {/* ======================================================
          MODEL BENCHMARK
          ====================================================== */}

      <div className="mt-10">

        <div className="mb-5">

          <div className="
            text-sm
            uppercase
            tracking-widest
            text-cyan-400
          ">
            Model Performance
          </div>

          <h3 className="
            mt-2
            text-2xl
            font-bold
          ">
            ⚡ Local Quantization & Cloud Comparison
          </h3>

          <p className="
            mt-2
            max-w-3xl
            text-sm
            text-slate-400
          ">
            Empirical comparison of local
            Gemma inference across
            quantization levels and
            Cisco CIRCUIT cloud inference.
            Only measured runs are presented
            as benchmark results.
          </p>

        </div>

        <ModelBenchmarkDashboard />

      </div>


      {/* ======================================================
          NCERT CURRICULUM ALIGNMENT
          ====================================================== */}

      <div className="
        mt-12
        rounded-2xl
        border
        border-cyan-500/20
        bg-slate-950/70
        p-8
        shadow-xl
      ">

        <div className="
          flex
          flex-col
          gap-5
          lg:flex-row
          lg:items-start
          lg:justify-between
        ">

          <div>

            <div className="
              text-sm
              uppercase
              tracking-widest
              text-cyan-400
            ">
              Academic Validation
            </div>

            <h3 className="
              mt-2
              text-2xl
              font-bold
            ">
              📚 NCERT Curriculum Alignment
            </h3>

            <p className="
              mt-2
              max-w-3xl
              text-sm
              leading-6
              text-slate-400
            ">
              Rigorous validation of SRIMATHY's
              Curriculum Mapper and retrieval
              pipeline against NCERT-aligned
              Grade 5 curriculum benchmarks.
            </p>

          </div>

          <div className="
            shrink-0
            rounded-full
            border
            border-cyan-500/30
            bg-cyan-500/10
            px-4
            py-2
            text-xs
            font-semibold
            tracking-widest
            text-cyan-300
          ">
            NCERT BENCHMARK
          </div>

        </div>


        {/* EXPLANATION STRIP */}

        <div className="
          mt-7
          grid
          grid-cols-1
          gap-4
          md:grid-cols-3
        ">

          <ValidationPillar
            number="01"
            title="Retrieval"
            description="Does SRIMATHY retrieve the correct NCERT-aligned knowledge?"
          />

          <ValidationPillar
            number="02"
            title="Chapter Match"
            description="Does the retrieved content map to the expected curriculum chapter?"
          />

          <ValidationPillar
            number="03"
            title="Topic Coverage"
            description="Does the retrieved evidence cover the expected learning topic?"
          />

        </div>


        {/* ACTUAL DASHBOARD */}

        <div className="mt-8">

          <CurriculumAlignmentDashboard />

        </div>

      </div>


      {/* ======================================================
          AI RUNTIME
          ====================================================== */}

      <div className="mt-10">

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
                      runtime.privacy?.includes(
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


      {/* ======================================================
          CURRENT MEASURED MODELS
          Small verification strip
          ====================================================== */}

      {(q4 || q8 || circuit) && (
        <div className="
          mt-8
          rounded-xl
          border
          border-slate-800
          bg-slate-950/60
          p-6
        ">

          <div className="
            text-xs
            uppercase
            tracking-widest
            text-slate-500
          ">
            Current Benchmark Data
          </div>

          <div className="
            mt-4
            grid
            grid-cols-1
            gap-4
            md:grid-cols-3
          ">

            <MiniBenchmark
              label="Q4_K_M"
              model={
                q4?.model ||
                "gemma3:4b"
              }
              measured={isMeasured(q4)}
              latency={formatLatency(q4)}
              throughput={formatThroughput(q4)}
            />

            <MiniBenchmark
              label="Q8_0"
              model={
                q8?.model ||
                "gemma3:4b-it-q8_0"
              }
              measured={isMeasured(q8)}
              latency={formatLatency(q8)}
              throughput={formatThroughput(q8)}
            />

            <MiniBenchmark
              label="CIRCUIT"
              model={
                circuit?.model ||
                "gemini-3.1-flash-lite"
              }
              measured={isMeasured(circuit)}
              latency={formatLatency(circuit)}
              throughput={formatThroughput(circuit)}
            />

          </div>

        </div>
      )}

    </section>
  );
}


/* ============================================================
   METRIC
   ============================================================ */

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


/* ============================================================
   SCORE CARD
   ============================================================ */

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
        text-cyan-400
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


/* ============================================================
   INFO CARD
   ============================================================ */

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


/* ============================================================
   VALIDATION PILLAR
   ============================================================ */

function ValidationPillar({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="
      rounded-xl
      border
      border-slate-800
      bg-slate-900
      p-5
    ">

      <div className="
        text-xs
        font-bold
        tracking-widest
        text-cyan-400
      ">
        {number}
      </div>

      <div className="
        mt-2
        text-lg
        font-semibold
      ">
        {title}
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


/* ============================================================
   MINI BENCHMARK
   ============================================================ */

function MiniBenchmark({
  label,
  model,
  measured,
  latency,
  throughput,
}: {
  label: string;
  model: string;
  measured: boolean;
  latency: string;
  throughput: string;
}) {
  return (
    <div className="
      rounded-xl
      border
      border-slate-800
      bg-slate-900
      p-5
    ">

      <div className="
        flex
        items-center
        justify-between
      ">

        <div className="
          text-xs
          uppercase
          tracking-widest
          text-slate-500
        ">
          {label}
        </div>

        <div className={`
          rounded-full
          px-3
          py-1
          text-[10px]
          font-semibold
          ${
            measured
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-slate-800 text-slate-500"
          }
        `}>
          {measured
            ? "MEASURED"
            : "NOT MEASURED"}
        </div>

      </div>

      <div className="
        mt-4
        text-sm
        font-semibold
        text-slate-200
      ">
        {model}
      </div>

      <div className="
        mt-4
        grid
        grid-cols-2
        gap-4
      ">

        <div>

          <div className="
            text-[10px]
            uppercase
            tracking-widest
            text-slate-500
          ">
            Latency
          </div>

          <div className="
            mt-1
            text-sm
            font-bold
            text-cyan-400
          ">
            {latency}
          </div>

        </div>

        <div>

          <div className="
            text-[10px]
            uppercase
            tracking-widest
            text-slate-500
          ">
            Throughput
          </div>

          <div className="
            mt-1
            text-sm
            font-bold
          ">
            {throughput}
          </div>

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   RUNTIME ITEM
   ============================================================ */

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
