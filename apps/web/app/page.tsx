import { VehiclesBrowser } from "../components/vehicles-browser";

export default async function Home({
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
      action="/"
      title="Inventory"
      searchParams={searchParams}
    />
  );
}
