"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { InlineError } from "../../../../components/inline-error";
import { getResponseErrorMessage, toUserErrorMessage } from "../../../../lib/errors";

type Booking = {
  id: string;
  guestName?: string | null;
  guestPhone: string;
  guestEmail?: string | null;
  status: string;
  startDateTime: string;
  endDateTime: string;
  totalPrice: number;
  depositAmount: number;
  createdAt: string;
  notes?: string | null;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
  };
  pickupLocation?: {
    id: string;
    name: string;
  };
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadPending() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/bookings/pending", { cache: "no-store" });
      if (!res.ok) {
        const message = await getResponseErrorMessage(res, "Failed to load bookings");
        throw new Error(message);
      }
      const data = (await res.json()) as Booking[];
      setBookings(data);
    } catch (e: unknown) {
      setError(toUserErrorMessage(e, "Failed to load bookings"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPending();
  }, []);

  async function approve(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Approved" }),
      });
      if (!res.ok) {
        const message = await getResponseErrorMessage(res, "Approve failed");
        throw new Error(message);
      }
      await loadPending();
    } catch (e: unknown) {
      setError(toUserErrorMessage(e, "Approve failed"));
    }
  }

  async function reject(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Rejected" }),
      });
      if (!res.ok) {
        const message = await getResponseErrorMessage(res, "Reject failed");
        throw new Error(message);
      }
      await loadPending();
    } catch (e: unknown) {
      setError(toUserErrorMessage(e, "Reject failed"));
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Pending bookings</h1>
        <Link href="/admin/dashboard">Back to dashboard</Link>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button type="button" onClick={loadPending} disabled={loading}>
          Refresh
        </button>
      </div>

      <InlineError message={error} className="mb-3" />

      <div style={{ display: "grid", gap: 10 }}>
        {bookings.map((b) => (
          <div
            key={b.id}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 12,
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>
                {b.vehicle
                  ? `${b.vehicle.make} ${b.vehicle.model} (${b.vehicle.year})`
                  : "Vehicle"}
              </strong>
              <span style={{ opacity: 0.85 }}>{b.status}</span>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span style={{ opacity: 0.85 }}>Booking: {b.id}</span>
              <span style={{ opacity: 0.85 }}>Phone: {b.guestPhone}</span>
              {b.guestEmail ? (
                <span style={{ opacity: 0.85 }}>Email: {b.guestEmail}</span>
              ) : null}
              {b.pickupLocation ? (
                <span style={{ opacity: 0.85 }}>Pickup: {b.pickupLocation.name}</span>
              ) : null}
            </div>

            <div style={{ opacity: 0.85 }}>
              {new Date(b.startDateTime).toISOString()} → {new Date(b.endDateTime).toISOString()}
            </div>

            <div style={{ opacity: 0.85 }}>
              Total: {b.totalPrice} • Deposit: {b.depositAmount}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={() => approve(b.id)}>
                Approve
              </button>
              <button type="button" onClick={() => reject(b.id)} style={{ color: "crimson" }}>
                Reject
              </button>
            </div>
          </div>
        ))}

        {bookings.length === 0 ? (
          <div style={{ opacity: 0.75 }}>No pending bookings.</div>
        ) : null}
      </div>
    </main>
  );
}
