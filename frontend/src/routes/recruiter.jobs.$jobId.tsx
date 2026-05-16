import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, ExternalLink, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SkillBadge } from "@/components/skill-badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { ENDPOINTS } from "@/lib/api-config";
import { useSession } from "@/lib/auth-store";


export type Application = {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateTitle: string;
  email: string;
  matchScore: number;
  skills: string[];
  resumeText: string;
  resumeUrl: string;
  status: string;
  appliedAt: string;
};

export const Route = createFileRoute("/recruiter/jobs/$jobId")({
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const session = useSession();

  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [ranking, setRanking] = useState(false);
  const [ranked, setRanked] = useState(false);
  const [topN, setTopN] = useState<string>("10");
  const [mandatory, setMandatory] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const STATUS_OPTIONS = ["Applied", "Review/Test", "Interview", "Offer", "Rejected"];

  useEffect(() => {
    async function fetchJobAndApplicants(silent = false) {
      if (!session?.email) return;
      if (!silent) setIsLoading(true);

      try {
        // 1. Get recruiter ID
        const { data: recData, error: recError } = await supabase
          .from("recruiters")
          .select("id")
          .ilike("email", session.email)
          .maybeSingle();
        
        if (recError) {
          console.error("Recruiter fetch error:", recError);
        }

        if (!recData) {
          setJob(null);
          return;
        }
        const recruiterId = recData.id;

        // 2. Fetch Job and Verify Ownership
        const { data: jobData, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", Number(jobId))
          .eq("recruiter_id", recruiterId) // Ownership check
          .maybeSingle();
        
        if (jobError) console.error("Job fetch error:", jobError);

        if (jobData) {
          setJob({
            id: jobData.id,
            title: jobData.job_title,
            department: "Engineering", 
            location: jobData.location,
            mandatorySkills: jobData.skills || [],
            description: jobData.job_description || "No description provided."
          });
          // Remove automatic filtering to show all candidates initially
          setMandatory([]);
        } else {
          // Job not found or doesn't belong to this recruiter
          setJob(null);
          return;
        }

        // 2. Fetch Applicants directly via Backend API to bypass RLS
        const res = await fetch(`${ENDPOINTS.JOBS}/${jobId}/applicants`);
        if (!res.ok) throw new Error("Applicants fetch error: " + await res.text());
        const appData = await res.json();
        
        if (appData) {
          setApplicants(appData.map((a: any) => {
            const text = a.candidates?.resume_text || "";
            
            // Use full_name from DB if available, fallback to Candidate
            const nameFromDb = a.candidates?.full_name;
            const name = nameFromDb && nameFromDb.trim() !== '' && nameFromDb !== 'Applicant' ? nameFromDb : "Candidate";
            
            // Extract title heuristically
            const titleLines = text.split('\n').filter((l: string) => l.trim().length > 0);
            const title = titleLines.length > 1 ? titleLines[1].trim().slice(0, 50) : "Professional";
            
            let parsedSkills: string[] = [];
            if (text.includes("[SKILLS_PARSED]:")) {
              const parts = text.split("[SKILLS_PARSED]:");
              parsedSkills = parts[1].split(",").map((s: string) => s.trim()).filter(Boolean);
            }

            const skills = parsedSkills.length > 0 ? parsedSkills : ((a.candidates as any)?.skills || []);
            const commonSkills = ["Python", "JavaScript", "React", "SQL", "Java", "C++", "Docker", "AWS", "Node.js", "TypeScript"];
            const foundSkills = skills.length > 0 ? skills : commonSkills.filter(s => text.toLowerCase().includes(s.toLowerCase()));

            // Normalize status
            let uiStatus = "Applied";
            const dbStatus = (a.status || "").toLowerCase();
            if (dbStatus.includes("review")) uiStatus = "Review/Test";
            else if (dbStatus === "interview") uiStatus = "Interview";
            else if (dbStatus === "offer") uiStatus = "Offer";
            else if (dbStatus === "rejected") uiStatus = "Rejected";
            else if (dbStatus === "applied") uiStatus = "Applied";
            else uiStatus = a.status || "Applied";

            return {
              id: a.id,
              candidateId: a.candidate_id,
              candidateName: name,
              candidateTitle: title,
              email: a.candidates?.email || "",
              matchScore: a.match_score || 0,
              skills: foundSkills.length > 0 ? foundSkills : ["General Skills"],
              resumeText: text,
              resumeUrl: "#",
              status: uiStatus,
              appliedAt: new Date(a.applied_at).toLocaleDateString()
            };
          }));
        }
      } catch (err) {
        console.error("Unexpected error fetching applicants:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobAndApplicants();

    // Enable real-time updates for applications to this job
    const channel = supabase
      .channel(`job-applicants-${jobId}`)
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'applications', 
          filter: `job_id=eq.${jobId}` 
        }, 
        () => {
          fetchJobAndApplicants(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, session?.email]);

  const runRanking = async () => {
    if (!job || applicants.length === 0) return;
    setRanking(true);
    setRanked(false);

    try {
      const resumes = applicants.map(a => ({
        id: a.id,
        text: a.resumeText || (a.candidateName + ": " + (a.status || "Applied"))
      }));
      
      const response = await fetch(ENDPOINTS.RANK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: job.title + " " + (mandatory.join(", ")),
          resumes: resumes,
          mandatory_skills: mandatory
        })
      });
      const data = await response.json();

      if (data.status === "success") {
        // Map results back to applicants
        const updatedApplicants = applicants.map(a => {
          const apiResult = data.results.find((r: any) => String(r.id) === String(a.id));
          if (apiResult) {
             return {
               ...a,
               matchScore: Math.round(apiResult.score),
               skills: apiResult.extracted_skills?.length ? apiResult.extracted_skills : a.skills
             };
          }
          return a;
        }).sort((a, b) => b.matchScore - a.matchScore);

        setApplicants(updatedApplicants);
        setRanked(true);

        // PERSIST TO DATABASE VIA BACKEND API (Bypass RLS)
        const updates = data.results.map((r: any) => ({
          id: Number(r.id),
          match_score: r.score
        }));
 
        const scoreRes = await fetch(`${ENDPOINTS.JOBS.replace('/jobs', '')}/applications/scores`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates })
        });
 
        if (!scoreRes.ok) {
          const errText = await scoreRes.text();
          console.error("Score persistence failed:", errText);
          toast.error(`Warning: Ranking calculated but not saved to database.`);
        } else {
          toast.success("Ranking complete", { description: "AI scored all applicants based on your criteria." });
        }
      }
    } catch (err) {
      console.error("Ranking failed", err);
      toast.error("Ranking failed");
    } finally {
      setRanking(false);
    }
  };

  const filtered = useMemo(() => {
    let list = applicants;
    if (mandatory.length) {
      list = list.filter((a) => mandatory.every((m) => a.skills.some((s) => s.toLowerCase() === m.toLowerCase())));
    }
    if (topN !== "all") list = list.slice(0, parseInt(topN, 10));
    return list;
  }, [applicants, mandatory, topN]);

  const exportCsv = () => {
    const rows = [
      ["Rank", "Name", "Title", "Email", "Match Score", "Skills", "Status", "Applied"],
      ...filtered.map((a, i) => [i + 1, a.candidateName, a.candidateTitle, a.email, a.matchScore, a.skills.join(" | "), a.status, a.appliedAt]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${job?.title.replace(/\s+/g, "_") ?? "candidates"}_top${topN}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !mandatory.includes(v)) setMandatory([...mandatory, v]);
    setSkillInput("");
  };

  const updateStatus = async (appIds: (string | number)[], newStatus: string) => {
    setIsUpdating(true);
    try {
      const numericIds = appIds.map(id => Number(id));
      // Keep UI status capitalized, but send lowercase to match db
      const dbStatus = newStatus === "Review/Test" ? "review/test" : newStatus.toLowerCase();

      const res = await fetch(`${ENDPOINTS.JOBS.replace('/jobs', '')}/applications/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_ids: numericIds, status: dbStatus })
      });
      
      if (!res.ok) {
        const errText = await res.text();
        console.error("Status update error:", errText);
        throw new Error("Database rejected status update.");
      }
      
      setApplicants(prev => prev.map(a => 
        numericIds.includes(Number(a.id)) ? { ...a, status: newStatus } : a
      ));
      toast.success(`Status updated to ${newStatus}`);
      setSelectedApps([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedApps.length === filtered.length) {
      setSelectedApps([]);
    } else {
      setSelectedApps(filtered.map(a => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedApps(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading job details...</div>;

  if (!job) {
    return <div className="p-10">Job not found. <Link to="/recruiter" className="text-teal underline">Back</Link></div>;
  }

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10">
      <Link to="/recruiter" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="flex-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{job.title}</h1>
          <p className="mt-1 text-muted-foreground">{job.department} · {job.location} · {applicants.length} applicants</p>
          <details className="mt-3 group max-w-2xl cursor-pointer">
            <summary className="text-sm font-medium text-teal hover:underline select-none">View Job Description</summary>
            <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap p-4 bg-muted/30 rounded-lg border border-border">
              {job.description}
            </div>
          </details>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedApps.length > 0 && (
            <div className="flex items-center gap-2 mr-4 border-r pr-4 border-border">
              <span className="text-sm font-medium">{selectedApps.length} selected</span>
              <Select onValueChange={(val) => updateStatus(selectedApps, val)}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={exportCsv} variant="outline">
            <Download className="mr-1 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={runRanking} disabled={ranking} className="bg-gradient-navy text-primary-foreground hover:opacity-90">
            <Sparkles className={cn("mr-1 h-4 w-4", ranking && "animate-pulse")} />
            {ranking ? "Ranking…" : ranked ? "Re-rank candidates" : "Rank candidates"}
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select value={topN} onValueChange={setTopN}>
              <SelectTrigger className="h-9 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="25">Top 25</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">candidates</span>
          </div>

          <div className="h-6 w-px bg-border hidden sm:block" />

          <div className="flex flex-1 flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Mandatory skills:</span>
            {mandatory.map((s) => (
              <SkillBadge key={s} skill={s} variant="mandatory" onRemove={() => setMandatory(mandatory.filter((x) => x !== s))} />
            ))}
            <div className="flex items-center gap-1">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add skill"
                className="h-7 w-32 text-xs"
              />
              <Button size="icon" variant="ghost" onClick={addSkill} className="h-7 w-7"><Plus className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[40px_60px_1fr_100px_2fr_140px_60px] gap-3 border-b border-border bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground items-center">
          <div>
            <input 
              type="checkbox" 
              checked={selectedApps.length === filtered.length && filtered.length > 0} 
              onChange={toggleSelectAll}
              className="rounded border-border text-teal focus:ring-teal"
            />
          </div>
          <div>Rank</div>
          <div>Candidate</div>
          <div>Match</div>
          <div>Skills</div>
          <div>Status</div>
          <div></div>
        </div>

        <AnimatePresence mode="wait">
          {ranking ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[60px_1fr_120px_2fr_120px_60px] items-center gap-3 border-b border-border px-5 py-4">
                  <div className="h-4 w-6 rounded shimmer" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-40 rounded shimmer" />
                    <div className="h-3 w-24 rounded shimmer" />
                  </div>
                  <div className="h-6 w-14 rounded shimmer" />
                  <div className="flex gap-1.5"><div className="h-5 w-14 rounded-full shimmer" /><div className="h-5 w-16 rounded-full shimmer" /><div className="h-5 w-12 rounded-full shimmer" /></div>
                  <div className="h-5 w-20 rounded shimmer" />
                  <div className="h-5 w-5 rounded shimmer" />
                </div>
              ))}
            </motion.div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              No candidates match your current filters. <button onClick={() => setMandatory([])} className="text-teal underline">Clear skills</button>
            </div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {filtered.map((a, i) => (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="grid grid-cols-[40px_60px_1fr_100px_2fr_140px_60px] items-center gap-3 border-b border-border px-5 py-3 transition hover:bg-muted/40 last:border-0"
                >
                  <div>
                    <input 
                      type="checkbox" 
                      checked={selectedApps.includes(a.id)} 
                      onChange={() => toggleSelect(a.id)}
                      className="rounded border-border text-teal focus:ring-teal"
                    />
                  </div>
                  <div className={cn(
                    "grid h-8 w-8 place-items-center rounded-full font-display text-sm font-semibold",
                    i === 0 ? "bg-warning/20 text-warning" :
                    i === 1 ? "bg-muted text-foreground" :
                    i === 2 ? "bg-accent text-accent-foreground" :
                    "text-muted-foreground",
                  )}>{i + 1}</div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{a.candidateName}</div>
                    <div className="truncate text-xs text-muted-foreground">{a.candidateTitle} · {a.email}</div>
                  </div>
                  <div>
                    <span className={cn(
                      "rounded-md px-2 py-1 font-display text-sm font-semibold tabular-nums",
                      a.matchScore >= 85 ? "bg-success/10 text-success" :
                      a.matchScore >= 70 ? "bg-teal/10 text-teal" :
                      "bg-warning/10 text-warning",
                    )}>{Math.round(a.matchScore)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {a.skills.slice(0, 4).map((s) => (
                      <SkillBadge key={s} skill={s} variant={mandatory.includes(s) ? "match" : "default"} />
                    ))}
                  </div>
                  <div>
                    <Select value={a.status} onValueChange={(val) => updateStatus([a.id], val)}>
                      <SelectTrigger className="h-8 w-full text-xs bg-transparent border-none hover:bg-muted focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <a href={a.resumeUrl} className="text-muted-foreground hover:text-teal justify-self-center" aria-label="View resume">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Showing {filtered.length} of {applicants.length} applicants
      </p>
    </div>
  );
}
