import { apiFetch } from "@/lib/api";
import { toUserErrorMessage } from "@/lib/errors";
import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";
import { InlineError } from "@/components/inline-error";
import { VehicleCard, type VehicleSummary } from "@/components/vehicle-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  VehicleFilters,
  type LocationOption,
} from "@/components/vehicle-filters";

type VehicleSearchResponse = {
  data: VehicleSummary[];
  total: number;
};

type VehicleEntity = VehicleSummary & {
  locationId?: string;
};

type Location = {
  id: string;
  name: string;
};

type LocationListResponse = {
  data: Location[];
  total: number;
};

export async function VehiclesBrowser({
  action,
  title,
  subtitle,
  searchParams,
}: {
  action: string;
  title: string;
  subtitle?: string;
  searchParams?:
    | {
        make?: string;
        model?: string;
        status?: string;
        locationId?: string;
        startDate?: string;
        endDate?: string;
      }
    | Promise<{
        make?: string;
        model?: string;
        status?: string;
        locationId?: string;
        startDate?: string;
        endDate?: string;
      }>;
}) {
  const resolvedSearchParams = await searchParams;

  const make = resolvedSearchParams?.make ?? "";
  const model = resolvedSearchParams?.model ?? "";
  const status = resolvedSearchParams?.status ?? "";
  const locationId = resolvedSearchParams?.locationId ?? "";
  const startDate = resolvedSearchParams?.startDate ?? "";
  const endDate = resolvedSearchParams?.endDate ?? "";

  let locationsList: Location[] = [];
  let vehicles: VehicleSearchResponse = { data: [], total: 0 };
  let errorMessage: string | null = null;

  try {
    const [locations, v] = await Promise.all([
      apiFetch<LocationListResponse | Location[]>(
        "/locations?limit=100&offset=0",
      ),
      (async () => {
        const hasDateRange = Boolean(startDate && endDate);

        if (hasDateRange) {
          const query = new URLSearchParams();
          query.set("startDate", startDate);
          query.set("endDate", endDate);
          if (locationId) query.set("locationId", locationId);

          const available = await apiFetch<VehicleEntity[]>(
            `/vehicles/available/search?${query.toString()}`,
          );

          const makeLc = make.trim().toLowerCase();
          const modelLc = model.trim().toLowerCase();

          const filtered = available.filter((veh) => {
            if (makeLc && !veh.make.toLowerCase().includes(makeLc)) return false;
            if (modelLc && !veh.model.toLowerCase().includes(modelLc)) return false;
            return true;
          });

          return {
            data: filtered,
            total: filtered.length,
          } satisfies VehicleSearchResponse;
        }

        const query = new URLSearchParams();
        if (make) query.set("make", make);
        if (model) query.set("model", model);
        query.set("status", status || "AVAILABLE");
        if (locationId) query.set("locationId", locationId);
        query.set("limit", "20");
        query.set("offset", "0");

        return apiFetch<VehicleSearchResponse>(
          `/vehicles/search?${query.toString()}`,
        );
      })(),
    ]);

    locationsList = Array.isArray(locations) ? locations : locations?.data;
    vehicles = v;
  } catch (e: unknown) {
    errorMessage = toUserErrorMessage(e, "Failed to load vehicles");
  }

  const locationOptions: LocationOption[] = locationsList.map((l) => ({
    id: l.id,
    name: l.name,
  }));

  return (
    <div>
      <SiteHeader />
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        <InlineError message={errorMessage} className="mb-4" />

        <VehicleFilters
          action={action}
          defaultValues={{
            make,
            model,
            status,
            locationId,
            startDate,
            endDate,
          }}
          locations={locationOptions}
        />

        <div className="mt-6 text-sm text-muted-foreground">
          Total: {vehicles.total}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.data.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>

        {vehicles.data.length === 0 ? (
          <Card className="mt-6">
            <CardContent className="py-10">
              <div className="text-center">
                <div className="text-lg font-medium">No vehicles available</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your filters or selecting another location.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button asChild variant="outline">
                    <Link href={action}>Reset filters</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/vehicles">Browse all vehicles</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </PageContainer>
    </div>
  );
}
