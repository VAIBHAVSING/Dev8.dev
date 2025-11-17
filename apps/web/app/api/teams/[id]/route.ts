/**
 * GET /api/teams/[id]
 * Get team details
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { updateTeamSchema, deleteTeamSchema } from '@/lib/validations';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';
import { getUserTeamRole, isTeamMember, checkTeamPermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;

    // Verify user is team member
    const isMember = await isTeamMember(payload.id, id);
    if (!isMember) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'You are not a member of this team'),
        { status: 403 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: [
            { role: 'desc' }, // OWNER first
            { joinedAt: 'asc' },
          ],
        },
        _count: {
          select: {
            environments: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Team not found'),
        { status: 404 }
      );
    }

    // Get active workspaces count
    const activeWorkspaces = await prisma.environment.count({
      where: {
        teamId: id,
        status: { in: ['RUNNING', 'STARTING'] },
      },
    });

    const myRole = await getUserTeamRole(payload.id, id);

    return NextResponse.json({
      success: true,
      data: {
        team: {
          id: team.id,
          name: team.name,
          slug: team.slug,
          description: team.description,
          logo: team.logo,
          plan: team.plan,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
        },
        myRole,
        stats: {
          memberCount: team.members.length,
          workspaceCount: team._count.environments,
          activeWorkspaces,
        },
        members: team.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          user: m.user,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * PATCH /api/teams/[id]
 * Update team details
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
    const validation = updateTeamSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, JSON.stringify(validation.error.issues)),
        { status: 400 }
      );
    }

    // Check permissions (OWNER or ADMIN)
    const canUpdate = await checkTeamPermission(payload.id, id, 'team:update');
    if (!canUpdate) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Only team owners and admins can update team details'),
        { status: 403 }
      );
    }

    const team = await prisma.team.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({
      success: true,
      message: 'Team updated successfully',
      data: { team },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * DELETE /api/teams/[id]
 * Delete team
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    // Validate request
    const validation = deleteTeamSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, JSON.stringify(validation.error.issues)),
        { status: 400 }
      );
    }

    // Check permissions (OWNER only)
    const canDelete = await checkTeamPermission(payload.id, id, 'team:delete');
    if (!canDelete) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Only team owner can delete the team'),
        { status: 403 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Team not found'),
        { status: 404 }
      );
    }

    // Verify confirmation slug
    if (validation.data.confirmSlug !== team.slug) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, 'Confirmation slug does not match'),
        { status: 400 }
      );
    }

    // Mark team workspaces for deletion (7 days grace period)
    const deletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.environment.updateMany({
      where: { teamId: id },
      data: { deletedAt: deletionDate },
    });

    // Soft delete team
    await prisma.team.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully. Team workspaces will be deleted after 7 days.',
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
