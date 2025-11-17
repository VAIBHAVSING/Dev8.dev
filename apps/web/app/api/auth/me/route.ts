/**
 * GET /api/auth/me
 * Get current authenticated user profile
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
