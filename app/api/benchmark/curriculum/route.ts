import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const resultsDir = path.join(
      process.cwd(),
      "benchmark-results"
    );

    if (!fs.existsSync(resultsDir)) {
      return NextResponse.json({
        success: true,
        measured: false,
        message:
          "No curriculum alignment benchmark results found.",
      });
    }

    const files = fs
      .readdirSync(resultsDir)
      .filter(
        (file) =>
          file.startsWith("curriculum-alignment-") &&
          file.endsWith(".json")
      )
      .map((file) => ({
        file,
        fullPath: path.join(resultsDir, file),
      }))
      .sort(
        (a, b) =>
          fs.statSync(b.fullPath).mtimeMs -
          fs.statSync(a.fullPath).mtimeMs
      );

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        measured: false,
        message:
          "No curriculum alignment benchmark results found.",
      });
    }

    const latest = files[0];

    const data = JSON.parse(
      fs.readFileSync(
        latest.fullPath,
        "utf8"
      )
    );

    return NextResponse.json({
      success: true,
      measured: true,
      sourceFile: latest.file,
      generatedAt: data.generatedAt ?? null,
      benchmark:
        data.benchmark ??
        "curriculum-alignment",

      methodology:
        data.methodology ?? null,

      summary:
        data.summary ?? null,

      results:
        data.results ?? [],

      benchmarkCases:
        data.benchmarkCases ?? [],

      latestResult:
        data,
    });

  } catch (error) {
    console.error(
      "Curriculum benchmark API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        measured: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown curriculum benchmark error.",
      },
      {
        status: 500,
      }
    );
  }
}
