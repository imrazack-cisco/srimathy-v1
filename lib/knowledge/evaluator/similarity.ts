import ollama from "ollama";

const EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL ||
  "nomic-embed-text";

export interface SimilarityResult {
  similarity: number;
  distance: number;
}

/**
 * Generate an embedding using the same local embedding
 * model used by the SRIMATHY RAG pipeline.
 */
async function embed(
  text: string
): Promise<number[]> {

  const response = await ollama.embeddings({
    model: EMBEDDING_MODEL,
    prompt: text,
  });

  return response.embedding;
}


/**
 * Cosine similarity between two vectors.
 *
 * Result:
 *   1.0 = identical direction
 *   0.0 = unrelated
 */
function cosineSimilarity(
  a: number[],
  b: number[]
): number {

  if (
    a.length === 0 ||
    b.length === 0 ||
    a.length !== b.length
  ) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {

    dot += a[i] * b[i];

    normA += a[i] * a[i];

    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return (
    dot /
    (Math.sqrt(normA) * Math.sqrt(normB))
  );
}


/**
 * Compare generated educational content against
 * an NCERT reference chunk.
 */
export async function semanticSimilarity(
  generatedText: string,
  referenceText: string
): Promise<SimilarityResult> {

  if (
    !generatedText.trim() ||
    !referenceText.trim()
  ) {

    return {
      similarity: 0,
      distance: 1,
    };

  }

  const [
    generatedEmbedding,
    referenceEmbedding,
  ] = await Promise.all([

    embed(generatedText),

    embed(referenceText),

  ]);

  const similarity =
    cosineSimilarity(
      generatedEmbedding,
      referenceEmbedding
    );

  return {

    similarity,

    distance:
      1 - similarity,

  };
}