import { AI } from "@/ai";
import { worksheetPrompt } from "@/lib/prompts";

import { WorksheetSchema } from "@/lib/validation/agentSchemas";
import { extractJson } from "@/lib/validation/extractJson";
import { validateAgentOutput } from "@/lib/validation/validateAgentOutput";

export interface WorksheetRequest {
  topic: string;
}

export interface WorksheetResponse {
  content: string;
  structured: boolean;
  validationAttempts: number;
}

function worksheetToMarkdown(
  worksheet: any
): string {

  return `
# ${worksheet.title}

## Instructions

${worksheet.instructions
  .map((item: string) => `- ${item}`)
  .join("\n")}

## Part A — Warm Up

${worksheet.warmUp
  .map(
    (item: string, index: number) =>
      `${index + 1}. ${item}`
  )
  .join("\n\n")}

## Part B — Practice

${worksheet.practice
  .map(
    (item: string, index: number) =>
      `${index + 1}. ${item}`
  )
  .join("\n\n")}

## Part C — Challenge

${worksheet.challenge
  .map(
    (item: string, index: number) =>
      `${index + 1}. ${item}`
  )
  .join("\n\n")}

## Part D — Real-World Application

${worksheet.realWorld
  .map(
    (item: string, index: number) =>
      `${index + 1}. ${item}`
  )
  .join("\n\n")}

## Reflection

${worksheet.reflection
  .map(
    (item: string, index: number) =>
      `${index + 1}. ${item}`
  )
  .join("\n\n")}

## Answer Key

${worksheet.answerKey
  .map(
    (item: string, index: number) =>
      `${index + 1}. ${item}`
  )
  .join("\n\n")}
`.trim();
}

export async function worksheetAgent(
  request: WorksheetRequest
): Promise<WorksheetResponse> {

  console.log("📝 Worksheet Agent");

  let lastError = "";

  /*
   * Attempt 1 + one deterministic repair attempt.
   */

  for (
    let attempt = 1;
    attempt <= 2;
    attempt++
  ) {

    const prompt =
      attempt === 1
        ? request.topic
        : `
The previous response failed schema validation.

Validation error:

${lastError}

Generate the worksheet again.

Return ONLY valid JSON matching the required schema.
Do not add Markdown or explanatory text.

Topic:
${request.topic}
`;

    const result = await AI.generate(
      worksheetPrompt,
      prompt
    );

    try {

      const rawJson =
        extractJson(result.response);

      const validation =
        validateAgentOutput(
          WorksheetSchema,
          rawJson
        );

      if (
        validation.success &&
        validation.data
      ) {

        console.log(
          `✅ Worksheet schema validation passed on attempt ${attempt}`
        );

        return {
          content:
            worksheetToMarkdown(
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
        `⚠️ Worksheet validation attempt ${attempt} failed:`,
        lastError
      );
    }
  }

  /*
   * Safety fallback.
   *
   * If both structured attempts fail, we still return the
   * model's final response rather than breaking the classroom UI.
   */

  console.warn(
    "⚠️ Worksheet structured validation failed after retry."
  );

  const fallback =
    await AI.generate(
      worksheetPrompt,
      `
Create the worksheet for:

${request.topic}

Return the best possible response.
`
    );

  return {
    content: fallback.response,
    structured: false,
    validationAttempts: 2,
  };
}