"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Square, RotateCw } from "lucide-react";
import { CodeEditor } from "@/components/ide/CodeEditor";
import { SandboxRunner, SandboxRunnerHandle } from "@/components/ide/SandboxRunner";
import prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import pluginEstree from "prettier/plugins/estree";
import parserTypescript from "prettier/plugins/typescript";

type Details = {
  id: string;
  name: string;
  provider: string;
  size: string;
  region: string;
  status: "running" | "stopped";
  assistant: { tips: string[]; note: string };
  updatedAt: number;
};
type Metrics = {
  cpu: number;
  memory: { usedGb: number; totalGb: number };
  disk: { usedGb: number; totalGb: number };
  network: { inMb: number; outMb: number };
  updatedAt: number;
};

export default function WorkspaceIDEPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [details, setDetails] = useState<Details | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [terminal, setTerminal] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<Array<{ id: string; createdAt: number; location: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<"start" | "stop" | "restart" | null>(null);
  const [language, setLanguage] = useState<"javascript" | "typescript">("javascript");
  const [code, setCode] = useState<string>(
    `// Welcome to CloudIDEX web IDE\n` +
    `// Click Run to execute.\n` +
    `function greet(name){ return 'Hello, ' + name + '!'; }\n` +
    `console.log(greet('world'));\n`
  );
  const runnerRef = useRef<SandboxRunnerHandle>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/signin");
  }, [status, session, router]);

  const loadAll = useCallback(async (signal?: AbortSignal) => {
    if (!id) return;
    try {
      const [d, m, t, s] = await Promise.all([
        fetch(`/api/workspaces/${id}/details`, { cache: "no-store", signal }).then(async (r) => {
          if (!r.ok) throw new Error(`details ${r.status}`);
          return r.json();
        }),
        fetch(`/api/workspaces/${id}/metrics`, { cache: "no-store", signal }).then(async (r) => {
          if (!r.ok) throw new Error(`metrics ${r.status}`);
          return r.json();
        }),
        fetch(`/api/workspaces/${id}/terminal`, { cache: "no-store", signal }).then(async (r) => {
          if (!r.ok) throw new Error(`terminal ${r.status}`);
          return r.json();
        }),
        fetch(`/api/workspaces/${id}/snapshots`, { cache: "no-store", signal }).then(async (r) => {
          if (!r.ok) throw new Error(`snapshots ${r.status}`);
          return r.json();
        }),
      ]);
      setDetails(d);
      setMetrics(m);
      setTerminal(Array.isArray(t?.lines) ? t.lines : []);
      setSnapshots(Array.isArray(s?.snapshots) ? s.snapshots : []);
    } catch (e: unknown) {
      // Ignore abort errors caused by effect cleanup or route changes
      const error = e as { name?: string };
      if (error?.name === "AbortError" || (typeof DOMException !== "undefined" && e instanceof DOMException)) return;
      console.error("IDE loadAll error", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id || status !== "authenticated") return;
    const controller = new AbortController();
    loadAll(controller.signal);
    const timer = setInterval(() => loadAll(controller.signal), 5000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [id, status, loadAll]);

  async function doAction(action: "start" | "stop" | "restart") {
    setActing(action);
    try {
      await fetch(`/api/workspaces/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await loadAll();
    } finally {
      setActing(null);
    }
  }

  async function createSnapshot() {
    await fetch(`/api/workspaces/${id}/snapshots`, { method: "POST" });
    const s = await fetch(`/api/workspaces/${id}/snapshots`, { cache: "no-store" }).then((r) => r.json());
    setSnapshots(s.snapshots);
  }

  function appendTerminal(line: string) {
    setTerminal((prev) => [...prev, line].slice(-120));
  }

  function runCode() {
    appendTerminal(`$ Running (${language})...`);
    runnerRef.current?.run(code, language);
  }

  async function formatCode() {
    try {
      const parser = language === "typescript" ? "typescript" : "babel";
      const plugins = parser === "typescript" ? [parserTypescript, pluginEstree] : [parserBabel, pluginEstree];
      const formatted = await prettier.format(code, { parser, plugins });
      setCode(formatted);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      appendTerminal(`format error: ${message}`);
    }
  }

  if (status === "loading" || loading || !details || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Opening workspace IDE...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 -z-10 grid-background opacity-20" />
      <Sidebar />

      <main className="ml-64 min-h-screen transition-all duration-300">
        <div className="container mx-auto px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Workspace: <span className="text-foreground font-medium">{details.name}</span> ({details.provider.toUpperCase()} {details.size} • {details.region})
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => doAction("restart")} disabled={!!acting}><RotateCw className="h-4 w-4 mr-1"/> Restart</Button>
              {details.status === "running" ? (
                <Button variant="destructive" onClick={() => doAction("stop")} disabled={!!acting}><Square className="h-4 w-4 mr-1"/> Stop</Button>
              ) : (
                <Button onClick={() => doAction("start")} disabled={!!acting}><Play className="h-4 w-4 mr-1"/> Start</Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Editor */}
            <Card className="xl:col-span-2 border-border bg-card/50">
              <div className="p-3 md:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Language</span>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value === "typescript" ? "typescript" : "javascript")}
                      className="h-7 rounded border border-border bg-background px-2 text-xs"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={formatCode} className="h-8 px-3">Format</Button>
                    <Button onClick={runCode} className="h-8 px-3 bg-primary"><Play className="h-4 w-4 mr-1"/> Run</Button>
                  </div>
                </div>
                <CodeEditor value={code} language={language} onChange={setCode} height={420} />
                <SandboxRunner ref={runnerRef} className="hidden" onLog={(l) => appendTerminal(l)} />
              </div>
            </Card>

            {/* System Metrics + Snapshots */}
            <div className="space-y-6">
              <Card className="border-border bg-card/50">
                <div className="p-4 md:p-6 space-y-1">
                  <div className="text-sm font-medium">System Metrics</div>
                  <div className="text-xs text-muted-foreground">CPU: {metrics.cpu}%</div>
                  <div className="text-xs text-muted-foreground">Memory: {metrics.memory.usedGb}GB / {metrics.memory.totalGb}GB</div>
                  <div className="text-xs text-muted-foreground">Disk: {metrics.disk.usedGb}GB / {metrics.disk.totalGb}GB</div>
                  <div className="text-xs text-muted-foreground">Network: {metrics.network.inMb}MB/s | {metrics.network.outMb}MB/s</div>
                </div>
              </Card>

              <Card className="border-border bg-card/50">
                <div className="p-4 md:p-6 space-y-3">
                  <div className="text-sm font-medium">Snapshots & Backups</div>
                  <div className="text-xs text-muted-foreground">Last snapshot: {snapshots[0] ? new Date(snapshots[0].createdAt).toLocaleTimeString() : "—"}</div>
                  <div className="text-xs text-muted-foreground">Next auto-backup: 3 hrs</div>
                  <Button variant="outline" onClick={createSnapshot}>Create Snapshot</Button>
                </div>
              </Card>

              <Card className="border-border bg-card/50">
                <div className="p-4 md:p-6 space-y-2">
                  <div className="text-sm font-medium">AI Assistant</div>
                  <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                    {details.assistant.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                  <div className="text-[11px] text-muted-foreground/80">💡 {details.assistant.note}</div>
                </div>
              </Card>
            </div>
          </div>

          {/* Terminal */}
          <div className="mt-6">
            <Card className="border-border bg-card/50">
              <div className="p-4">
                <div className="text-sm font-medium mb-2">Terminal</div>
                <div className="h-48 overflow-auto rounded-md bg-slate-900/80 text-slate-100 text-xs p-3 font-mono">
                  {terminal.map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
