"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  ArrowLeft,
  Search,
  Car,
  Filter,
  RefreshCcw,
  LayoutGrid,
  ShieldCheck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InlineError } from "@/components/inline-error";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CloudinaryImageUpload } from "@/components/cloudinary-image-upload";
import {
  VehicleFormSkeleton,
  VehiclesListSkeleton,
} from "@/components/loading-skeleton";
import { FormField } from "@/components/form-field";
import { FormSelect } from "@/components/form-select";
import { AdminVehicleCard } from "@/components/admin-vehicle-card";
import {
  useVehicles,
  useCreateVehicle,
  useUpdateVehicleStatus,
  useDeleteVehicle,
} from "@/lib/queries/vehicles";
import { useLocations } from "@/lib/queries/locations";

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
  const [images, setImages] = useState<string[]>([]);

  // Extract data from responses
  const vehicles = vehiclesData?.data || [];
  const total = vehiclesData?.total || 0;
  const locations = useMemo(
    () =>
      Array.isArray(locationsData) ? locationsData : locationsData?.data || [],
    [locationsData],
  );

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
        images,
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
      setImages([]);
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
    <div className="min-h-screen bg-muted/20">
      <PageContainer>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Car className="h-10 w-10 text-primary" />
              Fleet Management
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Add new vehicles and manage your existing fleet.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="list" className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-background border p-1 rounded-xl h-12 shadow-sm">
              <TabsTrigger
                value="list"
                className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Fleet Overview
              </TabsTrigger>
              <TabsTrigger
                value="add"
                className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search fleet..."
                  className="pl-9 rounded-full h-10 w-[200px] lg:w-[300px] bg-background border-border/50"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-background"
                onClick={() => window.location.reload()}
              >
                <RefreshCcw
                  className={`h-4 w-4 ${createVehicleMutation.isPending ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          <TabsContent value="list" className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  {total} Active Vehicles
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs font-semibold"
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  Sort By: Status
                </Button>
              </div>
            </div>

            {vehiclesLoading && vehicles.length === 0 ? (
              <VehiclesListSkeleton />
            ) : vehicles.length > 0 ? (
              <div className="grid gap-6">
                {vehicles.map((v) => (
                  <AdminVehicleCard
                    key={v.id}
                    vehicle={v}
                    onStatusUpdate={handleUpdateStatus}
                    onDelete={handleDeleteVehicle}
                    vehicleStatuses={VEHICLE_STATUSES}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 bg-muted/50">
                <CardContent className="py-20">
                  <div className="text-center flex flex-col items-center gap-4">
                    <div className="rounded-full bg-muted p-6 text-muted-foreground">
                      <Car className="h-12 w-12" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">No vehicles found</h3>
                      <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
                        Your fleet is currently empty. Start by adding your
                        first vehicle.
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        const tabs = document.querySelector('[role="tablist"]');
                        const addTab = tabs?.querySelector(
                          '[value="add"]',
                        ) as HTMLElement;
                        addTab?.click();
                      }}
                      className="mt-4 rounded-full px-8 shadow-lg shadow-primary/20"
                    >
                      Add New Vehicle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="add">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/20 text-primary">
                    <Plus className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold">
                      New Vehicle
                    </CardTitle>
                    <CardDescription className="text-slate-400 mt-1">
                      Provide details to list a new car in your inventory.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {locationsLoading ? (
                  <VehicleFormSkeleton />
                ) : (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-4">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-primary border-b pb-2">
                          Basic Info
                        </h3>
                        <FormField
                          id="make"
                          label="Make"
                          placeholder="e.g. Tesla"
                          value={make}
                          onChange={(e) => setMake(e.target.value)}
                          required
                          className="rounded-xl"
                        />
                        <FormField
                          id="model"
                          label="Model"
                          placeholder="e.g. Model S"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          required
                          className="rounded-xl"
                        />
                        <FormField
                          id="year"
                          label="Year"
                          type="number"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          required
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-primary border-b pb-2">
                          Identification
                        </h3>
                        <FormField
                          id="licensePlate"
                          label="License Plate"
                          placeholder="ABC-1234"
                          value={licensePlate}
                          onChange={(e) => setLicensePlate(e.target.value)}
                          required
                          className="rounded-xl"
                        />
                        <FormField
                          id="vin"
                          label="VIN"
                          placeholder="17-digit number"
                          value={vin}
                          onChange={(e) => setVin(e.target.value)}
                          required
                          className="rounded-xl"
                        />
                        <FormField
                          id="color"
                          label="Color (optional)"
                          placeholder="e.g. Midnight Silver"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-primary border-b pb-2">
                          Pricing & Logistics
                        </h3>
                        <FormField
                          id="dailyRate"
                          label="Daily Rate ($)"
                          type="number"
                          value={dailyRate}
                          onChange={(e) => setDailyRate(e.target.value)}
                          required
                          className="rounded-xl font-bold text-primary"
                        />
                        <FormSelect
                          label="Pick-up Location"
                          value={locationId}
                          onValueChange={(value: string) =>
                            setLocationId(value)
                          }
                          options={locations}
                          required
                          placeholder="Select location"
                        />
                        <FormField
                          id="mileage"
                          label="Current Mileage"
                          type="number"
                          value={mileage}
                          onChange={(e) => setMileage(e.target.value)}
                          required
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-primary border-b pb-2">
                          Specifications
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormSelect
                            label="Fuel Type"
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
                              setTransmission(
                                value as (typeof TRANSMISSIONS)[number],
                              )
                            }
                            options={[...TRANSMISSIONS]}
                          />
                        </div>
                        <FormField
                          id="seats"
                          label="Number of Seats"
                          type="number"
                          value={seats}
                          onChange={(e) => setSeats(e.target.value)}
                          required
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="pt-8 border-t">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold tracking-tight">
                            Vehicle Images
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Upload high-quality photos to attract more bookings
                            (max 5).
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="rounded-full px-4"
                        >
                          {images.length} / 5 Selected
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <CloudinaryImageUpload
                          folder="car-rental/vehicles"
                          multiple
                          maxFiles={5}
                          onUploadComplete={(result) => {
                            const uploaded = Array.isArray(result)
                              ? result
                              : [result];
                            const urls = uploaded
                              .map((r) => r.secureUrl)
                              .filter((u): u is string => Boolean(u));

                            setImages((prev) => [...prev, ...urls].slice(0, 5));
                          }}
                          onUploadError={(error: string) => {
                            console.error("Upload failed:", error);
                          }}
                        />

                        <div className="flex flex-wrap gap-3">
                          {images.map((url, i) => (
                            <div
                              key={i}
                              className="relative group aspect-video w-32 rounded-xl overflow-hidden border shadow-sm"
                            >
                              <Image
                                src={url}
                                alt={`Preview ${i}`}
                                fill
                                className="object-cover"
                              />
                              <button
                                onClick={() =>
                                  setImages((prev) =>
                                    prev.filter((_, idx) => idx !== i),
                                  )
                                }
                                className="absolute inset-0 bg-destructive/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {images.length === 0 && (
                            <div className="w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                              <Car className="h-8 w-8 mb-2 opacity-20" />
                              <span className="text-xs">
                                No images uploaded yet
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          type="button"
                          size="lg"
                          onClick={handleCreateVehicle}
                          disabled={
                            !canCreate || createVehicleMutation.isPending
                          }
                          className="rounded-full px-10 h-14 text-lg font-bold shadow-lg shadow-primary/20"
                        >
                          {createVehicleMutation.isPending
                            ? "Processing..."
                            : "Create Vehicle"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => window.location.reload()}
                          disabled={createVehicleMutation.isPending}
                          className="rounded-full px-8"
                        >
                          Cancel
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground italic">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Information will be verified before listing.
                      </div>
                    </div>
                  </div>
                )}

                <InlineError
                  message={
                    vehiclesError?.message ||
                    createVehicleMutation.error?.message ||
                    updateVehicleStatusMutation.error?.message ||
                    deleteVehicleMutation.error?.message
                  }
                  className="mt-6"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </div>
  );
}
