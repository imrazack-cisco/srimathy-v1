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
    console.log("🚀 SRIMATHY Vector Insert Test\n");

    const collection = await getKnowledgeCollection();

    const text =
        "The water cycle describes how water moves continuously between the atmosphere, land, oceans, and living organisms.";

    console.log("📝 Text:");
    console.log(text);

    console.log("\n🧠 Generating embedding...");

    const embedding = await generateEmbedding(text);

    console.log(`✅ Embedding generated`);
    console.log(`Dimensions: ${embedding.length}`);

    const id = "test-water-cycle-001";

    console.log("\n💾 Storing in ChromaDB...");

    await collection.upsert({
        ids: [id],
        documents: [text],
        embeddings: [embedding],
        metadatas: [
            {
                source: "SRIMATHY vector test",
                subject: "Science",
                topic: "Water Cycle",
            },
        ],
    });

    console.log("✅ Vector stored!");

    const count = await collection.count();

    console.log(`\n📊 Collection document count: ${count}`);
}

main().catch((error) => {
    console.error("\n❌ Vector insert failed:");
    console.error(error);
    process.exit(1);
});