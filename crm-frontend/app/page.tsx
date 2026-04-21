"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { MeetingListResponse, RecordingStatus } from "@/lib/types";
import { RecordingControl } from "@/components/RecordingControl";
import { SystemStatus } from "@/components/SystemStatus";
import { MeetingCard } from "@/components/MeetingCard";
import { PipelineProgress } from "@/components/PipelineProgress";
import { toast } from "sonner";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Recording status (poll every 2s) ──────────────────────────────────────
  const { data: recordingStatus } = useQuery<RecordingStatus>({
    queryKey: ["recording-status"],
    queryFn: () => api.getRecordingStatus(),
    refetchInterval: 2000,
    retry: 1,
  });

  // ── Recent meetings ────────────────────────────────────────────────────────
  const { data: meetingsData } = useQuery<MeetingListResponse>({
    queryKey: ["meetings", 1, "", ""],
    queryFn: () => api.getMeetings(1),
    refetchInterval: 5000,
  });

  const recentMeetings = meetingsData?.items.slice(0, 5) ?? [];
  const activePipeline = recentMeetings.find(
    (m) => m.status === "transcribing" || m.status === "summarizing"
  );

  // ── Mutations ─────────────────────────────────────────────────────────────
  const startMutation = useMutation({
    mutationFn: (title?: string) => api.startRecording(title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recording-status"] });
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Recording started");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const stopMutation = useMutation({
    mutationFn: () => api.stopRecording(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recording-status"] });
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.info("Recording stopped — transcribing…");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteMeeting(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isRecording = recordingStatus?.is_recording ?? false;
  const isProcessing =
    !isRecording &&
    recentMeetings.some(
      (m) => m.status === "transcribing" || m.status === "summarizing"
    );

  return (
    <div className="page-in flex flex-col gap-8 p-6 md:p-10 max-w-7xl mx-auto w-full">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shrink-0">
          <LayoutDashboard className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground/95">Dashboard</h1>
          <p className="text-xs text-muted-foreground/60">Control · Live status · Recent meetings</p>
        </div>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:gap-8">

        {/* ── Left column ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <RecordingControl
            onStart={(title) => startMutation.mutateAsync(title).then(() => undefined)}
            onStop={() => stopMutation.mutateAsync().then(() => undefined)}
            isRecording={isRecording}
            elapsedSeconds={recordingStatus?.elapsed_s ?? null}
            isProcessing={isProcessing}
          />

          {activePipeline && <PipelineProgress meeting={activePipeline} />}

          {/* Recent meetings section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground/80 tracking-wide">Recent Meetings</h2>
              {recentMeetings.length > 0 && (
                <Link
                  href="/meetings"
                  className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-white/5"
                >
                  View all
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              )}
            </div>

            {recentMeetings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-8 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-muted bg-muted/30">
                  <span className="text-xl text-muted-foreground/30" aria-hidden="true">🎙</span>
                </div>
                <p className="text-sm text-muted-foreground/60">No meetings recorded yet.</p>
                <p className="text-xs text-muted-foreground/40">Start your first recording above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {recentMeetings.map((m) => (
                  <MeetingCard
                    key={m.id}
                    meeting={m}
                    compact
                    onClick={() => router.push(`/meetings/${m.id}`)}
                    onDelete={() => deleteMutation.mutate(m.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: System Status ────────────────────────────────── */}
        <div>
          <SystemStatus />
        </div>
      </div>
    </div>
  );
}
