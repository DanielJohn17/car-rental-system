"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InlineError } from "@/components/inline-error";
import { getResponseErrorMessage, toUserErrorMessage } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  ArrowLeft,
  RefreshCcw,
  Mail,
  Phone,
  ShieldCheck,
  Edit,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/page-container";

type Staff = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  verified: boolean;
  createdAt: string;
};

type StaffListResponse = {
  data: Staff[];
  total: number;
  page: number;
  limit: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Staff[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<Staff | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const canCreate = useMemo(() => {
    return Boolean(email && password && fullName && phone);
  }, [email, password, fullName, phone]);

  async function load() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users?page=1&limit=50", {
        cache: "no-store",
      });
      if (!res.ok) {
        const message = await getResponseErrorMessage(
          res,
          "Failed to load users",
        );
        throw new Error(message);
      }
      const data = (await res.json()) as StaffListResponse;
      setUsers(data.data);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(toUserErrorMessage(e, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createUser() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
          role: "SALES",
        }),
      });

      if (!res.ok) {
        const message = await getResponseErrorMessage(res, "Create failed");
        throw new Error(message);
      }

      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");

      await load();
    } catch (e: unknown) {
      setError(toUserErrorMessage(e, "Create failed"));
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(id: string, userData: Partial<Staff>) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const message = await getResponseErrorMessage(res, "Update failed");
        throw new Error(message);
      }

      setEditingUser(null);
      await load();
    } catch (e: unknown) {
      setError(toUserErrorMessage(e, "Update failed"));
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const message = await getResponseErrorMessage(res, "Delete failed");
        throw new Error(message);
      }
      await load();
    } catch (e: unknown) {
      setError(toUserErrorMessage(e, "Delete failed"));
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <PageContainer>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Users className="h-10 w-10 text-primary" />
              Staff Management
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Manage permissions and personnel for your car rental system.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="list" className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-background border p-1 rounded-xl h-12 shadow-sm">
              <TabsTrigger
                value="list"
                className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="h-4 w-4 mr-2" />
                Staff Directory
              </TabsTrigger>
              <TabsTrigger
                value="add"
                className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff Member
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  className="pl-9 rounded-full h-10 w-[200px] lg:w-[300px] bg-background border-border/50"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-background"
                onClick={load}
                disabled={loading}
              >
                <RefreshCcw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          <TabsContent value="list" className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  {total} Team Members
                </span>
              </div>
            </div>

            {users.length === 0 && !loading ? (
              <Card className="border-dashed border-2 bg-muted/50">
                <CardContent className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="rounded-full bg-muted p-6 text-muted-foreground">
                    <Users className="h-12 w-12" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">No staff found</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                      Start building your team by inviting your first staff
                      member.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const tabs = document.querySelector('[role="tablist"]');
                      const addTab = tabs?.querySelector(
                        '[value="add"]',
                      ) as HTMLElement;
                      addTab?.click();
                    }}
                    className="mt-4 rounded-full px-8 shadow-lg shadow-primary/20"
                  >
                    Add Staff Member
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {users.map((user) => (
                  <Card
                    key={user.id}
                    className="group overflow-hidden rounded-3xl border-border/50 bg-card shadow-sm transition-all hover:shadow-lg"
                  >
                    <CardContent className="p-0">
                      <div className="grid lg:grid-cols-[1fr_120px]">
                        <div className="p-8">
                          <div className="flex flex-wrap items-center gap-3 mb-6">
                            <Badge
                              variant={
                                user.role === "ADMIN" ? "default" : "secondary"
                              }
                              className="rounded-full px-3 py-1 font-bold uppercase tracking-widest text-[10px]"
                            >
                              {user.role}
                            </Badge>
                            {user.verified ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none rounded-full px-3 py-1 text-[10px] font-bold uppercase">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-200 bg-amber-50 rounded-full px-3 py-1 text-[10px] font-bold uppercase"
                              >
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Pending Verification
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center gap-6">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                              {user.fullName.charAt(0)}
                            </div>
                            <div className="space-y-4 flex-1">
                              <div>
                                <h3 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                                  {user.fullName}
                                </h3>
                                <p className="text-muted-foreground font-medium flex items-center gap-1.5 mt-1">
                                  <Calendar className="h-4 w-4" />
                                  Joined{" "}
                                  {new Date(
                                    user.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4 text-primary" />
                                  <span className="truncate">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-primary" />
                                  <span>{user.phone}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/30 border-l border-border/50 p-4 flex flex-col justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            className="w-full rounded-xl font-bold hover:bg-background shadow-none transition-all"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUser(user.id)}
                            disabled={user.role === "ADMIN"}
                            className="w-full rounded-xl font-bold text-destructive hover:bg-destructive/10 hover:text-destructive shadow-none transition-all"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/20 text-primary">
                    <UserPlus className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold">
                      New Staff Member
                    </CardTitle>
                    <CardDescription className="text-slate-400 mt-1">
                      Add a new user to help manage your car rental operations.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary border-b pb-2">
                      Personal Details
                    </h3>
                    <div className="space-y-2">
                      <Label
                        htmlFor="fullName"
                        className="text-xs font-bold uppercase text-muted-foreground"
                      >
                        Full Name
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          className="rounded-xl h-12 pl-10 bg-muted/50 border-transparent focus:bg-background transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-xs font-bold uppercase text-muted-foreground"
                      >
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1234567890"
                          className="rounded-xl h-12 pl-10 bg-muted/50 border-transparent focus:bg-background transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary border-b pb-2">
                      Account Security
                    </h3>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-xs font-bold uppercase text-muted-foreground"
                      >
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="staff@company.com"
                          className="rounded-xl h-12 pl-10 bg-muted/50 border-transparent focus:bg-background transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        title="Password must be at least 8 characters"
                        className="text-xs font-bold uppercase text-muted-foreground"
                      >
                        Initial Password
                      </Label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="rounded-xl h-12 pl-10 bg-muted/50 border-transparent focus:bg-background transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={createUser}
                      disabled={!canCreate || loading}
                      className="rounded-full px-10 h-14 text-lg font-bold shadow-lg shadow-primary/20"
                    >
                      {loading ? (
                        <>
                          <RefreshCcw className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-5 w-5" />
                          Create Staff Account
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        const tabs = document.querySelector('[role="tablist"]');
                        const listTab = tabs?.querySelector(
                          '[value="list"]',
                        ) as HTMLElement;
                        listTab?.click();
                      }}
                      className="rounded-full px-8 h-14"
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground italic">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    New accounts are created with SALES role by default.
                  </div>
                </div>

                <InlineError message={error} className="mt-6" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 px-4">
          <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-slate-900 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Edit className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-bold">
                    Edit Profile
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                  className="h-8 w-8 p-0 text-white hover:bg-white/10 rounded-full"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-fullName"
                    className="text-xs font-bold uppercase text-muted-foreground"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="edit-fullName"
                    value={editingUser.fullName}
                    onChange={(e) =>
                      setEditingUser((prev) =>
                        prev ? { ...prev, fullName: e.target.value } : null,
                      )
                    }
                    className="rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit-email"
                    className="text-xs font-bold uppercase text-muted-foreground"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser((prev) =>
                        prev ? { ...prev, email: e.target.value } : null,
                      )
                    }
                    className="rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit-phone"
                    className="text-xs font-bold uppercase text-muted-foreground"
                  >
                    Phone Number
                  </Label>
                  <Input
                    id="edit-phone"
                    value={editingUser.phone}
                    onChange={(e) =>
                      setEditingUser((prev) =>
                        prev ? { ...prev, phone: e.target.value } : null,
                      )
                    }
                    className="rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    if (editingUser) {
                      updateUser(editingUser.id, {
                        fullName: editingUser.fullName,
                        email: editingUser.email,
                        phone: editingUser.phone,
                      });
                    }
                  }}
                  disabled={loading}
                  className="flex-1 rounded-xl h-12 font-bold shadow-lg shadow-primary/20"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  disabled={loading}
                  className="flex-1 rounded-xl h-12 font-bold"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
