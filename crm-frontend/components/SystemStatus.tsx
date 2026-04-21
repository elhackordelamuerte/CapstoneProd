"use client";

import { clsx } from "clsx";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SystemStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Cpu, HardDrive, Thermometer, Server, Zap, Brain, WifiOff } from "lucide-react";

interface SystemStatusProps {
  compact?: boolean;
}

interface BarProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  max: number;
  unit: string;
  warn?: number;
  danger?: number;
}

function StatBar({ label, icon, value, max, unit, warn = 75, danger = 90 }: BarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const isDanger = pct >= danger;
  const isWarn = pct >= warn;

  const barColor = isDanger ? "bg-red-500" : isWarn ? "bg-amber-400" : "bg-emerald-500";
  const textColor = isDanger ? "text-red-400" : isWarn ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground/70">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <span className={clsx("font-mono font-semibold", textColor)}>
          {value.toFixed(unit === "%" ? 1 : 0)}{unit}
          {unit !== "%" && (
            <span className="text-muted-foreground/50 font-normal">
              /{max.toFixed(0)}{unit}
            </span>
          )}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={clsx("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}

interface ServicePillProps {
  label: string;
  icon: React.ReactNode;
  available: boolean;
}

function ServicePill({ label, icon, available }: ServicePillProps) {
  return (
    <div className={clsx(
      "flex items-center justify-between rounded-lg border px-3 py-2",
      available
        ? "border-emerald-500/20 bg-emerald-500/[0.07]"
        : "border-red-500/20 bg-red-500/[0.07]"
    )}>
      <div className="flex items-center gap-2">
        <span className={available ? "text-emerald-400" : "text-red-400"}>{icon}</span>
        <span className="text-xs font-medium text-foreground/80">{label}</span>
      </div>
      <span className={clsx(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        available ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
      )}>
        <span className={clsx("h-1 w-1 rounded-full", available ? "bg-emerald-400 animate-pulse" : "bg-red-400")} aria-hidden="true" />
        {available ? "Online" : "Offline"}
      </span>
    </div>
  );
}

function formatUptime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

export function SystemStatus({ compact = false }: SystemStatusProps) {
  const { data, isError } = useQuery<SystemStats>({
    queryKey: ["system-stats"],
    queryFn: () => api.getStats(),
    refetchInterval: 5000,
    retry: 1,
  });

  /* ── Compact dot (sidebar footer) ──────────────────────────────── */
  if (compact) {
    return (
      <div className="flex items-center gap-2.5 text-xs w-full">
        <span
          className={clsx(
            "h-2 w-2 shrink-0 rounded-full",
            isError
              ? "bg-red-500"
              : data
                ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                : "bg-muted-foreground/40"
          )}
          aria-hidden="true"
        />
        {isError ? (
          <span className="text-red-400 font-medium">Pi unreachable</span>
        ) : data ? (
          <span className="text-muted-foreground/80 font-medium truncate">
            CPU {data.cpu_percent.toFixed(0)}%
            {data.temperature_c != null && ` · ${data.temperature_c}°C`}
            {" · "}
            <span className="text-emerald-400/80">Online</span>
          </span>
        ) : (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/50" />
        )}
      </div>
    );
  }

  /* ── Error state ────────────────────────────────────────────────── */
  if (isError) {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
            <WifiOff className="h-6 w-6 text-red-400" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-red-400">Pi unreachable</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Check the URL in settings and ensure the backend is running.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ── Loading ────────────────────────────────────────────────────── */
  if (!data) {
    return (
      <Card className="glass-panel">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" aria-label="Loading system stats…" />
        </CardContent>
      </Card>
    );
  }

  /* ── Full card ──────────────────────────────────────────────────── */
  return (
    <Card className="glass-panel relative overflow-hidden">
      <div className="absolute top-0 right-0 h-48 w-48 bg-primary/5 blur-[80px] rounded-full pointer-events-none" aria-hidden="true" />

      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
            <span className="text-sm font-bold tracking-tight text-foreground/90">Raspberry Pi</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Connected</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 flex flex-col gap-5">
        {/* Resource bars */}
        <div className="flex flex-col gap-4">
          <StatBar label="CPU" icon={<Cpu className="h-3 w-3" aria-hidden="true" />} value={data.cpu_percent} max={100} unit="%" warn={70} danger={90} />
          <StatBar label="RAM" icon={<Zap className="h-3 w-3" aria-hidden="true" />} value={data.ram_used_mb / 1024} max={data.ram_total_mb / 1024} unit="GB" warn={75} danger={90} />
          <StatBar label="Disk" icon={<HardDrive className="h-3 w-3" aria-hidden="true" />} value={data.disk_used_gb} max={data.disk_total_gb} unit="GB" warn={80} danger={95} />
        </div>

        {/* Temperature + uptime */}
        {(data.temperature_c != null || data.uptime_s != null) && (
          <div className="grid grid-cols-2 gap-2">
            {data.temperature_c != null && (
              <div className={clsx(
                "flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5",
                data.temperature_c >= 80 ? "border-red-500/20 bg-red-500/[0.07]"
                  : data.temperature_c >= 65 ? "border-amber-400/20 bg-amber-400/[0.07]"
                    : "border-emerald-500/20 bg-emerald-500/[0.07]"
              )}>
                <Thermometer className={clsx(
                  "h-4 w-4",
                  data.temperature_c >= 80 ? "text-red-400" : data.temperature_c >= 65 ? "text-amber-400" : "text-emerald-400"
                )} aria-hidden="true" />
                <span className={clsx(
                  "font-mono text-lg font-bold leading-none",
                  data.temperature_c >= 80 ? "text-red-400" : data.temperature_c >= 65 ? "text-amber-400" : "text-emerald-400"
                )}>
                  {data.temperature_c}°
                </span>
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Temp.</span>
              </div>
            )}
            {data.uptime_s != null && (
              <div className="flex flex-col items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                <Server className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
                <span className="font-mono text-sm font-bold text-foreground/80 leading-none">
                  {formatUptime(data.uptime_s)}
                </span>
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Uptime</span>
              </div>
            )}
          </div>
        )}

        {/* Service pills */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-0.5">AI Services</p>
          <ServicePill label="Whisper" icon={<Cpu className="h-3.5 w-3.5" aria-hidden="true" />} available={data.whisper_available} />
          <ServicePill label="Ollama LLM" icon={<Brain className="h-3.5 w-3.5" aria-hidden="true" />} available={data.ollama_available} />
        </div>
      </CardContent>
    </Card>
  );
}
