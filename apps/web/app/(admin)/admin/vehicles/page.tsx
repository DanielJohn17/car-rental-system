"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Location = {
  id: string;
  name: string;
  address: string;
};

type LocationListResponse = {
  data: Location[];
  total: number;
};

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color?: string | null;
  fuelType: string;
  transmission: string;
  seats: number;
  dailyRate: number;
  hourlyRate?: number | null;
  locationId: string;
  status: string;
  mileage: number;
  createdAt: string;
};

type VehicleListResponse = {
  data: Vehicle[];
  total: number;
};

const VEHICLE_STATUSES = [
  "AVAILABLE",
  "RENTED",
  "MAINTENANCE",
  "DAMAGED",
  "RESERVED",
] as const;

const FUEL_TYPES = ["PETROL", "DIESEL", "ELECTRIC", "HYBRID"] as const;
const TRANSMISSIONS = ["MANUAL", "AUTO"] as const;

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [locations, setLocations] = useState<Location[]>([]);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [licensePlate, setLicensePlate] = useState("");
  const [vin, setVin] = useState("");
  const [color, setColor] = useState("");
  const [fuelType, setFuelType] = useState<(typeof FUEL_TYPES)[number]>(
    "PETROL",
  );
  const [transmission, setTransmission] = useState<
    (typeof TRANSMISSIONS)[number]
  >("AUTO");
  const [seats, setSeats] = useState("5");
  const [dailyRate, setDailyRate] = useState("0");
  const [hourlyRate, setHourlyRate] = useState("");
  const [locationId, setLocationId] = useState("");
  const [mileage, setMileage] = useState("0");

  const canCreate = useMemo(() => {
    return Boolean(
      make &&
        model &&
        year &&
        licensePlate &&
        vin &&
        seats &&
        dailyRate &&
        locationId,
    );
  }, [make, model, year, licensePlate, vin, seats, dailyRate, locationId]);

  async function load() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/vehicles?limit=50&offset=0", {
        cache: "no-store",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to load vehicles (${res.status})`);
      }

      const data = (await res.json()) as VehicleListResponse;
      setVehicles(data.data);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }

  async function loadLocations() {
    try {
      const res = await fetch("/api/public/locations?limit=100&offset=0", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const raw = (await res.json()) as LocationListResponse | Location[];
      const data = Array.isArray(raw) ? raw : raw.data;
      setLocations(data);
      const first = data[0];
      if (first) {
        setLocationId((v) => v || first.id);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    void load();
    void loadLocations();
  }, []);

  async function createVehicle() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make,
          model,
          year: Number(year),
          licensePlate,
          vin,
          color: color || undefined,
          fuelType,
          transmission,
          seats: Number(seats),
          dailyRate: Number(dailyRate),
          hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
          locationId,
          mileage: mileage ? Number(mileage) : undefined,
          images: [],
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Create failed (${res.status})`);
      }

      setMake("");
      setModel("");
      setLicensePlate("");
      setVin("");
      setColor("");
      setDailyRate("0");
      setHourlyRate("");
      setMileage("0");

      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(vehicleId: string, status: string) {
    setError(null);

    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Status update failed (${res.status})`);
      }

      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Status update failed");
    }
  }

  async function deleteVehicle(vehicleId: string) {
    setError(null);

    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Delete failed (${res.status})`);
      }

      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Vehicles</h1>
        <Link href="/admin/dashboard">Back to dashboard</Link>
      </div>

      <div style={{ marginBottom: 16, opacity: 0.85 }}>Total: {total}</div>

      <section
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Create vehicle</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>Make</span>
            <input value={make} onChange={(e) => setMake(e.target.value)} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Model</span>
            <input value={model} onChange={(e) => setModel(e.target.value)} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Year</span>
            <input value={year} onChange={(e) => setYear(e.target.value)} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>License plate</span>
            <input
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>VIN</span>
            <input value={vin} onChange={(e) => setVin(e.target.value)} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Color (optional)</span>
            <input value={color} onChange={(e) => setColor(e.target.value)} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Fuel type</span>
            <select
              value={fuelType}
              onChange={(e) =>
                setFuelType(e.target.value as (typeof FUEL_TYPES)[number])
              }
            >
              {FUEL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Transmission</span>
            <select
              value={transmission}
              onChange={(e) =>
                setTransmission(
                  e.target.value as (typeof TRANSMISSIONS)[number],
                )
              }
            >
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Seats</span>
            <input value={seats} onChange={(e) => setSeats(e.target.value)} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Daily rate</span>
            <input
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Hourly rate (optional)</span>
            <input
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Location</span>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Mileage</span>
            <input
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
            />
          </label>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={createVehicle}
            disabled={!canCreate || loading}
          >
            Create
          </button>
          <button type="button" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>

        {error ? <div style={{ color: "crimson", marginTop: 8 }}>{error}</div> : null}
      </section>

      <section
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 8,
          padding: 12,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Fleet</h2>

        <div style={{ display: "grid", gap: 10 }}>
          {vehicles.map((v) => (
            <div
              key={v.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 12,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>
                  {v.make} {v.model} ({v.year})
                </strong>
                <span style={{ opacity: 0.85 }}>${v.dailyRate}/day</span>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span style={{ opacity: 0.85 }}>ID: {v.id}</span>
                <span style={{ opacity: 0.85 }}>Plate: {v.licensePlate}</span>
                <span style={{ opacity: 0.85 }}>VIN: {v.vin}</span>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span>Status</span>
                  <select
                    value={v.status}
                    onChange={(e) => updateStatus(v.id, e.target.value)}
                  >
                    {VEHICLE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <Link href={`/admin/vehicles/${v.id}`}>Edit</Link>

                <button
                  type="button"
                  onClick={() => deleteVehicle(v.id)}
                  style={{ color: "crimson" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {vehicles.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No vehicles found.</div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
