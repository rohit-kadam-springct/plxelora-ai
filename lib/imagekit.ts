import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export interface UploadResult {
  success: boolean;
  url?: string;
  fileId?: string;
  error?: string;
}

// Upload base64 image to ImageKit
export async function uploadToImageKit(
  base64Data: string,
  filename: string
): Promise<UploadResult> {
  try {
    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^image\/[a-zA-Z]+;base64,/, "");

    const result = await imagekit.upload({
      file: base64String,
      fileName: filename,
      folder: "/thumbnails/",
      useUniqueFileName: true,
      responseFields: ["url", "fileId", "name", "size"],
    });

    return {
      success: true,
      url: result.url,
      fileId: result.fileId,
    };
  } catch (error: any) {
    console.error("ImageKit upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload to ImageKit",
    };
  }
}

// Generate optimized URL with transformations
export function getOptimizedUrl(
  imageUrl: string,
  transformations?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "webp" | "png" | "jpg";
  }
): string {
  if (!transformations) return imageUrl;

  const params: string[] = [];

  if (transformations.width) params.push(`w-${transformations.width}`);
  if (transformations.height) params.push(`h-${transformations.height}`);
  if (transformations.quality) params.push(`q-${transformations.quality}`);
  if (transformations.format) params.push(`f-${transformations.format}`);

  return params.length > 0 ? `${imageUrl}?tr=${params.join(",")}` : imageUrl;
}

// Delete image from ImageKit
export async function deleteFromImageKit(fileId: string): Promise<boolean> {
  try {
    await imagekit.deleteFile(fileId);
    return true;
  } catch (error) {
    console.error("ImageKit delete error:", error);
    return false;
  }
}

export default imagekit;
