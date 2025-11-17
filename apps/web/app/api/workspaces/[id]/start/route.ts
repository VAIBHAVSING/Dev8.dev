/**
 * POST /api/workspaces/[id]/start
 * Start a stopped workspace
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

    // Verify ownership
    if (environment.userId !== payload.id) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Access denied'),
        { status: 403 }
      );
    }

    // Check if already running
    if (environment.status === 'RUNNING') {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, 'Workspace is already running'),
        { status: 400 }
      );
    }

    // Check if not stopped
    if (environment.status !== 'STOPPED') {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, `Cannot start workspace in ${environment.status} state`),
        { status: 400 }
      );
    }

    // For MVP: Simply update status to RUNNING without Agent API
    // TODO: Integrate with Agent API when available
    const updated = await prisma.environment.update({
      where: { id },
      data: {
        status: 'RUNNING',
        lastAccessedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        environment: updated,
        message: 'Workspace started successfully (simulated for MVP)',
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
