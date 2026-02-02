"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageContainer } from "../../../../components/page-container";
import { SiteHeader } from "../../../../components/site-header";
import { InlineError } from "../../../../components/inline-error";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { getResponseErrorMessage, toUserErrorMessage } from "../../../../lib/errors";

export default function AdminLoginPage() {
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
        const message = await getResponseErrorMessage(res, "Invalid email or password");
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
    <div>
      <SiteHeader showAdminCtas={false} />
      <PageContainer className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Admin / Sales login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading}>
                Sign in
              </Button>

              <InlineError message={error} />

              <div className="text-sm text-muted-foreground">
                Need an admin (renter) account? <Link href="/admin/register">Register</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}
