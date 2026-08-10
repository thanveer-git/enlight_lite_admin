"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface BaseProps {
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  triggerId?: string;
}

type SingleProps = BaseProps & {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
};

type MultiProps = BaseProps & {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

export type SearchableSelectProps = SingleProps | MultiProps;

function summarizeSelection(
  options: SearchableSelectOption[],
  selected: string[],
): string {
  if (selected.length === 0) return "";
  const labels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]}, ${labels[1]}`;
  return `${labels[0]}, ${labels[1]} +${labels.length - 2} more`;
}

export function SearchableSelect(props: SearchableSelectProps) {
  const {
    options,
    placeholder = "Select…",
    searchPlaceholder = "Search…",
    emptyMessage = "No results found.",
    disabled,
    className,
    triggerId,
  } = props;
  const multiple = props.multiple === true;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const triggerLabel = (() => {
    if (multiple) {
      if (props.value.length === 0) return null;
      return summarizeSelection(options, props.value);
    }
    return options.find((o) => o.value === props.value)?.label ?? null;
  })();

  const isSelected = (v: string) =>
    multiple ? props.value.includes(v) : props.value === v;

  const toggle = (v: string) => {
    if (multiple) {
      const set = new Set(props.value);
      if (set.has(v)) set.delete(v);
      else set.add(v);
      props.onChange(Array.from(set));
    } else {
      props.onChange(v);
      setOpen(false);
    }
  };

  const allFilteredSelected =
    multiple && filtered.length > 0 && filtered.every((o) => props.value.includes(o.value));

  const toggleAll = () => {
    if (!multiple) return;
    if (allFilteredSelected) {
      const set = new Set(props.value);
      filtered.forEach((o) => set.delete(o.value));
      props.onChange(Array.from(set));
    } else {
      const set = new Set(props.value);
      filtered.forEach((o) => set.add(o.value));
      props.onChange(Array.from(set));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={triggerId}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className={cn("line-clamp-1", !triggerLabel && "text-muted-foreground")}>
            {triggerLabel ?? placeholder}
          </span>
          <span className="flex shrink-0 items-center">
            <ChevronDown className="h-4 w-4 opacity-50" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-7 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="shrink-0 opacity-50 hover:opacity-100"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto p-1" role="listbox" aria-multiselectable={multiple}>
          {filtered.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filtered.map((opt) => {
              const selected = isSelected(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                    selected && "bg-accent/50",
                  )}
                >
                  {multiple && (
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggle(opt.value)}
                      tabIndex={-1}
                      aria-hidden
                      className="pointer-events-none"
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{opt.label}</span>
                    {opt.description && (
                      <span className="truncate text-xs text-muted-foreground">
                        {opt.description}
                      </span>
                    )}
                  </div>
                  {!multiple && selected && <Check className="h-4 w-4 shrink-0 opacity-70" />}
                </button>
              );
            })
          )}
        </div>
        {multiple && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t px-2 py-1.5 text-xs">
            <button
              type="button"
              onClick={toggleAll}
              className="font-medium text-primary hover:underline"
            >
              {allFilteredSelected ? "Clear" : "Select all"}
            </button>
            <span className="text-muted-foreground">
              {multiple && `${props.value.length} selected`}
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}