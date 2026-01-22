import * as z from "zod";
import { documentStatusEnum } from "../../db/schema";

export const DocumentGetAllSchema = z.object({
  limit: z.coerce.number().int().positive(),
  offset: z.coerce.number().int().gte(0),
  folderId: z.string().optional(),
});

export const DocumentSearchSchema = z.object({
  limit: z.coerce.number().int().positive(),
  offset: z.coerce.number().int().gte(0),
  search: z.string(),
  folderId: z.string().optional(),
});

export const DocumentCreateSchema = z.object({
  name: z.string(),
  key: z.string(),
  userId: z.string(),
  sizeBytes: z.int().positive(),
  folderId: z.string().optional(),
  status: z.enum(documentStatusEnum.enumValues),
});

export const SharedDocumentCreateSchema = z.object({
  userId: z.string(),
  expiresAt: z.coerce.date(),
});

export const DocumentUpdateSchema = z.object({
  name: z.string().optional(),
  folderId: z.string().optional(),
  status: z.enum(documentStatusEnum.enumValues).optional(),
});

export type DocumentGetAllDTO = z.infer<typeof DocumentGetAllSchema>;
export type DocumentSearchDTO = z.infer<typeof DocumentSearchSchema>;
export type DocumentCreateDTO = z.infer<typeof DocumentCreateSchema>;
export type SharedDocumentCreateDTO = z.infer<
  typeof SharedDocumentCreateSchema
>;
export type DocumentUpdateDTO = z.infer<typeof DocumentUpdateSchema>;
