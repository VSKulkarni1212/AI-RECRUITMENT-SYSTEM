import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TrendingUp, Eye, Briefcase, Sparkles, ArrowRight } from "lucide-react";
import { MatchRing } from "@/components/match-ring";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth-store";

export const Route = createFileRoute("/candidate/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const session = useSession();
  const [stats, setStats] = useState([
    { label: "Profile views", value: 142, change: "+24%", icon: Eye },
    { label: "Applications", value: 0, change: "+0 this week", icon: Briefcase },
    { label: "Avg. match score", value: "82%", change: "↑ 6 pts", icon: TrendingUp },
  ]);
  const [topPicks, setTopPicks] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session?.email) return;

      // 1. Fetch Candidate ID and Skills
      const { data: candidateData } = await supabase
        .from("candidates")
        .select("id, skills")
        .ilike("email", session.email)
        .single();
      
      if (candidateData) {
        // 2. Fetch Application Count for THIS candidate
        const { count: appsCount } = await supabase
          .from("applications")
          .select("*", { count: 'exact', head: true })
          .eq("candidate_id", candidateData.id);
        
        setStats(prev => prev.map(s => s.label === "Applications" ? { ...s, value: appsCount || 0 } : s));

        // 3. Fetch Job Matches (Simplified: just fetch latest jobs for now)
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("*")
          .limit(3);
        
        if (jobsData) {
          setTopPicks(jobsData.map(j => ({
            id: j.id,
            title: j.job_title,
            company: j.company,
            location: j.location,
            matchScore: Math.round(70 + Math.random() * 25) // Mock score until SNN integration is ready for dashboard
          })));
        }
      }
    }
    fetchDashboardData();
  }, [session]);

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Your hiring activity at a glance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-teal" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold tracking-tight">{s.value}</div>
            <div className="mt-1 text-xs text-success">{s.change}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-teal" /> Top picks today
          </div>
          <Link to="/candidate" className="flex items-center gap-1 text-sm text-teal hover:underline">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {topPicks.map((j) => (
            <div key={j.id} className="flex items-center gap-4 rounded-lg border border-border bg-background p-3">
              <MatchRing value={j.matchScore ?? 75} size={44} />
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{j.title}</div>
                <div className="truncate text-xs text-muted-foreground">{j.company} · {j.location}</div>
              </div>
              <span className="hidden text-xs text-muted-foreground sm:inline">Competitive</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
