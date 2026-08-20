import path from "path";
import fs from "fs";
import ollama from "ollama";

import { PDFLoader } from "../lib/knowledge/loaders/pdfLoader";
import { getKnowledgeCollection } from "../lib/knowledge/vectorStore";

const EMBEDDING_MODEL = "nomic-embed-text";

const CHUNK_SIZE = 4000;
const CHUNK_OVERLAP = 400;

function getArg(name: string): string | undefined {
    const index = process.argv.indexOf(name);

    if (index === -1) {
        return undefined;
    }

    return process.argv[index + 1];
}

function splitText(text: string): string[] {
    const chunks: string[] = [];

    let start = 0;

    while (start < text.length) {
        let end = Math.min(start + CHUNK_SIZE, text.length);

        if (end < text.length) {
            const newline = text.lastIndexOf("\n", end);

            if (newline > start + CHUNK_SIZE * 0.5) {
                end = newline;
            }
        }

        const chunk = text.slice(start, end).trim();

        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        if (end >= text.length) {
            break;
        }

        start = Math.max(
            end - CHUNK_OVERLAP,
            start + 1
        );
    }

    return chunks;
}

async function generateEmbedding(
    text: string
): Promise<number[]> {

    const response =
        await ollama.embeddings({
            model: EMBEDDING_MODEL,
            prompt: text,
        });

    return response.embedding;
}

function getPdfFiles(inputPath: string): string[] {

    const absolutePath =
        path.resolve(
            process.cwd(),
            inputPath
        );

    if (!fs.existsSync(absolutePath)) {
        throw new Error(
            `Path not found: ${absolutePath}`
        );
    }

    const stat =
        fs.statSync(absolutePath);

    // Single PDF
    if (stat.isFile()) {

        if (
            path.extname(absolutePath)
                .toLowerCase() !== ".pdf"
        ) {
            throw new Error(
                `File is not a PDF: ${absolutePath}`
            );
        }

        return [absolutePath];
    }

    // Directory
    if (stat.isDirectory()) {

        return fs
            .readdirSync(absolutePath)
            .filter(
                file =>
                    file
                        .toLowerCase()
                        .endsWith(".pdf")
            )
            .sort()
            .map(
                file =>
                    path.join(
                        absolutePath,
                        file
                    )
            );
    }

    return [];
}

async function main() {

    console.log(
        "🚀 SRIMATHY NCERT KNOWLEDGE INGESTION\n"
    );

    const fileArg =
        getArg("--file");

    const dirArg =
        getArg("--dir");

    const grade =
        getArg("--grade");

    const subject =
        getArg("--subject");

    const book =
        getArg("--book");

    if (
        (!fileArg && !dirArg) ||
        !grade ||
        !subject ||
        !book
    ) {

        console.error(`
Usage:

Single PDF:
npm run knowledge:ingest -- \\
  --file <pdf> \\
  --grade <grade> \\
  --subject <subject> \\
  --book <book>

Directory:
npm run knowledge:ingest -- \\
  --dir <directory> \\
  --grade <grade> \\
  --subject <subject> \\
  --book <book>
`);

        process.exit(1);
    }

    if (fileArg && dirArg) {

        console.error(
            "❌ Use either --file OR --dir, not both."
        );

        process.exit(1);
    }

    const inputPath =
        fileArg || dirArg!;

    const pdfFiles =
        getPdfFiles(inputPath);

    if (pdfFiles.length === 0) {

        console.error(
            `❌ No PDF files found in: ${inputPath}`
        );

        process.exit(1);
    }

    console.log(
        `📚 Book       : ${book}`
    );

    console.log(
        `🎓 Grade      : ${grade}`
    );

    console.log(
        `📐 Subject    : ${subject}`
    );

    console.log(
        `📄 PDF files  : ${pdfFiles.length}`
    );

    console.log(
        `🧠 Embeddings : ${EMBEDDING_MODEL}`
    );

    console.log("");

    // --------------------------------------------------
    // Chroma
    // --------------------------------------------------

    console.log(
        "🔌 Connecting to ChromaDB..."
    );

    const collection =
        await getKnowledgeCollection();

    console.log(
        `✅ Collection: ${collection.name}`
    );

    let totalDocuments = 0;
    let totalChunks = 0;

    // --------------------------------------------------
    // Process every PDF
    // --------------------------------------------------

    for (
        let fileIndex = 0;
        fileIndex < pdfFiles.length;
        fileIndex++
    ) {

        const pdfPath =
            pdfFiles[fileIndex];

        const fileName =
            path.basename(pdfPath);

        console.log("\n======================================");

        console.log(
            `📖 PDF ${fileIndex + 1}/${pdfFiles.length}: ${fileName}`
        );

        console.log(
            "======================================"
        );

        const loader =
            new PDFLoader();

        const documents =
            await loader.load(
                pdfPath
            );

        console.log(
            `✅ Documents loaded: ${documents.length}`
        );

        for (
            const document
            of documents
        ) {

            const text =
                document.content.trim();

            if (!text) {

                console.log(
                    "⚠️ Empty document — skipping."
                );

                continue;
            }

            console.log(
                `📏 Characters: ${text.length}`
            );

            const chunks =
                splitText(text);

            console.log(
                `✂️ Chunks: ${chunks.length}`
            );

            totalDocuments += 1;

            // Chapter number from filenames such as:
            // eemm101.pdf → 1
            // eemm115.pdf → 15
            const chapterMatch =
                fileName.match(
                    /[a-z]+1(\d{2})\.pdf$/i
                );

            const chapter =
                chapterMatch
                    ? Number(
                        chapterMatch[1]
                    )
                    : undefined;

            for (
                let i = 0;
                i < chunks.length;
                i++
            ) {

                const chunk =
                    chunks[i];

                console.log(
                    `[${i + 1}/${chunks.length}] 🧠 Embedding ${chunk.length} chars...`
                );

                const embedding =
                    await generateEmbedding(
                        chunk
                    );

                const safeBook =
                    book
                        .toLowerCase()
                        .replace(
                            /[^a-z0-9]+/g,
                            "-"
                        )
                        .replace(
                            /^-|-$/g,
                            ""
                        );

                const id =
                    [
                        "ncert",
                        grade,
                        subject.toLowerCase(),
                        safeBook,
                        fileName
                            .replace(
                                ".pdf",
                                ""
                            ),
                        "chunk",
                        i
                    ].join("-");

                const metadata: Record<
                    string,
                    string | number
                > = {

                    source:
                        pdfPath,

                    fileName,

                    loader:
                        "pdf",

                    grade,

                    subject,

                    book,

                    board:
                        "NCERT",

                    sourceType:
                        "official-ncert",

                    pageCount:
                        typeof document.metadata
                            ?.pageCount ===
                        "number"
                            ? document.metadata
                                .pageCount
                            : 0,

                    chunkNumber:
                        i,

                    ingestedAt:
                        new Date()
                            .toISOString(),
                };

                if (
                    chapter !== undefined
                ) {

                    metadata.chapter =
                        chapter;
                }

                await collection.upsert({

                    ids: [id],

                    documents: [
                        chunk
                    ],

                    embeddings: [
                        embedding
                    ],

                    metadatas: [
                        metadata
                    ],
                });

                totalChunks++;

                console.log(
                    `   💾 Stored: ${id}`
                );
            }
        }
    }

    const count =
        await collection.count();

    console.log("\n======================================");
    console.log(
        "🎉 NCERT INGESTION COMPLETE"
    );
    console.log("======================================");

    console.log(
        `Grade               : ${grade}`
    );

    console.log(
        `Subject             : ${subject}`
    );

    console.log(
        `Book                : ${book}`
    );

    console.log(
        `PDF files processed : ${pdfFiles.length}`
    );

    console.log(
        `Documents processed : ${totalDocuments}`
    );

    console.log(
        `Vectors added       : ${totalChunks}`
    );

    console.log(
        `Chroma total        : ${count}`
    );

    console.log(
        `Embedding model     : ${EMBEDDING_MODEL}`
    );

    console.log(
        "Embedding dimension : 768"
    );

    console.log(
        `Chunk size          : ${CHUNK_SIZE}`
    );

    console.log(
        `Chunk overlap       : ${CHUNK_OVERLAP}`
    );

    console.log(
        "\n✅ SRIMATHY NCERT knowledge ingestion successful."
    );
}

main().catch(
    error => {

        console.error(
            "\n❌ Ingestion failed:"
        );

        console.error(error);

        process.exit(1);
    }
);
