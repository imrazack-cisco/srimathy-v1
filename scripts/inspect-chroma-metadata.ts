import { getKnowledgeCollection } from "../lib/knowledge/vectordb/chroma";

async function main() {
  const collection = await getKnowledgeCollection();

  const result = await collection.get({
    limit: 50,
    include: ["metadatas"],
  });

  console.log("");
  console.log("======================================");
  console.log("CHROMA METADATA INSPECTION");
  console.log("======================================");

  console.log("Collection:", collection.name);
  console.log("Records:", result.ids.length);

  const grades = new Set<string>();
  const subjects = new Set<string>();

  for (const metadata of result.metadatas ?? []) {
    if (metadata?.grade !== undefined) {
      grades.add(String(metadata.grade));
    }

    if (metadata?.subject !== undefined) {
      subjects.add(String(metadata.subject));
    }
  }

  console.log("");
  console.log("GRADES FOUND");
  console.log("--------------------------------------");

  for (const grade of grades) {
    console.log("-", grade);
  }

  console.log("");
  console.log("SUBJECTS FOUND");
  console.log("--------------------------------------");

  for (const subject of subjects) {
    console.log("-", subject);
  }

  console.log("");
  console.log("SAMPLE METADATA");
  console.log("--------------------------------------");

  for (
    const metadata of
    (result.metadatas ?? []).slice(0, 10)
  ) {
    console.log(
      JSON.stringify(metadata, null, 2)
    );
  }

  console.log("");
  console.log("======================================");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
