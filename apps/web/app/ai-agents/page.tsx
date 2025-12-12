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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pulse-glow [animation-delay:0s]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pulse-glow [animation-delay:1s]" />
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
            <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur hover:border-primary/20 transition-all">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">AI Coding Agents</h2>
                    <p className="text-xs text-muted-foreground">Connect AI assistants to your workspaces</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(loadingAgents ? [1,2,3].map(n => ({ id: String(n), name: "", status: "disconnected" as const })) : agents).map((agent, idx) => (
                    <div key={agent.id || idx} className="flex items-center justify-between rounded-lg border border-border/50 bg-card/30 backdrop-blur px-5 py-4 hover:border-primary/30 hover-lift transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center text-primary transition-all">
                          <Bot className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{agent.name || "Loading..."}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">AI-powered code assistant</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusDot s={agent.status} />
                        <Button
                          size="sm"
                          variant={agent.status === "connected" ? "secondary" : "default"}
                          className={agent.status === "connected" ? "hover-scale transition-all" : "bg-primary hover:glow-primary hover-scale transition-all"}
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
            <Card className="border-border/50 bg-card/50 backdrop-blur hover:border-secondary/20 transition-all">
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <ServerCog className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">MCP Server</h2>
                    <p className="text-xs text-muted-foreground">Configure your server connection</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="mcpUrl" className="text-sm font-medium">MCP Server URL</Label>
                  <Input 
                    id="mcpUrl" 
                    placeholder="https://mcp.example.com" 
                    value={config.url} 
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    className="border-border/50 bg-card/30 backdrop-blur focus:border-secondary/50 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="mcpKey" className="text-sm font-medium">API Key</Label>
                  <Input 
                    id="mcpKey" 
                    type="password" 
                    placeholder="sk-••••••••••••••••" 
                    value={config.apiKey} 
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    className="border-border/50 bg-card/30 backdrop-blur focus:border-secondary/50 transition-all"
                  />
                </div>
                <div>
                  <Button 
                    onClick={saveConfig} 
                    disabled={savingConfig} 
                    className="w-full bg-gradient-to-r from-secondary to-secondary/80 hover:glow-secondary hover-lift transition-all"
                  >
                    {savingConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Configuration
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent configs */}
          <Card className="mt-6 border-border/50 bg-card/50 backdrop-blur">
            <div className="p-6 md:p-8">
              <h3 className="text-lg font-bold mb-4">Recent Configurations</h3>
              {recent.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <ServerCog className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No recent configurations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Configure your MCP server above to get started</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {recent.map((r, i) => (
                    <li key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card/30 hover:border-primary/30 transition-all">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                      <span className="text-sm text-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
