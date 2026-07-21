import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { KnowledgeDocument } from "../models/document";
import { KnowledgeChunk } from "../models/chunk";

export class RecursiveSplitter {

    private splitter = new RecursiveCharacterTextSplitter({

        chunkSize: 500,

        chunkOverlap: 100

    });

    async split(
        document: KnowledgeDocument
    ): Promise<KnowledgeChunk[]> {

        const docs = await this.splitter.createDocuments([
            document.content
        ]);

        return docs.map((doc, index) => ({

            id: `${document.id}-${index}`,

            documentId: document.id,

            chunkIndex: index,

            text: doc.pageContent,

            metadata: {

                source: document.source,

                pageCount: document.metadata.pageCount,

                chunkSize: doc.pageContent.length

            }

        }));

    }

}