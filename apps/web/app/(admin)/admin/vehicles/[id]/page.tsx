"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { InlineError } from "../../../../../components/inline-error";
import { PageContainer } from "../../../../../components/page-container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../../components/ui/dropdown-menu";
import { Button } from "../../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { CloudinaryImageUpload } from "../../../../../components/cloudinary-image-upload";
import { 
  VehicleFormSkeleton,
  LoadingSkeleton 
} from "../../../../../components/loading-skeleton";
import { getResponseErrorMessage, toUserErrorMessage } from "../../../../../lib/errors";

type Location = {
  id: string;
  name: string;
  address: string;
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);

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
          const message = await getResponseErrorMessage(res, "Failed to load vehicle");
          throw new Error(message);
        }
        const data = (await res.json()) as Vehicle;
        if (!cancelled) setVehicle(data);
      } catch (e: unknown) {
        if (!cancelled)
          setError(toUserErrorMessage(e, "Failed to load vehicle"));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    }

    async function loadLocations() {
      try {
        const res = await fetch("/api/public/locations?limit=100&offset=0", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const raw = (await res.json()) as Location[] | any;
        const data = Array.isArray(raw) ? raw : raw.data;
        if (!cancelled) setLocations(data);
      } catch {
        // ignore
      }
    }

    void load();
    void loadLocations();

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
        const message = await getResponseErrorMessage(res, "Save failed");
        throw new Error(message);
      }

      router.push("/admin/vehicles");
    } catch (e: unknown) {
      setError(toUserErrorMessage(e, "Save failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Edit vehicle</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => save()} disabled={!canSave || loading}>
                Save Changes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.back()} disabled={loading}>
                Cancel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  if (confirm("Are you sure you want to delete this vehicle?")) {
                    // Handle delete action
                    console.log("Delete vehicle", id);
                  }
                }}
                className="text-destructive"
              >
                Delete Vehicle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild variant="outline">
            <Link href="/admin/vehicles">Back</Link>
          </Button>
        </div>
      </div>

      {initialLoading ? (
        <VehicleFormSkeleton />
      ) : vehicle ? (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="make">Make <span className="text-destructive">*</span></Label>
                <Input
                  id="make"
                  value={vehicle.make}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, make: e.target.value })
                  }
                  className={!vehicle.make ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model">Model <span className="text-destructive">*</span></Label>
                <Input
                  id="model"
                  value={vehicle.model}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, model: e.target.value })
                  }
                  className={!vehicle.model ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="year">Year <span className="text-destructive">*</span></Label>
                <Input
                  id="year"
                  type="number"
                  value={String(vehicle.year)}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, year: Number(e.target.value) })
                  }
                  className={!vehicle.year ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="licensePlate">License plate <span className="text-destructive">*</span></Label>
                <Input
                  id="licensePlate"
                  value={vehicle.licensePlate}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, licensePlate: e.target.value })
                  }
                  className={!vehicle.licensePlate ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="vin">VIN <span className="text-destructive">*</span></Label>
                <Input
                  id="vin"
                  value={vehicle.vin}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, vin: e.target.value })
                  }
                  className={!vehicle.vin ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={vehicle.color ?? ""}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, color: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Fuel type</Label>
                <Select
                  value={vehicle.fuelType}
                  onValueChange={(value: string) =>
                    setVehicle({
                      ...vehicle,
                      fuelType: value as (typeof FUEL_TYPES)[number],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Transmission</Label>
                <Select
                  value={vehicle.transmission}
                  onValueChange={(value: string) =>
                    setVehicle({
                      ...vehicle,
                      transmission: value as (typeof TRANSMISSIONS)[number],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSMISSIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="seats">Seats <span className="text-destructive">*</span></Label>
                <Input
                  id="seats"
                  type="number"
                  value={String(vehicle.seats)}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, seats: Number(e.target.value) })
                  }
                  className={!vehicle.seats ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dailyRate">Daily rate <span className="text-destructive">*</span></Label>
                <Input
                  id="dailyRate"
                  type="number"
                  value={String(vehicle.dailyRate)}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, dailyRate: Number(e.target.value) })
                  }
                  className={!vehicle.dailyRate ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hourlyRate">Hourly rate</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={vehicle.hourlyRate ? String(vehicle.hourlyRate) : ""}
                  onChange={(e) =>
                    setVehicle({
                      ...vehicle,
                      hourlyRate: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Location <span className="text-destructive">*</span></Label>
                <Select
                  value={vehicle.locationId}
                  onValueChange={(value: string) =>
                    setVehicle({ ...vehicle, locationId: value })
                  }
                >
                  <SelectTrigger className={!vehicle.locationId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="mileage">Mileage <span className="text-destructive">*</span></Label>
                <Input
                  id="mileage"
                  type="number"
                  value={String(vehicle.mileage)}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, mileage: Number(e.target.value) })
                  }
                  className={!vehicle.mileage ? "border-destructive" : ""}
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Vehicle Images</h3>
              <CloudinaryImageUpload
                folder={`vehicles/${id}`}
                tags={["vehicle", "car-rental"]}
                onUploadComplete={(result) => {
                  console.log("Image uploaded:", result);
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
                onClick={save}
                disabled={!canSave || loading}
              >
                Save Changes
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>

            <InlineError message={error} className="mt-4" />
          </CardContent>
        </Card>
      ) : loading ? (
        <div>Loading...</div>
      ) : (
        <div>No vehicle found.</div>
      )}
    </PageContainer>
  );
}
