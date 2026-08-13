import { ChromaClient } from "chromadb";

async function main() {
    console.log("🔄 Connecting to ChromaDB...");

    const client = new ChromaClient({
        host: "localhost",
        port: 8000,
        ssl: false,
    });

    const collectionName = "srimathy_knowledge";

    console.log(`🗑️ Deleting existing collection: ${collectionName}`);

    try {
        await client.deleteCollection({
            name: collectionName,
        });

        console.log("✅ Existing collection deleted.");
    } catch (error) {
        console.log("ℹ️ Collection did not exist or was already deleted.");
    }

    console.log("📦 Creating clean collection...");

    const collection = await client.createCollection({
        name: collectionName,

        embeddingFunction: null,

        metadata: {
            description: "SRIMATHY educational knowledge base",
            embedding_dimension: 768,
        },
    });

    console.log("✅ Collection created successfully.");
    console.log("Name:", collection.name);
    console.log("Documents:", await collection.count());
}

main().catch((error) => {
    console.error("❌ Reset failed:");
    console.error(error);
    process.exit(1);
});