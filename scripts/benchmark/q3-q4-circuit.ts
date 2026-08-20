import { loadEnvConfig } from "@next/env";

import fs from "fs";
import path from "path";

// ============================================================
// LOAD NEXT.JS ENVIRONMENT
// ============================================================
//
// Important:
// `tsx` does NOT automatically load `.env.local`.
// Next.js does, but standalone scripts do not.
//
// This makes the benchmark use the same environment
// configuration as the Next.js application.
// ============================================================

loadEnvConfig(process.cwd());


// ============================================================
// ENVIRONMENT
// ============================================================

const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434";

const CIRCUIT_URL =
  process.env.CIRCUIT_URL ||
  "";

const CIRCUIT_MODEL =
  process.env.CIRCUIT_MODEL ||
  "gemini-3.1-flash-lite";

const CIRCUIT_API_KEY =
  process.env.CIRCUIT_API_KEY ||
  "";

const CIRCUIT_APP_KEY =
  process.env.CIRCUIT_APP_KEY ||
  "";


// ============================================================
// TEST PROMPTS
// ============================================================

const TEST_PROMPTS = [

  {
    id: "fractions",
    grade: "5",
    subject: "Mathematics",

    prompt:
      "Explain equivalent fractions to a Grade 5 student using a simple real-world example."
  },

  {
    id: "variables",
    grade: "6",
    subject: "Mathematics",

    prompt:
      "Explain the idea of variables to a Grade 6 student in a simple way with two examples."
  },

  {
    id: "fractions-advanced",
    grade: "7",
    subject: "Mathematics",

    prompt:
      "Explain fractions to a Grade 7 student. Include one worked example and two practice questions."
  }

];


// ============================================================
// RESULT TYPE
// ============================================================

type BenchmarkResult = {

  model: string;

  provider: string;

  promptId: string;

  grade: string;

  subject: string;

  latencyMs: number;

  loadDurationMs?: number;

  promptTokens?: number;

  outputTokens?: number;

  tokensPerSecond?: number;

  responseLength: number;

  response: string;

  error?: string;

};


// ============================================================
// OLLAMA BENCHMARK
// ============================================================

async function runOllama(
  model: string,
  test: typeof TEST_PROMPTS[number]
): Promise<BenchmarkResult> {

  const start =
    performance.now();

  try {

    const response =
      await fetch(
        `${OLLAMA_URL}/api/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              model,

              prompt:
                test.prompt,

              stream: false,

              options: {
                temperature: 0.2
              }

            })
        }
      );


    const latencyMs =
      performance.now() -
      start;


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `Ollama HTTP ${response.status}: ${errorText}`
      );

    }


    const data =
      await response.json();


    const outputTokens =
      data.eval_count ?? 0;


    const evalDuration =
      data.eval_duration ?? 0;


    const tokensPerSecond =
      evalDuration > 0

        ? outputTokens /
          (
            evalDuration /
            1_000_000_000
          )

        : 0;


    return {

      model,

      provider:
        "OLLAMA",

      promptId:
        test.id,

      grade:
        test.grade,

      subject:
        test.subject,

      latencyMs:
        Math.round(latencyMs),

      loadDurationMs:
        data.load_duration
          ? Math.round(
              data.load_duration /
              1_000_000
            )
          : undefined,

      promptTokens:
        data.prompt_eval_count,

      outputTokens,

      tokensPerSecond:
        Number(
          tokensPerSecond.toFixed(2)
        ),

      responseLength:
        data.response?.length ?? 0,

      response:
        data.response ?? ""

    };

  } catch (error) {

    return {

      model,

      provider:
        "OLLAMA",

      promptId:
        test.id,

      grade:
        test.grade,

      subject:
        test.subject,

      latencyMs:
        Math.round(
          performance.now() -
          start
        ),

      responseLength:
        0,

      response:
        "",

      error:
        error instanceof Error
          ? error.message
          : "Unknown error"

    };

  }

}


// ============================================================
// CIRCUIT BENCHMARK
// ============================================================

async function runCircuit(
  test: typeof TEST_PROMPTS[number]
): Promise<BenchmarkResult> {

  const start =
    performance.now();


  try {

    // --------------------------------------------------------
    // Validate configuration
    // --------------------------------------------------------

    if (!CIRCUIT_URL) {

      throw new Error(
        "CIRCUIT_URL is missing"
      );

    }


    if (!CIRCUIT_MODEL) {

      throw new Error(
        "CIRCUIT_MODEL is missing"
      );

    }


    if (!CIRCUIT_API_KEY) {

      throw new Error(
        "CIRCUIT_API_KEY is missing"
      );

    }


    // --------------------------------------------------------
    // Headers
    // --------------------------------------------------------

    const headers:
      Record<string, string> = {

        "Content-Type":
          "application/json",

        Accept:
          "application/json",

        Authorization:
          `Bearer ${CIRCUIT_API_KEY}`

      };


    if (CIRCUIT_APP_KEY) {

      headers["AppKey"] =
        CIRCUIT_APP_KEY;

    }


    // --------------------------------------------------------
    // Request
    // --------------------------------------------------------

    const response =
      await fetch(
        CIRCUIT_URL,
        {

          method: "POST",

          headers,

          body:
            JSON.stringify({

              model:
                CIRCUIT_MODEL,

              messages: [

                {
                  role:
                    "system",

                  content:
                    "You are an educational assistant. Explain concepts clearly for school students."
                },

                {
                  role:
                    "user",

                  content:
                    test.prompt
                }

              ],

              temperature:
                0.2,

              max_tokens:
                2048

            })

        }
      );


    const latencyMs =
      performance.now() -
      start;


    // --------------------------------------------------------
    // Read response safely
    // --------------------------------------------------------

    const raw =
      await response.text();


    let data: any;

    try {

      data =
        JSON.parse(raw);

    } catch {

      data = {
        raw
      };

    }


    // --------------------------------------------------------
    // HTTP error
    // --------------------------------------------------------

    if (!response.ok) {

      const detail =
        data?.error?.message ??
        data?.message ??
        data?.raw ??
        `HTTP ${response.status}`;


      throw new Error(
        `CIRCUIT HTTP ${response.status}: ${detail}`
      );

    }


    // --------------------------------------------------------
    // Extract response
    // --------------------------------------------------------

    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      "";


    if (!content) {

      throw new Error(
        "CIRCUIT returned no response content"
      );

    }


    return {

      model:
        CIRCUIT_MODEL,

      provider:
        "CIRCUIT",

      promptId:
        test.id,

      grade:
        test.grade,

      subject:
        test.subject,

      latencyMs:
        Math.round(latencyMs),

      responseLength:
        content.length,

      response:
        content

    };


  } catch (error) {

    return {

      model:
        CIRCUIT_MODEL,

      provider:
        "CIRCUIT",

      promptId:
        test.id,

      grade:
        test.grade,

      subject:
        test.subject,

      latencyMs:
        Math.round(
          performance.now() -
          start
        ),

      responseLength:
        0,

      response:
        "",

      error:
        error instanceof Error
          ? error.message
          : "Unknown error"

    };

  }

}


// ============================================================
// MAIN BENCHMARK
// ============================================================

async function main() {

  console.log("");

  console.log(
    "============================================================"
  );

  console.log(
    " SRIMATHY — Q3 vs Q4 vs CIRCUIT BENCHMARK"
  );

  console.log(
    "============================================================"
  );


  console.log("");

  console.log(
    `Test prompts: ${TEST_PROMPTS.length}`
  );


  console.log("");

  console.log(
    "Models:"
  );

  console.log(
    "  • Gemma 3 4B Q3_K_M"
  );

  console.log(
    "  • Gemma 3 4B Q4_K_M"
  );

  console.log(
    "  • Cisco CIRCUIT"
  );


  console.log("");

  // ----------------------------------------------------------
  // Safe configuration check
  // ----------------------------------------------------------

  console.log(
    "Configuration:"
  );

  console.log(
    `  Ollama URL : ${OLLAMA_URL}`
  );

  console.log(
    `  CIRCUIT URL: ${
      CIRCUIT_URL
        ? "CONFIGURED"
        : "MISSING"
    }`
  );

  console.log(
    `  CIRCUIT KEY: ${
      CIRCUIT_API_KEY
        ? "CONFIGURED"
        : "MISSING"
    }`
  );

  console.log(
    `  CIRCUIT APP: ${
      CIRCUIT_APP_KEY
        ? "CONFIGURED"
        : "MISSING"
    }`
  );

  console.log("");


  // ----------------------------------------------------------
  // Results
  // ----------------------------------------------------------

  const results:
    BenchmarkResult[] = [];


  // ==========================================================
  // RUN ALL PROMPTS
  // ==========================================================

  for (
    const test of TEST_PROMPTS
  ) {

    console.log("");

    console.log(
      `📘 ${test.id.toUpperCase()} — Grade ${test.grade}`
    );

    console.log(
      `   ${test.prompt}`
    );

    console.log("");


    // --------------------------------------------------------
    // Q3
    // --------------------------------------------------------

    console.log(
      "   🤖 Gemma Q3..."
    );


    const q3 =
      await runOllama(
        "gemma3:4b-q3",
        test
      );


    results.push(q3);


    console.log(
      `      ${q3.latencyMs} ms`
    );


    if (q3.tokensPerSecond) {

      console.log(
        `      ${q3.tokensPerSecond.toFixed(1)} tok/s`
      );

    }


    if (q3.error) {

      console.log(
        `      ❌ ${q3.error}`
      );

    }


    // --------------------------------------------------------
    // Q4
    // --------------------------------------------------------

    console.log(
      "   🤖 Gemma Q4..."
    );


    const q4 =
      await runOllama(
        "gemma3:4b",
        test
      );


    results.push(q4);


    console.log(
      `      ${q4.latencyMs} ms`
    );


    if (q4.tokensPerSecond) {

      console.log(
        `      ${q4.tokensPerSecond.toFixed(1)} tok/s`
      );

    }


    if (q4.error) {

      console.log(
        `      ❌ ${q4.error}`
      );

    }


    // --------------------------------------------------------
    // CIRCUIT
    // --------------------------------------------------------

    console.log(
      "   ☁️ CIRCUIT..."
    );


    const circuit =
      await runCircuit(test);


    results.push(circuit);


    console.log(
      `      ${circuit.latencyMs} ms`
    );


    if (circuit.error) {

      console.log(
        `      ❌ ${circuit.error}`
      );

    }

  }


  // ==========================================================
  // SAVE RAW RESULTS
  // ==========================================================

  const outputDir =
    path.join(
      process.cwd(),
      "benchmark-results"
    );


  fs.mkdirSync(
    outputDir,
    {
      recursive: true
    }
  );


  const outputFile =
    path.join(
      outputDir,
      `q3-q4-circuit-${Date.now()}.json`
    );


  fs.writeFileSync(

    outputFile,

    JSON.stringify(

      {

        generatedAt:
          new Date().toISOString(),

        benchmark:
          "SRIMATHY Q3 vs Q4 vs CIRCUIT",

        prompts:
          TEST_PROMPTS,

        results

      },

      null,

      2

    )

  );


  // ==========================================================
  // SUMMARY
  // ==========================================================

  console.log("");

  console.log(
    "============================================================"
  );

  console.log(
    " BENCHMARK SUMMARY"
  );

  console.log(
    "============================================================"
  );

  console.log("");


  console.log(
    "Provider       Model                  Avg Latency"
  );

  console.log(
    "------------------------------------------------------------"
  );


  const groups =
    new Map<
      string,
      BenchmarkResult[]
    >();


  for (
    const result of results
  ) {

    const key =
      `${result.provider}|${result.model}`;


    if (
      !groups.has(key)
    ) {

      groups.set(
        key,
        []
      );

    }


    groups
      .get(key)!
      .push(result);

  }


  // ==========================================================
  // PRINT GROUP SUMMARY
  // ==========================================================

  for (
    const [
      key,
      group
    ]
    of groups
  ) {

    const [
      provider,
      model
    ] =
      key.split("|");


    const successful =
      group.filter(
        item =>
          !item.error
      );


    if (
      successful.length === 0
    ) {

      console.log(

        provider.padEnd(15) +

        model.padEnd(23) +

        "FAILED"

      );

      continue;

    }


    const avgLatency =
      successful.reduce(

        (
          sum,
          item
        ) =>
          sum +
          item.latencyMs,

        0

      ) /
      successful.length;


    const tokValues =
      successful

        .map(
          item =>
            item.tokensPerSecond
        )

        .filter(
          (
            value
          ): value is number =>
            typeof value ===
              "number" &&
            value > 0
        );


    const avgTok =
      tokValues.length > 0

        ? tokValues.reduce(
            (
              sum,
              value
            ) =>
              sum +
              value,

            0

          ) /
          tokValues.length

        : null;


    console.log(

      provider.padEnd(15) +

      model.padEnd(23) +

      `${Math.round(
        avgLatency
      )} ms` +

      (

        avgTok !== null

          ? ` | ${avgTok.toFixed(
              1
            )} tok/s`

          : ""

      )

    );

  }


  // ==========================================================
  // RESEARCH COMPARISON
  // ==========================================================

  const q3Results =
    results.filter(
      result =>
        result.model ===
        "gemma3:4b-q3" &&
        !result.error
    );


  const q4Results =
    results.filter(
      result =>
        result.model ===
        "gemma3:4b" &&
        !result.error
    );


  const circuitResults =
    results.filter(
      result =>
        result.provider ===
        "CIRCUIT" &&
        !result.error
    );


  function averageLatency(
    items: BenchmarkResult[]
  ): number | null {

    if (
      items.length === 0
    ) {

      return null;

    }


    return (

      items.reduce(
        (
          sum,
          item
        ) =>
          sum +
          item.latencyMs,

        0
      ) /
      items.length

    );

  }


  const q3Latency =
    averageLatency(q3Results);


  const q4Latency =
    averageLatency(q4Results);


  const circuitLatency =
    averageLatency(circuitResults);


  console.log("");

  console.log(
    "============================================================"
  );

  console.log(
    " RESEARCH COMPARISON"
  );

  console.log(
    "============================================================"
  );


  if (
    q3Latency !== null
  ) {

    console.log(
      `Gemma Q3 average : ${Math.round(q3Latency)} ms`
    );

  }


  if (
    q4Latency !== null
  ) {

    console.log(
      `Gemma Q4 average : ${Math.round(q4Latency)} ms`
    );

  }


  if (
    circuitLatency !== null
  ) {

    console.log(
      `CIRCUIT average   : ${Math.round(circuitLatency)} ms`
    );

  }


  if (
    q3Latency !== null &&
    q4Latency !== null
  ) {

    const improvement =
      (
        (
          q4Latency -
          q3Latency
        ) /
        q4Latency
      ) *
      100;


    console.log(
      `Q3 vs Q4         : ${improvement.toFixed(1)}% faster`
    );

  }


  if (
    circuitLatency !== null &&
    q3Latency !== null
  ) {

    const speedup =
      q3Latency /
      circuitLatency;


    console.log(
      `CIRCUIT vs Q3    : ${speedup.toFixed(1)}× faster`
    );

  }


  if (
    circuitLatency !== null &&
    q4Latency !== null
  ) {

    const speedup =
      q4Latency /
      circuitLatency;


    console.log(
      `CIRCUIT vs Q4    : ${speedup.toFixed(1)}× faster`
    );

  }


  console.log("");

  console.log(
    "Results saved:"
  );

  console.log(
    outputFile
  );


  console.log("");

  console.log(
    "============================================================"
  );

}


// ============================================================
// RUN
// ============================================================

main().catch(
  error => {

    console.error("");

    console.error(
      "❌ Benchmark failed:"
    );

    console.error(error);

    process.exit(1);

  }
);