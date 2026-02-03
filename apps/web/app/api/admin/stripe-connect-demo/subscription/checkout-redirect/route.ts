import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getResponseErrorMessage, truncateMessage } from "@/lib/errors";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

// Starts subscription checkout for the connected account and redirects the admin
// to Stripe Checkout.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/stripe-connect-demo/admin/subscription/checkout`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      const message = truncateMessage(
        await getResponseErrorMessage(res, "Failed to start subscription"),
      );
      const url = new URL("/admin/stripe-connect-demo", request.url);
      url.searchParams.set("stripeError", message);
      return NextResponse.redirect(url);
    }

    const data = (await res.json()) as { url?: string };
    if (!data?.url) {
      const url = new URL("/admin/stripe-connect-demo", request.url);
      url.searchParams.set("stripeError", "Stripe Checkout URL was missing");
      return NextResponse.redirect(url);
    }

    return NextResponse.redirect(data.url);
  } catch {
    const url = new URL("/admin/stripe-connect-demo", request.url);
    url.searchParams.set("stripeError", "Failed to start subscription");
    return NextResponse.redirect(url);
  }
}
