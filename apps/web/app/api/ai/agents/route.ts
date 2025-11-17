import { NextResponse } from "next/server";

type Agent = { id: string; name: string; status: "connected" | "disconnected" | "warning" };

// In-memory store for demo; replace with DB/service
let agents: Agent[] = [
  { id: "code-expo-pilot", name: "Code Expo Pilot", status: "connected" },
  { id: "cloud-code-copilot", name: "Cloud Code Copilot", status: "disconnected" },
  { id: "custom-agents", name: "Custom Agents", status: "warning" },
];

export async function GET() {
  return NextResponse.json({ agents });
}

export async function POST(req: Request) {
  const { id, action } = await req.json();
  agents = agents.map((a) =>
    a.id === id
      ? {
          ...a,
          status: action === "connect" ? "connected" : action === "disconnect" ? "disconnected" : a.status,
        }
      : a
  );
  return NextResponse.json({ ok: true, agents });
}
