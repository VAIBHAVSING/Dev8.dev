/**
 * GET /api/teams/[id]/workspaces
 * List team workspaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';
import { isTeamMember } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify user is team member
    const isMember = await isTeamMember(payload.id, id);
    if (!isMember) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'You are not a member of this team'),
        { status: 403 }
      );
    }

    const where: any = {
      teamId: id,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const environments = await prisma.environment.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    const total = await prisma.environment.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        workspaces: environments,
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
