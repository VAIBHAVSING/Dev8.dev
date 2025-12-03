import { getServerSession } from "next-auth/next";
import { createAuthConfig } from "./auth-config";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

// Export auth config for use in route handlers
export const authConfig = createAuthConfig();

// Unified authentication function that supports both NextAuth and JWT Bearer tokens
export async function getAuthUser(req: NextRequest) {
  // Try NextAuth session first
  const session = await getServerSession(authConfig);
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    return user;
  }

  // Try JWT Bearer token
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });
      return user;
    } catch {
      return null;
    }
  }

  return null;
}

// Helper function that requires authentication and returns user or throws error
export async function requireAuth(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
