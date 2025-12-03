import { NextResponse } from "next/server";
import { getWorkspaceOptions } from "@/lib/workspace-options";

export async function GET() {
  return NextResponse.json(getWorkspaceOptions());
}
