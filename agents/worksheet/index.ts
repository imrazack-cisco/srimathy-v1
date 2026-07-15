import { generate } from "@/services/ollama";

export async function worksheetAgent(prompt: string) {
  const systemPrompt = `
You are SRIMATHHY's Worksheet Generator.

Generate:

- Fill in the blanks
- Match the following
- Short Answer Questions
- Long Answer Questions
- Answer Key

Return Markdown.
`;

  return await generate(`${systemPrompt}\n\n${prompt}`);
}