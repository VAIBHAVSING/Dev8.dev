"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Code,
  GitBranch,
  Terminal,
  Zap,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/signin");
  }, [session, status, router]);

  // Workspace data hooks must be declared before any return to keep hook order stable
  type Workspace = { id: string | number; name: string; status: "running" | "stopped" };
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingWs, setLoadingWs] = useState(true);

  // Fetch dynamic workspaces and keep them fresh
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    async function load() {
      try {
        const res = await fetch("/api/workspaces", { cache: "no-store" });
        const j = await res.json();
        setWorkspaces(j.workspaces ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingWs(false);
      }
    }
    if (session) {
      load();
      timer = setInterval(load, 10000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [session]);

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg text-muted-foreground">Loading your workspace...</div>
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
          {/* Top bar with search + new workspace */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4 w-full max-w-2xl">
              <div className="relative w-full">
                <input
                  aria-label="Search workspaces"
                  placeholder="Search workspaces..."
                  className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={() => router.push("/workspaces/new")} className="bg-gradient-to-r from-primary to-secondary">
                + New Workspace
              </Button>
              <button className="h-9 w-9 rounded-md bg-card border border-border flex items-center justify-center text-muted-foreground">
                <span>🔔</span>
              </button>
              <div className="h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground">R</div>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-semibold mb-4">Your Workspaces</h2>

          {/* Workspace cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {(loadingWs ? [1,2,3].map(n => ({ id: n, name: "Loading...", status: "running" as const })) : workspaces).map((ws) => (
              <Card key={ws.id} className="border-border bg-card/50 backdrop-blur">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{ws.name}</h3>
                      <p className={`text-sm mt-1 ${ws.status === "running" ? "text-green-500" : "text-rose-500"}`}>
                        {ws.status === "running" ? "Running" : "Stopped"}
                      </p>
                    </div>
                  </div>

                  <div className="h-px my-4 bg-border" />

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <button onClick={() => router.push(`/workspaces/${ws.id}/ide`)} className="text-primary hover:underline">Open IDE</button>
                      <button
                        onClick={async () => {
                          try {
                            const endpoint = ws.status === 'running' 
                              ? `/api/workspaces/${ws.id}/stop` 
                              : `/api/workspaces/${ws.id}/start`;
                            const res = await fetch(endpoint, { method: 'POST' });
                            if (res.ok) {
                              // Reload workspaces
                              const wsRes = await fetch("/api/workspaces", { cache: "no-store" });
                              const j = await wsRes.json();
                              setWorkspaces(j.workspaces ?? []);
                            }
                          } catch (e) {
                            console.error('Failed to toggle workspace:', e);
                          }
                        }}
                        className="hover:underline"
                      >
                        {ws.status === 'running' ? 'Stop' : 'Start'}
                      </button>
                      <button
                        onClick={async () => { 
                          try {
                            const res = await fetch(`/api/workspaces/${ws.id}/clone`, { method: 'POST' });
                            if (res.ok) {
                              // Reload workspaces to show the new clone
                              const wsRes = await fetch("/api/workspaces", { cache: "no-store" });
                              const j = await wsRes.json();
                              setWorkspaces(j.workspaces ?? []);
                              alert('Workspace cloned successfully!');
                            } else {
                              const error = await res.json();
                              alert(`Failed to clone workspace: ${error.message || 'Unknown error'}`);
                            }
                          } catch (e) {
                            console.error('Failed to clone workspace:', e);
                            alert('Failed to clone workspace');
                          }
                        }}
                        className="hover:underline"
                      >
                        Clone
                      </button>
                      <button
                        onClick={async () => { 
                          if (!confirm(`Are you sure you want to delete "${ws.name}"?`)) return;
                          try {
                            const res = await fetch(`/api/workspaces/${ws.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              // Remove from list
                              setWorkspaces(workspaces.filter(w => w.id !== ws.id));
                            } else {
                              alert('Failed to delete workspace');
                            }
                          } catch (e) {
                            console.error('Failed to delete workspace:', e);
                            alert('Failed to delete workspace');
                          }
                        }}
                        className="text-rose-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground">&nbsp;</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Two panels below */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border bg-card/50 px-4 py-6">
              <h3 className="text-lg font-semibold">Create a Custom Template</h3>
              <p className="text-sm text-muted-foreground mt-2">Build a base environment with your preferred tools and dotfiles.</p>
              <div className="mt-4">
                <Button onClick={() => router.push('/templates/new')} className="bg-gradient-to-r from-primary to-secondary">
                  Build Template
                </Button>
              </div>
            </Card>

            <Card className="border-border bg-card/50 px-4 py-6">
              <h3 className="text-lg font-semibold">Start from a Repository</h3>
              <p className="text-sm text-muted-foreground mt-2">Create a new workspace directly from a Git repository URL.</p>
              <div className="mt-4 flex gap-2">
                <input placeholder="Paste a Git Repository URL..." className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
                <Button variant="outline" disabled className="opacity-60">Create</Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
