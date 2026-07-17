const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

export interface OllamaResponse {
  response: string;
}

export async function generate(
  prompt: string,
  model = "gemma3:4b"
): Promise<string> {
  try {
    console.log("Connecting to Ollama...");

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

    console.log("Status:", res.status);

    const text = await res.text();

    console.log("Raw Response:");
    console.log(text);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const data = JSON.parse(text);

    return data.response;
  } catch (err) {
    console.error("FULL OLLAMA ERROR");
    console.error(err);

    throw err;
  }
}