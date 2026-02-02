import { NextResponse } from "next/server";
import { getResponseErrorMessage } from "../../../lib/errors";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export async function proxyPublic(request: Request, apiPath: string) {
  const url = new URL(request.url);
  const targetUrl = new URL(`${API_BASE_URL}${apiPath}`);
  targetUrl.search = url.search;

  const method = request.method;

  let body: string | undefined;
  const contentType = request.headers.get("content-type") || "";
  if (method !== "GET" && method !== "HEAD") {
    if (contentType.includes("application/json")) {
      const json = await request.json();
      body = JSON.stringify(json);
    } else {
      body = await request.text();
    }
  }

  try {
    const res = await fetch(targetUrl, {
      method,
      headers: {
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body,
      cache: "no-store",
    });

    if (!res.ok) {
      const message = await getResponseErrorMessage(res, "Request failed");
      return new NextResponse(message, {
        status: res.status,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const responseContentType = res.headers.get("content-type") || "";
    if (responseContentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text().catch(() => "");
    return new NextResponse(text, { status: res.status });
  } catch (error) {
    console.error("Proxy public fetch failed:", error);
    
    // Return appropriate fallback based on the endpoint
    if (apiPath.includes("/locations")) {
      return NextResponse.json(
        { error: "Service temporarily unavailable", locations: [] },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }
}
