"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Car, Menu, X } from "lucide-react";
import { useState } from "react";

export function SiteHeader({
  showAdminCtas = true,
  variant = "default",
}: {
  showAdminCtas?: boolean;
  variant?: "default" | "inventory";
}) {
  const isInventory = variant === "inventory";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-all hover:opacity-90"
          >
            <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl text-primary-foreground group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
              <Car className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Car<span className="text-primary">Rental</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {isInventory ? (
              <>
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-muted transition-colors"
                >
                  Explore Vehicles
                </Link>
                <Link
                  href="/admin/login"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                >
                  Renter Portal
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/vehicles"
                  className="px-4 py-2 text-sm font-medium hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  Browse Fleet
                </Link>
                <Link
                  href="/#features"
                  className="px-4 py-2 text-sm font-medium hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="/#about"
                  className="px-4 py-2 text-sm font-medium hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  About
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {showAdminCtas ? (
            <>
              <Button
                asChild
                variant="ghost"
                className="hidden sm:inline-flex font-semibold hover:bg-primary/5 hover:text-primary"
              >
                <Link href="/admin/login">Login</Link>
              </Button>
              <Button
                asChild
                className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 font-semibold"
              >
                <Link href="/admin/register">Become a Renter</Link>
              </Button>
            </>
          ) : !isInventory ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link href="/">Back to Home</Link>
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur animate-in slide-in-from-top duration-200">
          <nav className="container py-4 flex flex-col gap-2">
            {isInventory ? (
              <>
                <Link
                  href="/"
                  className="px-4 py-3 text-sm font-semibold rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Explore Vehicles
                </Link>
                <Link
                  href="/admin/login"
                  className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Renter Portal
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/vehicles"
                  className="px-4 py-3 text-sm font-medium hover:bg-primary/5 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse Fleet
                </Link>
                <Link
                  href="/#features"
                  className="px-4 py-3 text-sm font-medium hover:bg-primary/5 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="/#about"
                  className="px-4 py-3 text-sm font-medium hover:bg-primary/5 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                {showAdminCtas && (
                  <>
                    <div className="border-t my-2" />
                    <Link
                      href="/admin/login"
                      className="px-4 py-3 text-sm font-medium hover:bg-primary/5 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/admin/register"
                      className="px-4 py-3 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Become a Renter
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
