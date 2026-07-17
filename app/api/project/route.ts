import { NextRequest, NextResponse } from "next/server";
import { masterAgent } from "@/agents/master";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Prompt is required.",
        },
        { status: 400 }
      );
    }

    console.log("🚀 Starting SRIMATHY Master Agent...");
    console.log("Topic:", prompt);

    const project = await masterAgent({
      topic: prompt,
    });

    console.log("✅ Project generated successfully.");

    return NextResponse.json({
      success: true,
      ...project,
    });

  } catch (error) {
    console.error("❌ Project API Error:");

    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(error);
    }

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

