import { NextResponse } from "next/server";
import { ensureWorkspace } from "@/app/api/_state/workspaces";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ws = ensureWorkspace(id);
  return NextResponse.json({ snapshots: ws.snapshots });
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ws = ensureWorkspace(id);
  const snapId = `${Date.now()}`;
  ws.snapshots.unshift({ id: snapId, createdAt: Date.now(), location: `s3://cloudidex/backups/${ws.id}/${snapId}` });
  // keep only last 8
  ws.snapshots = ws.snapshots.slice(0, 8);
  return NextResponse.json({ ok: true, snapshots: ws.snapshots });
}
