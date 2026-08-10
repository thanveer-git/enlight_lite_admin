"use client";

/**
 * EDatetimpicker
 * Self-contained datetime picker. Uses its own palette and layout on purpose —
 * it does not reference this app's design tokens, cn() util, or ui components.
 */
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const TIMEZONE_GROUPS: Record<string, string[]> = {
  "North America": [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Anchorage",
    "America/Toronto",
    "America/Vancouver",
    "Pacific/Honolulu",
  ],
  Europe: [
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Madrid",
    "Europe/Rome",
    "Europe/Amsterdam",
    "Europe/Moscow",
    "Europe/Istanbul",
  ],
  Asia: [
    "Asia/Dubai",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Dhaka",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Asia/Seoul",
  ],
  "Australia & Pacific": [
    "Australia/Perth",
    "Australia/Sydney",
    "Australia/Melbourne",
    "Pacific/Auckland",
    "Pacific/Fiji",
  ],
  "South America": [
    "America/Sao_Paulo",
    "America/Argentina/Buenos_Aires",
    "America/Bogota",
    "America/Santiago",
  ],
  Africa: [
    "Africa/Cairo",
    "Africa/Lagos",
    "Africa/Johannesburg",
    "Africa/Nairobi",
  ],
};

function getTimezoneLabel(tz: string): string {
  const city = tz.split("/").pop()?.replace(/_/g, " ") || tz;
  try {
    const offset =
      new Intl.DateTimeFormat("en", {
        timeZone: tz,
        timeZoneName: "shortOffset",
      })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName")?.value || "";
    return `${city} (${offset})`;
  } catch {
    return city;
  }
}

function getTimezoneAbbr(tz: string): string {
  try {
    return (
      new Intl.DateTimeFormat("en", {
        timeZone: tz,
        timeZoneName: "short",
      })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName")?.value || tz
    );
  } catch {
    return tz;
  }
}

function formatTimeSlot(hour: number, minute: number, hourFormat: 12 | 24): string {
  const mm = minute.toString().padStart(2, "0");
  if (hourFormat === 24) {
    return `${hour.toString().padStart(2, "0")}:${mm}`;
  }
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${mm} ${period}`;
}

function toMinutes(time24: string): number {
  const [h, m] = time24.split(":");
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export interface EDatetimpickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  timeInterval?: 15 | 30 | 60;
  hourFormat?: 12 | 24;
  timezone?: string;
  showTimezone?: boolean;
  onTimezoneChange?: (timezone: string) => void;
  minTime?: string;
  maxTime?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  disabledDates?: (date: Date) => boolean;
  name?: string;
  className?: string;
}

interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
  totalMinutes: number;
}

export const EDatetimpicker = React.forwardRef<HTMLInputElement, EDatetimpickerProps>(
  function EDatetimpicker(
    {
      value,
      onChange,
      disabled = false,
      minDate,
      maxDate,
      placeholder = "Pick a date and time",
      timeInterval = 15,
      hourFormat = 24,
      timezone,
      showTimezone = false,
      onTimezoneChange,
      minTime,
      maxTime,
      weekStartsOn = 0,
      disabledDates: disabledDatesFn,
      name,
      className,
    },
    ref,
  ) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);
    const [time, setTime] = useState<{ hour: number; minute: number }>({
      hour: 9,
      minute: 0,
    });
    const [viewMonth, setViewMonth] = useState<Date>(
      value ? new Date(value.getFullYear(), value.getMonth(), 1) : startOfDay(new Date()),
    );
    const [selectedTimezone, setSelectedTimezone] = useState<string>("UTC");
    const [isMobile, setIsMobile] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const timeListRef = useRef<HTMLDivElement>(null);

    // Set local timezone after mount to avoid hydration mismatch.
    useEffect(() => {
      if (!timezone) {
        setSelectedTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
    }, [timezone]);

    useEffect(() => {
      if (timezone) setSelectedTimezone(timezone);
    }, [timezone]);

    // Sync controlled value prop into internal state.
    useEffect(() => {
      setSelectedDate(value);
      if (value) {
        setTime({ hour: value.getHours(), minute: value.getMinutes() });
        setViewMonth(new Date(value.getFullYear(), value.getMonth(), 1));
      }
    }, [value]);

    // Detect mobile (SSR-safe).
    useEffect(() => {
      const query = window.matchMedia("(max-width: 767px)");
      const check = () => setIsMobile(query.matches);
      check();
      query.addEventListener("change", check);
      return () => query.removeEventListener("change", check);
    }, []);

    // Close on outside click (desktop only — mobile uses backdrop).
    useEffect(() => {
      if (!isOpen || isMobile) return;
      const onDown = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", onDown);
      return () => document.removeEventListener("mousedown", onDown);
    }, [isOpen, isMobile]);

    // Close on Escape.
    useEffect(() => {
      if (!isOpen) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsOpen(false);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [isOpen]);

    const timeSlots = useMemo<TimeSlot[]>(() => {
      const slotsPerHour = 60 / timeInterval;
      const minMinutes = minTime ? toMinutes(minTime) : 0;
      const maxMinutes = maxTime ? toMinutes(maxTime) : 24 * 60 - 1;
      const slots: TimeSlot[] = [];
      for (let i = 0; i < 24 * slotsPerHour; i++) {
        const hour = Math.floor(i / slotsPerHour);
        const minute = (i % slotsPerHour) * timeInterval;
        const total = hour * 60 + minute;
        if (total >= minMinutes && total <= maxMinutes) {
          slots.push({
            hour,
            minute,
            label: formatTimeSlot(hour, minute, hourFormat),
            totalMinutes: total,
          });
        }
      }
      return slots;
    }, [timeInterval, hourFormat, minTime, maxTime]);

    const currentTimeLabel = formatTimeSlot(time.hour, time.minute, hourFormat);

    const isDateDisabled = useCallback(
      (date: Date) => {
        const day = startOfDay(date);
        if (minDate && day < startOfDay(minDate)) return true;
        if (maxDate && day > startOfDay(maxDate)) return true;
        if (disabledDatesFn?.(date)) return true;
        return false;
      },
      [minDate, maxDate, disabledDatesFn],
    );

    const isSlotPast = (slot: TimeSlot): boolean => {
      const base = selectedDate || new Date();
      const now = new Date();
      if (
        base.getFullYear() !== now.getFullYear() ||
        base.getMonth() !== now.getMonth() ||
        base.getDate() !== now.getDate()
      ) {
        return false;
      }
      return slot.totalMinutes <= now.getHours() * 60 + now.getMinutes();
    };

    const combineDateTime = (date: Date, hour: number, minute: number): Date => {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      d.setHours(hour, minute, 0, 0);
      return d;
    };

    const handleDayClick = (date: Date) => {
      const combined = combineDateTime(date, time.hour, time.minute);
      setSelectedDate(combined);
      setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      onChange?.(combined);
    };

    const handleTimeSelect = (slot: TimeSlot) => {
      setTime({ hour: slot.hour, minute: slot.minute });
      const base = selectedDate || new Date();
      const combined = combineDateTime(base, slot.hour, slot.minute);
      setSelectedDate(combined);
      onChange?.(combined);
      setIsOpen(false);
    };

    // Scroll selected time into view when opening.
    useEffect(() => {
      if (!isOpen) return;
      requestAnimationFrame(() => {
        const container = timeListRef.current;
        if (!container) return;
        const buttons = container.querySelectorAll("button");
        const idx = timeSlots.findIndex(
          (s) => s.hour === time.hour && s.minute === time.minute,
        );
        if (idx >= 0 && buttons[idx]) {
          const el = buttons[idx] as HTMLElement;
          container.scrollTop =
            el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2;
        }
      });
    }, [isOpen, time.hour, time.minute, timeSlots]);

    // Calendar grid.
    const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const gridStart = new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth(),
      1 - ((firstOfMonth.getDay() - weekStartsOn + 7) % 7),
    );
    const gridCells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      gridCells.push(
        new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i),
      );
    }
    const weekdays = [
      ...WEEKDAY_LABELS.slice(weekStartsOn),
      ...WEEKDAY_LABELS.slice(0, weekStartsOn),
    ];

    const currentYear = new Date().getFullYear();
    const minYear = minDate ? minDate.getFullYear() : currentYear - 10;
    const maxYear = maxDate ? maxDate.getFullYear() : currentYear + 5;
    const years: number[] = [];
    for (let y = minYear; y <= maxYear; y++) years.push(y);

    const today = startOfDay(new Date());
    const selectedDay = selectedDate ? startOfDay(selectedDate) : undefined;

    const prevDisabled =
      !!minDate &&
      viewMonth.getTime() <= new Date(minDate.getFullYear(), minDate.getMonth(), 1).getTime();
    const nextDisabled =
      !!maxDate &&
      viewMonth.getTime() >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1).getTime();

    const calendar = (
      <div className="w-[280px] p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Month"
              value={viewMonth.getMonth()}
              onChange={(e) =>
                setViewMonth(new Date(viewMonth.getFullYear(), Number(e.target.value), 1))
              }
              className="cursor-pointer appearance-none rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              aria-label="Year"
              value={viewMonth.getFullYear()}
              onChange={(e) =>
                setViewMonth(new Date(Number(e.target.value), viewMonth.getMonth(), 1))
              }
              className="cursor-pointer appearance-none rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous month"
              disabled={prevDisabled}
              onClick={() =>
                setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
              }
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              disabled={nextDisabled}
              onClick={() =>
                setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
              }
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-1 grid grid-cols-7">
          {weekdays.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-normal text-zinc-400 dark:text-zinc-500"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-0.5">
          {gridCells.map((date) => {
            const isOutside = date.getMonth() !== viewMonth.getMonth();
            const isToday = isSameDay(date, today);
            const isSelected = selectedDay ? isSameDay(date, selectedDay) : false;
            const isDisabled = isDateDisabled(date);

            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={isDisabled}
                onClick={() => handleDayClick(date)}
                aria-pressed={isSelected}
                aria-disabled={isDisabled}
                className={cx(
                  "flex aspect-square w-full items-center justify-center rounded-full text-sm transition-colors",
                  isSelected
                    ? "bg-violet-600 font-semibold text-white"
                    : isDisabled
                      ? "cursor-not-allowed text-zinc-300 dark:text-zinc-700"
                      : cx(
                          isToday
                            ? "font-semibold text-violet-600 dark:text-violet-400"
                            : isOutside
                              ? "text-zinc-300 dark:text-zinc-700"
                              : "text-zinc-700 dark:text-zinc-300",
                          "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        ),
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );

    const timeList = (
      <div
        ref={timeListRef}
        className="w-[150px] max-h-[320px] overflow-y-auto border-l border-zinc-100 p-2 dark:border-zinc-800"
      >
        <div className="flex flex-col gap-0.5">
          {timeSlots.map((slot) => {
            const isSelected = slot.label === currentTimeLabel;
            const isPast = isSlotPast(slot);
            return (
              <button
                key={slot.label}
                type="button"
                disabled={isPast}
                onClick={() => handleTimeSelect(slot)}
                className={cx(
                  "w-full rounded-md px-2 py-1.5 text-center text-xs transition-colors",
                  isSelected
                    ? "bg-violet-600 font-medium text-white"
                    : isPast
                      ? "cursor-not-allowed text-zinc-300 dark:text-zinc-700"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                )}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      </div>
    );

    const timezoneSection = showTimezone ? (
      <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
        <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Timezone
        </label>
        <div className="relative">
          <select
            value={selectedTimezone}
            onChange={(e) => {
              setSelectedTimezone(e.target.value);
              onTimezoneChange?.(e.target.value);
            }}
            className="w-full cursor-pointer appearance-none rounded-md border border-zinc-200 bg-white py-1.5 pl-2 pr-7 text-xs text-zinc-700 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {Object.entries(TIMEZONE_GROUPS).map(([group, zones]) => (
              <optgroup key={group} label={group}>
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {getTimezoneLabel(z)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>
    ) : null;

    const panel = (
      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex">
          {calendar}
          {timeList}
        </div>
        {timezoneSection}
      </div>
    );

    const hiddenInput = name ? (
      <input
        type="hidden"
        ref={ref}
        name={name}
        value={selectedDate?.toISOString() ?? ""}
      />
    ) : null;

    const trigger = (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={cx(
          "flex w-full items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm transition-colors",
          "hover:border-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
          "disabled:pointer-events-none disabled:opacity-50",
          "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600",
        )}
      >
        <span className={cx("flex-1 truncate text-left", !selectedDate && "text-zinc-400")}>
          {selectedDate
            ? `${format(selectedDate, "PPP")}, ${currentTimeLabel}${
                showTimezone ? ` ${getTimezoneAbbr(selectedTimezone)}` : ""
              }`
            : placeholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 opacity-50" />
      </button>
    );

    return (
      <div ref={wrapperRef} className={cx("relative", className)}>
        {hiddenInput}
        {trigger}

        {isMobile ? (
          isOpen && (
            <>
              <div
                aria-hidden
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-40 bg-black/40"
              />
              <div
                role="dialog"
                aria-label="Pick date and time"
                className="fixed inset-x-3 bottom-3 z-50"
              >
                {panel}
              </div>
            </>
          )
        ) : (
          isOpen && (
            <div role="dialog" aria-label="Pick date and time" className="absolute left-0 top-full z-50 mt-2">
              {panel}
            </div>
          )
        )}
      </div>
    );
  },
);

EDatetimpicker.displayName = "EDatetimpicker";
