import { PDFLoader } from "../lib/knowledge/loaders/docxLoader";

import {
  RecursiveSplitter,
} from "../knowledge/recursiveSplitter";

async function main() {

  const loader =
    new PDFLoader();

  const docs =
    await loader.load(
      "./knowledge/books/eeev101.pdf"
    );

  if (!docs.length) {

    throw new Error(
      "No documents were loaded."
    );
  }

  const splitter =
    new RecursiveSplitter();

  const chunks =
    splitter.split(
      docs[0]
    );

  console.log(
    "Document"
  );

  console.log(
    docs[0].title
  );

  console.log("");

  console.log(
    "Chunks Created"
  );

  console.log(
    chunks.length
  );

  console.log("");

  console.log(
    "First Chunk"
  );

  console.log(
    chunks[0]?.content
      .substring(0, 300)
  );
}

main().catch(
  (
    error
  ) => {

    console.error(
      "Splitter test failed:"
    );

    console.error(error);

    process.exit(1);
  }
);
