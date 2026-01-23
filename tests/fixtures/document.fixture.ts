export const documentFixture = {
  id: "test-id",
  userId: "test-user-id",
  name: "test",
  storageKey: "randomKey",
  sizeBytes: 10,
  folderId: null,
  createdAt: new Date(),
};

type statusEnum = "UPLOADING" | "PROCESSING" | "READY" | "FAILED";

export const documentFixtureWithStatus = {
  id: "test-id",
  userId: "test-user-id",
  name: "test",
  storageKey: "randomKey",
  sizeBytes: 10,
  folderId: null,
  createdAt: new Date(),
  status: "READY" as statusEnum,
};
