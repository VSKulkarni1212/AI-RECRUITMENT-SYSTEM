import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Briefcase, Database, Settings, LayoutDashboard } from "lucide-react";
import { PortalLayout } from "@/components/portal-layout";
import { getSession } from "@/lib/auth-store";

export const Route = createFileRoute("/recruiter")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const s = getSession();
    if (!s) throw redirect({ to: "/auth", search: { mode: "login", role: "recruiter" } });
    if (s.role !== "recruiter") throw redirect({ to: "/candidate" });
  },
  component: RecruiterLayout,
});

function RecruiterLayout() {
  return (
    <PortalLayout
      accent="navy"
      title="Recruiter"
      items={[
        { to: "/recruiter", label: "Active Jobs", icon: Briefcase },
        { to: "/recruiter/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ]}
    >
      <Outlet />
    </PortalLayout>
  );
}
