import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import DocumentRepository from "./documents.repo";
import { s3 } from "../../storage/s3.client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIError } from "encore.dev/api";
import { DocumentUpdateDTO } from "./documents.schema";
import { secret } from "encore.dev/config";
import { fileTypeFromBuffer } from "file-type";

const bucketName = secret("AWS_BUCKET_NAME");
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME_TYPE = [
  "application/pdf",

  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "text/plain",
  "text/csv",

  "image/png",
  "image/jpeg",
];

const DocumentService = {
  readByUser: async (userId: string) => {
    const documents = await DocumentRepository.findByUser(userId);
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
  update: async (id: string, data: DocumentUpdateDTO, userId: string) => {
    // validate user permission and document existence
    await DocumentService.readOne(id, userId);

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
    mimeType,
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
    const command = new PutObjectCommand({
      Bucket: bucketName(),
      Key: randomKey,
      Body: buffer,
      ContentType: mimeType,
    });
    await s3.send(command);

    const createdDocument = await DocumentRepository.create({
      name: filename,
      storageKey: randomKey,
      userId: userId,
      status: "READY",
      sizeBytes: buffer.length,
    });

    if (!createdDocument) {
      throw APIError.internal("Failed to create document");
    }
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
