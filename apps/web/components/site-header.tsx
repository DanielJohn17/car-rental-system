import Link from "next/link";

import { Button } from "./ui/button";

export function SiteHeader({
  showAdminCtas = true,
  variant = "default",
}: {
  showAdminCtas?: boolean;
  variant?: "default" | "inventory";
}) {
  if (variant === "inventory") {
    return (
      <header className="border-b bg-background">
        <div className="container flex items-center gap-6 py-4">
          <Link href="/" className="font-semibold tracking-[0.25em]">
            CAR RENTAL
          </Link>

          <nav className="hidden flex-1 justify-center md:flex">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/" className="text-foreground">
                Vehicles
              </Link>
              <Link href="/admin/login">Renter</Link>
            </div>
          </nav>

          <div className="ml-auto" />
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="font-semibold tracking-tight">
          Car Rental
        </Link>

        {showAdminCtas ? (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/login">Renter Login</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/register">Become a Renter</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
