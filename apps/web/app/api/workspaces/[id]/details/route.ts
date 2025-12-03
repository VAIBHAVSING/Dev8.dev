import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { handleAPIError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const environment = await prisma.environment.findUnique({
      where: { id },
      include: {
        workspace: {
          select: {
            storagePath: true,
            totalSizeMB: true,
          },
        },
      },
    });

    if (!environment || environment.deletedAt) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (environment.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Generate URLs (use stored URLs or generate fallback based on workspace ID and region)
    const baseUrl = environment.vsCodeUrl || `https://ws-${environment.id}.${environment.cloudRegion}.azurecontainer.io`;
    const sshUrl = environment.sshConnectionString || `ssh://dev8@ws-${environment.id}.${environment.cloudRegion}.azurecontainer.io:2222`;
    const vscodeWebUrl = environment.vsCodeUrl ? `${environment.vsCodeUrl}:8080` : `${baseUrl}:8080`;

    return NextResponse.json({
      id: environment.id,
      name: environment.name,
      provider: environment.cloudProvider?.toLowerCase() || "azure",
      size: `${environment.cpuCores}cpu-${environment.memoryGB}gb`,
      region: environment.cloudRegion,
      status: environment.status.toLowerCase(),
      publicUrl: baseUrl,
      sshUrl: sshUrl,
      vscodeWebURL: vscodeWebUrl,
      vscodeDesktopURL: `vscode-remote://ssh-remote+dev8@ws-${environment.id}.${environment.cloudRegion}.azurecontainer.io:2222/workspace`,
      sshURL: sshUrl,
      supervisorURL: `${baseUrl}:9000`,
      baseImage: environment.baseImage,
      cpuCores: environment.cpuCores,
      memoryGB: environment.memoryGB,
      storageGB: environment.storageGB,
      createdAt: environment.createdAt,
      updatedAt: environment.updatedAt,
      lastAccessedAt: environment.lastAccessedAt,
      assistant: {
        tips: [
          "Press Ctrl+` to open the integrated terminal",
          "Use Ctrl+P for quick file navigation",
          "Ctrl+Shift+P opens the command palette",
        ],
        note: environment.status === "RUNNING" 
          ? "Workspace is running smoothly" 
          : "Start the workspace to begin working",
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
