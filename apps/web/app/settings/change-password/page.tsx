"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      if (!res.ok) throw new Error("Password update failed");
      alert("Password updated (demo)");
      router.push("/settings");
    } catch (e) {
      console.error(e);
      alert("Unable to update password right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 -z-10 grid-background opacity-20" />
      <Sidebar />
      <main className="ml-64 min-h-screen transition-all duration-300">
        <div className="container mx-auto px-8 py-8">
          <h1 className="text-xl font-semibold mb-6">Change Password</h1>
          <Card className="max-w-xl border-border bg-card/50">
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cur">Current password</Label>
                <Input id="cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next">New password</Label>
                <Input id="next" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button onClick={submit} disabled={busy} className="bg-primary">
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Password
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
