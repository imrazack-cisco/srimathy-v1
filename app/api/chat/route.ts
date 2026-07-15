import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    message: "Deprecated. Use /api/project instead.",
  });
}