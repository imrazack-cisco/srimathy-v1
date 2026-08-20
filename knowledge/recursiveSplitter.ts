import type {
  KnowledgeDocument,
} from "../lib/knowledge/models/document";

export interface LegacyKnowledgeChunk {
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

export class RecursiveSplitter {

  constructor(
    private chunkSize = 1000,
    private overlap = 200
  ) {}

  split(
    document: KnowledgeDocument
  ): LegacyKnowledgeChunk[] {

    const chunks: LegacyKnowledgeChunk[] = [];

    const text =
      document.content;

    let index = 0;
    let chunkNumber = 0;

    const step =
      Math.max(
        1,
        this.chunkSize -
          this.overlap
      );

    while (
      index < text.length
    ) {

      const end =
        Math.min(
          index +
            this.chunkSize,
          text.length
        );

      const chunkText =
        text.slice(
          index,
          end
        );

      chunks.push({

        id:
          `${document.id}-${chunkNumber}`,

        documentId:
          document.id,

        chunkIndex:
          chunkNumber,

        content:
          chunkText,

        metadata: {

          source:
            document.source,

          title:
            document.title,

          pageCount:
            document.metadata
              .pageCount,

          loader:
            document.metadata
              .loader,

        },

      });

      chunkNumber++;

      index += step;
    }

    return chunks;
  }
}