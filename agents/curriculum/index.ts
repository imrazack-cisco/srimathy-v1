import { generate } from "@/services/ollama/client";
import { curriculumPrompt } from "@/lib/prompts";

export interface LessonRequest {
  topic: string;
}

export interface LessonResponse {
  title: string;
  content: string;
}

export async function curriculumAgent(
  request: LessonRequest
): Promise<LessonResponse> {

  const fullPrompt = `
${curriculumPrompt}

Teacher Request:

${request.topic}
`;

  const lesson = await generate(fullPrompt);

  return {
    title: request.topic,
    content: lesson,
  };
}