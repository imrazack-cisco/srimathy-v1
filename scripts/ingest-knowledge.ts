import path from "path";
import ollama from "ollama";

import { PDFLoader } from "../lib/knowledge/loaders/pdfLoader";
import { getKnowledgeCollection } from "../lib/knowledge/vectorStore";

const EMBEDDING_MODEL = "nomic-embed-text";

const CHUNK_SIZE = 4000;
const CHUNK_OVERLAP = 400;

/**
 * Split large PDF text into embedding-safe chunks.
 */
function splitText(text: string): string[] {
    const chunks: string[] = [];

    let start = 0;

    while (start < text.length) {
        let end = Math.min(start + CHUNK_SIZE, text.length);

        // Prefer breaking at a paragraph/newline.
        if (end < text.length) {
            const newline = text.lastIndexOf("\n", end);

            if (newline > start + CHUNK_SIZE * 0.5) {
                end = newline;
            }
        }

        const chunk = text.slice(start, end).trim();

        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        if (end >= text.length) {
            break;
        }

        start = Math.max(end - CHUNK_OVERLAP, start + 1);
    }

    return chunks;
}

/**
 * Generate a 768-dimensional embedding using Ollama.
 */
async function generateEmbedding(text: string): Promise<number[]> {
    const response = await ollama.embeddings({
        model: EMBEDDING_MODEL,
        prompt: text,
    });

    return response.embedding;
}

async function main() {
    console.log("🚀 SRIMATHY Knowledge Ingestion\n");

    // --------------------------------------------------
    // 1. Locate PDF
    // --------------------------------------------------

    const pdfPath = path.join(
        process.cwd(),
        "knowledge",
        "books",
        "eeev101.pdf"
    );

    console.log(`📄 Loading: ${pdfPath}`);

    // --------------------------------------------------
    // 2. Load PDF
    // --------------------------------------------------

    const loader = new PDFLoader();

    const documents = await loader.load(pdfPath);

    console.log(`✅ Documents loaded: ${documents.length}`);

    if (documents.length === 0) {
        console.log("⚠️ No documents found.");
        return;
    }

    // --------------------------------------------------
    // 3. Connect to ChromaDB
    // --------------------------------------------------

    console.log("\n🔌 Connecting to ChromaDB...");

    const collection = await getKnowledgeCollection();

    console.log(`✅ Collection: ${collection.name}`);

    // --------------------------------------------------
    // 4. Process documents
    // --------------------------------------------------

    let totalChunks = 0;

    for (const document of documents) {
        console.log(`\n📚 Processing: ${document.title}`);

        const text = document.content.trim();

        if (!text) {
            console.log("⚠️ Empty document — skipping.");
            continue;
        }

        console.log(`📏 Document characters: ${text.length}`);

        // --------------------------------------------------
        // 5. Split document
        // --------------------------------------------------

        const chunks = splitText(text);

        console.log(`✂️ Created ${chunks.length} chunks`);

        // --------------------------------------------------
        // 6. Generate embeddings + store
        // --------------------------------------------------

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            console.log(
                `\n[${i + 1}/${chunks.length}] 🧠 Generating embedding...`
            );

            console.log(`   Characters: ${chunk.length}`);

            try {
                const embedding = await generateEmbedding(chunk);

                console.log(
                    `   ✅ Embedding generated: ${embedding.length} dimensions`
                );

                // Unique ID for each chunk.
                const id = `${document.id}-chunk-${i}`;

                // --------------------------------------------------
                // Metadata
                // --------------------------------------------------

                const fileName = path.basename(document.source);

                const pageCount =
                    typeof document.metadata?.pageCount === "number"
                        ? document.metadata.pageCount
                        : 0;

                await collection.upsert({
                    ids: [id],

                    documents: [chunk],

                    embeddings: [embedding],

                    metadatas: [
                        {
                            source: document.source,
                            fileName,
                            loader: "pdf",
                            pageCount,
                            chunkNumber: i,
                        },
                    ],
                });

                totalChunks++;

                console.log(`   💾 Stored: ${id}`);
            } catch (error) {
                console.error(
                    `   ❌ Failed to process chunk ${i}:`
                );

                console.error(error);

                throw error;
            }
        }
    }

    // --------------------------------------------------
    // 7. Verify ChromaDB
    // --------------------------------------------------

    const count = await collection.count();

    // --------------------------------------------------
    // 8. Final report
    // --------------------------------------------------

    console.log("\n================================");
    console.log("🎉 INGESTION COMPLETE");
    console.log("================================");

    console.log(`Documents processed : ${documents.length}`);
    console.log(`Vectors inserted    : ${totalChunks}`);
    console.log(`Chroma total        : ${count}`);
    console.log(`Embedding model     : ${EMBEDDING_MODEL}`);
    console.log(`Embedding dimension : 768`);
    console.log(`Chunk size          : ${CHUNK_SIZE}`);
    console.log(`Chunk overlap       : ${CHUNK_OVERLAP}`);

    console.log("\n✅ SRIMATHY knowledge is now in ChromaDB.");
}

main().catch((error) => {
    console.error("\n❌ Ingestion failed:");
    console.error(error);
    process.exit(1);
});