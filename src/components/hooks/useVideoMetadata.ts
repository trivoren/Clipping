/**
 * Hook para calcular duraciones, aspect ratios y metadatos de video.
 * Isolado y reutilizable en cualquier composición.
 */

import { useVideoConfig, useCurrentFrame } from "remotion";
import type { WordCaption, ClipData } from "../../schemas/clip.schema";

export function useVideoMetadata(clipData: ClipData) {
  const config = useVideoConfig();
  const currentFrame = useCurrentFrame();

  const fps = config?.fps ?? 30;
  const totalFrames = Math.round(clipData.duration * fps);
  const progress = Math.min(currentFrame / totalFrames, 1);
  const progressPercent = progress * 100;
  const timeInSeconds = currentFrame / fps;
  const remainingTime = Math.max(clipData.duration - timeInSeconds, 0);

  const aspectRatio = clipData.width / clipData.height;
  const isVertical = clipData.layout === "vertical";
  const isHorizontal = clipData.layout === "horizontal";

  const getActiveWordIndex = (): number => {
    if (!clipData.captions || clipData.captions.length === 0) return -1;
    for (let i = 0; i < clipData.captions.length; i++) {
      if (
        timeInSeconds >= clipData.captions[i].start &&
        timeInSeconds < clipData.captions[i].end
      ) {
        return i;
      }
    }
    if (timeInSeconds >= clipData.duration) {
      return clipData.captions.length - 1;
    }
    return 0;
  };

  const getActiveWord = () => {
    const idx = getActiveWordIndex();
    return idx >= 0 ? clipData.captions[idx] : null;
  };

  const getCompletedWords = (): WordCaption[] => {
    const idx = getActiveWordIndex();
    if (idx <= 0) return [];
    return clipData.captions.slice(0, idx);
  };

  return {
    fps,
    currentFrame,
    totalFrames,
    progress,
    progressPercent,
    timeInSeconds,
    remainingTime,
    aspectRatio,
    isVertical,
    isHorizontal,
    duration: clipData.duration,
    getActiveWordIndex,
    getActiveWord,
    getCompletedWords,
  };
}
