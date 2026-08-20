import ollama from "ollama";
import { getKnowledgeCollection } from "../lib/knowledge/vectorStore";

const EMBEDDING_MODEL = "nomic-embed-text";

async function test(
    grade: string,
    query: string
) {
    console.log("\n======================================");
    console.log(`GRADE ${grade} RETRIEVAL`);
    console.log("======================================");

    console.log("Query:", query);

    const embedding = await ollama.embeddings({
        model: EMBEDDING_MODEL,
        prompt: query,
    });

    const collection =
        await getKnowledgeCollection();

    const results =
        await collection.query({
            queryEmbeddings: [embedding.embedding],
            nResults: 5,
            where: {
                "$and": [
                    {
                        grade: grade,
                    },
                    {
                        subject: "Mathematics",
                    },
                    {
                        board: "NCERT",
                    },
                ],
            },
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

    console.log(
        `\nRetrieved: ${ids.length}`
    );

    for (
        let i = 0;
        i < ids.length;
        i++
    ) {
        console.log(
            `\n--- Result ${i + 1} ---`
        );

        console.log(
            "Distance:",
            distances[i]
        );

        console.log(
            "Book:",
            metadatas[i]?.book
        );

        console.log(
            "Grade:",
            metadatas[i]?.grade
        );

        console.log(
            "File:",
            metadatas[i]?.fileName
        );

        console.log(
            "Document:",
            (
                documents[i] ?? ""
            ).slice(0, 300)
        );
    }
}

async function main() {

    await test(
        "5",
        "Equivalent fractions Grade 5 Mathematics"
    );

    await test(
        "7",
        "Fractions Grade 7 Mathematics"
    );
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
