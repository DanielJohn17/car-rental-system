import Link from "next/link";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VehicleImagePlaceholder } from "@/components/image-placeholder";

export type VehicleSummary = {
  id: string;
  make: string;
  model: string;
  year: number;
  dailyRate: number;
  images?: string[] | null;
  location?: {
    id: string;
    name: string;
    address: string;
  };
};

export function VehicleCard({ vehicle }: { vehicle: VehicleSummary }) {
  return (
    <Card className="overflow-hidden rounded-xl border-border/60 bg-card shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              {vehicle.make} {vehicle.model}
            </CardTitle>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {vehicle.year}
              {vehicle.location ? ` • ${vehicle.location.name}` : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">${vehicle.dailyRate}</div>
            <div className="text-xs text-muted-foreground">per day</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <VehicleImagePlaceholder
          vehicle={vehicle}
          className="h-44 w-full"
          width={520}
          height={360}
        />
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <Button asChild variant="link" className="px-0">
          <Link href={`/vehicles/${vehicle.id}`}>View details</Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/bookings/new?vehicleId=${vehicle.id}`}>Book</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
