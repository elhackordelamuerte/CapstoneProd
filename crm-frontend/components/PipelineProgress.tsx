import { clsx } from "clsx";
import type { MeetingListItem, MeetingStatus } from "@/lib/types";
import { Loader2, CheckCircle2, Circle, Zap } from "lucide-react";

interface PipelineProgressProps {
  meeting: MeetingListItem;
}

const STEPS: { key: MeetingStatus; label: string; short: string }[] = [
  { key: "recording", label: "Recording", short: "Rec." },
  { key: "transcribing", label: "Transcription", short: "Transcr." },
  { key: "summarizing", label: "Generating summary", short: "Summary" },
];

const STEP_ORDER: Partial<Record<MeetingStatus, number>> = {
  transcribing: 1,
  summarizing: 2,
};

export function PipelineProgress({ meeting }: PipelineProgressProps) {
  if (meeting.status !== "transcribing" && meeting.status !== "summarizing") {
    return null;
  }

  const current = STEP_ORDER[meeting.status] ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/15 bg-gradient-to-r from-amber-950/40 to-amber-900/10 px-5 py-4 shadow-[0_0_40px_-15px_rgba(245,158,11,0.2)]">
      <div
        className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent pointer-events-none"
        style={{ animation: "pulse 2.5s ease-in-out infinite" }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center gap-4 flex-wrap">
        {/* Icon + label */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/20">
            <Zap className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-amber-400/90">
              Processing
            </p>
            <p className="text-xs text-amber-400/60 truncate max-w-[140px]">{meeting.title}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-white/10 shrink-0 hidden sm:block" aria-hidden="true" />

        {/* Step indicators */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < current;
            const isCurrent = idx === current;
            const isPending = idx > current;

            return (
              <div key={step.key} className="flex items-center gap-1">
                <div className="flex items-center gap-1.5">
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  ) : isCurrent ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400 shrink-0" aria-label={`In progress: ${step.label}`} />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" aria-hidden="true" />
                  )}
                  <span
                    className={clsx(
                      "text-xs font-medium whitespace-nowrap hidden sm:inline",
                      isCompleted && "text-emerald-400",
                      isCurrent && "text-amber-400 font-semibold",
                      isPending && "text-muted-foreground/40"
                    )}
                  >
                    {step.short}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={clsx(
                      "mx-1 h-px w-4 sm:w-6 rounded-full transition-colors",
                      isCompleted ? "bg-emerald-400/50" : "bg-white/10"
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
