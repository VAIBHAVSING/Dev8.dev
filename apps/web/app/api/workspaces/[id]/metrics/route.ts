import { NextResponse } from "next/server";
import { ensureWorkspace, jitter } from "@/app/api/_state/workspaces";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ws = ensureWorkspace(id);
  // update with gentle jitter
  ws.metrics.cpu = Math.max(1, Math.min(100, Math.round(jitter(ws.metrics.cpu, 0.2))));
  ws.metrics.memory.usedGb = Math.max(1, Math.min(ws.metrics.memory.totalGb, Math.round(jitter(ws.metrics.memory.usedGb, 0.15))));
  ws.metrics.disk.usedGb = Math.max(5, Math.min(ws.metrics.disk.totalGb, Math.round(jitter(ws.metrics.disk.usedGb, 0.1))));
  ws.metrics.network.inMb = Math.max(10, Math.round(jitter(ws.metrics.network.inMb, 0.3)));
  ws.metrics.network.outMb = Math.max(10, Math.round(jitter(ws.metrics.network.outMb, 0.3)));
  ws.lastUpdate = Date.now();

  return NextResponse.json({ ...ws.metrics, updatedAt: ws.lastUpdate });
}
