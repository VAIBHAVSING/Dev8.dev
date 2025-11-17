"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function WorkspacesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  // UI state
  const [baseType, setBaseType] = useState<"image" | "dockerfile">("image");
  const [dockerImage, setDockerImage] = useState("");
  const [dockerfile, setDockerfile] = useState("");
  const [script, setScript] = useState(`# Install Node.js and other tools\nsudo apt-get update\nsudo apt-get install -y nodejs npm\n\nnpm install -g typescript`);
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/signin");
  }, [status, session, router]);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: templateName,
        description,
        base: baseType,
        dockerImage: baseType === "image" ? dockerImage : undefined,
        dockerfile: baseType === "dockerfile" ? dockerfile : undefined,
        script,
      };
      // POST to backend (endpoint to be implemented server-side)
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save template");
      // Navigate or show success
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Could not save template. Please try again.");
    } finally {
      setSaving(false);
    }
  }

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
          {/* Top bar (same style as dashboard) */}
          <div className="flex items-center justify-between mb-8">
            <div className="relative w-full max-w-2xl">
              <input
                aria-label="Search workspaces"
                placeholder="Search workspaces..."
                className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push("/workspaces/new")} className="bg-gradient-to-r from-primary to-secondary">
                + New Workspace
              </Button>
              <button className="h-9 w-9 rounded-md bg-card border border-border flex items-center justify-center text-muted-foreground">🔔</button>
              <div className="h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground">R</div>
            </div>
          </div>

          <h1 className="text-xl font-semibold mb-6">Create a New Workspace Template</h1>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* LEFT: main form (spans 2 cols) */}
            <Card className="xl:col-span-2 border-border bg-card/50">
              <div className="p-4 md:p-6 space-y-6">
                {/* Base Environment */}
                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-foreground">Base Environment</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setBaseType("image")}
                      className={`rounded-md border px-3 py-2 text-sm ${
                        baseType === "image" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      From a Base Image
                    </button>
                    <button
                      onClick={() => setBaseType("dockerfile")}
                      className={`rounded-md border px-3 py-2 text-sm ${
                        baseType === "dockerfile" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      From a Dockerfile
                    </button>
                  </div>

                  {baseType === "image" ? (
                    <div className="mt-3">
                      <Label htmlFor="dockerImage">Docker Image URL</Label>
                      <Input
                        id="dockerImage"
                        placeholder="e.g., mcr.microsoft.com/devcontainers/base:ubuntu"
                        value={dockerImage}
                        onChange={(e) => setDockerImage(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  ) : (
                    <div className="mt-3">
                      <Label htmlFor="dockerfile">Dockerfile</Label>
                      <textarea
                        id="dockerfile"
                        value={dockerfile}
                        onChange={(e) => setDockerfile(e.target.value)}
                        placeholder={`# paste your Dockerfile content here\nFROM ubuntu:22.04`}
                        className="mt-2 w-full min-h-[160px] rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  )}
                </div>

                {/* Customization Script */}
                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-foreground">Customization Script</h2>
                  <p className="text-xs text-muted-foreground">Run these commands to install tools and configure your environment.</p>
                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    className="w-full min-h-[220px] rounded-md border border-border bg-muted/60 px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground shadow-inner"
                  />
                </div>
              </div>
            </Card>

            {/* RIGHT: details panel */}
            <Card className="border-border bg-card/50">
              <div className="p-4 md:p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    placeholder="e.g., Node.js Project"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <textarea
                    id="desc"
                    placeholder="Describe the template"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[120px] rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-secondary">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Template
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
