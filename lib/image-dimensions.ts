export const IMAGE_DIMENSIONS = {
  "16:9": { width: 1280, height: 720, name: "YouTube Landscape" },
  "9:16": { width: 720, height: 1280, name: "Stories/Shorts" },
  "1:1": { width: 1024, height: 1024, name: "Instagram Square" },
} as const;

export type AspectRatio = keyof typeof IMAGE_DIMENSIONS;

export function getDimensions(aspectRatio: AspectRatio) {
  return IMAGE_DIMENSIONS[aspectRatio];
}
