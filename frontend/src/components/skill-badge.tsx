import { cn } from "@/lib/utils";

export function SkillBadge({
  skill,
  variant = "default",
  onRemove,
}: {
  skill: string;
  variant?: "default" | "match" | "missing" | "mandatory";
  onRemove?: () => void;
}) {
  const styles = {
    default: "bg-secondary text-secondary-foreground",
    match: "bg-success/10 text-success border border-success/20",
    missing: "bg-destructive/10 text-destructive border border-destructive/20",
    mandatory: "bg-navy text-navy-foreground",
  } as const;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
      styles[variant],
    )}>
      {skill}
      {onRemove && (
        <button onClick={onRemove} className="opacity-60 hover:opacity-100">×</button>
      )}
    </span>
  );
}
