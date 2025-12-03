import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';
import { performWorkspaceAction } from '@/lib/workspace-actions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;

    const environment = await prisma.environment.findUnique({
      where: { id },
    });

    if (!environment) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Workspace not found'),
        { status: 404 },
      );
    }

    if (environment.deletedAt) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Workspace has been deleted'),
        { status: 404 },
      );
    }

    if (environment.userId !== payload.id) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Access denied'),
        { status: 403 },
      );
    }

    if (environment.status !== 'RUNNING') {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, 'Only running workspaces can be paused'),
        { status: 400 },
      );
    }

    const result = await performWorkspaceAction({
      action: 'PAUSE',
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
