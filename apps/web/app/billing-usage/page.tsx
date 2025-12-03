"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Database, Cpu, Globe2 } from "lucide-react";

interface BillingData {
  monthTotal: number;
  computeCost: number;
  storageCost: number;
  networkCost: number;
  cycle: { start: string; end: string };
  computeUsage: { instances: number; vcpuHours: number; gpuHours: number; region: string };
  storageUsage: { totalGb: number; snapshots: number; avgOpsPerDay: number };
  networkUsage: { dataOutGb: number; bandwidthMb: number; regionsActive: number };
  details: { plan: string; accountEmail: string; payment: string; nextInvoice: string };
  updatedAt: string;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default function BillingUsagePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/signin");
  }, [status, session, router]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    async function load() {
      try {
        const res = await fetch("/api/billing", { cache: "no-store" });
        const j = (await res.json()) as BillingData;
        setData(j);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") {
      load();
      timer = setInterval(load, 10000); // realtime-ish polling
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading billing data...
        </div>
      </div>
    );
  }

  if (!session || !data) return null;

  async function downloadInvoice() {
    try {
      const res = await fetch("/api/billing/invoice", { method: "GET" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${new Date().toISOString().slice(0, 7)}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Could not download invoice.");
    }
  }

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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-muted-foreground">Cloud-IDEX → Billing / Usage Dashboard</div>
            <div className="flex items-center gap-3">
              <button className="h-9 w-9 rounded-md bg-card border border-border flex items-center justify-center text-muted-foreground">🔔</button>
              <div className="h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground">R</div>
            </div>
          </div>

          {/* Monthly Billing Summary & Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2 border-border bg-card/50">
              <div className="p-4 md:p-6 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="h-4 w-4 text-primary" /> Monthly Billing Summary
                </div>
                <div className="text-lg font-semibold text-foreground">
                  Total Cost (This Month): <span className="text-primary">{inr.format(data.monthTotal)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  • Compute: {inr.format(data.computeCost)} • Storage: {inr.format(data.storageCost)} • Network: {inr.format(data.networkCost)}
                </div>
                <div className="text-xs text-muted-foreground">Billing Cycle: {data.cycle.start} – {data.cycle.end}</div>
              </div>
            </Card>
            <Card className="border-border bg-card/50">
              <div className="p-4 md:p-6">
                <div className="text-sm font-medium mb-2">Cost Trend (Last 6 Months)</div>
                <div className="h-24 rounded-md border border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">Bar / Line Chart Placeholder</div>
              </div>
            </Card>
          </div>

          {/* Usage Breakdown by Resource */}
          <div className="mb-3 text-sm font-medium flex items-center gap-2">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-border">📊</span>
            Usage Breakdown by Resource
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Card className="border-border bg-card/50">
              <div className="p-4 md:p-6 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium"><Cpu className="h-4 w-4 text-primary" /> Compute Usage</div>
                <div className="text-xs text-muted-foreground">Instances: {data.computeUsage.instances}</div>
                <div className="text-xs text-muted-foreground">Total vCPU Hours: {data.computeUsage.vcpuHours} hrs</div>
                <div className="text-xs text-muted-foreground">GPU Usage: {data.computeUsage.gpuHours} hrs</div>
                <div className="text-xs text-muted-foreground">Region: {data.computeUsage.region}</div>
              </div>
            </Card>

            <Card className="border-border bg-card/50">
              <div className="p-4 md:p-6 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium"><Database className="h-4 w-4 text-primary" /> Storage Usage</div>
                <div className="text-xs text-muted-foreground">Total S3 Storage: {data.storageUsage.totalGb} GB</div>
                <div className="text-xs text-muted-foreground">Snapshots: {data.storageUsage.snapshots}</div>
                <div className="text-xs text-muted-foreground">Average Read/Write Ops: {data.storageUsage.avgOpsPerDay.toLocaleString()} / day</div>
              </div>
            </Card>

            <Card className="border-border bg-card/50">
              <div className="p-4 md:p-6 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium"><Globe2 className="h-4 w-4 text-primary" /> Network Usage</div>
                <div className="text-xs text-muted-foreground">Data Transfer Out: {data.networkUsage.dataOutGb} GB</div>
                <div className="text-xs text-muted-foreground">Bandwidth Avg: {data.networkUsage.bandwidthMb} MB/s</div>
                <div className="text-xs text-muted-foreground">Regions Active: {data.networkUsage.regionsActive}</div>
              </div>
            </Card>
          </div>

          {/* Monthly Cost Distribution + Billing Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border bg-card/50">
              <div className="p-4 md:p-6">
                <div className="text-sm font-medium mb-2">Monthly Cost Distribution</div>
                <div className="h-40 rounded-md border border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                  Stacked Bar Chart (Compute / Storage / Network)
                </div>
              </div>
            </Card>

            <Card className="border-border bg-card/50">
              <div className="p-4 md:p-6 space-y-2">
                <div className="text-sm font-medium">Billing Details</div>
                <div className="text-xs text-muted-foreground">Plan: {data.details.plan}</div>
                <div className="text-xs text-muted-foreground">Billing Account: {data.details.accountEmail}</div>
                <div className="text-xs text-muted-foreground">Payment Method: {data.details.payment}</div>
                <div className="text-xs text-muted-foreground">Next Invoice: {data.details.nextInvoice}</div>
                <div className="pt-2">
                  <Button onClick={downloadInvoice} className="bg-primary">Download Invoice</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
