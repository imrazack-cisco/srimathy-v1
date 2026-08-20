import {
  retrieveKnowledge,
  RetrievedChunk,
  RetrievalContext,
} from "../retriever/chromaRetriever";

import {
  semanticSimilarity,
} from "./similarity";


export interface CurriculumAlignmentResult {

  score: number;

  semanticSimilarity: number;

  topicCoverage: number;

  referenceChunks: number;

  unsupportedContent: number;

  confidence: number;

  status:
    | "GOOD"
    | "MODERATE"
    | "LOW"
    | "NO_REFERENCE";

  references: Array<{
    id: string;
    similarity: number;
    distance: number;
    source: string;
    page: string;
    text: string;
  }>;

}


/**
 * Split generated content into reasonably sized
 * semantic units for validation.
 */
function splitIntoStatements(
  text: string
): string[] {

  return text

    .replace(
      /```[\s\S]*?```/g,
      ""
    )

    .split(
      /(?<=[.!?])\s+|\n+/
    )

    .map(
      value =>
        value
          .replace(
            /^[-*#\d.)\s]+/,
            ""
          )
          .trim()
    )

    .filter(
      value =>
        value.length >= 20
    );

}


/**
 * Convert Chroma metadata into safe strings.
 */
function metadataValue(
  metadata: Record<string, unknown>,
  key: string
): string {

  const value = metadata[key];

  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value);
}


/**
 * Evaluate generated teaching content against
 * the local NCERT knowledge base.
 *
 * This measures semantic curriculum alignment.
 *
 * It does NOT independently prove factual correctness.
 */
export async function evaluateCurriculumAlignment(
  generatedText: string,
  topic: string,
  topK: number = 5,
  context: RetrievalContext = {}
): Promise<CurriculumAlignmentResult> {

  console.log(
    "\n======================================"
  );

  console.log(
    "📚 CURRICULUM ALIGNMENT EVALUATION"
  );

  console.log(
    "======================================"
  );

  console.log(
    "Topic:",
    topic
  );

  console.log(
    "Curriculum:",
    context
  );


  // ==========================================================
  // 1. RETRIEVE CURRICULUM REFERENCES
  // ==========================================================

  let chunks: RetrievedChunk[] = [];

  try {

    chunks =
      await retrieveKnowledge(
        topic,
        topK,
        context
      );

  } catch (error) {

    console.warn(
      "⚠ Curriculum retrieval unavailable during evaluation."
    );

    console.warn(
      "Reason:",
      error instanceof Error
        ? error.message
        : String(error)
    );

    return {

      score: 0,

      semanticSimilarity: 0,

      topicCoverage: 0,

      referenceChunks: 0,

      unsupportedContent:
        splitIntoStatements(
          generatedText
        ).length,

      confidence: 0,

      status: "NO_REFERENCE",

      references: [],

    };

  }


  if (chunks.length === 0) {

    console.warn(
      "⚠ No curriculum references found."
    );

    return {

      score: 0,

      semanticSimilarity: 0,

      topicCoverage: 0,

      referenceChunks: 0,

      unsupportedContent:
        splitIntoStatements(
          generatedText
        ).length,

      confidence: 0,

      status: "NO_REFERENCE",

      references: [],

    };

  }


  // ==========================================================
  // 2. SPLIT GENERATED CONTENT
  // ==========================================================

  const statements =
    splitIntoStatements(
      generatedText
    );


  const statementScores: number[] = [];


  // ==========================================================
  // 3. COMPARE GENERATED CONTENT
  // ==========================================================

  for (
    const statement of statements
  ) {

    let bestSimilarity = 0;

    for (
      const chunk of chunks
    ) {

      try {

        const result =
          await semanticSimilarity(
            statement,
            chunk.text
          );

        if (
          result.similarity >
          bestSimilarity
        ) {

          bestSimilarity =
            result.similarity;

        }

      } catch (error) {

        console.warn(
          "⚠ Semantic similarity unavailable."
        );

        console.warn(
          "Reason:",
          error instanceof Error
            ? error.message
            : String(error)
        );

      }

    }

    statementScores.push(
      bestSimilarity
    );

  }


  // ==========================================================
  // 4. SEMANTIC ALIGNMENT
  // ==========================================================

  const averageSimilarity =

    statementScores.length > 0

      ? statementScores.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        statementScores.length

      : 0;


  // ==========================================================
  // 5. TOPIC COVERAGE
  // ==========================================================

  const COVERAGE_THRESHOLD =
    0.65;

  const supportedStatements =
    statementScores.filter(
      score =>
        score >=
        COVERAGE_THRESHOLD
    ).length;


  const topicCoverage =

    statementScores.length > 0

      ? supportedStatements /
        statementScores.length

      : 0;


  // ==========================================================
  // 6. UNSUPPORTED CONTENT
  // ==========================================================

  const unsupportedContent =
    statementScores.filter(
      score =>
        score <
        COVERAGE_THRESHOLD
    ).length;


  // ==========================================================
  // 7. COMPOSITE ALIGNMENT SCORE
  // ==========================================================

  const score = Math.round(

    (
      averageSimilarity *
        0.6 +

      topicCoverage *
        0.4

    ) * 100

  );


  // ==========================================================
  // 8. CONFIDENCE
  // ==========================================================

  const confidence = Math.round(

    Math.min(
      1,

      (
        averageSimilarity *
        0.7
      ) +

      (
        topicCoverage *
        0.3
      )

    ) * 100

  );


  // ==========================================================
  // 9. STATUS
  // ==========================================================

  let status:
    | "GOOD"
    | "MODERATE"
    | "LOW";

  if (
    score >= 80
  ) {

    status = "GOOD";

  } else if (
    score >= 60
  ) {

    status = "MODERATE";

  } else {

    status = "LOW";

  }


  // ==========================================================
  // 10. REFERENCE INFORMATION
  // ==========================================================

  const references =
    await Promise.all(

      chunks.map(
        async (
          chunk: RetrievedChunk
        ) => {

          let similarity = 0;

          try {

            const result =
              await semanticSimilarity(
                generatedText,
                chunk.text
              );

            similarity =
              result.similarity;

          } catch {

            similarity = 0;

          }

          return {

            id:
              chunk.id,

            similarity,

            distance:
              chunk.distance,

            source:
              metadataValue(
                chunk.metadata,
                "source"
              ),

            page:
              metadataValue(
                chunk.metadata,
                "page"
              ),

            text:
              chunk.text,

          };

        }
      )

    );


  // ==========================================================
  // 11. LOG RESULT
  // ==========================================================

  console.log(
    "\n======================================"
  );

  console.log(
    "📊 EVALUATION RESULT"
  );

  console.log(
    "======================================"
  );

  console.log(
    "Generated statements:",
    statements.length
  );

  console.log(
    "Reference chunks:",
    chunks.length
  );

  console.log(
    "Semantic comparisons:",
    statementScores.length
  );

  console.log(
    "Average similarity:",
    averageSimilarity.toFixed(3)
  );

  console.log(
    "Topic coverage:",
    `${Math.round(
      topicCoverage * 100
    )}%`
  );

  console.log(
    "Unsupported statements:",
    unsupportedContent
  );

  console.log(
    "Alignment:",
    `${score}%`
  );

  console.log(
    "Confidence:",
    `${confidence}%`
  );

  console.log(
    "Status:",
    status
  );

  console.log(
    "======================================"
  );


  return {

    score,

    semanticSimilarity:
      Number(
        averageSimilarity.toFixed(4)
      ),

    topicCoverage:
      Math.round(
        topicCoverage * 100
      ),

    referenceChunks:
      chunks.length,

    unsupportedContent,

    confidence,

    status,

    references,

  };

}