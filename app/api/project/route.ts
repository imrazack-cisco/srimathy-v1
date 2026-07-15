import { NextRequest, NextResponse } from "next/server";
import { masterAgent } from "@/agents/master";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim() === "") {
      return NextResponse.json(
        {
          error: "Prompt is required",
        },
        {
          status: 400,
        }
      );
    }

    const response = await masterAgent(prompt);

    return NextResponse.json({
      success: true,
      content: response,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate content",
      },
      {
        status: 500,
      }
    );
  }
}