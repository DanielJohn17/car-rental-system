import * as React from "react";

import { cn } from "../lib/utils";

export function PageContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <main className={cn("container py-8", className)}>{children}</main>;
}
