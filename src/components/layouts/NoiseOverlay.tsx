/**
 * NoiseOverlay — Ruido de película analógico (Film Grain).
 *
 * Genera ruido de grano orgánico usando un SVG con feTurbulence en modo
 * fractalNoise. Se mueve sutilmente frame a frame mediante una animación
 * de transformación de la turbulencia, dando un look analógico premium
 * que evita que el video se vea "plástico" o digital.
 *
 * Opacidad: 5-10% (sutil, no distractor).
 */

import * as React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { NUMINATION_COLORS } from "../../config/tokens";

interface NoiseOverlayProps {
  width: number;
  height: number;
  opacity?: number;
  speed?: number;
}

export const NoiseOverlay = React.memo((props: NoiseOverlayProps) => {
  const { width, height, opacity = 0.07, speed = 4 } = props;

  const currentFrame = useCurrentFrame();

  // Animación de la base de turbulencia para que el grano se mueva
  const baseFrequencyX = interpolate(
    currentFrame,
    [0, speed, speed * 2],
    [0.015, 0.025, 0.015],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const baseFrequencyY = interpolate(
    currentFrame,
    [0, speed, speed * 2],
    [0.015, 0.025, 0.015],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: "none",
        opacity,
        zIndex: 100,
        mixBlendMode: "overlay",
      }}
    >
      <svg
        width={width}
        height={height}
        style={{ display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${baseFrequencyX} ${baseFrequencyY}`}
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0"
            />
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="1 0" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          filter="url(#grain)"
          fill={NUMINATION_COLORS.textPrimary}
        />
      </svg>
    </div>
  );
});

NoiseOverlay.displayName = "NoiseOverlay";
