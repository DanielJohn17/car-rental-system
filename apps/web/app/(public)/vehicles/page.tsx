import { VehiclesBrowser } from "../../../components/vehicles-browser";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    make?: string;
    model?: string;
    status?: string;
    locationId?: string;
    startDate?: string;
    endDate?: string;
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
