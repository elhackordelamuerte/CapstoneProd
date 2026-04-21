"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Download, Trash2, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { api } from "@/lib/api";
import type { Meeting } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SummaryPanel } from "@/components/SummaryPanel";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function formatDuration(s: number | null): string {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${String(m % 60).padStart(2, "0")}min`;
  return `${m}min ${String(s % 60).padStart(2, "0")}s`;
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: meeting, isLoading } = useQuery<Meeting>({
    queryKey: ["meeting", id],
    queryFn: () => api.getMeeting(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "transcribing" || status === "summarizing") return 3000;
      return false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteMeeting(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting deleted");
      router.push("/meetings");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /* ── Loading ─────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" aria-label="Loading meeting…" />
        <p className="text-sm text-muted-foreground/50">Loading…</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <span className="text-3xl" aria-hidden="true">🔍</span>
        <p className="text-sm text-muted-foreground">Meeting not found.</p>
        <Button variant="ghost" size="sm" onClick={() => router.push("/meetings")} className="gap-1">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back
        </Button>
      </div>
    );
  }

  const date = format(new Date(meeting.started_at), "MMMM d, yyyy · h:mm a", { locale: enUS });

  return (
    <div className="page-in flex flex-col gap-6 p-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        {/* Back button */}
        <Tooltip>
          <TooltipTrigger
            onClick={() => router.push("/meetings")}
            aria-label="Back to meetings"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground hover:bg-white/[0.07] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>Back</TooltipContent>
        </Tooltip>

        {/* Title block */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-2.5">
            <h1 className="text-xl font-bold text-foreground/95 tracking-tight truncate">
              {meeting.title}
            </h1>
            <Badge status={meeting.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground/60">
            <span>{date}</span>
            {meeting.duration_s != null && (
              <>
                <span className="text-muted-foreground/25">·</span>
                <span>{formatDuration(meeting.duration_s)}</span>
              </>
            )}
          </div>
          {meeting.error_msg && (
            <p className="mt-2 rounded-lg border border-destructive/20 bg-destructive/[0.08] px-3 py-1.5 text-xs text-destructive">
              {meeting.error_msg}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger className="hidden sm:flex">
              <a
                href={api.exportMeetingUrl(id)}
                download
                aria-label="Export as Markdown"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-medium text-foreground/80 hover:bg-white/[0.07] transition-colors"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export .md
              </a>
            </TooltipTrigger>
            <TooltipContent>Download summary as Markdown</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete meeting"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
          <TabsTrigger
            value="summary"
            className="rounded-lg text-xs font-medium data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Summary
          </TabsTrigger>
          <TabsTrigger
            value="transcript"
            className="rounded-lg text-xs font-medium data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Transcript
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <SummaryPanel summary={meeting.summary} status={meeting.status} />
        </TabsContent>
        <TabsContent value="transcript" className="mt-4">
          <TranscriptViewer
            transcript={meeting.transcript}
            isLoading={
              meeting.status === "transcribing" || meeting.status === "recording"
            }
          />
        </TabsContent>
      </Tabs>

      {/* ── Delete modal ───────────────────────────────────────────────── */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The transcript, summary and audio file will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
