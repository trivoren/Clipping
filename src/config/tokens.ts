/**
 * Design Tokens de Numination Labs
 * Paleta modo profundo, acentos premium, springs y tipografía.
 */

export const NUMINATION_COLORS = {
  // Fondo profundo (modo oscuro)
  deep: "#0A0E17",
  deepVariant: "#121826",
  surface: "#161E2E",
  // Acentos Numination Labs
  primary: "#2563EB",      // Azul Numination
  primaryHover: "#3B82F6",
  success: "#10B981",      // Verde resaltado palabra activa
  warning: "#F59E0B",      // Ámbar alternativo
  // Texto
  textPrimary: "#FFFFFF",
  textSecondary: "#8B9BB4", // Palabras ya pronunciadas
  textMuted: "#4B5563",
  // Bordes y sombras
  border: "#1F2937",
  borderSoft: "#2D3748",
} as const;

export const NUMINATION_SHADOWS = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  glass: "0 8px 32px 0 rgb(0 0 0 / 0.37)",
} as const;

export const SPRINGS = {
  // Spring de entrada/salida de cada palabra (estilo Hormozi)
  word: { damping: 20, stiffness: 200 },
  // Spring de contenedor de subtítulos
  container: { damping: 15, stiffness: 180 },
  // Spring de barra de progreso
  progress: { damping: 25, stiffness: 220 },
} as const;

export const TYPOGRAPHY = {
  heading: "Plus Jakarta Sans",
  body: "Inter",
  mono: "Inter",
} as const;

export const LAYOUT = {
  // Vertical (TikTok/Reels/Shorts)
  verticalWidth: 1080,
  verticalHeight: 1920,
  // Horizontal (YouTube)
  horizontalWidth: 1920,
  horizontalHeight: 1080,
  // Split ratios
  splitRatioDefault: 0.5, // 50/50
  splitRatioTopHeavy: 0.6, // 60/40
  // Subtitle safe zones
  subtitleTop: 1250,      // Posición Y base para subtítulos en vertical
  subtitleBottom: 1750,
  subtitleHorizontalY: 850,
  // Padding
  padding: 40,
  // Progress bar
  progressBarHeight: 6,
  progressBarTop: 0,
} as const;

export const FONT_SIZES = {
  verticalCaption: 56,
  verticalCaptionMin: 44,
  horizontalCaption: 48,
  progressBar: 14,
  watermark: 20,
} as const;
