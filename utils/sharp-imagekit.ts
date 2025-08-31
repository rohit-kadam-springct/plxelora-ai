export interface SharpThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
  hasFace?: boolean;
  allowUpscale?: boolean;
  cropMode?: "face" | "auto" | "maintain" | "pad" | "force";
  format?: "auto" | "webp" | "png" | "jpg";
  zoom?: number;
}

export function generateSharpThumbnail(
  imageUrl: string,
  options: SharpThumbnailOptions
): string {
  const {
    width,
    height,
    quality = 90,
    hasFace = false,
    allowUpscale = false,
    cropMode = "auto",
    format = "auto",
    zoom,
  } = options;

  const transforms: string[] = [];

  // Core resize parameters
  transforms.push(`w-${width}`, `h-${height}`);

  // Quality and format
  transforms.push(`q-${quality}`, `f-${format}`);

  // Anti-blur enhancement
  if (allowUpscale) {
    transforms.push("e-upscale");
  } else {
    transforms.push("e-usm-1-2-4-0.005"); // Unsharp mask for sharpness
  }

  // Smart cropping based on content
  if (cropMode === "face" || hasFace) {
    transforms.push("fo-face", "c-pad_resize");
    if (zoom) transforms.push(`z-${zoom}`);
  } else if (cropMode === "auto") {
    transforms.push("fo-auto", "c-at_max");
  } else if (cropMode === "pad") {
    transforms.push("c-pad_resize");
  } else if (cropMode === "force") {
    transforms.push("c-force");
  } else {
    transforms.push("c-at_max"); // Prevent excessive upscaling
  }

  return `${imageUrl}?tr=${transforms.join(",")}`;
}

// Convenient presets for common use cases
export const ThumbnailPresets = {
  // For persona profile images (faces)
  personaProfile: (url: string) =>
    generateSharpThumbnail(url, {
      width: 150,
      height: 150,
      quality: 95,
      hasFace: true,
      cropMode: "face",
      zoom: 0.9,
    }),

  // For small UI avatars
  avatar: (url: string) =>
    generateSharpThumbnail(url, {
      width: 40,
      height: 40,
      quality: 85,
      hasFace: true,
      cropMode: "face",
    }),

  // For dashboard cards
  dashboardCard: (url: string) =>
    generateSharpThumbnail(url, {
      width: 300,
      height: 200,
      quality: 85,
      cropMode: "auto",
    }),

  // For gallery thumbnails
  gallery: (url: string) =>
    generateSharpThumbnail(url, {
      width: 200,
      height: 200,
      quality: 80,
      cropMode: "auto",
    }),
};
