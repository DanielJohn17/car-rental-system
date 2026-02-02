import Link from "next/link";

import { Button } from "./ui/button";

export function SiteHeader({
  showAdminCtas = true,
}: {
  showAdminCtas?: boolean;
}) {
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
