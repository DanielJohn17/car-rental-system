import Link from "next/link";
import { CheckCircle2, Home, Car } from "lucide-react";

import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-muted/20">
      <SiteHeader showAdminCtas={false} />
      <main className="flex items-center justify-center py-20">
        <PageContainer>
          <div className="max-w-2xl mx-auto">
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
              <div className="bg-primary p-12 flex flex-col items-center justify-center text-primary-foreground text-center space-y-6">
                <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center animate-in zoom-in duration-500">
                  <CheckCircle2 className="h-14 w-14" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-extrabold tracking-tight">
                    Booking Secured!
                  </h1>
                  <p className="text-primary-foreground/80 text-lg font-medium">
                    Your payment was successful and your vehicle is being
                    reserved.
                  </p>
                </div>
              </div>
              <CardContent className="p-10 space-y-8 bg-background">
                <div className="space-y-4 text-center">
                  <h2 className="text-xl font-bold">What&apos;s next?</h2>
                  <div className="grid gap-4 text-left sm:grid-cols-2">
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                      <h3 className="font-bold text-sm mb-1">Check Email</h3>
                      <p className="text-xs text-muted-foreground">
                        We&apos;ve sent a detailed confirmation and receipt to
                        your inbox.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                      <h3 className="font-bold text-sm mb-1">Pick-up Info</h3>
                      <p className="text-xs text-muted-foreground">
                        Our team will verify your details and prepare the
                        vehicle for your arrival.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Button
                    asChild
                    size="lg"
                    className="w-full sm:w-auto rounded-full px-8 font-bold shadow-lg shadow-primary/20"
                  >
                    <Link href="/vehicles" className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Browse More Vehicles
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto rounded-full px-8 font-bold"
                  >
                    <Link href="/" className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Back to Home
                    </Link>
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground italic">
                  Need help? Contact our 24/7 support team at
                  support@carrental.com
                </p>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
