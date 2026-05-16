import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, FileText } from "lucide-react";
import { DragDropUploader } from "@/components/drag-drop-uploader";
import { SkillBadge } from "@/components/skill-badge";
import { useSession } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ENDPOINTS } from "@/lib/api-config";

export const Route = createFileRoute("/candidate/profile")({
  component: Profile,
});

function Profile() {
  const session = useSession();
  const [uploaded, setUploaded] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editSummary, setEditSummary] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      if (!session?.email) return;
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("email", session.email)
        .single();
      
      if (data) {
        let parsedSummary = data.resume_text || "No summary available yet.";
        let parsedSkills = ["Python", "SQL"];
        if (data.resume_text && data.resume_text.includes("[SKILLS_PARSED]:")) {
          const parts = data.resume_text.split("[SKILLS_PARSED]:");
          parsedSummary = parts[0].trim();
          parsedSkills = parts[1].split(",").map((s: string) => s.trim()).filter(Boolean);
        }

        setProfile({
          name: data.full_name,
          title: "Parsed Role",
          location: "Location",
          email: data.email,
          summary: parsedSummary,
          skills: parsedSkills,
          years_exp: data.years_exp || 0,
          experience: [
            { co: "Previous Co", role: "Previous Role", years: `${data.years_exp || 0} yrs total exp` }
          ]
        });
        setEditName(data.full_name);
        setEditSummary(parsedSummary);
        setUploaded(!!data.resume_text);
      }
      setIsLoading(false);
    }
    fetchProfile();
  }, [session]);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(ENDPOINTS.UPLOAD, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error("Failed to parse document on server.");
      }
      
      const data = await res.json();
      if (data.status === "success") {
        const { extracted_text, analysis } = data;
        setEditSummary(extracted_text);
        
        // Update local profile with analysis
        setProfile((prev: any) => ({
          ...prev,
          summary: extracted_text,
          skills: analysis?.skills?.length > 0 ? analysis.skills : (prev?.skills || ["Python", "SQL"]),
          years_exp: analysis?.years_exp || 0,
          edu_score: analysis?.edu_score || 0,
          experience: [
             { co: "Extracted", role: "Experience", years: `${analysis?.years_exp || 0} yrs exp` }
          ]
        }));
        
        setUploaded(true);
        toast.success("Resume parsed! Saving to your profile...");
        
        // AUTO-SAVE to DB immediately
        await handleSave({ 
           name: editName, 
           summary: extracted_text, 
           years: analysis?.years_exp || 0, 
           edu: analysis?.edu_score || 0, 
           skills: analysis?.skills || [] 
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to parse resume.");
    } finally {
      setIsLoading(false);
    }
  };

  const completeness = uploaded ? 92 : 30;

  const handleSave = async (overrides?: any) => {
    if (!session?.email) return;
    setIsSaving(true);
    try {
      const skillsArr = overrides?.skills || profile?.skills || [];
      const summaryText = overrides?.summary || editSummary;
      const combinedText = skillsArr.length > 0 ? `${summaryText}\n\n[SKILLS_PARSED]: ${skillsArr.join(", ")}` : summaryText;

      const payload = {
        full_name: overrides?.name || editName,
        resume_text: combinedText,
        years_exp: overrides?.years || profile?.years_exp || 0,
        edu_score: overrides?.edu || profile?.edu_score || 0,
        profile_quality: completeness
      };

      const { error } = await supabase
        .from("candidates")
        .update(payload)
        .eq("email", session.email);
      
      if (error) throw error;
      toast.success("Profile saved to database!");
      if (overrides) {
        setProfile({ ...profile, ...overrides });
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(`Database Error: ${err.message || "Failed to save"}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center">Loading profile...</div>;

  const displayProfile = {
    name: profile?.name || session?.name || "Candidate",
    title: profile?.title || "Complete your profile",
    location: profile?.location || "---",
    email: profile?.email || session?.email || "---",
    summary: profile?.summary || "Please upload your resume to see AI-parsed insights.",
    skills: profile?.skills || [],
    experience: profile?.experience || []
  };

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">My resume</h1>
          <p className="mt-1 text-muted-foreground">Keep your resume fresh — your match scores depend on it.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DragDropUploader onFile={handleFileUpload} />

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-teal">
              <FileText className="h-3.5 w-3.5" /> Profile Details
            </div>
            {uploaded && (
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-8">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
              <Input 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                className="mt-1"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Professional Summary</label>
              <Textarea 
                value={editSummary} 
                onChange={(e) => setEditSummary(e.target.value)} 
                className="mt-1 min-h-[100px]"
                placeholder="Briefly describe your experience..."
              />
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Skills (Parsed by AI)</div>
            <div className="flex flex-wrap gap-1.5">
              {displayProfile.skills.length > 0 ? (
                displayProfile.skills.map((s: string) => <SkillBadge key={s} skill={s} />)
              ) : (
                <span className="text-xs text-muted-foreground italic">No skills identified yet.</span>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Experience (Parsed by AI)</div>
            <ul className="space-y-3">
              {displayProfile.experience.map((e: any) => (
                <li key={e.co} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-teal" />
                  <div>
                    <div className="text-sm font-medium">{e.role} · {e.co}</div>
                    <div className="text-xs text-muted-foreground">{e.years}</div>
                  </div>
                </li>
              ))}
              {displayProfile.experience.length === 0 && (
                <li className="text-xs text-muted-foreground italic">Upload your resume to extract experience.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
