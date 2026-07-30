"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

export interface SliderSegment {
  /** Position 0..1 representing the share of the slider's [min,max] range. */
  from: number
  /** Position 0..1 representing the share of the slider's [min,max] range. */
  to: number
  /** CSS color (any value accepted by `background-color`). */
  color: string
  /** Optional accessible label, used for tooltips / aria-label on the segment. */
  label?: string
}

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /**
   * Optional color segments to render along the track.
   * Each segment is clamped to [0,1] and rendered as a tinted bar.
   */
  segments?: SliderSegment[]
  /** Render faint boundary pins between segments. */
  segmentPins?: boolean
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, segments, segmentPins, min = 0, max = 100, value, ...props }, ref) => {
  const minVal = Number(min)
  const maxVal = Number(max)
  const span = maxVal - minVal || 1

  const normalized = (segments ?? [])
    .map((seg) => {
      const start = Math.max(0, Math.min(1, (seg.from - minVal) / span))
      const end = Math.max(0, Math.min(1, (seg.to - minVal) / span))
      const left = Math.min(start, end)
      const right = Math.max(start, end)
      if (right <= left) return null
      return { left, right, color: seg.color, label: seg.label }
    })
    .filter((s): s is { left: number; right: number; color: string; label: string | undefined } => s != null)

  // Boundary positions between adjacent segments.
  const pins: number[] = []
  if (segmentPins && normalized.length > 1) {
    for (let i = 1; i < normalized.length; i++) {
      pins.push(normalized[i]!.left)
    }
  }

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={value}
      min={min}
      max={max}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
        {normalized.length > 0 ? (
          <div className="absolute inset-0 flex" aria-hidden>
            {normalized.map((seg, idx) => (
              <div
                key={idx}
                className="h-full"
                style={{
                  width: `${(seg.right - seg.left) * 100}%`,
                  backgroundColor: seg.color,
                }}
                title={seg.label}
              />
            ))}
          </div>
        ) : null}
        <SliderPrimitive.Range className="absolute h-full bg-transparent" />
      </SliderPrimitive.Track>
      {pins.map((pos, idx) => (
        <span
          key={`pin-${idx}`}
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-3 w-px -translate-y-1/2 bg-foreground/30"
          style={{ left: `${pos * 100}%` }}
        />
      ))}
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/60 bg-background shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
