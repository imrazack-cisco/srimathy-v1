export const AI_CONFIG = {
  provider: process.env.AI_PROVIDER ?? "auto",

  ollama: {
    url:
      process.env.OLLAMA_URL ??
      "http://127.0.0.1:11434",

    model:
      process.env.OLLAMA_MODEL ??
      "gemma3:4b",
  },

  cisco: {
    endpoint:
      "https://chat-ai.cisco.com/openai/deployments/{model}/chat/completions",
  },
};