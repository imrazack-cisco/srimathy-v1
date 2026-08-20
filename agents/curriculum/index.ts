import { AI } from "@/ai";
import { curriculumPrompt } from "@/lib/prompts";

export interface CurriculumRequest {
  topic: string;
}

export interface CurriculumResponse {
  title: string;
  content: string;
}

export async function curriculumAgent(
  request: CurriculumRequest
): Promise<CurriculumResponse> {

  console.log("📚 Curriculum Agent");

  const result = await AI.generate(
    curriculumPrompt,
    request.topic
  );

  const content = result.response;

  return {
    title: request.topic,
    content,
  };
}