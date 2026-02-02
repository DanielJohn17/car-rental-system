"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InlineError } from "../../../../components/inline-error";
import { PageContainer } from "../../../../components/page-container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { CloudinaryImageUpload } from "../../../../components/cloudinary-image-upload";
import { 
  VehicleCardSkeleton, 
  VehicleFormSkeleton, 
  VehiclesListSkeleton,
  LoadingSkeleton 
} from "../../../../components/loading-skeleton";
import { getResponseErrorMessage, toUserErrorMessage } from "../../../../lib/errors";
import { FormField } from "../../../../components/form-field";
import { FormSelect } from "../../../../components/form-select";
import { AdminVehicleCard } from "../../../../components/admin-vehicle-card";

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
  const [initialLoading, setInitialLoading] = useState(true);

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
        const message = await getResponseErrorMessage(res, "Failed to load vehicles");
        throw new Error(message);
      }

      const data = (await res.json()) as VehicleListResponse;
      setVehicles(data.data);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(toUserErrorMessage(e, "Failed to load vehicles"));
    } finally {
      setLoading(false);
      setInitialLoading(false);
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
        setLocationId(first.id);
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
        const message = await getResponseErrorMessage(res, "Create failed");
        throw new Error(message);
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
      setError(toUserErrorMessage(e, "Create failed"));
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/vehicles/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const message = await getResponseErrorMessage(res, "Status update failed");
        throw new Error(message);
      }
      await load();
    } catch (e: unknown) {
      setError(toUserErrorMessage(e, "Status update failed"));
    }
  }

  async function deleteVehicle(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/vehicles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const message = await getResponseErrorMessage(res, "Delete failed");
        throw new Error(message);
      }
      await load();
    } catch (e: unknown) {
      setError(toUserErrorMessage(e, "Delete failed"));
    }
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Vehicles</h1>
        <Button asChild variant="outline">
          <Link href="/admin/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        Total: {total} vehicles
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          {initialLoading ? (
            <VehicleFormSkeleton />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                id="make"
                label="Make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
              />

              <FormField
                id="model"
                label="Model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />

              <FormField
                id="year"
                label="Year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              />

              <FormField
                id="licensePlate"
                label="License plate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                required
              />

              <FormField
                id="vin"
                label="VIN"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                required
              />

              <FormField
                id="color"
                label="Color (optional)"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />

              <FormSelect
                label="Fuel type"
                value={fuelType}
                onValueChange={(value: string) =>
                  setFuelType(value as (typeof FUEL_TYPES)[number])
                }
                options={[...FUEL_TYPES]}
              />

              <FormSelect
                label="Transmission"
                value={transmission}
                onValueChange={(value: string) =>
                  setTransmission(value as (typeof TRANSMISSIONS)[number])
                }
                options={[...TRANSMISSIONS]}
              />

              <FormField
                id="seats"
                label="Seats"
                type="number"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                required
              />

              <FormField
                id="dailyRate"
                label="Daily rate"
                type="number"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                required
              />

              <FormField
                id="hourlyRate"
                label="Hourly rate (optional)"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />

              <FormSelect
                label="Location"
                value={locationId}
                onValueChange={(value: string) => setLocationId(value)}
                options={locations}
                required
                placeholder="Select location"
              />

              <FormField
                id="mileage"
                label="Mileage"
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                required
              />
          </div>)}

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Vehicle Images</h3>
            <CloudinaryImageUpload
              folder="vehicles/new"
              tags={["vehicle", "car-rental"]}
              multiple={true}
              maxFiles={5}
              onUploadComplete={(result) => {
                console.log("Images uploaded:", result);
                // Handle successful upload (e.g., update vehicle images)
              }}
              onUploadError={(error) => {
                console.error("Upload failed:", error);
                setError(`Image upload failed: ${error}`);
              }}
              className="mb-4"
            />
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              type="button"
              onClick={createVehicle}
              disabled={!canCreate || loading}
            >
              Create Vehicle
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={load}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          <InlineError message={error} className="mt-4" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fleet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading && vehicles.length === 0 ? (
              <VehiclesListSkeleton />
            ) : vehicles.length > 0 ? (
              vehicles.map((v) => (
                <AdminVehicleCard
                  key={v.id}
                  vehicle={v}
                  onStatusUpdate={updateStatus}
                  onDelete={deleteVehicle}
                  vehicleStatuses={VEHICLE_STATUSES}
                />
              ))
            ) : !loading && vehicles.length === 0 && !initialLoading ? (
              <div className="text-center text-muted-foreground py-8">
                No vehicles found.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
