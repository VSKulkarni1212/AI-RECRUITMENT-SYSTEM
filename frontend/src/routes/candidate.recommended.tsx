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

export const Route = createFileRoute("/candidate/recommended")({
  component: Recommended,
});

type RecommendedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  posted: string;
  description: string;
  skills: string[];
  matchScore: number;
};

function Recommended() {
  const session = useSession();
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      // If session is not yet loaded from useSession (starts as null), wait.
      // Note: If session is explicitly null after loading, we should handle it.
      if (session === null) return; 

      if (!session.email) {
        setIsLoading(false);
        return;
      }

      try {
        console.log("Fetching recommendations for:", session.email);
        // 1. Fetch real candidate resume text
        const { data: profile, error: profileError } = await supabase
          .from("candidates")
          .select("resume_text")
          .eq("email", session.email)
          .maybeSingle();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw new Error("Could not load your profile.");
        }

        const resumeText = profile?.resume_text || "Software Engineer looking for opportunities.";

        // 2. Post to Search Endpoint
        console.log("Calling search endpoint:", ENDPOINTS.SEARCH);
        const res = await fetch(ENDPOINTS.SEARCH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resume_text: resumeText })
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Search service is currently unavailable.");
        }
        
        const data = await res.json();

        // 3. Map backend search results to frontend interface
        if (data && data.results) {
           const formatted = data.results.map((r: any, idx: number) => ({
             id: r.id || r.job_index || `rec-${idx}`,
             title: r.job_title || "Unknown Role",
             company: r.company || "",
             location: r.location || "",
             type: "Full-time",
             salary: "Competitive",
             posted: "Recently",
             description: r.job_summary || r.description || "",
             skills: [],
             // Backend returns 'vibe_match_score' (cosine distance)
             // Convert distance to a percentage (approximate)
             matchScore: Math.round(r.vibe_match_score || 50)
           }));
           setJobs(formatted.sort((a: any, b: any) => b.matchScore - a.matchScore).slice(0, 5));
        }
      } catch (err: any) {
        console.error("Recommendation error:", err);
        toast.error(err.message || "Failed to fetch recommendations");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommendations();
    
    // 4. Fetch already applied jobs to prevent duplicates
    async function fetchApplied() {
      if (!session?.email) return;
      const { data: cand } = await supabase.from("candidates").select("id").eq("email", session.email).maybeSingle();
      if (!cand) return;
      
      const { data: apps } = await supabase.from("applications").select("job_id").eq("candidate_id", cand.id);
      if (apps) {
        setApplied(new Set(apps.map(a => String(a.job_id))));
      }
    }
    fetchApplied();
  }, [session?.email]);

  const apply = async (jobId: string, e: React.MouseEvent) => {
    if (applied.has(jobId) || !session?.email) return;
    
    try {
      // 1. Get Candidate ID
      const { data: cand } = await supabase.from("candidates").select("id").eq("email", session.email).single();
      if (!cand) throw new Error("Profile not found");

      // 2. Insert Application
      // Note: If jobId is a URL (external), we need a column that can store it.
      // If it's a platform job (integer), we use job_id.
      const isPlatformJob = !isNaN(Number(jobId));
      const insertPayload: any = {
        candidate_id: cand.id,
        status: 'Applied', // Capitalized to match recruiter options
        match_score: Math.round(jobs.find(j => j.id === jobId)?.matchScore || 50)
      };

      if (isPlatformJob) {
        insertPayload.job_id = Number(jobId);
      } else {
        // If external job, we'd need an 'external_job_url' column. 
        // For now, we attempt to save as job_id if the DB allows text IDs, 
        // otherwise we show a helpful error.
        insertPayload.job_id = jobId; 
      }

      const { error } = await supabase.from("applications").insert(insertPayload);

      if (error) {
        console.error("Application Error:", error);
        if (error.code === '23505') throw new Error("You have already applied to this job.");
        throw new Error(`Database Error: ${error.message}. (This usually happens if applying to an external job without the correct DB columns)`);
      }

      setApplied((s) => new Set(s).add(jobId));
      
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
        colors: ["#5cbdb9", "#2d8a9e", "#0c2340"],
      });
      toast.success("Application sent!", { description: "The recruiter will get back to you soon." });
    } catch (err: any) {
      toast.error(err.message || "Failed to apply");
    }
  };

  const filtered = jobs.filter((j) =>
    !query || (j.title + j.company + j.skills?.join(" ")).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-teal">
          <Sparkles className="h-3.5 w-3.5" /> AI-Ranked For You
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Your Top Matches
        </h1>
        <p className="mt-2 text-muted-foreground">
          Roles curated by our AI model based on your uploaded resume.
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
          <div className="py-20 text-center">
            <Sparkles className="mx-auto h-8 w-8 animate-pulse text-teal/40" />
            <p className="mt-4 text-muted-foreground font-medium">AI is analyzing roles...</p>
            <p className="text-xs text-muted-foreground/60 mt-1">This may take a moment on first load as we sync 1M+ jobs.</p>
          </div>
        ) : session === null ? (
          <p className="text-muted-foreground">Checking your profile...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No recommendations found yet. Try uploading a more detailed resume!</p>
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
                  <MatchRing value={job.matchScore} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-display text-lg font-semibold tracking-tight">{job.title}</h3>
                      {job.company && <span className="text-sm text-muted-foreground">· {job.company}</span>}
                    </div>
                    {job.location && (
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                      </div>
                    )}
                    <p className="mt-3 text-sm text-foreground/80 whitespace-pre-wrap">{job.description}</p>
                  </div>
                  {/* Apply button removed as requested */}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
