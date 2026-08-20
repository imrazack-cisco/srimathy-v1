import { PDFLoader } from "../lib/knowledge/loaders/pdfLoader";

async function main() {

  const file =
    "knowledge/ncert/class5/mathematics/ganita-prakash.pdf";

  const loader =
    new PDFLoader();

  const documents =
    await loader.load(file);

  const text =
    documents[0]?.content ?? "";

  console.log("");
  console.log("======================================");
  console.log("       NCERT DOCUMENT INSPECTION");
  console.log("======================================");

  console.log("");
  console.log(text.slice(0, 5000));

  console.log("");
  console.log("======================================");
  console.log("Metadata");
  console.log("======================================");

  console.log(documents[0]?.metadata);

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});
