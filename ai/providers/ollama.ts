import { AIProvider } from "../types";
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
}

export const OllamaProvider:
  AIProvider & {
    lastMetrics?: OllamaMetrics;
  } = {

  name: "ollama",

  lastMetrics: undefined,


  async health() {

    try {

      const res =
        await fetch(
          `${AI_CONFIG.ollama.url}/api/tags`,
          {
            cache: "no-store",
          }
        );

      return res.ok;

    } catch {

      return false;

    }
  },


  async generate(
    system,
    prompt
  ) {

    const response =
      await fetch(
        `${AI_CONFIG.ollama.url}/api/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            model:
              AI_CONFIG.ollama.model,

            prompt:
              `${system}\n\n${prompt}`,

            stream: false,

          }),

        }
      );


    if (!response.ok) {

      throw new Error(
        `Ollama failed: HTTP ${response.status}`
      );

    }


    const json =
      await response.json();


    const model =
      json.model ??
      AI_CONFIG.ollama.model;


    // ========================================================
    // NATIVE OLLAMA TELEMETRY
    // ========================================================

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

    };


    // ========================================================
    // RECORD REAL INFERENCE
    // ========================================================

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


    return json.response ?? "";

  },

};
