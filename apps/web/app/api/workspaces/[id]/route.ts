/**
 * Individual Workspace Operations
 * GET /api/workspaces/[id] - Get workspace details
 * PATCH /api/workspaces/[id] - Update workspace metadata
 * DELETE /api/workspaces/[id] - Delete workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { updateWorkspaceSchema } from '@/lib/validations';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';
import { performWorkspaceAction } from '@/lib/workspace-actions';

/**
 * GET /api/workspaces/[id]
 * Get workspace details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;

    const environment = await prisma.environment.findUnique({
      where: { id },
      include: {
        workspace: {
          select: {
            id: true,
            storagePath: true,
            totalSizeMB: true,
            lastBackupAt: true,
          },
        },
      },
    });

    if (!environment || environment.deletedAt) {
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

    // Update last accessed timestamp
    await prisma.environment.update({
      where: { id },
      data: { lastAccessedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: environment,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * PATCH /api/workspaces/[id]
 * Update workspace metadata (name, description, tags)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    // Validate request
    const validation = updateWorkspaceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, JSON.stringify(validation.error.issues)),
        { status: 400 }
      );
    }

    // Check ownership
    const environment = await prisma.environment.findUnique({
      where: { id },
    });

    if (!environment || environment.deletedAt) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Workspace not found'),
        { status: 404 }
      );
    }

    if (environment.userId !== payload.id) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Access denied'),
        { status: 403 }
      );
    }

    // Update environment
    const updated = await prisma.environment.update({
      where: { id },
      data: {
        name: validation.data.name,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * DELETE /api/workspaces/[id]
 * Delete workspace permanently (calls Agent API)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;

    // Check ownership
    const environment = await prisma.environment.findUnique({
      where: { id },
    });

    if (!environment) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Workspace not found'),
        { status: 404 }
      );
    }

    if (environment.userId !== payload.id) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Access denied'),
        { status: 403 }
      );
    }

    if (environment.deletedAt) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Workspace already deleted'),
        { status: 404 }
      );
    }

    const result = await performWorkspaceAction({
      action: 'DELETE',
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
