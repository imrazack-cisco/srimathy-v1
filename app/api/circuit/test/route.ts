import { NextResponse } from "next/server";
import { CircuitProvider } from "@/ai/providers/circuit";

export async function GET() {
  const start = performance.now();

  try {
    const response = await CircuitProvider.generate(
      "You are a helpful educational AI assistant.",
      "Reply with exactly: CIRCUIT TEST PASSED"
    );

    const latency = Math.round(
      performance.now() - start
    );

    return NextResponse.json({
      success: true,
      provider: "CIRCUIT",
      model:
        process.env.CIRCUIT_MODEL ??
        "unknown",
      status: "ONLINE",
      response,
      latencyMs: latency,
      testedAt: new Date().toISOString(),
    });

  } catch (error) {

    const latency = Math.round(
      performance.now() - start
    );

    return NextResponse.json({
      success: false,
      provider: "CIRCUIT",
      model:
        process.env.CIRCUIT_MODEL ??
        "unknown",
      status: "OFFLINE",
      latencyMs: latency,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
      testedAt: new Date().toISOString(),
    });
  }
}