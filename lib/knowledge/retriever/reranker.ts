export interface DocumentChunk {

    id: string;

    text: string;

    source: string;

    page: number;

    chunkNumber: number;

    subject?: string;

    grade?: string;

}