"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type Options = {
  providers: { id: string; name: string }[];
  images: { id: string; label: string }[];
  sizes: { id: "small" | "medium" | "large"; cpu: number; ramGb: number }[];
  regions: { id: string; label: string }[];
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

  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [provider, setProvider] = useState("aws");
  const [image, setImage] = useState("ubuntu-22");
  const [size, setSize] = useState<"small" | "medium" | "large">("small");
  const [region, setRegion] = useState("us-east");
  const [hoursPerDay, setHoursPerDay] = useState(8);

  const [estimate, setEstimate] = useState<{ hourly: number; daily: number; monthly: number; currency: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/workspaces/options", { cache: "no-store" });
        const j = (await res.json()) as Options;
        setOptions(j);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function calc() {
      try {
        const res = await fetch("/api/workspaces/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, size, hoursPerDay }),
        });
        const j = await res.json();
        setEstimate(j.cost);
      } catch (e) {
        console.error(e);
      }
    }
    // debounce quick changes
    timer = setTimeout(calc, 200);
    return () => timer && clearTimeout(timer);
  }, [provider, size, hoursPerDay]);

  async function onSubmit() {
    setSubmitting(true);
    try {
      // Map size to actual resource values
      const sizeConfig = options?.sizes.find(s => s.id === size) || { cpu: 2, ramGb: 4 };
      
      const payload = {
        name,
        cloudProvider: provider.toUpperCase(), // Convert to uppercase: AWS, GCP, AZURE, LOCAL
        cloudRegion: region,
        cpuCores: sizeConfig.cpu,
        memoryGB: sizeConfig.ramGb,
        storageGB: 20, // Default storage
        baseImage: image,
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
                    <Label htmlFor="provider">Provider</Label>
                    <select
                      id="provider"
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                    >
                      {options?.providers.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="min-w-0">
                    <Label htmlFor="image">Base Image</Label>
                    <select
                      id="image"
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                    >
                      {options?.images.map((img) => (
                        <option key={img.id} value={img.id}>{img.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-0">
                    <Label>Size</Label>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {options?.sizes.map((s) => (
                        <Button
                          key={s.id}
                          variant={size === s.id ? "default" : "outline"}
                          onClick={() => setSize(s.id)}
                          className={(size === s.id ? "bg-gradient-to-r from-primary to-secondary " : "") + "whitespace-nowrap shrink-0"}
                        >
                          {s.id.toUpperCase()} • {s.cpu} CPU / {s.ramGb} GB
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="region">Region</Label>
                    <select
                      id="region"
                      className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                    >
                      {options?.regions.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hours">Expected Usage (hrs/day)</Label>
                    <Input id="hours" type="number" min={0} max={24} value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value))} />
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
                    <div className="flex items-center justify-between"><span>Hourly</span><span className="font-semibold">{estimate.currency} {estimate.hourly.toFixed(2)}</span></div>
                    <div className="flex items-center justify-between"><span>Daily</span><span className="font-semibold">{estimate.currency} {estimate.daily.toFixed(2)}</span></div>
                    <div className="flex items-center justify-between"><span>Monthly</span><span className="font-semibold">{estimate.currency} {estimate.monthly.toFixed(2)}</span></div>
                    <p className="text-xs text-muted-foreground mt-3">Estimates depend on actual usage and provider rates.</p>
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
