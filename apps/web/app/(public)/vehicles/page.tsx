import { VehiclesBrowser } from "../../../components/vehicles-browser";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    make?: string;
    model?: string;
    status?: string;
    locationId?: string;
    minDailyRate?: string;
    maxDailyRate?: string;
  }>;
}) {
  return (
    <VehiclesBrowser
      action="/vehicles"
      title="Available vehicles"
      searchParams={searchParams}
    />
  );
}
