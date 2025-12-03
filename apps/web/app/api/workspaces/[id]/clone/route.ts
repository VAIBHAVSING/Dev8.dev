/**
 * POST /api/workspaces/[id]/clone
 * Clone an existing workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;

    // Get the original environment
    const original = await prisma.environment.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Workspace not found'),
        { status: 404 }
      );
    }

    // Verify ownership
    if (original.userId !== payload.id) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Access denied'),
        { status: 403 }
      );
    }

    // Check user's workspace quota (example: max 10)
    const existingCount = await prisma.environment.count({
      where: { userId: payload.id },
    });

    if (existingCount >= 10) {
      return NextResponse.json(
        createErrorResponse(402, ErrorCodes.QUOTA_EXCEEDED, 'Maximum workspace limit reached'),
        { status: 402 }
      );
    }

    // Create cloned environment
    const cloned = await prisma.environment.create({
      data: {
        userId: payload.id,
        name: `${original.name} (Copy)`,
        status: 'STOPPED',
        cloudProvider: original.cloudProvider,
        cloudRegion: original.cloudRegion,
        cpuCores: original.cpuCores,
        memoryGB: original.memoryGB,
        storageGB: original.storageGB,
        baseImage: original.baseImage,
        ideType: original.ideType,
        agentType: original.agentType,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: cloned,
        message: 'Workspace cloned successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
