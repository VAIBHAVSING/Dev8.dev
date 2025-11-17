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
            <Card className="border-border bg-card/50">
              <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-medium">Security</h2>
                </div>

                <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">Password</div>
                    <div className="text-xs text-muted-foreground">Change your account password</div>
                  </div>
                  <Button onClick={() => router.push("/settings/change-password")} className="bg-primary">Change Password</Button>
                </div>

                <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">Two-Factor Authentication</div>
                    <div className="text-xs text-muted-foreground">Add an extra layer of security</div>
                  </div>
                  <Button variant="outline" disabled>Coming Soon</Button>
                </div>
              </div>
            </Card>

            {/* Connected Accounts */}
            <Card className="border-border bg-card/50">
              <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-medium">Connected Accounts</h2>
                </div>

                {connections.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Loading connections...</div>
                ) : (
                  connections.map((c) => (
                    <div key={c.provider} className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-primary/10" />
                        <div>
                          <div className="text-sm font-medium">{c.provider}</div>
                          <div className="text-xs text-muted-foreground">OAuth connection</div>
                        </div>
                      </div>
                      {c.connected ? (
                        <span className="text-xs text-emerald-500">Connected</span>
                      ) : c.available === false ? (
                        <span className="text-xs text-rose-500">Unavailable</span>
                      ) : (
                        <Button
                          variant="outline"
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
            <Card className="lg:col-span-2 border border-destructive/30 bg-destructive/5">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <Trash2 className="h-5 w-5" />
                  <h2 className="text-sm font-medium">Danger Zone</h2>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border border-destructive/40 bg-background px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">Delete Account</div>
                    <div className="text-xs text-muted-foreground">Once you delete your account, there is no going back.</div>
                  </div>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="mt-3 sm:mt-0">
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
