import Link from "next/link";
import { MapPin, Calendar, ArrowRight } from "lucide-react";

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="group overflow-hidden rounded-2xl border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="relative aspect-[16/10] overflow-hidden">
        <VehicleImagePlaceholder
          vehicle={vehicle}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          width={520}
          height={325}
        />
        <div className="absolute top-3 right-3">
          <div className="rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 text-sm font-bold shadow-sm">
            ${vehicle.dailyRate}
            <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
              /day
            </span>
          </div>
        </div>
      </div>

      <CardHeader className="space-y-1 p-5 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-bold tracking-tight">
            {vehicle.make} {vehicle.model}
          </CardTitle>
        </div>
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Model {vehicle.year}</span>
          </div>
          {vehicle.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="truncate">{vehicle.location.name}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardFooter className="flex items-center justify-between p-5 pt-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="px-0 hover:bg-transparent hover:text-primary group/link"
        >
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="flex items-center gap-1"
          >
            View details
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
          </Link>
        </Button>
        <Button asChild size="sm" className="rounded-full px-5 shadow-sm">
          <Link href={`/bookings/new?vehicleId=${vehicle.id}`}>Book Now</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
