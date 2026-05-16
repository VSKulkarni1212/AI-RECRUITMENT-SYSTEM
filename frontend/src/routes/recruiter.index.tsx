import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, MapPin, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillBadge } from "@/components/skill-badge";
import { ENDPOINTS } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";


export const Route = createFileRoute("/recruiter/")({
  component: RecruiterJobs,
});

const STATUS_STYLES = {
  Open: "bg-success/10 text-success",
  Paused: "bg-warning/10 text-warning",
  Closed: "bg-muted text-muted-foreground",
} as const;

function RecruiterJobs() {
  const session = useSession();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Job State
  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    skills: ""
  });

  const fetchJobs = async () => {
    if (!session?.email) return;
    try {
      const url = new URL(ENDPOINTS.JOBS, window.location.origin.includes("localhost") ? undefined : window.location.origin);
      url.searchParams.set("email", session.email);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Fetch failed");
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setJobs(data);
      } else {
        console.error("API returned non-array data:", data);
        setJobs([]);
      }
    } catch (err) {
      console.error("Failed to fetch recruiter jobs", err);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    // Enable real-time updates for jobs and applicant counts
    const channel = supabase
      .channel('jobs-list-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchJobs();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        // Applicant counts change when applications are added/removed/modified
        fetchJobs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.email]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title: newJob.title,
        company: newJob.company,
        location: newJob.location,
        description: newJob.description,
        skills: newJob.skills.split(",").map(s => s.trim()).filter(Boolean),
        recruiter_email: session?.email
      };

      const res = await fetch(ENDPOINTS.JOBS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to create job");
      
      toast.success("Job created successfully!");
      setIsDialogOpen(false);
      setNewJob({ title: "", company: "", location: "", description: "", skills: "" });
      fetchJobs();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Open positions</h1>
          <p className="mt-1 text-muted-foreground">Manage roles and rank applicants in seconds.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy text-navy-foreground hover:opacity-90">
              <Plus className="mr-1 h-4 w-4" /> New Job Description
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
              <DialogDescription>
                Add a new position to your active jobs list.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateJob} className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" required value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} placeholder="e.g. Senior Frontend Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" required value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} placeholder="e.g. Acme Corp" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" required value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} placeholder="e.g. Remote" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Input id="skills" required value={newJob.skills} onChange={e => setNewJob({...newJob, skills: e.target.value})} placeholder="e.g. React, TypeScript, Node" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" required value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} placeholder="Describe the role..." className="h-24" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full mt-2 bg-navy text-navy-foreground hover:opacity-90">
                {isSubmitting ? "Creating..." : "Create Job"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 grid gap-4">
        {isLoading ? (
          <p className="text-muted-foreground">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="text-muted-foreground">no jobs on recruiter portal.</p>
        ) : (

          jobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-border bg-card p-5 transition hover:border-navy/40 hover:shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-lg font-semibold tracking-tight">{job.title}</h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLES["Open"])}>
                      Open
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{job.company}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                    <span>· Posted Just Now</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills && job.skills.map((s: string) => <SkillBadge key={s} skill={s} variant="mandatory" />)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-display text-2xl font-semibold tabular-nums">{job.applicant_count || 0}</span>
                    <span className="text-muted-foreground">applicants</span>
                  </div>
                  <Link to="/recruiter/jobs/$jobId" params={{ jobId: String(job.id) }}>
                    <Button size="sm" className="bg-navy text-navy-foreground hover:opacity-90">
                      View candidates <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
