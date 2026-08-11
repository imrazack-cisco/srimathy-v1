import { PDFLoader } from "../lib/knowledge/loaders/pdfLoader";
import { RecursiveSplitter } from "../lib/knowledge/splitters/recursiveSplitter";
import { OllamaEmbeddingService } from "../lib/knowledge/embeddings/ollamaEmbedding";

async function main() {

    console.log("");

    console.log("==================================");

    console.log("SRIMATHY Knowledge Engine");

    console.log("==================================");

    const loader = new PDFLoader();

    const docs = await loader.load(

        "knowledge/books/eeev101.pdf"

    );

    const splitter = new RecursiveSplitter();

    const chunks = await splitter.split(docs[0]);

    console.log("");

    console.log("Chunks:", chunks.length);

    const embeddingService = new OllamaEmbeddingService();

    const embedding = await embeddingService.embed(chunks[0]);

    console.log("");

    console.log("Embedding Dimension:", embedding.dimension);

    console.log("");

    console.log("First 10 Values");

    console.log(

        embedding.vector.slice(0,10)

    );

}

main();