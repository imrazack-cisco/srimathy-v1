export const AI_CONFIG = {
  primaryProvider:
    process.env.AI_PRIMARY_PROVIDER ??
    process.env.AI_PROVIDER ??
    "ollama",

  fallbackProvider:
    process.env.AI_FALLBACK_PROVIDER ??
    "circuit",

  ollama: {
    url:
      process.env.OLLAMA_URL ??
      "http://127.0.0.1:11434",

    model:
      process.env.OLLAMA_MODEL ??
      "gemma3:4b",
  },

  circuit: {
    endpoint:
      process.env.CIRCUIT_URL ??
      "https://chat-ai.cisco.com/openai/deployments/{model}/chat/completions",

    model:
      process.env.CIRCUIT_MODEL ??
      "gemini-3.1-flash-lite",
  },
};