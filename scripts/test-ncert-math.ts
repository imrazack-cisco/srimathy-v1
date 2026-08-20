import "dotenv/config";
import ollama from "ollama";

import {
  getKnowledgeCollection,
} from "../lib/knowledge/vectorStore";

async function main() {

  const query =
    "Equivalent fractions Grade 5 Mathematics";

  console.log("");
  console.log("======================================");
  console.log("   NCERT MATHEMATICS RETRIEVAL TEST");
  console.log("======================================");
  console.log("");
  console.log("Query:", query);

  console.log("");
  console.log("🧠 Generating query embedding...");

  const embedding =
    await ollama.embeddings({
      model:
        process.env.OLLAMA_EMBEDDING_MODEL ??
        "nomic-embed-text",
      prompt: query,
    });

  console.log(
    "Embedding dimensions:",
    embedding.embedding.length
  );

  console.log("");
  console.log("🔍 Searching ChromaDB...");

  const collection =
    await getKnowledgeCollection();

  const results =
    await collection.query({

      queryEmbeddings: [
        embedding.embedding,
      ],

      nResults: 5,

      include: [
        "documents",
        "metadatas",
        "distances",
      ],

    });


  const ids =
    results.ids?.[0] ?? [];

  const documents =
    results.documents?.[0] ?? [];

  const metadatas =
    results.metadatas?.[0] ?? [];

  const distances =
    results.distances?.[0] ?? [];


  console.log("");
  console.log("======================================");
  console.log("             RESULTS");
  console.log("======================================");


  for (
    let i = 0;
    i < ids.length;
    i++
  ) {

    console.log("");
    console.log(
      `--- Result ${i + 1} ---`
    );

    console.log(
      "Distance:",
      distances[i]
    );

    console.log(
      "Metadata:",
      metadatas[i]
    );

    console.log(
      "Document:"
    );

    console.log(
      (documents[i] ?? "")
        .slice(0, 700)
    );

  }


  console.log("");
  console.log("======================================");
  console.log(
    "Retrieved:",
    ids.length
  );
  console.log("======================================");
}


main().catch(
  error => {

    console.error("");
    console.error(
      "❌ NCERT retrieval test failed"
    );

    console.error(error);

    process.exit(1);

  }
);
