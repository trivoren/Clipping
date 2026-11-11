/**
 * Logo de Numination Labs que aparece sutilmente en pantalla.
 */

import * as React from "react";
import { NUMINATION_COLORS, FONT_SIZES } from "../../config/tokens";

interface WatermarkProps {
  text: string;
  x: number;
  y: number;
  opacity?: number;
}

export const Watermark = React.memo((props: WatermarkProps) => {
  const { text, x, y, opacity = 0.15 } = props;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
        fontSize: FONT_SIZES.watermark,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: NUMINATION_COLORS.primary,
        opacity,
        mixBlendMode: "screen",
        pointerEvents: "none",
        userSelect: "none",
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
});

Watermark.displayName = "Watermark";
