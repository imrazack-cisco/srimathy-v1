import ollama from "ollama";

import { KnowledgeChunk } from "../models/chunk";
import { KnowledgeEmbedding } from "../models/embedding";

export class OllamaEmbeddingService {

    private readonly MODEL = "nomic-embed-text";

    async embed(
        chunk: KnowledgeChunk
    ): Promise<KnowledgeEmbedding> {

        const response = await ollama.embeddings({

            model: this.MODEL,

            prompt: chunk.text

        });

        return {

            id: `${chunk.id}-embedding`,

            chunkId: chunk.id,

            vector: response.embedding,

            dimension: response.embedding.length,

            createdAt: new Date().toISOString()

        };

    }

}