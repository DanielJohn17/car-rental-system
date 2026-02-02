"use client";

import React, { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { Button } from "./ui/button";

interface OfflineBannerProps {
  onRetry?: () => void;
}

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    // Check initial state
    setIsOnline(navigator.onLine);
    setShowBanner(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div className="border-b border-yellow-200 bg-yellow-50 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            Service temporarily unavailable
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onRetry) onRetry();
              window.location.reload();
            }}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
          >
            Retry
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBanner(false)}
            className="text-yellow-700"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
