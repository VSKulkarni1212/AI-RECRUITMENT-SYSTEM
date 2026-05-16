import { useCallback, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function DragDropUploader({
  label = "Drop your resume here",
  hint = "PDF, DOCX or TXT · up to 10MB",
  onFile,
}: {
  label?: string;
  hint?: string;
  onFile?: (file: File) => void;
}) {
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handle = useCallback((f: File) => { setFile(f); onFile?.(f); }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handle(f);
      }}
      className={cn(
        "relative grid place-items-center rounded-2xl border-2 border-dashed bg-card p-10 text-center transition-all",
        drag ? "border-teal bg-teal/5 scale-[1.01]" : "border-border hover:border-teal/50",
      )}
    >
      <AnimatePresence mode="wait">
        {file ? (
          <motion.div key="file" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {file.name}
              </div>
              <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · uploaded</div>
            </div>
            <button onClick={() => setFile(null)} className="ml-4 rounded-full p-1 hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </motion.div>
        ) : (
          <motion.label key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex cursor-pointer flex-col items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-teal text-teal-foreground shadow-elevated">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">{label}</div>
              <div className="text-xs text-muted-foreground">{hint}</div>
            </div>
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
}
