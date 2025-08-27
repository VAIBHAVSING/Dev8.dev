import NextAuth from "next-auth";
import { createAuthConfig } from "./auth-config";

export const { handlers, auth, signIn, signOut } = NextAuth(createAuthConfig());
