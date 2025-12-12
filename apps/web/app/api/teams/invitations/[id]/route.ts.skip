/**
 * DELETE /api/teams/invitations/[id]
 * Cancel/decline invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';
import { checkTeamPermission } from '@/lib/permissions';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Invitation not found'),
        { status: 404 }
      );
    }

    // Check if user can cancel (owner/admin of team OR the invited user)
    const user = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    const isInvitedUser = user?.id === payload.id;
    const canInvite = await checkTeamPermission(payload.id, invitation.teamId, 'member:invite');

    if (!isInvitedUser && !canInvite) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'You do not have permission to cancel this invitation'),
        { status: 403 }
      );
    }

    // Delete invitation
    await prisma.teamInvitation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: isInvitedUser ? 'Invitation declined' : 'Invitation cancelled',
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
