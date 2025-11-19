import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createAuthConfig } from "../../../../lib/auth-config";
import { AgentClient } from "@repo/agent-client";

const AGENT_BASE_URL = process.env.AGENT_BASE_URL || "http://localhost:8080";

/**
 * POST /api/workspaces/stop - Stop a running workspace
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(createAuthConfig());
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { workspaceId, cloudRegion } = body;

    if (!workspaceId || !cloudRegion) {
      return NextResponse.json(
        { error: "Missing required fields: workspaceId, cloudRegion" },
        { status: 400 }
      );
    }

    // Call agent API
    const agentClient = AgentClient.getInstance(AGENT_BASE_URL);
    const response = await agentClient.stopWorkspace({
      workspaceId,
      cloudRegion,
    });

    if (!response.success) {
      return NextResponse.json(
        { error: response.message, code: response.code },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error stopping workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
