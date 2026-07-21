import { KnowledgeDocument } from "../models/document";

export interface BaseLoader {

    load(filePath: string): Promise<KnowledgeDocument[]>;

}