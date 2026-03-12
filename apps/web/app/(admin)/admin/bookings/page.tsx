"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ClipboardList,
  ArrowLeft,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  User,
  Clock,
  Search,
  ChevronRight,
  Car,
} from "lucide-react";

import { InlineError } from "@/components/inline-error";
import { PageContainer } from "@/components/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getResponseErrorMessage, toUserErrorMessage } from "@/lib/errors";

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

function statusBadgeVariant(
  status?: string,
): "default" | "secondary" | "destructive" | "outline" {
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
    <div className="min-h-screen bg-muted/20">
      <PageContainer>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <ClipboardList className="h-10 w-10 text-primary" />
              Booking Requests
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Review and manage pending rental applications.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-background border rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-wider">
                {bookings.length} Pending Actions
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background"
              onClick={loadPending}
              disabled={loading}
            >
              <RefreshCcw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              className="pl-9 rounded-full h-10 w-full sm:w-[250px] bg-background border-border/50"
            />
          </div>
        </div>

        <InlineError message={error} className="mb-6" />

        {bookings.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/50">
            <CardContent className="py-20">
              <div className="text-center flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-6 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Inbox is clear!</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                    You&apos;ve handled all pending requests. New bookings will
                    appear here as soon as they&apos;re submitted.
                  </p>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={loadPending}
                    className="rounded-full px-6"
                  >
                    Refresh List
                  </Button>
                  <Button asChild className="rounded-full px-6">
                    <Link href="/admin/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {bookings.map((b) => (
              <Card
                key={b.id}
                className="group overflow-hidden rounded-3xl border-border/50 bg-card shadow-sm transition-all hover:shadow-lg hover:border-primary/20"
              >
                <div className="grid lg:grid-cols-[1fr_300px]">
                  <div className="p-8">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <Badge
                        variant={statusBadgeVariant(b.status)}
                        className="rounded-full px-3 py-1 font-bold uppercase tracking-widest text-[10px]"
                      >
                        {b.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        Requested {format(new Date(b.createdAt), "PPP")}
                      </span>
                    </div>

                    <div className="flex items-start gap-4 mb-8">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Car className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                          {b.vehicle
                            ? `${b.vehicle.make} ${b.vehicle.model}`
                            : "Vehicle Details Missing"}
                        </h3>
                        <p className="text-muted-foreground font-medium flex items-center gap-1.5 mt-1">
                          <Calendar className="h-4 w-4" />
                          {b.vehicle?.year} Model
                          {b.pickupLocation && (
                            <span className="flex items-center gap-1.5 border-l pl-3 ml-1">
                              <MapPin className="h-4 w-4" />
                              {b.pickupLocation.name}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Guest Info
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <User className="h-4 w-4 text-primary" />
                            {b.guestName || "Guest User"}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {b.guestPhone}
                          </div>
                          {b.guestEmail && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                              <Mail className="h-4 w-4" />
                              {b.guestEmail}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Rental Period
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <Clock className="h-4 w-4 text-primary" />
                            {format(new Date(b.startDateTime), "MMM d, h:mm a")}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ChevronRight className="h-4 w-4 ml-0.5" />
                            {format(new Date(b.endDateTime), "MMM d, h:mm a")}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Financials
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-primary">
                            <CreditCard className="h-4 w-4" />
                            Total: ${b.totalPrice.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="h-1 w-1 rounded-full bg-muted-foreground mx-1.5" />
                            Deposit: ${b.depositAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 border-l border-border/50 p-8 flex flex-col justify-center gap-4">
                    <Button
                      onClick={() => approve(b.id)}
                      className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/10 hover:shadow-xl transition-all active:scale-95 bg-primary text-primary-foreground"
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Approve Request
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => reject(b.id)}
                      className="w-full h-12 rounded-2xl font-bold hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all active:scale-95"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Reject Application
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground italic mt-2">
                      Reviewing this request will notify the guest immediately.
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
