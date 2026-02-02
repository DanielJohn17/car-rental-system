"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageContainer } from "../../../../components/page-container";
import { SiteHeader } from "../../../../components/site-header";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";

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
        const text = await res.text().catch(() => "");
        throw new Error(text || `Registration failed (${res.status})`);
      }

      router.push(next);
    } catch (e2: unknown) {
      setError(e2 instanceof Error ? e2.message : "Registration failed");
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
            <CardTitle className="text-2xl">Register as renter (admin)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

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
                Create account
              </Button>

              {error ? <div className="text-sm text-destructive">{error}</div> : null}

              <div className="text-sm text-muted-foreground">
                Already have an account? <Link href="/admin/login">Login</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}
