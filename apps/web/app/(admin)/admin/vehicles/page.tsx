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
import { getResponseErrorMessage, toUserErrorMessage } from "../../../../lib/errors";

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="licensePlate">License plate</Label>
              <Input
                id="licensePlate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color">Color (optional)</Label>
              <Input
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Fuel type</Label>
              <Select
                value={fuelType}
                onValueChange={(value: string) =>
                  setFuelType(value as (typeof FUEL_TYPES)[number])
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
                value={transmission}
                onValueChange={(value: string) =>
                  setTransmission(value as (typeof TRANSMISSIONS)[number])
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
              <Label htmlFor="seats">Seats</Label>
              <Input
                id="seats"
                type="number"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dailyRate">Daily rate</Label>
              <Input
                id="dailyRate"
                type="number"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hourlyRate">Hourly rate (optional)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Location</Label>
              <Select
                value={locationId}
                onValueChange={(value: string) => setLocationId(value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="mileage">Mileage</Label>
              <Input
                id="mileage"
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
              />
            </div>
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
            {vehicles.map((v) => (
              <Card key={v.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {v.make} {v.model} ({v.year})
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ${v.dailyRate}/day • {v.status}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/vehicles/${v.id}`}>
                            Edit Vehicle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteVehicle(v.id)}
                          className="text-destructive"
                        >
                          Delete Vehicle
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                    <div className="text-sm">
                      <span className="font-medium">ID:</span> {v.id}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Plate:</span> {v.licensePlate}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">VIN:</span> {v.vin}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="grid gap-2">
                      <Label>Status</Label>
                      <Select
                        value={v.status}
                        onValueChange={(value: string) => updateStatus(v.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {vehicles.length === 0 ? (
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
