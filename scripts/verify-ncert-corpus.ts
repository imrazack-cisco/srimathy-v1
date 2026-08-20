import { getKnowledgeCollection } from "../lib/knowledge/vectorStore";

async function main() {
    const collection = await getKnowledgeCollection();

    const results = await collection.get({
        include: ["metadatas"],
    });

    const counts: Record<string, number> = {};

    for (const metadata of results.metadatas ?? []) {
        if (metadata?.sourceType !== "official-ncert") {
            continue;
        }

        const grade = String(metadata.grade ?? "unknown");
        const book = String(metadata.book ?? "unknown");

        const key = `Grade ${grade} | ${book}`;

        counts[key] = (counts[key] ?? 0) + 1;
    }

    console.log("\n======================================");
    console.log("       SRIMATHY NCERT CORPUS");
    console.log("======================================");

    for (const [key, count] of Object.entries(counts)) {
        console.log(`${key.padEnd(35)} ${count} vectors`);
    }

    console.log("--------------------------------------");

    const ncertCount = Object.values(counts)
        .reduce((sum, value) => sum + value, 0);

    console.log(`NCERT vectors : ${ncertCount}`);
    console.log(`Total vectors : ${results.ids.length}`);

    console.log("======================================\n");
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
