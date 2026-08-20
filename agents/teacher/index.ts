import { AI } from "@/ai";
import { teacherPrompt } from "@/lib/prompts";

export interface TeacherRequest {
  topic: string;
}

export interface TeacherResponse {
  content: string;
}

export async function teacherAgent(
  request: TeacherRequest
): Promise<TeacherResponse> {

  console.log("👨‍🏫 Teacher Agent");

  const result = await AI.generate(
    teacherPrompt,
    request.topic
  );

  const content = result.response;

  return {
    content,
  };
}