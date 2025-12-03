import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { createAuthConfig } from "@/lib/auth-config";

type Conn = { provider: string; connected: boolean; available: boolean };

export async function GET() {
  try {
    // Determine provider availability from env
    const googleAvailable = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
    const githubAvailable = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

  // Derive connections for the signed-in user from the Accounts table (if signed in)
  const session = await getServerSession(createAuthConfig());

    let connected = new Set<string>();
    if (session?.user?.id) {
      try {
        const accounts = await prisma.account.findMany({
          where: { userId: session.user.id },
          select: { provider: true },
        });
        connected = new Set(accounts.map((a) => a.provider.toLowerCase()));
      } catch (e) {
        console.error("/api/account/connections prisma error", e);
      }
    }

    const providers: Conn[] = [
      { provider: "Google", connected: connected.has("google"), available: googleAvailable },
      { provider: "GitHub", connected: connected.has("github"), available: githubAvailable },
    ];

    return NextResponse.json({ connections: providers, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("/api/account/connections route error", e);
    // Always return JSON to avoid client JSON parsing errors
    return NextResponse.json(
      { connections: [], error: "failed_to_load_connections" },
      { status: 500 },
    );
  }
}
