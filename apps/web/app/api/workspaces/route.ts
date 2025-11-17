/**
 * Workspace Management APIs
 * GET /api/workspaces - List user's workspaces
 * POST /api/workspaces - Create new workspace (integrates with Agent)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createWorkspaceSchema } from '@/lib/validations';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';

/**
 * GET /api/workspaces
 * List user's environments/workspaces with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const region = searchParams.get('region');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // Build where clause
    const where: any = {
      userId: payload.id,
    };

    if (status) {
      where.status = status;
    }

    if (region) {
      where.cloudRegion = region;
    }

    // Get environments (workspaces)
    const environments = await prisma.environment.findMany({
      where,
      include: {
        workspace: {
          select: {
            id: true,
            storagePath: true,
            totalSizeMB: true,
          },
        },
      },
      orderBy: {
        [sort]: order,
      },
      take: Math.min(limit, 100),
      skip: offset,
    });

    const total = await prisma.environment.count({ where });

    // Transform environments to match frontend expectations
    const workspaces = environments.map(env => ({
      id: env.id,
      name: env.name,
      status: env.status.toLowerCase(), // Convert STOPPED/RUNNING to stopped/running
      cloudRegion: env.cloudRegion,
      cpuCores: env.cpuCores,
      memoryGB: env.memoryGB,
      storageGB: env.storageGB,
      baseImage: env.baseImage,
      createdAt: env.createdAt,
      updatedAt: env.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      workspaces, // Frontend expects 'workspaces' array
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + environments.length < total,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/workspaces
 * Create new workspace/environment (integrates with Agent API)
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    const body = await request.json();

    // Validate request
    const validation = createWorkspaceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, JSON.stringify(validation.error.issues)),
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check user's workspace quota (example: max 10)
    const existingCount = await prisma.environment.count({
      where: { userId: payload.id },
    });

    if (existingCount >= 10) {
      return NextResponse.json(
        createErrorResponse(402, ErrorCodes.QUOTA_EXCEEDED, 'Maximum workspace limit reached'),
        { status: 402 }
      );
    }

    // Create environment record in database
    // For MVP: Create workspace directly without Agent API integration
    const environment = await prisma.environment.create({
      data: {
        userId: payload.id,
        name: data.name,
        status: 'STOPPED', // Start as STOPPED until Agent API is available
        cloudProvider: 'AZURE',
        cloudRegion: data.cloudRegion,
        cpuCores: data.cpuCores,
        memoryGB: data.memoryGB,
        storageGB: data.storageGB,
        baseImage: data.baseImage,
        ideType: 'VSCODE',
        agentType: 'NONE',
      },
    });

    // TODO: Integrate with Agent API when available
    // For now, return the workspace immediately for frontend testing
    // The user can manually start it later when Agent API is running

    return NextResponse.json(
      {
        success: true,
        data: {
          environment,
          message: 'Workspace created successfully. Start it when ready.',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}

