import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createAuthConfig } from "../../../../lib/auth-config";
import { AgentClient } from "@repo/agent-client";

const AGENT_BASE_URL = process.env.AGENT_BASE_URL || "http://localhost:8080";

/**
 * POST /api/workspaces/start - Start a stopped workspace
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
    
    // Validate required fields
    const {
      workspaceId,
      cloudRegion,
      name,
      cpuCores,
      memoryGB,
      storageGB,
      baseImage,
    } = body;

    if (!workspaceId || !cloudRegion || !name || !cpuCores || !memoryGB || !storageGB || !baseImage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create start workspace request
    const startRequest = {
      workspaceId,
      cloudRegion,
      userId: session.user.id || session.user.email!,
      name,
      cpuCores,
      memoryGB,
      storageGB,
      baseImage,
      codeServerPassword: body.codeServerPassword,
      githubToken: body.githubToken,
    };

    // Call agent API
    const agentClient = AgentClient.getInstance(AGENT_BASE_URL);
    const response = await agentClient.startWorkspace(startRequest);

    if (!response.success) {
      return NextResponse.json(
        { error: response.message, code: response.code },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error starting workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
