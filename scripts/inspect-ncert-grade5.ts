import { getKnowledgeCollection } from "../lib/knowledge/vectordb/chroma";

async function main() {
  const collection = await getKnowledgeCollection();

  const result = await collection.get({
    limit: 200,
    include: ["metadatas", "documents"],
  });

  console.log("");
  console.log("======================================");
  console.log("NCERT GRADE 5 INSPECTION");
  console.log("======================================");

  let count = 0;

  for (let i = 0; i < result.ids.length; i++) {
    const metadata = result.metadatas?.[i];

    if (
      metadata?.grade === "5" &&
      metadata?.subject === "Mathematics" &&
      metadata?.board === "NCERT"
    ) {
      count++;

      console.log("");
      console.log(`RECORD ${count}`);
      console.log("--------------------------------------");

      console.log(
        "ID:",
        result.ids[i]
      );

      console.log(
        "Grade:",
        metadata.grade
      );

      console.log(
        "Subject:",
        metadata.subject
      );

      console.log(
        "Board:",
        metadata.board
      );

      console.log(
        "Book:",
        metadata.book
      );

      console.log(
        "Source:",
        metadata.source
      );

      console.log(
        "Chunk:",
        metadata.chunkNumber
      );

      const document =
        result.documents?.[i] ?? "";

      console.log("");
      console.log(
        "TEXT:",
        document.slice(0, 500).replace(/\s+/g, " ")
      );
    }
  }

  console.log("");
  console.log("======================================");
  console.log(
    "GRADE 5 NCERT MATHEMATICS RECORDS:",
    count
  );
  console.log("======================================");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
