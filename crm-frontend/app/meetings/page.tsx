"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2, Mic, Filter } from "lucide-react";
import { api } from "@/lib/api";
import type { MeetingListResponse } from "@/lib/types";
import { MeetingCard } from "@/components/MeetingCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses", dot: "bg-muted-foreground/40" },
  { value: "recording", label: "Recording", dot: "bg-red-500" },
  { value: "transcribing", label: "Transcribing", dot: "bg-amber-400" },
  { value: "summarizing", label: "Summarizing", dot: "bg-amber-400" },
  { value: "done", label: "Done", dot: "bg-emerald-500" },
  { value: "error", label: "Error", dot: "bg-red-500" },
];

export default function MeetingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const apiStatus = status === "all" ? "" : status;

  const { data, isLoading } = useQuery<MeetingListResponse>({
    queryKey: ["meetings", page, search, apiStatus],
    queryFn: () => api.getMeetings(page, search, apiStatus),
    refetchInterval: 10000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteMeeting(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting deleted");
      setConfirmDelete(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

  return (
    <div className="page-in flex flex-col gap-8 p-6 md:p-10 max-w-6xl mx-auto w-full">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shrink-0">
            <Mic className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground/95">Meetings</h1>
            <p className="text-xs text-muted-foreground/60">Full history · Search · Export</p>
          </div>
        </div>
        {data && (
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            {data.total} meeting{data.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title…"
            aria-label="Search meetings"
            className="pl-10 h-10 border-white/[0.08] bg-white/[0.03] focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
          <Select
            value={status}
            onValueChange={(val) => {
              setStatus((val as string) ?? "all");
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Filter by status"
              className="w-[180px] h-10 border-white/[0.08] bg-white/[0.03]"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${o.dot}`} aria-hidden="true" />
                    {o.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Meetings table ───────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        {/* Table head */}
        <div className="grid grid-cols-[1fr_140px_80px_110px_80px] items-center gap-4 border-b border-white/[0.06] bg-white/[0.03] px-5 py-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">Title</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">Date</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">Duration</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">Status</span>
          <span className="text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">Actions</span>
        </div>

        {/* Table body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" aria-label="Loading meetings…" />
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-3xl" aria-hidden="true">🎙</span>
            <p className="text-sm text-muted-foreground/60">
              {search || status !== "all" ? "No results for these filters." : "No meetings recorded yet."}
            </p>
          </div>
        ) : (
          data.items.map((m) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onClick={() => router.push(`/meetings/${m.id}`)}
              onDelete={() => setConfirmDelete(m.id)}
            />
          ))
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
            className="h-8 gap-1 border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Previous
          </Button>
          <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
            className="h-8 gap-1 border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* ── Delete confirmation modal ─────────────────────────────────── */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The audio recording, transcript and summary will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
              onClick={(e) => {
                e.preventDefault();
                if (confirmDelete) deleteMutation.mutate(confirmDelete);
              }}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
