import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type RegisterBody = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
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
  const body = (await request.json()) as RegisterBody;

  const res = await fetch(`${API_BASE_URL}/auth/register/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return new NextResponse(text || "Registration failed", { status: res.status });
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
