import React from "react";
import { clsx } from "clsx";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Eye, Trash2, ArrowRight, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MeetingListItem } from "@/lib/types";

interface MeetingCardProps {
  meeting: MeetingListItem;
  onClick: () => void;
  onDelete: () => void;
  compact?: boolean;
}

function formatDuration(s: number | null): string {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${String(m % 60).padStart(2, "0")}min`;
  return `${m}min`;
}

/* ── Compact card variant (dashboard) ──────────────────────────── */
function CompactCard({ meeting, onClick, onDelete }: MeetingCardProps) {
  const date = format(new Date(meeting.started_at), "MMM d · h:mm a", { locale: enUS });

  return (
    <div
      className={clsx(
        "group relative flex flex-col overflow-hidden rounded-xl border cursor-pointer",
        "bg-white/[0.03] border-white/[0.08]",
        "transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.14] hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]",
        "hover:-translate-y-0.5"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      aria-label={`View meeting: ${meeting.title}`}
    >
      {/* Top color stripe by status */}
      <div
        className={clsx(
          "h-0.5 w-full",
          meeting.status === "done" && "bg-emerald-500/50",
          meeting.status === "error" && "bg-red-500/50",
          (meeting.status === "transcribing" || meeting.status === "summarizing") && "bg-amber-400/50",
          meeting.status === "recording" && "bg-red-500/70",
        )}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground/95 tracking-tight">
            {meeting.title}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground/70">
            <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{date}</span>
            <span className="text-muted-foreground/30">·</span>
            <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{formatDuration(meeting.duration_s)}</span>
          </div>
          {meeting.summary_preview && (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/60 leading-relaxed">
              {meeting.summary_preview}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge status={meeting.status} />
          <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground -translate-x-1 group-hover:translate-x-0 duration-200" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

/* ── Table row variant (meetings list) ─────────────────────────── */
function TableRow({ meeting, onClick, onDelete }: MeetingCardProps) {
  const date = format(new Date(meeting.started_at), "MMM d, yyyy · h:mm a", { locale: enUS });

  return (
    <div
      className={clsx(
        "group grid grid-cols-[1fr_140px_80px_110px_80px] items-center gap-4 px-5 py-3.5 transition-all duration-200",
        "border-b border-white/[0.05] last:border-b-0",
        "hover:bg-white/[0.03] cursor-pointer"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      aria-label={`View meeting: ${meeting.title}`}
    >
      {/* Title */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground/90">{meeting.title}</p>
        {meeting.summary_preview && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground/55">{meeting.summary_preview}</p>
        )}
      </div>

      {/* Date */}
      <span className="text-xs text-muted-foreground/70 font-mono tabular-nums">{date}</span>

      {/* Duration */}
      <span className="text-xs text-muted-foreground/70 font-mono tabular-nums">
        {formatDuration(meeting.duration_s)}
      </span>

      {/* Status */}
      <div>
        <Badge status={meeting.status} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger
            onClick={(e) => { (e as React.MouseEvent).stopPropagation(); onClick(); }}
            aria-label={`View ${meeting.title}`}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>Open</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            onClick={(e) => { (e as React.MouseEvent).stopPropagation(); onDelete(); }}
            aria-label={`Delete ${meeting.title}`}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function MeetingCard({
  meeting,
  onClick,
  onDelete,
  compact = false,
}: MeetingCardProps) {
  if (compact) {
    return <CompactCard meeting={meeting} onClick={onClick} onDelete={onDelete} />;
  }
  return <TableRow meeting={meeting} onClick={onClick} onDelete={onDelete} />;
}
