import { KnowledgeDocument } from "../models/document";
import { KnowledgeChunk } from "../models/chunk";

export class RecursiveSplitter {

    constructor(

        private chunkSize = 1000,

        private overlap = 200

    ) {}

    split(document: KnowledgeDocument): KnowledgeChunk[] {

        const chunks: KnowledgeChunk[] = [];

        const text = document.content;

        let index = 0;

        let chunkNumber = 0;

        while (index < text.length) {

            const end = Math.min(

                index + this.chunkSize,

                text.length

            );

            const chunkText = text.slice(index, end);

            chunks.push({

                id: `${document.id}-${chunkNumber}`,

                documentId: document.id,

                chunkIndex: chunkNumber,

                content: chunkText,

                metadata: {

                    source: document.source,

                    title: document.title,

                    pageCount: document.metadata.pageCount,

                    loader: document.metadata.loader

                }

            });

            chunkNumber++;

            index += this.chunkSize - this.overlap;

        }

        return chunks;

    }

}