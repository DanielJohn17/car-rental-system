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
  LoadingSkeleton,
} from "../../../../../components/loading-skeleton";
import {
  useVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  type Vehicle,
} from "../../../../../lib/queries/vehicles";
import {
  useLocations,
  type Location,
} from "../../../../../lib/queries/locations";

const FUEL_TYPES = ["PETROL", "DIESEL", "ELECTRIC", "HYBRID"] as const;
const TRANSMISSIONS = ["MANUAL", "AUTO"] as const;

export default function AdminVehicleEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  // TanStack Query hooks
  const {
    data: vehicleData,
    isLoading: vehicleLoading,
    error: vehicleError,
  } = useVehicle(id);
  const { data: locationsData, isLoading: locationsLoading } = useLocations({
    limit: 100,
    offset: 0,
  });
  const updateVehicleMutation = useUpdateVehicle();
  const deleteVehicleMutation = useDeleteVehicle();

  // Local state for form editing
  const [localVehicle, setLocalVehicle] = useState<Vehicle | null>(null);

  // Extract data from responses
  const vehicle = vehicleData;
  const locations = Array.isArray(locationsData)
    ? locationsData
    : locationsData?.data || [];

  // Initialize local vehicle state when data loads
  useEffect(() => {
    if (vehicle && !localVehicle) {
      setLocalVehicle(vehicle);
    }
  }, [vehicle, localVehicle]);

  const canSave = useMemo(() => {
    return Boolean(
      localVehicle?.make && localVehicle?.model && localVehicle?.year,
    );
  }, [localVehicle]);

  // Handle save action
  const handleSave = async () => {
    if (!localVehicle || !id) return;

    try {
      await updateVehicleMutation.mutateAsync({
        id,
        data: {
          make: localVehicle.make,
          model: localVehicle.model,
          year: Number(localVehicle.year),
          licensePlate: localVehicle.licensePlate,
          vin: localVehicle.vin,
          color: localVehicle.color || undefined,
          fuelType: localVehicle.fuelType,
          transmission: localVehicle.transmission,
          seats: Number(localVehicle.seats),
          dailyRate: Number(localVehicle.dailyRate),
          hourlyRate: localVehicle.hourlyRate
            ? Number(localVehicle.hourlyRate)
            : undefined,
          locationId: localVehicle.locationId,
          mileage: Number(localVehicle.mileage),
          images: [],
        },
      });

      router.push("/admin/vehicles");
    } catch (error) {
      console.error("Failed to update vehicle:", error);
    }
  };

  // Handle delete action
  const handleDelete = async () => {
    if (!id) return;

    if (confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await deleteVehicleMutation.mutateAsync(id);
        router.push("/admin/vehicles");
      } catch (error) {
        console.error("Failed to delete vehicle:", error);
      }
    }
  };

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
              <DropdownMenuItem
                onClick={handleSave}
                disabled={!canSave || updateVehicleMutation.isPending}
              >
                Save Changes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.back()}
                disabled={updateVehicleMutation.isPending}
              >
                Cancel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
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

      {vehicleLoading ? (
        <VehicleFormSkeleton />
      ) : localVehicle ? (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="make">
                  Make <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="make"
                  value={localVehicle.make}
                  onChange={(e) =>
                    setLocalVehicle({ ...localVehicle, make: e.target.value })
                  }
                  className={!localVehicle.make ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model">
                  Model <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="model"
                  value={localVehicle.model}
                  onChange={(e) =>
                    setLocalVehicle({ ...localVehicle, model: e.target.value })
                  }
                  className={!localVehicle.model ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="year">
                  Year <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="year"
                  type="number"
                  value={String(localVehicle.year)}
                  onChange={(e) =>
                    setLocalVehicle({
                      ...localVehicle,
                      year: Number(e.target.value),
                    })
                  }
                  className={!localVehicle.year ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="licensePlate">
                  License plate <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="licensePlate"
                  value={localVehicle.licensePlate}
                  onChange={(e) =>
                    setLocalVehicle({
                      ...localVehicle,
                      licensePlate: e.target.value,
                    })
                  }
                  className={
                    !localVehicle.licensePlate ? "border-destructive" : ""
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="vin">
                  VIN <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="vin"
                  value={localVehicle.vin}
                  onChange={(e) =>
                    setLocalVehicle({ ...localVehicle, vin: e.target.value })
                  }
                  className={!localVehicle.vin ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={localVehicle.color ?? ""}
                  onChange={(e) =>
                    setLocalVehicle({ ...localVehicle, color: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Fuel type</Label>
                <Select
                  value={localVehicle.fuelType}
                  onValueChange={(value: string) =>
                    setLocalVehicle({
                      ...localVehicle,
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
                  value={localVehicle.transmission}
                  onValueChange={(value: string) =>
                    setLocalVehicle({
                      ...localVehicle,
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
                <Label htmlFor="seats">
                  Seats <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="seats"
                  type="number"
                  value={String(localVehicle.seats)}
                  onChange={(e) =>
                    setLocalVehicle({
                      ...localVehicle,
                      seats: Number(e.target.value),
                    })
                  }
                  className={!localVehicle.seats ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dailyRate">
                  Daily rate <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dailyRate"
                  type="number"
                  value={String(localVehicle.dailyRate)}
                  onChange={(e) =>
                    setLocalVehicle({
                      ...localVehicle,
                      dailyRate: Number(e.target.value),
                    })
                  }
                  className={
                    !localVehicle.dailyRate ? "border-destructive" : ""
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hourlyRate">Hourly rate</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={
                    localVehicle.hourlyRate
                      ? String(localVehicle.hourlyRate)
                      : ""
                  }
                  onChange={(e) =>
                    setLocalVehicle({
                      ...localVehicle,
                      hourlyRate: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>
                  Location <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={localVehicle.locationId}
                  onValueChange={(value: string) =>
                    setLocalVehicle({ ...localVehicle, locationId: value })
                  }
                >
                  <SelectTrigger
                    className={
                      !localVehicle.locationId ? "border-destructive" : ""
                    }
                  >
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
                <Label htmlFor="mileage">
                  Mileage <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mileage"
                  type="number"
                  value={String(localVehicle.mileage)}
                  onChange={(e) =>
                    setLocalVehicle({
                      ...localVehicle,
                      mileage: Number(e.target.value),
                    })
                  }
                  className={!localVehicle.mileage ? "border-destructive" : ""}
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
                }}
                className="mb-4"
              />
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={!canSave || updateVehicleMutation.isPending}
              >
                {updateVehicleMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={updateVehicleMutation.isPending}
              >
                Cancel
              </Button>
            </div>

            <InlineError
              message={
                vehicleError?.message ||
                updateVehicleMutation.error?.message ||
                deleteVehicleMutation.error?.message
              }
              className="mt-4"
            />
          </CardContent>
        </Card>
      ) : vehicleError ? (
        <div className="text-center text-destructive py-8">
          Error loading vehicle: {vehicleError.message}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          No vehicle found.
        </div>
      )}
    </PageContainer>
  );
}
