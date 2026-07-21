import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

import { BaseLoader } from "./baseLoader";
import { KnowledgeDocument } from "../models/document";

export class PDFLoader implements BaseLoader {

    async load(filePath: string): Promise<KnowledgeDocument[]> {

        if (!fs.existsSync(filePath)) {
            throw new Error(`PDF not found: ${filePath}`);
        }

        const buffer = fs.readFileSync(filePath);

        const pdf = await pdfParse(buffer);

        const fileName = path.basename(filePath);

        const document: KnowledgeDocument = {
            id: `${fileName}-0`,
            title: fileName,
            source: filePath,
            content: pdf.text.trim(),
            metadata: {
                pageCount: pdf.numpages,
                fileName,
                loader: "pdf",
                ingestedAt: new Date().toISOString()
            }
        };

        return [document];
    }
}