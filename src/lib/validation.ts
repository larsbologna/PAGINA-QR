import { z } from "zod";
import { HEX_COLOR } from "./color";
import { checkGoogleUrl } from "./google-url";
import { isValidSlug, RESERVED_SLUGS } from "./slug";

export const COMMENT_MAX = 1000;
export const NOTE_MAX = 2000;
export const CATEGORY_NAME_MAX = 40;
export const MAX_CATEGORIES_PER_BUSINESS = 12;
export const PASSWORD_MIN = 10;

const trimmed = (max: number) => z.string().trim().max(max);

export const feedbackSubmissionSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  rating: z.number({ invalid_type_error: "La puntuación debe ser un número." }).int().min(1).max(5),
  comment: trimmed(COMMENT_MAX).optional().default(""),
  categoryIds: z.array(z.string().min(1).max(40)).max(MAX_CATEGORIES_PER_BUSINESS).optional().default([]),
  submissionKey: z.string().regex(/^[A-Za-z0-9-]{8,64}$/, "Clave de envío inválida."),
  /** Campo trampa: los humanos no lo ven; si llega completo, es un bot. */
  website: z.string().max(200).optional().default(""),
});
export type FeedbackSubmissionInput = z.input<typeof feedbackSubmissionSchema>;

export const googleUrlSchema = z
  .string()
  .trim()
  .max(500)
  .transform((v, ctx) => {
    if (!v) return null;
    const r = checkGoogleUrl(v);
    if (!r.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.error });
      return z.NEVER;
    }
    return r.url;
  });

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(isValidSlug, "Usá entre 3 y 60 caracteres: letras minúsculas, números y guiones.")
  .refine((s) => !RESERVED_SLUGS.has(s), "Ese identificador está reservado.");

export const brandingSchema = z.object({
  name: z.string().trim().min(2, "El nombre es demasiado corto.").max(80),
  brandColor: z.string().regex(HEX_COLOR, "Usá un color en formato #RRGGBB."),
  welcomeMessage: z.string().trim().min(3).max(120),
  thankYouMessage: z.string().trim().min(3).max(200),
  googleReviewUrl: googleUrlSchema,
});

export const thresholdsSchema = z
  .object({
    positiveMin: z.coerce.number().int().min(2).max(5),
    negativeMax: z.coerce.number().int().min(1).max(4),
  })
  .refine((t) => t.negativeMax < t.positiveMin, {
    message: "La puntuación negativa máxima debe ser menor que la positiva mínima.",
    path: ["negativeMax"],
  });

export const categoryNameSchema = z.string().trim().min(1, "Escribí un nombre.").max(CATEGORY_NAME_MAX);

export const noteSchema = z.string().trim().min(1, "La nota está vacía.").max(NOTE_MAX);

export const emailSchema = z.string().trim().toLowerCase().email("Ingresá un email válido.").max(160);

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`)
  .max(200);

export const createBusinessSchema = z.object({
  name: z.string().trim().min(2, "El nombre es demasiado corto.").max(80),
  slug: z.union([z.literal(""), slugSchema]).optional(),
  industry: z.string().trim().max(40),
  plan: z.enum(["BASICO", "PROFESIONAL", "PREMIUM"]),
  googleReviewUrl: googleUrlSchema.optional(),
  contactEmail: z.union([z.literal(""), emailSchema]).optional(),
  ownerEmail: z.union([z.literal(""), emailSchema]).optional(),
});

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos.";
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
