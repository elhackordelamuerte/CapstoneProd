import { clsx } from "clsx";
import { Loader2, CheckCircle2, FileText } from "lucide-react";
import type { MeetingStatus } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SummaryPanelProps {
  summary: string | null;
  status: MeetingStatus;
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground/95">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <div key={i} className="mt-6 mb-3 flex items-center gap-2">
          <div className="h-4 w-0.5 rounded-full bg-primary/60" aria-hidden="true" />
          <h2 className="font-semibold text-sm text-foreground/95 tracking-tight">
            {line.slice(3)}
          </h2>
        </div>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="mt-4 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" aria-hidden="true" />
          <p className="text-sm text-foreground/75 leading-relaxed">
            <InlineMarkdown text={line.slice(2)} />
          </p>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-1.5" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-foreground/75 leading-relaxed">
          <InlineMarkdown text={line} />
        </p>
      );
    }
  }

  return <div className="flex flex-col gap-1">{elements}</div>;
}

const PIPELINE_STEPS: { key: MeetingStatus; label: string }[] = [
  { key: "recording", label: "Recording" },
  { key: "transcribing", label: "Transcription" },
  { key: "summarizing", label: "AI Summary" },
  { key: "done", label: "Complete" },
];

const STATUS_ORDER: Partial<Record<MeetingStatus, number>> = {
  recording: 0,
  transcribing: 1,
  summarizing: 2,
  done: 3,
  error: -1,
};

export function SummaryPanel({ summary, status }: SummaryPanelProps) {
  /* ── Error ──────────────────────────────────────────────────────── */
  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-6 py-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
          <span className="text-lg">⚠</span>
        </div>
        <p className="text-sm font-medium text-red-400">
          An error occurred during processing.
        </p>
      </div>
    );
  }

  /* ── In-progress pipeline stepper ──────────────────────────────── */
  if (status !== "done") {
    const currentStep = STATUS_ORDER[status] ?? 0;

    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
          <div className="mb-5 flex items-center gap-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" aria-label={`Processing: ${status}`} />
            <p className="text-sm font-semibold text-amber-400">Processing in progress…</p>
          </div>

          {/* Horizontal step progress */}
          <div className="flex items-center">
            {PIPELINE_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;
              const isPending = idx > currentStep;
              return (
                <div key={step.key} className="flex items-center flex-1 min-w-0 last:flex-none">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div
                      className={clsx(
                        "flex h-6 w-6 items-center justify-center rounded-full border transition-all",
                        isCompleted && "border-emerald-500/40 bg-emerald-500/20",
                        isCurrent && "border-amber-500/40 bg-amber-500/20",
                        isPending && "border-white/10 bg-white/[0.03]"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                      ) : isCurrent ? (
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/20" aria-hidden="true" />
                      )}
                    </div>
                    <span className={clsx(
                      "text-[10px] font-medium whitespace-nowrap",
                      isCompleted && "text-emerald-400",
                      isCurrent && "text-amber-400 font-semibold",
                      isPending && "text-muted-foreground/30"
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <div
                      className={clsx(
                        "mx-2 mb-4 h-px flex-1 rounded-full transition-colors",
                        isCompleted ? "bg-emerald-500/40" : "bg-white/[0.08]"
                      )}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ── No summary available ───────────────────────────────────────── */
  if (!summary) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-muted bg-muted/30">
          <FileText className="h-6 w-6 text-muted-foreground/40" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground">No summary available.</p>
      </div>
    );
  }

  /* ── Rendered summary ───────────────────────────────────────────── */
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="border-b border-white/[0.06] bg-white/[0.02] px-5 py-3 flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 text-muted-foreground/40" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
          Summary
        </span>
      </div>
      <ScrollArea className="max-h-[520px]">
        <div className="p-5">
          <MarkdownRenderer content={summary} />
        </div>
      </ScrollArea>
    </div>
  );
}
