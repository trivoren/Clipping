/**
 * WordByWord — Subtítulos palabra por palabra de precisión quirúrgica.
 *
 * - Usa @remotion/captions con tiempos exactos en milisegundos.
 * - Animación "Karaoke Premium": la palabra activa tiene fondo
 *   #10B981 o #F59E0B, transición suave con spring (damping: 200).
 * - Efecto "Pop": micro-zoom (scale: 1.05) al activarse, vuelve a 1.0
 *   en 3 frames.
 * - Sombra gruesa (text-shadow 0 4px 12px rgba(0,0,0,0.8)) para
 *   legibilidad sobre fondos blancos brillantes.
 */

import * as React from "react";
import { useCurrentFrame, spring, interpolate } from "remotion";
import { CaptionHighlight } from "./CaptionHighlight";
import { useCaptionAnimation } from "../hooks/useCaptionAnimation";
import {
  NUMINATION_COLORS,
  FONT_SIZES,
  SPRINGS,
} from "../../config/tokens";
import type { WordCaption } from "../../schemas/clip.schema";

interface WordByWordProps {
  captions: WordCaption[];
  activeWordIndex: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
  highlightColor: string;
  textColor: string;
  completedTextColor: string;
}

export const WordByWord = React.memo((props: WordByWordProps) => {
  const {
    captions,
    activeWordIndex,
    fps,
    containerWidth,
    containerHeight,
    highlightColor,
    textColor,
    completedTextColor,
  } = props;

  const currentFrame = useCurrentFrame();

  return (
    <div
      style={{
        position: "relative",
        width: containerWidth,
        height: containerHeight,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      {captions.map((word, index) => {
        const isActive = index === activeWordIndex;
        const isCompleted = index < activeWordIndex;

        const animation = useCaptionAnimation({
          word,
          activeWordIndex,
          currentWordIndex: index,
          fps,
        });

        const fontSize = isActive
          ? FONT_SIZES.verticalCaption
          : FONT_SIZES.verticalCaptionMin;
        const textColorResolved = isActive
          ? "#0A0E17"
          : isCompleted
          ? completedTextColor
          : textColor;

        const startFrame = Math.round(word.start * fps);

        // Efecto "Pop": escala 1.05 al activar, vuelve a 1.0 en 3 frames
        const popScale = spring({
          frame: currentFrame,
          fps,
          from: 1,
          to: isActive ? 1.05 : 1,
          config: { damping: 200, stiffness: 600 },
        });

        const animatedFontSize = spring({
          frame: currentFrame,
          fps,
          from: FONT_SIZES.verticalCaptionMin,
          to: fontSize,
          config: {
            damping: SPRINGS.word.damping,
            stiffness: SPRINGS.word.stiffness,
          },
        });

        return (
          <div
            key={index}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <CaptionHighlight
              word={word}
              isActive={isActive}
              isCompleted={isCompleted}
              fps={fps}
              highlightColor={highlightColor}
              wordWidth={animation.estimateWordWidth()}
              baseFontSize={FONT_SIZES.verticalCaptionMin}
              activeFontSize={FONT_SIZES.verticalCaption}
            />
            <div
              style={{
                position: "relative",
                fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
                fontSize: animatedFontSize,
                fontWeight: isActive ? 900 : 700,
                color: textColorResolved,
                textAlign: "center",
                lineHeight: 1.1,
                whiteSpace: "pre-wrap",
                opacity: animation.completedOpacity,
                // Transform combinada: pop + desplazamiento vertical
                transform: `scale(${popScale}) translateY(${animation.yOffset}px)`,
                // Sombra gruesa para legibilidad extrema
                textShadow:
                  "0 4px 12px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.6)",
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {word.word}
            </div>
          </div>
        );
      })}
    </div>
  );
});

WordByWord.displayName = "WordByWord";
