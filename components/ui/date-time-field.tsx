"use client";

/**
 * Date + Time field — single popover combining a `react-day-picker`
 * calendar with three scroll columns (hour / minute / AM/PM) for the
 * 12-hour time portion. The selected value is one ISO string in/out,
 * the field is controlled.
 */
import { useId, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const NONE = "__none__";

type Meridiem = "AM" | "PM";

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const MERIDIEMS: Meridiem[] = ["AM", "PM"];

interface DateTimeFieldProps {
  /** ISO timestamp (`string`) or `null` for unset. */
  value: string | null;
  /** Receives ISO timestamp or `null` when cleared. */
  onChange: (next: string | null) => void;
  /** Optional placeholder text shown when unset. */
  placeholder?: string;
  /** Whether to visually emphasise the field (e.g. destructive tone). */
  emphasis?: boolean;
  /** Disable the popover trigger. */
  disabled?: boolean;
  /** Whether the field is required (renders `*` next to its label). */
  required?: boolean;
}

export function DateTimeField({
  value,
  onChange,
  placeholder = "MM/DD/YYYY hh:mm aa",
  emphasis,
  disabled,
}: DateTimeFieldProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  const { selectedDate, timeParts } = useMemo(
    () => splitIso(value),
    [value],
  );

  const triggerLabel = selectedDate
    ? format(selectedDate, "MM/dd/yyyy hh:mm aa")
    : placeholder;

  // Build a working date used inside the popover so the calendar and
  // time columns can render their highlighted state without losing
  // the existing value before the user commits.
  const workingDate = useMemo(() => {
    if (selectedDate) return new Date(selectedDate);
    const now = new Date();
    now.setHours(9, 0, 0, 0);
    return now;
  }, [selectedDate]);

  const commit = (next: Date) => onChange(next.toISOString());

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const merged = new Date(date);
    merged.setHours(workingDate.getHours(), workingDate.getMinutes(), 0, 0);
    commit(merged);
  };

  const handleTimeChange = (
    type: "hour" | "minute" | "ampm",
    raw: string,
  ) => {
    const next = new Date(workingDate);
    if (type === "hour") {
      const h12 = Number(raw);
      const isPm = next.getHours() >= 12;
      next.setHours(to24Hour(h12, isPm ? "PM" : "AM"));
    } else if (type === "minute") {
      next.setMinutes(Number(raw));
    } else {
      const current = next.getHours();
      const wantPm = raw === "PM";
      const isPm = current >= 12;
      if (wantPm && !isPm) next.setHours(current + 12);
      else if (!wantPm && isPm) next.setHours(current - 12);
    }
    next.setSeconds(0, 0);
    if (selectedDate) {
      const merged = new Date(selectedDate);
      merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
      commit(merged);
    } else {
      commit(next);
    }
  };

  const currentHour12 = workingDate.getHours() % 12 === 0 ? 12 : workingDate.getHours() % 12;
  const currentMinute = workingDate.getMinutes();
  const currentIsPm = workingDate.getHours() >= 12;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !selectedDate && "text-muted-foreground",
            emphasis && "border-destructive/60 ring-1 ring-destructive/30",
          )}
        >
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-4 opacity-60" aria-hidden />
            {triggerLabel}
          </span>
          <ChevronDown className="size-4 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        sideOffset={6}
      >
        <div className="flex">
          <DayPicker
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={handleDateSelect}
            showOutsideDays
            classNames={{
              month_grid: "border-collapse",
              caption_label: "text-sm font-medium",
              button_previous: "size-7 rounded-md border border-input bg-background hover:bg-accent mr-1",
              button_next: "size-7 rounded-md border border-input bg-background hover:bg-accent ml-1",
              weekdays: "text-muted-foreground text-[11px] font-medium uppercase",
              weekday: "w-9 text-center",
              day: "p-0 text-center",
              day_button:
                "size-9 rounded-md text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              today: "border border-primary/40",
              outside: "text-muted-foreground/60",
              disabled: "text-muted-foreground/40 line-through",
            }}
          />
          <div className="flex h-[300px] flex-row divide-x">
            <ScrollArea className="w-16">
              <div className="flex flex-col p-2">
                {HOURS.map((hour) => {
                  const active = currentHour12 === hour;
                  return (
                    <Button
                      key={hour}
                      size="icon"
                      variant={active ? "default" : "ghost"}
                      className="w-full shrink-0"
                      onClick={() => handleTimeChange("hour", String(hour))}
                    >
                      {hour}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
            <ScrollArea className="w-16">
              <div className="flex flex-col p-2">
                {MINUTES.map((minute) => {
                  const active = currentMinute === minute;
                  return (
                    <Button
                      key={minute}
                      size="icon"
                      variant={active ? "default" : "ghost"}
                      className="w-full shrink-0"
                      onClick={() =>
                        handleTimeChange("minute", String(minute))
                      }
                    >
                      {minute.toString().padStart(2, "0")}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
            <ScrollArea className="w-16">
              <div className="flex flex-col p-2">
                {MERIDIEMS.map((ampm) => {
                  const active = ampm === "PM" ? currentIsPm : !currentIsPm;
                  return (
                    <Button
                      key={ampm}
                      size="icon"
                      variant={active ? "default" : "ghost"}
                      className="w-full shrink-0"
                      onClick={() => handleTimeChange("ampm", ampm)}
                    >
                      {ampm}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function to24Hour(hour12: number, meridiem: Meridiem): number {
  if (meridiem === "AM") return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

function from24Hour(hour24: number, minute: number): {
  hour12: number;
  minute: number;
  meridiem: Meridiem;
} {
  const meridiem: Meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, minute, meridiem };
}

/**
 * Split an ISO timestamp into its date (Date object) and 12-hour time
 * parts. Both are `null` when the input is unset or unparseable.
 */
function splitIso(value: string | null): {
  selectedDate: Date | null;
  timeParts: { hour12: number; minute: number; meridiem: Meridiem } | null;
} {
  if (!value) return { selectedDate: null, timeParts: null };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { selectedDate: null, timeParts: null };
  return {
    selectedDate: d,
    timeParts: from24Hour(d.getHours(), d.getMinutes()),
  };
}

// Re-export for clarity — keeps tree-shaking happy even if a future
// caller imports this for the helper.
export { NONE };
