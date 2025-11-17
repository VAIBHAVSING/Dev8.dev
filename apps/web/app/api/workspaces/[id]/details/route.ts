import { NextResponse } from "next/server";
import { ensureWorkspace } from "@/app/api/_state/workspaces";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ws = ensureWorkspace(id);
  return NextResponse.json({
    id: ws.id,
    name: ws.name,
    provider: ws.provider,
    size: ws.size,
    region: ws.region,
    status: ws.status,
    assistant: ws.assistant,
    updatedAt: Date.now(),
  });
}
