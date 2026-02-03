import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getResponseErrorMessage, truncateMessage } from "@/lib/errors";

import { proxyToApi } from "../../_utils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

// Create a product (POST) or list products (GET) on the connected account.
//
// The POST handler redirects back to the admin page so a plain HTML form can be
// used.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const form = await request.formData();

  const name = String(form.get("name") ?? "");
  const descriptionRaw = form.get("description");
  const description = descriptionRaw ? String(descriptionRaw) : undefined;
  const priceInCents = Number(form.get("priceInCents"));
  const currency = String(form.get("currency") ?? "usd");

  try {
    const res = await fetch(`${API_BASE_URL}/stripe-connect-demo/admin/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        priceInCents,
        currency,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const message = truncateMessage(
        await getResponseErrorMessage(res, "Failed to create product"),
      );
      const url = new URL("/admin/stripe-connect-demo", request.url);
      url.searchParams.set("stripeError", message);
      return NextResponse.redirect(url);
    }

    return NextResponse.redirect(new URL("/admin/stripe-connect-demo", request.url));
  } catch {
    const url = new URL("/admin/stripe-connect-demo", request.url);
    url.searchParams.set("stripeError", "Failed to create product");
    return NextResponse.redirect(url);
  }
}

export async function GET(request: Request) {
  return proxyToApi(request, "/stripe-connect-demo/admin/products");
}
