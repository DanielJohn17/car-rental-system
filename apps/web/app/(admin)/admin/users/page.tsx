"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InlineError } from "@/components/inline-error";
import { getResponseErrorMessage, toUserErrorMessage } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, UserPlus } from "lucide-react";

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
  const [showCreateForm, setShowCreateForm] = useState(false);

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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Users Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage sales staff and administrators
          </p>
        </div>
        <Link href="/admin/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="mb-6">
        <Badge variant="secondary" className="text-sm">
          Total: {total} users
        </Badge>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Sales Staff
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (E.164 format)</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={createUser}
              disabled={!canCreate || loading}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Create Staff
            </Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>

          <InlineError message={error} className="mt-4" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Staff List
            </span>
            <Badge variant="outline">{users.length} staff members</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found.</p>
              <p className="text-sm">
                Create your first sales staff member above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <Card key={user.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">
                            {user.fullName}
                          </h3>
                          <Badge
                            variant={
                              user.role === "ADMIN" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {user.role}
                          </Badge>
                          <Badge
                            variant={user.verified ? "default" : "outline"}
                            className="text-xs"
                          >
                            {user.verified ? "Verified" : "Unverified"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Email:</span>{" "}
                            {user.email}
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span>{" "}
                            {user.phone}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>{" "}
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingUser(user)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteUser(user.id)}
                            className="flex items-center gap-2 text-destructive focus:text-destructive"
                            disabled={user.role === "ADMIN"}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Edit User
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Full Name</Label>
                <Input
                  id="edit-fullName"
                  value={editingUser.fullName}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, fullName: e.target.value } : null,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, email: e.target.value } : null,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editingUser.phone}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, phone: e.target.value } : null,
                    )
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
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
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  disabled={loading}
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
