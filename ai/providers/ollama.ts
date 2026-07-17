import { AIProvider } from "../types";
import { AI_CONFIG } from "../config";

export const OllamaProvider: AIProvider = {
  name: "Ollama",

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${AI_CONFIG.ollama.url}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  },

  async generate(
    system: string,
    prompt: string
  ): Promise<string> {

    console.log("🦙 Using Model:", AI_CONFIG.ollama.model);

    const res = await fetch(
      `${AI_CONFIG.ollama.url}/api/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AI_CONFIG.ollama.model,
          prompt: `${system}\n\n${prompt}`,
          stream: false,
        }),
      }
    );

    if (!res.ok) {
      const error = await res.text();

      throw new Error(
        `Ollama Error (${res.status})\n${error}`
      );
    }

    const json = await res.json();

    return json.response;
  },
};