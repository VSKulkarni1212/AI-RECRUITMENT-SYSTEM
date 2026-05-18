import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Box, User, Mail, Lock, ArrowRight, Eye, EyeOff, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSession } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Role } from "@/lib/mock-data";

type Search = { mode?: "login" | "signup"; role?: Role };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s.mode === "login" ? "login" : "signup",
    role: s.role === "recruiter" ? "recruiter" : s.role === "candidate" ? "candidate" : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(search.mode ?? "signup");
  const [role, setRole] = useState<Role | undefined>(search.role);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    let r = role ?? "candidate";
    let finalName = name.trim() || cleanEmail.split("@")[0] || "New User";

    // Validation
    if (!validateEmail(cleanEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (mode === "signup" && !validatePassword(cleanPassword)) {
      toast.error("Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.");
      return;
    }

    if (mode === "signup" && r === "recruiter" && !companyName.trim()) {
      toast.error("Company name is required for recruiters.");
      return;
    }
    
    try {
      setIsLoading(true);
      if (mode === "signup") {
        // 1. Supabase Auth Signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: { 
            data: { 
              full_name: finalName, 
              role: r,
              company_name: r === "recruiter" ? companyName.trim() : undefined
            } 
          }
        });

        if (authError) {
          if (authError.message.includes("rate limit")) {
             throw new Error("Email rate limit exceeded. Please wait a few minutes or try a different email address.");
          }
          throw authError;
        }

        if (authData.user) {
          // 2. Insert into role-specific table
          if (r === "candidate") {
            const { error: insertError } = await supabase.from("candidates").insert({
              user_id: authData.user.id,
              full_name: finalName,
              email: email
            });
            if (insertError) console.error("Database insert error:", insertError.message);
          } else {
            const { error: insertError } = await supabase.from("recruiters").insert({
              user_id: authData.user.id,
              full_name: finalName,
              company_name: companyName,
              email: email
            });
            if (insertError) console.error("Database insert error:", insertError.message);
          }
        }
        toast.success("Account created! Please check your email for a confirmation link.");
      } else {
        // Login Logic
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ 
          email: cleanEmail, 
          password: cleanPassword 
        });
        if (loginError) throw loginError;
        
        let userRole = loginData.user?.user_metadata?.role;
        if (!userRole) {
          const { data: candData } = await supabase.from("candidates").select("id").eq("user_id", loginData.user?.id).maybeSingle();
          if (candData) {
            userRole = "candidate";
          } else {
            userRole = "recruiter";
          }
        }
        r = userRole;
        finalName = loginData.user?.user_metadata?.full_name || finalName;

        toast.success("Welcome back!");
      }

      setSession({ name: finalName, email: cleanEmail, role: r });
      navigate({ to: r === "candidate" ? "/candidate" : "/recruiter" });
    } catch (err: any) {
      console.error("Auth error:", err.message);
      toast.error(err.message || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-mesh">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl grid-cols-1 items-center gap-12 px-6 py-12 lg:grid-cols-2">
        {/* Left: pitch */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0F172A] shadow-elevated">
              <Box className="h-6 w-6 text-white stroke-[2.5] fill-none" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight">
              <span className="text-[#0F172A]">Talent</span><span className="text-teal">Hive</span>
            </span>
          </div>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight">
            Welcome.<br />Let's match you.
          </h1>
          <p className="mt-6 max-w-md text-muted-foreground">
            Create your free account in under 30 seconds. Your AI-ranked feed is one upload away.
          </p>
          <div className="mt-10 grid gap-4">
            {[
              "End-to-end encrypted resume storage",
              "1-click apply across the entire platform",
              "Recruiter access to LambdaMART ranking",
            ].map((b) => (
              <div key={b} className="flex items-center gap-3 text-sm text-foreground/80">
                <div className="h-1.5 w-1.5 rounded-full bg-teal" /> {b}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: form card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
            <div className="flex gap-2 rounded-lg bg-muted p-1">
              <button
                onClick={() => setMode("signup")}
                className={cn("flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
                  mode === "signup" ? "bg-card shadow-soft" : "text-muted-foreground")}
              >Sign up</button>
              <button
                onClick={() => setMode("login")}
                className={cn("flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
                  mode === "login" ? "bg-card shadow-soft" : "text-muted-foreground")}
              >Log in</button>
            </div>

            {mode === "signup" && (
              <div className="mt-6">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">I am a…</Label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <RoleCard
                    icon={User}
                    title="Candidate"
                    desc="Looking for a job"
                    selected={role === "candidate"}
                    onClick={() => setRole("candidate")}
                    accent="teal"
                  />
                  <RoleCard
                    icon={Briefcase}
                    title="Recruiter"
                    desc="I'm hiring"
                    selected={role === "recruiter"}
                    onClick={() => setRole("recruiter")}
                    accent="navy"
                  />
                </div>
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Maya Patel" className="pl-9" />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@work.com" className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="pl-9 pr-10" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && role === "recruiter" && (
                <div className="space-y-1.5">
                  <Label htmlFor="company">Company name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="company" 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)} 
                      placeholder="Acme Corp" 
                      className="pl-9" 
                      required
                    />
                  </div>
                </div>
              )}

              <Button type="submit" size="lg" disabled={isLoading} className="w-full bg-gradient-navy text-primary-foreground hover:opacity-90">
                {isLoading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
                {!isLoading && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function RoleCard({ icon: Icon, title, desc, selected, onClick, accent }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; desc: string; selected: boolean; onClick: () => void; accent: "teal" | "navy";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border-2 p-4 text-left transition",
        selected
          ? accent === "teal" ? "border-teal bg-teal/5" : "border-navy bg-navy/5"
          : "border-border hover:border-foreground/20",
      )}
    >
      <div className={cn("mb-3 grid h-9 w-9 place-items-center rounded-lg",
        accent === "teal" ? "bg-teal/10 text-teal" : "bg-navy/10 text-navy")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}
