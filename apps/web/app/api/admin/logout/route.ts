import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  cookieStore.set("access_token", "", { httpOnly: true, path: "/", maxAge: 0 });
  cookieStore.set("refresh_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return NextResponse.redirect(new URL("/admin/login", request.url));
}
