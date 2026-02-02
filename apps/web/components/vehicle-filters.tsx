import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export type LocationOption = {
  id: string;
  name: string;
};

export function VehicleFilters({
  action,
  defaultValues,
  locations,
}: {
  action: string;
  defaultValues: {
    make?: string;
    model?: string;
    locationId?: string;
    minDailyRate?: string;
    maxDailyRate?: string;
  };
  locations: LocationOption[];
}) {
  const { make, model, locationId, minDailyRate, maxDailyRate } = defaultValues;

  return (
    <form
      action={action}
      method="get"
      className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-6 md:items-end"
    >
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="make">Make</Label>
        <Input id="make" name="make" defaultValue={make ?? ""} />
      </div>

      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="model">Model</Label>
        <Input id="model" name="model" defaultValue={model ?? ""} />
      </div>

      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="locationId">Location</Label>
        <select
          id="locationId"
          name="locationId"
          defaultValue={locationId ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="minDailyRate">Min/day</Label>
        <Input
          id="minDailyRate"
          name="minDailyRate"
          inputMode="numeric"
          defaultValue={minDailyRate ?? ""}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="maxDailyRate">Max/day</Label>
        <Input
          id="maxDailyRate"
          name="maxDailyRate"
          inputMode="numeric"
          defaultValue={maxDailyRate ?? ""}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" className="w-full">
          Search
        </Button>
      </div>
    </form>
  );
}
