import { curriculumAgent } from "@/agents/curriculum";

export async function masterAgent(prompt: string) {
  return curriculumAgent({
    topic: prompt,
  });
}