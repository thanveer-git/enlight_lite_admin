import type { ReactNode } from "react";

import { AppLayout } from "@/components/composite/app-layout/app-layout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
