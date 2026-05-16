import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Briefcase, Users, TrendingUp, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth-store";

export const Route = createFileRoute("/recruiter/dashboard")({
  component: RecruiterDashboard,
});

function RecruiterDashboard() {
  const session = useSession();
  const [stats, setStats] = useState([
    { label: "Open roles", value: 0, icon: Briefcase },
    { label: "Total applicants", value: 0, icon: Users },
    { label: "Avg. time-to-rank", value: "1.2s", icon: Clock },
    { label: "Hires this Q", value: 7, icon: TrendingUp },
  ]);
  const [activities, setActivities] = useState<string[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session?.email) return;

      // 1. Get recruiter ID
      const { data: recData } = await supabase
        .from("recruiters")
        .select("id")
        .ilike("email", session.email)
        .maybeSingle();
      
      if (!recData) return;
      const recruiterId = recData.id;

      // 2. Fetch Filtered Stats
      const { count: rolesCount } = await supabase
        .from("jobs")
        .select("*", { count: 'exact', head: true })
        .eq("recruiter_id", recruiterId);

      const { data: myJobs } = await supabase
        .from("jobs")
        .select("id")
        .eq("recruiter_id", recruiterId);
      
      const myJobIds = (myJobs || []).map(j => j.id);
      
      let appsCount = 0;
      if (myJobIds.length > 0) {
        const { count } = await supabase
          .from("applications")
          .select("*", { count: 'exact', head: true })
          .in("job_id", myJobIds);
        appsCount = count || 0;
      }
      
      setStats([
        { label: "Open roles", value: rolesCount || 0, icon: Briefcase },
        { label: "Total applicants", value: appsCount, icon: Users },
        { label: "Avg. time-to-rank", value: "1.2s", icon: Clock },
        { label: "Hires this Q", value: 7, icon: TrendingUp },
      ]);

      // 3. Fetch recent activity for THIS recruiter
      if (myJobIds.length > 0) {
        const { data: recentApps } = await supabase
          .from("applications")
          .select("id, applied_at, jobs(job_title), candidates(full_name)")
          .in("job_id", myJobIds)
          .order("applied_at", { ascending: false })
          .limit(4);
        
        if (recentApps) {
          setActivities(recentApps.map((a: any) => 
            `${a.candidates?.full_name || 'A candidate'} applied to ${a.jobs?.job_title || 'a job'} · ${new Date(a.applied_at).toLocaleDateString()}`
          ));
        }
      }
    }
    fetchDashboardData();

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.email]);

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Hiring overview</h1>
      <p className="mt-1 text-muted-foreground">A pulse on your pipeline.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-navy/70" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold tracking-tight">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Recent activity</h2>
        <ul className="mt-4 divide-y divide-border">
          {activities.length > 0 ? activities.map((t) => (
            <li key={t} className="py-3 text-sm text-foreground/80">{t}</li>
          )) : (
            <li className="py-3 text-sm text-muted-foreground">No recent activity found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
