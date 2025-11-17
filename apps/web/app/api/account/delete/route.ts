import { NextResponse } from "next/server";

export async function POST() {
  // TODO: hook into your real user deletion logic
  // For now, just simulate success so the button works end-to-end
  return NextResponse.json({ ok: true }, { status: 200 });
}
