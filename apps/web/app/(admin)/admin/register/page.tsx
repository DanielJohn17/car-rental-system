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
import { Car, ArrowLeft, Mail, Lock, User, Phone } from "lucide-react";

type RegisterBody = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
};

function RegisterForm() {
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
        <h1 className="text-3xl font-extrabold tracking-tight">
          Join the platform
        </h1>
        <p className="text-muted-foreground">
          Create a renter account and start earning
        </p>
      </div>

      <div className="grid gap-6">
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="rounded-xl h-12 pl-10 bg-muted/50 border-transparent focus:bg-background transition-all"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="rounded-xl h-12 pl-10 bg-muted/50 border-transparent focus:bg-background transition-all"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="rounded-xl h-12 pl-10 bg-muted/50 border-transparent focus:bg-background transition-all"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 8 chars)"
                className="rounded-xl h-12 pl-10 bg-muted/50 border-transparent focus:bg-background transition-all"
                required
                minLength={8}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-95 mt-2"
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>

          <InlineError message={error} />
        </form>

        <div className="space-y-4 pt-4">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              className="font-bold text-primary hover:underline underline-offset-4"
              href="/admin/login"
            >
              Sign In
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

export default function AdminRegisterPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 w-full max-w-md px-6 py-12 bg-background/50 backdrop-blur-sm sm:rounded-3xl sm:border sm:shadow-2xl sm:shadow-primary/5">
        <Suspense
          fallback={
            <div className="w-full h-64 flex items-center justify-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </main>

      <footer className="relative z-10 mt-8 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} CarRental System. Secure Renter
          Registration.
        </p>
      </footer>
    </div>
  );
}
