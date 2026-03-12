"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { InlineError } from "../../../../../components/inline-error";
import { PageContainer } from "../../../../../components/page-container";
import {
  ArrowLeft,
  Save,
  Trash2,
  Car,
  Info,
  MapPin,
  DollarSign,
  Settings2,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { VehicleFormSkeleton } from "../../../../../components/loading-skeleton";
import {
  useVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  type Vehicle,
} from "../../../../../lib/queries/vehicles";
import { useLocations } from "../../../../../lib/queries/locations";

const FUEL_TYPES = ["PETROL", "DIESEL", "ELECTRIC", "HYBRID"] as const;
const TRANSMISSIONS = ["MANUAL", "AUTO"] as const;
const VEHICLE_STATUSES = [
  "AVAILABLE",
  "RENTED",
  "MAINTENANCE",
  "DAMAGED",
  "RESERVED",
] as const;

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
  const { data: locationsData } = useLocations({
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
      setLocalVehicle({
        ...vehicle,
        images: Array.isArray(vehicle.images) ? vehicle.images : [],
      });
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
          images: Array.isArray(localVehicle.images) ? localVehicle.images : [],
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
    <div className="min-h-screen bg-muted/20">
      <PageContainer>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-full bg-background border shadow-sm"
            >
              <Link href="/admin/vehicles">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-extrabold tracking-tight">
                  Edit Vehicle
                </h1>
                {localVehicle && (
                  <Badge
                    variant={
                      localVehicle.status === "AVAILABLE"
                        ? "default"
                        : "secondary"
                    }
                    className="rounded-full px-3 py-1 font-bold uppercase tracking-widest text-[10px]"
                  >
                    {localVehicle.status}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-lg">
                Update details and manage listing status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Listing
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave || updateVehicleMutation.isPending}
              className="rounded-full px-8 font-bold shadow-lg shadow-primary/20"
            >
              {updateVehicleMutation.isPending ? (
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {vehicleLoading ? (
          <VehicleFormSkeleton />
        ) : localVehicle ? (
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information Section */}
              <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                      <Info className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        General Information
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Core vehicle identification and details
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="make"
                          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          Make
                        </Label>
                        <Input
                          id="make"
                          value={localVehicle.make}
                          onChange={(e) =>
                            setLocalVehicle({
                              ...localVehicle,
                              make: e.target.value,
                            })
                          }
                          className={`rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all ${!localVehicle.make ? "border-destructive/50 ring-destructive/20" : ""}`}
                          placeholder="e.g. Tesla"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="model"
                          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          Model
                        </Label>
                        <Input
                          id="model"
                          value={localVehicle.model}
                          onChange={(e) =>
                            setLocalVehicle({
                              ...localVehicle,
                              model: e.target.value,
                            })
                          }
                          className={`rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all ${!localVehicle.model ? "border-destructive/50 ring-destructive/20" : ""}`}
                          placeholder="e.g. Model S"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="year"
                          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          Manufacturing Year
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
                          className={`rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all ${!localVehicle.year ? "border-destructive/50 ring-destructive/20" : ""}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="licensePlate"
                          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          License Plate
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
                          className={`rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all ${!localVehicle.licensePlate ? "border-destructive/50 ring-destructive/20" : ""}`}
                          placeholder="ABC-1234"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="vin"
                          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          VIN Number
                        </Label>
                        <Input
                          id="vin"
                          value={localVehicle.vin}
                          onChange={(e) =>
                            setLocalVehicle({
                              ...localVehicle,
                              vin: e.target.value,
                            })
                          }
                          className={`rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all ${!localVehicle.vin ? "border-destructive/50 ring-destructive/20" : ""}`}
                          placeholder="17-digit code"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="color"
                          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          Color
                        </Label>
                        <Input
                          id="color"
                          value={localVehicle.color ?? ""}
                          onChange={(e) =>
                            setLocalVehicle({
                              ...localVehicle,
                              color: e.target.value,
                            })
                          }
                          className="rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all"
                          placeholder="e.g. Midnight Silver"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing & Performance Section */}
              <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        Pricing & Performance
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Manage rates and usage statistics
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="dailyRate"
                          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          Daily Rental Rate ($)
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
                          className={`rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all font-bold text-primary ${!localVehicle.dailyRate ? "border-destructive/50" : ""}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="hourlyRate"
                          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          Hourly Rate ($) - Optional
                        </Label>
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
                          className="rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="mileage"
                          className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          Current Odometer (Miles)
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
                          className={`rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all ${!localVehicle.mileage ? "border-destructive/50" : ""}`}
                        />
                      </div>
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium text-primary">
                            Insurance Coverage Verified
                          </span>
                        </div>
                        <p className="text-[10px] text-primary/60 mt-1 pl-8 italic">
                          This vehicle is covered by our standard platform
                          policy.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Specifications Section */}
              <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                      <Settings2 className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        Technical Specifications
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Mechanical and capacity configurations
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Fuel Type
                      </Label>
                      <Select
                        value={localVehicle.fuelType}
                        onValueChange={(value: string) =>
                          setLocalVehicle({
                            ...localVehicle,
                            fuelType: value as (typeof FUEL_TYPES)[number],
                          })
                        }
                      >
                        <SelectTrigger className="rounded-xl h-12 bg-muted/50 border-transparent focus:ring-primary">
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

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Transmission
                      </Label>
                      <Select
                        value={localVehicle.transmission}
                        onValueChange={(value: string) =>
                          setLocalVehicle({
                            ...localVehicle,
                            transmission:
                              value as (typeof TRANSMISSIONS)[number],
                          })
                        }
                      >
                        <SelectTrigger className="rounded-xl h-12 bg-muted/50 border-transparent focus:ring-primary">
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

                    <div className="space-y-2">
                      <Label
                        htmlFor="seats"
                        className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        Seats
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
                        className="rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background transition-all"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-8">
              {/* Media Management Card */}
              <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-6">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    Visual Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        Images
                      </h4>
                      <Badge
                        variant="secondary"
                        className="rounded-full px-2 py-0"
                      >
                        {localVehicle.images?.length ?? 0} / 5
                      </Badge>
                    </div>
                    <CloudinaryImageUpload
                      folder={`vehicles/${id}`}
                      tags={["vehicle", "car-rental"]}
                      multiple={true}
                      maxFiles={5}
                      onUploadComplete={(result) => {
                        const uploaded = Array.isArray(result)
                          ? result
                          : [result];
                        const urls = uploaded
                          .map((r) => r.secureUrl)
                          .filter((u): u is string => Boolean(u));

                        setLocalVehicle((prev) => {
                          if (!prev) return prev;
                          const existing = Array.isArray(prev.images)
                            ? prev.images
                            : [];
                          return {
                            ...prev,
                            images: [...existing, ...urls].slice(0, 5),
                          };
                        });
                      }}
                      onUploadError={(error) => {
                        console.error("Upload failed:", error);
                      }}
                    />
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {(localVehicle.images ?? []).map((url, i) => (
                        <div
                          key={i}
                          className="relative group aspect-square rounded-2xl overflow-hidden border bg-muted"
                        >
                          <Image
                            src={url}
                            alt={`Gallery ${i}`}
                            fill
                            className="object-cover transition-transform group-hover:scale-110"
                          />
                          <button
                            onClick={() =>
                              setLocalVehicle((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      images: (prev.images ?? []).filter(
                                        (_, idx) => idx !== i,
                                      ),
                                    }
                                  : null,
                              )
                            }
                            className="absolute inset-0 bg-destructive/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {(localVehicle.images ?? []).length === 0 && (
                        <div className="col-span-2 aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                          <Car className="h-10 w-10 mb-2 opacity-20" />
                          <span className="text-[10px] uppercase font-bold tracking-tighter">
                            No media uploaded
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status & Location Card */}
              <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-6">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Logistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Current Status
                    </Label>
                    <Select
                      value={localVehicle.status}
                      onValueChange={(value: string) =>
                        setLocalVehicle({ ...localVehicle, status: value })
                      }
                    >
                      <SelectTrigger className="rounded-xl h-12 bg-muted/50 border-transparent focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Assigned Branch
                    </Label>
                    <Select
                      value={localVehicle.locationId}
                      onValueChange={(value: string) =>
                        setLocalVehicle({ ...localVehicle, locationId: value })
                      }
                    >
                      <SelectTrigger
                        className={`rounded-xl h-12 bg-muted/50 border-transparent focus:ring-primary ${!localVehicle.locationId ? "border-destructive/50" : ""}`}
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

                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>
                        Status changes affect public availability immediately.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : vehicleError ? (
          <Card className="border-destructive/20 bg-destructive/5 overflow-hidden rounded-3xl">
            <CardContent className="p-12 text-center space-y-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Error Loading Vehicle</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {vehicleError.message}
                </p>
              </div>
              <Button asChild className="rounded-full px-8">
                <Link href="/admin/vehicles">Return to Fleet</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="rounded-full bg-muted p-6 text-muted-foreground">
              <Car className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold">Vehicle not found</h3>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/admin/vehicles">Back to fleet</Link>
            </Button>
          </div>
        )}

        <InlineError
          message={
            vehicleError?.message ||
            updateVehicleMutation.error?.message ||
            deleteVehicleMutation.error?.message
          }
          className="mt-10"
        />
      </PageContainer>
    </div>
  );
}
