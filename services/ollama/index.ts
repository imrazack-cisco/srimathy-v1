import { env } from "@/config/env";

export async function generate(prompt: string): Promise<string> {
  const response = await fetch(`${env.ollamaUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error("Ollama request failed");
  }

  const data = await response.json();

  return data.response;
}