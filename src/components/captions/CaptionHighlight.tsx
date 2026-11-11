/**
 * CaptionHighlight — Caja de resaltado que sigue a la palabra activa.
 *
 * Transición suave usando spring() con damping: 200 (muy estable, sin
 * rebote excesivo). La palabra activa tiene fondo de color; la palabra
 * anterior se desvanece ligeramente.
 */

import * as React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import { NUMINATION_COLORS } from "../../config/tokens";
import type { WordCaption } from "../../schemas/clip.schema";

interface CaptionHighlightProps {
  word: WordCaption;
  isActive: boolean;
  isCompleted: boolean;
  fps: number;
  highlightColor: string;
  wordWidth: number;
  baseFontSize: number;
  activeFontSize: number;
}

export const CaptionHighlight = React.memo((props: CaptionHighlightProps) => {
  const {
    word,
    isActive,
    isCompleted,
    fps,
    highlightColor,
    wordWidth,
    baseFontSize,
    activeFontSize,
  } = props;

  const currentFrame = useCurrentFrame();
  const startFrame = Math.round(word.start * fps);
  const endFrame = Math.round(word.end * fps);

  if (!isActive && !isCompleted) {
    return null;
  }

  // Spring con damping: 200 — transición estable y premium
  const width = spring({
    frame: currentFrame,
    fps,
    from: 0,
    to: wordWidth * 1.25,
    config: { damping: 200, stiffness: 400 },
  });

  const height = spring({
    frame: currentFrame,
    fps,
    from: baseFontSize * 0.5,
    to: activeFontSize * 1.5,
    config: { damping: 200, stiffness: 400 },
  });

  const opacity = isCompleted ? 0.4 : 1;

  const x = -width / 2;
  const y = -(activeFontSize * 1.5) / 2;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width,
        height,
        transform: `translate(${x}px, ${y}px)`,
        backgroundColor: isCompleted ? "#1F2937" : highlightColor,
        borderRadius: 14,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
});

CaptionHighlight.displayName = "CaptionHighlight";
