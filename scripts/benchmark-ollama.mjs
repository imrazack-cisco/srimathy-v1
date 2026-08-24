import { execSync } from "child_process";

const MODELS = [
  "gemma3:4b-q3",
  "gemma3:4b",
];

const PROMPT =
  "Explain fractions to a Grade 5 student using one simple example. Keep the explanation concise.";

const RUNS = 5;

function run(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

function parseOllamaResponse(raw) {
  const lines =
    raw
      .split("\n")
      .filter(Boolean);

  const records =
    lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return records.at(-1);
}

function getOllamaPs() {
  try {
    return run("ollama ps");
  } catch {
    return "";
  }
}

function parseMemory(model, ps) {
  const lines =
    ps.split("\n");

  const line =
    lines.find(
      l => l.startsWith(model)
    );

  if (!line) {
    return null;
  }

  const parts =
    line.trim().split(/\s+/);

  return {
    raw: line,
    size: parts[2] ?? null,
    processor: parts[3] ?? null,
    context: parts[4] ?? null,
  };
}

async function benchmarkModel(model) {

  console.log("\n======================================");
  console.log(`🧪 MODEL: ${model}`);
  console.log("======================================");

  /*
   * Ensure model is loaded.
   */
  console.log("Loading model...");

  run(
    `ollama run ${model} "${PROMPT.replaceAll('"', '\\"')}" >/dev/null`
  );

  await sleep(1000);

  const samples = [];

  for (
    let i = 1;
    i <= RUNS;
    i++
  ) {

    console.log(
      `Run ${i}/${RUNS}...`
    );

    const start =
      performance.now();

    const raw =
      run(
        `curl -s http://localhost:11434/api/generate ` +
        `-H "Content-Type: application/json" ` +
        `-d '${JSON.stringify({
          model,
          prompt: PROMPT,
          stream: false,
          options: {
            temperature: 0,
          },
        }).replaceAll("'", "'\\''")}'`
      );

    const wallMs =
      performance.now() - start;

    const result =
      JSON.parse(raw);

    const promptTokens =
      Number(
        result.prompt_eval_count ?? 0
      );

    const promptDurationNs =
      Number(
        result.prompt_eval_duration ?? 0
      );

    const outputTokens =
      Number(
        result.eval_count ?? 0
      );

    const generationDurationNs =
      Number(
        result.eval_duration ?? 0
      );

    const totalDurationNs =
      Number(
        result.total_duration ?? 0
      );

    const prefillMs =
      promptDurationNs / 1_000_000;

    const generationMs =
      generationDurationNs / 1_000_000;

    const generationTokensPerSecond =
      generationDurationNs > 0
        ? outputTokens /
          (generationDurationNs / 1_000_000_000)
        : 0;

    const prefillTokensPerSecond =
      promptDurationNs > 0
        ? promptTokens /
          (promptDurationNs / 1_000_000_000)
        : 0;

    samples.push({
      wallMs,
      promptTokens,
      outputTokens,
      prefillMs,
      generationMs,
      totalMs:
        totalDurationNs /
        1_000_000,
      prefillTokensPerSecond,
      generationTokensPerSecond,
    });

  }

  const ps =
    getOllamaPs();

  const memory =
    parseMemory(
      model,
      ps
    );

  function average(key) {

    return (
      samples.reduce(
        (sum, sample) =>
          sum + sample[key],
        0
      ) /
      samples.length
    );

  }

  function percentile(
    key,
    percentile
  ) {

    const values =
      samples
        .map(s => s[key])
        .sort(
          (a, b) =>
            a - b
        );

    const index =
      Math.min(
        values.length - 1,
        Math.ceil(
          percentile *
          values.length
        ) - 1
      );

    return values[index];

  }

  const result = {

    model,

    quantization:
      model.includes("q3")
        ? "Q3_K_M"
        : "Q4_K_M",

    runs:
      samples.length,

    memory,

    prefill: {

      averageMs:
        average("prefillMs"),

      p95Ms:
        percentile(
          "prefillMs",
          0.95
        ),

      averageTokensPerSecond:
        average(
          "prefillTokensPerSecond"
        ),

    },

    generation: {

      averageMs:
        average("generationMs"),

      p95Ms:
        percentile(
          "generationMs",
          0.95
        ),

      averageTokensPerSecond:
        average(
          "generationTokensPerSecond"
        ),

    },

    total: {

      averageMs:
        average("totalMs"),

      p95Ms:
        percentile(
          "totalMs",
          0.95
        ),

    },

    rawSamples:
      samples,

  };

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}


console.log(
  "======================================"
);

console.log(
  "🧪 SRIMATHY OLLAMA HARDWARE BENCHMARK"
);

console.log(
  "======================================"
);

console.log(
  "Hardware:"
);

try {
  console.log(
    run(
      "system_profiler SPHardwareDataType | grep -E 'Model Name|Chip:|Memory:'"
    )
  );
} catch {
  console.log(
    "Hardware information unavailable"
  );
}

console.log(
  "\nOllama:"
);

try {
  console.log(
    run(
      "ollama --version"
    )
  );
} catch {
  console.log(
    "Ollama unavailable"
  );
}


const results = [];

for (
  const model of MODELS
) {

  results.push(
    await benchmarkModel(
      model
    )
  );

}


console.log(
  "\n======================================"
);

console.log(
  "📊 FINAL COMPARISON"
);

console.log(
  "======================================"
);

for (
  const result of results
) {

  console.log(
    `\n${result.model} (${result.quantization})`
  );

  console.log(
    `Prefill P95       : ${result.prefill.p95Ms.toFixed(1)} ms`
  );

  console.log(
    `Prefill tok/s     : ${result.prefill.averageTokensPerSecond.toFixed(2)}`
  );

  console.log(
    `Generation P95    : ${result.generation.p95Ms.toFixed(1)} ms`
  );

  console.log(
    `Generation tok/s  : ${result.generation.averageTokensPerSecond.toFixed(2)}`
  );

  console.log(
    `Total P95         : ${result.total.p95Ms.toFixed(1)} ms`
  );

  console.log(
    `Loaded footprint  : ${result.memory?.size ?? "N/A"}`
  );

  console.log(
    `Processor         : ${result.memory?.processor ?? "N/A"}`
  );

}

console.log(
  "\n======================================"
);

console.log(
  "⚠️ NOTE"
);

console.log(
  "Q3_K_M and Q4_K_M are measured here."
);

console.log(
  "No Q8 benchmark is claimed unless a real Q8 model is installed."
);

console.log(
  "======================================"
);
