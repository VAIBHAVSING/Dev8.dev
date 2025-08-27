import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { signInSchema } from "./zod";

/**
 * Shared NextAuth configuration factory
 * This ensures DRY principles and consistency between auth.ts and route.ts
 */
export function createAuthConfig(): any {
  const providers = [];

  // Only add Google provider if credentials are available
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        authorization: { params: { access_type: "offline", prompt: "consent" } },
      })
    );
  }

  // Only add GitHub provider if credentials are available
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push(
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
      })
    );
  }

  // Always add credentials provider for email/password auth
  providers.push(
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = await signInSchema.parseAsync(credentials);

          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) {
            throw new Error("Invalid credentials.");
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password);

          if (!isValidPassword) {
            throw new Error("Invalid credentials.");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch {
          return null;
        }
      },
    })
  );

  return {
    adapter: PrismaAdapter(prisma),
    session: {
      strategy: "jwt" as const,
    },
    providers,
    callbacks: {
      async jwt({ token, user }: { token: any; user: any }) {
        if (user) {
          token.id = user.id;
        }
        return token;
      },
      async session({ session, token }: { session: any; token: any }) {
        if (token && session.user) {
          session.user.id = token.id as string;
        }
        return session;
      },
      async signIn({ account, profile }: { account: any; profile?: any }) {
        if (account?.provider === "google" && profile) {
          return (profile as { email_verified?: boolean })?.email_verified === true;
        }
        if (account?.provider === "github") {
          return true;
        }
        return true;
      },
    },
    pages: {
      signIn: "/signin",
    },
    secret: (() => {
      if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
        throw new Error("AUTH_SECRET must be set in production environments.");
      }
      return process.env.AUTH_SECRET || "development-secret";
    })(),
  };
}
