import ollama from "ollama";
import { getKnowledgeCollection } from "../lib/knowledge/vectorStore";

async function generateEmbedding(text: string): Promise<number[]> {
    const response = await ollama.embeddings({
        model: "nomic-embed-text",
        prompt: text,
    });

    return response.embedding;
}

async function main() {
    console.log("🔎 SRIMATHY Semantic Search Test\n");

    const collection = await getKnowledgeCollection();

    const query =
        "How does water move between the atmosphere, land, and oceans?";

    console.log("❓ Query:");
    console.log(query);

    console.log("\n🧠 Generating query embedding...");

    const queryEmbedding = await generateEmbedding(query);

    console.log(
        `✅ Query embedding generated: ${queryEmbedding.length} dimensions`
    );

    console.log("\n🔍 Searching ChromaDB...");

    const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: 3,
        include: ["documents", "metadatas", "distances"],
    });

    console.log("\n📚 Results:\n");

    const documents = results.documents?.[0] ?? [];
    const distances = results.distances?.[0] ?? [];
    const metadatas = results.metadatas?.[0] ?? [];

    documents.forEach((document, index) => {
        console.log(`--- Result ${index + 1} ---`);

        console.log("Distance:", distances[index]);

        console.log("Metadata:", metadatas[index]);

        console.log("Document:");
        console.log(document);

        console.log();
    });

    if (documents.length > 0) {
        console.log("✅ Semantic retrieval successful!");
    } else {
        console.log("⚠️ No documents retrieved.");
    }
}

main().catch((error) => {
    console.error("\n❌ Semantic search failed:");
    console.error(error);
    process.exit(1);
});