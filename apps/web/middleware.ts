import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/signin", "/signup"];

// Define protected routes that require authentication
const PROTECTED_ROUTES = ["/"]; // Protect all routes except those in PUBLIC_ROUTES

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  
  // Get the token using next-auth/jwt which works with Edge Runtime
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route),
  );

  // Check if current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route),
  );

  // Redirect to sign-in if accessing protected route without authentication
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/signin", nextUrl));
  }

  // Redirect to dashboard if logged in user tries to access auth pages
  if (
    isLoggedIn &&
    (nextUrl.pathname === "/signin" || nextUrl.pathname === "/signup")
  ) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
