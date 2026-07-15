import { NextResponse } from "next/server";
import { masterAgent } from "@/agents/master";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const response = await masterAgent(message);

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate response.",
      },
      {
        status: 500,
      }
    );
  }
}