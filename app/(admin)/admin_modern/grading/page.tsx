"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/composite/data-table/data-table";
import { FilterPopover } from "@/components/composite/filter-popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { queryKeys } from "@/lib/query-keys";
import { fetchGradeScales } from "@/features/rubrics/grade-scales";
import { getGradeScaleColumns } from "@/features/rubrics/grade-scale-columns";
import { GradeScaleKpiSummary } from "@/features/rubrics/grade-scale-kpi-summary";
import { GradeScalePreviewDialog } from "@/features/rubrics/grade-scale-preview-dialog";
import type {
  GradeScale,
  GradeScaleStatus,
  GradeScaleType,
} from "@/features/rubrics/constants";
import { ROUTES } from "@/constants/routes";
import { ListingPage } from "@/templates/listing-page";

const GRADE_TYPE_FILTERS: { value: GradeScaleType; label: string; tone: string }[] = [
  { value: "percentage", label: "Percentage", tone: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200" },
  { value: "cgpa", label: "CGPA", tone: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200" },
  { value: "marks", label: "Marks", tone: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200" },
  { value: "comp_incomp", label: "Comp/Incomp", tone: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200" },
  { value: "letter_grading", label: "Letter", tone: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200" },
];

const GRADE_STATUS_FILTERS: { value: GradeScaleStatus; label: string; tone: string }[] = [
  { value: "draft", label: "Draft", tone: "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200" },
  { value: "published", label: "Published", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" },
];

type PassFailFilter = "enabled" | "disabled";

const PASS_FAIL_FILTERS: { value: PassFailFilter; label: string; tone: string }[] = [
  { value: "enabled", label: "Enabled", tone: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200" },
  { value: "disabled", label: "Disabled", tone: "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200" },
];

export default function GradingPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [types, setTypes] = useState<GradeScaleType[]>([]);
  const [statuses, setStatuses] = useState<GradeScaleStatus[]>([]);
  const [passFail, setPassFail] = useState<PassFailFilter[]>([]);
  const [previewing, setPreviewing] = useState<GradeScale | null>(null);

  const debounced = useDebounce(search, 250);

  const q = useQuery({
    queryKey: queryKeys.gradeScales.list(),
    queryFn: fetchGradeScales,
  });

  const allScales = q.data ?? [];

  const filtered = useMemo(() => {
    const q_ = debounced.trim().toLowerCase();
    return allScales.filter((s) => {
      if (types.length && (!s.meta || !types.includes(s.meta.gradeType))) {
        return false;
      }
      if (statuses.length && (!s.meta || !statuses.includes(s.meta.status))) {
        return false;
      }
      if (passFail.length) {
        const isLetter = s.meta?.gradeType === "letter_grading";
        const matches = passFail.some((v) =>
          v === "enabled" ? isLetter : !isLetter,
        );
        if (!matches) return false;
      }
      if (q_ && !s.name.toLowerCase().includes(q_)) return false;
      return true;
    });
  }, [allScales, debounced, types, statuses, passFail]);

  const typeCounts = useMemo(() => {
    const counts: Record<GradeScaleType, number> = {
      percentage: 0,
      cgpa: 0,
      marks: 0,
      comp_incomp: 0,
      letter_grading: 0,
    };
    for (const s of allScales) {
      if (s.meta) counts[s.meta.gradeType] += 1;
    }
    return counts;
  }, [allScales]);

  const statusCounts = useMemo(() => {
    const counts: Record<GradeScaleStatus, number> = {
      draft: 0,
      published: 0,
      in_use: 0,
      archived: 0,
    };
    for (const s of allScales) {
      if (s.meta) counts[s.meta.status] += 1;
    }
    return counts;
  }, [allScales]);

  const passFailCounts = useMemo(() => {
    const counts: Record<PassFailFilter, number> = {
      enabled: 0,
      disabled: 0,
    };
    for (const s of allScales) {
      const isLetter = s.meta?.gradeType === "letter_grading";
      counts[isLetter ? "enabled" : "disabled"] += 1;
    }
    return counts;
  }, [allScales]);


  const letterGradeCount = typeCounts.letter_grading;

  const columns = useMemo(
    () =>
      getGradeScaleColumns({
        onViewDetails: (s) => setPreviewing(s),
        onWhereUsed: (s) =>
          toast.info("Where used lookup", { description: s.name }),
      }),
    [],
  );

  const kpiNode = useMemo(
    () => (
      <GradeScaleKpiSummary
        total={allScales.length}
        letterGradeCount={letterGradeCount}
        statusCounts={statusCounts}
      />
    ),
    [allScales.length, letterGradeCount, statusCounts],
  );

  const toolbarNode = useMemo(
    () => (
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search grade scales…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-xl border-border/70 bg-background pl-9 shadow-sm transition-colors duration-150 focus-visible:ring-1"
        />
      </div>
    ),
    [search],
  );

  const toolbarFilters = useMemo(
    () => (
      <>
        <FilterPopover
          label="Type"
          options={GRADE_TYPE_FILTERS.map((o) => ({
            value: o.value,
            label: o.label,
            count: typeCounts[o.value] ?? 0,
            tone: o.tone,
          }))}
          selected={types}
          onChange={(next) => setTypes(next as GradeScaleType[])}
        />
        <FilterPopover
          label="Status"
          options={GRADE_STATUS_FILTERS.map((o) => ({
            value: o.value,
            label: o.label,
            count: allScales.filter((s) => s.meta?.status === o.value).length,
            tone: o.tone,
          }))}
          selected={statuses}
          onChange={(next) => setStatuses(next as GradeScaleStatus[])}
        />
        <FilterPopover
          label="Pass/Fail"
          options={PASS_FAIL_FILTERS.map((o) => ({
            value: o.value,
            label: o.label,
            count: passFailCounts[o.value] ?? 0,
            tone: o.tone,
          }))}
          selected={passFail}
          onChange={(next) => setPassFail(next as PassFailFilter[])}
        />
      </>
    ),
    [types, statuses, passFail, typeCounts, passFailCounts, allScales],
  );

  return (
    <ListingPage
      breadcrumbs={[]}
      title="All Grade Scales"
      description="Built-in grading formats and admin-managed letter scales."
      actions={
        <Button asChild size="sm">
          <Link href={ROUTES.admin.grading.form(0)}>
            <Plus className="mr-1.5 size-4" />
            New Grade Scale
          </Link>
        </Button>
      }
      kpis={kpiNode}
      toolbar={toolbarNode}
      toolbarFilters={toolbarFilters}
    >
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={q.isLoading}
        isError={q.isError}
        onRetry={() => q.refetch()}
        emptyTitle="No grade scales match"
        emptyDescription="Try adjusting your search or filters."
        enableSelection
        showView={false}
        tableId="grade-scales"
      />
      <GradeScalePreviewDialog
        scale={previewing}
        onOpenChange={(open) => {
          if (!open) setPreviewing(null);
        }}
        onEdit={(s) => {
          setPreviewing(null);
          router.push(ROUTES.admin.grading.form(s.id));
        }}
      />
    </ListingPage>
  );
}