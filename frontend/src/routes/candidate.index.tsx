import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Search, MapPin, Briefcase, Sparkles, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MatchRing } from "@/components/match-ring";
import { SkillBadge } from "@/components/skill-badge";
import { useSession } from "@/lib/auth-store";
import { ENDPOINTS } from "@/lib/api-config";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/candidate/")({
  component: Discover,
});

// Since the backend gateway returns jobs, we use that type.
type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  matchScore?: number;
};

function Discover() {
  const session = useSession();
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(ENDPOINTS.JOBS)
      .then((res) => res.json())
      .then((data) => {
        setJobs(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch jobs", err);
        setIsLoading(false);
      });

    async function fetchApplied() {
      if (!session?.email) return;
      const { data: cand } = await supabase.from("candidates").select("id").eq("email", session.email).maybeSingle();
      if (!cand) return;
      
      const { data: apps } = await supabase.from("applications").select("job_id").eq("candidate_id", cand.id);
      if (apps) {
        setApplied(new Set(apps.map(a => Number(a.job_id))));
      }
    }
    fetchApplied();
  }, [session?.email]);

  const apply = async (id: number, e: React.MouseEvent) => {
    if (applied.has(id)) return;
    setApplied((s) => new Set(s).add(id));
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
      colors: ["#5cbdb9", "#2d8a9e", "#0c2340"],
    });

    try {
      const { data: candData } = await supabase.from("candidates").select("id").eq("email", session?.email).single();
      if (candData) {
        const { error } = await supabase.from("applications").insert({
          candidate_id: candData.id,
          job_id: id,
          status: "Applied",
          match_score: Math.floor(Math.random() * 30 + 70)
        });
        if (error) throw error;
        toast.success("Application sent!", { description: "The recruiter will get back to you soon." });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit application");
    }
  };

  const filtered = jobs.filter((j) =>
    !query || (j.title + j.company + j.skills?.join(" ")).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-teal">
          <Briefcase className="h-3.5 w-3.5" /> All Available Jobs
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back, {session?.name?.split(" ")[0] || "Candidate"} 👋
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse all open roles posted by recruiters.
        </p>
      </motion.div>

      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by role, company, or skill"
            className="pl-9 h-11 bg-card"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {isLoading ? (
          <p className="text-muted-foreground">Loading jobs...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No jobs found matching your search.</p>
        ) : (
          filtered.map((job, i) => {
            const isApplied = applied.has(job.id);
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group rounded-xl border border-border bg-card p-5 transition hover:border-teal/40 hover:shadow-soft"
              >
                <div className="flex items-start gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-display text-lg font-semibold tracking-tight">{job.title}</h3>
                      <span className="text-sm text-muted-foreground">· {job.company}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{job.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.skills && job.skills.map((s) => <SkillBadge key={s} skill={s} variant="default" />)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      size="sm"
                      disabled={isApplied}
                      onClick={(e) => apply(job.id, e)}
                      className={isApplied ? "bg-success text-success-foreground hover:bg-success" : "bg-gradient-teal text-teal-foreground hover:opacity-90"}
                    >
                      {isApplied ? <><Check className="mr-1 h-4 w-4" /> Applied</> : "Apply"}
                    </Button>
                    <Link to="/candidate" className="text-xs text-muted-foreground hover:text-foreground">View details</Link>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
