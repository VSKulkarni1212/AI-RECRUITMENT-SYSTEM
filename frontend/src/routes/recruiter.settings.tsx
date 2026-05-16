import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/recruiter/settings")({
  component: () => (
    <div className="mx-auto max-w-3xl p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-navy/10 text-navy">
        <Settings className="h-5 w-5" />
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold">Settings</h1>
      <p className="mt-2 text-muted-foreground">Team, billing & integrations live here.</p>
    </div>
  ),
});
