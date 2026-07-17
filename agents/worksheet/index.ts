import { AI } from "@/ai";
import { worksheetPrompt } from "@/lib/prompts";

export interface WorksheetRequest {
  topic: string;
}

export interface WorksheetResponse {
  content: string;
}

export async function worksheetAgent(
  request: WorksheetRequest
): Promise<WorksheetResponse> {

  console.log("📝 Worksheet Agent");

  const content = await AI.generate(
    worksheetPrompt,
    request.topic
  );

  return {
    content,
  };
}