import {
  evaluateCurriculumAlignment,
} from "@/lib/knowledge/evaluator/curriculumAlignment";

import {
  runtimeMetrics,
  recordCurriculumEvaluation,
} from "@/research/metrics";

import { curriculumAgent } from "@/agents/curriculum";
import { worksheetAgent } from "@/agents/worksheet";
import { quizAgent } from "@/agents/quiz";
import { teacherAgent } from "@/agents/teacher";

import {
  startRequest,
  recordAgent,
  finishRequest,
} from "@/ai/telemetry";

import {
  recordTelemetry,
} from "@/lib/telemetry/telemetryStore";

import {
  retrieveKnowledge,
  RetrievalContext,
} from "@/lib/knowledge/retriever/chromaRetriever";


// ============================================================
// REQUEST TYPES
// ============================================================

export interface MasterRequest {
  topic: string;

  curriculum?: RetrievalContext;

  /**
   * Previous conversational turns.
   *
   * This allows SRIMATHY to understand:
   *
   * "Explain fractions"
   * "Give me an example"
   * "Make it harder"
   *
   * without treating every request as a new conversation.
   */
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}


// ============================================================
// RESPONSE TYPES
// ============================================================

export interface MasterResponse {

  runtime?: {
    requestId: string;
    model: string;
    provider: string;
    runtime: "offline" | "online";
    fallback: boolean;
    totalLatencyMs: number;
  };
  
  lesson: {
    title: string;
    content: string;
  };

  worksheet: {
    content: string;
  };

  quiz: {
    content: string;
  };

  teacher: {
    content: string;
  };

  retrieval: {
    chunks: number;

    sources: Array<{
      id: string;
      book: string;
      grade: string;
      subject: string;
      distance: number;
    }>;
  };

  curriculum: RetrievalContext;

  research?: {

    semanticSimilarity: number;

    topicCoverage: number;

    curriculumAlignment: number;

    confidence: number;

    referenceChunks: number;

    unsupportedContent: number;

    hallucinationRisk:
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "UNKNOWN";

    status:
      | "GOOD"
      | "MODERATE"
      | "LOW"
      | "NO_REFERENCE";
  };
}


// ============================================================
// SRIMATHY MASTER AGENT
// ============================================================
//
// User
//   ↓
// Conversation Memory
//   ↓
// Curriculum-aware RAG
//   ↓
// NCERT Knowledge Context
//   ↓
// Curriculum Agent
//   ↓
// Worksheet Agent
//   ↓
// Quiz Agent
//   ↓
// Teacher Agent
//   ↓
// Curriculum / Hallucination Evaluation
//   ↓
// Research Metrics
//
// ============================================================

export async function masterAgent(
  request: MasterRequest
): Promise<MasterResponse> {

  console.log(
    "\n======================================"
  );

  console.log(
    "🚀 SRIMATHY MASTER AGENT"
  );

  console.log(
    "======================================"
  );

  console.log(
    "📚 Topic:",
    request.topic
  );

  console.log(
    "🎓 Curriculum:",
    request.curriculum
  );


  // ==========================================================
  // 0. CONVERSATION CONTEXT
  // ==========================================================

  const history =
    Array.isArray(request.history)
      ? request.history
      : [];


  /*
   * Prevent unlimited prompt growth.
   *
   * Eight recent messages gives the model enough context
   * for normal educational conversations while keeping
   * local Gemma inference manageable.
   */

  const recentHistory =
    history
      .slice(-8)
      .map((message) => ({
        role: message.role,

        content:
          typeof message.content === "string"
            ? message.content.trim()
            : "",
      }))
      .filter(
        (message) =>
          message.content.length > 0
      );


  const conversationContext =
    recentHistory.length > 0
      ? recentHistory
          .map(
            (message) =>
              `${
                message.role === "user"
                  ? "Student"
                  : "SRIMATHY"
              }: ${message.content}`
          )
          .join("\n")
      : "No previous conversation.";


  console.log(
    "💬 Conversation turns:",
    recentHistory.length
  );


  // ==========================================================
  // 1. START TELEMETRY
  // ==========================================================

  const telemetry =
    startRequest(
      request.topic,

      process.env.OLLAMA_MODEL ??
        "gemma3:4b-q3",

      "Ollama Local"
    );


  // ==========================================================
  // 2. CURRICULUM
  // ==========================================================

  const curriculum =
    request.curriculum ?? {};


  // ==========================================================
  // 3. CURRICULUM-AWARE RAG
  // ==========================================================

  console.log(
    "\n======================================"
  );

  console.log(
    "🔎 SRIMATHY CURRICULUM RAG"
  );

  console.log(
    "======================================"
  );


  const retrievalStart =
    performance.now();


  /*
   * We don't embed the complete conversation.
   *
   * Instead we take the last three STUDENT messages and
   * combine them with the current request.
   *
   * Example:
   *
   * Explain fractions
   * Give me an example
   * Make it harder
   *
   * becomes a meaningful retrieval query.
   */

  const previousStudentMessages =
    recentHistory
      .filter(
        (message) =>
          message.role === "user"
      )
      .slice(-3)
      .map(
        (message) =>
          message.content
      );


  const retrievalQuery = [
    ...previousStudentMessages,
    request.topic,
  ]
    .filter(
      (value) =>
        value.trim().length > 0
    )
    .join("\n");


  console.log(
    "🔎 RAG Query:",
    retrievalQuery
  );


  const knowledge =
    await retrieveKnowledge(
      retrievalQuery,
      5,
      curriculum
    );


  const retrievalLatency =
    performance.now() -
    retrievalStart;


  console.log(
    `⏱ Retrieval: ${Math.round(
      retrievalLatency
    )} ms`
  );

  console.log(
    `📚 Useful NCERT chunks: ${knowledge.length}`
  );


  // ==========================================================
  // WRITE RAG TELEMETRY
  // ==========================================================

  runtimeMetrics.retrievedChunks =
    knowledge.length;

  runtimeMetrics.retrievalLatency =
    retrievalLatency;

  runtimeMetrics.lastUpdated =
    new Date().toISOString();


  // ==========================================================
  // 4. BUILD KNOWLEDGE CONTEXT
  // ==========================================================

  const knowledgeContext =
    knowledge
      .map(
        (chunk, index) => `
--- NCERT SOURCE ${index + 1} ---

Book:
${chunk.metadata.book ?? "Unknown"}

Grade:
${chunk.metadata.grade ?? "Unknown"}

Subject:
${chunk.metadata.subject ?? "Unknown"}

Board:
${chunk.metadata.board ?? "Unknown"}

Content:
${chunk.text}
`
      )
      .join("\n");


  // ==========================================================
  // 5. BUILD GROUNDED CONVERSATIONAL PROMPT
  // ==========================================================

  const groundedTopic = `
You are generating educational content for SRIMATHY.

SRIMATHY is an offline-first, curriculum-aware educational
AI tutor.

============================================================
CURRICULUM
============================================================

Grade:
${curriculum.grade ?? "Not specified"}

Subject:
${curriculum.subject ?? "Not specified"}

Board:
${curriculum.board ?? "Not specified"}

Book:
${curriculum.book ?? "Not specified"}


============================================================
CONVERSATION HISTORY
============================================================

${conversationContext}


============================================================
CURRENT STUDENT REQUEST
============================================================

${request.topic}


============================================================
NCERT KNOWLEDGE CONTEXT
============================================================

${knowledgeContext || "No relevant NCERT knowledge was retrieved."}


============================================================
END NCERT KNOWLEDGE CONTEXT
============================================================


============================================================
INSTRUCTIONS
============================================================

1. Answer the student's CURRENT request directly.

2. Use the conversation history to understand follow-up
   questions.

3. Resolve references such as:
   - it
   - this
   - that
   - the above
   - another one
   - make it harder
   - explain again
   - give me another example

   using the conversation history.

4. Use the NCERT knowledge context as the primary
   curriculum source.

5. Stay appropriate for the selected grade.

6. Stay aligned to the selected subject, board and book.

7. Do not use content from another grade.

8. Do not invent curriculum-specific facts.

9. If the retrieved NCERT context does not support a
   curriculum-specific claim, do not present that claim
   as an NCERT fact.

10. Build naturally on previous answers.

11. Do not unnecessarily repeat previous answers.

12. If the student asks for an example, give an example.

13. If the student asks for practice questions, give
    practice questions.

14. If the student asks for a harder explanation, increase
    difficulty while remaining appropriate for the selected
    grade.

15. If the student asks for clarification, explain the
    concept differently rather than simply repeating it.

16. Generate clear, age-appropriate educational content.
`;


  // ==========================================================
  // 6. CURRICULUM AGENT
  // ==========================================================

  console.log(
    "\n📚 Curriculum Agent"
  );


  const curriculumStart =
    performance.now();


  const lesson =
    await curriculumAgent({
      topic: groundedTopic,
    });


  const curriculumLatency =
    performance.now() -
    curriculumStart;


  recordAgent(
    telemetry,
    "Curriculum Agent",
    curriculumLatency
  );


  console.log(
    `⏱ Curriculum Agent: ${Math.round(
      curriculumLatency
    )} ms`
  );


  // ==========================================================
  // 7. WORKSHEET AGENT
  // ==========================================================

  console.log(
    "\n📝 Worksheet Agent"
  );


  const worksheetStart =
    performance.now();


  const worksheet =
    await worksheetAgent({
      topic: groundedTopic,
    });


  const worksheetLatency =
    performance.now() -
    worksheetStart;


  recordAgent(
    telemetry,
    "Worksheet Agent",
    worksheetLatency
  );


  console.log(
    `⏱ Worksheet Agent: ${Math.round(
      worksheetLatency
    )} ms`
  );


  // ==========================================================
  // 8. QUIZ AGENT
  // ==========================================================

  console.log(
    "\n❓ Quiz Agent"
  );


  const quizStart =
    performance.now();


  const quiz =
    await quizAgent({
      topic: groundedTopic,
    });


  const quizLatency =
    performance.now() -
    quizStart;


  recordAgent(
    telemetry,
    "Quiz Agent",
    quizLatency
  );


  console.log(
    `⏱ Quiz Agent: ${Math.round(
      quizLatency
    )} ms`
  );


  // ==========================================================
  // 9. TEACHER AGENT
  // ==========================================================

  console.log(
    "\n👨‍🏫 Teacher Agent"
  );


  const teacherStart =
    performance.now();


  const teacher =
    await teacherAgent({
      topic: groundedTopic,
    });


  const teacherLatency =
    performance.now() -
    teacherStart;


  recordAgent(
    telemetry,
    "Teacher Agent",
    teacherLatency
  );


  console.log(
    `⏱ Teacher Agent: ${Math.round(
      teacherLatency
    )} ms`
  );


    // ==========================================================
  // 10. CURRICULUM / HALLUCINATION EVALUATION
  // ==========================================================

  console.log(
    "\n======================================"
  );

  console.log(
    "📚 CURRICULUM ALIGNMENT EVALUATION"
  );

  console.log(
    "======================================"
  );


  const evaluationText = [
    lesson?.content ?? "",
    worksheet?.content ?? "",
    quiz?.content ?? "",
    teacher?.content ?? "",
  ]
    .filter(
      (value) =>
        value.trim().length > 0
    )
    .join("\n\n");


  let curriculumEvaluation:
    Awaited<
      ReturnType<
        typeof evaluateCurriculumAlignment
      >
    > | null = null;


  try {

    /*
     * Evaluate using the same conversational
     * context used for RAG.
     */

    const evaluationQuery = [
      ...previousStudentMessages,
      request.topic,
    ]
      .filter(
        (value) =>
          value.trim().length > 0
      )
      .join("\n");


    curriculumEvaluation =
      await evaluateCurriculumAlignment(
        evaluationText,
        evaluationQuery,
        5,
        curriculum
      );


    // ========================================================
    // WRITE RESEARCH METRICS
    // ========================================================

    recordCurriculumEvaluation(
      curriculumEvaluation
    );


    // ========================================================
    // PRESERVE ACTUAL RAG COUNT
    // ========================================================

    runtimeMetrics.retrievedChunks =
      knowledge.length;

    runtimeMetrics.retrievalLatency =
      retrievalLatency;


    // ========================================================
    // LOG RESEARCH METRICS
    // ========================================================

    console.log(
      "\n======================================"
    );

    console.log(
      "📊 SRIMATHY RESEARCH METRICS"
    );

    console.log(
      "======================================"
    );

    console.log(
      "Semantic Similarity :",
      curriculumEvaluation.semanticSimilarity
    );

    console.log(
      "Topic Coverage      :",
      `${curriculumEvaluation.topicCoverage}%`
    );

    console.log(
      "Curriculum Alignment:",
      `${curriculumEvaluation.score}%`
    );

    console.log(
      "Confidence          :",
      `${curriculumEvaluation.confidence}%`
    );

    console.log(
      "Reference Chunks    :",
      curriculumEvaluation.referenceChunks
    );

    console.log(
      "Unsupported Content :",
      curriculumEvaluation.unsupportedContent
    );

    console.log(
      "Hallucination Risk  :",
      curriculumEvaluation.status
    );

    console.log(
      "======================================"
    );


  } catch (error) {

    console.error(
      "❌ Curriculum evaluation failed:",
      error
    );


    /*
     * Do NOT claim LOW hallucination when
     * the evaluator did not actually run.
     */

    runtimeMetrics.retrievedChunks =
      knowledge.length;

    runtimeMetrics.retrievalLatency =
      retrievalLatency;

    runtimeMetrics.hallucinationRisk =
      knowledge.length > 0
        ? "MEDIUM"
        : "UNKNOWN";

    runtimeMetrics.lastUpdated =
      new Date().toISOString();

  }

  // ==========================================================
  // 11. FINISH TELEMETRY
  // ==========================================================

  const finalTelemetry =
    finishRequest(
      telemetry
    );


  // ==========================================================
  // 12. WRITE LIVE TELEMETRY
  // ==========================================================

  recordTelemetry({

    id:
      finalTelemetry.requestId,

    timestamp:
      new Date().toISOString(),

    model:
      finalTelemetry.model,

    provider:
      finalTelemetry.provider,

    runtime:
      finalTelemetry.provider
        .toLowerCase()
        .includes("ollama")
        ? "offline"
        : "online",

    totalLatency:
      Math.round(
        finalTelemetry.totalLatencyMs
      ),

    agents:
      finalTelemetry.agents.map(
        (agent) => ({

          name:
            agent.agent,

          latency:
            Math.round(
              agent.latencyMs
            ),

          status:
            "success",

        })
      ),

    success:
      true,

  });


  // ==========================================================
  // 13. TELEMETRY LOGGING
  // ==========================================================

  console.log(
    "\n======================================"
  );

  console.log(
    "📊 SRIMATHY TELEMETRY"
  );

  console.log(
    "======================================"
  );


  console.log(
    "Request ID :",
    finalTelemetry.requestId
  );

  console.log(
    "Model      :",
    finalTelemetry.model
  );

  console.log(
    "Provider   :",
    finalTelemetry.provider
  );

  console.log(
    "Runtime    :",
    finalTelemetry.provider
      .toLowerCase()
      .includes("ollama")
      ? "OFFLINE"
      : "ONLINE"
  );

  console.log(
    "Total      :",
    Math.round(
      finalTelemetry.totalLatencyMs
    ),
    "ms"
  );

  console.log(
    "Retrieval  :",
    Math.round(
      retrievalLatency
    ),
    "ms"
  );

  console.log(
    "NCERT chunks:",
    knowledge.length
  );


  // ==========================================================
  // AGENT LATENCIES
  // ==========================================================

  console.log(
    "\nAgent Latencies:"
  );


  for (
    const agent
    of finalTelemetry.agents
  ) {

    console.log(
      `  ${agent.agent.padEnd(
        20
      )} ${Math.round(
        agent.latencyMs
      )} ms`
    );

  }


  // ==========================================================
  // OUTPUT SIZES
  // ==========================================================

  console.log(
    "\n=========== OUTPUT SIZES ==========="
  );


  console.log(
    "Lesson     :",
    lesson.content.length,
    "characters"
  );

  console.log(
    "Worksheet  :",
    worksheet.content.length,
    "characters"
  );

  console.log(
    "Quiz       :",
    quiz.content.length,
    "characters"
  );

  console.log(
    "Teacher    :",
    teacher.content.length,
    "characters"
  );


  console.log(
    "===================================="
  );


  // ==========================================================
  // 14. RETURN MASTER RESPONSE
  // ==========================================================

  return {

    lesson,

    worksheet,

    quiz,

    teacher,

    curriculum,


    // ========================================================
    // LIVE RUNTIME TELEMETRY
    // ========================================================

    runtime: {
      requestId: finalTelemetry.requestId,
      model: finalTelemetry.model,
      provider: finalTelemetry.provider,
      runtime:
        finalTelemetry.provider
          .toLowerCase()
          .includes("ollama")
          ? "offline"
          : "online",
      fallback:
        !finalTelemetry.provider
          .toLowerCase()
          .includes("ollama"),
      totalLatencyMs:
        Math.round(
          finalTelemetry.totalLatencyMs
        ),
    },


    // ========================================================
    // RAG RETRIEVAL INFORMATION
    // ========================================================

    retrieval: {

      chunks:
        knowledge.length,

      sources:
        knowledge.map(
          (chunk) => ({

            id:
              chunk.id,

            book:
              String(
                chunk.metadata.book ?? ""
              ),

            grade:
              String(
                chunk.metadata.grade ?? ""
              ),

            subject:
              String(
                chunk.metadata.subject ?? ""
              ),

            distance:
              chunk.distance,

          })
        ),

    },


    // ========================================================
    // RESEARCH METRICS
    // ========================================================

    research:

      curriculumEvaluation

        ? {

            semanticSimilarity:
              curriculumEvaluation
                .semanticSimilarity,

            topicCoverage:
              curriculumEvaluation
                .topicCoverage,

            curriculumAlignment:
              curriculumEvaluation
                .score,

            confidence:
              curriculumEvaluation
                .confidence,

            referenceChunks:
              curriculumEvaluation
                .referenceChunks,

            unsupportedContent:
              curriculumEvaluation
                .unsupportedContent,

            hallucinationRisk:

              curriculumEvaluation.status ===
              "GOOD"

                ? "LOW"

                : curriculumEvaluation.status ===
                  "MODERATE"

                ? "MEDIUM"

                : curriculumEvaluation.status ===
                  "LOW"

                ? "HIGH"

                : "UNKNOWN",

            status:
              curriculumEvaluation.status,

          }

        : {

            semanticSimilarity:
              0,

            topicCoverage:
              0,

            curriculumAlignment:
              0,

            /*
             * This is deliberately NOT presented as a
             * measured confidence score.
             */

            confidence:
              0,

            referenceChunks:
              knowledge.length,

            unsupportedContent:
              0,

            hallucinationRisk:
              knowledge.length > 0
                ? "MEDIUM"
                : "UNKNOWN",

            status:
              knowledge.length > 0
                ? "MODERATE"
                : "NO_REFERENCE",

          },

  };

}