export interface KnowledgeChunk {

    id: string;

    documentId: string;

    chunkIndex: number;

    text: string;

    metadata: {

        source: string;

        pageCount?: number;

        chunkSize: number;

    };

}