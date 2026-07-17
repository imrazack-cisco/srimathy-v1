import { AI } from "@/ai";
import { quizPrompt } from "@/lib/prompts";

export interface QuizRequest {
  topic: string;
}

export interface QuizResponse {
  content: string;
}

export async function quizAgent(
  request: QuizRequest
): Promise<QuizResponse> {

  console.log("❓ Quiz Agent");

  const content = await AI.generate(
    quizPrompt,
    request.topic
  );

  return {
    content,
  };
}