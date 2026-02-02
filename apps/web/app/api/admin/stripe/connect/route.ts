import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getResponseErrorMessage, truncateMessage } from "@/lib/errors";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    const res = await fetch(`${API_BASE_URL}/users/me/stripe/connect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const message = truncateMessage(
        await getResponseErrorMessage(res, "Failed to connect Stripe"),
      );

      const url = new URL("/admin/dashboard", request.url);
      url.searchParams.set("stripeError", message);
      return NextResponse.redirect(url);
    }

    const data = (await res.json()) as {
      stripeConnectAccountId: string;
      onboardingUrl: string;
    };

    if (!data?.onboardingUrl) {
      const url = new URL("/admin/dashboard", request.url);
      url.searchParams.set("stripeError", "Stripe onboarding URL was missing");
      return NextResponse.redirect(url);
    }

    return NextResponse.redirect(data.onboardingUrl);
  } catch {
    const url = new URL("/admin/dashboard", request.url);
    url.searchParams.set("stripeError", "Failed to connect Stripe");
    return NextResponse.redirect(url);
  }
}
