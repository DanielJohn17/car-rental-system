"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InlineError } from "../../../../components/inline-error";
import {
  getResponseErrorMessage,
  toUserErrorMessage,
} from "../../../../lib/errors";

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
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Users</h1>
        <Link href="/admin/dashboard">Back to dashboard</Link>
      </div>

      <div style={{ marginBottom: 16, opacity: 0.85 }}>Total: {total}</div>

      <section
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Create sales staff</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Full name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Phone (E.164, ET)</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={createUser}
            disabled={!canCreate || loading}
          >
            Create
          </button>
          <button type="button" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>

        <InlineError message={error} className="mt-2" />
      </section>

      <section
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 8,
          padding: 12,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Staff list</h2>

        <div style={{ display: "grid", gap: 10 }}>
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 12,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{u.fullName}</strong>
                <span style={{ opacity: 0.85 }}>{u.role}</span>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span style={{ opacity: 0.85 }}>Email: {u.email}</span>
                <span style={{ opacity: 0.85 }}>Phone: {u.phone}</span>
                <span style={{ opacity: 0.85 }}>
                  Verified: {String(u.verified)}
                </span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => deleteUser(u.id)}
                  style={{ color: "crimson" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No users found.</div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
