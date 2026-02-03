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
      title="Find your next ride"
      subtitle="Browse available vehicles and request a booking in minutes."
      searchParams={searchParams}
    />
  );
}
