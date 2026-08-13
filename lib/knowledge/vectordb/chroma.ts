import { ChromaClient, Collection } from "chromadb";

export class ChromaVectorStore {
    private client: ChromaClient;
    private collection?: Collection;

    constructor(
        private collectionName = "srimathy_knowledge"
    ) {
        this.client = new ChromaClient({
            path: "http://localhost:8000"
        });
    }

    async initialize() {
        this.collection = await this.client.getOrCreateCollection({
            name: this.collectionName
        });

        console.log(
            `✅ ChromaDB collection ready: ${this.collectionName}`
        );

        return this.collection;
    }

    async addDocument(
        id: string,
        content: string,
        embedding: number[],
        metadata: Record<string, string | number | boolean>
    ) {
        if (!this.collection) {
            await this.initialize();
        }

        await this.collection!.add({
            ids: [id],
            documents: [content],
            embeddings: [embedding],
            metadatas: [metadata]
        });

        console.log(`✅ Stored vector: ${id}`);
    }

    async search(
        embedding: number[],
        topK = 5
    ) {
        if (!this.collection) {
            await this.initialize();
        }

        return this.collection!.query({
            queryEmbeddings: [embedding],
            nResults: topK
        });
    }
}