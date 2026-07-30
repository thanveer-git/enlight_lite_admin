"use client";

/**
 * HorizontalScrollContainer
 *
 * Wraps a horizontally scrollable region (typically a table) and
 * renders subtle fade overlays at the left and right edges. The fades
 * signal that more content exists beyond the visible area and disappear
 * automatically once the user scrolls to that edge.
 *
 * Pinned-column support:
 *   - When the children mark cells with `data-pinned="left"` or
 *     `data-pinned="right"`, the wrapper measures the cumulative width
 *     of each pinned group and insets the fades accordingly. That way
 *     the right fade hugs the **inner** edge of a right-pinned column
 *     (so it doesn't sit on top of the pinned cells), and the left
 *     fade hugs the right edge of a left-pinned group.
 *
 * Spec:
 *   - Inner fade overlay on each side, ~40 px wide.
 *   - Pointer-events disabled so the table underneath stays interactive.
 *   - Fades move with the container, not the page.
 *   - Hides when fully scrolled in that direction.
 *   - Light theme: fades from card surface → transparent (~85–90% opacity).
 *   - Dark theme: same gradient — the project's `card` token already
 *     binds to the dark surface in `.dark`, so dark mode picks up the
 *     right blend without a hex change.
 *   - Smooth opacity transition (200ms) when fading in/out.
 *   - The native horizontal scrollbar remains fully usable.
 */
import * as React from "react";

import { cn } from "@/lib/utils";

const FADE_WIDTH_CLASS = "w-10"; // ~40 px
const FADE_TRANSITION = "transition-opacity duration-200 ease-out";

export interface HorizontalScrollContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Extra classes for the inner scrollable element (default: overflow-x-auto). */
  scrollClassName?: string;
}

export const HorizontalScrollContainer = React.forwardRef<
  HTMLDivElement,
  HorizontalScrollContainerProps
>(function HorizontalScrollContainer(
  { children, className, scrollClassName, ...rest },
  ref,
) {
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const [showLeft, setShowLeft] = React.useState(false);
  const [showRight, setShowRight] = React.useState(false);
  const [pinnedRightWidth, setPinnedRightWidth] = React.useState(0);
  const [pinnedLeftWidth, setPinnedLeftWidth] = React.useState(0);

  /**
   * Walk the immediate subtree to find the actual horizontal scroller.
   * shadcn's `Table` component wraps the `<table>` in its own
   * `<div class="relative w-full overflow-auto">`, which becomes the
   * element that actually overflows when content exceeds the card.
   */
  const findScroller = React.useCallback((): HTMLElement | null => {
    const root = innerRef.current;
    if (!root) return null;
    const candidates: HTMLElement[] = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
    for (const el of candidates) {
      const cs = window.getComputedStyle(el);
      const overflowX =
        cs.overflowX === "auto" ||
        cs.overflowX === "scroll" ||
        cs.overflow === "auto" ||
        cs.overflow === "scroll";
      if (overflowX && el.scrollWidth - el.clientWidth > 0) return el;
    }
    return root;
  }, []);

  /**
   * Measure the cumulative widths of left-pinned and right-pinned
   * column groups using the `data-pinned` attribute. The right-pinned
   * group is read as the leftmost right-pinned cell's offsetLeft +
   * width minus the scroller's left edge; the left-pinned group is the
   * rightmost left-pinned cell's offsetLeft + width minus the scroller's
   * left edge. Reads as 0 when no cells are pinned.
   */
  const measurePinned = React.useCallback(() => {
    const root = innerRef.current;
    if (!root) {
      setPinnedLeftWidth(0);
      setPinnedRightWidth(0);
      return;
    }
    const scroller = findScroller() ?? root;
    const scrollerLeft = scroller.getBoundingClientRect().left;

    const rightPinned = Array.from(
      root.querySelectorAll<HTMLElement>('[data-pinned="right"]'),
    );
    let rightWidth = 0;
    if (rightPinned.length > 0) {
      // Rightmost pinned cell — its `right` from scroller's right edge
      // gives the cumulative width of all right-pinned columns.
      let rightEdge = -Infinity;
      for (const el of rightPinned) {
        const r = el.getBoundingClientRect();
        if (r.right > rightEdge) rightEdge = r.right;
      }
      rightWidth = Math.max(0, scroller.getBoundingClientRect().right - rightEdge);
    }
    setPinnedRightWidth(rightWidth);

    const leftPinned = Array.from(
      root.querySelectorAll<HTMLElement>('[data-pinned="left"]'),
    );
    let leftWidth = 0;
    if (leftPinned.length > 0) {
      // Leftmost pinned cell edge — measured from scroller's left edge.
      let leftEdge = Infinity;
      for (const el of leftPinned) {
        const r = el.getBoundingClientRect();
        if (r.left < leftEdge) leftEdge = r.left;
      }
      leftWidth = Math.max(0, leftEdge - scrollerLeft);
    }
    setPinnedLeftWidth(leftWidth);
  }, [findScroller]);

  const recompute = React.useCallback(() => {
    const root = innerRef.current;
    if (!root) return;
    const scroller = findScroller() ?? root;
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const left = scroller.scrollLeft;
    // Threshold of 1px to avoid sub-pixel jitter when fully at an edge.
    const hasOverflow = maxScroll > 1;
    setShowLeft(hasOverflow && left > 1);
    setShowRight(hasOverflow && left < maxScroll - 1);
    measurePinned();
  }, [findScroller, measurePinned]);

  React.useLayoutEffect(() => {
    const root = innerRef.current;
    if (!root) return;
    const initialScroller = findScroller() ?? root;
    recompute();

    let cleanupScroll: (() => void) | undefined;
    const attach = () => {
      const scroller = findScroller() ?? root;
      scroller.addEventListener("scroll", recompute, { passive: true });
      cleanupScroll = () => scroller.removeEventListener("scroll", recompute);
    };
    attach();

    const onResize = () => {
      // Scroller identity may change as content loads — reattach listener.
      cleanupScroll?.();
      attach();
      recompute();
    };
    window.addEventListener("resize", onResize);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(recompute) : null;
    if (ro) {
      ro.observe(root);
      // Re-measure when the scroller or any descendant changes size
      // (column resize, row hover, content swap, pinning changes).
      ro.observe(initialScroller);
    }

    return () => {
      cleanupScroll?.();
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
    };
  }, [recompute, findScroller]);

  // Combine forwarded ref + internal ref so callers can attach a ref too.
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );

  return (
    <div
      {...rest}
      className={cn("relative isolate", className)}
    >
      <div
        ref={setRefs}
        className={cn(
          "scroll-horizontal overflow-x-auto overflow-y-hidden",
          scrollClassName,
        )}
      >
        {children}
      </div>

      {/* Left fade — hugs the right edge of the left-pinned group. */}
      <div
        aria-hidden
        style={{ left: pinnedLeftWidth }}
        className={cn(
          "pointer-events-none absolute inset-y-0",
          FADE_WIDTH_CLASS,
          FADE_TRANSITION,
          "bg-gradient-to-r from-card/90 to-transparent",
          showLeft ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Right fade — hugs the inner edge of the right-pinned group. */}
      <div
        aria-hidden
        style={{ right: pinnedRightWidth }}
        className={cn(
          "pointer-events-none absolute inset-y-0",
          FADE_WIDTH_CLASS,
          FADE_TRANSITION,
          "bg-gradient-to-l from-card/90 to-transparent",
          showRight ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
});
