import { z } from "zod";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function validateAgentOutput<T>(
  schema: z.ZodSchema<T>,
  raw: unknown
): ValidationResult<T> {

  const result = schema.safeParse(raw);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const error = result.error.issues
    .map((issue) => {
      const path =
        issue.path.length > 0
          ? issue.path.join(".")
          : "root";

      return `${path}: ${issue.message}`;
    })
    .join("; ");

  console.error(
    "❌ STRUCTURED OUTPUT VALIDATION FAILED:",
    error
  );

  return {
    success: false,
    error,
  };
}