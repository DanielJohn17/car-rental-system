import { apiFetch } from "../lib/api";
import { PageContainer } from "./page-container";
import { SiteHeader } from "./site-header";
import { VehicleCard, type VehicleSummary } from "./vehicle-card";
import { VehicleFilters, type LocationOption } from "./vehicle-filters";

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

  const [locations, vehicles] = await Promise.all([
    apiFetch<LocationListResponse | Location[]>("/locations?limit=100&offset=0"),
    (async () => {
      const query = new URLSearchParams();
      if (make) query.set("make", make);
      if (model) query.set("model", model);
      if (locationId) query.set("locationId", locationId);
      if (minDailyRate) query.set("minDailyRate", minDailyRate);
      if (maxDailyRate) query.set("maxDailyRate", maxDailyRate);
      query.set("limit", "20");
      query.set("offset", "0");

      return apiFetch<VehicleSearchResponse>(`/vehicles/search?${query.toString()}`);
    })(),
  ]);

  const locationsList = Array.isArray(locations) ? locations : locations.data;

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
          {subtitle ? <p className="mt-2 text-muted-foreground">{subtitle}</p> : null}
        </div>

        <VehicleFilters
          action={action}
          defaultValues={{ make, model, locationId, minDailyRate, maxDailyRate }}
          locations={locationOptions}
        />

        <div className="mt-6 text-sm text-muted-foreground">Total: {vehicles.total}</div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.data.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>

        {vehicles.data.length === 0 ? (
          <div className="mt-6 text-sm text-muted-foreground">No vehicles found.</div>
        ) : null}
      </PageContainer>
    </div>
  );
}
