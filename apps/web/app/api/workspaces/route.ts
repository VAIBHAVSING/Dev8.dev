/**
 * Workspace Management APIs
 * GET /api/workspaces - List user's workspaces
 * POST /api/workspaces - Create new workspace (integrates with Agent)
 */

import { NextRequest, NextResponse } from 'next/server';
import { EnvironmentStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createWorkspaceSchema } from '@/lib/validations';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';
import {
  isAgentAvailable,
  createEnvironment,
  isAgentIntegrationEnabled,
} from '@/lib/agent';

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
    const where: Prisma.EnvironmentWhereInput = {
      userId: payload.id,
      deletedAt: null,
    };

    if (status) {
      const normalized = status.toUpperCase() as keyof typeof EnvironmentStatus;
      if (EnvironmentStatus[normalized]) {
        where.status = EnvironmentStatus[normalized];
      }
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
      vsCodeUrl: env.vsCodeUrl, // Include VSCode URL for direct access
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

    // Check user's workspace quota (example: max 10 active workspaces)
    const existingCount = await prisma.environment.count({
      where: { 
        userId: payload.id,
        deletedAt: null, // Only count non-deleted workspaces
      },
    });

    if (existingCount >= 10) {
      return NextResponse.json(
        createErrorResponse(402, ErrorCodes.QUOTA_EXCEEDED, 'Maximum workspace limit reached'),
        { status: 402 }
      );
    }

    // Create environment record in database first
    const environment = await prisma.environment.create({
      data: {
        userId: payload.id,
        name: data.name,
        status: 'STOPPED', // Will update to RUNNING if Agent API provisions successfully
        cloudProvider: data.cloudProvider,
        cloudRegion: data.cloudRegion,
        cpuCores: data.cpuCores,
        memoryGB: data.memoryGB,
        storageGB: data.storageGB,
        baseImage: data.baseImage,
        ideType: 'VSCODE',
        agentType: 'NONE', // AI agent type - separate from container provisioning
      },
    });

    // Check if Agent API is available and provision Azure container
    let agentProvisioned = false;
    let provisionError = null;

    if (isAgentIntegrationEnabled()) {
      const agentHealthy = await isAgentAvailable();
      if (!agentHealthy) {
        console.warn('[Agent API] Health probe failed; attempting provisioning anyway.');
      }
      try {
        console.log(`[Agent API] Provisioning workspace ${environment.id} via Agent API...`);
        
        const agentEnvironment = await createEnvironment({
          workspaceId: environment.id,
          name: data.name,
          userId: payload.id,
          cloudProvider: data.cloudProvider,
          cloudRegion: data.cloudRegion,
          cpuCores: data.cpuCores,
          memoryGB: data.memoryGB,
          storageGB: data.storageGB,
          baseImage: data.baseImage,
        });

        console.log(`[Agent API] Successfully provisioned workspace ${environment.id}`);
        console.log(`[Agent API] VSCode URL: ${agentEnvironment.connectionUrls.vscodeWebUrl}`);

        // Update environment with real Azure URLs and container info
        await prisma.environment.update({
          where: { id: environment.id },
          data: {
            vsCodeUrl: agentEnvironment.connectionUrls.vscodeWebUrl,
            sshConnectionString: agentEnvironment.connectionUrls.sshUrl,
            azureFileShareName: agentEnvironment.azureFileShare,
            aciContainerGroupId: agentEnvironment.azureContainerGroup,
            status: 'RUNNING',
          },
        });

        agentProvisioned = true;
      } catch (error) {
        console.error(`[Agent API] Failed to provision workspace ${environment.id}:`, error);
        provisionError = error instanceof Error ? error.message : 'Unknown error';
        // Continue without Agent provisioning - workspace record still exists
      }
    } else {
      console.log('[Agent API] Integration disabled - workspace created without Azure container');
    }

    // Fetch updated environment to return
    const finalEnvironment = await prisma.environment.findUnique({
      where: { id: environment.id },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          environment: finalEnvironment,
          agentProvisioned,
          message: agentProvisioned
            ? 'Workspace created and Azure container provisioned successfully'
            : provisionError
            ? `Workspace created but Agent provisioning failed: ${provisionError}`
            : isAgentIntegrationEnabled()
            ? 'Workspace created. Agent API not reachable - start manually when ready.'
            : 'Workspace created. Agent API is disabled - start manually when ready.',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}

