import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VehicleImagePlaceholder } from "@/components/image-placeholder";
import {
  Car,
  Fuel,
  Settings2,
  Users,
  MapPin,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Clock,
} from "lucide-react";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  dailyRate: number;
  mileage: number;
  color?: string | null;
  fuelType: string;
  transmission: string;
  seats: number;
  images?: string[] | null;
  location?: {
    id: string;
    name: string;
    address: string;
  };
};

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await apiFetch<Vehicle>(`/vehicles/${id}`);

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="rounded-full bg-muted p-6 text-muted-foreground">
              <Car className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Vehicle not found
              </h1>
              <p className="text-muted-foreground max-w-sm mx-auto">
                The vehicle you&apos;re looking for doesn&apos;t exist or has
                been removed from our fleet.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/vehicles" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to fleet
              </Link>
            </Button>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="pb-20">
        <div className="bg-muted/30 border-b">
          <PageContainer className="py-6">
            <nav className="flex mb-6">
              <Link
                href="/vehicles"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to All Vehicles
              </Link>
            </nav>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                  {vehicle.make}{" "}
                  <span className="text-primary">{vehicle.model}</span>
                </h1>
                <div className="flex items-center gap-4 mt-4 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">{vehicle.year} Model</span>
                  </div>
                  {vehicle.location && (
                    <div className="flex items-center gap-1.5 border-l pl-4">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {vehicle.location.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">
                    ${vehicle.dailyRate}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    / day
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Instant Booking Available
                </div>
              </div>
            </div>
          </PageContainer>
        </div>

        <PageContainer className="mt-10">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Main Content: Images & Details */}
            <div className="lg:col-span-2 space-y-10">
              <section>
                <div className="relative aspect-video overflow-hidden rounded-3xl border shadow-xl bg-card">
                  <VehicleImagePlaceholder
                    vehicle={vehicle}
                    className="w-full h-full object-cover"
                    width={1200}
                    height={800}
                  />
                  <div className="absolute top-6 left-6 flex gap-2">
                    <div className="rounded-full bg-background/90 backdrop-blur-sm px-4 py-1.5 text-xs font-bold shadow-sm border border-border/50">
                      PREMIUM FLEET
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/30 border transition-colors hover:border-primary/30">
                  <Fuel className="h-6 w-6 text-primary mb-3" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Fuel
                  </span>
                  <span className="font-bold mt-1 capitalize">
                    {vehicle.fuelType}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/30 border transition-colors hover:border-primary/30">
                  <Settings2 className="h-6 w-6 text-primary mb-3" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Shift
                  </span>
                  <span className="font-bold mt-1 capitalize">
                    {vehicle.transmission}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/30 border transition-colors hover:border-primary/30">
                  <Users className="h-6 w-6 text-primary mb-3" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Seats
                  </span>
                  <span className="font-bold mt-1">{vehicle.seats} Adults</span>
                </div>
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/30 border transition-colors hover:border-primary/30">
                  <Car className="h-6 w-6 text-primary mb-3" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Mileage
                  </span>
                  <span className="font-bold mt-1">
                    {vehicle.mileage.toLocaleString()} mi
                  </span>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight">
                  Features & Description
                </h2>
                <div className="prose prose-slate max-w-none text-muted-foreground">
                  <p>
                    Experience the ultimate driving pleasure with the{" "}
                    {vehicle.year} {vehicle.make} {vehicle.model}. This vehicle
                    has been meticulously maintained to provide a smooth,
                    reliable, and premium experience for your next trip.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-foreground font-medium">
                        Full Tank on Delivery
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-foreground font-medium">
                        Comprehensive Insurance
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-foreground font-medium">
                        Cleanliness Guaranteed
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-foreground font-medium">
                        24/7 Roadside Assistance
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar: Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="overflow-hidden rounded-3xl border-2 border-primary/10 shadow-2xl">
                  <CardContent className="p-8 space-y-8">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold">Ready to ride?</h3>
                      <p className="text-muted-foreground">
                        Complete your booking in just a few clicks.
                      </p>
                    </div>

                    <div className="space-y-4 pt-6 border-t">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-muted-foreground">
                          Daily Rental
                        </span>
                        <span>${vehicle.dailyRate}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-muted-foreground">
                          Insurance & Fees
                        </span>
                        <span className="text-emerald-600">Included</span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-dashed">
                        <span className="text-lg font-bold">
                          Total (per day)
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          ${vehicle.dailyRate}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Button
                        asChild
                        size="lg"
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
                      >
                        <Link href={`/bookings/new?vehicleId=${vehicle.id}`}>
                          Book Now
                          <Zap className="ml-2 h-5 w-5 fill-current" />
                        </Link>
                      </Button>

                      <div className="flex flex-col gap-3 pt-2">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <span>Secure payment processing</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>Free cancellation within 24 hours</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {vehicle.location && (
                  <div className="mt-6 p-6 rounded-3xl bg-muted/30 border border-border/50">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Pick-up Location
                    </h4>
                    <p className="text-sm font-medium">
                      {vehicle.location.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {vehicle.location.address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
