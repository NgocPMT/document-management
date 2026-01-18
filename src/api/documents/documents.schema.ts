import * as z from "zod";
import { documentStatusEnum } from "../../db/schema";

export const DocumentCreateSchema = z.object({
  name: z.string(),
  userId: z.string(),
  sizeBytes: z.int().positive(),
  folderId: z.string().optional(),
  status: z.enum(documentStatusEnum.enumValues),
});

export const DocumentUpdateSchema = z.object({
  name: z.string().optional(),
  folderId: z.string().optional(),
  status: z.enum(documentStatusEnum.enumValues).optional(),
});

export type DocumentCreateDTO = z.infer<typeof DocumentCreateSchema>;
export type DocumentUpdateDTO = z.infer<typeof DocumentUpdateSchema>;
