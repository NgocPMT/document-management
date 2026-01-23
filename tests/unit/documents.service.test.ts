import { documentFixtureWithStatus } from "./../fixtures/document.fixture";
import { describe, it, expect, vi, expectTypeOf } from "vitest";
import DocumentRepository from "../../src/api/documents/documents.repo";
import DocumentService from "../../src/api/documents/documents.service";
import { documentFixture } from "../fixtures/document.fixture";
import { APIError } from "encore.dev/api";
import { beforeEach } from "node:test";
import { s3 } from "../../src/storage/s3.client";
import { handleUploadWorkflow } from "../../src/workflows/upload.workflow";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

vi.mock("encore.dev/config", () => ({
  secret: () => () => "test-bucket",
}));

vi.mock("../../src/storage/s3.client", () => ({
  s3: {
    send: vi.fn(),
  },
}));

/* Mock workflow */
vi.mock("../../src/workflows/upload.workflow", () => ({
  handleUploadWorkflow: vi.fn(),
}));

vi.mock("../../src/api/documents/documents.repo.ts", () => ({
  default: {
    findByUser: vi.fn(),
    findByName: vi.fn(),
    findOne: vi.fn(),
    getIdAndUserId: vi.fn(),
    findSharedDocument: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectKey: vi.fn(),
    createSharedDocument: vi.fn(),
    createDocumentSummary: vi.fn(),
    getDocumentSummary: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Read documents by user", () => {
  it("return an array of documents", async () => {
    vi.mocked(DocumentRepository.findByUser).mockResolvedValue([
      documentFixture,
    ]);
    const documents = await DocumentService.readByUser("john-123", {
      limit: 1,
      offset: 0,
    });
    expectTypeOf(documents).toBeArray();
    expect(documents[0]).toBe(documentFixture);
  });
});

describe("Read one document by ID", () => {
  (it("return an array if owned", async () => {
    vi.mocked(DocumentRepository.findOne).mockResolvedValue(
      documentFixtureWithStatus,
    );
    const document = await DocumentService.readOne("test-id", "test-user-id");
    expect(document).toBe(documentFixtureWithStatus);
  }),
    it("throws error if document not found", async () => {
      vi.mocked(DocumentRepository.findOne).mockResolvedValue(null);
      await expect(
        DocumentService.readOne("doc1", "user1"),
      ).rejects.toBeInstanceOf(APIError);
    }));
  it("throws error if user is not authorized", async () => {
    vi.mocked(DocumentRepository.findOne).mockResolvedValue(
      documentFixtureWithStatus,
    );
    await expect(
      DocumentService.readOne("test-id", "unauthorized-user-id"),
    ).rejects.toBeInstanceOf(APIError);
  });
});

describe("Validate shared document", async () => {
  it("allows access to valid shared document", async () => {
    vi.mocked(DocumentRepository.findSharedDocument).mockResolvedValue({
      userId: documentFixture.userId,
      documentId: documentFixture.id,
      expiresAt: new Date(Date.now() + 10000),
    });

    const id = await DocumentService.validateSharedDocument(
      documentFixture.id,
      documentFixture.userId,
    );
    expect(id).toBe(documentFixture.id);
  });

  it("denies expired shared document", async () => {
    vi.mocked(DocumentRepository.findSharedDocument).mockResolvedValue({
      userId: "test-user-id",
      documentId: "test-id",
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      DocumentService.validateSharedDocument("doc1", "user2"),
    ).rejects.toBeInstanceOf(APIError);
  });
});

describe("Validate documents", async () => {
  it("allows access to valid shared document", async () => {
    vi.mocked(DocumentRepository.findSharedDocument).mockResolvedValue({
      userId: documentFixture.userId,
      documentId: documentFixture.id,
      expiresAt: new Date(Date.now() + 10000),
    });

    vi.mocked(DocumentRepository.getIdAndUserId).mockResolvedValue({
      id: documentFixture.id,
      userId: documentFixture.userId,
    });

    const document = await DocumentService.validateDocument(
      documentFixture.id,
      documentFixture.userId,
    );

    expect(document.id).toBe(documentFixture.id);
  });

  it("throw error when user is not authorized", async () => {
    vi.mocked(DocumentRepository.findSharedDocument).mockResolvedValue(null);

    vi.mocked(DocumentRepository.getIdAndUserId).mockResolvedValue({
      id: documentFixture.id,
      userId: documentFixture.userId,
    });

    await expect(
      DocumentService.validateDocument(
        documentFixture.id,
        "unauthorized-user-id",
      ),
    ).rejects.toBeInstanceOf(APIError);
  });
});

describe("Update documents", async () => {
  it("updates document after validation", async () => {
    vi.mocked(DocumentRepository.getIdAndUserId).mockResolvedValue({
      id: documentFixture.id,
      userId: documentFixture.userId,
    });

    const updatedName = "updated name";

    vi.mocked(DocumentRepository.update).mockResolvedValue({
      ...documentFixture,
      name: updatedName,
    });

    const result = await DocumentService.update(
      documentFixture.id,
      { name: updatedName },
      documentFixture.userId,
    );

    expect(result.name).toBe(updatedName);
  });
});

describe("Delete documents", async () => {
  it("deletes document and S3 object", async () => {
    vi.mocked(DocumentRepository.findOne).mockResolvedValue(
      documentFixtureWithStatus,
    );

    vi.mocked(DocumentRepository.delete).mockResolvedValue(documentFixture);

    await DocumentService.delete(documentFixture.id, documentFixture.userId);

    expect(s3.send).toHaveBeenCalledOnce();
    expect(DocumentRepository.delete).toHaveBeenCalledWith(documentFixture.id);
  });
});

describe("Upload documents", async () => {
  it("delegates upload to workflow", async () => {
    vi.mocked(handleUploadWorkflow).mockResolvedValue({
      documentId: "test-id",
      status: "PROCESSING",
    });

    const result = await DocumentService.upload({
      filename: "a.pdf",
      buffer: Buffer.from("x"),
      mimeType: "application/pdf",
      userId: "user1",
    });

    expect(handleUploadWorkflow).toHaveBeenCalled();
    expect(result.documentId).toBe("test-id");
  });
});

describe("Generate signed URL for download", async () => {
  it("returns signed URL", async () => {
    vi.mocked(DocumentRepository.getIdAndUserId).mockResolvedValue({
      id: "doc1",
      userId: "user1",
    });

    vi.mocked(DocumentRepository.getObjectKey).mockResolvedValue("key1");
    vi.mocked(getSignedUrl).mockResolvedValue("https://signed-url");

    const url = await DocumentService.generateSignedUrl("doc1", "user1");

    expect(url).toContain("https://");
  });
});

describe("get document summary", async () => {
  it("returns summary if exists", async () => {
    vi.mocked(DocumentRepository.getIdAndUserId).mockResolvedValue({
      id: "test-id",
      userId: "test-user-id",
    });

    vi.mocked(DocumentRepository.getDocumentSummary).mockResolvedValue({
      documentId: "test-id",
      summary: "document summary",
      createdAt: new Date(),
    });

    const documentSummary = await DocumentService.getDocumentSummary(
      "test-id",
      "test-user-id",
    );

    expect(documentSummary.summary).toBe("document summary");
  });
});
