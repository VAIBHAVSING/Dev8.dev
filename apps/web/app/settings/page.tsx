"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, LogOut, Trash2, Link2 } from "lucide-react";

type Conn = { provider: string; connected: boolean; available?: boolean };

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [connections, setConnections] = useState<Conn[]>([]);

  // fetch dynamic connection statuses
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    async function load() {
      try {
        const r = await fetch("/api/account/connections", { cache: "no-store" });
        if (!r.ok) return; // don't attempt to parse error pages
        const text = await r.text();
        if (!text) return; // guard against empty body
        const j = JSON.parse(text);
        setConnections(j.connections ?? []);
      } catch (e) {
        console.error("settings: connections fetch error", e);
      }
    }
    if (status === "authenticated") {
      load();
      timer = setInterval(load, 8000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [status]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/signin");
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading settings...
        </div>
      </div>
    );
  }

  if (!session) return null;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error("Delete failed");
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      console.error(e);
      alert("Unable to delete account right now.");
    } finally {
      setDeleting(false);
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">Settings</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {session.user?.name || session.user?.email}
              <Button variant="destructive" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security */}
            <Card className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/20 transition-all">
              <div className="p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Security</h2>
                    <p className="text-xs text-muted-foreground">Manage your account security</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/30 backdrop-blur px-5 py-4 hover:border-primary/30 hover-lift transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-all">
                      <span className="text-xl">🔑</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Password</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Change your account password</div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => router.push("/settings/change-password")} 
                    className="bg-primary hover:glow-primary hover-scale transition-all"
                  >
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/30 backdrop-blur px-5 py-4 opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted/20 flex items-center justify-center">
                      <span className="text-xl">🔐</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Two-Factor Authentication</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security</div>
                    </div>
                  </div>
                  <Button variant="outline" disabled className="border-border/50">Coming Soon</Button>
                </div>
              </div>
            </Card>

            {/* Connected Accounts */}
            <Card className="border-border/50 bg-card/50 backdrop-blur hover:border-secondary/20 transition-all">
              <div className="p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Connected Accounts</h2>
                    <p className="text-xs text-muted-foreground">Link your external accounts</p>
                  </div>
                </div>

                {connections.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Link2 className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading connections...</p>
                  </div>
                ) : (
                  connections.map((c) => (
                    <div key={c.provider} className="flex items-center justify-between rounded-lg border border-border/50 bg-card/30 backdrop-blur px-5 py-4 hover:border-secondary/30 hover-lift transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 flex items-center justify-center transition-all">
                          <span className="text-2xl">{c.provider === 'Google' ? '🔵' : '⚫'}</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{c.provider}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">OAuth connection</div>
                        </div>
                      </div>
                      {c.connected ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 pulse-scale" />
                          <span className="text-xs font-medium text-emerald-500">Connected</span>
                        </div>
                      ) : c.available === false ? (
                        <span className="text-xs font-medium text-rose-500">Unavailable</span>
                      ) : (
                        <Button
                          variant="outline"
                          className="border-secondary/30 text-secondary hover:bg-secondary/10 hover:border-secondary/50 hover-scale transition-all"
                          onClick={() => {
                            const p = c.provider.toLowerCase();
                            // Kick off OAuth sign-in to link account and return here
                            window.location.href = `/api/auth/signin/${p}?callbackUrl=${encodeURIComponent('/settings')}`;
                          }}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="lg:col-span-2 border border-destructive/50 bg-gradient-to-br from-destructive/5 to-destructive/10 backdrop-blur">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-destructive">Danger Zone</h2>
                    <p className="text-xs text-muted-foreground">Permanent and irreversible actions</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-destructive/50 bg-background/50 backdrop-blur px-5 py-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Delete Account</div>
                    <div className="text-xs text-muted-foreground mt-1">Once you delete your account, there is no going back. This action cannot be undone.</div>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete} 
                    disabled={deleting} 
                    className="mt-4 sm:mt-0 hover-scale transition-all"
                  >
                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Delete Account
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
