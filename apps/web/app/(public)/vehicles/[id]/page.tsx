import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { PageContainer } from "../../../../components/page-container";
import { SiteHeader } from "../../../../components/site-header";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  dailyRate: number;
  mileage: number;
  color?: string | null;
  fuelType: string;
  transmission: string;
  seats: number;
  images?: string[] | null;
  location?: {
    id: string;
    name: string;
    address: string;
  };
};

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await apiFetch<Vehicle>(`/vehicles/${id}`);

  return (
    <div>
      <SiteHeader />
      <PageContainer>
        <div className="mb-4">
          <Button asChild variant="link" className="px-0">
            <Link href="/vehicles">← Back to vehicles</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              ${vehicle.dailyRate}/day
              {vehicle.location ? ` • ${vehicle.location.name}` : ""}
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Fuel:</span> {vehicle.fuelType}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Transmission:</span> {vehicle.transmission}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Seats:</span> {vehicle.seats}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Mileage:</span> {vehicle.mileage}
              </div>
              {vehicle.color ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">Color:</span> {vehicle.color}
                </div>
              ) : null}
              {vehicle.location ? (
                <div className="text-sm sm:col-span-2">
                  <span className="text-muted-foreground">Location:</span> {vehicle.location.name} — {vehicle.location.address}
                </div>
              ) : null}
            </div>

            <div className="pt-2">
              <Button asChild>
                <Link href={`/bookings/new?vehicleId=${vehicle.id}`}>Request booking</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}
