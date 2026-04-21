"use client";

import { useState } from "react";
import { Copy, Check, Loader2, FileText, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptViewerProps {
  transcript: string | null;
  isLoading: boolean;
}

export function TranscriptViewer({ transcript, isLoading }: TranscriptViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!transcript) return;
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-muted bg-muted/30">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading transcript…" />
        </div>
        <p className="text-sm text-muted-foreground">Transcribing…</p>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-muted bg-muted/30">
          <FileText className="h-6 w-6 text-muted-foreground/40" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground">No transcript available.</p>
      </div>
    );
  }

  const charCount = transcript.length.toLocaleString("en-US");
  const wordCount = transcript.trim().split(/\s+/).length.toLocaleString("en-US");

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-black/20">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-3">
          <FileText className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Transcript
          </span>
          <span className="flex items-center gap-1 rounded-md bg-white/5 border border-white/[0.06] px-2 py-0.5 text-[10px] font-mono text-muted-foreground/50">
            <Hash className="h-2.5 w-2.5" aria-hidden="true" />
            {wordCount} words · {charCount} chars
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleCopy()}
          aria-label="Copy transcript"
          className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/10"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="h-[500px]">
        <pre className="p-5 font-mono text-sm text-foreground/85 whitespace-pre-wrap leading-7 tracking-wide">
          {transcript}
        </pre>
      </ScrollArea>
    </div>
  );
}
