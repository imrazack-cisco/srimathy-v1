import { AI } from "@/ai";
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

  console.log("📚 Curriculum Agent");

  const content = await AI.generate(
    curriculumPrompt,
    request.topic
  );

  return {
    title: request.topic,
    content,
  };
}