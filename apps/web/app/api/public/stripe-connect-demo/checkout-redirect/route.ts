import { NextResponse } from "next/server";

import { getResponseErrorMessage } from "@/lib/errors";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

// Public: creates a Checkout Session and redirects the customer to Stripe.
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? JSON.stringify(await request.json())
    : await request.text();

  try {
    const res = await fetch(`${API_BASE_URL}/stripe-connect-demo/storefront/checkout`, {
      method: "POST",
      headers: {
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body,
      cache: "no-store",
    });

    if (!res.ok) {
      const message = await getResponseErrorMessage(res, "Checkout failed");
      return new NextResponse(message, {
        status: res.status,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const data = (await res.json()) as { url?: string };
    if (!data?.url) {
      return new NextResponse("Stripe Checkout URL was missing", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.redirect(data.url);
  } catch {
    return new NextResponse("Checkout failed", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
