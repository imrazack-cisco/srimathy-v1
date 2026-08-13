export interface KnowledgeChunk {

    id: string;

    documentId: string;

    chunkIndex: number;

    content: string;

    metadata: {

        source: string;

        title: string;

        pageCount?: number;

        loader?: string;

    };

}