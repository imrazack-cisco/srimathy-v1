import { NextRequest, NextResponse } from "next/server";
import { generateProject } from "@/agents/master";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Prompt is required",
        },
        {
          status: 400,
        }
      );
    }

    const project = await generateProject(prompt);

    return NextResponse.json(project);
  } catch (error) {
    console.error("Project API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate project.",
      },
      {
        status: 500,
      }
    );
  }
}