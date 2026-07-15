import { NextResponse } from "next/server";
import { generateLesson } from "@/services/agents/master";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const response = await generateLesson(prompt);

  return NextResponse.json({
    content: response,
  });
}