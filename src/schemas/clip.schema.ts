/**
 * Esquema de Zod para validar los props del motor de clipping.
 * Se usa tanto en TypeScript como en tiempo de ejecución para
 * garantizar integridad de datos entre capas.
 */

import { z } from "zod";

export const WordCaptionSchema = z.object({
  word: z.string().min(1),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
});

export type WordCaption = z.infer<typeof WordCaptionSchema>;

export const ClipDataSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  videoSrc: z.string().url().or(z.string().min(1)),
  duration: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  layout: z.enum(["vertical", "horizontal"]),
  splitRatio: z.number().min(0).max(1).default(0.5),
  captions: z.array(WordCaptionSchema),
  backgroundColor: z.string().default("#0A0E17"),
  accentColor: z.string().default("#2563EB"),
  highlightColor: z.string().default("#10B981"),
  watermarkText: z.string().optional(),
  progressBarColor: z.string().default("#2563EB"),
});

export type ClipData = z.infer<typeof ClipDataSchema>;

export const CompositionPropsSchema = z.object({
  clipData: ClipDataSchema,
  currentFrame: z.number().nonnegative(),
  totalFrames: z.number().positive(),
  fps: z.number().positive(),
});

export type CompositionProps = z.infer<typeof CompositionPropsSchema>;
