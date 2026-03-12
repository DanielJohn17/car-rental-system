"use client";

import Link from "next/link";
import {
  Edit,
  Trash2,
  Car,
  Calendar,
  Hash,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Fuel,
  Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

interface AdminVehicleCardProps {
  vehicle: Vehicle;
  onStatusUpdate: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  vehicleStatuses: readonly string[];
}

export function AdminVehicleCard({
  vehicle,
  onStatusUpdate,
  onDelete,
  vehicleStatuses,
}: AdminVehicleCardProps) {
  const getStatusIcon = (status: string) => {
    const s = status.toUpperCase();
    if (s === "AVAILABLE")
      return <CheckCircle2 className="h-3 w-3 text-emerald-600" />;
    if (s === "RENTED" || s === "RESERVED")
      return <Clock className="h-3 w-3 text-blue-600" />;
    return <AlertCircle className="h-3 w-3 text-destructive" />;
  };

  const getStatusBg = (status: string) => {
    const s = status.toUpperCase();
    if (s === "AVAILABLE") return "bg-emerald-500/10 text-emerald-600";
    if (s === "RENTED" || s === "RESERVED")
      return "bg-blue-500/10 text-blue-600";
    return "bg-destructive/10 text-destructive";
  };

  return (
    <Card
      key={vehicle.id}
      className="group overflow-hidden rounded-3xl border-border/50 bg-card shadow-sm transition-all hover:shadow-md"
    >
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-[1fr_200px]">
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border-none ${getStatusBg(vehicle.status)}`}
              >
                <span className="flex items-center gap-1.5">
                  {getStatusIcon(vehicle.status)}
                  {vehicle.status}
                </span>
              </Badge>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                ID: {vehicle.id.slice(0, 8)}...
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Car className="h-8 w-8" />
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-muted-foreground font-medium text-sm">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {vehicle.year}
                    </span>
                    <span className="flex items-center gap-1.5 border-l pl-4 border-border/50">
                      <Hash className="h-3.5 w-3.5 text-primary" />
                      {vehicle.licensePlate}
                    </span>
                    <span className="flex items-center gap-1.5 border-l pl-4 border-border/50">
                      <Settings2 className="h-3.5 w-3.5 text-primary" />
                      {vehicle.transmission}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Daily Rate
                    </p>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-primary" />
                      {vehicle.dailyRate}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Mileage
                    </p>
                    <p className="text-sm font-bold">
                      {vehicle.mileage.toLocaleString()}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                        mi
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Fuel Type
                    </p>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <Fuel className="h-3.5 w-3.5 text-primary" />
                      <span className="capitalize">
                        {vehicle.fuelType.toLowerCase()}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Seats
                    </p>
                    <p className="text-sm font-bold">{vehicle.seats}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 border-l border-border/50 p-6 flex flex-col justify-center gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Status Action
              </Label>
              <Select
                value={vehicle.status}
                onValueChange={(value: string) =>
                  onStatusUpdate(vehicle.id, value)
                }
              >
                <SelectTrigger className="h-10 rounded-xl bg-background shadow-sm border-border/50 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vehicleStatuses.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="text-xs font-medium uppercase tracking-wider"
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl h-10 font-bold bg-background hover:bg-muted transition-all"
              >
                <Link href={`/admin/vehicles/${vehicle.id}`}>
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-10 font-bold text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive shadow-none transition-all"
                onClick={() => onDelete(vehicle.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
