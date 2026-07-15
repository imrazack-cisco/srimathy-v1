import { generateCurriculum } from "@/agents/curriculum";

export async function generateProject(prompt: string) {
  const lesson = await generateCurriculum(prompt);

  return {
    title: prompt,
    content: lesson,
  };
}