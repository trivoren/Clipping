/**
 * SplitScreenLayout — Diseño de Doble Pantalla con toque de 10K.
 *
 * Top: MainVideo (podcast) con color grading.
 * Bottom: Fondo de impacto + subtítulos encima.
 *
 * Nuevas capas de calidad extrema:
 * - NoiseOverlay (ruido de película analógico, 5-10% opacidad)
 * - Glow dinámico (gradiente radial sutil en la parte inferior)
 * - Bordes suaves (border-radius y box-shadow de cristal líquido)
 *
 * Usa AbsoluteFill y Flexbox para evitar desbordes.
 */

import * as React from "react";
import { AbsoluteFill } from "remotion";
import { MainVideo } from "../video/MainVideo";
import { BackgroundBlur } from "../video/BackgroundBlur";
import { NoiseOverlay } from "./NoiseOverlay";
import { CaptionContainer } from "../captions/CaptionContainer";
import { WordByWord } from "../captions/WordByWord";
import { ProgressBar } from "../ui/ProgressBar";
import { Watermark } from "../ui/Watermark";
import { NUMINATION_COLORS, LAYOUT } from "../../config/tokens";
import type { WordCaption } from "../../schemas/clip.schema";

interface SplitScreenLayoutProps {
  videoSrc: string;
  width: number;
  height: number;
  splitRatio: number;
  captions: WordCaption[];
  activeWordIndex: number;
  fps: number;
  currentFrame: number;
  totalFrames: number;
  accentColor: string;
  highlightColor: string;
  watermarkText: string;
  backgroundColor: string;
}

export const SplitScreenLayout = React.memo((props: SplitScreenLayoutProps) => {
  const {
    videoSrc,
    width,
    height,
    splitRatio,
    captions,
    activeWordIndex,
    fps,
    currentFrame,
    totalFrames,
    accentColor,
    highlightColor,
    watermarkText,
    backgroundColor,
  } = props;

  const topHeight = height * splitRatio;
  const bottomHeight = height * (1 - splitRatio);

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        backgroundColor,
        overflow: "hidden",
      }}
    >
      {/* ================================================================
         TOP SCREEN: MainVideo (podcast)
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
        <MainVideo
          videoSrc={videoSrc}
          width={width}
          height={topHeight}
          fit="cover"
          opacity={1}
        />

        <BackgroundBlur
          videoSrc={videoSrc}
          width={width}
          height={topHeight}
          blurAmount={50}
          opacity={0.35}
        />

        {/* Ruido de película analógico sobre el video (look analógico premium) */}
        <NoiseOverlay width={width} height={topHeight} opacity={0.06} speed={6} />
      </div>

      {/* ================================================================
         BOTTOM SCREEN: Fondo de impacto + Subtítulos
         ================================================================ */}
      <div
        style={{
          position: "relative",
          width,
          height: bottomHeight,
          backgroundColor: bottomBackgroundColor(backgroundColor),
          overflow: "hidden",
        }}
      >
        {/* Glow dinámico: gradiente radial sutil en la parte inferior
            que ilumina los subtítulos sobre fondos oscuros */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height: bottomHeight * 0.6,
            background: `radial-gradient(circle at 50% 100%, ${accentColor}1a 0%, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {/* Barra de progreso premium */}
        <ProgressBar
          currentFrame={currentFrame}
          totalFrames={totalFrames}
          width={width}
          color={accentColor}
          height={LAYOUT.progressBarHeight}
        />

        {/* Contenedor de subtítulos con efecto cristal y bordes suaves */}
        <CaptionContainer
          width={width * 0.88}
          height={bottomHeight * 0.65}
          glass={true}
        >
          <WordByWord
            captions={captions}
            activeWordIndex={activeWordIndex}
            fps={fps}
            containerWidth={width * 0.82}
            containerHeight={bottomHeight * 0.55}
            highlightColor={highlightColor}
            textColor={NUMINATION_COLORS.textPrimary}
            completedTextColor={NUMINATION_COLORS.textSecondary}
          />
        </CaptionContainer>

        {/* Watermark sutil */}
        <Watermark
          text={watermarkText}
          x={width / 2}
          y={height - 70}
          opacity={0.1}
        />

        {/* Ruido de película también en la mitad inferior (consistencia analógica) */}
        <NoiseOverlay
          width={width}
          height={bottomHeight}
          opacity={0.05}
          speed={5}
        />
      </div>

      <AbsoluteFill style={{ pointerEvents: "none" }} />
    </div>
  );
});

SplitScreenLayout.displayName = "SplitScreenLayout";

function bottomBackgroundColor(base: string): string {
  if (base === NUMINATION_COLORS.deep) {
    return NUMINATION_COLORS.deepVariant;
  }
  return base;
}
