/**
 * GET /api/users/me/usage
 * Get usage statistics for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const payload = await requireAuth(request);

    // Get usage stats
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        environments: {
          select: {
            id: true,
            status: true,
            cpuCores: true,
            memoryGB: true,
            storageGB: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.USER_NOT_FOUND, 'User not found'),
        { status: 404 }
      );
    }

    // Calculate usage
    const totalEnvironments = user.environments.length;
    const runningEnvironments = user.environments.filter(e => e.status === 'RUNNING').length;
    const stoppedEnvironments = user.environments.filter(e => e.status === 'STOPPED').length;
    
    // Calculate total resources used
    const totalCPU = user.environments.reduce((sum, env) => sum + env.cpuCores, 0);
    const totalMemory = user.environments.reduce((sum, env) => sum + env.memoryGB, 0);
    const totalStorage = user.environments.reduce((sum, env) => sum + env.storageGB, 0);

    return NextResponse.json({
      success: true,
      data: {
        usage: {
          totalEnvironments,
          runningEnvironments,
          stoppedEnvironments,
          totalCPUCores: totalCPU,
          totalMemoryGB: totalMemory,
          totalStorageGB: totalStorage,
        },
        limits: {
          maxEnvironments: 10, // TODO: Get from subscription
          maxCPUPerEnvironment: 4,
          maxMemoryPerEnvironment: 16,
          maxStoragePerEnvironment: 100,
        },
      },
    });

  } catch (error) {
    return handleAPIError(error);
  }
}
