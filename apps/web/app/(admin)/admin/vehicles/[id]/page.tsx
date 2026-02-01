"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
  mileage: number;
};

const FUEL_TYPES = ["PETROL", "DIESEL", "ELECTRIC", "HYBRID"] as const;
const TRANSMISSIONS = ["MANUAL", "AUTO"] as const;

export default function AdminVehicleEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSave = useMemo(() => {
    return Boolean(vehicle?.make && vehicle?.model && vehicle?.year);
  }, [vehicle]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/vehicles/${id}`, { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Failed to load vehicle (${res.status})`);
        }
        const data = (await res.json()) as Vehicle;
        if (!cancelled) setVehicle(data);
      } catch (e: unknown) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load vehicle");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function save() {
    if (!vehicle) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/vehicles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make: vehicle.make,
          model: vehicle.model,
          year: Number(vehicle.year),
          licensePlate: vehicle.licensePlate,
          vin: vehicle.vin,
          color: vehicle.color || undefined,
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission,
          seats: Number(vehicle.seats),
          dailyRate: Number(vehicle.dailyRate),
          hourlyRate: vehicle.hourlyRate ? Number(vehicle.hourlyRate) : undefined,
          locationId: vehicle.locationId,
          mileage: Number(vehicle.mileage),
          images: [],
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Save failed (${res.status})`);
      }

      router.push("/admin/vehicles");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Edit vehicle</h1>
        <Link href="/admin/vehicles">Back</Link>
      </div>

      {vehicle ? (
        <div
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 8,
            padding: 12,
            display: "grid",
            gap: 12,
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>Make</span>
            <input
              value={vehicle.make}
              onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Model</span>
            <input
              value={vehicle.model}
              onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Year</span>
            <input
              value={String(vehicle.year)}
              onChange={(e) =>
                setVehicle({ ...vehicle, year: Number(e.target.value) })
              }
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>License plate</span>
            <input
              value={vehicle.licensePlate}
              onChange={(e) =>
                setVehicle({ ...vehicle, licensePlate: e.target.value })
              }
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>VIN</span>
            <input
              value={vehicle.vin}
              onChange={(e) => setVehicle({ ...vehicle, vin: e.target.value })}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Color</span>
            <input
              value={vehicle.color ?? ""}
              onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Fuel type</span>
            <select
              value={vehicle.fuelType}
              onChange={(e) =>
                setVehicle({
                  ...vehicle,
                  fuelType: e.target.value as (typeof FUEL_TYPES)[number],
                })
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
              value={vehicle.transmission}
              onChange={(e) =>
                setVehicle({
                  ...vehicle,
                  transmission: e.target.value as (typeof TRANSMISSIONS)[number],
                })
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
            <input
              value={String(vehicle.seats)}
              onChange={(e) =>
                setVehicle({ ...vehicle, seats: Number(e.target.value) })
              }
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Daily rate</span>
            <input
              value={String(vehicle.dailyRate)}
              onChange={(e) =>
                setVehicle({ ...vehicle, dailyRate: Number(e.target.value) })
              }
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Hourly rate</span>
            <input
              value={vehicle.hourlyRate ? String(vehicle.hourlyRate) : ""}
              onChange={(e) =>
                setVehicle({
                  ...vehicle,
                  hourlyRate: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Location ID</span>
            <input
              value={vehicle.locationId}
              onChange={(e) =>
                setVehicle({ ...vehicle, locationId: e.target.value })
              }
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Mileage</span>
            <input
              value={String(vehicle.mileage)}
              onChange={(e) =>
                setVehicle({ ...vehicle, mileage: Number(e.target.value) })
              }
            />
          </label>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={save} disabled={!canSave || loading}>
              Save
            </button>
            <button type="button" onClick={() => router.back()} disabled={loading}>
              Cancel
            </button>
          </div>

          {error ? <div style={{ color: "crimson" }}>{error}</div> : null}
        </div>
      ) : loading ? (
        <div>Loading...</div>
      ) : (
        <div>No vehicle found.</div>
      )}
    </main>
  );
}
