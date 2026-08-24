import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import ollama from "ollama";

const RUNS = 3;

const MODELS = [
  {
    model: "gemma3:4b",
    quantization: "Q4_K_M",
  },
  {
    model: "gemma3:4b-it-q8_0",
    quantization: "Q8_0",
  },
];

const PROMPT =
  "Explain equivalent fractions to a Grade 5 student using one simple real-world example. Keep the answer concise and classroom friendly.";

type MemorySample = {
  timestamp: number;
  usedBytes: number;
  freeBytes: number;
};

type ProfileResult = {
  model: string;
  quantization: string;

  run: number;

  loadDurationMs: number | null;

  totalLatencyMs: number;
  prefillLatencyMs: number | null;
  generationLatencyMs: number | null;

  promptTokens: number | null;
  outputTokens: number | null;

  prefillTokensPerSecond: number | null;
  generationTokensPerSecond: number | null;

  peakUsedMemoryGB: number | null;
  baselineUsedMemoryGB: number | null;
  memoryDeltaGB: number | null;

  responseLength: number;

  timestamp: string;

  error?: string;
};

function getMemory(): MemorySample | null {
  try {
    /*
     * macOS vm_stat reports memory pages.
     * This is system unified-memory usage, not
     * dedicated GPU VRAM.
     */

    const output =
      execFileSync(
        "vm_stat",
        [],
        {
          encoding: "utf8",
        }
      );

    const pageSizeMatch =
      output.match(
        /page size of (\d+) bytes/
      );

    const pageSize =
      pageSizeMatch
        ? Number(pageSizeMatch[1])
        : 4096;

    function pages(
      label: string
    ): number {

      const escaped =
        label.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const match =
        output.match(
          new RegExp(
            `${escaped}:\\s+(\\d+)`
          )
        );

      return match
        ? Number(match[1])
        : 0;
    }

    const free =
      pages("Pages free");

    const active =
      pages("Pages active");

    const inactive =
      pages("Pages inactive");

    const wired =
      pages("Pages wired down");

    const compressed =
      pages("Pages occupied by compressor");

    const used =
      (
        active +
        inactive +
        wired +
        compressed
      ) *
      pageSize;

    return {
      timestamp:
        Date.now(),

      usedBytes:
        used,

      freeBytes:
        free * pageSize,
    };

  } catch {
    return null;
  }
}

function gb(bytes: number) {
  return bytes /
    (1024 ** 3);
}

function sleep(ms: number) {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        ms
      )
  );
}

async function runModel(
  model: string,
  quantization: string,
  run: number
): Promise<ProfileResult> {

  console.log("");
  console.log(
    `🧪 ${quantization} — Run ${run}/${RUNS}`
  );

  const baseline =
    getMemory();

  /*
   * Explicitly load/warm the model first.
   * This separates model loading from steady-state
   * inference.
   */

  console.log(
    "🔥 Loading / warming model..."
  );

  let loadDurationMs:
    number | null = null;

  try {

    const loadStart =
      performance.now();

    await ollama.generate({
      model,

      prompt:
        "Say ready.",

      stream:
        false,

      options: {
        temperature: 0,

        num_ctx:
          4096,
      },
    });

    loadDurationMs =
      Math.round(
        performance.now() -
          loadStart
      );

  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : "Model load failed.";

    return {
      model,
      quantization,
      run,
      loadDurationMs,
      totalLatencyMs: 0,
      prefillLatencyMs: null,
      generationLatencyMs: null,
      promptTokens: null,
      outputTokens: null,
      prefillTokensPerSecond: null,
      generationTokensPerSecond: null,
      peakUsedMemoryGB: null,
      baselineUsedMemoryGB:
        baseline
          ? gb(baseline.usedBytes)
          : null,
      memoryDeltaGB: null,
      responseLength: 0,
      timestamp:
        new Date().toISOString(),
      error: message,
    };
  }

  await sleep(500);

  /*
   * Now run the actual measured request.
   */

  console.log(
    "📊 Measuring inference..."
  );

  const start =
    performance.now();

  let peakMemory =
    baseline;

  const sampler =
    setInterval(() => {

      const sample =
        getMemory();

      if (
        sample &&
        (
          !peakMemory ||
          sample.usedBytes >
            peakMemory.usedBytes
        )
      ) {
        peakMemory =
          sample;
      }

    }, 50);

  try {

    const response =
      await ollama.generate({
        model,

        prompt:
          PROMPT,

        stream:
          false,

        options: {
          temperature:
            0,

          num_ctx:
            4096,
        },
      });

    clearInterval(
      sampler
    );

    const totalLatencyMs =
      Math.round(
        performance.now() -
          start
      );

    /*
     * Capture one final memory sample.
     */

    const finalMemory =
      getMemory();

    if (
      finalMemory &&
      (
        !peakMemory ||
        finalMemory.usedBytes >
          peakMemory.usedBytes
      )
    ) {
      peakMemory =
        finalMemory;
    }

    const promptTokens =
      response.prompt_eval_count ??
      null;

    const outputTokens =
      response.eval_count ??
      null;

    const promptDurationNs =
      response.prompt_eval_duration ??
      null;

    const generationDurationNs =
      response.eval_duration ??
      null;

    const prefillLatencyMs =
      promptDurationNs !== null
        ? promptDurationNs /
          1_000_000
        : null;

    const generationLatencyMs =
      generationDurationNs !== null
        ? generationDurationNs /
          1_000_000
        : null;

    const prefillTokensPerSecond =
      promptTokens !== null &&
      promptDurationNs !== null &&
      promptDurationNs > 0
        ? promptTokens /
          (
            promptDurationNs /
            1_000_000_000
          )
        : null;

    const generationTokensPerSecond =
      outputTokens !== null &&
      generationDurationNs !== null &&
      generationDurationNs > 0
        ? outputTokens /
          (
            generationDurationNs /
            1_000_000_000
          )
        : null;

    const baselineGB =
      baseline
        ? gb(
            baseline.usedBytes
          )
        : null;

    const peakGB =
      peakMemory
        ? gb(
            peakMemory.usedBytes
          )
        : null;

    const memoryDeltaGB =
      baselineGB !== null &&
      peakGB !== null
        ? peakGB -
          baselineGB
        : null;

    console.log(
      `   Total latency: ${totalLatencyMs} ms`
    );

    console.log(
      `   Prefill: ${
        prefillLatencyMs !== null
          ? `${prefillLatencyMs.toFixed(1)} ms`
          : "not reported"
      }`
    );

    console.log(
      `   Generation: ${
        generationLatencyMs !== null
          ? `${generationLatencyMs.toFixed(1)} ms`
          : "not reported"
      }`
    );

    console.log(
      `   Generation speed: ${
        generationTokensPerSecond !== null
          ? `${generationTokensPerSecond.toFixed(
              2
            )} tok/s`
          : "not reported"
      }`
    );

    console.log(
      `   Peak unified memory: ${
        peakGB !== null
          ? `${peakGB.toFixed(2)} GB`
          : "not measured"
      }`
    );

    console.log(
      `   Memory delta: ${
        memoryDeltaGB !== null
          ? `${memoryDeltaGB.toFixed(
              2
            )} GB`
          : "not measured"
      }`
    );

    return {
      model,
      quantization,
      run,

      loadDurationMs,

      totalLatencyMs,

      prefillLatencyMs,

      generationLatencyMs,

      promptTokens,

      outputTokens,

      prefillTokensPerSecond,

      generationTokensPerSecond,

      peakUsedMemoryGB:
        peakGB,

      baselineUsedMemoryGB:
        baselineGB,

      memoryDeltaGB,

      responseLength:
        response.response?.length ??
        0,

      timestamp:
        new Date().toISOString(),
    };

  } catch (error) {

    clearInterval(
      sampler
    );

    const message =
      error instanceof Error
        ? error.message
        : "Inference failed.";

    return {
      model,
      quantization,
      run,

      loadDurationMs,

      totalLatencyMs: 0,

      prefillLatencyMs: null,

      generationLatencyMs: null,

      promptTokens: null,

      outputTokens: null,

      prefillTokensPerSecond: null,

      generationTokensPerSecond: null,

      peakUsedMemoryGB:
        peakMemory
          ? gb(
              peakMemory.usedBytes
            )
          : null,

      baselineUsedMemoryGB:
        baseline
          ? gb(
              baseline.usedBytes
            )
          : null,

      memoryDeltaGB:
        null,

      responseLength: 0,

      timestamp:
        new Date().toISOString(),

      error: message,
    };
  }
}

async function main() {

  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "🧠 SRIMATHY HARDWARE PROFILER"
  );
  console.log(
    "======================================"
  );

  console.log(
    "Hardware: Apple M5 Pro"
  );

  console.log(
    "Memory: 24 GB unified memory"
  );

  console.log(
    "Runtime: Ollama / Apple Silicon"
  );

  console.log(
    `Runs per model: ${RUNS}`
  );

  console.log(
    `Prompt: ${PROMPT}`
  );

  console.log("");
  console.log(
    "⚠️ Memory is measured as macOS unified"
  );
  console.log(
    "   system memory usage, not dedicated VRAM."
  );


  const results:
    ProfileResult[] = [];


  for (
    const modelInfo of
      MODELS
  ) {

    console.log("");
    console.log(
      "======================================"
    );

    console.log(
      `${modelInfo.model} · ${modelInfo.quantization}`
    );

    console.log(
      "======================================"
    );

    /*
     * Make sure this model is loaded before
     * measured runs.
     */

    for (
      let run = 1;
      run <= RUNS;
      run++
    ) {

      const result =
        await runModel(
          modelInfo.model,
          modelInfo.quantization,
          run
        );

      results.push(
        result
      );

      /*
       * Give macOS a moment between runs.
       */

      await sleep(750);
    }
  }


  const generatedAt =
    new Date().toISOString();

  const output = {
    generatedAt,

    benchmark:
      "q4-q8-hardware-profile",

    hardware: {
      platform:
        "Apple MacBook Pro",

      processor:
        "Apple M5 Pro",

      cpuCores:
        15,

      memoryGB:
        24,

      memoryType:
        "Unified Memory",

      runtime:
        "Ollama / Apple Silicon",
    },

    prompt:
      PROMPT,

    runsPerModel:
      RUNS,

    results,
  };


  const directory =
    path.join(
      process.cwd(),
      "benchmark-results"
    );

  fs.mkdirSync(
    directory,
    {
      recursive: true,
    }
  );


  const filename =
    `hardware-profile-${Date.now()}.json`;

  const outputPath =
    path.join(
      directory,
      filename
    );


  fs.writeFileSync(
    outputPath,

    JSON.stringify(
      output,
      null,
      2
    )
  );


  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "✅ HARDWARE PROFILE COMPLETE"
  );
  console.log(
    "======================================"
  );

  console.log(
    `Results: ${outputPath}`
  );

  console.log(
    `Measurements: ${results.length}`
  );

  console.log("");

  for (
    const result of
      results
  ) {

    console.log(
      `${result.quantization} Run ${result.run}:`
    );

    console.log(
      `  Total       : ${result.totalLatencyMs} ms`
    );

    console.log(
      `  Prefill     : ${
        result.prefillLatencyMs !== null
          ? `${result.prefillLatencyMs.toFixed(
              1
            )} ms`
          : "N/A"
      }`
    );

    console.log(
      `  Generation  : ${
        result.generationTokensPerSecond !== null
          ? `${result.generationTokensPerSecond.toFixed(
              2
            )} tok/s`
          : "N/A"
      }`
    );

    console.log(
      `  Peak memory : ${
        result.peakUsedMemoryGB !== null
          ? `${result.peakUsedMemoryGB.toFixed(
              2
            )} GB`
          : "N/A"
      }`
    );

    console.log(
      `  Memory Δ    : ${
        result.memoryDeltaGB !== null
          ? `${result.memoryDeltaGB.toFixed(
              2
            )} GB`
          : "N/A"
      }`
    );

  }

}

main().catch(
  (error) => {

    console.error(
      "❌ Hardware profiler failed:",
      error
    );

    process.exit(1);
  }
);
