import {
    retrieveKnowledge,
} from "../lib/knowledge/retriever/chromaRetriever";

async function run() {

    console.log("\n======================================");
    console.log(" SRIMATHY CURRICULUM-AWARE RETRIEVAL");
    console.log("======================================");

    console.log("\n📘 TEST 1 — GRADE 5");

    const grade5 =
        await retrieveKnowledge(
            "Equivalent fractions",
            5,
            {
                grade: "5",
                subject: "Mathematics",
                board: "NCERT",
            }
        );

    console.log(
        "\nGrade 5 books:",
        [...new Set(
            grade5.map(
                x => String(x.metadata.book)
            )
        )]
    );

    console.log("\n📗 TEST 2 — GRADE 7");

    const grade7 =
        await retrieveKnowledge(
            "Fractions",
            5,
            {
                grade: "7",
                subject: "Mathematics",
                board: "NCERT",
            }
        );

    console.log(
        "\nGrade 7 books:",
        [...new Set(
            grade7.map(
                x => String(x.metadata.book)
            )
        )]
    );
}

run().catch(error => {
    console.error("\n❌ Retrieval test failed:");
    console.error(error);
    process.exit(1);
});
