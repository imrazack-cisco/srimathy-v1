export interface KnowledgeDocument {

    id: string;

    title: string;

    source: string;

    content: string;

    metadata: {

        pageCount?: number;

        fileName?: string;

        loader?: string;

        ingestedAt?: string;

        subject?: string;

        grade?: string;

        author?: string;

        language?: string;

    };

}