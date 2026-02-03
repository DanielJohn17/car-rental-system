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
  options: CloudinaryUploadOptions = {},
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in apps/web/.env.local",
    );
  }

  const uploadPreset =
    options.uploadPreset || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!uploadPreset) {
    throw new Error(
      "Cloudinary upload preset is not configured. Set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in apps/web/.env.local",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

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
    formData.append(
      "context",
      Object.entries(options.context)
        .map(([key, value]) => `${key}=${value}`)
        .join("|"),
    );
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const result = (await response.json()) as Record<string, unknown>;
  const secureUrl =
    (result["secure_url"] as string | undefined) ||
    (result["secureUrl"] as string | undefined) ||
    "";
  const publicId =
    (result["public_id"] as string | undefined) ||
    (result["publicId"] as string | undefined) ||
    "";

  return {
    publicId,
    secureUrl,
    width:
      (result["width"] as number | undefined) ||
      (result["original_width"] as number | undefined) ||
      0,
    height:
      (result["height"] as number | undefined) ||
      (result["original_height"] as number | undefined) ||
      0,
    format: (result["format"] as string | undefined) || "",
    resourceType:
      (result["resource_type"] as string | undefined) ||
      (result["resourceType"] as string | undefined) ||
      "image",
    bytes: (result["bytes"] as number | undefined) || 0,
    createdAt:
      (result["created_at"] as string | undefined) ||
      (result["createdAt"] as string | undefined) ||
      new Date().toISOString(),
    tags: (result["tags"] as string[] | undefined) || options.tags || [],
    context:
      (result["context"] as Record<string, string> | undefined) ||
      options.context,
  };
}

export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {},
): string {
  const {
    width,
    height,
    crop = "fill",
    quality = "auto",
    format = "auto",
  } = options;

  return cld
    .image(publicId)
    .resize(
      fill()
        .width(width || 400)
        .height(height || 300),
    )
    .format(format)
    .quality(quality)
    .toURL();
}

export function getThumbnailUrl(publicId: string, size: number = 150): string {
  return cld
    .image(publicId)
    .resize(fill().width(size).height(size))
    .format("auto")
    .quality("auto")
    .toURL();
}
