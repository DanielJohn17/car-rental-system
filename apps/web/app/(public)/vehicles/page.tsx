import Link from "next/link";
import { apiFetch } from "../../../lib/api";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  dailyRate: number;
  images?: string[] | null;
  location?: {
    id: string;
    name: string;
    address: string;
  };
};

type VehicleSearchResponse = {
  data: Vehicle[];
  total: number;
};

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams?: { make?: string; model?: string; locationId?: string };
}) {
  const make = searchParams?.make ?? "";
  const model = searchParams?.model ?? "";
  const locationId = searchParams?.locationId ?? "";

  const query = new URLSearchParams();
  if (make) query.set("make", make);
  if (model) query.set("model", model);
  if (locationId) query.set("locationId", locationId);
  query.set("limit", "20");
  query.set("offset", "0");

  const { data, total } = await apiFetch<VehicleSearchResponse>(
    `/vehicles/search?${query.toString()}`,
  );

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Available vehicles</h1>

      <form
        action="/vehicles"
        method="get"
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "1fr 1fr 1fr auto",
          alignItems: "end",
          marginBottom: 16,
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span>Make</span>
          <input name="make" defaultValue={make} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Model</span>
          <input name="model" defaultValue={model} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Location ID</span>
          <input name="locationId" defaultValue={locationId} />
        </label>

        <button type="submit">Search</button>
      </form>

      <p style={{ marginBottom: 16 }}>Total: {total}</p>

      <div style={{ display: "grid", gap: 12 }}>
        {data.map((v) => (
          <div
            key={v.id}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 12,
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>
                {v.make} {v.model} ({v.year})
              </strong>
              <span>${v.dailyRate}/day</span>
            </div>

            {v.location ? (
              <div style={{ opacity: 0.8 }}>
                {v.location.name} — {v.location.address}
              </div>
            ) : null}

            <div>
              <Link href={`/vehicles/${v.id}`}>View details</Link>
            </div>
          </div>
        ))}

        {data.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No vehicles found.</div>
        ) : null}
      </div>
    </main>
  );
}
