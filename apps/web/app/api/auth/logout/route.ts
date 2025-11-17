/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (optional - just for validation)
    await requireAuth(request);

    // In a JWT-based system, logout is typically handled client-side
    // by removing the token. You could optionally implement a token
    // blacklist using Redis here.

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}
