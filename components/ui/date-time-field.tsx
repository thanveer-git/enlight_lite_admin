"use client";

/**
 * Date + Time field — single popover combining a `react-day-picker`
 * calendar (with month/year dropdown caption) and a vertical scrollable
 * list of 12-hour time slots styled as full-width buttons, matching
 * the shadcn-datetime-picker layout. The selected value is one ISO
 * string in/out; the field is controlled.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const NONE = "__none__";

const TIME_INTERVAL = 30;

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { selectedDate } = useMemo(() => splitIso(value), [value]);

  const triggerLabel = selectedDate
    ? format(selectedDate, "MM/dd/yyyy hh:mm aa")
    : placeholder;

  // Build a working date used inside the popover so the calendar and
  // time list can render their highlighted state without losing the
  // existing value before the user commits.
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

  const handleTimeSelect = (slot: string) => {
    const [time, period] = slot.split(" ");
    const [hStr, mStr] = time.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (period === "AM" && h === 12) h = 0;
    else if (period === "PM" && h !== 12) h += 12;
    const base = selectedDate ?? new Date();
    const next = new Date(base);
    next.setHours(h, m, 0, 0);
    commit(next);
  };

  // 12-hour slot list, e.g. "12:00 AM", "12:30 AM", "1:00 AM"…
  const timeSlots = useMemo(() => {
    const out: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += TIME_INTERVAL) {
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        const period = h >= 12 ? "PM" : "AM";
        out.push(`${hour12}:${m.toString().padStart(2, "0")} ${period}`);
      }
    }
    return out;
  }, []);

  const currentSlot = dateToSlot(workingDate);

  // Disable past slots when the selected date is today.
  const isTimePast = (slot: string): boolean => {
    const today = new Date();
    const sameDay =
      workingDate.getFullYear() === today.getFullYear() &&
      workingDate.getMonth() === today.getMonth() &&
      workingDate.getDate() === today.getDate();
    if (!sameDay) return false;
    return slotToMinutes(slot) <= today.getHours() * 60 + today.getMinutes();
  };

  // Auto-scroll the time list to centre the currently selected slot
  // each time the popover opens.
  useEffect(() => {
    if (!open) return;
    const idx = timeSlots.indexOf(currentSlot);
    if (idx === -1) return;
    const id = requestAnimationFrame(() => {
      const root = scrollAreaRef.current;
      if (!root) return;
      const viewport = root.querySelector<HTMLElement>(
        "[data-radix-scroll-area-viewport]",
      );
      if (!viewport) return;
      const buttons = viewport.querySelectorAll("button");
      if (buttons.length === 0) return;
      const itemHeight = (buttons[1] as HTMLElement)?.offsetTop
        ? (buttons[1] as HTMLElement).offsetTop -
          (buttons[0] as HTMLElement).offsetTop
        : (buttons[0] as HTMLElement).offsetHeight + 8;
      const scrollPosition = idx * itemHeight;
      const offset = viewport.clientHeight / 2 - itemHeight / 2;
      viewport.scrollTop = Math.max(0, scrollPosition - offset);
    });
    return () => cancelAnimationFrame(id);
  }, [open, timeSlots, currentSlot]);

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
        className="w-auto p-0 flex flex-col"
        align="start"
        sideOffset={6}
      >
        <div className="flex flex-row items-start">
          <DayPicker
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={handleDateSelect}
            showOutsideDays
            classNames={{
              month_caption: "flex justify-between items-center pt-1 px-3",
              caption_label: "text-base font-semibold",
              nav: "flex items-center gap-1",
              button_previous:
                "size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent",
              button_next:
                "size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent",
              weekdays:
                "text-muted-foreground text-[11px] font-medium uppercase",
              weekday: "w-9 text-center",
              day: "p-0 text-center",
              day_button:
                "size-9 rounded-md text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              today: "font-semibold text-primary",
              outside: "text-muted-foreground/60",
              disabled: "text-muted-foreground/40 line-through",
            }}
          />
          <div
            ref={scrollAreaRef}
            className="w-[150px] pr-3 py-3 h-[var(--rdp-height,300px)]"
          >
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-1 pr-3 py-1">
                {timeSlots.map((slot) => {
                  const isActive = slot === currentSlot;
                  const isPast = isTimePast(slot);
                  return (
                    <Button
                      key={slot}
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      disabled={isPast}
                      className="w-full justify-center px-2"
                      onClick={() => handleTimeSelect(slot)}
                    >
                      {slot}
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

function slotToMinutes(slot: string): number {
  const [time, period] = slot.split(" ");
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10);
  if (period === "AM" && h === 12) h = 0;
  else if (period === "PM" && h !== 12) h += 12;
  return h * 60 + parseInt(mStr, 10);
}

function dateToSlot(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const period = h >= 12 ? "PM" : "AM";
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

/**
 * Split an ISO timestamp into its date (Date object) and 12-hour time
 * parts. Both are `null` when the input is unset or unparseable.
 */
function splitIso(value: string | null): {
  selectedDate: Date | null;
} {
  if (!value) return { selectedDate: null };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { selectedDate: null };
  return { selectedDate: d };
}

// Re-export for clarity — keeps tree-shaking happy even if a future
// caller imports this for the helper.
export { NONE };
