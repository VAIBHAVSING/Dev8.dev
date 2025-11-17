/**
 * GET /api/teams/[id]/activity
 * Get team activity logs
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
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
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

    const where: any = {
      environment: {
        teamId: id,
      },
    };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const activities = await prisma.resourceUsage.findMany({
      where,
      include: {
        environment: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: limit,
    });

    const total = await prisma.resourceUsage.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        activities,
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
