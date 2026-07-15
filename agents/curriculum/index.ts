import { generate } from "@/services/ollama";

export async function curriculumAgent(prompt: string) {
  const systemPrompt = `
You are SRIMATHY's Curriculum Expert.

Create:

- Learning Objectives
- Introduction
- Main Concepts
- Classroom Activities
- Summary
- Homework

Return everything in Markdown.
`;

  return await generate(`${systemPrompt}\n\n${prompt}`);
}