/**
 * Hook que calcula los springs de entrada/salida de cada palabra
 * para la animación estilo Hormozi / TikTok.
 */

import {
  spring,
  interpolate,
  useCurrentFrame,
} from "remotion";
import type { WordCaption } from "../../schemas/clip.schema";

interface UseCaptionAnimationProps {
  word: WordCaption;
  activeWordIndex: number;
  currentWordIndex: number;
  fps: number;
}

export function useCaptionAnimation({
  word,
  activeWordIndex,
  currentWordIndex,
  fps,
}: UseCaptionAnimationProps) {
  const currentFrame = useCurrentFrame();

  const startFrame = Math.round(word.start * fps);
  const endFrame = Math.round(word.end * fps);
  const isActive = currentWordIndex === activeWordIndex;
  const isCompleted = currentWordIndex < activeWordIndex;
  const isUpcoming = currentWordIndex > activeWordIndex;

  // Spring de escala para la palabra activa (entrada con rebote suave)
  const scale = spring({
    frame: currentFrame,
    fps,
    from: 0.85,
    to: 1,
    config: { damping: 20, stiffness: 200 },
  });

  // Opacidad basada en estado
  const completedOpacity = isCompleted ? 0.5 : isActive ? 1 : 0.2;

  // Offset vertical para la palabra activa (sube y baja suavemente)
  const yOffset = isActive
    ? spring({
        frame: currentFrame,
        fps,
        from: 12,
        to: 0,
        config: { damping: 20, stiffness: 200 },
      })
    : 0;

  const getTextColor = (): string => {
    if (isActive) return "#0A0E17";
    if (isCompleted) return "#8B9BB4";
    return "#FFFFFF";
  };

  const getHighlightColor = (): string => {
    if (isActive) return "#10B981";
    if (isCompleted) return "transparent";
    return "transparent";
  };

  const estimateWordWidth = (): number => {
    const baseSize = isActive ? 64 : 48;
    const charWidth = baseSize * 0.55;
    return word.word.length * charWidth * (isActive ? 1.05 : 1);
  };

  return {
    currentFrame,
    startFrame,
    endFrame,
    scale,
    completedOpacity,
    yOffset,
    isActive,
    isCompleted,
    isUpcoming,
    getTextColor,
    getHighlightColor,
    estimateWordWidth,
  };
}
