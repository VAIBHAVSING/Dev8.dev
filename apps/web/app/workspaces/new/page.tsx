"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type {
  BaseImageId,
  HardwarePresetId,
  HardwarePresetOption,
  ProviderOption,
  RegionId,
  WorkspaceOptions,
} from "@/lib/workspace-options";
import { SUPPORTED_CLOUD_PROVIDER } from "@/lib/workspace-options";

type WorkspaceOptionsResponse = WorkspaceOptions;

type CostEstimate = {
  provider: string;
  sizeId: HardwarePresetId;
  hardware: HardwarePresetOption;
  hoursPerDay: number;
  cost: {
    hourly: number;
    daily: number;
    monthly: number;
    currency: string;
  };
  updatedAt: number;
};

export default function NewWorkspacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/signin");
  }, [session, status, router]);

  const [options, setOptions] = useState<WorkspaceOptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [providerId, setProviderId] = useState<ProviderOption["id"] | "">("");
  const [regionId, setRegionId] = useState<RegionId | "">("");
  const [sizeId, setSizeId] = useState<HardwarePresetId | "">("");
  const [imageId, setImageId] = useState<BaseImageId | "">("");
  const [hoursPerDay, setHoursPerDay] = useState(8);

  const [estimate, setEstimate] = useState<CostEstimate | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/workspaces/options", { cache: "no-store" });
        const data = (await res.json()) as WorkspaceOptionsResponse;
        setOptions(data);
        setProviderId(data.defaults.providerId);
        setRegionId(data.defaults.regionId as RegionId);
        setSizeId(data.defaults.sizeId as HardwarePresetId);
        setImageId(data.defaults.imageId as BaseImageId);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!sizeId) return;
    async function calc() {
      try {
        const res = await fetch("/api/workspaces/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sizeId, hoursPerDay }),
        });
        const j = (await res.json()) as CostEstimate;
        setEstimate(j);
      } catch (e) {
        console.error(e);
        setEstimate(null);
      }
    }
    // debounce quick changes
    const timer = setTimeout(calc, 200);
    return () => clearTimeout(timer);
  }, [sizeId, hoursPerDay]);

  const selectedProvider = useMemo(
    () => options?.providers.find((p) => p.id === providerId),
    [options, providerId]
  );
  const selectedSize = useMemo(
    () => options?.sizes.find((s) => s.id === sizeId),
    [options, sizeId]
  );
  const selectedImage = useMemo(
    () => options?.images.find((img) => img.id === imageId),
    [options, imageId]
  );

  async function onSubmit() {
    if (!options || !selectedSize || !selectedImage || !regionId) {
      alert("Workspace options are still loading. Please wait a moment.");
      return;
    }
    setSubmitting(true);
    try {
      const storageGB = selectedSize.storageGB;
      const payload = {
        name,
        cloudProvider: selectedProvider?.value ?? SUPPORTED_CLOUD_PROVIDER,
        cloudRegion: regionId,
        cpuCores: selectedSize.cpuCores,
        memoryGB: selectedSize.memoryGB,
        storageGB,
        baseImage: selectedImage.id,
      };

      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Workspace creation failed:", error);
        alert(`Failed to create workspace: ${error.message || 'Unknown error'}`);
        return;
      }

      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      alert("Failed to create workspace. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted || status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg text-muted-foreground">Preparing new workspace...</div>
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
            <h1 className="text-2xl font-semibold">Create New Workspace</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-card/50 backdrop-blur border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Workspace Name</Label>
                    <Input id="name" placeholder="e.g. api-backend-dev" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Provider</Label>
                    <div className="mt-2 grid grid-cols-1 gap-3">
                      {options?.providers.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProviderId(p.id)}
                          className={`flex w-full flex-col rounded-lg border p-4 text-left transition ${
                            providerId === p.id ? "border-primary bg-primary/10" : "border-border bg-card"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{p.label}</span>
                            <Badge variant={p.status === "online" ? "default" : "secondary"}>{p.status === "online" ? "Live" : "Planned"}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Region: {p.regions.map((region) => region.label).join(", ")}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="min-w-0">
                    <Label htmlFor="image">Base Image</Label>
                    <select
                      id="image"
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                      value={imageId}
                      onChange={(e) => setImageId(e.target.value as BaseImageId)}
                    >
                      {options?.images.map((img) => (
                        <option key={img.id} value={img.id}>{img.label}</option>
                      ))}
                    </select>
                    {selectedImage && (
                      <p className="mt-2 text-xs text-muted-foreground">{selectedImage.description}</p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <Label>Size</Label>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {options?.sizes.map((s) => (
                        <Button
                          key={s.id}
                          type="button"
                          variant={sizeId === s.id ? "default" : "outline"}
                          onClick={() => setSizeId(s.id)}
                          className={`${sizeId === s.id ? "bg-gradient-to-r from-primary to-secondary" : ""} whitespace-nowrap shrink-0`}
                        >
                          {s.label} • {s.cpuCores} CPU / {s.memoryGB} GB
                        </Button>
                      ))}
                    </div>
                    {selectedSize && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {selectedSize.storageGB} GB SSD • {selectedSize.instanceType.replace('-', ' ')} • ${selectedSize.costPerHour.toFixed(2)}/hr
                      </p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="region">Region</Label>
                    <select
                      id="region"
                      className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                      value={regionId}
                      onChange={(e) => setRegionId(e.target.value as RegionId)}
                    >
                      {options?.regions.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Deployments currently run from Azure Central India (Pune) for the lowest latency in the region.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hours">Expected Usage (hrs/day)</Label>
                    <Input
                      id="hours"
                      type="number"
                      min={0}
                      max={24}
                      value={hoursPerDay}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        if (Number.isNaN(next)) {
                          setHoursPerDay(0);
                          return;
                        }
                        setHoursPerDay(Math.min(24, Math.max(0, next)));
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={onSubmit} disabled={submitting} className="bg-gradient-to-r from-primary to-secondary">
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</> : "Create Workspace"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                {estimate ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span>Hourly</span><span className="font-semibold">{estimate.cost.currency} {estimate.cost.hourly.toFixed(2)}</span></div>
                    <div className="flex items-center justify-between"><span>Daily</span><span className="font-semibold">{estimate.cost.currency} {estimate.cost.daily.toFixed(2)}</span></div>
                    <div className="flex items-center justify-between"><span>Monthly</span><span className="font-semibold">{estimate.cost.currency} {estimate.cost.monthly.toFixed(2)}</span></div>
                    <p className="text-xs text-muted-foreground mt-3">Azure costs are estimated with persistent volumes. Actual billing depends on runtime.</p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Adjust options to see cost estimate.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
