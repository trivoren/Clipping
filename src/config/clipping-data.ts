/**
 * Datos de ejemplo (mock) para previsualizar el motor de clipping
 * sin depender de archivos externos. Se puede reemplazar con un
 * video real en public/clips/test.mp4.
 */

import type { ClipData } from "../schemas/clip.schema";
import { NUMINATION_COLORS } from "./tokens";

export const WORD_CAPTIONS = [
  { word: "Hola", start: 0.0, end: 0.45 },
  { word: "equipo", start: 0.45, end: 0.9 },
  { word: "de", start: 0.9, end: 1.15 },
  { word: "Numination", start: 1.15, end: 1.8 },
  { word: "Labs", start: 1.8, end: 2.25 },
  { word: "presenta", start: 2.25, end: 2.9 },
  { word: "el", start: 2.9, end: 3.2 },
  { word: "motor", start: 3.2, end: 3.75 },
  { word: "de", start: 3.75, end: 4.0 },
  { word: "clipping", start: 4.0, end: 4.6 },
  { word: "premium", start: 4.6, end: 5.25 },
  { word: "para", start: 5.25, end: 5.6 },
  { word: "videos", start: 5.6, end: 6.15 },
  { word: "verticales", start: 6.15, end: 6.8 },
  { word: "de", start: 6.8, end: 7.1 },
  { word: "alta", start: 7.1, end: 7.55 },
  { word: "calidad", start: 7.55, end: 8.2 },
] as const;

export const CLIP_DATA: ClipData = {
  id: "clip-001",
  title: "Numination Labs - Motor de Clipping Premium",
  videoSrc: "public/clips/test.mp4",
  duration: 8.5,
  width: 1080,
  height: 1920,
  layout: "vertical",
  splitRatio: 0.55,
  captions: [...WORD_CAPTIONS],
  backgroundColor: NUMINATION_COLORS.deep,
  accentColor: NUMINATION_COLORS.primary,
  highlightColor: NUMINATION_COLORS.success,
  watermarkText: "NUMINATION LABS",
  progressBarColor: NUMINATION_COLORS.primary,
};
