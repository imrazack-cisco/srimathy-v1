import { getKnowledgeCollection } from "../lib/knowledge/vectorStore";

async function main() {

  const collection =
    await getKnowledgeCollection();

  console.log("");
  console.log("======================================");
  console.log(" FIX NCERT GRADE 7 METADATA");
  console.log("======================================");

  /*
   * These vectors were created by the first NCERT ingestion
   * when the Grade 7 Ganita Prakash PDF was incorrectly placed
   * under class5.
   *
   * Their IDs therefore begin with:
   *
   * ncert-5-mathematics-ganita-prakash-
   */

  const results =
    await collection.get({
      include: ["metadatas"],
    });

  const allIds =
    results.ids ?? [];

  const allMetadatas =
    results.metadatas ?? [];

  const targetIndexes =
    allIds
      .map((id, index) => ({
        id,
        index,
      }))
      .filter(item =>
        item.id.startsWith(
          "ncert-5-mathematics-ganita-prakash-"
        )
      );

  console.log(
    "Potential Grade 7 vectors:",
    targetIndexes.length
  );

  if (
    targetIndexes.length === 0
  ) {

    console.log(
      "No matching vectors found."
    );

    return;
  }

  const ids =
    targetIndexes.map(
      item => item.id
    );

  const metadatas =
    targetIndexes.map(
      item => ({
        ...(allMetadatas[item.index] ?? {}),

        board: "NCERT",

        grade: "7",

        subject: "Mathematics",

        book: "Ganita Prakash",

        sourceType: "official-ncert",

      })
    );

  console.log("");
  console.log("Updating:");

  for (const id of ids) {
    console.log("  ", id);
  }

  await collection.update({
    ids,
    metadatas,
  });

  console.log("");
  console.log("======================================");
  console.log("✅ METADATA CORRECTED");
  console.log("======================================");

  console.log(
    "Grade: 5 → 7"
  );

  console.log(
    "Subject: Mathematics"
  );

  console.log(
    "Book: Ganita Prakash"
  );

  console.log(
    "Chroma total:",
    await collection.count()
  );

}

main().catch(error => {

  console.error("");
  console.error(
    "❌ Metadata correction failed:"
  );

  console.error(error);

  process.exit(1);

});
