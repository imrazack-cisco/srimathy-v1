import { AI } from "@/ai";

import {
  quizPrompt,
} from "@/lib/prompts";

import {
  QuizSchema,
  QuizOutput,
  QuizJSONSchema,
} from "@/lib/validation/agentSchemas";

import {
  extractJson,
} from "@/lib/validation/extractJson";

import {
  validateAgentOutput,
} from "@/lib/validation/validateAgentOutput";


export interface QuizRequest {
  topic: string;
}


export interface QuizResponse {

  content:
    string;

  structured:
    boolean;

  validationAttempts:
    number;

}


/**
 * ============================================================
 * CONVERT VALIDATED QUIZ → CLASSROOM MARKDOWN
 * ============================================================
 */

function quizToMarkdown(
  quiz: QuizOutput
): string {

  return `
# ${quiz.title}

## Section A — Multiple Choice

${quiz.multipleChoice
  .map(
    (
      item,
      index
    ) => `
### ${index + 1}. ${item.question}

${item.options
  .map(
    option =>
      `- ${option}`
  )
  .join("\n")}

`
  )
  .join("\n")}

## Section B — Short Answer

${quiz.shortAnswer
  .map(
    (
      item,
      index
    ) =>
      `### ${index + 1}. ${item.question}`
  )
  .join("\n\n")}

## Section C — Challenge

${quiz.challenge
  .map(
    (
      item,
      index
    ) =>
      `### ${index + 1}. ${item.question}`
  )
  .join("\n\n")}

## Answer Key

### Multiple Choice

${quiz.multipleChoice
  .map(
    (
      item,
      index
    ) =>
      `${index + 1}. **${item.answer}** — ${item.explanation}`
  )
  .join("\n\n")}

### Short Answer

${quiz.shortAnswer
  .map(
    (
      item,
      index
    ) =>
      `${index + 1}. ${item.answer}`
  )
  .join("\n\n")}

### Challenge

${quiz.challenge
  .map(
    (
      item,
      index
    ) =>
      `${index + 1}. ${item.answer}`
  )
  .join("\n\n")}
`.trim();

}


/**
 * ============================================================
 * QUIZ AGENT
 * ============================================================
 *
 * Generation pipeline:
 *
 * QuizJSONSchema
 *       ↓
 * Ollama native structured decoding
 *       ↓
 * JSON
 *       ↓
 * extractJson()
 *       ↓
 * Zod QuizSchema
 *       ↓
 * Classroom Markdown
 *
 * There is intentionally NO unstructured fallback.
 *
 * A malformed SLM response must never reach the classroom
 * renderer.
 * ============================================================
 */

export async function quizAgent(
  request: QuizRequest
): Promise<QuizResponse> {

  console.log(
    "\n======================================"
  );

  console.log(
    "❓ SRIMATHY QUIZ AGENT"
  );

  console.log(
    "======================================"
  );

  console.log(
    "🔒 Native Ollama structured decoding: ON"
  );


  let lastError =
    "";


  /*
   * Maximum two deterministic attempts.
   *
   * Attempt 2 receives the validation failure so
   * the model can correct the content while the
   * Ollama JSON Schema constraint remains active.
   */

  for (
    let attempt = 1;
    attempt <= 2;
    attempt++
  ) {

    console.log(
      `🧪 Quiz generation attempt ${attempt}`
    );


    const prompt =

      attempt === 1

        ? `
Generate a classroom quiz for:

${request.topic}

The response is constrained by a JSON Schema.

Create useful Grade 5 appropriate questions.

The response must satisfy the supplied schema.
`

        : `
The previous quiz generation failed deterministic
schema validation.

Validation error:

${lastError}

Generate the quiz again.

The response is constrained by a JSON Schema.
Correct the validation problem.

Topic:

${request.topic}
`;


    /*
     * IMPORTANT:
     *
     * QuizJSONSchema is passed as the third argument.
     *
     * The AI manager passes it to Ollama's native
     * `format` parameter.
     */

    const result =
      await AI.generate(

        quizPrompt,

        prompt,

        QuizJSONSchema

      );


    try {

      /*
       * Extract the JSON returned by Ollama.
       */

      const rawJson =
        extractJson(
          result.response
        );


      /*
       * SECOND SAFETY LAYER:
       *
       * Validate the generated object using
       * the Zod QuizSchema.
       */

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
          `✅ Quiz schema validation PASSED on attempt ${attempt}`
        );

        console.log(
          "🔒 Classroom output contract: VALID"
        );


        return {

          content:
            quizToMarkdown(
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
        "Unknown Quiz schema validation error.";


      console.warn(
        `⚠️ Quiz schema validation FAILED on attempt ${attempt}`
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
        `⚠️ Quiz JSON parsing FAILED on attempt ${attempt}`
      );

      console.warn(
        lastError
      );

    }

  }


  /*
   * HARD SAFETY BOUNDARY
   *
   * DO NOT fall back to an unstructured model response.
   *
   * Returning raw model output here would defeat the
   * structured-output guarantee required by the project.
   */

  console.error(
    "❌ Quiz structured output failed."
  );


  throw new Error(
    `Quiz structured output validation failed after 2 attempts. ${lastError}`
  );

}
