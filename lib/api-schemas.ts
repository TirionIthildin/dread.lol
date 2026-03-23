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

const MAX_TEMPLATE_DATA_BYTES = 500_000;

/** Optional schema for template data structure. Used for docs; actual sanitization is in sanitizeTemplateData. */
export const templateDataSchema = z
  .object({
    tagline: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    accentColor: z.string().nullable().optional(),
    useTerminalLayout: z.boolean().optional(),
    gallery: z
      .array(z.object({ imageUrl: z.string(), title: z.string().optional(), description: z.string().optional() }))
      .max(50)
      .optional()
      .nullable(),
    audioTracks: z
      .array(z.object({ url: z.string(), title: z.string().optional() }))
      .max(20)
      .optional()
      .nullable(),
  })
  .passthrough();

/** Template creation schema. Validates name, optional data, and limits payload size. */
export const marketplaceTemplateCreateSchema = z
  .object({
    fromProfileId: z.string().min(1).optional(),
    name: z.string().max(200).optional(),
    description: z.string().max(2000).optional(),
    previewUrl: z.string().max(2048).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (val) => {
      if (!val.data || typeof val.data !== "object") return true;
      try {
        return new TextEncoder().encode(JSON.stringify(val.data)).length <= MAX_TEMPLATE_DATA_BYTES;
      } catch {
        return false;
      }
    },
    { message: `Template data exceeds ${MAX_TEMPLATE_DATA_BYTES / 1024}KB limit` }
  );

/** Local account registration: client-derived SRP salt + verifier (hex). */
export const localRegisterSchema = z.object({
  username: z.string().min(1).max(40),
  email: z.string().email().max(320),
  srpSalt: z.string().regex(/^[0-9a-fA-F]{64}$/, "Salt must be 64 hex chars"),
  srpVerifier: z.string().min(2).max(2000),
});
