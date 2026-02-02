"use client";

import React, { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { uploadToCloudinary, getOptimizedImageUrl } from "../lib/cloudinary";
import { cn } from "../lib/utils";

interface CloudinaryImageUploadProps {
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
  folder?: string;
  tags?: string[];
  className?: string;
  maxFileSize?: number; // in MB
  allowedFormats?: string[];
  buttonText?: string;
  uploadPreset?: string;
}

export function CloudinaryImageUpload({
  onUploadComplete,
  onUploadError,
  folder = "car-rental",
  tags = [],
  className,
  maxFileSize = 5,
  allowedFormats = ["jpg", "jpeg", "png", "webp"],
  buttonText = "Upload Image",
  uploadPreset,
}: CloudinaryImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      const errorMsg = `Invalid file format. Allowed: ${allowedFormats.join(", ")}`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      const errorMsg = `File too large. Maximum size: ${maxFileSize}MB`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadToCloudinary(file, {
        folder,
        tags,
        uploadPreset,
      });

      clearInterval(progressInterval);
      setProgress(100);

      onUploadComplete?.(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Upload failed";
      setError(errorMsg);
      onUploadError?.(errorMsg);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [folder, tags, maxFileSize, allowedFormats, onUploadComplete, onUploadError, uploadPreset]);

  const clearPreview = () => {
    setPreview(null);
    setError(null);
    const input = document.getElementById("cloudinary-upload") as HTMLInputElement;
    if (input) input.value = "";
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <input
          id="cloudinary-upload"
          type="file"
          accept={allowedFormats.map(format => `.${format}`).join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("cloudinary-upload")?.click()}
          disabled={uploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {buttonText}
        </Button>

        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearPreview}
            className="flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Uploading... {progress}%
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {preview && (
        <div className="relative rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Preview</p>
              <img
                src={preview}
                alt="Upload preview"
                className="mt-2 h-24 w-24 rounded-md object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
