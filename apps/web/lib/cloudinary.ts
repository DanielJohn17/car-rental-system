import { Cloudinary } from "@cloudinary/url-gen";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { byRadius } from "@cloudinary/url-gen/actions/roundCorners";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";

export const cld = new Cloudinary({
  cloud: {
    cloudName: cloudName,
  },
  url: {
    secure: true,
  },
});

export interface CloudinaryUploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: any[];
  tags?: string[];
  context?: Record<string, string>;
  uploadPreset?: string;
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  resourceType: string;
  bytes: number;
  createdAt: string;
  tags: string[];
  context?: Record<string, string>;
}

export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned");

  if (options.folder) {
    formData.append("folder", options.folder);
  }

  if (options.publicId) {
    formData.append("public_id", options.publicId);
  }

  if (options.tags) {
    formData.append("tags", options.tags.join(","));
  }

  if (options.context) {
    formData.append("context", Object.entries(options.context).map(([key, value]) => `${key}=${value}`).join("|"));
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error("Cloudinary cloud name is not configured");
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
}

export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}
): string {
  const { width, height, crop = "fill", quality = "auto", format = "auto" } = options;
  
  return cld.image(publicId)
    .resize(fill().width(width || 400).height(height || 300))
    .format(format)
    .quality(quality)
    .toURL();
}

export function getThumbnailUrl(
  publicId: string,
  size: number = 150
): string {
  return cld.image(publicId)
    .resize(fill().width(size).height(size))
    .format("auto")
    .quality("auto")
    .toURL();
}
