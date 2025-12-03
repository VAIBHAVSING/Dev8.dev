/**
 * POST /api/teams/invitations/accept
 * Accept team invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';
import { z } from 'zod';

const acceptInvitationSchema = z.object({
  invitationToken: z.string().min(1, 'Invitation token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    const body = await request.json();

    // Validate request
    const validation = acceptInvitationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, JSON.stringify(validation.error.issues)),
        { status: 400 }
      );
    }

    const { invitationToken } = validation.data;

    // Find invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token: invitationToken },
    });

    if (!invitation) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.NOT_FOUND, 'Invalid invitation token'),
        { status: 400 }
      );
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, 'Invitation has expired'),
        { status: 400 }
      );
    }

    // Check if already accepted
    if (invitation.acceptedAt) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.CONFLICT, 'Invitation has already been accepted'),
        { status: 400 }
      );
    }

    // Get user by email from invitation
    const user = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    // Verify the authenticated user matches the invitation email
    if (!user || user.id !== payload.id) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'This invitation is for a different email address'),
        { status: 403 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: invitation.teamId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.CONFLICT, 'You are already a member of this team'),
        { status: 400 }
      );
    }

    // Add user to team and mark invitation as accepted
    const member = await prisma.$transaction(async (tx) => {
      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return await tx.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: user.id,
          role: invitation.role,
        },
        include: {
          team: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        team: {
          id: member.team.id,
          name: member.team.name,
          slug: member.team.slug,
        },
        role: member.role,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
