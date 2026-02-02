import { apiFetch } from "@/lib/api";
import { toUserErrorMessage } from "@/lib/errors";
import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";
import { InlineError } from "@/components/inline-error";
import { VehicleCard, type VehicleSummary } from "@/components/vehicle-card";
import {
  VehicleFilters,
  type LocationOption,
} from "@/components/vehicle-filters";

type VehicleSearchResponse = {
  data: VehicleSummary[];
  total: number;
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
        locationId?: string;
        minDailyRate?: string;
        maxDailyRate?: string;
      }
    | Promise<{
        make?: string;
        model?: string;
        locationId?: string;
        minDailyRate?: string;
        maxDailyRate?: string;
      }>;
}) {
  const resolvedSearchParams = await searchParams;

  const make = resolvedSearchParams?.make ?? "";
  const model = resolvedSearchParams?.model ?? "";
  const locationId = resolvedSearchParams?.locationId ?? "";
  const minDailyRate = resolvedSearchParams?.minDailyRate ?? "";
  const maxDailyRate = resolvedSearchParams?.maxDailyRate ?? "";

  let locationsList: Location[] = [];
  let vehicles: VehicleSearchResponse = { data: [], total: 0 };
  let errorMessage: string | null = null;

  try {
    const [locations, v] = await Promise.all([
      apiFetch<LocationListResponse | Location[]>(
        "/locations?limit=100&offset=0",
      ),
      (async () => {
        const query = new URLSearchParams();
        if (make) query.set("make", make);
        if (model) query.set("model", model);
        if (locationId) query.set("locationId", locationId);
        if (minDailyRate) query.set("minDailyRate", minDailyRate);
        if (maxDailyRate) query.set("maxDailyRate", maxDailyRate);
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
            locationId,
            minDailyRate,
            maxDailyRate,
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
          <div className="mt-6 text-sm text-muted-foreground">
            No vehicles found.
          </div>
        ) : null}
      </PageContainer>
    </div>
  );
}
