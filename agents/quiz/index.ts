import { generate } from "@/services/ollama";

export async function quizAgent(prompt: string) {
  const systemPrompt = `
You are SRIMATHY's Quiz Generator.

Generate

- 10 Multiple Choice Questions
- 5 True/False Questions
- 3 HOTS Questions

Include an Answer Key.

Return Markdown.
`;

  return await generate(`${systemPrompt}\n\n${prompt}`);
}