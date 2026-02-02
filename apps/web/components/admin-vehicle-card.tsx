"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  return (
    <Card key={vehicle.id}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </h3>
            <p className="text-sm text-muted-foreground">
              ${vehicle.dailyRate}/day • {vehicle.status}
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
                <Link href={`/admin/vehicles/${vehicle.id}`}>Edit Vehicle</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(vehicle.id)}
                className="text-destructive"
              >
                Delete Vehicle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="text-sm">
            <span className="font-medium">ID:</span> {vehicle.id}
          </div>
          <div className="text-sm">
            <span className="font-medium">Plate:</span> {vehicle.licensePlate}
          </div>
          <div className="text-sm">
            <span className="font-medium">VIN:</span> {vehicle.vin}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={vehicle.status}
              onValueChange={(value: string) =>
                onStatusUpdate(vehicle.id, value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vehicleStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
