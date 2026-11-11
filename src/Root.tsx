/**
 * Registro de composiciones de Remotion.
 * Exporta ClipperVertical, ClipperHorizontal y AutoClip para que
 * el preview de Remotion y getCompositions() puedan descubrirlas.
 */

import { ClipperVertical } from "./compositions/ClipperVertical";
import { ClipperHorizontal } from "./compositions/ClipperHorizontal";
import { AutoClip } from "./compositions/AutoClip";
import { CLIP_DATA } from "./config/clipping-data";
import type { ClipData } from "./schemas/clip.schema";

export {
  ClipperVertical,
  ClipperHorizontal,
  AutoClip,
  CLIP_DATA,
};
export type { ClipData };

export const Root = () => {
  return (
    <ClipperVertical
      clipData={CLIP_DATA}
      durationInFrames={Math.round(CLIP_DATA.duration * 30)}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};

Root.displayName = "Root";
