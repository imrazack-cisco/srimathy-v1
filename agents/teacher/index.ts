import { generate } from "@/services/ollama/client";

interface TeacherRequest {
  topic: string;
}

export async function teacherAgent({
  topic,
}: TeacherRequest): Promise<string> {

  const prompt = `
You are an experienced school teacher.

Prepare teacher notes for:

${topic}

Return Markdown.

Include:

# Teacher Notes

## Teaching Tips

## Common Student Mistakes

## Bloom's Taxonomy

## Classroom Activities

## Homework Ideas

Keep it practical.
`;

  return generate(prompt);
}