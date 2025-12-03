import { NextResponse } from "next/server";

let config = { url: "", apiKey: "" };
let recent: string[] = [
  "10 Oct - AWS Workspace - Auto Snapshot",
  "09 Oct - GCP Workspace - Manual Backup",
  "08 Oct - Azure VM - Auto Snapshot",
];

export async function GET() {
  return NextResponse.json({ ...config, recent });
}

export async function PUT(req: Request) {
  const body = await req.json();
  config = { url: body.url ?? "", apiKey: body.apiKey ?? "" };
  if (config.url) {
    recent = [
      `${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} - ${config.url} - Saved`,
      ...recent,
    ].slice(0, 8);
  }
  return NextResponse.json({ ok: true, ...config, recent });
}
