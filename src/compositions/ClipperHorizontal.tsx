/**
 * Composición Horizontal 1920x1080 (YouTube).
 * Misma lógica de doble pantalla, adaptada a formato horizontal.
 */

import * as React from "react";
import { useCurrentFrame } from "remotion";
import { SplitScreenLayout } from "../components/layouts/SplitScreenLayout";
import { useVideoMetadata } from "../components/hooks/useVideoMetadata";
import { CLIP_DATA } from "../config/clipping-data";
import { LAYOUT, FONT_SIZES } from "../config/tokens";
import type { ClipData } from "../schemas/clip.schema";

interface ClipperHorizontalProps {
  clipData?: ClipData;
  durationInFrames: number;
  fps: number;
  width?: number;
  height?: number;
}

export const ClipperHorizontal = (props: ClipperHorizontalProps) => {
  const { clipData = CLIP_DATA, durationInFrames, fps } = props;
  const currentFrame = useCurrentFrame();

  const width = props.width ?? LAYOUT.horizontalWidth;
  const height = props.height ?? LAYOUT.horizontalHeight;

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

ClipperHorizontal.displayName = "ClipperHorizontal";

export const getClipperHorizontalDuration = (
  clipData: ClipData,
  fps: number
) => Math.round(clipData.duration * fps);
