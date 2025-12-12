/**
 * POST /api/teams/[id]/transfer-ownership
 * Transfer team ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';
import { isTeamOwner } from '@/lib/permissions';
import { z } from 'zod';

const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, 'New owner ID is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    // Validate request
    const validation = transferOwnershipSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, JSON.stringify(validation.error.issues)),
        { status: 400 }
      );
    }

    // Check permissions (only current OWNER)
    const isOwner = await isTeamOwner(payload.id, id);
    if (!isOwner) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Only the current owner can transfer ownership'),
        { status: 403 }
      );
    }

    const { newOwnerId } = validation.data;

    // Verify new owner is a team member
    const newOwnerMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId: newOwnerId,
        },
      },
    });

    if (!newOwnerMember) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, 'Target user is not a team member'),
        { status: 400 }
      );
    }

    // Perform ownership transfer in a transaction
    await prisma.$transaction([
      // New owner becomes OWNER
      prisma.teamMember.update({
        where: { id: newOwnerMember.id },
        data: { role: 'OWNER' },
      }),
      // Previous owner becomes ADMIN
      prisma.teamMember.updateMany({
        where: {
          teamId: id,
          userId: payload.id,
        },
        data: { role: 'ADMIN' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Ownership transferred successfully',
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
