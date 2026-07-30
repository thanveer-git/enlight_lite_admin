"use client";

import { createContext, useMemo, type ReactNode } from "react";

import type { Session, User } from "@/types/session";

import { FAKE_CURRENT_USER } from "@/services/handlers/users";

export interface SessionContextValue {
  session: Session;
  user: User;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const value = useMemo<SessionContextValue>(
    () => ({
      session: {
        user: FAKE_CURRENT_USER,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      },
      user: FAKE_CURRENT_USER,
    }),
    [],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
