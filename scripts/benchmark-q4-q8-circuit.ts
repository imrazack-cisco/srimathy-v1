import fs from "fs";
import path from "path";
import ollama from "ollama";

const RUNS = 3;

const LOCAL_MODELS = [
  {
    provider: "OLLAMA",
    model: "gemma3:4b",
    label: "Gemma 3 4B Q4_K_M",
  },
  {
    provider: "OLLAMA",
    model: "gemma3:4b-it-q8_0",
    label: "Gemma 3 4B Q8_0",
  },
];

const CIRCUIT_URL =
  process.env.CIRCUIT_URL || "";

const CIRCUIT_MODEL =
  process.env.CIRCUIT_MODEL ||
  "gemini-3.1-flash-lite";

const CIRCUIT_APP_KEY =
  process.env.CIRCUIT_APP_KEY || "";

const CIRCUIT_CLIENT_ID =
  process.env.CIRCUIT_CLIENT_ID || "";

const CIRCUIT_CLIENT_SECRET =
  process.env.CIRCUIT_CLIENT_SECRET || "";

const CIRCUIT_TOKEN_URL =
  process.env.CIRCUIT_TOKEN_URL ||
  "https://id.cisco.com/oauth2/default/v1/token";


const TEST_PROMPTS = [
  {
    id: "fractions",
    grade: "5",
    subject: "Mathematics",
    prompt:
      "Explain equivalent fractions to a Grade 5 student using a simple example.",
  },

  {
    id: "large-numbers",
    grade: "5",
    subject: "Mathematics",
    prompt:
      "Explain how to read and write large numbers to a Grade 5 student.",
  },

  {
    id: "weight-capacity",
    grade: "5",
    subject: "Mathematics",
    prompt:
      "Explain weight and capacity to a Grade 5 student with simple examples.",
  },
];


type BenchmarkResult = {
  provider: string;
  model: string;
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


type TokenCache = {
  accessToken: string;
  expiresAt: number;
};


let tokenCache:
  TokenCache | null = null;


async function getCircuitAccessToken() {

  const now =
    Date.now();

  if (
    tokenCache &&
    now <
      tokenCache.expiresAt - 60_000
  ) {
    return tokenCache.accessToken;
  }

  if (
    !CIRCUIT_CLIENT_ID ||
    !CIRCUIT_CLIENT_SECRET
  ) {
    throw new Error(
      "CIRCUIT credentials are missing."
    );
  }

  const body =
    new URLSearchParams({
      grant_type:
        "client_credentials",

      client_id:
        CIRCUIT_CLIENT_ID,

      client_secret:
        CIRCUIT_CLIENT_SECRET,
    });

  const response =
    await fetch(
      CIRCUIT_TOKEN_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",

          Accept:
            "application/json",
        },

        body:
          body.toString(),
      }
    );

  const raw =
    await response.text();

  let data: any;

  try {
    data =
      JSON.parse(raw);
  } catch {
    throw new Error(
      `CIRCUIT token endpoint returned invalid JSON: ${raw.slice(
        0,
        300
      )}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `CIRCUIT token request failed (${response.status}): ${
        data?.error_description ??
        data?.error ??
        raw
      }`
    );
  }

  if (!data?.access_token) {
    throw new Error(
      "CIRCUIT response did not contain access_token."
    );
  }

  const expiresIn =
    Number(
      data.expires_in ?? 3600
    );

  tokenCache = {
    accessToken:
      data.access_token,

    expiresAt:
      Date.now() +
      expiresIn * 1000,
  };

  return data.access_token;
}


async function runOllama(
  model: string,
  prompt: string
) {

  const start =
    performance.now();

  const response =
    await ollama.generate({
      model,

      prompt,

      stream: false,

      options: {
        temperature: 0.2,

        num_ctx: 4096,
      },
    });

  const latencyMs =
    Math.round(
      performance.now() -
        start
    );

  const outputTokens =
    response.eval_count;

  const promptTokens =
    response.prompt_eval_count;

  const evalDurationNs =
    response.eval_duration;

  const tokensPerSecond =
    typeof outputTokens ===
        "number" &&
    typeof evalDurationNs ===
        "number" &&
    evalDurationNs > 0
      ? outputTokens /
        (evalDurationNs / 1e9)
      : undefined;

  return {
    latencyMs,

    promptTokens,

    outputTokens,

    tokensPerSecond,

    response:
      response.response?.trim() ||
      "",
  };
}


async function runCircuit(
  prompt: string
) {

  const start =
    performance.now();

  let token =
    await getCircuitAccessToken();

  async function request(
    accessToken: string
  ) {

    return fetch(
      CIRCUIT_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          "api-key":
            accessToken,
        },

        body: JSON.stringify({

          messages: [
            {
              role:
                "system",

              content:
                "You are SRIMATHY, an educational assistant. Explain concepts clearly and accurately for school students.",
            },

            {
              role:
                "user",

              content:
                prompt,
            },
          ],

          user:
            JSON.stringify({
              appkey:
                CIRCUIT_APP_KEY,
            }),

          temperature:
            0.2,

        }),
      }
    );
  }

  let response =
    await request(token);

  if (
    response.status === 401 ||
    response.status === 403
  ) {

    tokenCache =
      null;

    token =
      await getCircuitAccessToken();

    response =
      await request(token);
  }

  const raw =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `CIRCUIT generation failed (${response.status}): ${raw.slice(
        0,
        500
      )}`
    );
  }

  let data: any;

  try {
    data =
      JSON.parse(raw);
  } catch {
    throw new Error(
      `CIRCUIT returned invalid JSON: ${raw.slice(
        0,
        300
      )}`
    );
  }

  const content =
    data?.choices?.[0]?.message?.content ??
    "";

  if (!content) {
    throw new Error(
      "CIRCUIT returned empty response."
    );
  }

  const latencyMs =
    Math.round(
      performance.now() -
        start
    );

  return {
    latencyMs,

    response:
      content.trim(),

    /*
     * CIRCUIT response does not necessarily
     * expose comparable token timing.
     *
     * Therefore we deliberately leave
     * tokens/sec undefined rather than
     * inventing a value.
     */
    tokensPerSecond:
      undefined,
  };
}


async function run() {

  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "🧪 SRIMATHY Q4 / Q8 / CIRCUIT BENCHMARK"
  );
  console.log(
    "======================================"
  );

  console.log(
    `Runs per model/prompt: ${RUNS}`
  );

  console.log(
    `Prompts: ${TEST_PROMPTS.length}`
  );

  console.log("");


  const results:
    BenchmarkResult[] = [];


  /*
   * LOCAL OLLAMA
   */

  for (
    const modelInfo of
      LOCAL_MODELS
  ) {

    console.log(
      `\n🦙 ${modelInfo.label}`
    );

    for (
      const test of
        TEST_PROMPTS
    ) {

      for (
        let runNumber = 1;
        runNumber <= RUNS;
        runNumber++
      ) {

        console.log(
          `  ${test.id} — run ${runNumber}/${RUNS}`
        );

        try {

          const result =
            await runOllama(
              modelInfo.model,
              test.prompt
            );

          results.push({

            provider:
              modelInfo.provider,

            model:
              modelInfo.model,

            promptId:
              test.id,

            grade:
              test.grade,

            subject:
              test.subject,

            latencyMs:
              result.latencyMs,

            promptTokens:
              result.promptTokens,

            outputTokens:
              result.outputTokens,

            tokensPerSecond:
              result.tokensPerSecond,

            responseLength:
              result.response.length,

            response:
              result.response,

          });

          console.log(
            `    ✅ ${result.latencyMs} ms${
              result.tokensPerSecond
                ? ` · ${result.tokensPerSecond.toFixed(
                    1
                  )} tok/s`
                : ""
            }`
          );

        } catch (error) {

          const message =
            error instanceof Error
              ? error.message
              : "Unknown error.";

          console.error(
            `    ❌ ${message}`
          );

          results.push({

            provider:
              modelInfo.provider,

            model:
              modelInfo.model,

            promptId:
              test.id,

            grade:
              test.grade,

            subject:
              test.subject,

            latencyMs:
              0,

            responseLength:
              0,

            response:
              "",

            error:
              message,

          });

        }

      }

    }

  }


  /*
   * CIRCUIT
   */

  if (CIRCUIT_URL) {

    console.log(
      `\n☁️ CIRCUIT — ${CIRCUIT_MODEL}`
    );

    for (
      const test of
        TEST_PROMPTS
    ) {

      for (
        let runNumber = 1;
        runNumber <= RUNS;
        runNumber++
      ) {

        console.log(
          `  ${test.id} — run ${runNumber}/${RUNS}`
        );

        try {

          const result =
            await runCircuit(
              test.prompt
            );

          results.push({

            provider:
              "CIRCUIT",

            model:
              CIRCUIT_MODEL,

            promptId:
              test.id,

            grade:
              test.grade,

            subject:
              test.subject,

            latencyMs:
              result.latencyMs,

            tokensPerSecond:
              result.tokensPerSecond,

            responseLength:
              result.response.length,

            response:
              result.response,

          });

          console.log(
            `    ✅ ${result.latencyMs} ms`
          );

        } catch (error) {

          const message =
            error instanceof Error
              ? error.message
              : "Unknown error.";

          console.error(
            `    ❌ ${message}`
          );

          results.push({

            provider:
              "CIRCUIT",

            model:
              CIRCUIT_MODEL,

            promptId:
              test.id,

            grade:
              test.grade,

            subject:
              test.subject,

            latencyMs:
              0,

            responseLength:
              0,

            response:
              "",

            error:
              message,

          });

        }

      }

    }

  } else {

    console.log(
      "\n☁️ CIRCUIT skipped — CIRCUIT_URL is not configured."
    );

  }


  /*
   * SAVE RESULTS
   */

  const generatedAt =
    new Date().toISOString();

  const filename =
    `q4-q8-circuit-${Date.now()}.json`;

  const outputPath =
    path.join(
      process.cwd(),
      "benchmark-results",
      filename
    );

  fs.mkdirSync(
    path.dirname(outputPath),
    {
      recursive: true,
    }
  );

  fs.writeFileSync(
    outputPath,

    JSON.stringify(
      {
        generatedAt,

        benchmark:
          "q4-q8-circuit",

        results,
      },

      null,

      2
    )
  );


  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "✅ BENCHMARK COMPLETE"
  );
  console.log(
    "======================================"
  );

  console.log(
    `Results: ${outputPath}`
  );

  console.log(
    `Total measurements: ${results.length}`
  );

  console.log("");

}


run().catch(
  (error) => {

    console.error(
      "Benchmark failed:",
      error
    );

    process.exit(1);

  }
);
