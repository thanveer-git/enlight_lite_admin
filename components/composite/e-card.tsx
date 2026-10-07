"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * ECard — layout primitive.
 *
 * Slot-based: the component owns the outer container (border, radius,
 * background, shadow) and the section dividers. Each section is a
 * generic container that accepts arbitrary children. Nothing about
 * titles, icons, badges, tabs, filters, or actions is assumed here.
 *
 * Variants:
 *  - "standard" — Header sits inside the padded region with a divider.
 *  - "tabs"     — Header spans edge-to-edge (no horizontal padding, no
 *                 top/bottom padding) so tab strips / nav can hug the
 *                 card border. A divider still separates it from Body.
 *
 * Usage:
 *   <ECard>
 *     <ECard.Header>...</ECard.Header>
 *     <ECard.Body>...</ECard.Body>
 *     <ECard.Footer>...</ECard.Footer>
 *   </ECard>
 */
type ECardVariant = "standard" | "tabs";

interface ECardContextValue {
  variant: ECardVariant;
}

const ECardContext = React.createContext<ECardContextValue | null>(null);

function useECardContext(component: string): ECardContextValue {
  const ctx = React.useContext(ECardContext);
  if (!ctx) {
    throw new Error(`${component} must be rendered inside <ECard>.`);
  }
  return ctx;
}

interface ECardRootProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ECardVariant;
}

const ECardRoot = React.forwardRef<HTMLDivElement, ECardRootProps>(
  ({ className, variant = "standard", children, ...props }, ref) => {
    const value = React.useMemo<ECardContextValue>(
      () => ({ variant }),
      [variant],
    );

    return (
      <ECardContext.Provider value={value}>
        <div
          ref={ref}
          data-slot="e-card"
          data-variant={variant}
          className={cn(
            "flex flex-col rounded-xl border bg-card text-card-foreground shadow",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </ECardContext.Provider>
    );
  },
);
ECardRoot.displayName = "ECard";

type ECardSectionProps = React.HTMLAttributes<HTMLDivElement>;

const ECardHeader = React.forwardRef<HTMLDivElement, ECardSectionProps>(
  ({ className, ...props }, ref) => {
    const { variant } = useECardContext("ECard.Header");

    return (
      <div
        ref={ref}
        data-slot="e-card-header"
        className={cn(
          "border-b",
          // Standard: padded slot for any header content.
          // Tabs:     edge-to-edge so tab strips / nav align to the card
          //           borders and the active indicator can meet them.
          variant === "standard" ? "p-6" : "px-2",
          className,
        )}
        {...props}
      />
    );
  },
);
ECardHeader.displayName = "ECard.Header";

const ECardBody = React.forwardRef<HTMLDivElement, ECardSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="e-card-body"
      className={cn("flex-1 p-6", className)}
      {...props}
    />
  ),
);
ECardBody.displayName = "ECard.Body";

const ECardFooter = React.forwardRef<HTMLDivElement, ECardSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="e-card-footer"
      className={cn("border-t p-6", className)}
      {...props}
    />
  ),
);
ECardFooter.displayName = "ECard.Footer";

/**
 * Compose the public component. Using `Object.assign` keeps the call
 * site ergonomic (`<ECard.Header>`) while every section still has its
 * own forwardRef + displayName for tooling.
 */
export const ECard = Object.assign(ECardRoot, {
  Header: ECardHeader,
  Body: ECardBody,
  Footer: ECardFooter,
});

export type { ECardVariant };
