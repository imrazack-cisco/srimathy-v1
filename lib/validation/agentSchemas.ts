import { z } from "zod";

/**
 * ============================================================
 * SRIMATHY — STRUCTURED OUTPUT SCHEMAS
 * ============================================================
 *
 * These schemas create a deterministic boundary between the
 * SLM and the classroom presentation layer.
 *
 * Worksheet and Quiz are intentionally structured because
 * their content has predictable fields.
 * ============================================================
 */

export const WorksheetSchema = z.object({
  title: z.string().min(1),

  instructions: z.array(
    z.string().min(1)
  ).min(1),

  warmUp: z.array(
    z.string().min(1)
  ).min(1),

  practice: z.array(
    z.string().min(1)
  ).min(1),

  challenge: z.array(
    z.string().min(1)
  ).min(1),

  realWorld: z.array(
    z.string().min(1)
  ).min(1),

  reflection: z.array(
    z.string().min(1)
  ).min(1),

  answerKey: z.array(
    z.string().min(1)
  ).min(1),
});

export const QuizSchema = z.object({
  title: z.string().min(1),

  multipleChoice: z.array(
    z.object({
      question: z.string().min(1),

      options: z.array(
        z.string().min(1)
      ).length(4),

      answer: z.string().min(1),

      explanation: z.string().min(1),
    })
  ).min(1),

  shortAnswer: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
    })
  ).min(1),

  challenge: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
    })
  ).min(1),
});

export type WorksheetOutput =
  z.infer<typeof WorksheetSchema>;

export type QuizOutput =
  z.infer<typeof QuizSchema>;