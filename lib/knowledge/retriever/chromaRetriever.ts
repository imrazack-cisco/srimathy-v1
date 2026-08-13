import ollama from "ollama";

import { getKnowledgeCollection } from "../vectorStore";

const EMBEDDING_MODEL =
    process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";

export interface RetrievedChunk {
    id: string;
    text: string;
    distance: number;
    metadata: Record<string, unknown>;
}

async function generateQueryEmbedding(
    query: string
): Promise<number[]> {
    const response = await ollama.embeddings({
        model: EMBEDDING_MODEL,
        prompt: query,
    });

    return response.embedding;
}

export async function retrieveKnowledge(
    query: string,
    topK: number = 5
): Promise<RetrievedChunk[]> {

    console.log("🔎 RAG Query:", query);

    const embedding = await generateQueryEmbedding(query);

    console.log(
        `🧠 Query embedding: ${embedding.length} dimensions`
    );

    const collection = await getKnowledgeCollection();

    const results = await collection.query({
        queryEmbeddings: [embedding],
        nResults: topK,
        include: [
            "documents",
            "metadatas",
            "distances",
        ],
    });

    const ids = results.ids?.[0] ?? [];
    const documents = results.documents?.[0] ?? [];
    const metadatas = results.metadatas?.[0] ?? [];
    const distances = results.distances?.[0] ?? [];

    const chunks: RetrievedChunk[] = [];

    for (let i = 0; i < ids.length; i++) {
        chunks.push({
            id: ids[i],
            text: documents[i] ?? "",
            distance: distances[i] ?? 0,
            metadata: metadatas[i] ?? {},
        });
    }

    console.log(
        `📚 Retrieved ${chunks.length} knowledge chunks`
    );

    return chunks;
}