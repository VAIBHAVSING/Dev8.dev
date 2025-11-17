/**
 * GET /api/users/me
 * Get authenticated user's complete profile with usage stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const payload = await requireAuth(request);

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.USER_NOT_FOUND, 'User not found'),
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });

  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * PATCH /api/users/me
 * Update authenticated user's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const payload = await requireAuth(request);

    const body = await request.json();
    
    // Validate request
    const { updateUserSchema: updateProfileSchema } = await import('@/lib/validations');
    const validation = updateProfileSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, JSON.stringify(validation.error.issues)),
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: payload.id },
      data: validation.data,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });

  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * DELETE /api/users/me
 * Delete authenticated user account (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const payload = await requireAuth(request);

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, 'Password required for account deletion'),
        { status: 400 }
      );
    }

    // Get user and verify password
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        createErrorResponse(404, ErrorCodes.USER_NOT_FOUND, 'User not found'),
        { status: 404 }
      );
    }

    const { verifyPassword } = await import('@/lib/jwt');
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      return NextResponse.json(
        createErrorResponse(403, ErrorCodes.INVALID_CREDENTIALS, 'Invalid password'),
        { status: 403 }
      );
    }

    // TODO: Stop all running environments via Agent API
    // TODO: Mark for deletion after grace period

    // For now, just mark email as deleted
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: `deleted_${user.id}@deleted.com`,
        password: null,
        name: 'Deleted User',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}
