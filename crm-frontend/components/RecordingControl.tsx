"use client";

import { clsx } from "clsx";
import { Mic, Square, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RecordingControlProps {
  onStart: (title?: string) => Promise<void>;
  onStop: () => Promise<void>;
  isRecording: boolean;
  elapsedSeconds: number | null;
  isProcessing: boolean;
}

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0)
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function WaveformBars() {
  return (
    <div className="flex items-center gap-0.5 h-6 text-red-500/80" aria-hidden="true">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="waveform-bar" />
      ))}
    </div>
  );
}

export function RecordingControl({
  onStart,
  onStop,
  isRecording,
  elapsedSeconds,
  isProcessing,
}: RecordingControlProps) {
  const [inputTitle, setInputTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [localElapsed, setLocalElapsed] = useState(elapsedSeconds ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (elapsedSeconds !== null) setLocalElapsed(elapsedSeconds);
  }, [elapsedSeconds]);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setLocalElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setLocalElapsed(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording]);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await onStart(inputTitle.trim() || undefined);
      setInputTitle("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await onStop();
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Processing state ─────────────────────────────────────────── */
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-amber-500/5 px-8 py-10 backdrop-blur-md shadow-[0_0_60px_-15px_rgba(245,158,11,0.25)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" aria-label="Processing…" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-amber-400 tracking-wide">Pipeline running…</p>
          <p className="mt-1 text-xs text-amber-400/60">Transcribing and generating summary</p>
        </div>
      </div>
    );
  }

  /* ── Recording state ──────────────────────────────────────────── */
  if (isRecording) {
    return (
      <div className="recording-glow relative overflow-hidden rounded-2xl border border-red-500/25 bg-gradient-to-b from-red-950/60 to-red-950/20 px-8 py-10 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/8 to-transparent pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Live indicator row */}
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse"
              aria-label="Recording active"
            />
            <span className="text-xs font-bold tracking-[0.25em] text-red-400/90 uppercase">Live</span>
            <WaveformBars />
          </div>

          {/* Timer */}
          <div className="text-center">
            <span className="font-mono text-6xl font-extrabold tracking-tighter text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              {formatTime(localElapsed)}
            </span>
          </div>

          {/* Stop button */}
          <Button
            variant="destructive"
            size="lg"
            onClick={() => void handleStop()}
            disabled={isLoading}
            aria-label="Stop recording"
            className="h-12 min-w-[200px] gap-2 font-semibold shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5 hover:shadow-red-500/30"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Square className="h-4 w-4" aria-hidden="true" />
            )}
            Stop Recording
          </Button>
        </div>
      </div>
    );
  }

  /* ── Idle state ───────────────────────────────────────────────── */
  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl px-8 py-10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Mic icon hero */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/10 transition-transform duration-300 hover:scale-105">
          <Mic className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>

        <div className="text-center">
          <p className="text-base font-semibold text-foreground/90">Ready to record</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Add a title then start recording</p>
        </div>

        {/* Title input */}
        <div className="w-full max-w-sm">
          <label
            htmlFor="recording-title"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70"
          >
            Title (optional)
          </label>
          <Input
            id="recording-title"
            type="text"
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            placeholder="e.g. Sprint Review Week 14"
            className="h-10 border-white/10 bg-black/20 font-medium placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleStart();
            }}
          />
        </div>

        {/* Start button */}
        <Button
          size="lg"
          onClick={() => void handleStart()}
          disabled={isLoading}
          aria-label="Start recording"
          className="h-12 min-w-[200px] gap-2 bg-primary font-semibold shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-primary/40 hover:bg-primary/90"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mic className="h-4 w-4" aria-hidden="true" />
          )}
          Start Recording
        </Button>
      </div>
    </div>
  );
}
