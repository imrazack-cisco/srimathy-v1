import { generate } from "@/services/ollama/client";

export interface WorksheetResponse {
  title: string;
  content: string;
}

export async function generateWorksheet(
  topic: string
): Promise<WorksheetResponse> {
  const prompt = `
You are an expert school worksheet designer.

Create a worksheet for:

${topic}

Generate the worksheet in Markdown.

Include:

# Worksheet

## Fill in the Blanks
(5 Questions)

## Multiple Choice
(5 Questions)

## True / False
(5 Questions)

## Short Answer
(5 Questions)

## Challenge Question
(1 Question)

Return ONLY Markdown.
`;

  const worksheet = await generate(prompt);

  return {
    title: `${topic} Worksheet`,
    content: worksheet,
  };
}