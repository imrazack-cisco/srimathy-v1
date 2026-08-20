import { ChromaClient, Collection } from "chromadb";

const CHROMA_URL = "http://localhost:8000";

const COLLECTION_NAME = "srimathy_knowledge";

let client: ChromaClient | null = null;

export function getChromaClient(): ChromaClient {
    if (!client) {
        client = new ChromaClient({
            path: CHROMA_URL,
        });
    }

    return client;
}

export async function getKnowledgeCollection(): Promise<Collection> {
    const chroma = getChromaClient();

    const collection = await chroma.getOrCreateCollection({
        name: COLLECTION_NAME,
        metadata: {
            description: "SRIMATHY local knowledge base",
            embedding_dimension: 768,
        },
    });

    return collection;
}