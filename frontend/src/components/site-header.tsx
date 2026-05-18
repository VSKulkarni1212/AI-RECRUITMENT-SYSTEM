import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Box, LogOut } from "lucide-react";
import { useSession, setSession } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function SiteHeader() {
  const session = useSession();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Hide on portal pages (they have their own sidebar)
  if (path.startsWith("/candidate") || path.startsWith("/recruiter")) return null;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0F172A] shadow-elevated group-hover:shadow-glow transition-shadow">
            <Box className="h-6 w-6 text-white stroke-[2.5] fill-none" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">
            <span className="text-[#0F172A]">Talent</span><span className="text-teal">Hive</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="/#candidates" className="text-sm text-muted-foreground hover:text-foreground transition">For Candidates</a>
          <a href="/#recruiters" className="text-sm text-muted-foreground hover:text-foreground transition">For Recruiters</a>
          <a href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition">How it works</a>
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">Hi, {session.name.split(" ")[0]}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: session.role === "candidate" ? "/candidate" : "/recruiter" })}
              >
                Open dashboard
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setSession(null); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/auth", search: { mode: "login" } })}>
                Sign in
              </Button>
              <Button size="sm" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })} className="bg-gradient-navy text-primary-foreground hover:opacity-90">
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
