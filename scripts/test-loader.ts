import { PDFLoader } from "../lib/knowledge/loaders/pdfLoader";
import { RecursiveSplitter } from "../lib/knowledge/splitters/recursiveSplitter";

async function main() {

    console.log("");
    console.log("======================================");
    console.log(" SRIMATHY Knowledge Engine");
    console.log("======================================");
    console.log("");

    const loader = new PDFLoader();

    const documents = await loader.load(
        "knowledge/books/eeev101.pdf"
    );

    const splitter = new RecursiveSplitter();

    const chunks = await splitter.split(documents[0]);

    console.log("Documents :", documents.length);
    console.log("Chunks    :", chunks.length);

    console.log("");

    console.log("First Chunk");

    console.log("--------------------------------");

    console.log(chunks[0].text);

    console.log("--------------------------------");

    console.log("");

    console.log("Chunk Size :", chunks[0].metadata.chunkSize);

}

main();