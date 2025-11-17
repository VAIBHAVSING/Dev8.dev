import { NextResponse } from "next/server";
import { ensureWorkspace } from "@/app/api/_state/workspaces";

const sampleLines = [
  "Compiling...",
  "Bundling client...",
  "Bundling server...",
  "Server ready on http://localhost:3000 🚀",
  "GET / 200 38ms",
  "GET /api/health 200 12ms",
  "Hot reload applied",
];

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ws = ensureWorkspace(id);
  // append 0-2 random lines
  const count = Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * sampleLines.length);
    const line = sampleLines[idx] ?? "";
    ws.terminal.push(line);
  }
  // keep last 120 lines
  if (ws.terminal.length > 120) ws.terminal = ws.terminal.slice(-120);
  return NextResponse.json({ lines: ws.terminal, updatedAt: Date.now() });
}
