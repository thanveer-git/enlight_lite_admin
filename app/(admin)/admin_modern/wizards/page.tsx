"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WizardPage, type WizardStep } from "@/templates/wizard-page";

const STEPS: WizardStep[] = [
  { id: "basics", title: "Basics", description: "Name & description" },
  { id: "audience", title: "Audience", description: "Who can enroll" },
  { id: "review", title: "Review", description: "Confirm and create" },
];

export default function WizardsDemo() {
  const [stepId, setStepId] = useState<string>("basics");
  const idx = STEPS.findIndex((s) => s.id === stepId);
  const isLast = idx === STEPS.length - 1;
  const isFirst = idx === 0;

  return (
    <WizardPage
      breadcrumbs={[
        { label: "Admin Modern", href: "/admin_modern" },
        { label: "Wizards" },
      ]}
      title="New course wizard"
      description="Wizard page demo — multi-step flow with persisted step indicator."
      steps={STEPS}
      currentStep={stepId}
      content={
        <div className="space-y-4">
          {stepId === "basics" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="w-title">Course title</Label>
                <Input id="w-title" placeholder="e.g. Linear Algebra 101" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="w-desc">Description</Label>
                <Textarea id="w-desc" rows={4} placeholder="What's this course about?" />
              </div>
            </>
          )}
          {stepId === "audience" && (
            <div className="space-y-3">
              <p className="text-sm">
                Anyone in the workspace can enroll by default. Tighten access if needed.
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Workspace members — open enrollment</li>
                <li>• Specific groups — invite only</li>
                <li>• Email list — one-time enrollment link</li>
              </ul>
            </div>
          )}
          {stepId === "review" && (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Review and confirm. You can change anything after creation.
              </p>
              <div className="rounded-md border bg-muted/40 p-3">
                <p className="font-medium">Linear Algebra 101</p>
                <p className="text-muted-foreground text-xs">Workspace members — open enrollment</p>
              </div>
            </div>
          )}
        </div>
      }
      actions={
        <>
          <Button
            variant="ghost"
            disabled={isFirst}
            onClick={() => setStepId(STEPS[idx - 1]!.id)}
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Back
          </Button>
          {isLast ? (
            <Button
              onClick={() => {
                toast.success("Course created", { description: "(demo toast)" });
                setStepId(STEPS[0]!.id);
              }}
            >
              <Check className="mr-1.5 size-4" />
              Confirm
            </Button>
          ) : (
            <Button onClick={() => setStepId(STEPS[idx + 1]!.id)}>
              Next
              <ArrowRight className="ml-1.5 size-4" />
            </Button>
          )}
        </>
      }
    />
  );
}
