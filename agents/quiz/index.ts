import { AI } from "@/ai";
import { quizPrompt } from "@/lib/prompts";

import { QuizSchema } from "@/lib/validation/agentSchemas";
import { extractJson } from "@/lib/validation/extractJson";
import { validateAgentOutput } from "@/lib/validation/validateAgentOutput";

export interface QuizRequest {
  topic: string;
}

export interface QuizResponse {
  content: string;
  structured: boolean;
  validationAttempts: number;
}

function quizToMarkdown(
  quiz: any
): string {

  return `
# ${quiz.title}

## Section A — Multiple Choice

${quiz.multipleChoice
  .map(
    (item: any, index: number) => `
### ${index + 1}. ${item.question}

${item.options.join("\n")}

`
  )
  .join("\n")}

## Section B — Short Answer

${quiz.shortAnswer
  .map(
    (item: any, index: number) =>
      `### ${index + 1}. ${item.question}`
  )
  .join("\n\n")}

## Section C — Challenge

${quiz.challenge
  .map(
    (item: any, index: number) =>
      `### ${index + 1}. ${item.question}`
  )
  .join("\n\n")}

## Answer Key

### Multiple Choice

${quiz.multipleChoice
  .map(
    (item: any, index: number) =>
      `${index + 1}. **${item.answer}** — ${item.explanation}`
  )
  .join("\n\n")}

### Short Answer

${quiz.shortAnswer
  .map(
    (item: any, index: number) =>
      `${index + 1}. ${item.answer}`
  )
  .join("\n\n")}

### Challenge

${quiz.challenge
  .map(
    (item: any, index: number) =>
      `${index + 1}. ${item.answer}`
  )
  .join("\n\n")}
`.trim();
}

export async function quizAgent(
  request: QuizRequest
): Promise<QuizResponse> {

  console.log("❓ Quiz Agent");

  let lastError = "";

  for (
    let attempt = 1;
    attempt <= 2;
    attempt++
  ) {

    const prompt =
      attempt === 1
        ? request.topic
        : `
The previous quiz response failed validation.

Validation error:

${lastError}

Generate the quiz again.

Return ONLY valid JSON matching the required schema.

Topic:
${request.topic}
`;

    const result = await AI.generate(
      quizPrompt,
      prompt
    );

    try {

      const rawJson =
        extractJson(result.response);

      const validation =
        validateAgentOutput(
          QuizSchema,
          rawJson
        );

      if (
        validation.success &&
        validation.data
      ) {

        console.log(
          `✅ Quiz schema validation passed on attempt ${attempt}`
        );

        return {
          content:
            quizToMarkdown(
              validation.data
            ),

          structured: true,

          validationAttempts:
            attempt,
        };
      }

      lastError =
        validation.error ??
        "Unknown schema validation error.";

    } catch (error) {

      lastError =
        error instanceof Error
          ? error.message
          : "Invalid JSON returned by model.";

      console.warn(
        `⚠️ Quiz validation attempt ${attempt} failed:`,
        lastError
      );
    }
  }

  console.warn(
    "⚠️ Quiz structured validation failed after retry."
  );

  const fallback =
    await AI.generate(
      quizPrompt,
      `
Create the quiz for:

${request.topic}
`
    );

  return {
    content: fallback.response,
    structured: false,
    validationAttempts: 2,
  };
}