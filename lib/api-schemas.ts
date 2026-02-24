/**
 * Zod schemas for API request validation.
 */
import { z } from "zod";

export const pasteCreateSchema = z.object({
  content: z.string().max(100_000, "Content too long"),
  language: z.string().max(50).optional(),
});

export const reportSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const marketplaceApplySchema = z.object({
  profileId: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1))
    .optional(),
});
