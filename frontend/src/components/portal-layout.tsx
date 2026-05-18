import { Link, useRouterState } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { Briefcase, Box, LogOut, type LucideIcon } from "lucide-react";
import { setSession, useSession } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export type NavItem = { to: string; label: string; icon: LucideIcon };

export function PortalLayout({
  items,
  accent,
  title,
  children,
}: {
  items: NavItem[];
  accent: "teal" | "navy";
  title: string;
  children: React.ReactNode;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const session = useSession();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <Link to="/" className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0F172A] shadow-elevated">
            <Box className="h-6 w-6 text-white stroke-[2.5] fill-none" />
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-tight">
              <span className="text-[#0F172A]">Talent</span><span className="text-teal">Hive</span>
            </div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{title}</div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const isPortalRoot = item.to === "/recruiter" || item.to === "/candidate";
            const active = isPortalRoot ? path === item.to || path === item.to + "/" : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? accent === "teal"
                      ? "bg-teal/10 text-teal font-medium"
                      : "bg-navy text-navy-foreground font-medium shadow-soft"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className={cn("grid h-9 w-9 place-items-center rounded-full font-display text-sm font-semibold",
              accent === "teal" ? "bg-teal/15 text-teal" : "bg-navy/10 text-navy")}>
              {session?.name.split(" ").map((n) => n[0]).join("").slice(0, 2) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{session?.name || "Guest"}</div>
              <div className="truncate text-xs text-muted-foreground">{session?.email || ""}</div>
            </div>
            <button
              onClick={() => { setSession(null); navigate({ to: "/" }); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
