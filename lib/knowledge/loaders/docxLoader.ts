import fs from "fs";
import pdfParse from "pdf-parse";
import { v4 as uuid } from "uuid";

import { BaseLoader } from "./baseLoader";
import { KnowledgeDocument } from "../models/document";

export class PDFLoader implements BaseLoader {

    async load(filePath: string): Promise<KnowledgeDocument[]> {

        const buffer = fs.readFileSync(filePath);

        const pdf = await pdfParse(buffer);

        return [

            {

                id: uuid(),

                title: filePath.split("/").pop() || "",

                source: filePath,

                content: pdf.text,

                metadata: {

                    page: pdf.numpages

                }

            }

        ];

    }

}