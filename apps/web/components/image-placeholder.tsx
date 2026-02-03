"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Car, User } from "lucide-react";

interface ImagePlaceholderProps {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  variant?: "vehicle" | "user" | "generic";
  fallbackClassName?: string;
}

export function ImagePlaceholder({
  src,
  alt,
  className,
  width = 400,
  height = 300,
  variant = "generic",
  fallbackClassName,
}: ImagePlaceholderProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const sizeStyle = useMemo(() => {
    if (className) return undefined;
    return { width, height } as const;
  }, [className, height, width]);

  useEffect(() => {
    if (!src) return;
    setImageError(false);
    setImageLoading(true);
  }, [src]);

  useEffect(() => {
    if (!src) return;
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      setImageLoading(false);
    }
  }, [src]);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // If no src or image error, show placeholder
  if (!src || imageError) {
    const IconComponent =
      variant === "vehicle" ? Car : variant === "user" ? User : Car;

    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-md border bg-muted",
          className,
          fallbackClassName,
        )}
        style={sizeStyle}
      >
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <IconComponent className="h-8 w-8 mb-2 opacity-50" />
          <span className="text-xs font-medium">
            {variant === "vehicle"
              ? "No Image"
              : variant === "user"
                ? "No Avatar"
                : "No Image"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border bg-muted",
        className,
      )}
      style={sizeStyle}
    >
      {imageLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-muted"
          style={sizeStyle}
        >
          <div className="animate-pulse flex flex-col items-center justify-center text-muted-foreground">
            {variant === "vehicle" ? (
              <Car className="h-8 w-8 mb-2 opacity-30" />
            ) : variant === "user" ? (
              <User className="h-8 w-8 mb-2 opacity-30" />
            ) : (
              <Car className="h-8 w-8 mb-2 opacity-30" />
            )}
            <span className="text-xs">Loading...</span>
          </div>
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          imageLoading ? "opacity-0" : "opacity-100",
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </div>
  );
}

export function VehicleImagePlaceholder({
  vehicle,
  className,
  width = 400,
  height = 300,
}: {
  vehicle?: {
    images?: string[] | null;
    make?: string;
    model?: string;
    year?: number;
  };
  className?: string;
  width?: number;
  height?: number;
}) {
  const primaryImage = useMemo(() => {
    const images = vehicle?.images ?? [];
    const valid = images.find((u) => {
      if (!u) return false;
      const trimmed = u.trim();
      if (!trimmed) return false;
      if (trimmed.startsWith("blob:")) return false;
      if (trimmed.startsWith("data:")) return false;
      return (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("//")
      );
    });

    return valid ?? null;
  }, [vehicle?.images]);

  return (
    <ImagePlaceholder
      src={primaryImage}
      alt={`${vehicle?.make || "Vehicle"} ${vehicle?.model || ""} ${vehicle?.year || ""}`}
      className={className}
      width={width}
      height={height}
      variant="vehicle"
      fallbackClassName="border-dashed border-2 border-muted-foreground/30"
    />
  );
}

export function UserImagePlaceholder({
  user,
  className,
  size = 48,
}: {
  user?: {
    fullName?: string;
    email?: string;
  };
  className?: string;
  size?: number;
}) {
  const fallback = user?.fullName || user?.email || "User";
  const initials = fallback
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-primary/10 text-primary rounded-full border",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {initials || <User className="h-4 w-4" />}
    </div>
  );
}
