import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

type BenchmarkCase = {
  id?: string;
  caseId?: string;
  name?: string;
  grade?: string;
  subject?: string;
  query?: string;
  retrieved?: boolean;
  retrieval?: boolean;
  chapterMatch?: boolean;
  chapter?: string;
  rank?: number | null;
  alignmentScore?: number;
  score?: number;
  topicCoverage?: number;
  keywordCoverage?: number;
  [key: string]: unknown;
};

type BenchmarkFile = {
  generatedAt?: string;
  benchmark?: string;
  totalCases?: number;
  cases?: BenchmarkCase[];
  results?: BenchmarkCase[];

  retrievalAccuracy?: number;
  chapterAccuracy?: number;
  topicCoverage?: number;
  keywordCoverage?: number;
  overallAlignment?: number;

  metrics?: {
    retrievalAccuracy?: number;
    chapterAccuracy?: number;
    topicCoverage?: number;
    keywordCoverage?: number;
    overallAlignment?: number;
  };

  summary?: {
    retrievalAccuracy?: number;
    chapterAccuracy?: number;
    topicCoverage?: number;
    keywordCoverage?: number;
    overallAlignment?: number;
  };

  [key: string]: unknown;
};

function latestBenchmarkFile() {
  const directory = path.join(process.cwd(), "benchmark-results");

  if (!fs.existsSync(directory)) {
    return null;
  }

  const files = fs
    .readdirSync(directory)
    .filter(
      (file) =>
        file.startsWith("curriculum-alignment-") &&
        file.endsWith(".json")
    )
    .map((file) => ({
      file,
      fullPath: path.join(directory, file),
      mtime: fs.statSync(path.join(directory, file)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return files[0] ?? null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function firstBoolean(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

export async function GET() {
  try {
    const latest = latestBenchmarkFile();

    if (!latest) {
      return NextResponse.json({
        success: true,
        measured: false,
        message: "No curriculum alignment benchmark has been generated yet.",
        sourceFile: null,
        generatedAt: null,
        totalCases: 0,
        metrics: {
          retrievalAccuracy: null,
          chapterAccuracy: null,
          topicCoverage: null,
          keywordCoverage: null,
          overallAlignment: null,
        },
        cases: [],
      });
    }

    const raw = fs.readFileSync(latest.fullPath, "utf8");
    const data = JSON.parse(raw) as BenchmarkFile;

    const metricsSource =
      data.metrics ??
      data.summary ??
      data;

    const cases =
      Array.isArray(data.cases)
        ? data.cases
        : Array.isArray(data.results)
          ? data.results
          : [];

    const normalizedCases = cases.map((item, index) => ({
      id:
        item.id ??
        item.caseId ??
        `case-${index + 1}`,

      name:
        item.name ??
        item.caseId ??
        `Benchmark Case ${index + 1}`,

      grade: item.grade ?? null,

      subject: item.subject ?? null,

      query: item.query ?? null,

      retrieved:
        firstBoolean(
          item.retrieved,
          item.retrieval
        ),

      chapterMatch:
        firstBoolean(
          item.chapterMatch
        ),

      chapter:
        typeof item.chapter === "string"
          ? item.chapter
          : null,

      rank:
        typeof item.rank === "number"
          ? item.rank
          : null,

      alignmentScore:
        firstNumber(
          item.alignmentScore,
          item.score
        ),

      topicCoverage:
        firstNumber(item.topicCoverage),

      keywordCoverage:
        firstNumber(item.keywordCoverage),
    }));

    return NextResponse.json({
      success: true,

      measured: true,

      sourceFile: latest.file,

      generatedAt:
        data.generatedAt ??
        null,

      benchmark:
        data.benchmark ??
        "curriculum-alignment",

      totalCases:
        data.totalCases ??
        normalizedCases.length,

      metrics: {
        retrievalAccuracy: firstNumber(
          metricsSource.retrievalAccuracy
        ),

        chapterAccuracy: firstNumber(
          metricsSource.chapterAccuracy
        ),

        topicCoverage: firstNumber(
          metricsSource.topicCoverage
        ),

        keywordCoverage: firstNumber(
          metricsSource.keywordCoverage
        ),

        overallAlignment: firstNumber(
          metricsSource.overallAlignment
        ),
      },

      cases: normalizedCases,
    });
  } catch (error) {
    console.error(
      "Curriculum alignment API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        measured: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load curriculum benchmark.",
      },
      {
        status: 500,
      }
    );
  }
}
