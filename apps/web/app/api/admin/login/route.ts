import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getResponseErrorMessage } from "../../../../lib/errors";

type LoginBody = {
  email: string;
  password: string;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const message = await getResponseErrorMessage(res, "Login failed");
    return new NextResponse(message, {
      status: res.status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const data = (await res.json()) as AuthResponse;

  const cookieStore = await cookies();
  cookieStore.set("access_token", data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  cookieStore.set("refresh_token", data.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return NextResponse.json({ user: data.user });
}
