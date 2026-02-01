import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  dailyRate: number;
  mileage: number;
  color?: string | null;
  fuelType: string;
  transmission: string;
  seats: number;
  images?: string[] | null;
  location?: {
    id: string;
    name: string;
    address: string;
  };
};

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await apiFetch<Vehicle>(`/vehicles/${id}`);

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/vehicles">← Back to vehicles</Link>
      </div>

      <h1 style={{ fontSize: 28, marginBottom: 8 }}>
        {vehicle.make} {vehicle.model} ({vehicle.year})
      </h1>

      <div style={{ opacity: 0.8, marginBottom: 16 }}>
        ${vehicle.dailyRate}/day
        {vehicle.location ? ` • ${vehicle.location.name}` : ""}
      </div>

      <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
        <div>Fuel: {vehicle.fuelType}</div>
        <div>Transmission: {vehicle.transmission}</div>
        <div>Seats: {vehicle.seats}</div>
        <div>Mileage: {vehicle.mileage}</div>
        {vehicle.color ? <div>Color: {vehicle.color}</div> : null}
        {vehicle.location ? (
          <div>Location: {vehicle.location.name} — {vehicle.location.address}</div>
        ) : null}
      </div>

      <Link href={`/bookings/new?vehicleId=${vehicle.id}`}>Request booking</Link>
    </main>
  );
}
