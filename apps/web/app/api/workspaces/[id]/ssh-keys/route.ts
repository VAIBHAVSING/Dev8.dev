/**
 * SSH Key Management for Workspaces
 * GET /api/workspaces/[id]/ssh-keys - List SSH keys
 * POST /api/workspaces/[id]/ssh-keys - Add SSH key
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { addSSHKeySchema } from '@/lib/validations';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';

/**
 * GET /api/workspaces/[id]/ssh-keys
 * List SSH keys for a workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;

    // Verify ownership
    const environment = await prisma.environment.findUnique({
      where: { id },
    });

    if (!environment) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Workspace not found'),
        { status: 404 }
      );
    }

    if (environment.userId !== payload.id) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Access denied'),
        { status: 403 }
      );
    }

    // Get SSH keys
    const sshKeys = await prisma.environmentSSHKey.findMany({
      where: {
        environmentId: id,
      },
      include: {
        sshKey: {
          select: {
            id: true,
            name: true,
            fingerprint: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: sshKeys,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/workspaces/[id]/ssh-keys
 * Add SSH key to a workspace
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
    const validation = addSSHKeySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, JSON.stringify(validation.error.issues)),
        { status: 400 }
      );
    }

    // Verify ownership
    const environment = await prisma.environment.findUnique({
      where: { id },
    });

    if (!environment) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.NOT_FOUND, 'Workspace not found'),
        { status: 404 }
      );
    }

    if (environment.userId !== payload.id) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.FORBIDDEN, 'Access denied'),
        { status: 403 }
      );
    }

    // Create or find SSH key
    const sshKey = await prisma.sSHKey.create({
      data: {
        userId: payload.id,
        name: validation.data.name,
        publicKey: validation.data.publicKey,
        fingerprint: generateFingerprint(validation.data.publicKey),
        keyType: detectKeyType(validation.data.publicKey),
      },
    });

    // Link to environment
    const envSSHKey = await prisma.environmentSSHKey.create({
      data: {
        environmentId: id,
        sshKeyId: sshKey.id,
      },
      include: {
        sshKey: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: envSSHKey,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}

// Helper functions
function generateFingerprint(publicKey: string): string {
  // Simple fingerprint generation (in production, use proper SSH fingerprint calculation)
  return Buffer.from(publicKey).toString('base64').substring(0, 32);
}

function detectKeyType(publicKey: string): string {
  if (publicKey.startsWith('ssh-rsa')) return 'RSA';
  if (publicKey.startsWith('ssh-ed25519')) return 'ED25519';
  if (publicKey.startsWith('ecdsa-sha2')) return 'ECDSA';
  return 'UNKNOWN';
}
