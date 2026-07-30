"use client";

/**
 * Date + Time field — two-part input for the Access Window editor.
 *
 * Renders a `react-day-picker` calendar inside a Radix popover for
 * the date portion, and a native `<input type="time">` for the time.
 * Both halves stay visually consistent with the rest of the form
 * fields (h-9 rounded-md border) and merge into a single ISO string
 * via `onChange`.
 *
 * Selection is one ISO string in/out — the field is controlled.
 */
import { useEffect, useId, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const NONE = "__none__";

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
  placeholder = "Pick a date",
  emphasis,
  disabled,
}: DateTimeFieldProps) {
  const id = useId();
  // Internal state mirrors the controlled `value` so we can split into
  // date and time parts cleanly.
  const [open, setOpen] = useState(false);

  const { selectedDate, timeValue } = useMemo(
    () => splitIso(value),
    [value],
  );

  // Keep the popover-trigger label in sync with the controlled value.
  const triggerLabel = selectedDate
    ? format(selectedDate, "EEE, MMM d, yyyy")
    : placeholder;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(null);
      setOpen(false);
      return;
    }
    // Preserve the previously-typed time if there was one.
    const hh = timeValue?.split(":")[0] ?? "00";
    const mm = timeValue?.split(":")[1] ?? "00";
    const merged = new Date(date);
    merged.setHours(Number(hh), Number(mm), 0, 0);
    onChange(merged.toISOString());
    setOpen(false);
  };

  const handleTimeChange = (next: string) => {
    if (!next) {
      // If the date is also unset, the result is null; otherwise
      // preserve the date and zero the time.
      if (!selectedDate) {
        onChange(null);
        return;
      }
      const d = new Date(selectedDate);
      d.setHours(0, 0, 0, 0);
      onChange(d.toISOString());
      return;
    }
    const [hh, mm] = next.split(":");
    const base = selectedDate ? new Date(selectedDate) : new Date();
    base.setHours(Number(hh ?? 0), Number(mm ?? 0), 0, 0);
    onChange(base.toISOString());
  };

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_120px] items-center gap-2",
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={`${id}-date`}
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
          <DayPicker
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={handleDateSelect}
            showOutsideDays
            classNames={{
              // v10 also merges `getDefaultClassNames()` automatically.
              caption_label: "text-sm font-medium",
              button_previous: "size-7 rounded-md border border-input bg-background hover:bg-accent mr-1",
              button_next: "size-7 rounded-md border border-input bg-background hover:bg-accent ml-1",
              weekdays: "text-muted-foreground text-[11px] font-medium uppercase",
              day_button:
                "size-9 rounded-md text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              today: "border border-primary/40",
              outside: "text-muted-foreground/60",
              disabled: "text-muted-foreground/40 line-through",
            }}
          />
        </PopoverContent>
      </Popover>

      <span aria-hidden className="text-muted-foreground">
        ·
      </span>

      <Input
        id={`${id}-time`}
        type="time"
        value={timeValue ?? ""}
        onChange={(e) => handleTimeChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "h-9 text-sm tabular-nums",
          emphasis && "border-destructive/60 ring-1 ring-destructive/30",
        )}
      />
    </div>
  );
}

/**
 * Split an ISO timestamp into its date (Date object) and time
 * (`HH:mm`) parts. Both are `null` when the input is unset.
 */
function splitIso(value: string | null): {
  selectedDate: Date | null;
  timeValue: string | null;
} {
  if (!value) return { selectedDate: null, timeValue: null };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { selectedDate: null, timeValue: null };
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mm = `${d.getMinutes()}`.padStart(2, "0");
  return { selectedDate: d, timeValue: `${hh}:${mm}` };
}

// Re-export for clarity — keeps tree-shaking happy even if a future
// caller imports this for the helper.
export { NONE };
