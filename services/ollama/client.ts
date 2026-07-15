const OLLAMA_URL = "http://localhost:11434/api/generate";

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
}

export interface OllamaResponse {
  response: string;
}

export async function generate(
  prompt: string,
  model = "gemma3:4b"
): Promise<string> {
  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}`);
    }

    const data: OllamaResponse = await res.json();

    return data.response;
  } catch (err) {
    console.error("Ollama Error:", err);

    throw new Error("Unable to connect to Ollama.");
  }
}