"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { InlineError } from "../../../../components/inline-error";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  getResponseErrorMessage,
  toUserErrorMessage,
} from "../../../../lib/errors";
import { Sparkles } from "lucide-react";

type RegisterBody = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
};

export default function AdminRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const body: RegisterBody = {
      email,
      password,
      fullName,
      phone,
    };

    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const message = await getResponseErrorMessage(
          res,
          "Registration failed",
        );
        throw new Error(message);
      }

      router.push(next);
    } catch (e2: unknown) {
      setError(toUserErrorMessage(e2, "Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-10">
        <div className="w-full">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              Become a renter
            </h1>
          </div>

          <div className="grid gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-center rounded-full"
              disabled
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303C33.657 32.91 29.184 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.239 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.239 4 24 4c-7.682 0-14.346 4.328-17.694 10.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.083 0 9.807-1.946 13.338-5.1l-6.162-5.214C29.2 35.215 26.725 36 24 36c-5.163 0-9.622-3.064-11.283-7.46l-6.52 5.024C9.505 39.782 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.127 5.686l.003-.002 6.162 5.214C36.904 39.292 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="grid gap-3">
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="rounded-full"
              />
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="rounded-full"
              />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="rounded-full"
              />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="rounded-full"
              />

              <Button
                type="submit"
                disabled={loading}
                className="h-10 w-full rounded-full bg-slate-900 text-white hover:bg-slate-900/90"
              >
                Continue
              </Button>

              <InlineError message={error} />
            </form>

            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our Terms and Privacy Policy
            </p>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                className="text-primary hover:underline"
                href="/admin/login"
              >
                Renter Login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
