import ollama from "ollama";

async function main() {
    console.log("Generating embedding...\n");

    const response = await ollama.embeddings({
        model: "nomic-embed-text",
        prompt: "Artificial Intelligence is transforming education."
    });

    console.log("Embedding dimensions:", response.embedding.length);

    console.log("\nFirst 10 values:\n");

    console.log(response.embedding.slice(0, 10));
}

main().catch(console.error);