import { AI } from "@/ai";

import {
  worksheetPrompt,
} from "@/lib/prompts";

import {
  WorksheetSchema,
  WorksheetOutput,
  WorksheetJSONSchema,
} from "@/lib/validation/agentSchemas";

import {
  extractJson,
} from "@/lib/validation/extractJson";

import {
  validateAgentOutput,
} from "@/lib/validation/validateAgentOutput";


export interface WorksheetRequest {
  topic: string;
}


export interface WorksheetResponse {

  content:
    string;

  structured:
    boolean;

  validationAttempts:
    number;

}


function worksheetToMarkdown(
  worksheet: WorksheetOutput
): string {

  return `
# ${worksheet.title}

## Instructions

${worksheet.instructions
  .map(
    item => `- ${item}`
  )
  .join("\n")}

## Part A — Warm Up

${worksheet.warmUp
  .map(
    (item, index) =>
      `${index + 1}. ${item}`
  )
  .join("\n\n")}

## Part B — Practice

${worksheet.practice
  .map(
    (item, index) =>
      `${index + 1}. ${item}`
  )
  .join("\n\n")}

## Part C — Challenge

${worksheet.challenge
  .map(
    (item, index) =>
      `${index + 1}. ${item}`
  )
  .join("\n\n")}

## Part D — Real-World Application

${worksheet.realWorld
  .map(
    (item, index) =>
      `${index + 1}. ${item}`
  )
  .join("\n\n")}

## Reflection

${worksheet.reflection
  .map(
    (item, index) =>
      `${index + 1}. ${item}`
  )
  .join("\n\n")}

## Answer Key

${worksheet.answerKey
  .map(
    (item, index) =>
      `${index + 1}. ${item}`
  )
  .join("\n\n")}
`.trim();

}


export async function worksheetAgent(
  request: WorksheetRequest
): Promise<WorksheetResponse> {

  console.log(
    "\n======================================"
  );

  console.log(
    "📝 SRIMATHY WORKSHEET AGENT"
  );

  console.log(
    "======================================"
  );

  console.log(
    "🔒 Native Ollama structured decoding: ON"
  );


  let lastError =
    "";


  for (
    let attempt = 1;
    attempt <= 2;
    attempt++
  ) {

    console.log(
      `🧪 Worksheet generation attempt ${attempt}`
    );


    const prompt =

      attempt === 1

        ? `
Generate the worksheet for:

${request.topic}

The response is constrained by a JSON Schema.
Return the requested worksheet content.
`

        : `
The previous worksheet generation failed validation.

Validation error:

${lastError}

Generate the worksheet again.

The response is constrained by a JSON Schema.
Return only content that conforms to that schema.

Topic:

${request.topic}
`;


    const result =
      await AI.generate(

        worksheetPrompt,

        prompt,

        WorksheetJSONSchema

      );


    try {

      const rawJson =
        extractJson(
          result.response
        );


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
          `✅ Worksheet schema validation PASSED on attempt ${attempt}`
        );

        console.log(
          "🔒 Classroom output contract: VALID"
        );


        return {

          content:
            worksheetToMarkdown(
              validation.data
            ),

          structured:
            true,

          validationAttempts:
            attempt,

        };

      }


      lastError =
        validation.error ??
        "Unknown schema validation error.";


      console.warn(
        `⚠️ Worksheet schema validation FAILED on attempt ${attempt}`
      );

      console.warn(
        lastError
      );

    } catch (
      error
    ) {

      lastError =
        error instanceof Error
          ? error.message
          : "Invalid JSON returned by model.";


      console.warn(
        `⚠️ Worksheet JSON parsing FAILED on attempt ${attempt}`
      );

      console.warn(
        lastError
      );

    }

  }


  console.error(
    "❌ Worksheet structured output failed."
  );


  throw new Error(
    `Worksheet structured output validation failed after 2 attempts. ${lastError}`
  );

}
