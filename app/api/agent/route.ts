import { NextRequest, NextResponse } from "next/server";

import { routeAgent } from "@/lib/router";

export async function POST(req: NextRequest) {

  try {

    const body = await req.json();

    const result = await routeAgent(body);

    return NextResponse.json(result);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error: "Agent execution failed",
      },
      {
        status: 500,
      }
    );

  }

}