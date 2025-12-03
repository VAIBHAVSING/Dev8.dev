"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const WORKSPACE_STATUS_VALUES = [
  "running",
  "paused",
  "stopped",
  "creating",
  "starting",
  "stopping",
  "deleting",
  "error",
] as const;

type WorkspaceStatus = (typeof WORKSPACE_STATUS_VALUES)[number];
type WorkspaceAction = "start" | "pause" | "stop" | "delete";

type Workspace = {
  id: string;
  name: string;
  status: WorkspaceStatus;
  vsCodeUrl?: string | null;
};

type WorkspacePayload = {
  id?: string | number;
  name?: string;
  status?: string;
  vsCodeUrl?: string | null;
};

const ACTION_LABELS: Record<WorkspaceAction, string> = {
  start: "Start",
  pause: "Pause",
  stop: "Stop",
  delete: "Delete",
};

const ACTION_STYLES: Record<WorkspaceAction, string> = {
  start: "border-green-500/30 text-green-500 hover:bg-green-500/10",
  pause: "border-amber-500/30 text-amber-500 hover:bg-amber-500/10",
  stop: "border-rose-500/30 text-rose-500 hover:bg-rose-500/10",
  delete: "",
};

const STATUS_STYLES: Record<WorkspaceStatus, { label: string; color: string }> = {
  running: { label: "Running", color: "text-green-500" },
  paused: { label: "Paused", color: "text-amber-500" },
  stopped: { label: "Stopped", color: "text-muted-foreground" },
  creating: { label: "Creating", color: "text-blue-500" },
  starting: { label: "Starting", color: "text-blue-500" },
  stopping: { label: "Stopping", color: "text-amber-500" },
  deleting: { label: "Deleting", color: "text-rose-500" },
  error: { label: "Error", color: "text-rose-500" },
};

const normalizeStatus = (value?: string): WorkspaceStatus => {
  const normalized = (value || "stopped").toLowerCase();
  return WORKSPACE_STATUS_VALUES.includes(normalized as WorkspaceStatus)
    ? (normalized as WorkspaceStatus)
    : "stopped";
};

const PLACEHOLDER_WORKSPACES: Workspace[] = [
  { id: "placeholder-1", name: "Loading...", status: "starting" },
  { id: "placeholder-2", name: "Loading...", status: "starting" },
  { id: "placeholder-3", name: "Loading...", status: "starting" },
];

const buildActionRequest = (workspaceId: string, action: WorkspaceAction) => {
  switch (action) {
    case "start":
      return { endpoint: `/api/workspaces/${workspaceId}/start`, method: "POST" as const };
    case "pause":
      return { endpoint: `/api/workspaces/${workspaceId}/pause`, method: "POST" as const };
    case "stop":
      return { endpoint: `/api/workspaces/${workspaceId}/stop`, method: "POST" as const };
    case "delete":
      return { endpoint: `/api/workspaces/${workspaceId}`, method: "DELETE" as const };
    default:
      throw new Error("Unsupported action");
  }
};

const isActionDisabled = (
  action: WorkspaceAction,
  status: WorkspaceStatus,
  busyAction?: WorkspaceAction,
) => {
  if (busyAction) {
    return true;
  }

  switch (action) {
    case "start":
      return ["running", "starting", "creating"].includes(status);
    case "pause":
      return status !== "running";
    case "stop":
      return !["running", "paused"].includes(status);
    case "delete":
      return status === "deleting";
    default:
      return false;
  }
};

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
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingWs, setLoadingWs] = useState(true);
  const [actionBusy, setActionBusy] = useState<Record<string, WorkspaceAction | undefined>>({});

  const refreshWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to fetch workspaces");
      }
      const data = await res.json();
      const payloads: WorkspacePayload[] = Array.isArray(data.workspaces) ? data.workspaces : [];
      const normalized: Workspace[] = payloads.map((entry) => ({
        id: String(entry.id ?? crypto.randomUUID()),
        name: entry.name ?? "Workspace",
        status: normalizeStatus(entry.status),
        vsCodeUrl: entry.vsCodeUrl,
      }));
      setWorkspaces(normalized);
    } catch (error) {
      console.error("Failed to load workspaces:", error);
    } finally {
      setLoadingWs(false);
    }
  }, []);

  const handleWorkspaceAction = useCallback(
    async (workspace: Workspace, action: WorkspaceAction) => {
      const key = workspace.id.toString();
      setActionBusy((prev) => ({ ...prev, [key]: action }));

      try {
        if (action === "delete") {
          const confirmed = window.confirm(
            `Delete workspace "${workspace.name}"? This action cannot be undone.`,
          );
          if (!confirmed) {
            setActionBusy((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
            return;
          }
        }

        const { endpoint, method } = buildActionRequest(workspace.id, action);
        const response = await fetch(endpoint, { method });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.message || payload?.error || `Failed to ${action} workspace`);
        }

        await refreshWorkspaces();
      } catch (error) {
        console.error(`Failed to ${action} workspace:`, error);
        alert(`Failed to ${action} workspace: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setActionBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [refreshWorkspaces],
  );

  // Fetch dynamic workspaces and keep them fresh
  useEffect(() => {
    if (!session) return;

    let timer: ReturnType<typeof setInterval> | undefined;

    const bootstrap = async () => {
      await refreshWorkspaces();
      timer = setInterval(refreshWorkspaces, 10000);
    };

    bootstrap();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [session, refreshWorkspaces]);

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
            {(loadingWs ? PLACEHOLDER_WORKSPACES : workspaces).map((ws) => {
              const statusMeta = STATUS_STYLES[ws.status];
              const busyAction = actionBusy[ws.id];
              const isPlaceholder = ws.id.startsWith("placeholder-");
              const disableConnections = isPlaceholder || ws.status !== "running" || Boolean(busyAction);

              return (
                <Card key={ws.id} className="border-border bg-card/50 backdrop-blur">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{ws.name}</h3>
                        <p className="text-xs text-muted-foreground">ID: {ws.id}</p>
                      </div>
                      <p className={`text-sm font-medium ${statusMeta.color}`}>
                        {statusMeta.label}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {( ["start", "pause", "stop", "delete"] as WorkspaceAction[] ).map((action) => {
                        const disabled = isPlaceholder || isActionDisabled(action, ws.status, busyAction);
                        const isDelete = action === "delete";
                        return (
                          <Button
                            key={action}
                            size="sm"
                            variant={isDelete ? "destructive" : "outline"}
                            className={!isDelete ? `${ACTION_STYLES[action]} border` : undefined}
                            disabled={disabled}
                            onClick={() => {
                              if (isPlaceholder) return;
                              handleWorkspaceAction(ws, action);
                            }}
                          >
                            {busyAction === action ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              ACTION_LABELS[action]
                            )}
                          </Button>
                        );
                      })}
                    </div>

                    <div className="h-px my-4 bg-border" />

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (ws.vsCodeUrl) {
                            // Azure Container Apps doesn't support :port in URLs, strip :8080
                            const cleanUrl = ws.vsCodeUrl.replace(':8080', '');
                            console.log('Opening VSCode:', cleanUrl, '(original:', ws.vsCodeUrl, ')');
                            window.open(cleanUrl, '_blank');
                          } else {
                            alert('VSCode URL not available. Please ensure workspace is running.');
                          }
                        }}
                        className="flex-1"
                        disabled={disableConnections || !ws.vsCodeUrl}
                        title="Open VSCode in browser"
                      >
                        Open VSCode
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/workspaces/${ws.id}/details`);
                            if (res.ok) {
                              const data = await res.json();
                              const sshUrl = data.sshUrl || data.sshURL;
                              if (sshUrl) {
                                await navigator.clipboard.writeText(sshUrl);
                                alert('SSH URL copied to clipboard!');
                              } else {
                                alert('SSH URL not available');
                              }
                            } else {
                              alert('Failed to fetch workspace details');
                            }
                          } catch (e) {
                            console.error('Failed to copy SSH:', e);
                            alert('Failed to copy SSH URL');
                          }
                        }}
                        className="flex-1"
                        disabled={disableConnections}
                      >
                        Copy SSH
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
