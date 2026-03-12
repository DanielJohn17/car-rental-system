"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { InlineError } from "../../../../components/inline-error";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  getResponseErrorMessage,
  toUserErrorMessage,
} from "../../../../lib/errors";
import { ArrowLeft, Car } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const message = await getResponseErrorMessage(
          res,
          "Invalid email or password",
        );
        throw new Error(message);
      }

      router.push(next);
    } catch (e2: unknown) {
      setError(toUserErrorMessage(e2, "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="flex flex-col items-center text-center space-y-2">
        <Link href="/" className="mb-4 flex items-center gap-2 group">
          <div className="bg-primary p-2 rounded-xl text-primary-foreground group-hover:scale-110 transition-transform">
            <Car className="h-6 w-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight">
            Car<span className="text-primary">Rental</span>
          </span>
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">
          Enter your credentials to access your dashboard
        </p>
      </div>

      <div className="grid gap-6">
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-95"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <InlineError message={error} />
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-12 w-full justify-center rounded-xl border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
          disabled
        >
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          Google
        </Button>

        <div className="space-y-4 pt-4">
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              className="font-bold text-primary hover:underline underline-offset-4"
              href="/admin/register"
            >
              Become a Renter
            </Link>
          </p>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 w-full max-w-md px-6 py-12 bg-background/50 backdrop-blur-sm sm:rounded-3xl sm:border sm:shadow-2xl sm:shadow-primary/5">
        <Suspense
          fallback={
            <div className="w-full h-64 flex items-center justify-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>

      <footer className="relative z-10 mt-8 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} CarRental System. Secure Admin Access.
        </p>
      </footer>
    </div>
  );
}
