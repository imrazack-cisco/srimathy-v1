import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";

import {
    retrieveKnowledge,
} from "../../../lib/knowledge/retriever/chromaRetriever";

const CHAT_MODEL =
    process.env.OLLAMA_CHAT_MODEL || "gemma3:4b";

export async function POST(
    request: NextRequest
) {
    const totalStart = Date.now();

    try {

        // --------------------------------------------------
        // 1. Read request
        // --------------------------------------------------

        const body = await request.json();

        const query =
            typeof body?.query === "string"
                ? body.query.trim()
                : "";

        const grade =
            typeof body?.grade === "string"
                ? body.grade.trim()
                : undefined;

        const subject =
            typeof body?.subject === "string"
                ? body.subject.trim()
                : undefined;

        const board =
            typeof body?.board === "string"
                ? body.board.trim()
                : undefined;

        const book =
            typeof body?.book === "string"
                ? body.book.trim()
                : undefined;

        if (!query) {

            return NextResponse.json(
                {
                    error: "Query is required",
                },
                {
                    status: 400,
                }
            );
        }

        console.log("");
        console.log("======================================");
        console.log("🚀 SRIMATHY RAG REQUEST");
        console.log("======================================");

        console.log("Query:", query);

        console.log(
            "Curriculum:",
            {
                grade,
                subject,
                board,
                book,
            }
        );

        // --------------------------------------------------
        // 2. Curriculum-aware retrieval
        // --------------------------------------------------

        const retrievalStart =
            Date.now();

        const chunks =
            await retrieveKnowledge(
                query,
                5,
                {
                    grade,
                    subject,
                    board,
                    book,
                }
            );

        const retrievalDuration =
            Date.now() - retrievalStart;

        console.log(
            `⏱ Retrieval: ${retrievalDuration} ms`
        );

        // --------------------------------------------------
        // 3. No knowledge found
        // --------------------------------------------------

        if (chunks.length === 0) {

            const totalDuration =
                Date.now() - totalStart;

            console.log(
                "⚠️ No useful knowledge retrieved"
            );

            return NextResponse.json({

                answer:
                    "I couldn't find relevant information in the SRIMATHY knowledge base.",

                sources: [],

                model: CHAT_MODEL,

                embeddingModel:
                    process.env.OLLAMA_EMBEDDING_MODEL ||
                    "nomic-embed-text",

                retrievedChunks: 0,

                curriculum: {
                    grade,
                    subject,
                    board,
                    book,
                },

                metrics: {
                    retrievalDuration,
                    totalDuration,
                },
            });
        }

        // --------------------------------------------------
        // 4. Build knowledge context
        // --------------------------------------------------

        console.log("");
        console.log(
            "🧩 Building knowledge context..."
        );

        const context =
            chunks
                .map(
                    (chunk, index) => {

                        return `
==============================
SOURCE ${index + 1}
==============================

${chunk.text}

SOURCE METADATA:
${JSON.stringify(
    chunk.metadata,
    null,
    2
)}
`;
                    }
                )
                .join("\n");

        // --------------------------------------------------
        // 5. Curriculum-aware prompt
        // --------------------------------------------------

        const prompt = `
You are SRIMATHY, an AI educational assistant.

You are helping a student learn according to their
specified school curriculum.

CURRICULUM

Grade: ${grade ?? "Not specified"}
Subject: ${subject ?? "Not specified"}
Board: ${board ?? "Not specified"}
Book: ${book ?? "Not specified"}

IMPORTANT RULES:

1. Answer using ONLY the supplied SRIMATHY knowledge context.

2. Do not invent textbook facts.

3. Do not use outside knowledge when answering
   curriculum-specific questions.

4. Prefer the knowledge that matches the student's
   grade, subject and board.

5. Explain concepts clearly and appropriately for
   the student's grade level.

6. Use simple examples when the retrieved material
   supports them.

7. If the supplied context does not contain enough
   information to answer the question, say:

   "I couldn't find that information in the
   SRIMATHY knowledge base."

8. Do not mention ChromaDB, embeddings, vectors,
   retrieval, prompts or other internal implementation
   details unless the user explicitly asks.

9. Do not claim that something is in the textbook
   unless it is supported by the supplied context.

STUDENT QUESTION

${query}

========================================
SRIMATHY KNOWLEDGE CONTEXT
========================================

${context}

========================================
END KNOWLEDGE CONTEXT
========================================

Now answer the student's question.
`;

        // --------------------------------------------------
        // 6. Generate answer
        // --------------------------------------------------

        console.log("");
        console.log(
            `🤖 Generating with ${CHAT_MODEL}...`
        );

        const ollamaStart =
            Date.now();

        const response =
            await ollama.generate({
                model: CHAT_MODEL,
                prompt,
                stream: false,
            });

        const ollamaDuration =
            Date.now() - ollamaStart;

        const answer =
            response.response?.trim() ||
            "I couldn't generate an answer.";

        console.log(
            `✅ Answer generated in ${ollamaDuration} ms`
        );

        // --------------------------------------------------
        // 7. Format sources
        // --------------------------------------------------

        const sources =
            chunks.map(
                (chunk) => ({
                    id: chunk.id,

                    document:
                        chunk.text.slice(0, 400),

                    metadata:
                        chunk.metadata,

                    distance:
                        chunk.distance,
                })
            );

        // --------------------------------------------------
        // 8. Metrics
        // --------------------------------------------------

        const totalDuration =
            Date.now() - totalStart;

        const ollamaMetrics =
            response as any;

        const metrics = {
            retrievalDuration,
            ollamaDuration,
            totalDuration,

            ollama: {
                totalDuration:
                    ollamaMetrics.total_duration ?? null,

                loadDuration:
                    ollamaMetrics.load_duration ?? null,

                promptEvalCount:
                    ollamaMetrics.prompt_eval_count ?? null,

                promptEvalDuration:
                    ollamaMetrics.prompt_eval_duration ?? null,

                evalCount:
                    ollamaMetrics.eval_count ?? null,

                evalDuration:
                    ollamaMetrics.eval_duration ?? null,

                tokensPerSecond:
                    ollamaMetrics.eval_count &&
                    ollamaMetrics.eval_duration
                        ? (
                            ollamaMetrics.eval_count /
                            (ollamaMetrics.eval_duration / 1e9)
                        )
                        : null,
            },
        };

        // --------------------------------------------------
        // 9. Final response
        // --------------------------------------------------

        console.log("");
        console.log("======================================");
        console.log("🎉 SRIMATHY RAG COMPLETE");
        console.log("======================================");

        console.log(
            "Retrieved chunks:",
            chunks.length
        );

        console.log(
            "Chat model:",
            CHAT_MODEL
        );

        console.log(
            "Total duration:",
            totalDuration,
            "ms"
        );

        return NextResponse.json({

            answer,

            sources,

            model:
                CHAT_MODEL,

            embeddingModel:
                process.env.OLLAMA_EMBEDDING_MODEL ||
                "nomic-embed-text",

            retrievedChunks:
                chunks.length,

            curriculum: {
                grade,
                subject,
                board,
                book,
            },

            metrics,
        });

    } catch (error) {

        console.error("");
        console.error("======================================");
        console.error("❌ SRIMATHY RAG ERROR");
        console.error("======================================");

        console.error(error);

        const message =
            error instanceof Error
                ? error.message
                : "RAG request failed";

        return NextResponse.json(
            {
                error: message,
            },
            {
                status: 500,
            }
        );
    }
}