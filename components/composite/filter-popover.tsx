"use client";

import { useState } from "react";
import { Plus, Search, X } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  /** Optional class string applied to the swatch — same shape as the row chip. */
  tone?: string;
}

interface FilterPopoverProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  className?: string;
}

const MAX_INLINE = 2;

export function FilterPopover({
  label,
  options,
  selected,
  onChange,
  className,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selectedSet = new Set(selected);
  const selectedOptions = options.filter((o) => selectedSet.has(o.value));
  const inline = selectedOptions.slice(0, MAX_INLINE);

  function toggle(value: string) {
    const next = new Set(selectedSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(Array.from(next));
  }

  function clear() {
    onChange([]);
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            "flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-border/70 bg-background px-3 text-sm shadow-sm transition-all duration-150 hover:border-border hover:bg-accent/40",
            className,
          )}
        >
          <Plus className="size-3.5 text-muted-foreground" />
          <span className="font-medium">{label}</span>
          {selectedOptions.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              {selectedOptions.length > MAX_INLINE ? (
                <span className="inline-flex h-6 items-center rounded-md border bg-background px-1.5 text-xs text-muted-foreground">
                  {selectedOptions.length} selected
                </span>
              ) : (
                inline.map((opt) => (
                  <span
                    key={opt.value}
                    className={cn(
                      "inline-flex h-6 items-center gap-1 rounded-full px-1.5 text-xs",
                      opt.tone ?? "border bg-background text-foreground",
                    )}
                  >
                    {opt.label}
                    <button
                      type="button"
                      aria-label={`Remove ${opt.label}`}
                      onClick={(e) => { e.stopPropagation(); toggle(opt.value); }}
                      className="text-foreground/60 hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))
              )}
            </>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 overflow-hidden rounded-xl p-0">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={label}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              No matches
            </p>
          ) : (
            filtered.map((opt) => {
              const checked = selectedSet.has(opt.value);
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(opt.value)}
                  />
                  {opt.tone ? (
                    <span
                      className={cn(
                        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium",
                        opt.tone,
                      )}
                    >
                      {opt.label}
                    </span>
                  ) : (
                    <span className="flex-1 text-left">{opt.label}</span>
                  )}
                  {typeof opt.count === "number" && (
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {selected.length > 0 && (
          <>
            <Separator />
            <button
              type="button"
              onClick={clear}
              className="w-full py-2.5 text-sm font-medium hover:bg-accent"
            >
              Clear filters
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
