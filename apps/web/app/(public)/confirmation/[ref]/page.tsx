import Link from "next/link";
import {
  CheckCircle2,
  ClipboardCheck,
  ArrowRight,
  Home,
  Car,
} from "lucide-react";

import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;

  return (
    <div className="min-h-screen bg-muted/20">
      <SiteHeader showAdminCtas={false} />
      <main className="py-20 flex items-center justify-center">
        <PageContainer>
          <div className="max-w-2xl mx-auto">
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-500">
              <CardHeader className="bg-slate-900 text-white p-10 text-center space-y-4">
                <div className="mx-auto h-20 w-24 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <ClipboardCheck className="h-12 w-12" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-extrabold tracking-tight">
                    Booking Received
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-lg">
                    We&apos;ve received your request and it&apos;s being
                    processed.
                  </CardDescription>
                </div>
                <div className="pt-4 flex justify-center">
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white border-white/20 px-4 py-1.5 rounded-full text-sm font-mono tracking-wider"
                  >
                    REF: {ref}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-10 bg-background text-center">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">Important Information</h3>
                  <div className="grid gap-4 text-left sm:grid-cols-2">
                    <div className="p-5 rounded-2xl bg-muted/50 border border-border/50 space-y-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-sm">Deposit Status</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        If you&apos;ve completed your deposit, your booking is
                        priority and will be confirmed shortly.
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-muted/50 border border-border/50 space-y-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Car className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-sm">Preparation</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Our team is verifying the vehicle availability and
                        ensuring it&apos;s in top condition for you.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    You&apos;ll receive an email notification as soon as your
                    booking status is updated by our sales team.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button
                      asChild
                      size="lg"
                      className="w-full sm:w-auto rounded-full px-8 font-bold shadow-lg shadow-primary/20"
                    >
                      <Link
                        href="/vehicles"
                        className="flex items-center gap-2"
                      >
                        Browse More Fleet
                        <ArrowRight className="h-5 w-5" />
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
                        Return Home
                      </Link>
                    </Button>
                  </div>
                </div>

                <footer className="pt-6 border-t">
                  <p className="text-xs text-muted-foreground">
                    Need assistance? Call us at{" "}
                    <span className="font-bold text-foreground">
                      +1 (555) 000-RENT
                    </span>{" "}
                    or email support@carrental.com
                  </p>
                </footer>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
