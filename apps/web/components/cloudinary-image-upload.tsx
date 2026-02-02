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
  multiple?: boolean;
  maxFiles?: number;
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
  multiple = false,
  maxFiles = 5,
}: CloudinaryImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<Array<{url: string, file: File}>>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    
    // Validate file count for multiple uploads
    if (multiple && fileList.length > maxFiles) {
      const errorMsg = `Too many files. Maximum: ${maxFiles}`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    for (const file of fileList) {
      // Validate file type
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (!fileExtension || !allowedFormats.includes(fileExtension)) {
        const errorMsg = `Invalid file format for ${file.name}. Allowed: ${allowedFormats.join(", ")}`;
        setError(errorMsg);
        onUploadError?.(errorMsg);
        return;
      }

      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxFileSize) {
        const errorMsg = `File ${file.name} too large. Maximum size: ${maxFileSize}MB`;
        setError(errorMsg);
        onUploadError?.(errorMsg);
        return;
      }
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // Create previews for all files
      const newPreviews: Array<{url: string, file: File}> = [];
      
      for (const file of fileList) {
        const reader = new FileReader();
        const previewPromise = new Promise<{url: string, file: File}>((resolve) => {
          reader.onload = (e) => {
            resolve({
              url: e.target?.result as string,
              file: file
            });
          };
          reader.readAsDataURL(file);
        });
        newPreviews.push(await previewPromise);
      }
      
      setPreviews(prev => [...prev, ...newPreviews]);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Upload all files
      const uploadPromises = fileList.map(file => 
        uploadToCloudinary(file, {
          folder,
          tags,
          uploadPreset,
        })
      );
      
      const results = await Promise.all(uploadPromises);

      clearInterval(progressInterval);
      setProgress(100);

      onUploadComplete?.(multiple ? results : results[0]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Upload failed";
      setError(errorMsg);
      onUploadError?.(errorMsg);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [folder, tags, maxFileSize, allowedFormats, onUploadComplete, onUploadError, uploadPreset, multiple, maxFiles]);

  const clearPreviews = () => {
    setPreviews([]);
    setError(null);
    const input = document.getElementById("cloudinary-upload") as HTMLInputElement;
    if (input) input.value = "";
  };

  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
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
          multiple={multiple}
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

        {previews.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearPreviews}
            className="flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear All
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

      {previews.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium">
              {multiple ? `${previews.length} Images Selected` : 'Preview'}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview.url}
                  alt={`Preview ${index + 1}`}
                  className="h-24 w-24 rounded-md object-cover border"
                />
                {multiple && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePreview(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
