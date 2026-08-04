"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  /** Single value or single-element array. Two-thumb ranges are not supported. */
  value?: number | number[]
  onValueChange?: (values: number[]) => void
  /** Fires once when the user releases the thumb (pointerup / keyup). */
  onValueCommit?: (values: number[]) => void
  trackClassName?: string
  fillClassName?: string
  /**
   * Optional list of valid zones, in the slider's own `min`/`max` units.
   * Rendered as overlays on the track so users can see where the thumb
   * is allowed to rest. The thumb is still mechanically draggable
   * through gaps — `onValueCommit` (in the caller) is responsible for
   * snapping to a valid zone.
   */
  validZones?: { min: number; max: number }[]
  zoneClassName?: string
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      trackClassName,
      fillClassName,
      validZones,
      zoneClassName,
      value,
      onValueChange,
      onValueCommit,
      min = 0,
      max = 100,
      step = 1,
      disabled,
      onPointerUp,
      onKeyUp,
      ...props
    },
    ref,
  ) => {
    const numeric = Array.isArray(value) ? (value[0] ?? Number(min)) : (value ?? Number(min))
    const minVal = Number(min)
    const maxVal = Number(max)
    const span = maxVal - minVal || 1
    const fillPct = Math.max(0, Math.min(100, ((numeric - minVal) / span) * 100))
    const zoneStyle = (zone: { min: number; max: number }): React.CSSProperties => {
      const left = Math.max(0, ((zone.min - minVal) / span) * 100)
      const right = Math.max(0, ((maxVal - zone.max) / span) * 100)
      // Single-point zones (min === max) collapse to 0 width; give them
      // a minimum visible footprint so the user can see where the level
      // sits. Centered on the value's percentage.
      if (Math.abs(zone.max - zone.min) < 1e-9) {
        const center = left
        const half = 1.5
        return {
          left: `max(0px, calc(${center}% - ${half}%))`,
          right: `max(0px, calc(${100 - center}% - ${half}%))`,
        }
      }
      return { left: `${left}%`, right: `${right}%` }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.valueAsNumber
      onValueChange?.([Number.isFinite(next) ? next : minVal])
    }

    const handlePointerUp = (e: React.PointerEvent<HTMLInputElement>) => {
      onPointerUp?.(e)
      if (disabled) return
      const next = Number(e.currentTarget.value)
      onValueCommit?.([Number.isFinite(next) ? next : minVal])
    }

    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyUp?.(e)
      if (disabled) return
      const next = Number(e.currentTarget.value)
      onValueCommit?.([Number.isFinite(next) ? next : minVal])
    }

    return (
      <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted",
            trackClassName,
          )}
        />
        {validZones?.map((zone, i) => (
          <div
            key={i}
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full",
              zoneClassName,
            )}
            style={zoneStyle(zone)}
          />
        ))}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary",
            fillClassName,
          )}
          style={{ width: `${fillPct}%` }}
        />
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={numeric}
          disabled={disabled}
          onChange={handleChange}
          onPointerUp={handlePointerUp}
          onKeyUp={handleKeyUp}
          className={cn(
            "slider-native relative z-10 h-5 w-full bg-transparent",
            disabled && "cursor-not-allowed opacity-50",
          )}
          {...props}
        />
      </div>
    )
  },
)
Slider.displayName = "Slider"
