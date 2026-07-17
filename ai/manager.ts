import { AI_CONFIG } from "./config";
import { CiscoProvider } from "./providers/cisco";
import { OllamaProvider } from "./providers/ollama";
import type { AIProvider } from "./types";

export interface AIResponse {
  provider: string;
  response: string;
  latency: number;
  fallback: boolean;
}

class AIManager {

  private async execute(
    provider: AIProvider,
    system: string,
    prompt: string,
    fallback = false
  ): Promise<AIResponse> {

    const start = Date.now();

    const response = await provider.generate(system, prompt);

    return {
      provider: provider.name,
      response,
      latency: Date.now() - start,
      fallback
    };
  }

  async generate(
    system: string,
    prompt: string
  ): Promise<AIResponse> {

    switch (AI_CONFIG.provider.toLowerCase()) {

      case "ollama":
        console.log("🟢 Provider = Ollama");

        return this.execute(
          OllamaProvider,
          system,
          prompt
        );

      case "cisco":
        console.log("🌐 Provider = Cisco");

        return this.execute(
          CiscoProvider,
          system,
          prompt
        );

      case "auto":

      default:

        console.log("⚡ AUTO MODE");

        try {

          if (await CiscoProvider.health()) {

            console.log("Using Cisco CIRCUIT");

            return await this.execute(
              CiscoProvider,
              system,
              prompt
            );

          }

        } catch (err) {

          console.warn(
            "Cisco health check failed:",
            err
          );

        }

        console.log("Falling back to Ollama");

        return this.execute(
          OllamaProvider,
          system,
          prompt,
          true
        );
    }
  }
}

export const AI = new AIManager();