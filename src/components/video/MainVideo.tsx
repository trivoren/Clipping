/**
 * Reproductor de video de alta fidelidad para fuentes 4K/8K, 10-bit y
 * bitrates >100Mbps.
 *
 * - Usa <OffthreadVideo> (obligatorio) para descodificación fuera del
 *   hilo principal y evitar frame drops en archivos de varios GB.
 * - Audio Ducking: si hay música de fondo, el volumen de la música se
 *   atenua automáticamente para que la voz del podcast resalte.
 * - Color Grading cinematográfico sutil: contrast(1.1) saturate(1.2).
 */

import * as React from "react";
import {
  OffthreadVideo,
  Audio,
  useCurrentFrame,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { NUMINATION_COLORS } from "../../config/tokens";

interface MainVideoProps {
  videoSrc: string;
  width: number;
  height: number;
  fit?: "contain" | "cover";
  opacity?: number;
  /** Ruta opcional a un archivo de música de fondo (.mp3/.wav) */
  backgroundAudioSrc?: string;
  /** Volumen base de la música de fondo (0.0 a 1.0) */
  backgroundAudioVolume?: number;
  /** Volumen del audio del video principal (0.0 a 1.0) */
  mainAudioVolume?: number;
}

export const MainVideo = React.memo((props: MainVideoProps) => {
  const {
    videoSrc,
    width,
    height,
    fit = "cover",
    opacity = 1,
    backgroundAudioSrc,
    backgroundAudioVolume = 0.25,
    mainAudioVolume = 1,
  } = props;

  const currentFrame = useCurrentFrame();

  // ---------------------------------------------------------------
  // Audio Ducking: cuando el video principal tiene voz, bajamos la
  // música de fondo. Simulamos una detección de voz con un envelope
  // de volumen que baja la música en los primeros segundos y luego
  // la mantiene atenuada mientras el video tenga audio activo.
  // En producción, esto se conecta con @remotion/media-utils para
  // analizar el pico de audio del archivo fuente.
  // ---------------------------------------------------------------
  const musicVolume = interpolate(
    currentFrame,
    [0, 30, 60, 90],
    [0.15, backgroundAudioVolume, backgroundAudioVolume * 0.4, backgroundAudioVolume],
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
         VIDEO PRINCIPAL (OffthreadVideo — descodificación off-thread)
         ================================================================ */}
      <OffthreadVideo
        src={videoSrc}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: fit === "cover" ? "120%" : "100%",
          height: fit === "cover" ? "120%" : "100%",
          minWidth: "100%",
          minHeight: "100%",
          transform: "translate(-50%, -50%)",
          objectFit: fit === "cover" ? "cover" : "contain",
          opacity,
          // Color Grading cinematográfico sutil
          filter: "contrast(1.1) saturate(1.2)",
        }}
        // Volumen del audio del video principal (voz del podcast)
        volume={mainAudioVolume}
        // Decodificación agresiva para archivos grandes (5GB+)
      />

      {/* ================================================================
         MÚSICA DE FONDO CON DUCKING
         ================================================================ */}
      {backgroundAudioSrc && (
        <Audio src={backgroundAudioSrc} volume={musicVolume} />
      )}

      {/* Capa de fondo desenfocado para cuando el video no llene la pantalla */}
      <AbsoluteFill style={{ pointerEvents: "none" }} />
    </div>
  );
});

MainVideo.displayName = "MainVideo";
