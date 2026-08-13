import { getKnowledgeCollection } from "../lib/knowledge/vectorStore";

async function main() {
    console.log("Connecting to ChromaDB...");

    const collection = await getKnowledgeCollection();

    console.log("Collection created/found:");
    console.log("Name:", collection.name);

    const count = await collection.count();

    console.log("Current documents:", count);
}

main().catch((error) => {
    console.error("Vector store test failed:");
    console.error(error);
    process.exit(1);
});