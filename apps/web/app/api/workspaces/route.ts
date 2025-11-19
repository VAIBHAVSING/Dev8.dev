import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createAuthConfig } from "../../../lib/auth-config";
import { AgentClient } from "@repo/agent-client";

const AGENT_BASE_URL = process.env.AGENT_BASE_URL || "http://localhost:8080";

/**
 * POST /api/workspaces - Create a new workspace
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
      name,
      cloudRegion,
      cpuCores,
      memoryGB,
      storageGB,
      baseImage,
    } = body;

    if (!workspaceId || !name || !cloudRegion || !cpuCores || !memoryGB || !storageGB || !baseImage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create workspace config with user ID from session
    const workspaceConfig = {
      workspaceId,
      userId: session.user.id || session.user.email!,
      name,
      cloudProvider: "AZURE" as const,
      cloudRegion,
      cpuCores,
      memoryGB,
      storageGB,
      baseImage,
      githubToken: body.githubToken,
      codeServerPassword: body.codeServerPassword,
      sshPublicKey: body.sshPublicKey,
      gitUserName: body.gitUserName,
      gitUserEmail: body.gitUserEmail,
      anthropicApiKey: body.anthropicApiKey,
      openaiApiKey: body.openaiApiKey,
      geminiApiKey: body.geminiApiKey,
    };

    // Call agent API
    const agentClient = AgentClient.getInstance(AGENT_BASE_URL);
    const response = await agentClient.createWorkspace(workspaceConfig);

    if (!response.success) {
      return NextResponse.json(
        { error: response.message, code: response.code },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces - Delete a workspace
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(createAuthConfig());
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { workspaceId, cloudRegion, force } = body;

    if (!workspaceId || !cloudRegion) {
      return NextResponse.json(
        { error: "Missing required fields: workspaceId, cloudRegion" },
        { status: 400 }
      );
    }

    // Call agent API
    const agentClient = AgentClient.getInstance(AGENT_BASE_URL);
    const response = await agentClient.deleteWorkspace({
      workspaceId,
      cloudRegion,
      force,
    });

    if (!response.success) {
      return NextResponse.json(
        { error: response.message, code: response.code },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
