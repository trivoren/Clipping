/**
 * Fondo desenfocado (blur) para cuando el video no llene la pantalla.
 * Crea un efecto de profundidad premium detrás del contenido principal.
 */

import * as React from "react";
import { Video } from "remotion";
import { NUMINATION_COLORS } from "../../config/tokens";

interface BackgroundBlurProps {
  videoSrc: string;
  width: number;
  height: number;
  blurAmount?: number;
  opacity?: number;
}

export const BackgroundBlur = React.memo((props: BackgroundBlurProps) => {
  const { videoSrc, width, height, blurAmount = 40, opacity = 0.5 } = props;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        backgroundColor: NUMINATION_COLORS.deep,
        overflow: "hidden",
      }}
    >
      <Video
        src={videoSrc}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "120%",
          height: "120%",
          minWidth: "100%",
          minHeight: "100%",
          transform: "translate(-50%, -50%)",
          filter: `blur(${blurAmount}px)`,
          opacity,
          objectFit: "cover",
        }}
      />
    </div>
  );
});

BackgroundBlur.displayName = "BackgroundBlur";
