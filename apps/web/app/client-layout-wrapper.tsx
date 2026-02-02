"use client";

import { ClientLayout } from "./client-layout";

export function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
