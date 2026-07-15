export const env = {
  ollamaUrl:
    process.env.OLLAMA_URL ??
    "http://127.0.0.1:11434",

  model:
    process.env.OLLAMA_MODEL ??
    "gemma3:4b",
};