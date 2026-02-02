"use client";

import { useState } from "react";
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

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // If no src or image error, show placeholder
  if (!src || imageError) {
    const IconComponent = variant === "vehicle" ? Car : variant === "user" ? User : Car;
    
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted rounded-md border",
          fallbackClassName
        )}
        style={{ width, height }}
      >
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <IconComponent className="h-8 w-8 mb-2 opacity-50" />
          <span className="text-xs font-medium">
            {variant === "vehicle" ? "No Image" : variant === "user" ? "No Avatar" : "No Image"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-md", className)}>
      {imageLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-muted"
          style={{ width, height }}
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
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "object-cover transition-opacity duration-300",
          imageLoading ? "opacity-0" : "opacity-100"
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
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
  const primaryImage = vehicle?.images?.[0] || null;
  
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
        className
      )}
      style={{ width: size, height: size }}
    >
      {initials || <User className="h-4 w-4" />}
    </div>
  );
}
