import { NextResponse } from "next/server";

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

  const res = await fetch(targetUrl, {
    method,
    headers: {
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
    body,
    cache: "no-store",
  });

  const responseContentType = res.headers.get("content-type") || "";
  if (responseContentType.includes("application/json")) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  const text = await res.text().catch(() => "");
  return new NextResponse(text, { status: res.status });
}
