// tests/unit/folder.service.test.ts
import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import FolderService from "../../src/api/folders/folders.service";
import FolderRepository from "../../src/api/folders/folders.repo";
import { APIError } from "encore.dev/api";
import {
  folderFixture,
  folderCreateDTO,
  folderUpdateDTO,
} from "../fixtures/folder.fixture";

/* Mock repository */
vi.mock("../../src/api/folders/folders.repo", () => ({
  default: {
    find: vi.fn(),
    getIdAndUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Get folders", () => {
  it("returns folders for user", async () => {
    vi.mocked(FolderRepository.find).mockResolvedValue([folderFixture]);

    const folders = await FolderService.get(folderFixture.userId);

    expectTypeOf(folders).toBeArray();
    expect(folders[0]).toBe(folderFixture);
  });
});

describe("Validate folder", () => {
  it("returns folder if user is owner", async () => {
    vi.mocked(FolderRepository.getIdAndUserId).mockResolvedValue(folderFixture);

    const folder = await FolderService.validateFolder(
      folderFixture.id,
      folderFixture.userId,
    );

    expect(folder.id).toBe(folderFixture.id);
  });

  it("throws 404 if folder not found", async () => {
    vi.mocked(FolderRepository.getIdAndUserId).mockResolvedValue(null);

    await expect(
      FolderService.validateFolder("missing-id", "user-1"),
    ).rejects.toBeInstanceOf(APIError);
  });

  it("throws permission error if user is not owner", async () => {
    vi.mocked(FolderRepository.getIdAndUserId).mockResolvedValue(folderFixture);

    await expect(
      FolderService.validateFolder(folderFixture.id, "other-user"),
    ).rejects.toBeInstanceOf(APIError);
  });
});

describe("Create folder", () => {
  it("creates folder successfully", async () => {
    vi.mocked(FolderRepository.create).mockResolvedValue(folderFixture);

    const folder = await FolderService.create({
      ...folderCreateDTO,
      userId: folderFixture.userId,
    });

    expect(folder).toBe(folderFixture);
  });

  it("throws error when creation fails", async () => {
    vi.mocked(FolderRepository.create).mockResolvedValue(null);

    await expect(
      FolderService.create({
        ...folderCreateDTO,
        userId: folderFixture.userId,
      }),
    ).rejects.toBeInstanceOf(APIError);
  });
});

describe("Update folder", () => {
  it("updates folder after validation", async () => {
    vi.mocked(FolderRepository.getIdAndUserId).mockResolvedValue(folderFixture);
    vi.mocked(FolderRepository.update).mockResolvedValue({
      ...folderFixture,
      ...folderUpdateDTO,
    });

    const updated = await FolderService.update(
      folderFixture.id,
      folderUpdateDTO,
      folderFixture.userId,
    );

    expect(updated.name).toBe(folderUpdateDTO.name);
  });

  it("throws error when update fails", async () => {
    vi.mocked(FolderRepository.getIdAndUserId).mockResolvedValue(folderFixture);
    vi.mocked(FolderRepository.update).mockResolvedValue(null);

    await expect(
      FolderService.update(
        folderFixture.id,
        folderUpdateDTO,
        folderFixture.userId,
      ),
    ).rejects.toBeInstanceOf(APIError);
  });
});

describe("Delete folder", () => {
  it("deletes folder after validation", async () => {
    vi.mocked(FolderRepository.getIdAndUserId).mockResolvedValue(folderFixture);
    vi.mocked(FolderRepository.delete).mockResolvedValue(folderFixture);

    const deleted = await FolderService.delete(
      folderFixture.id,
      folderFixture.userId,
    );

    expect(deleted.id).toBe(folderFixture.id);
  });

  it("throws error when delete fails", async () => {
    vi.mocked(FolderRepository.getIdAndUserId).mockResolvedValue(folderFixture);
    vi.mocked(FolderRepository.delete).mockResolvedValue(null);

    await expect(
      FolderService.delete(folderFixture.id, folderFixture.userId),
    ).rejects.toBeInstanceOf(APIError);
  });
});
