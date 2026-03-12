import { apiFetch } from "@/lib/api";
import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";
import { VehicleCard } from "@/components/vehicle-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Store, User, Car, MapPin, Star, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;

  // Assuming the API returns vehicles for a specific account/renter
  const vehiclesResponse = await apiFetch<{ data: unknown[]; total: number }>(
    `/vehicles/search?limit=20`,
  );

  const vehicles = vehiclesResponse?.data ?? [];

  return (
    <div className="min-h-screen bg-muted/20">
      <SiteHeader />

      <main className="pb-20">
        {/* Storefront Hero/Profile Header */}
        <section className="bg-slate-900 text-white py-16">
          <PageContainer>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="h-24 w-24 rounded-3xl bg-primary/20 flex items-center justify-center text-primary ring-4 ring-primary/10">
                <Store className="h-12 w-12" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                  <h1 className="text-4xl font-extrabold tracking-tight">
                    Premium Fleet
                  </h1>
                  <Badge className="bg-primary text-primary-foreground font-bold">
                    Verified Renter
                  </Badge>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-400">
                  <div className="flex items-center gap-1.5 text-sm">
                    <User className="h-4 w-4 text-primary" />
                    <span>Account ID: {accountId.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm border-l border-slate-700 pl-4">
                    <Car className="h-4 w-4 text-primary" />
                    <span>{vehicles.length} Vehicles Listed</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm border-l border-slate-700 pl-4">
                    <Star className="h-4 w-4 text-amber-400 fill-current" />
                    <span>4.9 Renter Rating</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-1" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Insured
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <MapPin className="h-6 w-6 text-primary mx-auto mb-1" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Local
                  </p>
                </div>
              </div>
            </div>
          </PageContainer>
        </section>

        {/* Fleet Grid */}
        <PageContainer className="mt-12">
          <div className="flex items-center justify-between mb-8 border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Available Collection
              </h2>
              <p className="text-muted-foreground text-sm">
                Meticulously maintained vehicles ready for your next trip.
              </p>
            </div>
            <div className="hidden sm:block">
              <Badge variant="outline" className="rounded-full px-4 py-1">
                Showing all {vehicles.length} vehicles
              </Badge>
            </div>
          </div>

          {vehicles.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/50">
              <CardContent className="py-20 text-center flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-6 text-muted-foreground">
                  <Car className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">No vehicles found</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    This renter doesn&apos;t have any available vehicles at the
                    moment. Please check back later.
                  </p>
                </div>
                <Button asChild className="mt-4 rounded-full">
                  <Link href="/vehicles">Browse Other Fleet</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => (
                <VehicleCard
                  key={(v as { id: string }).id}
                  vehicle={v as never}
                />
              ))}
            </div>
          )}
        </PageContainer>
      </main>

      {/* Trust Footer for Storefront */}
      <section className="bg-background border-t py-16">
        <PageContainer>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <h4 className="font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Secure Booking
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All bookings through our platform are protected and verified for
                your peace of mind.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Quality Guaranteed
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We work closely with our renters to ensure every vehicle meet
                our high standards.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Support
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dedicated support team available 24/7 to assist with your rental
                experience.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
