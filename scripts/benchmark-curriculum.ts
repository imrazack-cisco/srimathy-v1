/**
 * ============================================================
 * SRIMATHY — CURRICULUM ALIGNMENT BENCHMARK
 * ============================================================
 *
 * Purpose:
 *   Evaluate whether SRIMATHY's Curriculum Mapper retrieves
 *   the correct NCERT curriculum content for a set of known
 *   textbook benchmark cases.
 *
 * This benchmark measures:
 *
 *   1. Retrieval success
 *   2. Grade alignment
 *   3. Subject alignment
 *   4. Chapter alignment
 *   5. Expected-topic coverage
 *   6. Retrieval rank
 *
 * IMPORTANT:
 *   This script does NOT invent scores.
 *   Every score is calculated from actual retrieval results.
 *
 * Location:
 *
 *   scripts/benchmark/benchmark-curriculum.ts
 *
 * Therefore project-level imports use ../../
 *
 * ============================================================
 */

import fs from "node:fs";
import path from "node:path";

import {
  retrieveKnowledge,
  type RetrievedChunk,
  type RetrievalContext,
} 
from "../lib/knowledge/retriever/chromaRetriever";


/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface CurriculumBenchmarkCase {
  id: string;

  grade: string;

  subject: string;

  query: string;

  expected: {
    chapter: string;

    topics: string[];

    keywords: string[];
  };
}

interface BenchmarkResult {
  id: string;

  grade: string;

  subject: string;

  query: string;

  expectedChapter: string;

  expectedTopics: string[];

  expectedKeywords: string[];

  retrieved: boolean;

  retrievedCount: number;

  bestRank: number | null;

  chapterMatch: boolean;

  topicCoverage: number;

  keywordCoverage: number;

  alignmentScore: number;

  topResults: Array<{
    rank: number;

    chapter: string;

    grade: string;

    subject: string;

    score: number | null;

    textPreview: string;
  }>;
}

interface BenchmarkSummary {
  totalCases: number;

  retrievalSuccesses: number;

  retrievalAccuracyPercent: number;

  chapterMatches: number;

  chapterAccuracyPercent: number;

  averageTopicCoveragePercent: number;

  averageKeywordCoveragePercent: number;

  averageAlignmentScorePercent: number;

  results: BenchmarkResult[];
}

interface NormalizedChunk {
  text: string;

  chapter: string;

  grade: string;

  subject: string;

  score: number | null;
}

/**
 * ============================================================
 * NCERT BENCHMARK SET
 * ============================================================
 *
 * These are explicit benchmark expectations.
 *
 * The benchmark is NOT asking the model to decide what is
 * correct. We compare retrieval against these known NCERT
 * curriculum targets.
 *
 * Keep this list conservative and based on material actually
 * ingested into the SRIMATHY knowledge base.
 * ============================================================
 */

const BENCHMARK_CASES: CurriculumBenchmarkCase[] = [
  {
    id: "g5-math-fractions",

    grade: "Grade 5",

    subject: "Mathematics",

    query:
      "Explain equivalent fractions and compare simple fractions.",

    expected: {
      chapter: "Fractions",

      topics: [
        "fractions",
        "equivalent fractions",
        "comparing fractions",
      ],

      keywords: [
        "fraction",
        "numerator",
        "denominator",
        "equivalent",
      ],
    },
  },

  {
    id: "g5-math-large-numbers",

    grade: "Grade 5",

    subject: "Mathematics",

    query:
      "Teach place value and reading large numbers to a Grade 5 student.",

    expected: {
      chapter: "Large Numbers",

      topics: [
        "large numbers",
        "place value",
        "number system",
      ],

      keywords: [
        "place value",
        "thousand",
        "lakh",
        "number",
      ],
    },
  },

  {
    id: "g5-math-decimals",

    grade: "Grade 5",

    subject: "Mathematics",

    query:
      "Explain decimals and how decimal numbers represent parts of a whole.",

    expected: {
      chapter: "Decimals",

      topics: [
        "decimals",
        "decimal numbers",
        "parts of a whole",
      ],

      keywords: [
        "decimal",
        "tenths",
        "hundredths",
        "place value",
      ],
    },
  },

  {
    id: "g5-math-multiplication",

    grade: "Grade 5",

    subject: "Mathematics",

    query:
      "Explain multiplication using repeated addition and multiplication facts.",

    expected: {
      chapter: "Multiplication",

      topics: [
        "multiplication",
        "repeated addition",
        "multiplication facts",
      ],

      keywords: [
        "multiply",
        "multiplication",
        "product",
        "groups",
      ],
    },
  },

  {
    id: "g5-math-division",

    grade: "Grade 5",

    subject: "Mathematics",

    query:
      "Explain division using equal sharing and grouping.",

    expected: {
      chapter: "Division",

      topics: [
        "division",
        "equal sharing",
        "grouping",
      ],

      keywords: [
        "divide",
        "division",
        "quotient",
        "equal",
      ],
    },
  },

  {
    id: "g5-science-plants",

    grade: "Grade 5",

    subject: "Science",

    query:
      "Explain how plants make food and why sunlight is important.",

    expected: {
      chapter: "Plants",

      topics: [
        "plants",
        "food",
        "sunlight",
      ],

      keywords: [
        "plant",
        "leaf",
        "sunlight",
        "food",
      ],
    },
  },
];

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function clean(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: unknown): string {
  return clean(value);
}

function containsTerm(
  text: string,
  term: string
): boolean {
  return text.includes(clean(term));
}

function coverage(
  text: string,
  expected: string[]
): number {
  if (expected.length === 0) {
    return 0;
  }

  const matched = expected.filter((term) =>
    containsTerm(text, term)
  );

  return matched.length / expected.length;
}

/**
 * Extract metadata from a retrieved chunk.
 *
 * Chroma metadata formats can differ slightly between
 * ingestion versions, so this intentionally handles the
 * common representations used by SRIMATHY.
 */

function normalizeChunk(
  chunk: RetrievedChunk
): NormalizedChunk {

  const item = chunk as unknown as Record<string, unknown>;

  const metadata =
    (item.metadata as Record<string, unknown>) ??
    {};

  const text =
    item.text ??
    item.content ??
    item.document ??
    metadata.text ??
    metadata.content ??
    "";

  const chapter =
    metadata.chapter ??
    metadata.chapterTitle ??
    metadata.chapter_name ??
    item.chapter ??
    item.chapterTitle ??
    "";

  const grade =
    metadata.grade ??
    metadata.class ??
    metadata.gradeLevel ??
    item.grade ??
    item.class ??
    "";

  const subject =
    metadata.subject ??
    metadata.subjectName ??
    item.subject ??
    "";

  const score =
    typeof item.score === "number"
      ? item.score
      : typeof item.distance === "number"
        ? item.distance
        : typeof metadata.score === "number"
          ? metadata.score
          : null;

  return {
    text: String(text),

    chapter: String(chapter),

    grade: String(grade),

    subject: String(subject),

    score,
  };
}

/**
 * ============================================================
 * RETRIEVAL ADAPTER
 * ============================================================
 *
 * The retriever may return:
 *
 *   RetrievedChunk[]
 *
 * or a retrieval context containing chunks.
 *
 * This adapter keeps the benchmark tolerant of either form.
 */

function extractChunks(
  result: unknown
): RetrievedChunk[] {

  if (Array.isArray(result)) {
    return result as RetrievedChunk[];
  }

  if (
    result &&
    typeof result === "object"
  ) {

    const value =
      result as Record<string, unknown>;

    if (Array.isArray(value.chunks)) {
      return value.chunks as RetrievedChunk[];
    }

    if (Array.isArray(value.results)) {
      return value.results as RetrievedChunk[];
    }

    if (Array.isArray(value.documents)) {
      return value.documents as RetrievedChunk[];
    }

    if (Array.isArray(value.context)) {
      return value.context as RetrievedChunk[];
    }
  }

  return [];
}

/**
 * ============================================================
 * RUN ONE BENCHMARK
 * ============================================================
 */

async function runCase(
  benchmarkCase: CurriculumBenchmarkCase
): Promise<BenchmarkResult> {

  console.log("");
  console.log(
    `🔎 ${benchmarkCase.id}`
  );

  console.log(
    `   Grade   : ${benchmarkCase.grade}`
  );

  console.log(
    `   Subject : ${benchmarkCase.subject}`
  );

  console.log(
    `   Query   : ${benchmarkCase.query}`
  );

  let retrievedChunks: RetrievedChunk[] = [];

  try {

    /**
     * RetrievalContext is intentionally constructed here so
     * the benchmark remains explicit about curriculum scope.
     *
     * If your retriever accepts only a string, the fallback
     * call below handles that implementation.
     */

    const context = {
      grade: benchmarkCase.grade,

      subject: benchmarkCase.subject,

      query: benchmarkCase.query,
    } as unknown as RetrievalContext;

    let result: unknown;

    try {

      result =
        await retrieveKnowledge(
          benchmarkCase.query,
          10,
          context
        );

    } catch {

      /**
       * Compatibility fallback for retriever versions where
       * retrieveKnowledge(query) is the supported signature.
       */

      result =
        await retrieveKnowledge(
          benchmarkCase.query
        );
    }

    retrievedChunks =
      extractChunks(result);

  } catch (error) {

    console.warn(
      "   ⚠️ Retrieval failed:",
      error instanceof Error
        ? error.message
        : error
    );
  }

  const normalized =
    retrievedChunks
      .map(normalizeChunk)
      .slice(0, 10);

  /**
   * Combined searchable representation.
   */

  const searchable =
    normalized.map((item) =>
      [
        item.text,
        item.chapter,
        item.grade,
        item.subject,
      ].join(" ")
    );

  /**
   * ----------------------------------------------------------
   * Retrieval success
   * ----------------------------------------------------------
   *
   * A retrieval is successful when at least one relevant
   * result is returned.
   */

  const retrieved =
    normalized.length > 0;

  /**
   * ----------------------------------------------------------
   * Chapter matching
   * ----------------------------------------------------------
   */

  const expectedChapter =
    clean(
      benchmarkCase.expected.chapter
    );

  let bestRank: number | null = null;

  let chapterMatch = false;

  normalized.forEach(
    (item, index) => {

      const chapterText =
        clean(item.chapter);

      const fullText =
        clean(
          [
            item.chapter,
            item.text,
          ].join(" ")
        );

      const matchesChapter =
        chapterText.includes(
          expectedChapter
        ) ||
        expectedChapter.includes(
          chapterText
        ) ||
        fullText.includes(
          expectedChapter
        );

      if (
        matchesChapter &&
        bestRank === null
      ) {

        bestRank =
          index + 1;

        chapterMatch =
          true;
      }
    }
  );

  /**
   * ----------------------------------------------------------
   * Topic coverage
   * ----------------------------------------------------------
   */

  const combinedText =
    searchable.join(" ");

  const topicCoverage =
    coverage(
      combinedText,
      benchmarkCase.expected.topics
    );

  /**
   * ----------------------------------------------------------
   * Keyword coverage
   * ----------------------------------------------------------
   */

  const keywordCoverage =
    coverage(
      combinedText,
      benchmarkCase.expected.keywords
    );

  /**
   * ----------------------------------------------------------
   * Alignment score
   * ----------------------------------------------------------
   *
   * Weighted:
   *
   *   40% chapter alignment
   *   35% topic coverage
   *   25% keyword coverage
   *
   * This is deliberately deterministic.
   */

  const alignmentScore =
    (
      (chapterMatch ? 0.40 : 0) +
      topicCoverage * 0.35 +
      keywordCoverage * 0.25
    ) * 100;

  const topResults =
    normalized
      .slice(0, 5)
      .map(
        (item, index) => ({
          rank: index + 1,

          chapter:
            item.chapter ||
            "Unknown",

          grade:
            item.grade ||
            "Unknown",

          subject:
            item.subject ||
            "Unknown",

          score:
            item.score,

          textPreview:
            item.text
              .replace(/\s+/g, " ")
              .slice(0, 220),
        })
      );

  console.log(
    `   Retrieved       : ${
      retrieved ? "YES" : "NO"
    }`
  );

  console.log(
    `   Chapter match   : ${
      chapterMatch ? "YES" : "NO"
    }`
  );

  console.log(
    `   Best rank       : ${
      bestRank ?? "N/A"
    }`
  );

  console.log(
    `   Topic coverage  : ${
      (topicCoverage * 100).toFixed(1)
    }%`
  );

  console.log(
    `   Keyword coverage: ${
      (keywordCoverage * 100).toFixed(1)
    }%`
  );

  console.log(
    `   Alignment score : ${
      alignmentScore.toFixed(1)
    }%`
  );

  return {
    id: benchmarkCase.id,

    grade:
      benchmarkCase.grade,

    subject:
      benchmarkCase.subject,

    query:
      benchmarkCase.query,

    expectedChapter:
      benchmarkCase.expected.chapter,

    expectedTopics:
      benchmarkCase.expected.topics,

    expectedKeywords:
      benchmarkCase.expected.keywords,

    retrieved,

    retrievedCount:
      normalized.length,

    bestRank,

    chapterMatch,

    topicCoverage,

    keywordCoverage,

    alignmentScore,

    topResults,
  };
}

/**
 * ============================================================
 * MAIN BENCHMARK
 * ============================================================
 */

async function main() {

  console.log("");
  console.log(
    "=============================================="
  );

  console.log(
    "🧪 SRIMATHY CURRICULUM ALIGNMENT BENCHMARK"
  );

  console.log(
    "=============================================="
  );

  console.log(
    `Benchmark cases: ${BENCHMARK_CASES.length}`
  );

  console.log(
    "Ground truth: NCERT benchmark expectations"
  );

  console.log(
    "Evaluation: retrieval + chapter + topic + keyword alignment"
  );

  console.log(
    "=============================================="
  );

  const results: BenchmarkResult[] = [];

  for (
    const benchmarkCase
    of BENCHMARK_CASES
  ) {

    const result =
      await runCase(
        benchmarkCase
      );

    results.push(result);
  }

  /**
   * ==========================================================
   * SUMMARY
   * ==========================================================
   */

  const totalCases =
    results.length;

  const retrievalSuccesses =
    results.filter(
      (result) =>
        result.retrieved
    ).length;

  const chapterMatches =
    results.filter(
      (result) =>
        result.chapterMatch
    ).length;

  const retrievalAccuracyPercent =
    totalCases === 0
      ? 0
      : (
          retrievalSuccesses /
          totalCases
        ) * 100;

  const chapterAccuracyPercent =
    totalCases === 0
      ? 0
      : (
          chapterMatches /
          totalCases
        ) * 100;

  const averageTopicCoveragePercent =
    totalCases === 0
      ? 0
      : (
          results.reduce(
            (sum, result) =>
              sum +
              result.topicCoverage,
            0
          ) /
          totalCases
        ) * 100;

  const averageKeywordCoveragePercent =
    totalCases === 0
      ? 0
      : (
          results.reduce(
            (sum, result) =>
              sum +
              result.keywordCoverage,
            0
          ) /
          totalCases
        ) * 100;

  const averageAlignmentScorePercent =
    totalCases === 0
      ? 0
      : results.reduce(
          (sum, result) =>
            sum +
            result.alignmentScore,
          0
        ) /
        totalCases;

  const summary: BenchmarkSummary = {
    totalCases,

    retrievalSuccesses,

    retrievalAccuracyPercent,

    chapterMatches,

    chapterAccuracyPercent,

    averageTopicCoveragePercent,

    averageKeywordCoveragePercent,

    averageAlignmentScorePercent,

    results,
  };

  /**
   * ==========================================================
   * TERMINAL REPORT
   * ==========================================================
   */

  console.log("");
  console.log(
    "=============================================="
  );

  console.log(
    "📊 CURRICULUM ALIGNMENT RESULTS"
  );

  console.log(
    "=============================================="
  );

  console.log(
    `Retrieval accuracy : ${
      retrievalAccuracyPercent.toFixed(1)
    }%`
  );

  console.log(
    `Chapter accuracy   : ${
      chapterAccuracyPercent.toFixed(1)
    }%`
  );

  console.log(
    `Topic coverage     : ${
      averageTopicCoveragePercent.toFixed(1)
    }%`
  );

  console.log(
    `Keyword coverage   : ${
      averageKeywordCoveragePercent.toFixed(1)
    }%`
  );

  console.log(
    `Overall alignment  : ${
      averageAlignmentScorePercent.toFixed(1)
    }%`
  );

  console.log(
    "=============================================="
  );

  /**
   * ==========================================================
   * PER-CASE TABLE
   * ==========================================================
   */

  console.log("");

  console.log(
    "CASE RESULTS"
  );

  console.log(
    "----------------------------------------------"
  );

  for (
    const result of results
  ) {

    console.log(
      `${result.id}`
    );

    console.log(
      `  Retrieved : ${
        result.retrieved
          ? "PASS"
          : "FAIL"
      }`
    );

    console.log(
      `  Chapter   : ${
        result.chapterMatch
          ? "PASS"
          : "FAIL"
      }`
    );

    console.log(
      `  Rank      : ${
        result.bestRank ?? "N/A"
      }`
    );

    console.log(
      `  Alignment : ${
        result.alignmentScore.toFixed(1)
      }%`
    );
  }

  /**
   * ==========================================================
   * SAVE RESULT
   * ==========================================================
   */

  const outputDirectory =
    path.join(
      process.cwd(),
      "benchmark-results"
    );

  fs.mkdirSync(
    outputDirectory,
    {
      recursive: true,
    }
  );

  const timestamp =
    Date.now();

  const outputFile =
    path.join(
      outputDirectory,
      `curriculum-alignment-${timestamp}.json`
    );

  const output = {
    generatedAt:
      new Date().toISOString(),

    benchmark:
      "curriculum-alignment",

    methodology: {
      description:
        "Deterministic comparison of SRIMATHY curriculum retrieval against explicit NCERT textbook benchmark expectations.",

      retrievalAccuracy:
        "Percentage of benchmark queries returning at least one retrieval result.",

      chapterAccuracy:
        "Percentage of benchmark queries where the expected chapter was present in retrieved results.",

      topicCoverage:
        "Percentage of expected curriculum topics found in retrieved context.",

      keywordCoverage:
        "Percentage of benchmark keywords found in retrieved context.",

      alignmentScore:
        "Weighted score: 40% chapter alignment + 35% topic coverage + 25% keyword coverage.",
    },

    benchmarkCases:
      BENCHMARK_CASES,

    summary,

    results,
  };

  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      output,
      null,
      2
    ),
    "utf8"
  );

  console.log("");

  console.log(
    `💾 Results saved: ${outputFile}`
  );

  console.log("");

  console.log(
    "=============================================="
  );

  console.log(
    "✅ CURRICULUM ALIGNMENT BENCHMARK COMPLETE"
  );

  console.log(
    "=============================================="
  );
}

/**
 * ============================================================
 * EXECUTE
 * ============================================================
 */

main().catch(
  (error) => {

    console.error("");

    console.error(
      "❌ Curriculum benchmark failed."
    );

    console.error(
      error instanceof Error
        ? error.stack ??
          error.message
        : error
    );

    process.exit(1);
  }
);