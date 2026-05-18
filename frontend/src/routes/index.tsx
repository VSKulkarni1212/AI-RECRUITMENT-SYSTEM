import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Briefcase, BarChart3, FileSearch, Users, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-32 lg:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-teal" />
              SNN + FAISS · LambdaMART ranking · sub-second matching
            </div>
            <h1 className="text-balance font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Hiring at the speed of{" "}
              <span className="bg-gradient-teal bg-clip-text text-transparent">intelligence</span>.
            </h1>
            <p className="mt-6 text-balance text-lg text-muted-foreground sm:text-xl">
              The AI recruitment platform where candidates find their next role in one click,
              and recruiters rank entire applicant pools in seconds.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link to="/auth" search={{ mode: "signup", role: "candidate" }}>
                <Button size="lg" className="bg-gradient-teal text-teal-foreground hover:opacity-90 shadow-elevated">
                  I'm looking for a job <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth" search={{ mode: "signup", role: "recruiter" }}>
                <Button size="lg" variant="outline" className="border-navy/20 hover:bg-navy hover:text-navy-foreground">
                  I'm hiring
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative mx-auto mt-20 max-w-5xl"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-2 shadow-elevated backdrop-blur">
              <div className="absolute -inset-px bg-gradient-teal opacity-20 blur-2xl" />
              <div className="relative grid gap-1 rounded-xl bg-card md:grid-cols-2">
                {/* Candidate preview */}
                <div className="border-b border-border p-6 md:border-b-0 md:border-r">
                  <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-teal">
                    <Briefcase className="h-3.5 w-3.5" /> Candidate
                  </div>
                  <div className="space-y-3">
                    {[
                      { t: "Senior Frontend Engineer", c: "Northwind Labs", s: 94 },
                      { t: "Product Designer", c: "Atlas Health", s: 87 },
                      { t: "ML Engineer, Search", c: "Northwind", s: 81 },
                    ].map((r) => (
                      <div key={r.t} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-teal/10 font-display text-xs font-semibold text-teal">{r.s}</div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium">{r.t}</div>
                          <div className="truncate text-xs text-muted-foreground">{r.c}</div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs">Apply</Button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Recruiter preview */}
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-navy">
                    <BarChart3 className="h-3.5 w-3.5" /> Recruiter · Top 3
                  </div>
                  <div className="space-y-3">
                    {[
                      { n: "Maya Patel", r: "Senior Frontend Eng", s: 96 },
                      { n: "Jordan Kim", r: "Frontend Lead", s: 92 },
                      { n: "Avery Singh", r: "UI Engineer", s: 89 },
                    ].map((r, i) => (
                      <div key={r.n} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3">
                        <div className="font-display text-lg font-semibold text-navy/60 w-5">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium">{r.n}</div>
                          <div className="truncate text-xs text-muted-foreground">{r.r}</div>
                        </div>
                        <div className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">{r.s}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOR CANDIDATES */}
      <section id="candidates" className="mx-auto max-w-7xl px-6 py-24 border-t border-border/60">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal/10 px-4 py-1 text-sm font-medium text-teal">
              For Candidates
            </div>
            <h2 className="font-display text-4xl font-bold tracking-tight">Your career, powered by AI.</h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Stop filling out the same forms. Upload your resume once and let our SNN-powered discovery engine match you with roles that actually fit your skills and experience.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Semantic matching beyond keyword searches",
                "Instant applications with your stored profile",
                "Real-time status updates on your applications",
                "Personalized job recommendations daily"
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-teal/10 flex items-center justify-center text-teal">
                    <Zap className="h-3 w-3" />
                  </div>
                  <span className="text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Link to="/auth" search={{ mode: "signup", role: "candidate" }}>
                <Button className="bg-teal text-teal-foreground hover:bg-teal/90">Get Started as Candidate</Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-elevated"
          >
             <div className="absolute -inset-px bg-gradient-teal opacity-10 blur-xl" />
             <img src="/images/candidate_illustration.png" alt="Candidate Dashboard UI" className="relative w-full h-auto object-cover" />
          </motion.div>
        </div>
      </section>

      {/* FOR RECRUITERS */}
      <section id="recruiters" className="bg-navy/5 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2 items-center lg:flex-row-reverse">
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="lg:order-2"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-navy/10 px-4 py-1 text-sm font-medium text-navy">
                For Recruiters
              </div>
              <h2 className="font-display text-4xl font-bold tracking-tight text-navy">Hire the best, faster.</h2>
              <p className="mt-6 text-lg text-muted-foreground text-navy/80">
                Our LambdaMART ranking engine processes thousands of applicants in sub-seconds. Get a prioritized list of candidates based on technical fit, experience, and potential.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Automated candidate ranking and scoring",
                  "Deep resume parsing and skill extraction",
                  "Customizable hiring pipelines (Kanban)",
                  "Bulk actions to move candidates forward"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-navy/80">
                    <div className="h-5 w-5 rounded-full bg-navy/10 flex items-center justify-center text-navy">
                      <Zap className="h-3 w-3" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link to="/auth" search={{ mode: "signup", role: "recruiter" }}>
                  <Button className="bg-navy text-primary-foreground hover:bg-navy/90">Get Started as Recruiter</Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative rounded-2xl border border-navy/10 bg-white overflow-hidden shadow-elevated lg:order-1"
            >
               <img src="/images/recruiter_illustration.png" alt="Recruiter Dashboard UI" className="relative w-full h-auto object-cover" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            The Process
          </div>
          <h2 className="font-display text-4xl font-semibold tracking-tight">How TalentHive Works</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform uses cutting-edge AI to bridge the gap between talent and opportunity.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { 
              step: "01", 
              title: "Deep AI Parsing", 
              desc: "Upload resumes or job descriptions. Our engine extracts heuristic features, education scores, and dynamic skill overlaps in real-time." 
            },
            { 
              step: "02", 
              title: "Dual-Engine Matching", 
              desc: "Candidates get rapid job discovery via SNN + FAISS, while recruiters get precision applicant ranking using SBERT + LambdaMART (XGBoost)." 
            },
            { 
              step: "03", 
              title: "Human-in-the-loop", 
              desc: "Recruiters seamlessly manage perfectly prioritized pipelines, while candidates effortlessly apply to high-vibe matches in one click." 
            }
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative p-8 rounded-2xl border border-border bg-card shadow-soft"
            >
              <div className="absolute -top-4 -left-4 h-12 w-12 rounded-xl bg-gradient-navy flex items-center justify-center text-primary-foreground font-display text-xl font-bold shadow-elevated">
                {item.step}
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{item.title}</h3>
              <p className="mt-4 text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Built for both sides of the table</h2>
            <p className="mt-3 text-muted-foreground">Everything to find your next role — or fill it.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: FileSearch, title: "AI Job Discovery", desc: "Upload once, get personalized matches ranked by an SNN + FAISS engine." },
              { icon: Zap, title: "1-Click Apply", desc: "Stored resume, instant submission. No re-typing the same forms." },
              { icon: BarChart3, title: "Instant Ranking", desc: "LambdaMART scores your entire applicant pool in seconds." },
              { icon: Users, title: "Smart Filtering", desc: "Top-N, mandatory skills, dynamic re-ranking — without losing your place." },
              { icon: ShieldCheck, title: "Bias-aware", desc: "Score breakdowns and skill-level transparency for every candidate." },
              { icon: Briefcase, title: "Export anywhere", desc: "Download ranked CSVs for your hiring manager in one click." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group rounded-xl border border-border bg-card p-6 transition hover:border-teal/40 hover:shadow-soft"
              >
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-gradient-teal text-teal-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-2xl bg-gradient-navy p-12 text-center shadow-elevated md:p-20"
        >
          <h2 className="font-display text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to meet your match?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/70">
            Join thousands of candidates and hundreds of teams hiring smarter with TalentHive.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup", role: "candidate" }}>
              <Button size="lg" className="bg-gradient-teal text-teal-foreground hover:opacity-90">
                Find a job
              </Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup", role: "recruiter" }}>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Hire talent
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border/60 py-10 text-center text-sm text-muted-foreground">
        © 2026 TalentHive · Crafted with care.
      </footer>
    </div>
  );
}
