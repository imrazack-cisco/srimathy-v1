import { generate } from "@/services/ollama";

export async function masterAgent(
  teacherPrompt: string
): Promise<string> {
  const systemPrompt = `
You are SRIMATHY.

You are an expert AI Co-Teacher.

Always answer professionally.

Always use Markdown.

Explain educational concepts clearly.

Generate structured educational content.
`;

  return generate(`${systemPrompt}\n\n${teacherPrompt}`);
}