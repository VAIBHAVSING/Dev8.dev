/**
 * POST /api/workspaces/[id]/stop
 * Stop a running workspace (keeps volumes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';
import { performWorkspaceAction } from '@/lib/workspace-actions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;

    // Get environment
    const environment = await prisma.environment.findUnique({
      where: { id },
    });

    if (!environment) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Workspace not found'),
        { status: 404 }
      );
    }

    if (environment.deletedAt) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Workspace has been deleted'),
        { status: 404 }
      );
    }

    // Verify ownership
    if (environment.userId !== payload.id) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Access denied'),
        { status: 403 }
      );
    }

    if (['STOPPED', 'DELETING'].includes(environment.status)) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, `Workspace is already ${environment.status.toLowerCase()}`),
        { status: 400 }
      );
    }

    if (!['RUNNING', 'PAUSED'].includes(environment.status)) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, `Cannot stop workspace in ${environment.status} state`),
        { status: 400 }
      );
    }

    const result = await performWorkspaceAction({
      action: 'STOP',
      environment,
      userId: payload.id,
    });

    return NextResponse.json({
      success: true,
      data: result.environment,
      message: result.message,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
