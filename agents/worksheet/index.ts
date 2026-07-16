import { generate } from "@/services/ollama/client";

export interface WorksheetRequest {
  lesson: string;
}

export interface WorksheetResponse {
  content: string;
}

export async function worksheetAgent(
  request: WorksheetRequest
): Promise<WorksheetResponse> {

  const prompt = `
You are an expert teacher.

Create a worksheet from the lesson below.

Include:

# Worksheet

## Multiple Choice (5)

## Fill in the Blanks (5)

## True or False (5)

## Short Answer (5)

## Long Answer (3)

Lesson:

${request.lesson}
`;

  const worksheet = await generate(prompt);

  return {
    content: worksheet,
  };
}