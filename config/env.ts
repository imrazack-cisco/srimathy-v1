import { z } from "zod";

const envSchema = z.object({
  OLLAMA_URL: z.string().url(),
  OLLAMA_MODEL: z.string(),
});

const parsed = envSchema.safeParse({
  OLLAMA_URL: process.env.OLLAMA_URL,
  OLLAMA_MODEL: process.env.OLLAMA_MODEL,
});

if (!parsed.success) {
  throw new Error(
    "Invalid environment variables.\n" +
      JSON.stringify(parsed.error.format(), null, 2)
  );
}

export const env = {
  ollamaUrl: parsed.data.OLLAMA_URL,
  model: parsed.data.OLLAMA_MODEL,
};