import { generate } from "@/services/ollama/client";

interface QuizRequest {
  topic: string;
}

export async function quizAgent({
  topic,
}: QuizRequest): Promise<string> {

  const prompt = `
You are an expert teacher.

Generate a short quiz for:

${topic}

Return Markdown.

Include:

# Quiz

## Multiple Choice
5 questions

## True or False
3 questions

## Short Answer
3 questions

Include the answer key at the end.
`;

  return generate(prompt);
}