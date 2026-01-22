import { DBOS } from "@dbos-inc/dbos-sdk";
import ai from "../AI/google.genai";
import { createUserContent } from "@google/genai";
import DocumentRepository from "../api/documents/documents.repo";
import { PDFParse } from "pdf-parse";

const extractTextFromBuffer = async (buffer: Buffer) => {
  DBOS.logger.info("Getting file content...");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
};

const getSummaryFromGeminiStep = async (text: string) => {
  DBOS.logger.info("Generating AI summary...");
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: createUserContent([
      `Please provide a concise summary of this document, highlighting the key takeaways: ${text}`,
    ]),
  });
  if (!result.text) {
    throw new Error("Failed generating summary");
  }
  return result.text;
};

const createDatabaseDocumentSummaryStep = async ({
  documentId,
  summary,
}: {
  documentId: string;
  summary: string;
}) => {
  DBOS.logger.info("Storing summary to database...");
  await DocumentRepository.createDocumentSummary({ documentId, summary });
};

const createAIDocumentSummaryWorkflow = async ({
  documentId,
  pdfBuffer,
}: {
  documentId: string;
  pdfBuffer: Buffer;
}) => {
  try {
    const text = await DBOS.runStep(() => extractTextFromBuffer(pdfBuffer), {
      name: "extract-text-from-buffer",
    });
    const summary = await DBOS.runStep(() => getSummaryFromGeminiStep(text), {
      name: "get-summary-from-ai",
    });
    await DBOS.runStep(
      () => createDatabaseDocumentSummaryStep({ documentId, summary }),
      { name: "storing-summary-to-database" },
    );
    DBOS.logger.info("Document summary generated");
  } catch (err) {
    DBOS.logger.error("Document summary generating failed");
  }
};

export const handleCreateAISummaryWorkflow = DBOS.registerWorkflow(
  createAIDocumentSummaryWorkflow,
);
