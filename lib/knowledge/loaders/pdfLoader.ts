import fs from "fs";
import path from "path";
import * as pdfParse from "pdf-parse";

import { BaseLoader } from "./baseLoader";
import { KnowledgeDocument } from "../models/document";

export class PDFLoader implements BaseLoader {

    async load(filePath: string): Promise<KnowledgeDocument[]> {

        // Validate file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`PDF not found: ${filePath}`);
        }

        // Read PDF
        const buffer = fs.readFileSync(filePath);

        // Parse PDF
        const pdf = await pdfParse.default(buffer);

        // Extract filename
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