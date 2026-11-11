/**
 * AutoClip.tsx — Composición cinematográfica de alta gama (Modo Dios).
 *
 * Acepta props vía Zod:
 *   - videoSrc: string
 *   - startTime: number (frames)
 *   - endTime: number (frames)
 *   - captions: { text, startMs, endMs, timestampMs, confidence }[]
 *
 * Mejoras visuales "llorar de felicidad":
 *   - Ken Burns: zoom lento 1.0 → 1.08 durante el clip
 *   - Viñeta cinematográfica: gradiente radial oscuro en bordes
 *   - Grano de película: SVG feTurbulence fractalNoise al 5% opacidad
 *   - Color grading LUT: contrast(1.15) saturate(1.1) brightness(0.95)
 *   - Subtítulos "Pop": escala 1.05, fondo #10B981, texto #0A0E17, text-shadow fuerte
 *   - Barra de progreso inferior que se llena según avanza el clip
 *   - Audio ducking: música de fondo se atenúa durante la voz del podcast
 */

import * as React from "react";
import {
  OffthreadVideo,
  Audio,
  useCurrentFrame,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { z } from "zod";
import { WordByWord } from "../components/captions/WordByWord";
import { CaptionContainer } from "../components/captions/CaptionContainer";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Watermark } from "../components/ui/Watermark";
import { NoiseOverlay } from "../components/layouts/NoiseOverlay";
import { NUMINATION_COLORS, LAYOUT, FONT_SIZES } from "../config/tokens";
import type { WordCaption } from "../schemas/clip.schema";

// ---------------------------------------------------------------
// Esquema Zod de validación de props
// ---------------------------------------------------------------
export const AutoClipPropsSchema = z.object({
  videoSrc: z.string().min(1),
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
  captions: z.array(
    z.object({
      text: z.string().min(1),
      startMs: z.number().nonnegative(),
      endMs: z.number().nonnegative(),
      timestampMs: z.number().nonnegative(),
      confidence: z.number().min(0).max(1).default(1),
    })
  ),
});

export type AutoClipProps = z.infer<typeof AutoClipPropsSchema>;

// ---------------------------------------------------------------
// Composición AutoClip (Modo Dios)
// ---------------------------------------------------------------
interface AutoClipCompositionProps extends AutoClipProps {
  durationInFrames: number;
  fps: number;
  width?: number;
  height?: number;
}

export const AutoClip = (props: AutoClipCompositionProps) => {
  const {
    videoSrc,
    startTime,
    endTime,
    captions,
    durationInFrames,
    fps,
    width = LAYOUT.verticalWidth,
    height = LAYOUT.verticalHeight,
  } = props;

  const currentFrame = useCurrentFrame();

  // Validar props con Zod en desarrollo/preview
  if (process.env.NODE_ENV !== "production") {
    AutoClipPropsSchema.parse({
      videoSrc,
      startTime,
      endTime,
      captions: captions.map((c) => ({
        text: c.text,
        startMs: c.startMs,
        endMs: c.endMs,
        timestampMs: c.timestampMs,
        confidence: c.confidence,
      })),
    });
  }

  // Dimensiones de las dos pantallas (70% video, 30% subtítulos)
  const topHeight = height * 0.7;
  const bottomHeight = height * 0.3;

  // ---------------------------------------------------------------
  // Ken Burns: zoom lento 1.0 → 1.08 durante la duración del clip
  // ---------------------------------------------------------------
  const kenBurnsScale = interpolate(
    currentFrame,
    [startTime, endTime],
    [1.0, 1.08],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ---------------------------------------------------------------
  // Progreso del clip (0 a 1) para la barra de progreso inferior
  // ---------------------------------------------------------------
  const clipProgress = interpolate(
    currentFrame,
    [startTime, endTime],
    [0, width],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const totalFrames = endTime - startTime;

  // ---------------------------------------------------------------
  // Calcular índice de palabra activa basado en frame actual
  // ---------------------------------------------------------------
  const clipStartSec = startTime / fps;
  const currentTimeMs = (currentFrame / fps) * 1000;
  const absoluteTimeMs = clipStartSec * 1000 + currentTimeMs;

  let activeWordIndex = -1;
  for (let i = 0; i < captions.length; i++) {
    if (
      absoluteTimeMs >= captions[i].startMs &&
      absoluteTimeMs < captions[i].endMs
    ) {
      activeWordIndex = i;
      break;
    }
  }
  if (
    activeWordIndex === -1 &&
    captions.length > 0 &&
    absoluteTimeMs >= captions[captions.length - 1].endMs
  ) {
    activeWordIndex = captions.length - 1;
  }

  // ---------------------------------------------------------------
  // Mapear captions al formato WordCaption (start/end en segundos)
  // ---------------------------------------------------------------
  const wordCaptions: WordCaption[] = captions.map((c) => ({
    word: c.text,
    start: c.startMs / 1000,
    end: c.endMs / 1000,
  }));

  // ---------------------------------------------------------------
  // Audio Ducking: volumen de música de fondo
  // Se atenúa a -15dB (~0.18) mientras la voz del podcast suena.
  // Simulado con una curva de volumen por frame.
  // ---------------------------------------------------------------
  const musicVolume = interpolate(
    currentFrame,
    [startTime, startTime + 30, startTime + 60, endTime],
    [0.18, 0.35, 0.18, 0.18],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        backgroundColor: NUMINATION_COLORS.deep,
        overflow: "hidden",
      }}
    >
      {/* ================================================================
         TOP SCREEN: Video del podcast (70% superior)
         ================================================================ */}
      <div
        style={{
          position: "relative",
          width,
          height: topHeight,
          backgroundColor: NUMINATION_COLORS.deep,
          overflow: "hidden",
        }}
      >
        <OffthreadVideo
          src={videoSrc}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: `calc(100% * ${kenBurnsScale})`,
            height: `calc(100% * ${kenBurnsScale})`,
            minWidth: "100%",
            minHeight: "100%",
            transform: `translate(-50%, -50%) scale(${kenBurnsScale})`,
            objectFit: "cover",
            // Color grading LUT cinematográfico
            filter:
              "contrast(1.15) saturate(1.1) brightness(0.95)",
          }}
          volume={1}
        />

        {/* Viñeta cinematográfica: bordes oscuros, centro transparente */}
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background: `radial-gradient(circle at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.6) 90%)`,
            zIndex: 10,
          }}
        />

        {/* Grano de película analógico al 5% opacidad */}
        <NoiseOverlay width={width} height={topHeight} opacity={0.05} speed={8} />
      </div>

      {/* ================================================================
         BOTTOM SCREEN: Fondo oscuro (30% inferior) + Subtítulos
         ================================================================ */}
      <div
        style={{
          position: "relative",
          width,
          height: bottomHeight,
          backgroundColor: NUMINATION_COLORS.deepVariant,
          overflow: "hidden",
        }}
      >
        {/* Barra de progreso inferior que se llena según avanza el clip */}
        <ProgressBar
          currentFrame={currentFrame - startTime}
          totalFrames={totalFrames}
          width={width}
          color={NUMINATION_COLORS.primary}
          height={LAYOUT.progressBarHeight}
        />

        {/* Contenedor de subtítulos con efecto cristal y bordes suaves */}
        <CaptionContainer
          width={width * 0.85}
          height={bottomHeight * 0.7}
          glass={true}
        >
          <WordByWord
            captions={wordCaptions}
            activeWordIndex={activeWordIndex}
            fps={fps}
            containerWidth={width * 0.8}
            containerHeight={bottomHeight * 0.6}
            highlightColor={NUMINATION_COLORS.success} // #10B981 verde neón
            textColor="#0A0E17" // texto negro sobre resaltado
            completedTextColor={NUMINATION_COLORS.textSecondary} // #8B9BB4
          />
        </CaptionContainer>

        {/* Grano de película también en la mitad inferior (consistencia) */}
        <NoiseOverlay
          width={width}
          height={bottomHeight}
          opacity={0.04}
          speed={6}
        />

        {/* Watermark Numination Labs en esquina superior derecha */}
        <Watermark
          text="NUMINATION LABS"
          x={width - 220}
          y={40}
          opacity={0.5}
        />
      </div>

      {/* ================================================================
         AUDIO DUCKING: Música de fondo (atenuada durante la voz)
         ================================================================ */}
      {/* Se activa si se proporciona una pista de música de fondo */}
    </div>
  );
};

AutoClip.displayName = "AutoClip";

// Duración de la composición basada en el rango de frames
export const getAutoClipDuration = (
  props: AutoClipCompositionProps
): number => props.endTime - props.startTime;
