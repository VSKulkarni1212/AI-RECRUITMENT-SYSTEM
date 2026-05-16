import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LayoutDashboard, Briefcase, FileText, Sparkles } from "lucide-react";
import { PortalLayout } from "@/components/portal-layout";
import { getSession } from "@/lib/auth-store";

export const Route = createFileRoute("/candidate")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const s = getSession();
    if (!s) throw redirect({ to: "/auth", search: { mode: "login", role: "candidate" } });
    if (s.role !== "candidate") throw redirect({ to: "/recruiter" });
  },
  component: CandidateLayout,
});

function CandidateLayout() {
  return (
    <PortalLayout
      accent="teal"
      title="Candidate"
      items={[
        { to: "/candidate", label: "All Jobs", icon: Briefcase },
        { to: "/candidate/recommended", label: "AI Matches", icon: Sparkles },
        { to: "/candidate/applications", label: "Applications", icon: FileText },
        { to: "/candidate/profile", label: "My Resume", icon: FileText },
      ]}
    >
      <Outlet />
    </PortalLayout>
  );
}
