import * as z from "zod";

export const FolderCreateSchema = z.object({
  name: z.string(),
});

export const FolderUpdateSchema = z.object({
  name: z.string().optional(),
});

export type FolderCreateDTO = z.infer<typeof FolderCreateSchema>;
export type FolderUpdateDTO = z.infer<typeof FolderUpdateSchema>;
