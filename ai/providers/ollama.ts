import { AIProvider } from "../types";
import { AI_CONFIG } from "../config";

export const OllamaProvider: AIProvider = {

  name: "ollama",

  async health() {
    try {

      const res = await fetch(
        `${AI_CONFIG.ollama.url}/api/tags`
      );

      return res.ok;

    } catch {

      return false;

    }
  },

  async generate(system, prompt) {

    const res = await fetch(
      `${AI_CONFIG.ollama.url}/api/generate`,
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({

          model: AI_CONFIG.ollama.model,

          prompt:

`${system}

${prompt}`,

          stream: false,

        }),

      }
    );

    if (!res.ok) {

      throw new Error("Ollama failed");

    }

    const json = await res.json();

    return json.response;

  },

};