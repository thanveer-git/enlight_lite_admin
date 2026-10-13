"use client";

import { useState } from "react";
import { Bell, Lock, Palette, User } from "lucide-react";
import { toast } from "sonner";

import { FormSection } from "@/components/composite/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsPage, type SettingsNavItem } from "@/templates/settings-page";

const NAV: SettingsNavItem[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
];

export default function SettingsDemo() {
  const [current, setCurrent] = useState("profile");
  const [compact, setCompact] = useState(false);
  const [emails, setEmails] = useState(true);

  return (
    <SettingsPage
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Settings" },
      ]}
      nav={NAV}
      current={current}
      onSelect={setCurrent}
      content={
        <>
          {current === "profile" && (
            <FormSection
              title="Profile"
              description="Your public information."
              footer={
                <div className="flex justify-end">
                  <Button onClick={() => toast.success("Profile saved")}>Save</Button>
                </div>
              }
            >
              <div className="grid gap-2">
                <Label htmlFor="s-name">Display name</Label>
                <Input id="s-name" defaultValue="Aarav Sharma" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="s-email">Email</Label>
                <Input id="s-email" type="email" defaultValue="aarav.sharma@example.com" />
              </div>
            </FormSection>
          )}
          {current === "appearance" && (
            <FormSection
              title="Appearance"
              description="How the workspace looks."
              footer={
                <div className="flex justify-end">
                  <Button onClick={() => toast.success("Appearance saved")}>Save</Button>
                </div>
              }
            >
              <div className="flex items-center justify-between rounded-md border bg-card p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="compact" className="font-normal">
                    Compact density
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Reduce row padding and font size across tables.
                  </p>
                </div>
                <Switch id="compact" checked={compact} onCheckedChange={setCompact} />
              </div>
            </FormSection>
          )}
          {current === "notifications" && (
            <FormSection
              title="Notifications"
              description="What we email you about."
              footer={
                <div className="flex justify-end">
                  <Button onClick={() => toast.success("Notification settings saved")}>Save</Button>
                </div>
              }
            >
              <div className="flex items-center justify-between rounded-md border bg-card p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="emails" className="font-normal">
                    Email digest
                  </Label>
                  <p className="text-xs text-muted-foreground">Weekly summary of activity.</p>
                </div>
                <Switch id="emails" checked={emails} onCheckedChange={setEmails} />
              </div>
            </FormSection>
          )}
          {current === "security" && (
            <FormSection title="Security" description="Account security settings.">
              <p className="text-muted-foreground text-sm">
                Two-factor authentication and session management would live here.
              </p>
            </FormSection>
          )}
        </>
      }
    />
  );
}
