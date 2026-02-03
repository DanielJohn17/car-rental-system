"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";

export type LocationOption = {
  id: string;
  name: string;
};

export function VehicleFilters({
  action,
  defaultValues,
  locations,
  variant = "bar",
  idPrefix,
  className,
}: {
  action: string;
  defaultValues: {
    make?: string;
    model?: string;
    status?: string;
    locationId?: string;
    startDate?: string;
    endDate?: string;
  };
  locations: LocationOption[];
  variant?: "bar" | "sidebar";
  idPrefix?: string;
  className?: string;
}) {
  const { make, model, status, locationId, startDate, endDate } = defaultValues;

  const makeId = `${idPrefix ?? ""}make`;
  const modelId = `${idPrefix ?? ""}model`;
  const locationIdId = `${idPrefix ?? ""}locationId`;
  const statusId = `${idPrefix ?? ""}status`;

  const initialRange = useMemo<DateRange | undefined>(() => {
    const from = startDate ? new Date(startDate) : undefined;
    const to = endDate ? new Date(endDate) : undefined;

    if (from && to && isAfter(startOfDay(to), startOfDay(from))) {
      return { from, to };
    }

    if (from) {
      return { from };
    }

    return undefined;
  }, [startDate, endDate]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialRange,
  );

  const [calendarMonths, setCalendarMonths] = useState(1);

  useEffect(() => {
    const update = () => {
      setCalendarMonths(window.innerWidth >= 768 ? 2 : 1);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const dateValidationError = useMemo(() => {
    const from = dateRange?.from;
    const to = dateRange?.to;
    if (!from || !to) return null;

    if (!isAfter(startOfDay(to), startOfDay(from))) {
      return "End date must be after start date";
    }

    const today = startOfDay(new Date());
    if (isBefore(startOfDay(from), today)) {
      return "Start date cannot be in the past";
    }

    return null;
  }, [dateRange?.from, dateRange?.to]);

  const startDateValue = dateRange?.from
    ? startOfDay(dateRange.from).toISOString()
    : "";
  const endDateValue = dateRange?.to
    ? startOfDay(dateRange.to).toISOString()
    : "";

  return (
    <form
      action={action}
      method="get"
      className={cn(
        "grid gap-4 rounded-lg border bg-card p-4",
        variant === "bar" && "md:grid-cols-6 md:items-end",
        className,
      )}
    >
      <div className={cn("grid gap-2", variant === "bar" && "md:col-span-2")}>
        <Label htmlFor={makeId}>Make</Label>
        <Input id={makeId} name="make" defaultValue={make ?? ""} />
      </div>

      <div className={cn("grid gap-2", variant === "bar" && "md:col-span-2")}>
        <Label htmlFor={modelId}>Model</Label>
        <Input id={modelId} name="model" defaultValue={model ?? ""} />
      </div>

      <div className={cn("grid gap-2", variant === "bar" && "md:col-span-2")}>
        <Label htmlFor={locationIdId}>Location</Label>
        <select
          id={locationIdId}
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

      <div className={cn("grid gap-2", variant === "bar" && "md:col-span-2")}>
        <Label htmlFor={statusId}>Status</Label>
        <select
          id={statusId}
          name="status"
          defaultValue={status ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Available</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="RENTED">RENTED</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
          <option value="DAMAGED">DAMAGED</option>
          <option value="RESERVED">RESERVED</option>
        </select>
      </div>

      <div className={cn("grid gap-2", variant === "bar" && "md:col-span-2")}>
        <Label>Rental dates</Label>
        <input type="hidden" name="startDate" value={startDateValue} />
        <input type="hidden" name="endDate" value={endDateValue} />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange?.from && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
                ) : (
                  format(dateRange.from, "PPP")
                )
              ) : (
                <span>Select dates</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              numberOfMonths={calendarMonths}
              selected={dateRange}
              onSelect={(range: DateRange | undefined) => setDateRange(range)}
              disabled={(date: Date) => {
                const day = startOfDay(date);
                const today = startOfDay(new Date());
                return isBefore(day, today);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {dateValidationError ? (
          <div className="text-sm text-destructive">{dateValidationError}</div>
        ) : null}
      </div>

      <div className={cn("flex items-center gap-2", variant === "bar" && "md:col-span-2")}>
        <Button type="submit" className="w-full">
          Search
        </Button>
      </div>
    </form>
  );
}
