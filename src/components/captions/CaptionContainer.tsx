/**
 * Contenedor de la caja de subtítulos con efecto cristal (glassmorphism).
 */

import * as React from "react";
import { NUMINATION_COLORS, NUMINATION_SHADOWS, LAYOUT } from "../../config/tokens";

interface CaptionContainerProps {
  children: React.ReactNode;
  width: number;
  height: number;
  glass?: boolean;
}

export const CaptionContainer = React.memo((props: CaptionContainerProps) => {
  const { children, width, height, glass = true } = props;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        ...(glass
          ? {
              background: "rgba(10, 14, 23, 0.55)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 24,
              boxShadow: NUMINATION_SHADOWS.glass,
              padding: 32,
            }
          : {}),
      }}
    >
      {children}
    </div>
  );
});

CaptionContainer.displayName = "CaptionContainer";
