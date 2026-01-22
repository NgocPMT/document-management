import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import DocumentRepository from "./documents.repo";
import { s3 } from "../../storage/s3.client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIError } from "encore.dev/api";
import {
  DocumentGetAllDTO,
  DocumentSearchDTO,
  DocumentUpdateDTO,
} from "./documents.schema";
import { secret } from "encore.dev/config";
import { fileTypeFromBuffer } from "file-type";
import {
  downloadPDFUrl,
  generatePDFDownloadURL,
} from "../../jobs/pdf-conversion/pdf-conversion";

const bucketName = secret("AWS_BUCKET_NAME");
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

const DocumentService = {
  readByUser: async (userId: string, params: DocumentGetAllDTO) => {
    const documents = await DocumentRepository.findByUser(userId, params);
    return documents;
  },
  search: async (userId: string, params: DocumentSearchDTO) => {
    const { search, ...rest } = params;
    const documents = await DocumentRepository.findByName(search, userId, rest);
    return documents;
  },
  readOne: async (id: string, userId: string) => {
    const document = await DocumentRepository.findOne(id);
    if (!document) {
      throw APIError.notFound("Document not found");
    }

    if (document.userId !== userId) {
      throw APIError.permissionDenied("Forbidden");
    }
    return document;
  },
  validateDocument: async (id: string, userId: string) => {
    const document = await DocumentRepository.getIdAndUserId(id);
    if (!document) {
      throw APIError.notFound("Document not found");
    }

    if (document.userId !== userId) {
      throw APIError.permissionDenied("Forbidden");
    }
    return document;
  },
  update: async (id: string, data: DocumentUpdateDTO, userId: string) => {
    // validate user permission and document existence
    await DocumentService.validateDocument(id, userId);

    const updatedDocument = await DocumentRepository.update(id, data);
    if (!updatedDocument) {
      throw APIError.internal("Failed to update document");
    }
    return updatedDocument;
  },
  delete: async (id: string, userId: string) => {
    // validate user permission and document existence
    const document = await DocumentService.readOne(id, userId);

    const command = new DeleteObjectCommand({
      Bucket: bucketName(),
      Key: document.storageKey,
    });
    await s3.send(command);

    const deletedDocument = await DocumentRepository.delete(id);
    if (!deletedDocument) {
      throw APIError.internal("Failed to delete document");
    }
    return deletedDocument;
  },
  upload: async ({
    filename,
    buffer,
    userId,
  }: {
    filename: string;
    buffer: Buffer;
    mimeType: string;
    userId: string;
  }) => {
    const type = await fileTypeFromBuffer(new Uint8Array(buffer));

    if (!type || !ALLOWED_MIME_TYPE.includes(type.mime)) {
      throw APIError.invalidArgument("Invalid or spoofed file type");
    }

    if (buffer.length > MAX_SIZE) {
      throw APIError.invalidArgument("File is too big (50MB max)");
    }

    const randomKey = crypto.randomUUID();

    let newBuffer;
    if (type.mime === "application/pdf") {
      // Assign buffer reference for passing to the put command later
      newBuffer = buffer;
    } else {
      // normalization to PDF
      newBuffer = await downloadPDFUrl(
        await generatePDFDownloadURL({
          buffer,
          filename,
          contentType: type.mime,
        }),
      );
    }

    const command = new PutObjectCommand({
      Bucket: bucketName(),
      Key: randomKey,
      Body: newBuffer,
      ContentType: "application/pdf",
    });
    await s3.send(command);

    const newFilename = `${filename.replace(" ", "_").split(".")[0]}`;

    const createdDocument = await DocumentRepository.create({
      name: newFilename,
      storageKey: randomKey,
      userId: userId,
      status: "READY",
      sizeBytes: newBuffer.length,
    });

    if (!createdDocument) {
      throw APIError.internal("Failed to create document");
    }

    return createdDocument;
  },
  generateSignedUrl: async (id: string) => {
    const key = await DocumentRepository.getObjectKey(id);

    if (!key) {
      return null;
    }
    const command = new GetObjectCommand({
      Bucket: bucketName(),
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 60,
    });

    return signedUrl;
  },
};

export default DocumentService;
