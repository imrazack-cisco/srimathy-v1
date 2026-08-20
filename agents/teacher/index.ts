import { AI } from "@/ai";

import {
  teacherPrompt,
} from "@/lib/prompts";

import {
  TeacherSchema,
  TeacherOutput,
  TeacherJSONSchema,
} from "@/lib/validation/agentSchemas";

import {
  extractJson,
} from "@/lib/validation/extractJson";

import {
  validateAgentOutput,
} from "@/lib/validation/validateAgentOutput";


export interface TeacherRequest {
  topic: string;
}


export interface TeacherResponse {

  content:
    string;

  structured:
    boolean;

  validationAttempts:
    number;

}


function teacherToMarkdown(
  teacher: TeacherOutput
): string {

  return `
# ${teacher.title}

## Teaching Objective

${teacher.teachingObjective}

## Suggested Lesson Flow

### 1. Engage

${teacher.engage}

### 2. Explain

${teacher.explain}

### 3. Demonstrate

${teacher.demonstrate}

### 4. Practice

${teacher.practice}

### 5. Assess

${teacher.assess}

## Common Misconceptions

${teacher.commonMisconceptions
  .map(
    item =>
      `- **${item.misconception}** — ${item.correction}`
  )
  .join("\n")}

## Differentiation

### Students Needing Support

${teacher.supportStrategies
  .map(
    item =>
      `- ${item}`
  )
  .join("\n")}

### Students Ready for More

${teacher.extensionStrategies
  .map(
    item =>
      `- ${item}`
  )
  .join("\n")}

## Questions to Ask

${teacher.questionsToAsk
  .map(
    (item, index) =>
      `${index + 1}. ${item}`
  )
  .join("\n")}

## Success Criteria

${teacher.successCriteria
  .map(
    item =>
      `- ${item}`
  )
  .join("\n")}

## Teacher Tip

${teacher.teacherTip}
`.trim();

}


export async function teacherAgent(
  request: TeacherRequest
): Promise<TeacherResponse> {

  console.log(
    "\n======================================"
  );

  console.log(
    "👨‍🏫 SRIMATHY TEACHER / ELI5 AGENT"
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
      `🧪 Teacher/ELI5 generation attempt ${attempt}`
    );


    const prompt =

      attempt === 1

        ? `
Create teacher guidance for:

${request.topic}

The response is constrained by a JSON Schema.
Return the requested teacher guidance.
`

        : `
The previous Teacher/ELI5 response failed validation.

Validation error:

${lastError}

Generate the response again.

The response is constrained by a JSON Schema.
Return only content that conforms to that schema.

Topic:

${request.topic}
`;


    const result =
      await AI.generate(

        teacherPrompt,

        prompt,

        TeacherJSONSchema

      );


    try {

      const rawJson =
        extractJson(
          result.response
        );


      const validation =
        validateAgentOutput(
          TeacherSchema,
          rawJson
        );


      if (
        validation.success &&
        validation.data
      ) {

        console.log(
          `✅ Teacher/ELI5 schema validation PASSED on attempt ${attempt}`
        );

        console.log(
          "🔒 Classroom output contract: VALID"
        );


        return {

          content:
            teacherToMarkdown(
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
        `⚠️ Teacher/ELI5 schema validation FAILED on attempt ${attempt}`
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
        `⚠️ Teacher/ELI5 JSON parsing FAILED on attempt ${attempt}`
      );

      console.warn(
        lastError
      );

    }

  }


  console.error(
    "❌ Teacher/ELI5 structured output failed."
  );


  throw new Error(
    `Teacher/ELI5 structured output validation failed after 2 attempts. ${lastError}`
  );

}
