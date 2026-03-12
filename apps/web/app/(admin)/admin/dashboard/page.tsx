import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import { PageContainer } from "../../../../components/page-container";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../../components/ui/card";
import {
  DollarSign,
  Users,
  ClipboardList,
  Car,
  Plus,
  ArrowUpRight,
  Settings,
  LogOut,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

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

function statusBadgeVariant(
  status?: string,
): "default" | "secondary" | "destructive" | "outline" {
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

  let overview: DashboardOverview;

  try {
    overview = await apiFetch<DashboardOverview>("/dashboard/overview", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
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
    <div className="min-h-screen bg-muted/20">
      <PageContainer>
        {/* Header Section */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <LayoutDashboard className="h-10 w-10 text-primary" />
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Manage your fleet and track performance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/admin/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </Button>
            <form action="/api/admin/logout" method="post">
              <Button
                type="submit"
                variant="ghost"
                className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </form>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-background to-primary/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <DollarSign className="h-12 w-12" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(overview.totalRevenue ?? 0).toLocaleString()}
              </div>
              <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12.5% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-background to-blue-500/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users className="h-12 w-12" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Active Rentals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {overview.activeRentals ?? 0}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Currently on the road
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-background to-amber-500/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ClipboardList className="h-12 w-12" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Pending Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                +{overview.pendingBookings ?? 0}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Action required
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-background to-emerald-500/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Car className="h-12 w-12" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Fleet Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">
                {overview.fleetStatus?.available || 0}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Available for rent
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            Quick Actions
          </h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
            <Link
              href="/admin/vehicles"
              className="group p-4 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center"
            >
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Car className="h-6 w-6" />
              </div>
              <span className="font-semibold text-sm text-foreground">
                Manage Vehicles
              </span>
            </Link>
            <Link
              href="/admin/bookings"
              className="group p-4 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center"
            >
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform">
                <ClipboardList className="h-6 w-6" />
              </div>
              <span className="font-semibold text-sm text-foreground">
                Review Bookings
              </span>
            </Link>
            <Link
              href="/admin/users"
              className="group p-4 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center"
            >
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <span className="font-semibold text-sm text-foreground">
                Manage Users
              </span>
            </Link>
            <Link
              href="/admin/vehicles"
              className="group p-4 rounded-2xl border bg-primary text-primary-foreground hover:shadow-lg transition-all flex flex-col items-center gap-3 text-center"
            >
              <div className="p-3 rounded-xl bg-white/20 text-white group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6" />
              </div>
              <span className="font-semibold text-sm">Add New Vehicle</span>
            </Link>
          </div>
        </div>

        {/* Recent Vehicles Section */}
        <div className="mt-16 mb-20">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Recent Vehicles
              </h2>
              <p className="text-muted-foreground mt-1">
                Overview of your most recently added fleet members.
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              className="rounded-full group hover:text-primary"
            >
              <Link href="/admin/vehicles" className="flex items-center gap-2">
                View all vehicles
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Button>
          </div>

          {vehicles.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/50">
              <CardContent className="py-20">
                <div className="text-center flex flex-col items-center gap-4">
                  <div className="rounded-full bg-muted p-6 text-muted-foreground">
                    <Car className="h-12 w-12" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">No vehicles yet</h3>
                    <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
                      Start building your fleet by adding your first vehicle.
                    </p>
                  </div>
                  <Button
                    asChild
                    className="mt-4 rounded-full px-8 shadow-lg shadow-primary/20"
                  >
                    <Link href="/admin/vehicles">Add your first vehicle</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => (
                <Card
                  key={v.id}
                  className="group overflow-hidden rounded-2xl border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-xl"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                          {v.make} {v.model}
                        </CardTitle>
                        <CardDescription>{v.year}</CardDescription>
                      </div>
                      <Badge
                        variant={statusBadgeVariant(v.status)}
                        className="rounded-full px-3 py-1 font-semibold uppercase tracking-wider text-[10px]"
                      >
                        {v.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-y border-border/40">
                        <span className="text-sm text-muted-foreground">
                          Daily Rate
                        </span>
                        <span className="font-bold text-lg">
                          ${v.dailyRate}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {v.status === "AVAILABLE" ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Ready for rent
                          </div>
                        ) : v.status === "RENTED" ? (
                          <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium bg-blue-500/10 px-2 py-1 rounded-full">
                            <Clock className="h-3 w-3" /> Currently active
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-destructive font-medium bg-destructive/10 px-2 py-1 rounded-full">
                            <AlertCircle className="h-3 w-3" /> Requires
                            attention
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          asChild
                          className="flex-1 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                          <Link href={`/admin/vehicles/${v.id}`}>Manage</Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="flex-1 rounded-xl hover:bg-muted active:scale-95"
                        >
                          <Link href={`/admin/vehicles/${v.id}`}>
                            Edit Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
