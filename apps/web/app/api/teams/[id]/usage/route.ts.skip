/**
 * GET /api/teams/[id]/usage
 * Get team usage statistics
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

    // Verify user is team member
    const isMember = await isTeamMember(payload.id, id);
    if (!isMember) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'You are not a member of this team'),
        { status: 403 }
      );
    }

    // Get workspace counts
    const totalWorkspaces = await prisma.environment.count({
      where: { teamId: id, deletedAt: null },
    });

    const activeWorkspaces = await prisma.environment.count({
      where: {
        teamId: id,
        status: { in: ['RUNNING', 'STARTING'] },
        deletedAt: null,
      },
    });

    const stoppedWorkspaces = await prisma.environment.count({
      where: {
        teamId: id,
        status: 'STOPPED',
        deletedAt: null,
      },
    });

    // Get usage for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const resourceUsage = await prisma.resourceUsage.aggregate({
      where: {
        environment: {
          teamId: id,
        },
        timestamp: {
          gte: startOfMonth,
        },
      },
      _sum: {
        costAmount: true,
        diskUsageMB: true,
      },
    });

    // Get per-member breakdown
    const members = await prisma.teamMember.findMany({
      where: { teamId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const perMemberStats = await Promise.all(
      members.map(async (member) => {
        const workspaceCount = await prisma.environment.count({
          where: {
            teamId: id,
            userId: member.userId,
            deletedAt: null,
          },
        });

        const usage = await prisma.resourceUsage.aggregate({
          where: {
            environment: {
              teamId: id,
              userId: member.userId,
            },
            timestamp: {
              gte: startOfMonth,
            },
          },
          _sum: {
            costAmount: true,
            diskUsageMB: true,
          },
        });

        return {
          userId: member.userId,
          userName: member.user.name || member.user.email,
          workspaces: workspaceCount,
          computeCost: usage._sum.costAmount || 0,
          storageGB: Math.round((usage._sum.diskUsageMB || 0) / 1024),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        usage: {
          workspaces: {
            total: totalWorkspaces,
            active: activeWorkspaces,
            stopped: stoppedWorkspaces,
          },
          compute: {
            costThisMonth: resourceUsage._sum.costAmount || 0,
          },
          storage: {
            usedGB: Math.round((resourceUsage._sum.diskUsageMB || 0) / 1024),
            costThisMonth: Math.round(((resourceUsage._sum.diskUsageMB || 0) / 1024) * 0.10), // $0.10 per GB
          },
          perMember: perMemberStats,
        },
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
