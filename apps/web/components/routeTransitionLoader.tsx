"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export function RouteTransitionLoader({
  className,
}: {
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const routeKey = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const transitionIdRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeoutRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (startTimeoutRef.current) {
      window.clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    transitionIdRef.current += 1;
    const id = transitionIdRef.current;

    clearTimer();
    setActive(true);
    setProgress((p) => (p > 0 && p < 80 ? p : 10));

    intervalRef.current = window.setInterval(() => {
      if (transitionIdRef.current !== id) return;

      setProgress((p) => {
        if (p >= 90) return p;
        const increment = p < 50 ? 8 : 4;
        const jitter = Math.round(Math.random() * 3);
        return Math.min(90, p + increment + jitter);
      });
    }, 150);
  }, [clearTimer]);

  const scheduleStart = useCallback(() => {
    if (startTimeoutRef.current) return;

    startTimeoutRef.current = window.setTimeout(() => {
      startTimeoutRef.current = null;
      start();
    }, 0);
  }, [start]);

  const done = useCallback(() => {
    transitionIdRef.current += 1;

    clearTimer();
    setProgress(100);

    window.setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 250);
  }, [clearTimer]);

  useEffect(() => {
    const toKey = (href: string) => {
      const u = new URL(href, window.location.href);
      return `${u.pathname}${u.search}`;
    };

    const maybeStartForUrl = (url: string | URL | null | undefined) => {
      if (!url) return;

      const nextHref = typeof url === "string" ? url : url.toString();
      const currentKey = toKey(window.location.href);
      const nextKey = toKey(nextHref);

      if (nextKey !== currentKey) scheduleStart();
    };

    const originalPushState: History["pushState"] = window.history.pushState;
    const originalReplaceState: History["replaceState"] =
      window.history.replaceState;

    window.history.pushState = function (
      ...args: Parameters<History["pushState"]>
    ): ReturnType<History["pushState"]> {
      maybeStartForUrl(args[2]);
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (
      ...args: Parameters<History["replaceState"]>
    ): ReturnType<History["replaceState"]> {
      maybeStartForUrl(args[2]);
      return originalReplaceState.apply(this, args);
    };

    const onPopState = () => {
      scheduleStart();
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      clearTimer();
      window.removeEventListener("popstate", onPopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [clearTimer, scheduleStart]);

  useEffect(() => {
    if (!active) return;
    done();
  }, [active, done, routeKey]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed left-0 top-0 z-50 h-0.5 w-full",
        className,
      )}
    >
      <div
        className={cn(
          "h-full bg-primary transition-[width,opacity] duration-200 ease-out",
          active ? "opacity-100" : "opacity-0",
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
