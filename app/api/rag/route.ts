import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";
import ollama from "ollama";

const CHROMA_HOST = "localhost";
const CHROMA_PORT = 8000;

const COLLECTION_NAME = "srimathy_knowledge";

const EMBEDDING_MODEL = "nomic-embed-text:latest";
const CHAT_MODEL = "gemma3:4b";

export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // 1. Read request
    // --------------------------------------------------

    const body = await request.json();

    const query =
      typeof body?.query === "string"
        ? body.query.trim()
        : "";

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
    console.log("🔎 SRIMATHY RAG QUERY");
    console.log("======================================");
    console.log("Query:", query);

    // --------------------------------------------------
    // 2. Generate query embedding
    // --------------------------------------------------

    console.log("");
    console.log("🧠 Generating query embedding...");

    const embeddingResponse = await ollama.embeddings({
      model: EMBEDDING_MODEL,
      prompt: query,
    });

    const queryEmbedding = embeddingResponse.embedding;

    console.log(
      "✅ Query embedding generated:",
      queryEmbedding.length,
      "dimensions"
    );

    // --------------------------------------------------
    // 3. Connect to ChromaDB
    // --------------------------------------------------

    console.log("");
    console.log("🔌 Connecting to ChromaDB...");

    const chroma = new ChromaClient({
      host: CHROMA_HOST,
      port: CHROMA_PORT,
      ssl: false,
    });

    console.log("✅ ChromaDB connected");

    // --------------------------------------------------
    // 4. Get SRIMATHY knowledge collection
    // --------------------------------------------------

    console.log("");
    console.log(
      `📚 Opening collection: ${COLLECTION_NAME}`
    );

    const collection = await chroma.getCollection({
      name: COLLECTION_NAME,
    });

    console.log(
      "✅ Collection opened:",
      collection.name
    );

    // --------------------------------------------------
    // 5. Semantic search
    // --------------------------------------------------

    console.log("");
    console.log("🔍 Searching knowledge base...");

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 5,
    });

    const documents = results.documents?.[0] ?? [];
    const metadatas = results.metadatas?.[0] ?? [];
    const distances = results.distances?.[0] ?? [];

    console.log(
      `✅ Retrieved ${documents.length} knowledge chunks`
    );

    // --------------------------------------------------
    // 6. No results
    // --------------------------------------------------

    if (documents.length === 0) {
      console.log(
        "⚠️ No relevant knowledge found"
      );

      return NextResponse.json({
        answer:
          "I couldn't find relevant information in the SRIMATHY knowledge base.",
        sources: [],
        model: CHAT_MODEL,
        embeddingModel: EMBEDDING_MODEL,
        retrievedChunks: 0,
      });
    }

    // --------------------------------------------------
    // 7. Build context for Gemma
    // --------------------------------------------------

    console.log("");
    console.log(
      "🧩 Building knowledge context..."
    );

    const context = documents
      .map((document, index) => {
        const text = document ?? "";
        const metadata = metadatas[index] ?? {};

        return `
SOURCE ${index + 1}

Document:
${text}

Metadata:
${JSON.stringify(metadata)}
`;
      })
      .join("\n");

    // --------------------------------------------------
    // 8. Build RAG prompt
    // --------------------------------------------------

    const prompt = `
You are SRIMATHY, an AI educational assistant.

Your task is to answer the student's question using ONLY
the knowledge retrieved from the SRIMATHY knowledge base.

IMPORTANT RULES:

1. Use only the supplied knowledge context.
2. Do not invent facts.
3. Do not use outside knowledge.
4. If the answer is not supported by the context, say:
   "I couldn't find that information in the SRIMATHY knowledge base."
5. Explain the answer clearly and simply for a student.
6. Do not mention internal implementation details unless asked.

Student question:

${query}

----------------------------------------
SRIMATHY KNOWLEDGE CONTEXT
----------------------------------------

${context}

----------------------------------------
END KNOWLEDGE CONTEXT
----------------------------------------

Now provide the best answer supported by the knowledge base.
`;

    // --------------------------------------------------
    // 9. Generate answer using Gemma
    // --------------------------------------------------

    console.log("");
    console.log(
      `🤖 Generating answer with ${CHAT_MODEL}...`
    );

    const response = await ollama.generate({
      model: CHAT_MODEL,
      prompt,
      stream: false,
    });

    const answer =
      response.response?.trim() ||
      "I couldn't generate an answer.";

    console.log("✅ Answer generated");

    // --------------------------------------------------
    // 10. Format sources
    // --------------------------------------------------

    console.log("");
    console.log("📚 Formatting sources...");

    const sources = documents.map(
      (document, index) => ({
        document: (document ?? "").slice(0, 300),

        metadata:
          metadatas[index] ?? {},

        distance:
          distances[index] ?? null,
      })
    );

    // --------------------------------------------------
    // 11. Return response
    // --------------------------------------------------

    console.log("");
    console.log("======================================");
    console.log("✅ SRIMATHY RAG RESPONSE READY");
    console.log("======================================");
    console.log(
      "Embedding model:",
      EMBEDDING_MODEL
    );
    console.log(
      "Chat model:",
      CHAT_MODEL
    );
    console.log(
      "Retrieved chunks:",
      documents.length
    );
    console.log("");

    return NextResponse.json({
      answer,

      sources,

      model: CHAT_MODEL,

      embeddingModel: EMBEDDING_MODEL,

      retrievedChunks: documents.length,
    });
  } catch (error) {
    // --------------------------------------------------
    // Error handling
    // --------------------------------------------------

    console.error("");
    console.error("======================================");
    console.error("❌ SRIMATHY RAG ERROR");
    console.error("======================================");
    console.error(error);
    console.error("");

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