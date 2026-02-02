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
  location?: {
    id: string;
    name: string;
    address: string;
  };
};

export function VehicleCard({ vehicle }: { vehicle: VehicleSummary }) {
  return (
    <Card>
      <CardHeader>
        <VehicleImagePlaceholder
          vehicle={vehicle}
          className="w-full h-48 mb-4"
          width={400}
          height={300}
        />
        <CardTitle>
          {vehicle.make} {vehicle.model} ({vehicle.year})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm text-muted-foreground">
          ${vehicle.dailyRate}/day
        </div>
        {vehicle.location ? (
          <div className="text-sm text-muted-foreground">
            {vehicle.location.name} — {vehicle.location.address}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="justify-between">
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
