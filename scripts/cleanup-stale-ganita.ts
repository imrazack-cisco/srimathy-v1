import { getKnowledgeCollection } from "../lib/knowledge/vectorStore";

async function main() {

    console.log("");
    console.log("======================================");
    console.log(" CLEANUP STALE GANITA VECTORS");
    console.log("======================================");

    const collection =
        await getKnowledgeCollection();

    const results = await collection.get({
        where: {
            fileName: "ganita-prakash.pdf"
        }
    });

    const ids = results.ids ?? [];

    const staleIds = ids.filter(
        id =>
            id.startsWith(
                "ncert-5-mathematics-ganita-prakash"
            )
    );

    console.log(
        `Found stale vectors: ${staleIds.length}`
    );

    if (staleIds.length === 0) {
        console.log("Nothing to clean.");
        return;
    }

    for (const id of staleIds) {
        console.log("Deleting:", id);
    }

    await collection.delete({
        ids: staleIds
    });

    console.log("");
    console.log("======================================");
    console.log("✅ CLEANUP COMPLETE");
    console.log("======================================");

    console.log(
        "Deleted:",
        staleIds.length
    );

    console.log(
        "Chroma total:",
        await collection.count()
    );
}

main().catch(error => {
    console.error(
        "\n❌ Cleanup failed:"
    );
    console.error(error);
    process.exit(1);
});
