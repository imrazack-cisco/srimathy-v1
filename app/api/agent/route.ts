import { NextRequest, NextResponse } from "next/server";
import { masterAgent } from "@/agents/master";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        {
          error: "Prompt required",
        },
        { status: 400 }
      );
    }

    const result = await masterAgent({
      topic: prompt,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Generation failed",
      },
      {
        status: 500,
      }
    );
  }
}