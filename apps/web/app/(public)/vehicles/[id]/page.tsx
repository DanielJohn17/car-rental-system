import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { PageContainer } from "../../../../components/page-container";
import { SiteHeader } from "../../../../components/site-header";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { VehicleImagePlaceholder } from "../../../../components/image-placeholder";

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

  // Handle case where vehicle is not found
  if (!vehicle) {
    return (
      <div>
        <SiteHeader />
        <PageContainer>
          <div className="text-center py-8">
            <h1 className="text-2xl font-semibold mb-2">Vehicle not found</h1>
            <p className="text-muted-foreground mb-4">
              The vehicle you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild variant="outline">
              <Link href="/vehicles">← Back to vehicles</Link>
            </Button>
          </div>
        </PageContainer>
      </div>
    );
  }

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
              {vehicle?.make} {vehicle?.model} ({vehicle?.year})
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              ${vehicle?.dailyRate}/day
              {vehicle?.location ? ` • ${vehicle.location.name}` : ""}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <VehicleImagePlaceholder 
              vehicle={vehicle} 
              className="w-full h-64 mb-4"
              width={600}
              height={400}
            />
            
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Fuel:</span>{" "}
                {vehicle?.fuelType}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Transmission:</span>{" "}
                {vehicle?.transmission}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Seats:</span>{" "}
                {vehicle?.seats}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Mileage:</span>{" "}
                {vehicle?.mileage}
              </div>
              {vehicle?.color ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">Color:</span>{" "}
                  {vehicle.color}
                </div>
              ) : null}
              {vehicle?.location ? (
                <div className="text-sm sm:col-span-2">
                  <span className="text-muted-foreground">Location:</span>{" "}
                  {vehicle.location.name} — {vehicle.location.address}
                </div>
              ) : null}
            </div>

            <div className="pt-2">
              <Button asChild>
                <Link href={`/bookings/new?vehicleId=${vehicle?.id}`}>
                  Request booking
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}
