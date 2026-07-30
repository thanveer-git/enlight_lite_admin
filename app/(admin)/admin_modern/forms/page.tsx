"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { FormSection } from "@/components/composite/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FormPage } from "@/templates/form-page";

export default function FormsDemo() {
  const [notify, setNotify] = useState(true);

  return (
    <FormPage
      breadcrumbs={[
        { label: "Admin Modern", href: "/admin_modern" },
        { label: "Forms" },
      ]}
      title="Create course"
      description="Form page demo — FormSection composites with primitive inputs."
      actions={
        <>
          <Button variant="ghost">Cancel</Button>
          <Button onClick={() => toast.success("Course saved", { description: "(demo toast)" })}>
            <Save className="mr-1.5 size-4" />
            Save
          </Button>
        </>
      }
    >
      <FormSection
        title="Basics"
        description="Course title and short summary shown in the catalog."
      >
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="e.g. Introduction to Algebra" defaultValue="" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            placeholder="One or two sentences describing the course."
            rows={3}
          />
        </div>
      </FormSection>

      <FormSection
        title="Visibility"
        description="Who can see and enroll in this course."
      >
        <RadioGroup defaultValue="public">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public" id="public" />
            <Label htmlFor="public" className="font-normal">
              Public — anyone in the workspace
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="private" id="private" />
            <Label htmlFor="private" className="font-normal">
              Private — invite only
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="draft" id="draft" />
            <Label htmlFor="draft" className="font-normal">
              Draft — only editors
            </Label>
          </div>
        </RadioGroup>

        <div className="flex items-center justify-between rounded-md border bg-card p-3">
          <div className="space-y-0.5">
            <Label htmlFor="notify" className="font-normal">
              Notify enrolled users
            </Label>
            <p className="text-xs text-muted-foreground">
              Send an email when this course goes live.
            </p>
          </div>
          <Switch id="notify" checked={notify} onCheckedChange={setNotify} />
        </div>
      </FormSection>

      <FormSection
        title="Schedule"
        description="When does the course open and close?"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="opens">Opens</Label>
            <Input id="opens" type="date" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="closes">Closes</Label>
            <Input id="closes" type="date" />
          </div>
        </div>
      </FormSection>
    </FormPage>
  );
}
