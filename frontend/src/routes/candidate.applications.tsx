import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/candidate/applications")({
  component: Applications,
});

const COLUMNS = ["Applied", "Under Review", "Interview", "Offer", "Rejected"] as const;

function Applications() {
  const [apps, setApps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchApps() {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          applied_at,
          match_score,
          jobs (
            job_title,
            company
          )
        `);
      
      if (data) {
        setApps(data.map((a: any) => {
          let status = a.status;
          // Normalize status from DB to UI columns
          if (status === 'applied') status = 'Applied';
          if (status === 'review/test') status = 'Under Review';
          if (status === 'review') status = 'Under Review';
          if (status === 'test') status = 'Under Review';
          if (status === 'under review') status = 'Under Review';
          if (status === 'interview') status = 'Interview';
          if (status === 'offer') status = 'Offer';
          if (status === 'rejected') status = 'Rejected';
          
          return {
            id: a.id,
            status: status,
            title: a.jobs?.job_title || "Unknown Job",
            company: a.jobs?.company || "Unknown Company",
            matchScore: a.match_score || 0,
            appliedAt: new Date(a.applied_at).toLocaleDateString()
          };
        }));
      }
      setIsLoading(false);
    }
    fetchApps();
  }, []);
  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">My applications</h1>
      <p className="mt-1 text-muted-foreground">Track everything you've sent. Drag-and-drop coming soon.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = apps.filter((a) => a.status === col);
          return (
            <div key={col} className="rounded-xl border border-border bg-card/60 p-3">
              <div className="mb-3 flex items-center justify-between px-2">
                <h3 className="text-sm font-semibold">{col}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>
                ) : items.map((app, i) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="cursor-grab rounded-lg border border-border bg-background p-3 shadow-soft hover:border-teal/40"
                    >
                      <div className="text-sm font-medium">{app.title}</div>
                      <div className="text-xs text-muted-foreground">{app.company}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{app.appliedAt}</span>
                        <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-medium text-teal">
                          Match {Math.round(app.matchScore)}
                        </span>
                      </div>
                    </motion.div>
                ))}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    Nothing here yet.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
