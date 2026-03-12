"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CalendarIcon,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Info,
  RefreshCcw,
  Car,
} from "lucide-react";
import {
  addMinutes,
  addMonths,
  format,
  differenceInCalendarDays,
  isAfter,
  isBefore,
  isSameDay,
  setHours,
  startOfDay,
} from "date-fns";
import type { DateRange } from "react-day-picker";

import { InlineError } from "@/components/inline-error";
import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getResponseErrorMessage, toUserErrorMessage } from "@/lib/errors";
import { useLocations } from "@/lib/queries/locations";
import { cn } from "@/lib/utils";

type PricingBreakdown = {
  vehicleId: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalDays: number;
  totalPrice: number;
  currency: string;
  depositPercentage: number;
  depositAmount: number;
};

type CheckoutSessionResponse = {
  url: string;
  bookingId: string;
};

type Booking = {
  id: string;
  status: string;
};

type Location = {
  id: string;
  name: string;
};

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  dailyRate: number;
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const message = await getResponseErrorMessage(res, "Fetch failed");
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const message = await getResponseErrorMessage(res, "Request failed");
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

function BookingForm() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId");
  const returnUrl = searchParams.get("returnUrl") ?? "/";

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [days, setDays] = useState<string>("");

  const [pickupLocationId, setPickupLocationId] = useState<string>("");
  const [returnLocationId, setReturnLocationId] = useState<string>("");

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const locationsQuery = useLocations();
  const locations = (
    Array.isArray(locationsQuery.data)
      ? locationsQuery.data
      : (locationsQuery.data?.data ?? [])
  ) as Location[];

  const locationsError = useMemo(() => {
    if (!locationsQuery.error) return null;
    return toUserErrorMessage(locationsQuery.error, "Failed to load locations");
  }, [locationsQuery.error]);

  const vehicleQuery = useQuery({
    queryKey: ["public-vehicle", vehicleId],
    queryFn: () => getJson<Vehicle>(`/api/public/vehicles/${vehicleId}`),
    enabled: Boolean(vehicleId),
    staleTime: 60 * 1000,
  });

  const canCalculate = useMemo(() => {
    return Boolean(vehicleId && dateRange?.from && dateRange?.to);
  }, [vehicleId, dateRange?.from, dateRange?.to]);

  const dateValidationError = useMemo(() => {
    const from = dateRange?.from;
    const to = dateRange?.to;
    if (!from || !to) return null;

    const today = startOfDay(new Date());
    if (isBefore(startOfDay(from), today)) {
      return "Start date cannot be in the past";
    }
    if (!isAfter(startOfDay(to), startOfDay(from))) {
      return "End date must be after start date";
    }

    const maxEnd = addMonths(startOfDay(from), 4);
    if (isAfter(startOfDay(to), maxEnd)) {
      return "Rental duration cannot exceed 4 months";
    }

    return null;
  }, [dateRange?.from, dateRange?.to]);

  const startDateTime = useMemo(() => {
    if (!dateRange?.from) return "";

    const now = new Date();
    const candidate = setHours(startOfDay(dateRange.from), 10);
    const resolved =
      isSameDay(dateRange.from, now) && isBefore(candidate, now)
        ? addMinutes(now, 5)
        : candidate;
    return resolved.toISOString();
  }, [dateRange?.from]);

  const endDateTime = useMemo(() => {
    if (!dateRange?.to) return "";
    const candidate = setHours(startOfDay(dateRange.to), 10);
    return candidate.toISOString();
  }, [dateRange?.to]);

  useEffect(() => {
    setPricing(null);
    setCheckoutUrl(null);
  }, [dateRange?.from, dateRange?.to]);

  useEffect(() => {
    const from = dateRange?.from;
    const to = dateRange?.to;
    if (!from || !to) {
      setDays("");
      return;
    }

    const d = differenceInCalendarDays(startOfDay(to), startOfDay(from));
    setDays(String(Math.max(0, d)));
  }, [dateRange?.from, dateRange?.to]);

  const pricingMutation = useMutation({
    mutationFn: (input: {
      vehicleId: string;
      startDate: string;
      endDate: string;
      locationId?: string;
    }) => postJson<PricingBreakdown>("/api/public/pricing/calculate", input),
    onSuccess: (data) => {
      setPricing(data);
    },
    onError: (e: unknown) => {
      setError(toUserErrorMessage(e, "Pricing failed"));
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (input: {
      guestName?: string;
      guestPhone: string;
      guestEmail?: string;
      vehicleId: string;
      startDateTime: string;
      endDateTime: string;
      pickupLocationId: string;
      returnLocationId: string;
      totalPrice: number;
      depositAmount: number;
    }) => {
      const booking = await postJson<Booking>("/api/public/bookings", input);
      const depositCents = Math.round(input.depositAmount * 100);

      const session = await postJson<CheckoutSessionResponse>(
        "/api/public/payments/create-checkout-session",
        {
          bookingId: booking.id,
          amount: depositCents,
          email: input.guestEmail || undefined,
        },
      );

      return session;
    },
    onSuccess: (data) => {
      setCheckoutUrl(data.url);
      window.location.assign(data.url);
    },
    onError: (e: unknown) => {
      setError(toUserErrorMessage(e, "Booking failed"));
    },
  });

  function calculate() {
    setError(null);
    if (!vehicleId || !dateRange?.from || !dateRange?.to) return;
    if (dateValidationError) {
      setError(dateValidationError);
      return;
    }

    pricingMutation.mutate({
      vehicleId,
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
      locationId: pickupLocationId || undefined,
    });
  }

  function submit() {
    setError(null);
    if (
      !pricing ||
      !vehicleId ||
      !pickupLocationId ||
      !returnLocationId ||
      !guestPhone
    ) {
      setError("Please complete all required fields and calculate pricing.");
      return;
    }

    if (dateValidationError) {
      setError(dateValidationError);
      return;
    }

    bookingMutation.mutate({
      vehicleId,
      startDateTime,
      endDateTime,
      pickupLocationId,
      returnLocationId,
      guestName: guestName || undefined,
      guestPhone,
      guestEmail: guestEmail || undefined,
      totalPrice: pricing.totalPrice,
      depositAmount: pricing.depositAmount,
    });
  }

  const loading = pricingMutation.isPending || bookingMutation.isPending;

  if (!vehicleId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-medium">No vehicle selected</h2>
        <Button asChild>
          <Link href="/">Back to fleet</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Zap className="h-10 w-10 text-primary" />
            Complete Your Booking
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            You&apos;re just a few steps away from your next journey.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href={returnUrl} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Vehicle
          </Link>
        </Button>
      </div>

      {vehicleQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">
            Securing vehicle details...
          </p>
        </div>
      ) : vehicleQuery.error ? (
        <Card className="border-destructive/20 bg-destructive/5 overflow-hidden rounded-3xl">
          <CardContent className="p-12 text-center space-y-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Info className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Something went wrong</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                We couldn&apos;t retrieve the vehicle details. This might be a
                temporary connection issue.
              </p>
            </div>
            <Button
              onClick={() => vehicleQuery.refetch()}
              className="rounded-full px-8"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Contact Details */}
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      Contact Information
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Tell us who&apos;s driving
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="guestName"
                      className="font-bold text-xs uppercase tracking-widest text-muted-foreground"
                    >
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="guestName"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="John Doe"
                        className="rounded-xl h-12 pl-10 bg-muted/50 border-transparent focus:bg-background transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="guestPhone"
                      className="font-bold text-xs uppercase tracking-widest text-muted-foreground"
                    >
                      Phone Number (Required)
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="guestPhone"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="rounded-xl h-12 pl-10 bg-muted/50 border-transparent focus:bg-background transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label
                      htmlFor="guestEmail"
                      className="font-bold text-xs uppercase tracking-widest text-muted-foreground"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="guestEmail"
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="rounded-xl h-12 pl-10 bg-muted/50 border-transparent focus:bg-background transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                      Required for your booking confirmation and receipt.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Trip Details */}
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      Trip Logistics
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      When and where you&apos;ll be on the road
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
                      Rental Duration
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full h-14 rounded-xl justify-start text-left font-medium bg-muted/50 border-transparent hover:bg-muted transition-all px-4",
                            !dateRange?.from && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <span className="text-foreground">
                                {format(dateRange.from, "PPP")} —{" "}
                                {format(dateRange.to, "PPP")}
                              </span>
                            ) : (
                              <span className="text-foreground">
                                {format(dateRange.from, "PPP")}
                              </span>
                            )
                          ) : (
                            <span>Pick your travel dates</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          numberOfMonths={2}
                          selected={dateRange}
                          onSelect={(range: DateRange | undefined) =>
                            setDateRange(range)
                          }
                          disabled={(date: Date) => {
                            const day = startOfDay(date);
                            const today = startOfDay(new Date());
                            if (isBefore(day, today)) return true;
                            if (dateRange?.from) {
                              const from = startOfDay(dateRange.from);
                              const maxEnd = addMonths(from, 4);
                              if (isAfter(day, maxEnd)) return true;
                            }
                            return false;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <InlineError message={dateValidationError} />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="pickupLocationId"
                      className="font-bold text-xs uppercase tracking-widest text-muted-foreground"
                    >
                      Pick-up From
                    </Label>
                    <Select
                      value={pickupLocationId}
                      onValueChange={(value: string) =>
                        setPickupLocationId(value)
                      }
                    >
                      <SelectTrigger
                        id="pickupLocationId"
                        className="h-12 rounded-xl bg-muted/50 border-transparent focus:ring-primary"
                      >
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="returnLocationId"
                      className="font-bold text-xs uppercase tracking-widest text-muted-foreground"
                    >
                      Return To
                    </Label>
                    <Select
                      value={returnLocationId}
                      onValueChange={(value: string) =>
                        setReturnLocationId(value)
                      }
                    >
                      <SelectTrigger
                        id="returnLocationId"
                        className="h-12 rounded-xl bg-muted/50 border-transparent focus:ring-primary"
                      >
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={calculate}
                    disabled={!canCalculate || loading}
                    className="rounded-full px-8 h-12 font-bold shadow-sm"
                  >
                    {loading ? (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Calculate Final Price
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <aside className="sticky top-24 space-y-6">
              {/* Vehicle Summary Mini-Card */}
              {vehicleQuery.data && (
                <Card className="overflow-hidden rounded-3xl border-none shadow-lg">
                  <div className="aspect-video relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <div className="absolute bottom-4 left-4 z-20 text-white">
                      <h4 className="font-bold text-lg">
                        {vehicleQuery.data.make} {vehicleQuery.data.model}
                      </h4>
                      <p className="text-xs opacity-80">
                        {vehicleQuery.data.year} Model • $
                        {vehicleQuery.data.dailyRate}/day
                      </p>
                    </div>
                    {/* Note: In a real app we'd use the actual vehicle image here */}
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white/20">
                      <Car className="h-12 w-12" />
                    </div>
                  </div>
                </Card>
              )}

              {/* Pricing & Checkout Card */}
              <Card className="overflow-hidden rounded-3xl border-2 border-primary/10 shadow-2xl">
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-2 text-center">
                    <h3 className="text-2xl font-bold">Booking Summary</h3>
                    {days && (
                      <Badge
                        variant="secondary"
                        className="rounded-full px-4 py-1"
                      >
                        {days} Day{Number(days) !== 1 ? "s" : ""} Rental
                      </Badge>
                    )}
                  </div>

                  {pricing ? (
                    <div className="space-y-4 pt-6 border-t">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-muted-foreground">
                          Rental Rate
                        </span>
                        <span>
                          ${pricing.dailyRate} x {pricing.totalDays}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-muted-foreground">
                          Insurance & Fees
                        </span>
                        <span className="text-emerald-600 font-bold uppercase tracking-widest text-[10px]">
                          Included
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-dashed">
                        <span className="text-lg font-bold">Total Price</span>
                        <span className="text-2xl font-bold text-primary">
                          ${pricing.totalPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 mt-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-primary">
                            Due Now (Deposit)
                          </span>
                          <span className="text-xl font-extrabold text-primary">
                            ${pricing.depositAmount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-primary/60 mt-1 italic text-center">
                          Remaining amount due at pick-up.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-muted/30 rounded-2xl border-2 border-dashed">
                      <CreditCard className="h-10 w-10 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground max-w-[180px]">
                        Select your trip dates to see exact pricing and deposit
                        details.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 pt-4">
                    <Button
                      onClick={submit}
                      disabled={!pricing || loading || Boolean(checkoutUrl)}
                      className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-95 group"
                    >
                      {loading ? (
                        <RefreshCcw className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Zap className="h-5 w-5 mr-2 fill-current transition-transform group-hover:scale-110" />
                      )}
                      {checkoutUrl ? "Redirecting..." : "Pay Deposit & Book"}
                    </Button>

                    <div className="flex flex-col gap-3 pt-2">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                        <span>Encrypted & secure payment processing</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span>Instant confirmation via email</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {checkoutUrl && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs font-medium text-amber-700">
                    Redirect stuck? Use the button above to pay manually.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      <InlineError
        message={error ?? locationsError}
        className="fixed bottom-8 right-8 z-50 max-w-sm shadow-2xl"
      />
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <PageContainer className="py-8">
        <Suspense
          fallback={
            <div className="w-full text-center">Loading booking...</div>
          }
        >
          <BookingForm />
        </Suspense>
      </PageContainer>
    </div>
  );
}
