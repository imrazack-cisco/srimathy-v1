import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";

import {
    retrieveKnowledge,
} from "@/lib/knowledge/retriever/chromaRetriever";

const CHAT_MODEL =
    process.env.OLLAMA_CHAT_MODEL || "gemma4:26b";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const question =
            typeof body.question === "string"
                ? body.question.trim()
                : "";

        if (!question) {
            return NextResponse.json(
                {
                    error: "Question is required.",
                },
                {
                    status: 400,
                }
            );
        }

        console.log("\n================================");
        console.log("🤖 SRIMATHY RAG REQUEST");
        console.log("================================");
        console.log("Question:", question);

        // -----------------------------------------
        // 1. Retrieve knowledge
        // -----------------------------------------

        const sources = await retrieveKnowledge(
            question,
            5
        );

        if (sources.length === 0) {
            return NextResponse.json({
                answer:
                    "I couldn't find relevant information in the SRIMATHY knowledge base.",
                sources: [],
                model: CHAT_MODEL,
            });
        }

        // -----------------------------------------
        // 2. Build RAG context
        // -----------------------------------------

        const context = sources
            .map((source, index) => {
                const metadata = source.metadata;

                return `
SOURCE ${index + 1}

File: ${metadata.fileName ?? "Unknown"}
Chunk: ${metadata.chunkNumber ?? "Unknown"}

Content:
${source.text}
`;
            })
            .join("\n------------------------\n");

        // -----------------------------------------
        // 3. Prompt the LLM
        // -----------------------------------------

        const systemPrompt = `
You are SRIMATHY, an AI educational assistant.

Answer the student's question using ONLY the knowledge provided
in the CONTEXT below.

Rules:

1. Prefer information from the provided context.
2. Do not invent textbook facts.
3. If the context does not contain enough information, clearly say so.
4. Explain concepts in a student-friendly way.
5. Keep the answer structured and concise.
6. Do not mention internal implementation details.
7. Do not claim to have read information that is not in the context.

CONTEXT:

${context}
`;

        console.log("🧠 Generating answer with:", CHAT_MODEL);

        // -----------------------------------------
        // 4. Generate answer
        // -----------------------------------------

        const response = await ollama.chat({
            model: CHAT_MODEL,

            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: question,
                },
            ],
        });

        const answer =
            response.message?.content ||
            "I was unable to generate an answer.";

        console.log("✅ RAG answer generated");

        // -----------------------------------------
        // 5. Return answer + evidence
        // -----------------------------------------

        return NextResponse.json({
            answer,

            model: CHAT_MODEL,

            embeddingModel:
                process.env.OLLAMA_EMBEDDING_MODEL ||
                "nomic-embed-text",

            sources: sources.map((source) => ({
                id: source.id,
                distance: source.distance,
                fileName:
                    source.metadata.fileName ??
                    "Unknown",
                chunkNumber:
                    source.metadata.chunkNumber ??
                    null,
                source:
                    source.metadata.source ??
                    null,
            })),
        });

    } catch (error) {
        console.error("❌ RAG API error:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "RAG request failed.",
            },
            {
                status: 500,
            }
        );
    }
}