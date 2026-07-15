import { generate } from "@/services/ollama/client";
import { curriculumPrompt } from "@/lib/prompts";

export async function generateCurriculum(topic: string) {
  const prompt = `
${curriculumPrompt}

Create a complete lesson for:

${topic}

Return the lesson in this exact format:

# Lesson Title

## Learning Objectives

- Objective 1
- Objective 2
- Objective 3

## Explanation

Explain the concept clearly.

## Examples

Provide at least two examples.

## Activities

Suggest two classroom activities.

## Homework

Give five homework questions.

## Summary

Summarize the lesson.
`;

  return await generate(prompt);
}