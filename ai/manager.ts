import { OllamaProvider } from "./providers/ollama";

class AIManager {

  async generate(
    system: string,
    prompt: string
  ): Promise<string> {

    console.log("\n====================================");
    console.log("🦙 SRIMATHY AI ENGINE");
    console.log("====================================");

    const start = Date.now();

    try {

      const response = await OllamaProvider.generate(
        system,
        prompt
      );

      const latency = Date.now() - start;

      console.log("✅ Generation Successful");
      console.log("Model      :", process.env.OLLAMA_MODEL ?? "gemma3:4b");
      console.log("Latency    :", latency, "ms");
      console.log("====================================\n");

      return response;

    } catch (error) {

      console.error("❌ AI Generation Failed");
      console.error(error);

      throw error;

    }

  }

}

export const AI = new AIManager();