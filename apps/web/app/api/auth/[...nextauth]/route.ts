import NextAuth from "next-auth";
import { createAuthConfig } from "../../../../lib/auth-config";

const handler = NextAuth(createAuthConfig());

export { handler as GET, handler as POST };
