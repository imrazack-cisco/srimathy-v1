import fs from "fs";
import path from "path";

interface GoldChapter {
  id: string;
  chapter: number;
  title: string;
}

interface GoldCase {
  id: string;
  query: string;
  expectedChapters: string[];
}

interface GoldDataset {
  dataset: string;
  edition: string;
  source: string;
  grade: number;
  subject: string;
  chapters: GoldChapter[];
  cases: GoldCase[];
}

export interface CurriculumPrediction {
  chapterIds: string[];
  chapterTitles?: string[];
}

export interface CurriculumCaseResult {
  id: string;
  query: string;

  expectedChapters: string[];
  predictedChapters: string[];

  truePositives: number;
  falsePositives: number;
  falseNegatives: number;

  precision: number;
  recall: number;
  f1: number;

  exactMatch: boolean;
}

export interface CurriculumBenchmarkResult {
  dataset: string;
  edition: string;
  grade: number;

  totalCases: number;
  exactMatches: number;

  macroPrecision: number;
  macroRecall: number;
  macroF1: number;

  chapterAccuracy: number;

  results: CurriculumCaseResult[];
}

function loadGoldDataset(): GoldDataset {
  const file = path.join(
    process.cwd(),
    "data/evaluation/ncert-curriculum-gold.json"
  );

  return JSON.parse(
    fs.readFileSync(file, "utf8")
  );
}

function normaliseIds(ids: string[]) {
  return [
    ...new Set(
      ids
        .filter(Boolean)
        .map((id) => id.trim())
    ),
  ].sort();
}

function calculateMetrics(
  expected: string[],
  predicted: string[]
) {
  const expectedSet =
    new Set(expected);

  const predictedSet =
    new Set(predicted);

  let truePositives = 0;

  for (const id of predictedSet) {
    if (expectedSet.has(id)) {
      truePositives++;
    }
  }

  const falsePositives =
    predictedSet.size -
    truePositives;

  const falseNegatives =
    expectedSet.size -
    truePositives;

  const precision =
    truePositives +
      falsePositives ===
    0
      ? 0
      : truePositives /
        (truePositives +
          falsePositives);

  const recall =
    truePositives +
      falseNegatives ===
    0
      ? 0
      : truePositives /
        (truePositives +
          falseNegatives);

  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) /
        (precision + recall);

  return {
    truePositives,
    falsePositives,
    falseNegatives,
    precision,
    recall,
    f1,
  };
}

export function evaluateCurriculumPrediction(
  prediction: CurriculumPrediction
): CurriculumBenchmarkResult {
  const gold =
    loadGoldDataset();

  const results =
    gold.cases.map((testCase) => {
      /*
       * The caller supplies the prediction for
       * the current case. This helper is intended
       * for single-case evaluation.
       */
      const expected =
        normaliseIds(
          testCase.expectedChapters
        );

      const predicted =
        normaliseIds(
          prediction.chapterIds
        );

      const metrics =
        calculateMetrics(
          expected,
          predicted
        );

      return {
        id: testCase.id,
        query: testCase.query,

        expectedChapters:
          expected,

        predictedChapters:
          predicted,

        ...metrics,

        exactMatch:
          JSON.stringify(
            expected
          ) ===
          JSON.stringify(
            predicted
          ),
      };
    });

  const macroPrecision =
    results.reduce(
      (sum, item) =>
        sum + item.precision,
      0
    ) / results.length;

  const macroRecall =
    results.reduce(
      (sum, item) =>
        sum + item.recall,
      0
    ) / results.length;

  const macroF1 =
    results.reduce(
      (sum, item) =>
        sum + item.f1,
      0
    ) / results.length;

  const exactMatches =
    results.filter(
      (item) =>
        item.exactMatch
    ).length;

  return {
    dataset: gold.dataset,
    edition: gold.edition,
    grade: gold.grade,

    totalCases:
      results.length,

    exactMatches,

    macroPrecision,
    macroRecall,
    macroF1,

    chapterAccuracy:
      exactMatches /
      results.length,

    results,
  };
}