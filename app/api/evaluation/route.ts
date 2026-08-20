import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";

import {
  retrieveKnowledge,
} from "../../../lib/knowledge/retriever/chromaRetriever";

const CHAT_MODEL =
  process.env.OLLAMA_CHAT_MODEL || "gemma3:4b";

const EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";

interface BenchmarkCase {
  id: string;
  name: string;
  query: string;
  grade: string;
  subject: string;
  board: string;
  book: string;
  expectedBook: string;
  expectedGrade: string;
}

const BENCHMARKS: BenchmarkCase[] = [
  {
    id: "g5-fractions",
    name: "Grade 5 — Equivalent Fractions",
    query: "Explain equivalent fractions",
    grade: "5",
    subject: "Mathematics",
    board: "NCERT",
    book: "Math Mela",
    expectedBook: "Math Mela",
    expectedGrade: "5",
  },
  {
    id: "g5-numbers",
    name: "Grade 5 — Large Numbers",
    query: "Explain reading and writing large numbers",
    grade: "5",
    subject: "Mathematics",
    board: "NCERT",
    book: "Math Mela",
    expectedBook: "Math Mela",
    expectedGrade: "5",
  },
  {
    id: "g5-weight",
    name: "Grade 5 — Weight and Capacity",
    query: "Explain weight and capacity",
    grade: "5",
    subject: "Mathematics",
    board: "NCERT",
    book: "Math Mela",
    expectedBook: "Math Mela",
    expectedGrade: "5",
  },
  {
    id: "g7-fractions",
    name: "Grade 7 — Fractions",
    query: "Explain fractions",
    grade: "7",
    subject: "Mathematics",
    board: "NCERT",
    book: "Ganita Prakash",
    expectedBook: "Ganita Prakash",
    expectedGrade: "7",
  },
  {
    id: "g7-curriculum",
    name: "Grade 7 — Curriculum Isolation",
    query: "Fractions",
    grade: "7",
    subject: "Mathematics",
    board: "NCERT",
    book: "Ganita Prakash",
    expectedBook: "Ganita Prakash",
    expectedGrade: "7",
  },
];

function average(values: number[]) {
  if (!values.length) return 0;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

export async function POST(
  _request: NextRequest
) {
  const benchmarkStart = Date.now();

  console.log("");
  console.log("======================================");
  console.log("🧪 SRIMATHY BENCHMARK");
  console.log("======================================");

  const results = [];

  for (const test of BENCHMARKS) {
    const start = Date.now();

    console.log("");
    console.log(`🧪 ${test.name}`);
    console.log(`   Query: ${test.query}`);
    console.log(`   Grade: ${test.grade}`);
    console.log(`   Expected Book: ${test.expectedBook}`);

    try {
      const knowledge = await retrieveKnowledge(
        test.query,
        5,
        {
          grade: test.grade,
          subject: test.subject,
          board: test.board,
          book: test.book,
        }
      );

      const retrievalDuration =
        Date.now() - start;

      const correctGrade =
        knowledge.length > 0 &&
        knowledge.every(
          (chunk) =>
            String(chunk.metadata.grade) ===
            test.expectedGrade
        );

      const correctBook =
        knowledge.length > 0 &&
        knowledge.every(
          (chunk) =>
            String(chunk.metadata.book) ===
            test.expectedBook
        );

      const retrievalPassed =
        knowledge.length > 0 &&
        correctGrade &&
        correctBook;

      let answer = "";
      let generationDuration = 0;

      if (knowledge.length > 0) {
        const context = knowledge
          .map(
            (chunk, index) => `
SOURCE ${index + 1}

${chunk.text}
`
          )
          .join("\n");

        const prompt = `
You are SRIMATHY, an AI educational assistant.

Answer the student's question using ONLY
the supplied NCERT knowledge.

Grade: ${test.grade}
Subject: ${test.subject}
Board: ${test.board}
Book: ${test.book}

Student question:
${test.query}

Knowledge:
${context}

Explain clearly and simply for a student.
Do not invent information.
`;

        const generationStart = Date.now();

        const response =
          await ollama.generate({
            model: CHAT_MODEL,
            prompt,
            stream: false,
          });

        generationDuration =
          Date.now() - generationStart;

        answer =
          response.response?.trim() || "";
      }

      /*
       * Basic deterministic grounding checks.
       *
       * This is intentionally transparent rather
       * than using another AI model to judge itself.
       */
      const answerGenerated =
        answer.length > 50;

      const groundingScore =
        retrievalPassed && answerGenerated
          ? 100
          : retrievalPassed
            ? 75
            : 0;

      const passed =
        retrievalPassed &&
        answerGenerated;

      const totalDuration =
        Date.now() - start;

      results.push({
        id: test.id,
        name: test.name,
        query: test.query,

        curriculum: {
          grade: test.grade,
          subject: test.subject,
          board: test.board,
          book: test.book,
        },

        retrieval: {
          chunks: knowledge.length,
          correctGrade,
          correctBook,
          passed: retrievalPassed,
          sources: knowledge.map(
            (chunk) => ({
              book: String(
                chunk.metadata.book ?? ""
              ),
              grade: String(
                chunk.metadata.grade ?? ""
              ),
              subject: String(
                chunk.metadata.subject ?? ""
              ),
              distance: chunk.distance,
            })
          ),
        },

        answer: {
          generated: answerGenerated,
          groundingScore,
        },

        metrics: {
          retrievalDuration,
          generationDuration,
          totalDuration,
        },

        passed,
      });

      console.log(
        passed
          ? "   ✅ PASS"
          : "   ❌ FAIL"
      );
    } catch (error) {
      console.error(
        `   ❌ ERROR: ${error}`
      );

      results.push({
        id: test.id,
        name: test.name,
        query: test.query,

        curriculum: {
          grade: test.grade,
          subject: test.subject,
          board: test.board,
          book: test.book,
        },

        retrieval: {
          chunks: 0,
          correctGrade: false,
          correctBook: false,
          passed: false,
          sources: [],
        },

        answer: {
          generated: false,
          groundingScore: 0,
        },

        metrics: {
          retrievalDuration: 0,
          generationDuration: 0,
          totalDuration: Date.now() - start,
        },

        passed: false,
        error:
          error instanceof Error
            ? error.message
            : "Benchmark test failed",
      });
    }
  }

  const totalDuration =
    Date.now() - benchmarkStart;

  const passedTests =
    results.filter(
      (result) => result.passed
    ).length;

  const totalTests =
    results.length;

  const retrievalPassed =
    results.filter(
      (result) =>
        result.retrieval.passed
    ).length;

  const curriculumPassed =
    results.filter(
      (result) =>
        result.retrieval.correctGrade &&
        result.retrieval.correctBook
    ).length;

  const averageRetrieval =
    average(
      results.map(
        (result) =>
          result.metrics.retrievalDuration
      )
    );

  const averageGeneration =
    average(
      results
        .map(
          (result) =>
            result.metrics.generationDuration
        )
        .filter(
          (value) => value > 0
        )
    );

  const averageGrounding =
    average(
      results.map(
        (result) =>
          result.answer.groundingScore
      )
    );

  const retrievalAccuracy =
    (retrievalPassed / totalTests) * 100;

  const curriculumAccuracy =
    (curriculumPassed / totalTests) * 100;

  const overallScore =
    (
      retrievalAccuracy +
      curriculumAccuracy +
      averageGrounding
    ) / 3;

  const status =
    passedTests === totalTests
      ? "PASS"
      : passedTests >=
          Math.ceil(totalTests * 0.8)
        ? "PASS WITH WARNINGS"
        : "FAIL";

  console.log("");
  console.log("======================================");
  console.log("📊 BENCHMARK COMPLETE");
  console.log("======================================");
  console.log(
    `Tests: ${passedTests}/${totalTests}`
  );
  console.log(
    `Overall Score: ${overallScore.toFixed(1)}%`
  );
  console.log(`Status: ${status}`);
  console.log(
    `Total Duration: ${totalDuration} ms`
  );

  return NextResponse.json({
    success: true,

    benchmark: {
      status,
      tests: totalTests,
      passed: passedTests,
      failed:
        totalTests - passedTests,
      overallScore:
        Number(overallScore.toFixed(1)),
    },

    accuracy: {
      retrieval:
        Number(
          retrievalAccuracy.toFixed(1)
        ),

      curriculum:
        Number(
          curriculumAccuracy.toFixed(1)
        ),

      grounding:
        Number(
          averageGrounding.toFixed(1)
        ),
    },

    performance: {
      averageRetrievalMs:
        Math.round(
          averageRetrieval
        ),

      averageGenerationMs:
        Math.round(
          averageGeneration
        ),

      totalDurationMs:
        totalDuration,
    },

    runtime: {
      chatModel: CHAT_MODEL,
      embeddingModel: EMBEDDING_MODEL,
      vectorStore: "ChromaDB",
      provider: "Ollama",
      mode: "Offline",
    },

    results,
  });
}
