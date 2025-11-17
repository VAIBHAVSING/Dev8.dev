import { NextResponse } from "next/server";
import { ensureWorkspace } from "@/app/api/_state/workspaces";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ws = ensureWorkspace(id);
  const { action } = await req.json();
  if (action === "restart") {
    ws.status = "running";
    ws.terminal.push("Restarting services...", "Server ready on http://localhost:3000 🚀");
  } else if (action === "stop") {
    ws.status = "stopped";
    ws.terminal.push("Shutting down...");
  } else if (action === "start") {
    ws.status = "running";
    ws.terminal.push("Starting workspace...");
  }
  ws.terminal = ws.terminal.slice(-120);
  return NextResponse.json({ ok: true, status: ws.status });
}
