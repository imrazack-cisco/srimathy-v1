import type {
  AIProvider,
  StructuredOutputFormat,
} from "../types";

import { AI_CONFIG } from "../config";

import {
  recordInferenceMetrics,
} from "@/research/metrics";


export interface OllamaMetrics {

  model: string;

  totalDurationNs?: number;

  promptEvalCount?: number;

  promptEvalDurationNs?: number;

  evalCount?: number;

  evalDurationNs?: number;

  structuredOutput?: boolean;

}


export const OllamaProvider:
  AIProvider & {
    lastMetrics?: OllamaMetrics;
  } = {

  name:
    "ollama",

  lastMetrics:
    undefined,


  async health() {

    try {

      const res =
        await fetch(
          `${AI_CONFIG.ollama.url}/api/tags`,
          {
            cache:
              "no-store",
          }
        );


      return res.ok;

    } catch {

      return false;

    }

  },


  async generate(
    system,
    prompt,
    structuredFormat
  ) {

    /*
     * ========================================================
     * SRIMATHY OLLAMA STRUCTURED OUTPUT
     * ========================================================
     *
     * If a JSON schema is supplied, Ollama receives it
     * directly through the native `format` parameter.
     *
     * This is deterministic structured decoding rather
     * than merely asking the model to "please return JSON".
     */

    const structuredOutput =
      structuredFormat !== undefined;


    console.log(
      "\n======================================"
    );

    console.log(
      "🦙 OLLAMA GENERATION"
    );

    console.log(
      "======================================"
    );

    console.log(
      "Model:",
      AI_CONFIG.ollama.model
    );

    console.log(
      "Structured output:",
      structuredOutput
        ? "ENABLED"
        : "OFF"
    );


    if (
      structuredOutput
    ) {

      console.log(
        "🔒 Ollama native JSON Schema constraint: ACTIVE"
      );

    }


    const body:
      Record<string, unknown> = {

      model:
        AI_CONFIG.ollama.model,

      prompt:
        `${system}\n\n${prompt}`,

      stream:
        false,

      /*
       * Low temperature improves deterministic
       * schema-constrained generation.
       */
      options: {
        temperature:
          structuredOutput
            ? 0
            : 0.2,
      },

    };


    /*
     * Ollama supports:
     *
     * format: "json"
     *
     * OR:
     *
     * format: { JSON Schema }
     */

    if (
      structuredFormat !== undefined
    ) {

      body.format =
        structuredFormat;

    }


    const response =
      await fetch(
        `${AI_CONFIG.ollama.url}/api/generate`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify(body),

        }
      );


    if (
      !response.ok
    ) {

      const errorText =
        await response.text();


      throw new Error(
        `Ollama failed: HTTP ${response.status} ${errorText.slice(0, 500)}`
      );

    }


    const json =
      await response.json();


    const model =
      json.model ??
      AI_CONFIG.ollama.model;


    /*
     * ========================================================
     * NATIVE OLLAMA TELEMETRY
     * ========================================================
     */

    this.lastMetrics = {

      model,

      totalDurationNs:
        json.total_duration,

      promptEvalCount:
        json.prompt_eval_count,

      promptEvalDurationNs:
        json.prompt_eval_duration,

      evalCount:
        json.eval_count,

      evalDurationNs:
        json.eval_duration,

      structuredOutput,

    };


    /*
     * ========================================================
     * RECORD REAL INFERENCE
     * ========================================================
     */

    recordInferenceMetrics({

      model,

      totalDurationNs:
        json.total_duration,

      promptEvalCount:
        json.prompt_eval_count,

      promptEvalDurationNs:
        json.prompt_eval_duration,

      evalCount:
        json.eval_count,

      evalDurationNs:
        json.eval_duration,

      prompt,

    });


    const output =
      json.response ??
      "";


    if (
      !output
    ) {

      throw new Error(
        "Ollama returned an empty response."
      );

    }


    console.log(
      "✅ Ollama generation successful"
    );

    console.log(
      "Structured:",
      structuredOutput
        ? "YES"
        : "NO"
    );

    console.log(
      "======================================\n"
    );


    return {

      provider:
        "ollama",

      response:
        output,

      latency:
        Math.round(
          Number(
            json.total_duration ??
            0
          ) / 1_000_000
        ),

      fallback:
        false,

    };

  },

};
