"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Loader2, Server, Brain, Mic, HardDrive, Settings, Save } from "lucide-react";
import { api } from "@/lib/api";
import type { SystemHealth, SystemModels } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_PI_API_URL ?? "http://raspberrypi.local:8000";

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [ollamaModel, setOllamaModel] = useState("llama3:8b");
  // ── Default AI output language is English ─────────────────────────────────
  const [summaryLang, setSummaryLang] = useState("en");
  const [keepAudio, setKeepAudio] = useState(false);
  const [audioDevice, setAudioDevice] = useState("plughw:1,0");
  const [testingConn, setTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<boolean | null>(null);

  // Load saved settings from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    setApiUrl(localStorage.getItem("pi_api_url") ?? DEFAULT_API_URL);
    setOllamaModel(localStorage.getItem("ollama_model") ?? "llama3:8b");
    // Default to English if not previously saved
    setSummaryLang(localStorage.getItem("summary_lang") ?? "en");
    setKeepAudio(localStorage.getItem("keep_audio") === "true");
    setAudioDevice(localStorage.getItem("audio_device") ?? "plughw:1,0");
  }, []);

  const { data: models } = useQuery<SystemModels>({
    queryKey: ["system-models"],
    queryFn: () => api.getModels(),
    retry: 1,
  });

  const handleTestConnection = async () => {
    setTestingConn(true);
    setConnResult(null);
    try {
      const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/system/health`);
      const json = (await res.json()) as SystemHealth;
      setConnResult(json.status === "ok");
    } catch {
      setConnResult(false);
    } finally {
      setTestingConn(false);
    }
  };

  const handleSave = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem("pi_api_url", apiUrl);
    localStorage.setItem("ollama_model", ollamaModel);
    localStorage.setItem("summary_lang", summaryLang);
    localStorage.setItem("keep_audio", keepAudio ? "true" : "false");
    localStorage.setItem("audio_device", audioDevice);
    toast.success("Settings saved");
  };

  return (
    <div className="page-in flex flex-col gap-8 p-6 md:p-10 max-w-4xl mx-auto w-full">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shrink-0">
          <Settings className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground/95">Settings</h1>
          <p className="text-xs text-muted-foreground/60">MeetingPi system configuration</p>
        </div>
      </div>

      {/* ── Raspberry Pi Connection ──────────────────────────────────────── */}
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="border-b border-white/[0.06] bg-white/[0.02] py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <Server className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground/90">Raspberry Pi Connection</CardTitle>
              <CardDescription className="text-xs">Backend API URL</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="api-url"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60"
              >
                API URL
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                <Input
                  id="api-url"
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://raspberrypi.local:8000"
                  className="flex-1 border-white/[0.08] bg-black/20 font-mono text-sm focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] whitespace-nowrap"
                  onClick={() => void handleTestConnection()}
                  disabled={testingConn}
                  aria-label="Test connection"
                >
                  {testingConn ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : connResult === true ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  ) : connResult === false ? (
                    <X className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
                  ) : null}
                  Test
                </Button>
              </div>

              {connResult === true && (
                <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <p className="text-xs font-medium text-emerald-400">API connection established successfully</p>
                </div>
              )}
              {connResult === false && (
                <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2">
                  <X className="h-3.5 w-3.5 text-red-400 shrink-0" aria-hidden="true" />
                  <p className="text-xs font-medium text-red-400">Unable to reach the Raspberry Pi API</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── AI Models ───────────────────────────────────────────────────── */}
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="border-b border-white/[0.06] bg-white/[0.02] py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10">
              <Brain className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground/90">Artificial Intelligence</CardTitle>
              <CardDescription className="text-xs">Whisper and Ollama engines</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Ollama model */}
            <div>
              <label
                htmlFor="ollama-model"
                className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60"
              >
                <Brain className="h-3 w-3" aria-hidden="true" />
                Ollama Model (LLM)
              </label>
              <Select value={ollamaModel} onValueChange={(val) => setOllamaModel((val as string) ?? ollamaModel)}>
                <SelectTrigger id="ollama-model" className="border-white/[0.08] bg-black/20 font-mono text-sm">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models?.ollama_models_available.length
                    ? models.ollama_models_available.map((m) => (
                        <SelectItem key={m} value={m} className="font-mono text-sm">{m}</SelectItem>
                      ))
                    : [
                        <SelectItem key="llama3" value="llama3:8b" className="font-mono text-sm">llama3:8b</SelectItem>,
                        <SelectItem key="phi3" value="phi3:mini" className="font-mono text-sm">phi3:mini</SelectItem>,
                      ]}
                </SelectContent>
              </Select>
            </div>

            {/* Summary language — default English */}
            <div>
              <label
                htmlFor="summary-lang"
                className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60"
              >
                <Mic className="h-3 w-3" aria-hidden="true" />
                Summary language
              </label>
              <Select value={summaryLang} onValueChange={(val) => setSummaryLang((val as string) ?? summaryLang)}>
                <SelectTrigger id="summary-lang" className="border-white/[0.08] bg-black/20 text-sm">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 English (default)</SelectItem>
                  <SelectItem value="fr">🇫🇷 French</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground/50">
                The AI will generate summaries in this language.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Audio & Hardware ─────────────────────────────────────────────── */}
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="border-b border-white/[0.06] bg-white/[0.02] py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
              <HardDrive className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground/90">Hardware & Audio</CardTitle>
              <CardDescription className="text-xs">Capture device and audio archives</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="flex flex-col gap-5">
            {/* Keep audio toggle */}
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div>
                <p className="text-sm font-medium text-foreground/85">Keep raw audio archives</p>
                <p className="mt-0.5 text-xs text-muted-foreground/60">
                  <code className="font-mono text-[10px] bg-white/[0.06] px-1 py-0.5 rounded">.wav</code> files will be kept on disk after transcription.
                </p>
              </div>
              <Switch
                checked={keepAudio}
                onCheckedChange={setKeepAudio}
                aria-label="Keep audio files"
                className="data-[state=checked]:bg-primary ml-4 shrink-0"
              />
            </div>

            <Separator className="bg-white/[0.06]" />

            {/* ALSA device */}
            <div>
              <label
                htmlFor="audio-device"
                className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60"
              >
                <Mic className="h-3 w-3" aria-hidden="true" />
                ALSA capture device
              </label>
              <Input
                id="audio-device"
                type="text"
                value={audioDevice}
                onChange={(e) => setAudioDevice(e.target.value)}
                placeholder="plughw:1,0"
                className="max-w-xs border-white/[0.08] bg-black/20 font-mono text-sm focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <p className="mt-1.5 text-xs text-muted-foreground/50">
                ALSA identifier for the microphone (e.g. <code className="font-mono">plughw:1,0</code>).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Save button ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] pt-6">
        <p className="text-xs text-muted-foreground/50 mr-auto">
          Settings are stored locally in your browser.
        </p>
        <Button
          onClick={handleSave}
          aria-label="Save settings"
          className="h-10 gap-2 px-6 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
