/**
 * GET /api/teams/[id]/members
 * List team members
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { inviteMemberSchema } from '@/lib/validations';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';
import { isTeamMember, checkTeamPermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify user is team member
    const isMember = await isTeamMember(payload.id, id);
    if (!isMember) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'You are not a member of this team'),
        { status: 403 }
      );
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: id },
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
        { role: 'desc' },
        { joinedAt: 'asc' },
      ],
      skip: offset,
      take: limit,
    });

    const total = await prisma.teamMember.count({
      where: { teamId: id },
    });

    return NextResponse.json({
      success: true,
      data: {
        members,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/teams/[id]/members
 * Invite user to team
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    // Validate request
    const validation = inviteMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, JSON.stringify(validation.error.issues)),
        { status: 400 }
      );
    }

    // Check permissions
    const canInvite = await checkTeamPermission(payload.id, id, 'member:invite');
    if (!canInvite) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Only team owners and admins can invite members'),
        { status: 403 }
      );
    }

    const { email, role } = validation.data;


    // If email provided, create invitation
    if (email) {
      // Check if user with email exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Check if already a member
        const existingMember = await prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: id,
              userId: existingUser.id,
            },
          },
        });

        if (existingMember) {
          return NextResponse.json(
            createErrorResponse(400, ErrorCodes.CONFLICT, 'User is already a team member'),
            { status: 400 }
          );
        }
      }

      // Create invitation token
      const token = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await prisma.teamInvitation.create({
        data: {
          teamId: id,
          email,
          role: role || 'MEMBER',
          token,
          invitedBy: payload.id,
          expiresAt,
        },
      });

      // TODO: Send invitation email
      // await sendTeamInvitationEmail(email, token, teamName);

      return NextResponse.json(
        {
          success: true,
          message: 'Invitation sent successfully',
          data: {
            invitation: {
              id: invitation.id,
              email: invitation.email,
              role: invitation.role,
              expiresAt: invitation.expiresAt,
            },
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, 'Either email or userId must be provided'),
      { status: 400 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
