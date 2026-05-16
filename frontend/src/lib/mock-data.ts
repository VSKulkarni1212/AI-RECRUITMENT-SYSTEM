export type Role = "candidate" | "recruiter";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  posted: string;
  description: string;
  skills: string[];
  matchScore?: number;
  applicants?: number;
};

export type Application = {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateTitle: string;
  email: string;
  matchScore: number;
  skills: string[];
  resumeUrl: string;
  status: "Applied" | "Under Review" | "Interview" | "Rejected";
  appliedAt: string;
};

export const MOCK_JOBS: Job[] = [
  {
    id: "j1",
    title: "Senior Frontend Engineer",
    company: "Northwind Labs",
    location: "Remote · US",
    type: "Full-time",
    salary: "$140k – $180k",
    posted: "2 days ago",
    description:
      "Build delightful interfaces for our analytics platform. You'll own the design system and partner with PMs on rapid iteration.",
    skills: ["React", "TypeScript", "Tailwind", "GraphQL", "Testing"],
    matchScore: 94,
    applicants: 42,
  },
  {
    id: "j2",
    title: "Product Designer",
    company: "Atlas Health",
    location: "New York, NY",
    type: "Full-time",
    salary: "$120k – $150k",
    posted: "5 days ago",
    description: "Design clinician-facing tools that save lives. Strong systems thinking required.",
    skills: ["Figma", "Design Systems", "UX Research", "Prototyping"],
    matchScore: 87,
    applicants: 18,
  },
  {
    id: "j3",
    title: "ML Engineer, Search",
    company: "Northwind Labs",
    location: "Remote · EU",
    type: "Full-time",
    salary: "$160k – $210k",
    posted: "1 week ago",
    description: "Improve our embeddings + ranking models. Production-grade Python, vector search at scale.",
    skills: ["Python", "PyTorch", "FAISS", "Ranking", "MLOps"],
    matchScore: 81,
    applicants: 27,
  },
  {
    id: "j4",
    title: "Staff Backend Engineer",
    company: "Cobalt Finance",
    location: "London, UK",
    type: "Full-time",
    salary: "£110k – £140k",
    posted: "3 days ago",
    description: "Lead our payments platform. Distributed systems, low-latency, high reliability.",
    skills: ["Go", "Postgres", "Kafka", "Kubernetes"],
    matchScore: 76,
    applicants: 35,
  },
  {
    id: "j5",
    title: "Growth Marketing Lead",
    company: "Lumen AI",
    location: "Remote",
    type: "Full-time",
    salary: "$130k – $160k",
    posted: "Today",
    description: "Drive top of funnel for our developer-first AI product. Own paid + content.",
    skills: ["SEO", "Paid Acquisition", "Analytics", "Content"],
    matchScore: 71,
    applicants: 11,
  },
  {
    id: "j6",
    title: "Data Scientist",
    company: "Atlas Health",
    location: "Remote · US",
    type: "Full-time",
    salary: "$135k – $170k",
    posted: "4 days ago",
    description: "Build models that surface clinical insights from messy real-world data.",
    skills: ["Python", "SQL", "Statistics", "Healthcare"],
    matchScore: 68,
    applicants: 22,
  },
];

const FIRST = ["Maya", "Jordan", "Avery", "Priya", "Liam", "Noah", "Zara", "Eli", "Sofia", "Ravi", "Chen", "Amara", "Theo", "Iris", "Kai"];
const LAST = ["Patel", "Nguyen", "Garcia", "Okafor", "Müller", "Khan", "Sato", "Rossi", "Andersen", "Cohen", "Singh", "Park", "Diaz", "Kowalski"];
const TITLES = ["Senior Frontend Engineer", "Full-Stack Developer", "Frontend Lead", "UI Engineer", "Software Engineer", "Staff Engineer", "Product Engineer"];

function rand<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function seeded(seed: number) {
  return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
}

export function generateApplicants(jobId: string, n = 24): Application[] {
  const r = seeded(jobId.charCodeAt(1) * 1000 + n);
  const job = MOCK_JOBS.find((j) => j.id === jobId);
  const baseSkills = job?.skills ?? ["React", "TypeScript"];
  return Array.from({ length: n }).map((_, i) => {
    const f = FIRST[Math.floor(r() * FIRST.length)];
    const l = LAST[Math.floor(r() * LAST.length)];
    const skillCount = 3 + Math.floor(r() * 3);
    const skills = [...baseSkills].sort(() => r() - 0.5).slice(0, skillCount);
    return {
      id: `${jobId}-c${i}`,
      jobId,
      candidateId: `c${i}`,
      candidateName: `${f} ${l}`,
      candidateTitle: rand(TITLES),
      email: `${f.toLowerCase()}.${l.toLowerCase()}@mail.com`,
      matchScore: Math.round(55 + r() * 44),
      skills,
      resumeUrl: "#",
      status: (["Applied", "Under Review", "Interview"] as const)[Math.floor(r() * 3)],
      appliedAt: `${Math.floor(r() * 14) + 1}d ago`,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

export type RecruiterJob = {
  id: string;
  title: string;
  department: string;
  location: string;
  status: "Open" | "Paused" | "Closed";
  applicants: number;
  posted: string;
  mandatorySkills: string[];
};

export const RECRUITER_JOBS: RecruiterJob[] = [
  { id: "j1", title: "Senior Frontend Engineer", department: "Engineering", location: "Remote · US", status: "Open", applicants: 42, posted: "2 days ago", mandatorySkills: ["React", "TypeScript"] },
  { id: "j3", title: "ML Engineer, Search", department: "AI/ML", location: "Remote · EU", status: "Open", applicants: 27, posted: "1 week ago", mandatorySkills: ["Python", "FAISS"] },
  { id: "r1", title: "Engineering Manager", department: "Engineering", location: "Hybrid · NYC", status: "Open", applicants: 14, posted: "3 days ago", mandatorySkills: ["Leadership"] },
  { id: "r2", title: "DevOps Engineer", department: "Platform", location: "Remote", status: "Paused", applicants: 9, posted: "2 weeks ago", mandatorySkills: ["AWS", "Kubernetes"] },
];
