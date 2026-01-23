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
  DocumentSummaryCreateDTO,
  DocumentUpdateDTO,
  SharedDocumentCreateDTO,
} from "./documents.schema";
import { secret } from "encore.dev/config";
import { handleUploadWorkflow } from "../../workflows/upload.workflow";
import log from "encore.dev/log";

const bucketName = secret("AWS_BUCKET_NAME");

const DocumentService = {
  readByUser: async (userId: string, params: DocumentGetAllDTO) => {
    log.info("DocumentService.readByUser: Fetching documents", {
      userId,
      params,
    });

    const documents = await DocumentRepository.findByUser(userId, params);

    log.info("DocumentService.readByUser: Documents fetched", {
      count: documents.length,
    });

    return documents;
  },

  search: async (userId: string, params: DocumentSearchDTO) => {
    log.info("DocumentService.search: Searching documents", { userId, params });

    const { search, ...rest } = params;
    const documents = await DocumentRepository.findByName(search, userId, rest);

    log.info("DocumentService.search: Documents found", {
      count: documents.length,
    });

    return documents;
  },

  readOne: async (id: string, userId: string) => {
    log.info("DocumentService.readOne: Fetching document", { id, userId });

    const document = await DocumentRepository.findOne(id);
    if (!document) {
      log.warn("DocumentService.readOne: Document not found", { id });
      throw APIError.notFound("Document not found");
    }

    if (document.userId !== userId) {
      log.warn("DocumentService.readOne: Validating shared document access", {
        id,
        userId,
      });
      await DocumentService.validateSharedDocument(id, userId);
    }

    return document;
  },

  validateDocument: async (id: string, userId: string) => {
    log.info("DocumentService.validateDocument: Validating document", {
      id,
      userId,
    });

    const document = await DocumentRepository.getIdAndUserId(id);
    if (!document) {
      log.warn("DocumentService.validateDocument: Document not found", { id });
      throw APIError.notFound("Document not found");
    }

    if (document.userId !== userId) {
      log.warn(
        "DocumentService.validateDocument: Validating shared document access",
        { id, userId },
      );
      await DocumentService.validateSharedDocument(id, userId);
    }

    log.info("DocumentService.validateDocument: Document validated", {
      id,
      userId,
    });

    return document;
  },

  validateSharedDocument: async (documentId: string, userId: string) => {
    log.info(
      "DocumentService.validateSharedDocument: Validating shared document",
      { documentId, userId },
    );

    const sharedDocument = await DocumentRepository.findSharedDocument(
      documentId,
      userId,
    );
    if (!sharedDocument || new Date() > sharedDocument.expiresAt) {
      log.warn("DocumentService.validateSharedDocument: Access denied", {
        documentId,
        userId,
      });
      throw APIError.permissionDenied("Forbidden");
    }

    log.info("DocumentService.validateSharedDocument: Access granted", {
      documentId,
      userId,
    });
    return documentId;
  },

  update: async (id: string, data: DocumentUpdateDTO, userId: string) => {
    log.info("DocumentService.update: Updating document", { id, userId, data });
    // validate user permission and document existence
    await DocumentService.validateDocument(id, userId);

    const updatedDocument = await DocumentRepository.update(id, data);
    if (!updatedDocument) {
      log.warn("DocumentService.update: Failed to update document", {
        id,
        userId,
      });
      throw APIError.internal("Failed to update document");
    }

    log.info("DocumentService.update: Document updated successfully", {
      id,
      userId,
    });

    return updatedDocument;
  },

  delete: async (id: string, userId: string) => {
    log.info("DocumentService.delete: Deleting document", { id, userId });
    // validate user permission and document existence
    const document = await DocumentService.readOne(id, userId);

    const command = new DeleteObjectCommand({
      Bucket: bucketName(),
      Key: document.storageKey,
    });

    log.info("DocumentService.delete: Deleting document from S3", {
      id,
      userId,
    });

    await s3.send(command);

    log.info("DocumentService.delete: Deleting document from database", {
      id,
      userId,
    });

    const deletedDocument = await DocumentRepository.delete(id);
    if (!deletedDocument) {
      log.warn(
        "DocumentService.delete: Failed to delete document from database",
        { id, userId },
      );
      throw APIError.internal("Failed to delete document");
    }

    log.info("DocumentService.delete: Document deleted successfully", {
      id,
      userId,
    });

    return deletedDocument;
  },

  upload: async (input: {
    filename: string;
    buffer: Buffer;
    mimeType: string;
    userId: string;
  }) => {
    log.info("DocumentService.upload: Uploading document", {
      filename: input.filename,
      userId: input.userId,
    });

    const uploadInfo = await handleUploadWorkflow(input);

    log.info("DocumentService.upload: Document uploaded successfully", {
      filename: input.filename,
      userId: input.userId,
    });
    return uploadInfo;
  },

  generateSignedUrl: async (id: string, userId: string, ttl?: number) => {
    log.info("DocumentService.generateSignedUrl: Generating signed URL", {
      id,
      userId,
      ttl,
    });
    await DocumentService.validateDocument(id, userId);

    const key = await DocumentRepository.getObjectKey(id);

    if (!key) {
      log.warn(
        "DocumentService.generateSignedUrl: Document storage key not found",
        { id },
      );
      return null;
    }
    const command = new GetObjectCommand({
      Bucket: bucketName(),
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: ttl || 60,
    });

    log.info("DocumentService.generateSignedUrl: Signed URL generated", {
      id,
      userId,
    });
    return signedUrl;
  },

  shareDocument: async (
    documentId: string,
    userId: string,
    data: SharedDocumentCreateDTO,
  ) => {
    log.info("DocumentService.shareDocument: Sharing document", {
      documentId,
      userId,
      data,
    });

    await DocumentService.validateDocument(documentId, userId);
    const createdSharedDocument = await DocumentRepository.createSharedDocument(
      { ...data, documentId },
    );

    log.info("DocumentService.shareDocument: Document shared successfully", {
      documentId,
      userId,
      sharedDocumentId: createdSharedDocument.documentId,
    });

    return createdSharedDocument;
  },

  createDocumentSummary: async (data: DocumentSummaryCreateDTO) => {
    log.info(
      "DocumentService.createDocumentSummary: Creating document summary",
      { documentId: data.documentId },
    );

    const summary = await DocumentRepository.createDocumentSummary(data);

    log.info(
      "DocumentService.createDocumentSummary: Document summary created",
      { documentId: data.documentId },
    );

    return summary;
  },

  getDocumentSummary: async (documentId: string, userId: string) => {
    log.info("DocumentService.getDocumentSummary: Fetching document summary", {
      documentId,
      userId,
    });
    await DocumentService.validateDocument(documentId, userId);
    const summary = await DocumentRepository.getDocumentSummary(documentId);

    if (!summary) {
      log.warn(
        "DocumentService.getDocumentSummary: Document summary not found",
        { documentId },
      );
      throw APIError.notFound("Document summary not found");
    }

    log.info("DocumentService.getDocumentSummary: Document summary fetched", {
      documentId,
    });

    return summary;
  },
};

export default DocumentService;
