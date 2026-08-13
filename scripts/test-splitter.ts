import { PDFLoader } from "../knowledge/loaders/pdfLoader";
import { RecursiveSplitter } from "../knowledge/splitters/recursiveSplitter";

async function main() {

    const loader = new PDFLoader();

    const docs = await loader.load(

        "./knowledge/books/eeev101.pdf"

    );

    const splitter = new RecursiveSplitter();

    const chunks = splitter.split(docs[0]);

    console.log("Document");

    console.log(docs[0].title);

    console.log("");

    console.log("Chunks Created");

    console.log(chunks.length);

    console.log("");

    console.log("First Chunk");

    console.log(chunks[0].content.substring(0,300));

}

main();