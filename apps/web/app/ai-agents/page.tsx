"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, ServerCog, Loader2 } from "lucide-react";



interface Agent {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "warning";
}

interface McpConfig {
  url: string;
  apiKey: string;
}

export default function AiAgentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [savingAgentId, setSavingAgentId] = useState<string | null>(null);

  const [config, setConfig] = useState<McpConfig>({ url: "", apiKey: "" });
  const [savingConfig, setSavingConfig] = useState(false);

  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/signin");
  }, [status, session, router]);

  // Fetch dynamic data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingAgents(true);
        const [a, c] = await Promise.all([
          fetch("/api/ai/agents").then((r) => r.json()),
          fetch("/api/ai/mcp-config").then((r) => r.json()),
        ]);
        setAgents(a.agents ?? []);
        setConfig({ url: c.url ?? "", apiKey: c.apiKey ?? "" });
        setRecent(c.recent ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAgents(false);
      }
    }
    if (mounted) fetchData();
  }, [mounted]);

  async function toggleAgent(agent: Agent) {
    setSavingAgentId(agent.id);
    try {
      const res = await fetch("/api/ai/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agent.id, action: agent.status === "connected" ? "disconnect" : "connect" }),
      });
      const data = await res.json();
      setAgents(data.agents);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAgentId(null);
    }
  }

  async function saveConfig() {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/ai/mcp-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setRecent(data.recent ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingConfig(false);
    }
  }

  function StatusDot({ s }: { s: Agent["status"] }) {
    const color = s === "connected" ? "bg-emerald-500" : s === "warning" ? "bg-amber-500" : "bg-rose-500";
    return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
  }

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg text-muted-foreground">Loading AI Agents...</div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 -z-10 grid-background opacity-20" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      <Sidebar />

      <main className="ml-64 min-h-screen transition-all duration-300">
        <div className="container mx-auto px-8 py-8">
          {/* Header area to mirror dashboard top spacing */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">AI Agents</h1>
            <div className="flex items-center gap-3">
              <button className="h-9 w-9 rounded-md bg-card border border-border flex items-center justify-center text-muted-foreground">🔔</button>
              <div className="h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground">R</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Agents list (2 cols) */}
            <Card className="lg:col-span-2 border-border bg-card/50">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-medium">AI Coding Agents</h2>
                </div>

                <div className="space-y-4">
                  {(loadingAgents ? [1,2,3].map(n => ({ id: String(n), name: "", status: "disconnected" as const })) : agents).map((agent, idx) => (
                    <div key={agent.id || idx} className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{agent.name || "Loading..."}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusDot s={agent.status} />
                        <Button
                          size="sm"
                          variant={agent.status === "connected" ? "secondary" : "default"}
                          className={agent.status === "connected" ? "" : "bg-primary"}
                          onClick={() => toggleAgent(agent)}
                          disabled={savingAgentId === agent.id || loadingAgents}
                        >
                          {savingAgentId === agent.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : agent.status === "connected" ? (
                            "Disconnect"
                          ) : (
                            "Connect"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Right: MCP server config */}
            <Card className="border-border bg-card/50">
              <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <ServerCog className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-medium">MCP Server Configuration</h2>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mcpUrl">MCP Server URL</Label>
                  <Input id="mcpUrl" placeholder="https://..." value={config.url} onChange={(e) => setConfig({ ...config, url: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mcpKey">API Key</Label>
                  <Input id="mcpKey" type="password" placeholder="••••••••" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} />
                </div>
                <div>
                  <Button onClick={saveConfig} disabled={savingConfig} className="bg-primary">
                    {savingConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Configuration
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent configs */}
          <Card className="mt-6 border-border bg-card/50">
            <div className="p-4 md:p-6">
              <h3 className="text-sm font-medium mb-3">Recent MCP Server Configurations</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {recent.length === 0 ? (
                  <li>No recent configurations.</li>
                ) : (
                  recent.map((r, i) => <li key={i}>{r}</li>)
                )}
              </ul>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
