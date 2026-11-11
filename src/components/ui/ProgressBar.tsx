/**
 * Barra de progreso premium en la parte superior de la pantalla.
 * Avanza de izquierda a derecha usando interpolate basado en
 * useCurrentFrame() y durationInFrames.
 */

import * as React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { NUMINATION_COLORS, LAYOUT } from "../../config/tokens";

interface ProgressBarProps {
  currentFrame: number;
  totalFrames: number;
  width: number;
  color?: string;
  height?: number;
}

export const ProgressBar = React.memo((props: ProgressBarProps) => {
  const {
    currentFrame,
    totalFrames,
    width,
    color = NUMINATION_COLORS.primary,
    height = LAYOUT.progressBarHeight,
  } = props;

  const progress = Math.min(currentFrame / totalFrames, 1);
  const fillWidth = interpolate(
    currentFrame,
    [0, totalFrames],
    [0, width],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        top: LAYOUT.progressBarTop,
        left: 0,
        width,
        height,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderRadius: height / 2,
        overflow: "hidden",
        zIndex: 50,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: fillWidth,
          height,
          backgroundColor: color,
          borderRadius: height / 2,
          boxShadow: `0 0 16px ${color}40`,
        }}
      />
    </div>
  );
});

ProgressBar.displayName = "ProgressBar";
