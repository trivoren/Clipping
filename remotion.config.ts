// ============================================================================
// Configuración de Remotion — Calidad Extrema (4K/8K, 10-bit, High Bitrate)
// Numination Labs — Motor de Clipping Premium
// ============================================================================

import * as os from "os";

// ---------------------------------------------------------------
// 1. Códec de salida y bitrate extremo (máxima fidelidad)
// ---------------------------------------------------------------
// CRF 15 = calidad casi sin pérdida perceptible. Estos valores se
// inyectan en los scripts de render (--codec, --crf) y son leídos
// por las herramientas de Remotion en tiempo de ejecución.
export const CODEC = "h264";
export const CRF = 15;

// ---------------------------------------------------------------
// 2. Concurrencia dinámica (50% de los núcleos de CPU)
// ---------------------------------------------------------------
const cpuCores = os.cpus().length;
export const CONCURRENCY = Math.max(1, Math.floor(cpuCores * 0.5));

// ---------------------------------------------------------------
// 3. Escala de render (4K/8K)
// ---------------------------------------------------------------
// Valor base 1 (sin upscale artificial). Se sobrescribe por composición
// cuando el fuente requiere 4K/8K (scale: 2 para 4K, scale: 4 para 8K).
export const DEFAULT_SCALE = 1;

// ---------------------------------------------------------------
// 4. Memoria asignada para render de servidor
// ---------------------------------------------------------------
export const MAX_OLD_SPACE_SIZE = 8192;

export const config = {
  codec: CODEC,
  crf: CRF,
  concurrency: CONCURRENCY,
  defaultScale: DEFAULT_SCALE,
  maxOldSpaceSize: MAX_OLD_SPACE_SIZE,
};
