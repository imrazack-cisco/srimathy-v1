import { curriculumAgent } from "../curriculum";
import { worksheetAgent } from "../worksheet";
import { quizAgent } from "../quiz";

export async function masterAgent(prompt: string) {
  const text = prompt.toLowerCase();

  if (text.includes("worksheet")) {
    return worksheetAgent(prompt);
  }

  if (text.includes("quiz")) {
    return quizAgent(prompt);
  }

  return curriculumAgent(prompt);
}