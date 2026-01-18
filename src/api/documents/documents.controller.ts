import { api } from "encore.dev/api";
import busboy from "busboy";
import log from "encore.dev/log";
import { getAuthData } from "~encore/auth";
import DocumentService from "./documents.service";

// List documents (with filters, pagination)
export const read = api(
  { expose: true, auth: true, method: "POST", path: "/v1/documents" },
  async () => {
    //todo
  },
);

// Get document details
export const readOne = api(
  { expose: true, auth: true, method: "GET", path: "/v1/documents/:id" },
  async ({ id }: { id: string }) => {
    //todo
  },
);

type FileEntry = { data: any[]; filename: string; mimeType: string };

// Upload document
export const upload = api.raw(
  {
    expose: true,
    auth: true,
    method: "POST",
    path: "/v1/documents/upload",
    bodyLimit: null,
  },
  async (req, res) => {
    const authData = getAuthData();
    const bb = busboy({
      headers: req.headers,
      limits: { files: 1 },
    });
    const entry: FileEntry = { filename: "", data: [], mimeType: "" };

    bb.on("file", (_, file, info) => {
      entry.mimeType = info.mimeType;
      entry.filename = info.filename;
      file
        .on("data", (data) => {
          entry.data.push(data);
        })
        .on("close", () => {
          log.info(`File ${entry.filename} uploaded`);
        })
        .on("error", (err) => {
          bb.emit("error", err);
        });
    });

    bb.on("close", async () => {
      try {
        const buf = Buffer.concat(entry.data);

        await DocumentService.upload({
          filename: entry.filename,
          buf,
          mimeType: entry.mimeType,
          userId: authData.userID,
        });

        res.statusCode = 200;
        res.setHeader("Content-type", "application/json");
        res.end(
          JSON.stringify({
            message: "Upload completed",
            filename: entry.filename,
            size: `${buf.length} bytes`,
          }),
        );
      } catch (err) {
        bb.emit("error", err);
      }
    });

    bb.on("error", async (err) => {
      res.writeHead(500, { Connection: "close" });
      res.end(`Error: ${(err as Error).message}`);
    });

    req.pipe(bb);
    return;
  },
);

// Download document (presigned URL)
export const download = api.raw(
  {
    expose: true,
    auth: true,
    method: "GET",
    path: "/v1/documents/:id/download",
  },
  async (req, res) => {
    try {
      const id = req.url!.split("/")[3];

      if (!id) {
        res.statusCode = 400;
        res.end("Missing document id");
        return;
      }

      const signedUrl = await DocumentService.generateSignedUrl(id);

      if (!signedUrl) {
        res.statusCode = 404;
        res.end("Document not found");
        return;
      }

      res.statusCode = 303;
      res.setHeader("Location", signedUrl);
      res.end();
    } catch (err) {
      if (err instanceof Error) {
        res.statusCode = 500;
        res.end(err.message);
      }
    }
  },
);

// Update document metadata
export const update = api(
  { expose: true, auth: true, method: "PUT", path: "/v1/documents/:id" },
  async ({ id }: { id: string }) => {
    //todo
  },
);

// Delete document
export const destroy = api(
  { expose: true, auth: true, method: "DELETE", path: "/v1/documents/:id" },
  async ({ id }: { id: string }) => {
    //todo
  },
);

// Share document with user
export const share = api(
  { expose: true, auth: true, method: "POST", path: "/v1/documents/:id/share" },
  async ({ id }: { id: string }) => {
    //todo
  },
);

// Search documents
export const search = api(
  { expose: true, auth: true, method: "POST", path: "/v1/documents/search" },
  async () => {
    //todo
  },
);

// Get AI-generated summary
export const summary = api(
  {
    expose: true,
    auth: true,
    method: "GET",
    path: "/v1/documents/:id/summary",
  },
  async ({ id }: { id: string }) => {
    //todo
  },
);
