import { apiFetch } from "@/lib/api";
import { toUserErrorMessage } from "@/lib/errors";
import { PageContainer } from "@/components/page-container";
import { InlineError } from "@/components/inline-error";
import { VehicleCard, type VehicleSummary } from "@/components/vehicle-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  VehicleFilters,
  type LocationOption,
} from "@/components/vehicle-filters";
import { FilterCloseButton } from "@/components/filter-close-button";
import { Search, SlidersHorizontal } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      <div className="relative">
        <PageContainer className="py-12">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                {subtitle}
              </p>
            ) : (
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                Discover the perfect vehicle for your next journey. Filter by
                make, model, or location to find your match.
              </p>
            )}
          </div>

          <InlineError message={errorMessage} className="mb-8" />

          <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:items-start">
            <aside className="hidden lg:block lg:sticky lg:top-24 space-y-6">
              <div className="flex items-center gap-2 mb-4 px-1">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Filter Results</h2>
              </div>
              <VehicleFilters
                action={action}
                variant="sidebar"
                idPrefix="desktop-"
                className="shadow-md border-border/40"
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
            </aside>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Showing {vehicles.data.length} of {vehicles.total} vehicles
                  </span>
                </div>

                <div className="lg:hidden">
                  <details className="group">
                    <summary className="flex cursor-pointer items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors list-none shadow-sm">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>Filters</span>
                    </summary>
                    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden group-open:block hidden" />
                    <div className="fixed inset-x-4 top-[15%] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl lg:hidden group-open:block hidden animate-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold">Filters</h2>
                        <FilterCloseButton />
                      </div>
                      <VehicleFilters
                        action={action}
                        variant="sidebar"
                        idPrefix="mobile-"
                        className="border-0 bg-transparent p-0 shadow-none"
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
                </div>
              </div>

              {vehicles.data.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {vehicles.data.map((v) => (
                    <VehicleCard key={v.id} vehicle={v} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 bg-muted/20">
                  <CardContent className="py-16">
                    <div className="text-center flex flex-col items-center gap-4">
                      <div className="rounded-full bg-muted p-6">
                        <Search className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">No vehicles found</h3>
                        <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
                          We couldn&apos;t find any vehicles matching your
                          current filters. Try broadening your search.
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap justify-center gap-3">
                        <Button
                          asChild
                          variant="outline"
                          className="rounded-full"
                        >
                          <Link href={action}>Clear all filters</Link>
                        </Button>
                        <Button asChild className="rounded-full">
                          <Link href="/vehicles">Browse all fleet</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
