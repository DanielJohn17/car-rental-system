import Link from "next/link";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";

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
