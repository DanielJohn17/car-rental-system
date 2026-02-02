"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { InlineError } from "../../../../components/inline-error";
import { PageContainer } from "../../../../components/page-container";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import {
  getResponseErrorMessage,
  toUserErrorMessage,
} from "../../../../lib/errors";

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

function statusBadgeVariant(status?: string):
  | "default"
  | "secondary"
  | "destructive"
  | "outline" {
  const s = (status ?? "").toUpperCase();
  if (s === "APPROVED" || s === "CONFIRMED") return "default";
  if (s === "REJECTED" || s === "CANCELLED") return "destructive";
  if (s === "PENDING") return "secondary";
  return "outline";
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadPending() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/bookings/pending", {
        cache: "no-store",
      });
      if (!res.ok) {
        const message = await getResponseErrorMessage(
          res,
          "Failed to load bookings",
        );
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
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Pending bookings</h1>
        <Button asChild variant="outline">
          <Link href="/admin/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Button type="button" variant="outline" onClick={loadPending} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <InlineError message={error} className="mb-4" />

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <div className="text-lg font-medium">No pending bookings</div>
              <p className="mt-1 text-sm text-muted-foreground">
                New booking requests will appear here.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button type="button" variant="outline" onClick={loadPending} disabled={loading}>
                  Refresh
                </Button>
                <Button asChild>
                  <Link href="/admin/dashboard">Go to dashboard</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <CardTitle className="text-base">
                    {b.vehicle
                      ? `${b.vehicle.make} ${b.vehicle.model} (${b.vehicle.year})`
                      : "Vehicle"}
                  </CardTitle>
                  <Badge variant={statusBadgeVariant(b.status)}>{b.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-foreground">Booking ID:</span>{" "}
                    {b.id}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Phone:</span>{" "}
                    {b.guestPhone}
                  </div>
                  {b.guestEmail ? (
                    <div className="sm:col-span-2">
                      <span className="font-medium text-foreground">Email:</span>{" "}
                      {b.guestEmail}
                    </div>
                  ) : null}
                  {b.pickupLocation ? (
                    <div className="sm:col-span-2">
                      <span className="font-medium text-foreground">Pickup:</span>{" "}
                      {b.pickupLocation.name}
                    </div>
                  ) : null}
                  <div className="sm:col-span-2">
                    <span className="font-medium text-foreground">Dates:</span>{" "}
                    {new Date(b.startDateTime).toLocaleString()} →{" "}
                    {new Date(b.endDateTime).toLocaleString()}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium text-foreground">Total:</span>{" "}
                    {b.totalPrice} •{" "}
                    <span className="font-medium text-foreground">Deposit:</span>{" "}
                    {b.depositAmount}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => approve(b.id)}>
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => reject(b.id)}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
