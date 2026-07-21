import { PDFLoader } from "../lib/knowledge/loaders/pdfLoader";

async function main() {

    const loader = new PDFLoader();

    const docs = await loader.load(

        "knowledge/books/eeev101.pdf"

    );

    console.log(docs);

}

main();