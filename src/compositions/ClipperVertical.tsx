/**
 * Composición Vertical 1080x1920 (TikTok / Reels / Shorts).
 * Diseño de Doble Pantalla con subtítulos dinámicos palabra por palabra.
 */

import * as React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { SplitScreenLayout } from "../components/layouts/SplitScreenLayout";
import { useVideoMetadata } from "../components/hooks/useVideoMetadata";
import { CLIP_DATA } from "../config/clipping-data";
import {
  NUMINATION_COLORS,
  LAYOUT,
  FONT_SIZES,
} from "../config/tokens";
import type { ClipData } from "../schemas/clip.schema";

interface ClipperVerticalProps {
  clipData?: ClipData;
  durationInFrames: number;
  fps: number;
  width?: number;
  height?: number;
}

export const ClipperVertical = (props: ClipperVerticalProps) => {
  const { clipData = CLIP_DATA, durationInFrames, fps } = props;
  const currentFrame = useCurrentFrame();

  const width = props.width ?? LAYOUT.verticalWidth;
  const height = props.height ?? LAYOUT.verticalHeight;

  const metadata = useVideoMetadata(clipData);

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        backgroundColor: clipData.backgroundColor,
        overflow: "hidden",
      }}
    >
      <SplitScreenLayout
        videoSrc={clipData.videoSrc}
        width={width}
        height={height}
        splitRatio={clipData.splitRatio}
        captions={clipData.captions}
        activeWordIndex={metadata.getActiveWordIndex()}
        fps={fps}
        currentFrame={currentFrame}
        totalFrames={durationInFrames}
        accentColor={clipData.accentColor}
        highlightColor={clipData.highlightColor}
        watermarkText={clipData.watermarkText ?? "NUMINATION LABS"}
        backgroundColor={clipData.backgroundColor}
      />
    </div>
  );
};

ClipperVertical.displayName = "ClipperVertical";

export const getClipperVerticalDuration = (
  clipData: ClipData,
  fps: number
) => Math.round(clipData.duration * fps);
