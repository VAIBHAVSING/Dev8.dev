"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, BarChart3, Users2, Cpu, Database, Network } from "lucide-react";

type Summary = {
  activeUsers: number;
  builds: number;
  errors: number;
  cpu: number; // percent
  memory: number; // percent
  network: number; // Mbps
};

type ReportingResponse = {
  range: string;
  summary: Summary;
  topProjects: { name: string; usage: number }[];
  timeseries: {
    cpu: { t: number; v: number }[];
    mem: { t: number; v: number }[];
    net: { t: number; v: number }[];
    builds: { t: number; v: number }[];
    errors: { t: number; v: number }[];
  };
  updatedAt: number;
};

const ranges = [
  { key: "last_24h", label: "Last 24h" },
  { key: "last_7d", label: "Last 7d" },
  { key: "last_30d", label: "Last 30d" },
  { key: "this_month", label: "This month" },
] as const;

export default function ReportingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState<(typeof ranges)[number]["key"]>("last_7d");
  const [data, setData] = useState<ReportingResponse | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/signin");
  }, [session, status, router]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    async function load() {
      try {
        const res = await fetch(`/api/reporting?range=${range}`, { cache: "no-store" });
        const j = (await res.json()) as ReportingResponse;
        setData(j);
      } catch (e) {
        console.error(e);
      }
    }
    if (session) {
      load();
      timer = setInterval(load, 10000);
    }
    return () => timer && clearInterval(timer);
  }, [session, range]);

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg text-muted-foreground">Loading reporting...</div>
        </div>
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 -z-10 grid-background opacity-20" />
      <Sidebar />
      <main className="ml-64 min-h-screen transition-all duration-300">
        <div className="container mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Reporting</h1>
            <div className="flex items-center gap-2">
              {ranges.map((r) => (
                <Button
                  key={r.key}
                  variant={range === r.key ? "default" : "outline"}
                  onClick={() => setRange(r.key)}
                  className={range === r.key ? "bg-gradient-to-r from-primary to-secondary" : ""}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data?.summary.activeUsers ?? "—"}</div>
                <p className="text-xs text-muted-foreground">Unique across selected range</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Builds</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data?.summary.builds ?? "—"}</div>
                <p className="text-xs text-muted-foreground">Triggered pipelines</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <Activity className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data?.summary.errors ?? "—"}</div>
                <p className="text-xs text-muted-foreground">Across services</p>
              </CardContent>
            </Card>
          </div>

          {/* Resource cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><Cpu className="h-4 w-4" />CPU</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data?.summary.cpu ?? "—"}%</div>
                <p className="text-xs text-muted-foreground">Avg utilization</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><Database className="h-4 w-4" />Memory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data?.summary.memory ?? "—"}%</div>
                <p className="text-xs text-muted-foreground">Avg utilization</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><Network className="h-4 w-4" />Network</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data?.summary.network ?? "—"} Mbps</div>
                <p className="text-xs text-muted-foreground">Avg throughput</p>
              </CardContent>
            </Card>
          </div>

          {/* Top projects + builds spark */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Projects by Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.topProjects?.map((p) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        <div className="text-sm">{p.name}</div>
                      </div>
                      <Badge variant="secondary" className="bg-secondary/20">{p.usage}%</Badge>
                    </div>
                  )) || <div className="text-sm text-muted-foreground">No data</div>}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Builds Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-28 w-full flex items-end gap-1">
                  {data?.timeseries.builds.slice(-60).map((p, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/60"
                      style={{ height: `${Math.min(100, 10 + (p.v / 30) * 100)}%` }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Lightweight spark bars (no chart lib)</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
