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
            if (makeLc && !veh.make.toLowerCase().includes(makeLc))
              return false;
            if (modelLc && !veh.model.toLowerCase().includes(modelLc))
              return false;
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
      <SiteHeader variant="inventory" showAdminCtas={false} />
      <div className="bg-muted/30">
        <PageContainer>
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>

          <InlineError message={errorMessage} className="mb-4" />

          <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
            <div className="hidden lg:block lg:sticky lg:top-6">
              <VehicleFilters
                action={action}
                variant="sidebar"
                idPrefix="desktop-"
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
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Total: {vehicles.total}
                </div>

                <div className="lg:hidden" />
              </div>

              <details className="group lg:hidden mt-3 rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
                  <span>Filters</span>
                  <span className="text-muted-foreground">
                    <span className="group-open:hidden">Tap to open</span>
                    <span className="hidden group-open:inline">Tap to close</span>
                  </span>
                </summary>
                <div className="px-4 pb-4">
                  <VehicleFilters
                    action={action}
                    variant="sidebar"
                    idPrefix="mobile-"
                    className="border-0 bg-transparent p-0"
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
                </div>
              </details>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {vehicles.data.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>

              {vehicles.data.length === 0 ? (
                <Card className="mt-6">
                  <CardContent className="py-10">
                    <div className="text-center">
                      <div className="text-lg font-medium">
                        No vehicles available
                      </div>
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
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
