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

const bucketName = secret("AWS_BUCKET_NAME");

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
      Key: document.name,
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
    const command = new PutObjectCommand({
      Bucket: bucketName(),
      Key: filename,
      Body: buffer,
      ContentType: mimeType,
    });
    await s3.send(command);

    const createdDocument = await DocumentRepository.create({
      name: filename,
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
