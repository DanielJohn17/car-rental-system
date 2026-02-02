import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import { PageContainer } from "../../../../components/page-container";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";

type DashboardOverview = {
  pendingBookings: number;
  activeRentals: number;
  totalRevenue: number;
  fleetStatus: Record<string, number>;
};

export default async function AdminDashboardPage() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    redirect("/admin/login");
  }

  const overview = await apiFetch<DashboardOverview>("/dashboard/overview", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <form action="/api/admin/logout" method="post">
          <Button type="submit" variant="secondary">
            Logout
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-w-full overflow-x-auto rounded-md border bg-muted p-4 text-sm">
            {JSON.stringify(overview, null, 2)}
          </pre>
        </CardContent>
      </Card>

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
    </PageContainer>
  );
}
