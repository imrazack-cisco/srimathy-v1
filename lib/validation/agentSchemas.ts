import { z } from "zod";

/**
 * ============================================================
 * SRIMATHY — DETERMINISTIC STRUCTURED OUTPUT SCHEMAS
 * ============================================================
 *
 * These schemas form a hard boundary between the SLM
 * and the classroom presentation layer.
 *
 * An agent response is NOT allowed into the renderer
 * unless it passes its schema.
 *
 * Worksheet + Teacher/ELI5 are both structured.
 * ============================================================
 */


/**
 * ============================================================
 * WORKSHEET
 * ============================================================
 */

export const WorksheetSchema =
  z.object({

    title:
      z.string().min(1),

    instructions:
      z.array(
        z.string().min(1)
      ).min(1),

    warmUp:
      z.array(
        z.string().min(1)
      ).min(1),

    practice:
      z.array(
        z.string().min(1)
      ).min(1),

    challenge:
      z.array(
        z.string().min(1)
      ).min(1),

    realWorld:
      z.array(
        z.string().min(1)
      ).min(1),

    reflection:
      z.array(
        z.string().min(1)
      ).min(1),

    answerKey:
      z.array(
        z.string().min(1)
      ).min(1),

  })
  .strict();


/**
 * ============================================================
 * TEACHER / ELI5
 * ============================================================
 *
 * The model returns JSON.
 * The UI converts the validated object into Markdown.
 */

export const TeacherSchema =
  z.object({

    title:
      z.string().min(1),

    teachingObjective:
      z.string().min(1),

    engage:
      z.string().min(1),

    explain:
      z.string().min(1),

    demonstrate:
      z.string().min(1),

    practice:
      z.string().min(1),

    assess:
      z.string().min(1),

    commonMisconceptions:
      z.array(
        z.object({
          misconception:
            z.string().min(1),

          correction:
            z.string().min(1),
        }).strict()
      ).min(1),

    supportStrategies:
      z.array(
        z.string().min(1)
      ).min(1),

    extensionStrategies:
      z.array(
        z.string().min(1)
      ).min(1),

    questionsToAsk:
      z.array(
        z.string().min(1)
      ).min(1),

    successCriteria:
      z.array(
        z.string().min(1)
      ).min(1),

    teacherTip:
      z.string().min(1),

  })
  .strict();


/**
 * ============================================================
 * QUIZ
 * ============================================================
 */

export const QuizSchema =
  z.object({

    title:
      z.string().min(1),

    multipleChoice:
      z.array(
        z.object({

          question:
            z.string().min(1),

          options:
            z.array(
              z.string().min(1)
            ).length(4),

          answer:
            z.string().min(1),

          explanation:
            z.string().min(1),

        }).strict()
      ).min(1),

    shortAnswer:
      z.array(
        z.object({

          question:
            z.string().min(1),

          answer:
            z.string().min(1),

        }).strict()
      ).min(1),

    challenge:
      z.array(
        z.object({

          question:
            z.string().min(1),

          answer:
            z.string().min(1),

        }).strict()
      ).min(1),

  })
  .strict();


export type WorksheetOutput =
  z.infer<typeof WorksheetSchema>;

export type TeacherOutput =
  z.infer<typeof TeacherSchema>;

export type QuizOutput =
  z.infer<typeof QuizSchema>;

/**
 * ============================================================
 * NATIVE OLLAMA JSON SCHEMAS
 * ============================================================
 *
 * These are passed directly to Ollama's `format` field.
 *
 * Zod remains the post-generation validator.
 */

export const WorksheetJSONSchema =
  {
    type: "object",

    additionalProperties: false,

    required: [
      "title",
      "instructions",
      "warmUp",
      "practice",
      "challenge",
      "realWorld",
      "reflection",
      "answerKey",
    ],

    properties: {

      title: {
        type: "string",
      },

      instructions: {
        type: "array",
        items: {
          type: "string",
        },
      },

      warmUp: {
        type: "array",
        items: {
          type: "string",
        },
      },

      practice: {
        type: "array",
        items: {
          type: "string",
        },
      },

      challenge: {
        type: "array",
        items: {
          type: "string",
        },
      },

      realWorld: {
        type: "array",
        items: {
          type: "string",
        },
      },

      reflection: {
        type: "array",
        items: {
          type: "string",
        },
      },

      answerKey: {
        type: "array",
        items: {
          type: "string",
        },
      },

    },

  } as Record<string, unknown>;


export const TeacherJSONSchema =
  {
    type: "object",

    additionalProperties: false,

    required: [
      "title",
      "teachingObjective",
      "engage",
      "explain",
      "demonstrate",
      "practice",
      "assess",
      "commonMisconceptions",
      "supportStrategies",
      "extensionStrategies",
      "questionsToAsk",
      "successCriteria",
      "teacherTip",
    ],

    properties: {

      title: {
        type: "string",
      },

      teachingObjective: {
        type: "string",
      },

      engage: {
        type: "string",
      },

      explain: {
        type: "string",
      },

      demonstrate: {
        type: "string",
      },

      practice: {
        type: "string",
      },

      assess: {
        type: "string",
      },

      commonMisconceptions: {

        type: "array",

        items: {

          type: "object",

          additionalProperties: false,

          required: [
            "misconception",
            "correction",
          ],

          properties: {

            misconception: {
              type: "string",
            },

            correction: {
              type: "string",
            },

          },

        },

      },

      supportStrategies: {

        type: "array",

        items: {
          type: "string",
        },

      },

      extensionStrategies: {

        type: "array",

        items: {
          type: "string",
        },

      },

      questionsToAsk: {

        type: "array",

        items: {
          type: "string",
        },

      },

      successCriteria: {

        type: "array",

        items: {
          type: "string",
        },

      },

      teacherTip: {

        type: "string",

      },

    },

  } as Record<string, unknown>;
