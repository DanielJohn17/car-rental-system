import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import { PageContainer } from "../../../../components/page-container";
import { InlineError } from "../../../../components/inline-error";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";

type DashboardOverview = {
  pendingBookings: number;
  activeRentals: number;
  totalRevenue: number;
  fleetStatus: Record<string, number>;
};

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  dailyRate: number;
  status: string;
};

type VehicleListResponse = {
  data: Vehicle[];
  total: number;
};

function statusBadgeVariant(status?: string):
  | "default"
  | "secondary"
  | "destructive"
  | "outline" {
  const s = (status ?? "").toUpperCase();
  if (s === "AVAILABLE") return "default";
  if (s === "MAINTENANCE" || s === "DAMAGED") return "destructive";
  if (s === "RENTED" || s === "RESERVED") return "secondary";
  return "outline";
}

export default async function AdminDashboardPage() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    redirect("/admin/login");
  }

  const stripeError: string | undefined = undefined;

  let overview: DashboardOverview;

  try {
    overview = await apiFetch<DashboardOverview>("/dashboard/overview", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);

    // Provide fallback data when backend is unavailable
    overview = {
      pendingBookings: 0,
      activeRentals: 0,
      totalRevenue: 0,
      fleetStatus: {
        available: 0,
        maintenance: 0,
        rented: 0,
      },
    };
  }

  let vehiclesResponse: VehicleListResponse;

  try {
    vehiclesResponse = await apiFetch<VehicleListResponse>(
      "/vehicles?limit=6&offset=0",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch vehicles:", error);
    vehiclesResponse = { data: [], total: 0 };
  }

  const vehicles = vehiclesResponse?.data ?? [];

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <form action="/api/admin/stripe/connect" method="post">
            <Button type="submit" variant="outline">
              Connect Stripe
            </Button>
          </form>
          <Button asChild variant="outline">
            <Link href="/admin/stripe-connect-demo">Stripe Connect demo</Link>
          </Button>
          <form action="/api/admin/logout" method="post">
            <Button type="submit" variant="secondary">
              Logout
            </Button>
          </form>
        </div>
      </div>

      <InlineError message={stripeError} className="mb-4" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overview.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">
              Total revenue from deposits
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Rentals
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{overview.activeRentals}</div>
            <p className="text-xs text-muted-foreground">
              Currently active rentals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Bookings
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{overview.pendingBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              Bookings awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Status</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.fleetStatus?.available || 0} Available
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.fleetStatus?.maintenance || 0} in maintenance
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/admin/vehicles">Manage vehicles</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/bookings">Pending bookings</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/users">Manage users</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/vehicles">Public vehicles</Link>
        </Button>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Your vehicles</h2>
            <p className="text-sm text-muted-foreground">
              Total: {vehiclesResponse.total}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/vehicles">View all</Link>
          </Button>
        </div>

        {vehicles.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <div className="text-lg font-medium">No vehicles yet</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first vehicle to start receiving bookings.
                </p>
                <div className="mt-4">
                  <Button asChild>
                    <Link href="/admin/vehicles">Add a vehicle</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <Card key={v.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">
                      {v.make} {v.model} ({v.year})
                    </CardTitle>
                    <Badge variant={statusBadgeVariant(v.status)}>
                      {v.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm text-muted-foreground">
                    ${v.dailyRate}/day
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Button asChild variant="link" className="px-0">
                      <Link href={`/admin/vehicles/${v.id}`}>Edit</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/vehicles/${v.id}`}>Manage</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
