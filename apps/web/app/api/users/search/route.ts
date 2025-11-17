/**
 * GET /api/users/search
 * Search users by name or email
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError, createErrorResponse, ErrorCodes } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!q || q.length < 2) {
      return NextResponse.json(
        createErrorResponse(400, ErrorCodes.VALIDATION_ERROR, 'Search query must be at least 2 characters'),
        { status: 400 }
      );
    }

    // Search users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      take: Math.min(limit, 100),
      skip: offset,
    });

    // Get total count
    const total = await prisma.user.count({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + users.length < total,
        },
      },
    });

  } catch (error) {
    return handleAPIError(error);
  }
}
