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
  LoadingSkeleton,
} from "../../../../components/loading-skeleton";
import { FormField } from "../../../../components/form-field";
import { FormSelect } from "../../../../components/form-select";
import { AdminVehicleCard } from "../../../../components/admin-vehicle-card";
import {
  useVehicles,
  useCreateVehicle,
  useUpdateVehicleStatus,
  useDeleteVehicle,
  type Vehicle,
} from "../../../../lib/queries/vehicles";
import { useLocations, type Location } from "../../../../lib/queries/locations";

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
  // TanStack Query hooks
  const {
    data: vehiclesData,
    isLoading: vehiclesLoading,
    error: vehiclesError,
  } = useVehicles({ limit: 50, offset: 0 });
  const { data: locationsData, isLoading: locationsLoading } = useLocations({
    limit: 100,
    offset: 0,
  });
  const createVehicleMutation = useCreateVehicle();
  const updateVehicleStatusMutation = useUpdateVehicleStatus();
  const deleteVehicleMutation = useDeleteVehicle();

  // Form state
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [licensePlate, setLicensePlate] = useState("");
  const [vin, setVin] = useState("");
  const [color, setColor] = useState("");
  const [fuelType, setFuelType] =
    useState<(typeof FUEL_TYPES)[number]>("PETROL");
  const [transmission, setTransmission] =
    useState<(typeof TRANSMISSIONS)[number]>("AUTO");
  const [seats, setSeats] = useState("5");
  const [dailyRate, setDailyRate] = useState("0");
  const [hourlyRate, setHourlyRate] = useState("");
  const [locationId, setLocationId] = useState("");
  const [mileage, setMileage] = useState("0");

  // Extract data from responses
  const vehicles = vehiclesData?.data || [];
  const total = vehiclesData?.total || 0;
  const locations = Array.isArray(locationsData)
    ? locationsData
    : locationsData?.data || [];

  // Set default location when locations load
  useEffect(() => {
    if (locations?.length > 0 && !locationId && locations[0]) {
      setLocationId(locations[0].id);
    }
  }, [locations, locationId]);

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

  // Handle form submission
  const handleCreateVehicle = async () => {
    if (!canCreate) return;

    try {
      await createVehicleMutation.mutateAsync({
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
      });

      // Reset form on success
      setMake("");
      setModel("");
      setLicensePlate("");
      setVin("");
      setColor("");
      setDailyRate("0");
      setHourlyRate("");
      setMileage("0");
    } catch (error) {
      console.error("Failed to create vehicle:", error);
    }
  };

  // Handle status updates
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateVehicleStatusMutation.mutateAsync({
        id,
        data: { status },
      });
    } catch (error) {
      console.error("Failed to update vehicle status:", error);
    }
  };

  // Handle vehicle deletion
  const handleDeleteVehicle = async (id: string) => {
    try {
      await deleteVehicleMutation.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete vehicle:", error);
    }
  };

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
          {vehiclesLoading ? (
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
            </div>
          )}

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
              }}
              className="mb-4"
            />
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              type="button"
              onClick={handleCreateVehicle}
              disabled={!canCreate || createVehicleMutation.isPending}
            >
              {createVehicleMutation.isPending
                ? "Creating..."
                : "Create Vehicle"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
              disabled={createVehicleMutation.isPending}
            >
              Refresh
            </Button>
          </div>

          <InlineError
            message={
              vehiclesError?.message ||
              createVehicleMutation.error?.message ||
              updateVehicleStatusMutation.error?.message ||
              deleteVehicleMutation.error?.message
            }
            className="mt-4"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fleet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vehiclesLoading && vehicles.length === 0 ? (
              <VehiclesListSkeleton />
            ) : vehicles.length > 0 ? (
              vehicles.map((v) => (
                <AdminVehicleCard
                  key={v.id}
                  vehicle={v}
                  onStatusUpdate={handleUpdateStatus}
                  onDelete={handleDeleteVehicle}
                  vehicleStatuses={VEHICLE_STATUSES}
                />
              ))
            ) : !vehiclesLoading && vehicles.length === 0 ? (
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
