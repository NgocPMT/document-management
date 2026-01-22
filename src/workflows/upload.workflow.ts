import { fileTypeFromBuffer } from "file-type";
import {
  downloadPDFUrl,
  generatePDFDownloadURL,
} from "../jobs/pdf-conversion/pdf-conversion";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../storage/s3.client";
import DocumentRepository from "../api/documents/documents.repo";
import { DBOS } from "@dbos-inc/dbos-sdk";
import { bucketName } from "./encore.service";
import { handleCreateAISummaryWorkflow } from "./summary.workflow";

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME_TYPE = [
  // .pdf
  "application/pdf",

  // .doc, .dot, .wiz
  "application/msword",

  // .docx
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // .xla, .xlb, .xlc, .xlm, .xls, .xlt, .xlw
  "application/vnd.ms-excel",

  // .xlsx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  // .pot, .ppa, .pps, .ppt, .pwz
  "application/vnd.ms-powerpoint",

  // .pptx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // .png
  "image/png",

  // .jpeg
  "image/jpeg",
];

const validateFileStep = async (buffer: Buffer) => {
  DBOS.logger.info("Validating file...");
  const type = await fileTypeFromBuffer(new Uint8Array(buffer));

  if (!type || !ALLOWED_MIME_TYPE.includes(type.mime)) {
    throw new Error("Invalid or spoofed file type");
  }

  if (buffer.length > MAX_SIZE) {
    throw new Error("File is too big (50MB max)");
  }
  return type;
};

const normalizeToPDFStep = async (
  buffer: Buffer,
  filename: string,
  mimeType: string,
) => {
  if (mimeType === "application/pdf") {
    return buffer;
  }

  // normalization to PDF
  DBOS.logger.info("Normalize file to PDF...");
  const newBuffer = await downloadPDFUrl(
    await generatePDFDownloadURL({
      buffer,
      filename,
      contentType: mimeType,
    }),
  );
  return newBuffer;
};

const generateRandomStorageKeyStep = async () => {
  DBOS.logger.info("Generating random storage key...");
  return crypto.randomUUID();
};

const uploadToStorageStep = async (buffer: Buffer, storageKey: string) => {
  DBOS.logger.info("Uploading file to storage");
  const command = new PutObjectCommand({
    Bucket: bucketName(),
    Key: storageKey,
    Body: buffer,
    ContentType: "application/pdf",
  });
  await s3.send(command);
};

const createDatabaseDocumentStep = async (
  filename: string,
  storageKey: string,
  userId: string,
  buffer: Buffer,
) => {
  DBOS.logger.info("Storing file to the database...");
  const newFilename = `${filename.replace(" ", "_").split(".")[0]}`;

  const createdDocument = await DocumentRepository.create({
    name: newFilename,
    storageKey: storageKey,
    userId: userId,
    sizeBytes: buffer.length,
  });

  if (!createdDocument) {
    throw new Error("Failed to create document");
  }

  return createdDocument;
};

const processDocumentWorkflow = async ({
  documentId,
  filename,
  storageKey,
  buffer,
}: {
  documentId: string;
  filename: string;
  storageKey: string;
  buffer: Buffer;
}) => {
  try {
    const type = await DBOS.runStep(() => validateFileStep(buffer), {
      name: "validate-file",
    });
    const pdfBuffer = await DBOS.runStep(
      () => normalizeToPDFStep(buffer, filename, type.mime),
      { name: "normalize-to-pdf" },
    );
    await DBOS.runStep(() => uploadToStorageStep(pdfBuffer, storageKey), {
      name: "upload-to-s3",
    });

    await DBOS.runStep(
      () => DocumentRepository.updateStatus(documentId, "READY"),
      { name: "mark-document-ready" },
    );

    DBOS.logger.info("Document processing completed");

    // Background document summary generating
    handleCreateAISummaryWorkflow({ documentId, pdfBuffer });
  } catch (err) {
    await DBOS.runStep(() =>
      DocumentRepository.updateStatus(documentId, "FAILED"),
    );
    DBOS.logger.error("Document processing failed");
    throw err;
  }
};

const handleProcessDocumentWorkflow = DBOS.registerWorkflow(
  processDocumentWorkflow,
);

const uploadWorkflow = async ({
  filename,
  buffer,
  userId,
}: {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  userId: string;
}) => {
  const storageKey = await DBOS.runStep(() => generateRandomStorageKeyStep(), {
    name: "generate-storage-key",
  });
  const document = await DBOS.runStep(() =>
    createDatabaseDocumentStep(filename, storageKey, userId, buffer),
  );
  await DBOS.runStep(() =>
    DocumentRepository.updateStatus(document.id, "PROCESSING"),
  );

  // background document processing
  handleProcessDocumentWorkflow({
    documentId: document.id,
    filename,
    storageKey,
    buffer,
  });

  return {
    documentId: document.id,
    status: "PROCESSING",
  };
};

export const handleUploadWorkflow = DBOS.registerWorkflow(uploadWorkflow);
