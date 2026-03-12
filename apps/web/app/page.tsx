import { VehiclesBrowser } from "../components/vehicles-browser";
import { SiteHeader } from "../components/site-header";
import { Button } from "../components/ui/button";
import Link from "next/link";
import { Car, ShieldCheck, Clock, Zap, ArrowRight, Star } from "lucide-react";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{
    make?: string;
    model?: string;
    status?: string;
    locationId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const hasFilters = Object.keys(resolvedSearchParams || {}).length > 0;

  if (hasFilters) {
    return (
      <>
        <SiteHeader variant="inventory" showAdminCtas={false} />
        <VehiclesBrowser
          action="/"
          title="Search Results"
          searchParams={searchParams}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-950 py-24 sm:py-32">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(45,212,191,0.15),transparent_50%)] z-10" />
            {/* Background pattern or subtle image could go here */}
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
          </div>

          <div className="container relative z-20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-6 ring-1 ring-inset ring-primary/20 animate-in fade-in slide-in-from-bottom-3 duration-700">
                <Star className="h-4 w-4 fill-current animate-pulse" />
                <span>Trusted by 10,000+ Happy Drivers</span>
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                Drive your{" "}
                <span className="text-primary italic bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  ambition
                </span>{" "}
                forward.
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-300 max-w-xl animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-150">
                From luxury sedans to rugged adventurers, find the perfect
                companion for your next journey. Seamless booking, transparent
                pricing, and 24/7 support. Your adventure starts here.
              </p>
              <div className="mt-10 flex items-center gap-x-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20"
                >
                  <Link href="/vehicles">
                    Explore Fleet
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="text-white hover:text-primary hover:bg-white/5 rounded-full px-8"
                >
                  <Link href="/admin/login">List Your Vehicle</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-background">
          <div className="container">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Why Choose <span className="text-primary">CarRental</span>?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Experience the difference with our premium service and
                commitment to excellence
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-card/50 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 duration-300">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary ring-1 ring-primary/10">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-xl">Fully Insured</h3>
                <p className="text-muted-foreground">
                  Every rental includes comprehensive coverage for your peace of
                  mind.
                </p>
              </div>
              <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-card/50 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 duration-300">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary ring-1 ring-primary/10">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-xl">24/7 Support</h3>
                <p className="text-muted-foreground">
                  Our dedicated team is always available to help you on the
                  road.
                </p>
              </div>
              <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-card/50 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 duration-300">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary ring-1 ring-primary/10">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-xl">Instant Booking</h3>
                <p className="text-muted-foreground">
                  Confirm your reservation in seconds with our streamlined
                  process.
                </p>
              </div>
              <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-card/50 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 duration-300">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary ring-1 ring-primary/10">
                  <Car className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-xl">Premium Fleet</h3>
                <p className="text-muted-foreground">
                  Meticulously maintained vehicles ranging from economy to
                  luxury.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
          <div className="container">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Loved by Drivers Everywhere
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Don&apos;t just take our word for it - hear from our satisfied
                customers
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="p-6 rounded-2xl bg-background border shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  &quot;Absolutely seamless experience! The booking process was
                  quick, and the car was in pristine condition. Will definitely
                  rent again.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    SM
                  </div>
                  <div>
                    <p className="font-semibold">Sarah Mitchell</p>
                    <p className="text-sm text-muted-foreground">
                      Business Traveler
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-background border shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  &quot;Great selection of vehicles and transparent pricing. The
                  24/7 support team was incredibly helpful when I had
                  questions.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    JD
                  </div>
                  <div>
                    <p className="font-semibold">James Davidson</p>
                    <p className="text-sm text-muted-foreground">
                      Weekend Explorer
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-background border shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  &quot;Premium fleet with excellent maintenance. Every vehicle
                  I&apos;ve rented has been spotless and performed
                  flawlessly.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    EC
                  </div>
                  <div>
                    <p className="font-semibold">Emily Chen</p>
                    <p className="text-sm text-muted-foreground">
                      Frequent Renter
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Results / Browse Section */}
        <section className="py-16 bg-background border-t">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Featured Vehicles
                </h2>
                <p className="text-muted-foreground mt-2">
                  Discover our handpicked selection of premium vehicles
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="rounded-full shadow-sm"
              >
                <Link href="/vehicles">
                  View All Fleet
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <VehiclesBrowser action="/" title="" searchParams={searchParams} />
          </div>
        </section>
      </main>

      <footer className="border-t bg-card py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
                <Car className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">
                Car<span className="text-primary">Rental</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} CarRental System. All rights
              reserved.
            </p>
            <div className="flex gap-6 text-sm font-medium">
              <Link href="/terms" className="hover:text-primary">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-primary">
                Privacy
              </Link>
              <Link href="/contact" className="hover:text-primary">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
