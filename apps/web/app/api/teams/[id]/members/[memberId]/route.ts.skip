/**
 * PATCH /api/teams/[id]/members/[memberId]
 * Update member role
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { updateMemberRoleSchema } from '@/lib/validations';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';
import { checkTeamPermission, getUserTeamRole } from '@/lib/permissions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id, memberId } = await params;
    const body = await request.json();

    // Validate request
    const validation = updateMemberRoleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, JSON.stringify(validation.error.issues)),
        { status: 400 }
      );
    }

    // Check permissions (only OWNER can change roles)
    const canUpdateRole = await checkTeamPermission(payload.id, id, 'member:update-role');
    if (!canUpdateRole) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Only team owner can change member roles'),
        { status: 403 }
      );
    }

    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member || member.teamId !== id) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Team member not found'),
        { status: 404 }
      );
    }

    // Cannot change own role (except when transferring ownership)
    if (member.userId === payload.id && validation.data.role !== 'OWNER') {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, 'Cannot change your own role'),
        { status: 400 }
      );
    }

    // If demoting from OWNER, check if there will still be an owner
    if (member.role === 'OWNER' && validation.data.role !== 'OWNER') {
      const ownerCount = await prisma.teamMember.count({
        where: {
          teamId: id,
          role: 'OWNER',
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, 'Cannot remove the last owner. Transfer ownership first.'),
          { status: 400 }
        );
      }
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role: validation.data.role },
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
    });

    return NextResponse.json({
      success: true,
      message: 'Member role updated successfully',
      data: { member: updatedMember },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * DELETE /api/teams/[id]/members/[memberId]
 * Remove team member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id, memberId } = await params;

    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.teamId !== id) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Team member not found'),
        { status: 404 }
      );
    }

    const myRole = await getUserTeamRole(payload.id, id);
    if (!myRole) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'You are not a member of this team'),
        { status: 403 }
      );
    }

    // Check permissions
    const isSelf = member.userId === payload.id;
    const canRemove = await checkTeamPermission(payload.id, id, 'member:remove');

    if (!isSelf && !canRemove) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'You do not have permission to remove members'),
        { status: 403 }
      );
    }

    // ADMIN can only remove MEMBER, not other ADMINs or OWNER
    if (myRole === 'ADMIN' && ['ADMIN', 'OWNER'].includes(member.role)) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Admins cannot remove other admins or the owner'),
        { status: 403 }
      );
    }

    // Cannot remove last OWNER
    if (member.role === 'OWNER') {
      const ownerCount = await prisma.teamMember.count({
        where: {
          teamId: id,
          role: 'OWNER',
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, 'Cannot remove the last owner. Transfer ownership first.'),
          { status: 400 }
        );
      }
    }

    // Remove member
    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    // TODO: Reassign their personal workspaces or transfer to team

    return NextResponse.json({
      success: true,
      message: isSelf ? 'You have left the team' : 'Member removed successfully',
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
