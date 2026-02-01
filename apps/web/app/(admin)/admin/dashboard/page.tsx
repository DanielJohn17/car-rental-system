import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "../../../../lib/api";

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
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Dashboard</h1>
        <form action="/api/admin/logout" method="post">
          <button type="submit">Logout</button>
        </form>
      </div>

      <pre
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 8,
          padding: 12,
          overflowX: "auto",
        }}
      >
        {JSON.stringify(overview, null, 2)}
      </pre>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/admin/vehicles">Manage vehicles</Link>
          <Link href="/admin/bookings">Pending bookings</Link>
          <Link href="/admin/users">Manage users</Link>
          <Link href="/vehicles">Public vehicles</Link>
        </div>
      </div>
    </main>
  );
}
