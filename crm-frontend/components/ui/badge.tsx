import { clsx } from "clsx";
import type { MeetingStatus } from "@/lib/types";

interface BadgeProps {
  status: MeetingStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  MeetingStatus,
  { label: string; dotClass: string; textClass: string; bgClass: string; borderClass: string; pulse: boolean }
> = {
  recording: {
    label: "Recording",
    dotClass: "bg-red-500",
    textClass: "text-red-400",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/20",
    pulse: true,
  },
  transcribing: {
    label: "Transcribing",
    dotClass: "bg-amber-400",
    textClass: "text-amber-400",
    bgClass: "bg-amber-400/10",
    borderClass: "border-amber-400/20",
    pulse: true,
  },
  summarizing: {
    label: "Summarizing",
    dotClass: "bg-amber-400",
    textClass: "text-amber-400",
    bgClass: "bg-amber-400/10",
    borderClass: "border-amber-400/20",
    pulse: true,
  },
  done: {
    label: "Done",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    pulse: false,
  },
  error: {
    label: "Error",
    dotClass: "bg-red-500",
    textClass: "text-red-400",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/20",
    pulse: false,
  },
};

export function Badge({ status, className }: BadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase",
        config.bgClass,
        config.borderClass,
        config.textClass,
        className
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full shrink-0",
          config.dotClass,
          config.pulse && "animate-pulse"
        )}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
