import ollama from "ollama";

import { getKnowledgeCollection } from "../vectorStore";

const EMBEDDING_MODEL =
    process.env.OLLAMA_EMBEDDING_MODEL ||
    "nomic-embed-text";

// ============================================================
// TYPES
// ============================================================

export interface RetrievedChunk {
    id: string;
    text: string;
    distance: number;
    metadata: Record<string, unknown>;
}

export interface RetrievalContext {
    grade?: string;
    subject?: string;
    board?: string;
    book?: string;
}

// ============================================================
// ADMINISTRATIVE CONTENT DETECTION
// ============================================================

const ADMIN_PATTERNS = [
    "all rights reserved",
    "copyright",
    "publication team",
    "publication division",
    "offices of the publication",
    "isbn",
    "printed on",
    "price",
    "first edition",
    "acknowledgement",
    "acknowledgements",
];

/**
 * Detect whether a chunk is primarily administrative/front matter.
 *
 * We deliberately use a scoring approach rather than rejecting
 * a chunk because it contains a single administrative phrase.
 */
function isAdministrativeContent(
    text: string
): boolean {

    const normalized =
        text
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

    if (!normalized) {
        return true;
    }

    let score = 0;

    for (
        const pattern of ADMIN_PATTERNS
    ) {

        if (
            normalized.includes(pattern)
        ) {

            score++;
        }
    }

    // Short chunks need relatively little evidence.
    if (
        normalized.length < 1800 &&
        score >= 2
    ) {

        return true;
    }

    // Longer textbook chunks need stronger evidence.
    if (
        normalized.length >= 1800 &&
        score >= 4
    ) {

        return true;
    }

    return false;
}

// ============================================================
// OLLAMA SEMANTIC EMBEDDING
// ============================================================

/**
 * Generate a semantic query embedding using Ollama.
 *
 * This is the preferred RAG path.
 */
async function generateQueryEmbedding(
    query: string
): Promise<number[]> {

    const response =
        await ollama.embeddings({
            model: EMBEDDING_MODEL,
            prompt: query,
        });

    if (
        !response ||
        !response.embedding ||
        !Array.isArray(
            response.embedding
        ) ||
        response.embedding.length === 0
    ) {

        throw new Error(
            "Ollama returned an invalid embedding."
        );
    }

    return response.embedding;
}

// ============================================================
// CURRICULUM FILTER BUILDER
// ============================================================

function buildCurriculumWhere(
    context: RetrievalContext
): any {

    const filters: any[] = [];

    if (context.grade) {

        filters.push({
            grade: context.grade,
        });
    }

    if (context.subject) {

        filters.push({
            subject: context.subject,
        });
    }

    if (context.board) {

        filters.push({
            board: context.board,
        });
    }

    if (context.book) {

        filters.push({
            book: context.book,
        });
    }

    if (
        filters.length === 1
    ) {

        return filters[0];
    }

    if (
        filters.length > 1
    ) {

        return {
            "$and": filters,
        };
    }

    return undefined;
}

// ============================================================
// KEYWORD / METADATA FALLBACK
// ============================================================
//
// Used when Ollama embeddings are unavailable.
//
// Flow:
//
// Ollama embedding
//       ↓
//     FAIL
//       ↓
// Chroma metadata retrieval
//       ↓
// Keyword scoring
//       ↓
// Curriculum scoring
//       ↓
// Top-K chunks
//
// This means RAG does NOT bring the entire SRIMATHY request
// down simply because the embedding model is unavailable.
// ============================================================

async function fallbackKeywordRetrieval(
    query: string,
    topK: number,
    context: RetrievalContext
): Promise<RetrievedChunk[]> {

    console.log("");
    console.log(
        "======================================"
    );

    console.log(
        "🔄 SRIMATHY RAG FALLBACK"
    );

    console.log(
        "======================================"
    );

    console.log(
        "Reason: Ollama embedding unavailable"
    );

    console.log(
        "Query:",
        query
    );

    console.log(
        "Curriculum:",
        context
    );

    // --------------------------------------------------------
    // 1. Connect to Chroma
    // --------------------------------------------------------

    console.log("");
    console.log(
        "🔌 Connecting to knowledge collection..."
    );

    const collection =
        await getKnowledgeCollection();

    console.log(
        `✅ Collection: ${collection.name}`
    );

    // --------------------------------------------------------
    // 2. Curriculum filter
    // --------------------------------------------------------

    const where =
        buildCurriculumWhere(
            context
        );

    if (where) {

        console.log("");
        console.log(
            "🎯 Fallback curriculum filter:",
            JSON.stringify(where)
        );
    }

    // --------------------------------------------------------
    // 3. Retrieve stored documents
    // --------------------------------------------------------
    //
    // IMPORTANT:
    // We deliberately use `get()` rather than `query()`
    // because semantic query requires an embedding.
    //
    // We then perform local keyword scoring.
    // --------------------------------------------------------

    const results =
        await collection.get({
            ...(where
                ? {
                    where,
                }
                : {}),

            include: [
                "documents",
                "metadatas",
            ],
        } as any);

    const ids =
        results.ids ?? [];

    const documents =
        results.documents ?? [];

    const metadatas =
        results.metadatas ?? [];

    console.log("");
    console.log(
        `📦 Fallback candidates: ${ids.length}`
    );

    // --------------------------------------------------------
    // 4. Query normalization
    // --------------------------------------------------------

    const stopWords =
        new Set([
            "the",
            "a",
            "an",
            "is",
            "are",
            "was",
            "were",
            "what",
            "why",
            "how",
            "explain",
            "tell",
            "me",
            "about",
            "for",
            "to",
            "of",
            "and",
            "in",
            "on",
            "with",
            "please",
            "can",
            "you",
            "give",
            "show",
            "describe",
            "teach",
            "student",
            "students",
            "grade",
        ]);

    const queryTerms =
        query
            .toLowerCase()
            .replace(
                /[^a-z0-9\s]/g,
                " "
            )
            .split(/\s+/)
            .map(
                (term) =>
                    term.trim()
            )
            .filter(
                (term) =>
                    term.length > 2 &&
                    !stopWords.has(term)
            );

    console.log("");
    console.log(
        "🔑 Query terms:",
        queryTerms
    );

    // --------------------------------------------------------
    // 5. Score documents
    // --------------------------------------------------------

    const scored:
        Array<{
            chunk: RetrievedChunk;
            score: number;
        }> = [];

    for (
        let i = 0;
        i < ids.length;
        i++
    ) {

        const text =
            documents[i] ?? "";

        const metadata =
            metadatas[i] ?? {};

        // ----------------------------------------------------
        // Ignore empty/admin chunks
        // ----------------------------------------------------

        if (
            !text ||
            isAdministrativeContent(
                text
            )
        ) {

            continue;
        }

        const normalizedText =
            text
                .toLowerCase();

        const metadataText =
            Object.values(
                metadata
            )
                .map(
                    (value) =>
                        String(value)
                )
                .join(" ")
                .toLowerCase();

        let score = 0;

        // ----------------------------------------------------
        // Query term scoring
        // ----------------------------------------------------

        for (
            const term
            of queryTerms
        ) {

            // Strong match in actual textbook content.
            if (
                normalizedText.includes(
                    term
                )
            ) {

                score += 2;

                // Reward repeated occurrences,
                // but cap the contribution.
                const occurrences =
                    normalizedText
                        .split(term)
                        .length - 1;

                if (
                    occurrences > 1
                ) {

                    score += Math.min(
                        occurrences,
                        5
                    );
                }
            }

            // Metadata matches are useful,
            // especially during fallback.
            if (
                metadataText.includes(
                    term
                )
            ) {

                score += 3;
            }
        }

        // ----------------------------------------------------
        // Curriculum bonuses
        // ----------------------------------------------------

        if (
            context.grade &&
            String(
                metadata.grade ?? ""
            ) ===
                String(
                    context.grade
                )
        ) {

            score += 4;
        }

        if (
            context.subject &&
            String(
                metadata.subject ?? ""
            ).toLowerCase() ===
                String(
                    context.subject
                ).toLowerCase()
        ) {

            score += 4;
        }

        if (
            context.board &&
            String(
                metadata.board ?? ""
            ).toLowerCase() ===
                String(
                    context.board
                ).toLowerCase()
        ) {

            score += 4;
        }

        if (
            context.book &&
            String(
                metadata.book ?? ""
            ).toLowerCase() ===
                String(
                    context.book
                ).toLowerCase()
        ) {

            score += 5;
        }

        // ----------------------------------------------------
        // Skip documents with no useful relevance.
        // ----------------------------------------------------

        if (
            score <= 0
        ) {

            continue;
        }

        scored.push({

            score,

            chunk: {

                id:
                    ids[i],

                text,

                /*
                 * This is NOT a real Chroma cosine distance.
                 *
                 * It is a normalized fallback relevance value
                 * represented in the same numeric field so the
                 * rest of SRIMATHY can continue to operate.
                 */
                distance:
                    1 /
                    (1 + score),

                metadata:
                    metadata as Record<
                        string,
                        unknown
                    >,
            },
        });
    }

    // --------------------------------------------------------
    // 6. Sort by fallback relevance
    // --------------------------------------------------------

    scored.sort(
        (a, b) =>
            b.score -
            a.score
    );

    // --------------------------------------------------------
    // 7. Return top-K
    // --------------------------------------------------------

    const chunks =
        scored
            .slice(
                0,
                topK
            )
            .map(
                (item) =>
                    item.chunk
            );

    // --------------------------------------------------------
    // 8. Log fallback result
    // --------------------------------------------------------

    console.log("");
    console.log(
        "======================================"
    );

    console.log(
        "📚 FALLBACK RETRIEVAL RESULT"
    );

    console.log(
        "======================================"
    );

    console.log(
        `Candidates available : ${ids.length}`
    );

    console.log(
        `Useful matches        : ${scored.length}`
    );

    console.log(
        `Returned chunks       : ${chunks.length}`
    );

    console.log("");

    for (
        const chunk of chunks
    ) {

        console.log(
            `   • ${chunk.metadata.book ?? "Unknown"}`
            + ` | Grade ${chunk.metadata.grade ?? "?"}`
            + ` | ${chunk.metadata.subject ?? "?"}`
            + ` | fallback score ${(
                1 /
                chunk.distance -
                1
            ).toFixed(1)}`
        );
    }

    console.log(
        "======================================"
    );

    return chunks;
}

// ============================================================
// MAIN KNOWLEDGE RETRIEVAL
// ============================================================

/**
 * Curriculum-aware semantic retrieval.
 *
 * Primary path:
 *
 * Query
 *   ↓
 * Ollama embedding
 *   ↓
 * Grade / Subject / Board / Book filter
 *   ↓
 * Chroma semantic search
 *   ↓
 * Administrative filtering
 *   ↓
 * Top-K
 *
 *
 * Failure path:
 *
 * Query
 *   ↓
 * Ollama embedding FAIL
 *   ↓
 * Chroma metadata retrieval
 *   ↓
 * Keyword + curriculum scoring
 *   ↓
 * Top-K
 */
export async function retrieveKnowledge(
    query: string,
    topK: number = 5,
    context: RetrievalContext = {}
): Promise<RetrievedChunk[]> {

    console.log("");
    console.log(
        "======================================"
    );

    console.log(
        "🔎 SRIMATHY KNOWLEDGE RETRIEVAL"
    );

    console.log(
        "======================================"
    );

    console.log(
        "Query:",
        query
    );

    console.log(
        "🎓 Curriculum Context:",
        context
    );

    // ========================================================
    // 1. Generate semantic embedding
    // ========================================================

    console.log("");
    console.log(
        "🧠 Generating query embedding..."
    );

    let embedding: number[];

    try {

        embedding =
            await generateQueryEmbedding(
                query
            );

        console.log(
            `🧠 Query embedding: ${embedding.length} dimensions`
        );

    } catch (error) {

        const message =
            error instanceof Error
                ? error.message
                : String(error);

        console.warn("");
        console.warn(
            "⚠️ Ollama embedding unavailable"
        );

        console.warn(
            "Reason:",
            message
        );

        console.warn(
            "🔄 Switching to keyword / metadata RAG fallback..."
        );

        // ----------------------------------------------------
        // IMPORTANT:
        // Do NOT throw.
        //
        // Return fallback retrieval so the Master Agent can
        // continue to the AI provider failover layer.
        // ----------------------------------------------------

        return fallbackKeywordRetrieval(
            query,
            topK,
            context
        );
    }

    // ========================================================
    // 2. Get Chroma collection
    // ========================================================

    console.log("");
    console.log(
        "🔌 Connecting to knowledge collection..."
    );

    const collection =
        await getKnowledgeCollection();

    console.log(
        `✅ Collection: ${collection.name}`
    );

    // ========================================================
    // 3. Build curriculum filters
    // ========================================================

    const where =
        buildCurriculumWhere(
            context
        );

    if (where) {

        console.log("");
        console.log(
            "🎯 Chroma curriculum filter:",
            JSON.stringify(where)
        );
    }

    // ========================================================
    // 4. Candidate count
    // ========================================================

    /*
     * Retrieve more candidates than we finally return.
     *
     * Example:
     *
     * topK       = 5
     * candidateK = 10
     *
     * This gives administrative filtering room.
     */

    const candidateK =
        Math.max(
            topK * 2,
            10
        );

    console.log("");
    console.log(
        `🔍 Retrieving ${candidateK} candidates...`
    );

    // ========================================================
    // 5. Chroma semantic search
    // ========================================================

    const queryOptions: any = {

        queryEmbeddings: [
            embedding,
        ],

        nResults:
            candidateK,

        include: [
            "documents",
            "metadatas",
            "distances",
        ],
    };

    if (where) {

        queryOptions.where =
            where;
    }

    const results =
        await collection.query(
            queryOptions
        );

    // ========================================================
    // 6. Extract Chroma results
    // ========================================================

    const ids =
        results.ids?.[0] ?? [];

    const documents =
        results.documents?.[0] ?? [];

    const metadatas =
        results.metadatas?.[0] ?? [];

    const distances =
        results.distances?.[0] ?? [];

    console.log("");
    console.log(
        `📦 Chroma returned ${ids.length} candidates`
    );

    // ========================================================
    // 7. Build useful chunks
    // ========================================================

    const candidates:
        RetrievedChunk[] = [];

    let administrativeFiltered =
        0;

    for (
        let i = 0;
        i < ids.length;
        i++
    ) {

        const text =
            documents[i] ?? "";

        const metadata =
            metadatas[i] ?? {};

        const distance =
            distances[i] ?? 0;

        // ----------------------------------------------------
        // Conservative administrative filtering
        // ----------------------------------------------------

        if (
            isAdministrativeContent(
                text
            )
        ) {

            administrativeFiltered++;

            console.log("");
            console.log(
                "   🚫 Filtered likely administrative chunk"
            );

            console.log(
                `      Book: ${metadata.book ?? "Unknown"}`
            );

            console.log(
                `      Grade: ${metadata.grade ?? "?"}`
            );

            console.log(
                `      Distance: ${distance}`
            );

            continue;
        }

        // ----------------------------------------------------
        // Keep useful chunk
        // ----------------------------------------------------

        candidates.push({

            id:
                ids[i],

            text,

            distance,

            metadata:
                metadata as Record<
                    string,
                    unknown
                >,
        });
    }

    // ========================================================
    // 8. Return top-K
    // ========================================================

    const chunks =
        candidates.slice(
            0,
            topK
        );

    // ========================================================
    // 9. Retrieval summary
    // ========================================================

    console.log("");
    console.log(
        "======================================"
    );

    console.log(
        "📚 RETRIEVAL RESULT"
    );

    console.log(
        "======================================"
    );

    console.log(
        `Candidates retrieved     : ${ids.length}`
    );

    console.log(
        `Administrative filtered   : ${administrativeFiltered}`
    );

    console.log(
        `Useful chunks             : ${chunks.length}`
    );

    console.log("");

    for (
        const chunk of chunks
    ) {

        console.log(
            `   • ${chunk.metadata.book ?? "Unknown"}`
            + ` | Grade ${chunk.metadata.grade ?? "?"}`
            + ` | ${chunk.metadata.subject ?? "?"}`
            + ` | distance ${chunk.distance}`
        );
    }

    console.log(
        "======================================"
    );

    return chunks;
}

